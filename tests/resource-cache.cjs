const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base='https://xre01.github.io/rx/',listeners={},deleted=[],added=[],entries=new Map(),fetched=[];let unavailable='';
const cache={keys:async()=>[{url:base+'old-preview.js'},{url:base+'cream-theme.css?v=old'},{url:base+'index.html'}],delete:async request=>deleted.push(request.url),
 async addAll(requests){for(const request of requests){assert.equal(request.cache,'reload');added.push(request.url);entries.set(request.url,new Response('cached'))}},
 async match(request){return entries.get(typeof request==='string'?request:request.url)?.clone()},async put(request,response){entries.set(typeof request==='string'?request:request.url,response.clone())}};
const ctx={importScripts(){},URL,Request,Response,fetch:async request=>{const url=typeof request==='string'?request:request.url;fetched.push(url);if(url.includes(unavailable)&&unavailable)throw Error('offline');return new Response('network')},self:{location:{href:base+'sw.js'},addEventListener:(name,handler)=>listeners[name]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{keys:async()=>['rex-focus-offline-old','another-app-cache'],delete:async name=>deleted.push(name),open:async()=>cache}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
async function event(name,details={}){let pending;listeners[name]({...details,waitUntil:job=>pending=job});await pending}
(async()=>{
 await event('install');assert(!added.some(url=>/\/(?:reading-editor|dashboard-export)\.js\?/.test(url)),'heavy modules do not compete with the startup cache');assert(added.some(url=>url.includes('/asset-loader.js?')));assert(added.some(url=>url.includes('/dashboard-export-loader.js?')));
 await event('activate');assert.deepEqual(deleted,['rex-focus-offline-old',base+'old-preview.js',base+'cream-theme.css?v=old']);
 const stylesheet=new URL(fs.readFileSync('index.html','utf8').match(/<link rel="stylesheet" href="([^"]+)"/)[1],base).href;assert(added.includes(stylesheet));assert.equal(added.filter(url=>new URL(url).pathname.endsWith('.css')).length,1);
 let report;unavailable='/reading-editor.js';await event('message',{data:{type:'REX_CACHE_OPTIONAL'},source:{postMessage:value=>report=value}});assert.equal(report.complete,false);assert(added.every(url=>entries.has(url)),'optional failure preserves the working core cache');
 unavailable='';await event('message',{data:{type:'REX_CACHE_OPTIONAL'},source:{postMessage:value=>report=value}});assert.equal(report.complete,true);assert([...entries.keys()].some(url=>url.includes('/reading-editor.js?')));assert([...entries.keys()].some(url=>url.includes('/dashboard-export.js?')));
 const count=fetched.length;await event('message',{data:{type:'REX_CACHE_OPTIONAL'},source:{postMessage(){}}});assert.equal(fetched.length,count,'cached optional assets are not downloaded again');
 for(const headers of [new Headers({'X-Arcane-Key':'test'}),new Headers({'X-Sync-Key':'test'})]){let intercepted=false;listeners.fetch({request:{method:'GET',url:added[0],headers},respondWith:()=>intercepted=true});assert.equal(intercepted,false)}
 for(const request of [{method:'POST',url:added[0],headers:new Headers()},{method:'GET',url:'https://other.example/data',headers:new Headers()}]){let intercepted=false;listeners.fetch({request,respondWith:()=>intercepted=true});assert.equal(intercepted,false)}
 const optional=[...entries.keys()].find(url=>url.includes('/reading-editor.js?'));entries.delete(optional);let response;listeners.fetch({request:new Request(optional),respondWith:job=>response=job});assert.equal((await response).status,200);assert(entries.has(optional),'first feature use caches its module');
 unavailable=base;listeners.fetch({request:{method:'GET',mode:'navigate',url:base,headers:new Headers()},respondWith:job=>response=job});assert.equal(await(await response).text(),'cached');
 console.log('PASS: core-first offline install, optional background fill/retry, demand caching, offline navigation and authenticated cache bypass');
})().catch(error=>{console.error(error);process.exitCode=1});
