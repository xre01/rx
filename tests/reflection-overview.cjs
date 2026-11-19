const assert=require('node:assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
async function check(saved,expected=saved?.note||''){
 const dom=new JSDOM('<div class="daily-reflection-host"></div><input id="gateway" value="https://test.invalid"><input id="arcanePassword" value="test">',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;let sent;
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 const records=new Map();
 w.indexedDB={open(){const req={};queueMicrotask(()=>{req.result={transaction(){const tx={objectStore(){return {get(){const r={};queueMicrotask(()=>{r.result=saved;r.onsuccess?.()});return r},put(v,k){records.set(k,v);queueMicrotask(()=>tx.oncomplete?.())}}}};return tx}};req.onsuccess()});return req}};
 w.RexDashboardStore={summary:()=>({counts:[],sessions:[],seconds:60})};
 w.RexNotionUpload=async(_,__,data)=>{sent=data.get('note');return {ok:true,json:async()=>({url:'https://test.invalid/note'})}};
 try{w.eval(fs.readFileSync('daily-summary.js','utf8'));await new Promise(r=>setTimeout(r,20));const note=w.document.querySelector('textarea');assert.equal(note.value,expected);assert.equal(note.getAttribute('placeholder'),'');if(saved)assert.ok(note.value.endsWith(expected));
 note.value+='\nMy extra reflection';note.dispatchEvent(new w.Event('input'));
 w.RexDashboardStore.summary=()=>({counts:[],sessions:[],seconds:120});w.dispatchEvent(new w.Event('rex-local-changed'));assert.ok(!note.value.includes('Total focus time:'));assert.ok(note.value.endsWith('My extra reflection'));
 await w.document.querySelector('.summary-save').onclick();assert.equal((sent.match(/Daily Study Overview · /g)||[]).length,0);assert.ok(!sent.includes('Completed questions'));assert.ok(!sent.includes('Total focus time'));assert.ok(sent.endsWith('My extra reflection'));
 assert.ok([...records.values()].some(r=>r.note.endsWith('My extra reflection')));
 let ready,failed;w.addEventListener('rex-date-ready',e=>ready=e.detail.date);w.addEventListener('rex-date-switch-failed',e=>failed=e.detail.date);
 w.dispatchEvent(new w.CustomEvent('rex-date-selected',{detail:{date:'2026-10-18'},cancelable:true}));w.dispatchEvent(new w.CustomEvent('rex-date-selected',{detail:{date:'2026-10-19'},cancelable:true}));await new Promise(r=>setTimeout(r,20));assert.equal(ready,'2026-10-18');assert.equal(failed,'2026-10-19');assert.ok([...records.values()].some(r=>r.note.endsWith('My extra reflection')));
 }finally{w.close()}
}
(async()=>{await check();await check({note:'Existing personal draft'});await check({note:'Daily Study Overview · 2026-10-18\n\nCompleted questions: 5\n\nDaily Reflection\n\nKeep my life note'},'Keep my life note');console.log('PASS: empty editor, legacy draft preserved, no automatic insertion and life-only upload without generated study overview')})().catch(e=>{console.error(e);process.exit(1)});
