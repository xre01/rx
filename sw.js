'use strict';
importScripts('focus-push-sw.js?v=04cb9bcd8839');
const CACHE='rex-focus-offline-20261112-clean3';
const ROOT=new URL('./',self.location.href),HOME=new URL('index.html',ROOT).href;
const CORE=["theme-ui.js?v=a04d389b9c72","calendar-labels.js?v=2d854f7fa777","pte-night-reminder.js?v=49c719ab42f3","assets/habit-morpeko-full-clear.png","assets/habit-morpeko-hangry-clear.png","assets/habit-keldeo-clear.png","calm-ui.js?v=c85088826aa7","home-page.js?v=8b4996aa3db4","sanctuary-presentation.js?v=57c79e8e9289","assets/sanctuary-landscape.webp","assets/motivation-completed.webp","assets/motivation-focus.webp","assets/motivation-countdown.webp","assets/motivation-study.webp","reading-document.js?v=daa3e08ab132","reading-editor.js?v=19b6046a341a","reading-weekly.js?v=d7343f43228b","reading-focus.js?v=b7e6ff2cdee9","focus-xp.js?v=afbcf7678c41","focus-push-sw.js?v=04cb9bcd8839","focus-push-store.js?v=1b8e79a3a054","focus-push.js?v=26de72e6db9e","rich-doc.js?v=33cdbef064c5","rich-codec.js?v=4ce4ee8c6b04","rich-editor.js?v=5db2eb00916a","reading-xp.js?v=1e75821f9219","reading.js?v=e1d2416aef86","dashboard-export.js?v=a7364957af52","weekly-review.js?v=346b8478b086","progress-motion.js?v=26a371db7d20","ui-motion.js?v=a4771f8c16dd","feather-flow.js?v=4a9974682351","speaking-backfill.js?v=3500cbdb6dd1","index.html","manifest.webmanifest?v=20261111-calm1","rex-wing-apple-180.png?v=20261019-wing1","rex-wing-favicon-32.png?v=20261019-wing1","app.css?v=fc41f53a228b","notion-reconcile.js?v=a0f22355cfb0","notion-archive.js?v=885ca76ba6b2","profile-menu.js?v=ef36b6d27e61","focus-timer.js?v=1a14275f8989","offline.js?v=7b840a85b29d","avatar.js?v=0272ab34b2b7","study-makeup.js?v=76ed0e034d62","dashboard-store.js?v=317b96ccff82","profile-progress.js?v=07d3d20a9f9a","cloud-sync.js?v=0a9cd06aa59c","attachment-picker.js?v=151a7d91b5b9","pte.js?v=ed29cfafb270","hero-tasks.js?v=117f46a06c61","study-calendar.js?v=89f09419e6d9","compact-dashboard.js?v=b0dee77ece23","remember-archive.js?v=3faa0eb6ff3a","sidebar.js?v=abd1db03058d","daily-summary.js?v=e9170c0da4b8","personal-panel.js?v=05422ff88b82","metric-layout.js?v=ab3d7d0b7809","profile-portal.js?v=16a03f670cd1","rex-wing-192.png?v=20261019-wing1","rex-wing-512.png?v=20261019-wing1","rex-wing.ico?v=20261019-wing1","avatar-3d.webp","depth-menu.js?v=6babf3c2021a","rex-celebration.js?v=2427a9895935"].map(path=>new URL(path,ROOT).href),ASSETS=new Set(CORE);
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
