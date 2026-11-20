const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const key='rex-home-planner-v1',queue='rex-dashboard-cloud-v2';
const flags={storage:'d1',schemaVersion:3,supportedKinds:['pte','focus','abandoned','countdown','checkin','planner'],plannerLists:true,plannerDeadlines:true,plannerCompletionTimes:true};
const task={id:'a',title:'Original',date:'2026-11-20',done:false};
const flush=async()=>{for(let i=0;i<15;i++)await new Promise(r=>setImmediate(r))};
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:()=>resolve()}};
function boot(memory,remote,locks){
 const dom=new JSDOM('<input id="cloudOrigin"><input id="cloudToken"><button id="cloudConnect"></button><button id="cloudDisconnect"></button><button id="cloudSyncNow"></button><p id="cloudStatus"></p>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window,timers=new Map();let next=0,failStatus=0,hold=null,posts=0;
 const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};Object.defineProperty(w,'localStorage',{value:storage});
 if(locks)Object.defineProperty(w.navigator,'locks',{value:locks});w.AbortSignal.timeout=()=>new w.AbortController().signal;
 w.setTimeout=(fn,delay)=>{timers.set(++next,{fn,delay});return next};w.clearTimeout=id=>timers.delete(id);w.setInterval=()=>1;
 w.fetch=async(url,options)=>{
  if(failStatus) return {ok:false,status:failStatus,json:async()=>({error:failStatus===401?'Invalid sync key':'temporary failure'})};
  if(options.method==='GET'){const records=structuredClone([...remote.values()]);if(hold)await hold.promise;return {ok:true,status:200,json:async()=>({...flags,records})}}
  posts++;const sent=JSON.parse(options.body),id=sent.kind+'|'+sent.id,current=remote.get(id);
  if(current&&current.revision!==sent.baseRevision)return {ok:false,status:409,json:async()=>({record:current})};
  const record={...sent,revision:(current?.revision||0)+1};remote.set(id,record);return {ok:true,status:200,json:async()=>({record})};
 };
 for(const file of ['dashboard-store.js','cloud-sync.js'])w.eval(fs.readFileSync(file,'utf8'));
 return {w,memory,remote,timers,status:()=>w.document.getElementById('cloudStatus').textContent,posts:()=>posts,
  sync:()=>{w.document.getElementById('cloudSyncNow').click();return flush()},hold(value){hold=value},fail(status){failStatus=status},close:()=>w.close()};
}
function memory(){return new Map([['rex-cloud-origin','https://sync.test'],['rex-cloud-token','test'],[key,JSON.stringify({tasks:[task],habits:[]})]])}
(async()=>{
 {
  const app=boot(memory(),new Map());try{await app.sync();const gate=deferred();app.hold(gate);const syncing=app.sync();await flush();const local=JSON.parse(app.memory.get(key));local.tasks[0].title='Changed while GET waited';app.memory.set(key,JSON.stringify(local));app.w.dispatchEvent(new app.w.StorageEvent('storage',{key}));gate.resolve();await syncing;await flush();assert.equal(JSON.parse(app.memory.get(key)).tasks[0].title,'Changed while GET waited');assert.equal(app.remote.get('planner|task:a').data.value.title,'Changed while GET waited');}finally{app.close()}
 }
 {
  const app=boot(memory(),new Map());try{await app.sync();const remote=app.remote.get('planner|task:a');remote.data.value.title='Phone version';remote.revision++;
   const local=JSON.parse(app.memory.get(key));local.tasks[0].title='Computer version';app.memory.set(key,JSON.stringify(local));await app.sync();
   assert.equal(JSON.parse(app.memory.get(key)).tasks[0].title,'Computer version');assert(JSON.parse(app.memory.get(queue)).pending['planner|task:a'].conflict);assert.match(app.status(),/need your choice/);
   const keep=[...app.w.document.querySelectorAll('#cloudConflicts button')].find(b=>b.textContent==='Keep my version');keep.click();await flush();await app.sync();assert.equal(app.remote.get('planner|task:a').data.value.title,'Computer version');
   remote.data.value.title='Obsolete pointer';const current=app.remote.get('planner|task:a');current.data.value.title='Phone again';current.revision++;local.tasks[0].title='Computer again';app.memory.set(key,JSON.stringify(local));await app.sync();[...app.w.document.querySelectorAll('#cloudConflicts button')].find(b=>b.textContent==='Use D1 version').click();await flush();assert.equal(JSON.parse(app.memory.get(key)).tasks[0].title,'Phone again');
  }finally{app.close()}
 }
 {
  const app=boot(memory(),new Map());try{app.fail(503);await app.sync();assert.match(app.status(),/Retrying in 2s/);assert([...app.timers.values()].some(t=>t.delay===2000));assert(Object.keys(JSON.parse(app.memory.get(queue)).pending).length);app.fail(0);const retry=[...app.timers.values()].find(t=>t.delay===2000);retry.fn();await flush();assert.match(app.status(),/Synced to D1/);
   app.fail(401);await app.sync();const count=app.timers.size;assert.match(app.status(),/Sync stopped/);app.w.dispatchEvent(new app.w.Event('online'));assert.equal(app.timers.size,count);assert(!/Synced to D1/.test(app.status()));
  }finally{app.close()}
 }
 {
  const shared=memory(),remote=new Map();let chain=Promise.resolve(),running=0,max=0;
  const locks={request(name,action){const job=chain.then(async()=>{running++;max=Math.max(max,running);try{return await action()}finally{running--}});chain=job.catch(()=>{});return job}};
  const a=boot(shared,remote,locks),b=boot(shared,remote,locks);try{await Promise.all([a.sync(),b.sync()]);assert.equal(max,1);assert.equal(a.posts()+b.posts(),1);assert.equal(remote.size,1)}finally{a.close();b.close()}
 }
 {
  const app=boot(memory(),new Map());try{
   const fetch=app.w.fetch;let lost=true;app.w.fetch=async(...args)=>{const result=await fetch(...args);if(args[1].method==='POST'&&lost){lost=false;throw new app.w.TypeError('Failed to fetch')}return result};
   await app.sync();assert.equal(app.posts(),1);assert(Object.keys(JSON.parse(app.memory.get(queue)).pending).length);await app.sync();assert.equal(app.posts(),1);assert.equal(Object.keys(JSON.parse(app.memory.get(queue)).pending).length,0);
  }finally{app.close()}
 }
 {
  const app=boot(memory(),new Map());try{
   await app.sync();const gate=deferred(),fetch=app.w.fetch;let waiting=false;
   app.w.fetch=async(...args)=>{const result=await fetch(...args);if(args[1].method==='POST'){waiting=true;await gate.promise}return result};
   const local=JSON.parse(app.memory.get(key));local.tasks[0].title='First edit';app.memory.set(key,JSON.stringify(local));const syncing=app.sync();await flush();assert(waiting);
   local.tasks[0].title='New edit while POST waited';app.memory.set(key,JSON.stringify(local));gate.resolve();await syncing;await flush();assert.equal(JSON.parse(app.memory.get(key)).tasks[0].title,'New edit while POST waited');
   app.w.fetch=fetch;await app.sync();assert.equal(app.remote.get('planner|task:a').data.value.title,'New edit while POST waited');assert.equal(Object.keys(JSON.parse(app.memory.get(queue)).pending).length,0);
  }finally{app.close()}
 }
 console.log('PASS: edits during GET survive, conflicts preserve both versions with resolution, retry backoff, auth stop cross-tab lock coordination, lost acknowledgements and edits during POST');
})().catch(e=>{console.error(e);process.exitCode=1});
