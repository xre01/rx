'use strict';
importScripts('focus-push-sw.js?v=79141b292d6d');
const CACHE='rex-focus-offline-381a3c077ce0657f';
const ROOT=new URL('./',self.location.href),HOME=new URL('index.html',ROOT).href;
const CORE=["assets/pokemon-nav-ball.svg","assets/pokemon-nav-hoenn-ribbon.png","assets/pokemon-nav-pikachu.png","assets/pokemon-nav-ash-cutout.png","reflection-cloud.js?v=c854d7f1d6cb","home-reflection.js?v=b08ed11ea71f","voice-memos.js?v=474a30f02c34","theme-ui.js?v=3380faa2259c","calendar-labels.js?v=2d854f7fa777","pte-night-reminder.js?v=bba104517663","assets/habit-morpeko-full-clear.png","assets/habit-morpeko-hangry-clear.png","assets/habit-keldeo-clear.png","calm-ui.js?v=c85088826aa7","home-page.js?v=41c1fc32b065","sanctuary-presentation.js?v=89fe24ea1feb","assets/sanctuary-landscape.webp","assets/motivation-completed.webp","assets/motivation-focus.webp","assets/motivation-countdown.webp","assets/motivation-study.webp","reading-document.js?v=daa3e08ab132","reading-focus.js?v=a6d12c5ea996","focus-push-sw.js?v=79141b292d6d","focus-push-store.js?v=1b8e79a3a054","focus-push.js?v=edfeffcb425c","rich-doc.js?v=33cdbef064c5","rich-codec.js?v=4ce4ee8c6b04","rich-editor.js?v=587151d0db2b","reading.js?v=7f64e000d50a","weekly-review.js?v=6d1e3fad9e72","progress-motion.js?v=26a371db7d20","ui-motion.js?v=1f3a82e020ab","speaking-backfill.js?v=fe4438904a9a","index.html","manifest.webmanifest?v=b6b682d2c757","reva-apple-180.png?v=283ac5c3f215","reva-favicon-32.png?v=928bc687fde8","app.css?v=40603d595100","service-switch.js?v=37cb2022199c","notion-reconcile.js?v=a0f22355cfb0","notion-archive.js?v=743dbdbff86a","profile-menu.js?v=4013f88e7286","focus-timer.js?v=777334428ef9","offline.js?v=fca5e29ddc38","avatar.js?v=75fc09814e7c","study-makeup.js?v=76ed0e034d62","dashboard-store.js?v=1b3838f854d7","cloud-sync.js?v=7b84227d5ed7","attachment-picker.js?v=151a7d91b5b9","pte.js?v=6e173777ef49","hero-tasks.js?v=117f46a06c61","study-calendar.js?v=1cc832b5d8b8","compact-dashboard.js?v=b9e8087d4b43","remember-archive.js?v=474f5e341353","sidebar.js?v=c723a8235e0a","daily-summary.js?v=586c349a7dc5","personal-panel.js?v=3c1d48163f21","metric-layout.js?v=ab3d7d0b7809","profile-portal.js?v=29bb2fddb3c1","reva-icon-192.png?v=32e936739d92","reva-icon-512.png?v=eab678a728fa","reva-maskable-512.png?v=223a8f91f129","reva.ico?v=0a8d55e8c40f","avatar-3d.webp","depth-menu.js?v=63f2bfaaf07f","rex-celebration.js?v=420a7ebfb5d4","asset-loader.js?v=40db846ed1a5","dashboard-export-loader.js?v=c40512c5c406"].map(path=>new URL(path,ROOT).href);
const OPTIONAL=["assets/christmas-nav-v1.png","assets/halloween-nav-v1.png","assets/newyear-nav-v1.png","assets/spring-nav-v1.png","assets/winter-nav-v1.png","reading-editor.js?v=19b6046a341a","dashboard-export.js?v=0294b2363036"].map(path=>new URL(path,ROOT).href),ASSETS=new Set([...CORE,...OPTIONAL]);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('rex-focus-offline-')&&key!==CACHE).map(key=>caches.delete(key)));
 const current=await caches.open(CACHE);for(const request of await current.keys())if(!ASSETS.has(request.url))await current.delete(request);
 await self.clients.claim();
})()));
let optionalCacheJob;
async function cacheOptional(){
 if(optionalCacheJob)return optionalCacheJob;
 optionalCacheJob=(async()=>{
  const cache=await caches.open(CACHE);let complete=true;
  // Fill sequentially after startup to avoid competing with initial rendering.
  for(const url of OPTIONAL){try{if(!await cache.match(url)){const response=await fetch(new Request(url,{cache:'reload'}));if(!response.ok)throw Error('Asset unavailable');await cache.put(url,response)}}catch{complete=false}}
  return complete;
 })();
 try{return await optionalCacheJob}finally{optionalCacheJob=null}
}
self.addEventListener('message',event=>{
 if(event.data?.type!=='REX_CACHE_OPTIONAL')return;
 event.waitUntil(cacheOptional().then(complete=>event.source?.postMessage({type:'REX_OFFLINE_READY',complete})));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||request.headers.has('X-Arcane-Key')||request.headers.has('X-Sync-Key')||url.origin!==ROOT.origin)return;
 if(request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname===new URL(HOME).pathname)){
  event.respondWith(fetch(request).then(response=>{
   if(!response.ok)throw Error('Page unavailable');
   return response;
  }).catch(async()=>await (await caches.open(CACHE)).match(HOME)||new Response('Open this page online once before using it offline.',{status:503})));return;
 }
 if(ASSETS.has(url.href))event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response}));
});
