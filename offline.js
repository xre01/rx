(()=>{
'use strict';
const el=document.getElementById('focusOffline');let coreReady=false,ready=false,worker;
function update(){
 el.textContent=ready?(navigator.onLine?'Offline ready · Add to your home screen':'Offline · Practice, calendar and timer available · Notion sync requires a connection'):coreReady?'Home and timer available offline · Preparing reading and export…':location.protocol==='file:'?'Local page available offline · Notion sync requires a connection':navigator.onLine?'Preparing offline cache…':'Offline · Cache not confirmed';
}
function fill(){if(navigator.onLine)worker?.postMessage({type:'REX_CACHE_OPTIONAL'})}
update();addEventListener('online',()=>{update();fill()});addEventListener('offline',update);
if('serviceWorker' in navigator&&window.isSecureContext&&location.protocol!=='file:'){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{worker=navigator.serviceWorker.controller;fill()});
 navigator.serviceWorker.addEventListener('message',event=>{
  if(event.data?.type!=='REX_OFFLINE_READY')return;
  ready=event.data.complete;update();
  if(!ready)el.textContent='Home and timer available offline · Connect and reopen to finish caching reading and export';
 });
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(registration=>{
  coreReady=true;worker=registration.active;update();
  const idle=()=>window.requestIdleCallback?window.requestIdleCallback(fill,{timeout:5000}):setTimeout(fill,1500);
  if(document.readyState==='complete')idle();else addEventListener('load',idle,{once:true});
 }).catch(()=>{el.textContent='Offline cache unavailable. Refresh while online.'});
}else if(location.protocol!=='file:')el.textContent='Timer and statistics available · Offline installation requires HTTPS';
})();
