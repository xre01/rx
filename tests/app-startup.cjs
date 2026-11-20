const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM,requestInterceptor,VirtualConsole}=require('jsdom');
const requests=[],errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{
 url:'https://test.invalid/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
 resources:{interceptors:[requestInterceptor(request=>{
  const file=new URL(request.url).pathname.slice(1);requests.push(file);assert(fs.existsSync(file),'Missing startup/feature resource: '+file);
  return new Response(fs.readFileSync(file),{headers:{'Content-Type':file.endsWith('.js')?'application/javascript':'text/css'}});
 })]},
 beforeParse(w){
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.animate=()=>({});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
  w.fetch=async()=>{throw new w.TypeError('offline')};
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:()=>({width:10}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,dGVzdA==';
 }
});
const flush=async()=>{for(let i=0;i<15;i++)await new Promise(resolve=>setImmediate(resolve))};
(async()=>{try{
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));const w=dom.window,d=w.document;
 assert.deepEqual(errors,[]);assert.equal(d.querySelector('.panelview.active').id,'lifeHome');
 assert(!requests.includes('reading-editor.js'));assert(!requests.includes('dashboard-export.js'));
 d.querySelector('[data-side-view=reading]').click();assert.equal(d.querySelector('.panelview.active').id,'reading');
 d.querySelector('.reading-action-group button').click();await flush();assert(d.querySelector('.reading-edit-dialog'));assert(requests.includes('reading-editor.js'));d.querySelector('.reading-dialog').close();
 d.querySelector('[data-side-view=home]').click();d.querySelector('.dashboard-export').click();await flush();assert(d.querySelector('#dashboardExport').open);assert(requests.includes('dashboard-export.js'));d.querySelector('.export-close').click();
 w.RexFocusTimer.open('home');assert.equal(d.getElementById('focusOverlay').hidden,false);d.querySelector('.focus-close').click();assert.equal(d.getElementById('focusOverlay').hidden,true);
 d.getElementById('profileToggle').click();assert.equal(d.getElementById('profilePopover').hidden,false);assert(d.getElementById('profilePopover').contains(d.getElementById('archives')));
 assert.deepEqual(errors,[]);
 console.log('PASS: full deferred HTML boot, Home/Reading/PTE navigation and profile connections, first-use editor/export and focus dialog without script errors');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
