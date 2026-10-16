'use strict';
const CACHE='rex-focus-offline-2026-10-16-mint-feather-3';
const ROOT=new URL('./',self.location.href),HOME=new URL('index.html',ROOT).href;
const CORE=["manifest.webmanifest?v=dd1d5484746f","apple-touch-icon-rex.png","favicon-rex.png","styles.css?v=fcaa514c6189","archive.css?v=373521da955b","effects-performance.css?v=800ffe7a4d5d","unified-theme.css?v=80ebf3f60991","notion-reconcile.js?v=a0f22355cfb0","notion-archive.js?v=f995fa68af2e","profile-menu.js?v=9dd853622098","focus-timer.js?v=4657ede84cce","offline.js?v=2b446eb62c0c","avatar.js?v=0272ab34b2b7","dashboard-store.js?v=290373ef8082","profile-progress.js?v=e86fba7124f7","cloud-sync.js?v=86b28e45afc6","attachment-picker.js?v=151a7d91b5b9","pte.js?v=1b1a897764b3","hero-tasks.js?v=df8ad1fd2027","study-calendar.js?v=4d8154e47a39","compact-dashboard.js?v=8b842b05389c","remember-archive.js?v=3faa0eb6ff3a","sidebar.js?v=8f4bb1d4a772","feather-flow.js?v=4a9974682351","daily-summary.js?v=c03fff1e45e9","index.html","avatar-3d.webp","rex-icon-192.png","rex-icon-512.png"].map(path=>new URL(path,ROOT).href),ASSETS=new Set(CORE);
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
