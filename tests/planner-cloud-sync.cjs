const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const worker={schemaVersion:3,supportedKinds:['growth','focus','abandoned','quest','avatar','pte','countdown','checkin','planner']};
function boot(seed={},remote=new Map()){
 const memory=new Map(Object.entries(seed)),events={},nodes={},requests=[];
 const localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
 const add=(name,handler)=>(events[name]??=[]).push(handler);
 const document={hidden:false,getElementById:id=>nodes[id]??={value:'',textContent:'',addEventListener:(name,handler)=>{nodes[id][name]=handler}},addEventListener:add};
 const ctx={console,Date,Intl,JSON,URL,AbortSignal,Event,localStorage,document,navigator:{onLine:true},setTimeout:()=>1,clearTimeout(){},setInterval(){},addEventListener:add,dispatchEvent:event=>{for(const handler of events[event.type]||[])handler(event)},fetch:async(url,options={})=>{
  requests.push(options.method||'GET');
  if(!options.method||options.method==='GET')return {ok:true,status:200,json:async()=>({storage:'d1',...worker,records:[...remote.values()]})};
  const sent=JSON.parse(options.body),key=sent.kind+'|'+sent.id,current=remote.get(key);
  if(current&&(sent.baseRevision||0)!==current.revision)return {ok:false,status:409,json:async()=>({record:current})};
  const record={...sent,revision:(current?.revision||0)+1};remote.set(key,record);
  return {ok:true,status:200,json:async()=>({record})};
 }};
 ctx.window=ctx;vm.createContext(ctx);for(const file of ['dashboard-store.js','cloud-sync.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 return {ctx,localStorage,remote,requests,sync:()=>nodes.cloudSyncNow.click()};
}
const task={id:'task-a',title:'Read',date:'2026-11-12',repeat:'daily',intervalDays:1,weekdays:[],completedDates:{'2026-11-12':true},done:true};
const habit={id:'habit-a',title:'Walk',days:['2026-11-12'],icon:'🌱'};
(async()=>{
 const remote=new Map(),app=boot({'rex-cloud-origin':'https://sync.test','rex-cloud-token':'test','rex-home-planner-v1':JSON.stringify({tasks:[task],habits:[habit]})},remote);
 await app.sync();
 assert.equal(remote.get('planner|task:task-a').data.value.done,true);
 assert.deepEqual(JSON.parse(app.localStorage.getItem('rex-home-planner-v1')).habits,[habit]);
 app.localStorage.setItem('rex-home-planner-v1',JSON.stringify({tasks:[],habits:[habit]}));await app.sync();
 assert.equal(remote.get('planner|task:task-a').deleted,true,'removal becomes a remote tombstone');
 const restored=boot({'rex-cloud-origin':'https://sync.test','rex-cloud-token':'test'},remote);await restored.sync();
 assert.deepEqual(JSON.parse(restored.localStorage.getItem('rex-home-planner-v1')).habits,[habit],'a new device restores habits');
 assert.deepEqual(JSON.parse(restored.localStorage.getItem('rex-home-planner-v1')).tasks,[],'deleted tasks stay deleted');
 const damaged=boot({'rex-cloud-origin':'https://sync.test','rex-cloud-token':'test','rex-home-planner-v1':'broken'},remote);await damaged.sync();
 assert.equal(damaged.localStorage.getItem('rex-home-planner-v1'),'broken','cloud restore preserves unreadable local planner data');
 assert.equal(damaged.requests.filter(method=>method==='POST').length,0,'invalid local planner data is never uploaded');
 console.log('PASS: planner tasks and habits sync, deletions propagate, remote data restores, and unreadable local planner data is preserved');
})().catch(error=>{console.error(error);process.exit(1)});
