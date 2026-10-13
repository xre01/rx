'use strict';
const CACHE='rex-focus-offline-v147';
const FONT_CACHE='rex-public-fonts-v1';
const ROOT=new URL('./',self.location.href);
const HOME=new URL('index.html',ROOT).href;
const CORE=[
 'index.html','manifest.webmanifest','focus-icon.svg',
 'sanctuary-ui.css?v=10','fantasy-dashboard.css?v=unified-assets-94',
 'avatar-design.js','avatar.js','cloud-sync.js','pte.js?v=module-counts-85',
 'themes.js?v=soft-wings-84','daily-overview.js?v=dashboard-2',
 'dashboard-layout.js?v=soft-wings-84','hero-tasks.js?v=responsive-12',
 'weekly-calendar.js?v=soft-wings-84','pendant-position.js',
 'page-unlock.js?v=login-restored-66','compact-dashboard.js?v=7',
 'remember-archive.js?v=1','unified-sanctuary.png','avatar-3d.png',
 'crystal-pendant.png?v=full-34'
].map(path=>new URL(path,ROOT).href);
const ASSETS=new Set(CORE);
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('rex-focus-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||request.headers.has('X-Arcane-Key'))return;
 // Cache only public font resources, never remote APIs or personal attachments.
 if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
  event.respondWith(caches.open(FONT_CACHE).then(async cache=>{
   const cached=await cache.match(request);if(cached)return cached;
   const response=await fetch(request);if(response.ok||response.type==='opaque')event.waitUntil(cache.put(request,response.clone()));return response;
  }));return;
 }
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{const response=await fetch(request);if(!response.ok)throw new Error('Page unavailable');if(url.pathname===ROOT.pathname||url.pathname===new URL(HOME).pathname){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(HOME,copy)))}return response}
   catch{const cached=await caches.open(CACHE).then(cache=>cache.match(HOME));return cached||new Response('离线缓存尚未准备好。请联网打开页面一次，再离线使用。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})}
  })());return;
 }
 if(!ASSETS.has(url.href))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(request);if(cached)return cached;
  const response=await fetch(request);if(response.ok)event.waitUntil(cache.put(request,response.clone()));return response;
 }));
});
