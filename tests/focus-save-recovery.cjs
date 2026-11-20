const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const history='rex-focus-sessions-v1',active='rex-focus-active-v1';
function boot(seed={}){
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;
 w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.animate=()=>({});w.setInterval=()=>1;w.clearInterval=()=>{};
 for(const [key,value]of Object.entries(seed))w.localStorage.setItem(key,value);
 w.eval(fs.readFileSync('focus-timer.js','utf8'));return {w,dom,doc:w.document};
}
const running=JSON.stringify({mode:'up',running:true,elapsed:0,started:Date.now()-90000,total:1500,activity:'home',goal:'Recover me'});
let seed;
{
 const {w,doc}=boot({[active]:running,[history]:'[]'});let notifications=0;w.addEventListener('rex-local-changed',()=>notifications++);
 const original=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(key,value){if(key===history)throw Error('Quota exceeded');return original.call(this,key,value)};
 try{
  doc.getElementById('focusReset').click();
  assert.match(doc.getElementById('focusStatus').textContent,/Could not save/);
  assert(!/Session saved/.test(doc.getElementById('focusStatus').textContent));
  assert.equal(notifications,0);assert.equal(w.localStorage.getItem(history),'[]');
  assert(doc.getElementById('focusStart').disabled);
  const pending=JSON.parse(w.localStorage.getItem(active)).pendingSession;assert(pending.record.id);assert.equal(pending.record.goal,'Home · Recover me');
  seed=Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const key=w.localStorage.key(i);return [key,w.localStorage.getItem(key)]}));
  const sibling={id:'other-tab',endedAt:Date.now(),seconds:120,mode:'up',goal:'Other tab'};original.call(w.localStorage,history,JSON.stringify([sibling]));
  w.Storage.prototype.setItem=original;
  [...doc.querySelectorAll('button')].find(b=>b.textContent==='Retry save').click();
  const records=JSON.parse(w.localStorage.getItem(history));assert.equal(records.length,2);assert.equal(records[1].id,pending.record.id);assert.equal(notifications,1);
  assert.match(doc.getElementById('focusStatus').textContent,/saved on this device/);assert(!doc.getElementById('focusStart').disabled);
  assert.equal(JSON.parse(w.localStorage.getItem(active)).pendingSession,null);
 }finally{w.Storage.prototype.setItem=original;w.close()}
}
{
 const {w,doc}=boot(seed);try{
  assert.match(doc.getElementById('focusStatus').textContent,/Unsaved session restored/);
  [...doc.querySelectorAll('button')].find(b=>b.textContent==='Retry save').click();
  assert.equal(JSON.parse(w.localStorage.getItem(history)).length,1);
  // A crash after the history write but before timer cleanup must also deduplicate.
  w.localStorage.setItem(active,seed[active]);const next=boot(Object.fromEntries([[active,seed[active]],[history,w.localStorage.getItem(history)]]));
  try{[...next.doc.querySelectorAll('button')].find(b=>b.textContent==='Retry save').click();assert.equal(JSON.parse(next.w.localStorage.getItem(history)).length,1)}finally{next.w.close()}
 }finally{w.close()}
}
{
 const {w,doc}=boot({[active]:running,[history]:'unreadable history'});try{doc.getElementById('focusReset').click();assert.equal(w.localStorage.getItem(history),'unreadable history');assert.match(doc.getElementById('focusStatus').textContent,/Could not save/)}finally{w.close()}
}
console.log('PASS: honest save feedback, quota recovery, cross-tab history preservation, stable IDs, reload recovery and retry deduplication');
