const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const listeners={},notifications=[],now=Date.now();let config={enabled:true,id:'device',key:'secret',pending:{version:1,dueAt:now-1000}},remote={enabled:true,reminder:{...config.pending,status:'sent'}},offline=false,focused=false,message,opened;
const ctx={URL,AbortSignal,Date,importScripts:()=>{},RexFocusPushStore:{read:async()=>structuredClone(config),write:async v=>{config=structuredClone(v);}},fetch:async()=>{if(offline)throw Error('offline');return {ok:true,json:async()=>remote};},self:{location:{href:'https://xre01.github.io/rx/sw.js'},registration:{showNotification:async(t,o)=>notifications.push({t,o})},addEventListener:(n,f)=>listeners[n]=f,clients:{matchAll:async()=>[{url:'https://xre01.github.io/rx/index.html#reading',focus:async()=>{focused=true},postMessage:v=>{message=v}}],openWindow:async u=>opened=u}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('focus-push-sw.js','utf8'),ctx);
async function push(){let p;listeners.push({waitUntil:v=>p=v});await p;}
(async()=>{await push();assert.equal(notifications.length,1);assert.equal(notifications[0].t,'Focus complete');assert.ok(!JSON.stringify(notifications).includes('secret'));await push();assert.equal(notifications.length,1);
 config.pending={version:2,dueAt:null};await push();assert.equal(notifications.length,1);
 config.pending={version:3,dueAt:now-1000,test:true};offline=true;await push();assert.equal(notifications[1].t,'Rex World · Test reminder');
 config.enabled=false;await push();assert.equal(notifications.length,2);
 let p;listeners.notificationclick({notification:{data:{type:'rex-focus'},close:()=>{}},waitUntil:v=>p=v});await p;assert.ok(focused);assert.equal(message.type,'rex-open-focus');assert.equal(opened,undefined);
 console.log('PASS: push display, deduplication, cancelled timer suppression, offline state fallback, notification opens timer');
})().catch(e=>{console.error(e);process.exit(1)});
