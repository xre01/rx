'use strict';
importScripts('focus-push-sw.js?v=20261019-push1');
const CACHE='rex-focus-offline-20261019-focusxp1';
const ROOT=new URL('./',self.location.href),HOME=new URL('index.html',ROOT).href;
const CORE=["focus-xp.js?v=20261019-focusxp1","focus-push-sw.js?v=20261019-push1","focus-push-store.js?v=20261019-push1","focus-push.js?v=20261019-push3","focus-push.css?v=20261019-push1","rich-doc.js?v=20261019-rich1","rich-codec.js?v=20261019-rich1","rich-editor.js?v=20261019-editor2","rich-editor.css?v=20261019-editor2","champagne-title.css?v=20261018-final","reading-xp.js?v=20261018-reading-xp1","reading.js?v=20261019-rich1","reading.css?v=20261018-reading-1","dashboard-export.js?v=55f8d4468563","weekly-review.js?v=346b8478b086","progress-motion.js?v=26a371db7d20","ui-motion.js?v=a4771f8c16dd","feather-flow.js?v=4a9974682351","speaking-backfill.js?v=20261019-rich1","index.html","manifest.webmanifest?v=48785e853c01","apple-touch-icon-rex.png?v=18f3c2aacd1c","favicon-rex.png?v=18f3c2aacd1c","app.css?v=20261018-supreme1","notion-reconcile.js?v=a0f22355cfb0","notion-archive.js?v=20261019-rich1","profile-menu.js?v=9dd853622098","focus-timer.js?v=20261019-push1","offline.js?v=20261019-rich1","avatar.js?v=0272ab34b2b7","study-makeup.js?v=76ed0e034d62","dashboard-store.js?v=601d1f441c94","profile-progress.js?v=20261018-champagne-final","cloud-sync.js?v=86b28e45afc6","attachment-picker.js?v=151a7d91b5b9","pte.js?v=20261019-rich1","hero-tasks.js?v=20261019-cleanup1","study-calendar.js?v=a31f606b29f7","compact-dashboard.js?v=acbb4dd11c82","remember-archive.js?v=3faa0eb6ff3a","sidebar.js?v=383bd61bc37c","daily-summary.js?v=20261019-cleanup1","personal-panel.js?v=44d24a5f16d0","metric-layout.js?v=ab3d7d0b7809","profile-portal.js?v=7a2d32e985bc","rex-icon-192.png?v=18f3c2aacd1c","rex-icon-512.png?v=18f3c2aacd1c","rex-icon-maskable-512.png?v=18f3c2aacd1c","avatar-3d.webp"].map(path=>new URL(path,ROOT).href),ASSETS=new Set(CORE);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('rex-focus-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
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
