const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r))};
function boot(){
 const dom=new JSDOM('<head></head><body><main></main><nav class="rex-sidebar-nav"><button>Archive</button></nav><div class="dashboard-view-controls"></div></body>',{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,requests=[];
 w.CSS={supports:()=>true};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:10}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,dGVzdA==';
 w.RexDashboardStore={summary:()=>({days:[],counts:[],seconds:0})};
 const append=w.document.head.append.bind(w.document.head);w.document.head.append=node=>{append(node);if(node.tagName==='SCRIPT')requests.push(node)};
 w.localStorage.setItem('rex-reading-library-v1',JSON.stringify([{id:'book',kind:'book',title:'Test book',body:'Saved note',writtenDate:'2026-11-20',logs:[],attachments:[]}]));
 for(const f of ['rich-doc.js','rich-codec.js','rich-editor.js','reading-document.js','asset-loader.js','reading.js','dashboard-export-loader.js'])w.eval(fs.readFileSync(f,'utf8'));
 return {w,doc:w.document,requests,load(script){w.eval(fs.readFileSync(new URL(script.src).pathname.slice(1),'utf8'));script.onload()}};
}
(async()=>{
 const app=boot();try{
  assert.equal(app.requests.length,0);assert.equal(app.w.RexReadingEditor,undefined);assert.equal(app.doc.querySelector('#dashboardExport'),null);
  app.doc.querySelector('.reading-shelf-book').click();app.doc.querySelector('.reading-shelf-book').click();assert.equal(app.requests.length,1);assert.equal(app.doc.querySelector('dialog'),null);
  app.load(app.requests[0]);await flush();assert.equal(app.doc.querySelector('.reading-note-prose').textContent,'Saved note');app.doc.querySelector('dialog').close();
  app.doc.querySelector('.dashboard-export').click();assert.equal(app.requests.length,2);assert(app.doc.querySelector('.dashboard-export').disabled);app.load(app.requests[1]);await flush();assert(app.doc.querySelector('#dashboardExport').open);assert.equal(app.doc.querySelectorAll('.dashboard-export').length,1);app.doc.querySelector('.export-close').click();app.doc.querySelector('.dashboard-export').click();assert(app.doc.querySelector('#dashboardExport').open);assert.equal(app.requests.length,2);
 }finally{app.w.close()}
 const retry=boot();try{
  retry.doc.querySelector('.reading-action-group button').click();retry.requests[0].onerror();await flush();assert.match(retry.doc.querySelector('.reading-panel>[role=status]').textContent,/Could not load/);
  retry.doc.querySelector('.reading-action-group button').click();assert.equal(retry.requests.length,2);retry.load(retry.requests[1]);await flush();assert(retry.doc.querySelector('.reading-edit-dialog'));
 }finally{retry.w.close()}
 console.log('PASS: no editor/export startup requests, lazy readers/editors, one module load per feature, export opening and failed-load retry');
})().catch(e=>{console.error(e);process.exitCode=1});
