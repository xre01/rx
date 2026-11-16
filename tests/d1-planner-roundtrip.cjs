const assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite');
(async()=>{
 const {default:worker}=await import('../workers/sync-worker.mjs');
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec('CREATE TABLE records(kind TEXT,id TEXT,data TEXT,deleted INTEGER,revision INTEGER,PRIMARY KEY(kind,id))');
 const db={prepare(sql){const statement=sqlite.prepare(sql);let args=[];return {
  bind(...values){args=values;return this},
  async all(){return {results:statement.all(...args)}},
  async first(){return statement.get(...args)||null},
  async run(){return {meta:{changes:Number(statement.run(...args).changes)}}}
 }}};
 const env={DB:db,SYNC_KEY:'test-only',ALLOWED_ORIGINS:'https://test.invalid'};
 const call=(record,headers={})=>worker.fetch(new Request('https://sync.test/api/sync',{
  method:record?'POST':'GET',headers:{Origin:'https://test.invalid','X-Sync-Key':'test-only',...headers},
  ...(record?{body:JSON.stringify(record)}:{})
 }),env);
 try{
  assert.equal((await call(null,{'X-Sync-Key':'wrong'})).status,401);
  assert.equal((await call(null,{Origin:'https://other.test'})).status,403);
  const ready=await (await call()).json();
  assert(ready.plannerLists&&ready.plannerDeadlines&&ready.plannerCompletionTimes);
  const record={kind:'planner',id:'task:list-task',baseRevision:0,deleted:false,data:{type:'task',position:0,value:{
   id:'list-task',title:'List task',date:'',done:true,repeat:'none',dueDate:'2026-11-20',dueTime:'18:00',completedAt:1794880800000,
   subtasks:[{id:'child',title:'Child'}],subtaskChecks:{undated:{child:true}}
  }}};
  let response=await call(record);assert.equal(response.status,200);
  const saved=(await response.json()).record;assert.equal(saved.revision,1);assert.deepEqual(saved.data,record.data);
  assert.deepEqual((await (await call()).json()).records[0],saved);
  const changed=structuredClone(record);changed.baseRevision=1;changed.data.value.done=false;delete changed.data.value.completedAt;changed.data.value.subtaskChecks.undated.child=false;
  response=await call(changed);assert.equal(response.status,200);assert.equal((await response.json()).record.revision,2);
  response=await call({...record,baseRevision:1});assert.equal(response.status,409);assert.equal((await response.json()).record.data.value.done,false);
  response=await call({...record,baseRevision:2,deleted:true,data:{}});assert.equal(response.status,200);assert.equal((await response.json()).record.deleted,true);
  const bad=structuredClone(record);bad.id='task:bad';bad.data.value.id='bad';bad.data.value.dueDate='2026-02-30';assert.equal((await call(bad)).status,400);
  const legacy={kind:'focus',id:'focus-session',baseRevision:0,deleted:false,data:{endedAt:1794880800000,seconds:1500,mode:'down',goal:'Reading'}};
  assert.equal((await call(legacy)).status,200);
  assert.equal((await (await call()).json()).records.length,2);
  console.log('PASS: real SQL planner roundtrip, capability flags, date/time/history validation, revisions, stale edits, deletion and legacy focus');
 }finally{sqlite.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
