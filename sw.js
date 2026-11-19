'use strict';
importScripts('focus-push-sw.js?v=c57e0e750890');
const CACHE='rex-focus-offline-b9b8f9f35b6fcf38';
const ROOT=new URL('./',self.location.href),HOME=new URL('index.html',ROOT).href;
const CORE=["assets/pokemon-nav-ball.svg","assets/pokemon-nav-hoenn-ribbon.png","assets/pokemon-nav-pikachu.png","assets/pokemon-nav-ash-cutout.png","assets/christmas-nav-v1.png","assets/halloween-nav-v1.png","assets/newyear-nav-v1.png","assets/spring-nav-v1.png","assets/winter-nav-v1.png","reflection-cloud.js?v=875ba0d5febb","home-reflection.js?v=7cb69d0832f7","voice-memos.js?v=474a30f02c34","theme-ui.js?v=3380faa2259c","calendar-labels.js?v=2d854f7fa777","pte-night-reminder.js?v=bba104517663","assets/habit-morpeko-full-clear.png","assets/habit-morpeko-hangry-clear.png","assets/habit-keldeo-clear.png","calm-ui.js?v=c85088826aa7","home-page.js?v=d0b4ca24f7bd","sanctuary-presentation.js?v=89fe24ea1feb","assets/sanctuary-landscape.webp","assets/motivation-completed.webp","assets/motivation-focus.webp","assets/motivation-countdown.webp","assets/motivation-study.webp","reading-document.js?v=daa3e08ab132","reading-editor.js?v=19b6046a341a","reading-focus.js?v=a6d12c5ea996","focus-push-sw.js?v=c57e0e750890","focus-push-store.js?v=1b8e79a3a054","focus-push.js?v=26de72e6db9e","rich-doc.js?v=33cdbef064c5","rich-codec.js?v=4ce4ee8c6b04","rich-editor.js?v=5db2eb00916a","reading.js?v=3bb1e41f91d9","dashboard-export.js?v=660292adb3e2","weekly-review.js?v=6d1e3fad9e72","progress-motion.js?v=26a371db7d20","ui-motion.js?v=1f3a82e020ab","speaking-backfill.js?v=fe4438904a9a","index.html","manifest.webmanifest?v=20261111-calm1","rex-wing-apple-180.png?v=20261019-wing1","rex-wing-favicon-32.png?v=20261019-wing1","app-fix-20261112.css?v=1fe7f25b8d1b","notion-reconcile.js?v=a0f22355cfb0","notion-archive.js?v=c5bf428b0556","profile-menu.js?v=4013f88e7286","focus-timer.js?v=1a14275f8989","offline.js?v=7b840a85b29d","avatar.js?v=75fc09814e7c","study-makeup.js?v=76ed0e034d62","dashboard-store.js?v=1b3838f854d7","cloud-sync.js?v=a3d2ad6b2a8a","attachment-picker.js?v=151a7d91b5b9","pte.js?v=6e173777ef49","hero-tasks.js?v=117f46a06c61","study-calendar.js?v=3b136de2d761","compact-dashboard.js?v=960cdf0afb11","remember-archive.js?v=474f5e341353","sidebar.js?v=baaf4b47ba54","daily-summary.js?v=ebbc055ac2c6","personal-panel.js?v=3c1d48163f21","metric-layout.js?v=ab3d7d0b7809","profile-portal.js?v=29bb2fddb3c1","rex-wing-192.png?v=20261019-wing1","rex-wing-512.png?v=20261019-wing1","rex-wing.ico?v=20261019-wing1","avatar-3d.webp","depth-menu.js?v=63f2bfaaf07f","rex-celebration.js?v=2427a9895935"].map(path=>new URL(path,ROOT).href),ASSETS=new Set(CORE);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('rex-focus-offline-')&&key!==CACHE).map(key=>caches.delete(key)));
 const current=await caches.open(CACHE);for(const request of await current.keys())if(!ASSETS.has(request.url))await current.delete(request);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||request.headers.has('X-Arcane-Key')||request.headers.has('X-Sync-Key')||url.origin!==ROOT.origin)return;
 if(request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname===new URL(HOME).pathname)){
  event.respondWith(fetch(request).then(response=>{
   if(!response.ok)throw Error('Page unavailable');
   return response;
  }).catch(async()=>await (await caches.open(CACHE)).match(HOME)||new Response('Open this page online once before using it offline.',{status:503})));return;
 }
 if(ASSETS.has(url.href))event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(request)||fetch(request)));
});
