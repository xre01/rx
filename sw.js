'use strict';
importScripts('focus-push-sw.js?v=73648a0a6560');
const CACHE='rex-focus-offline-20261027-audit1';
const ROOT=new URL('./',self.location.href),HOME=new URL('index.html',ROOT).href;
const CORE=["sanctuary-presentation.js?v=57c79e8e9289","assets/sanctuary-landscape.webp","assets/motivation-completed.webp","assets/motivation-focus.webp","assets/motivation-countdown.webp","assets/motivation-study.webp","reading-document.js?v=daa3e08ab132","reading-editor.js?v=19b6046a341a","reading-weekly.js?v=d7343f43228b","reading-focus.js?v=b7e6ff2cdee9","focus-xp.js?v=afbcf7678c41","focus-push-sw.js?v=73648a0a6560","focus-push-store.js?v=5802dba812dc","focus-push.js?v=535eb64435ab","rich-doc.js?v=33cdbef064c5","rich-codec.js?v=4ce4ee8c6b04","rich-editor.js?v=5db2eb00916a","reading-xp.js?v=1e75821f9219","reading.js?v=3b27b289c99d","dashboard-export.js?v=a7364957af52","weekly-review.js?v=346b8478b086","progress-motion.js?v=26a371db7d20","ui-motion.js?v=a4771f8c16dd","feather-flow.js?v=4a9974682351","speaking-backfill.js?v=3500cbdb6dd1","index.html","manifest.webmanifest?v=20261024-light1","rex-wing-apple-180.png?v=20261019-wing1","rex-wing-favicon-32.png?v=20261019-wing1","app.css?v=db059e2a7688","notion-reconcile.js?v=a0f22355cfb0","notion-archive.js?v=885ca76ba6b2","profile-menu.js?v=9dd853622098","focus-timer.js?v=0279b630e888","offline.js?v=7b840a85b29d","avatar.js?v=0272ab34b2b7","study-makeup.js?v=76ed0e034d62","dashboard-store.js?v=f33607d42323","profile-progress.js?v=07d3d20a9f9a","cloud-sync.js?v=406a3083cb9b","attachment-picker.js?v=151a7d91b5b9","pte.js?v=ed29cfafb270","hero-tasks.js?v=117f46a06c61","study-calendar.js?v=89f09419e6d9","compact-dashboard.js?v=9f757fec3b94","remember-archive.js?v=3faa0eb6ff3a","sidebar.js?v=383bd61bc37c","daily-summary.js?v=8297ffc41da5","personal-panel.js?v=44d24a5f16d0","metric-layout.js?v=ab3d7d0b7809","profile-portal.js?v=7a2d32e985bc","rex-wing-192.png?v=20261019-wing1","rex-wing-512.png?v=20261019-wing1","rex-wing.ico?v=20261019-wing1","avatar-3d.webp","depth-menu.js?v=6babf3c2021a","rex-celebration.js?v=2427a9895935"].map(path=>new URL(path,ROOT).href),ASSETS=new Set(CORE);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
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
   const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(HOME,copy)));return response;
  }).catch(async()=>await caches.match(HOME)||new Response('Open this page online once before using it offline.',{status:503})));return;
 }
 if(ASSETS.has(url.href))event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(request)||fetch(request)));
});
