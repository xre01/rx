const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const versions=new Map();for(const target of ['index.html','sw.js'])for(const [,file,version]of fs.readFileSync(target,'utf8').matchAll(/([A-Za-z0-9_./-]+\.(?:js|css))\?v=([A-Za-z0-9_-]+)/g)){
 if(file==='sw.js')continue;
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);assert.equal(version,hash,target+': '+file+' has stale content version');
 if(versions.has(file))assert.equal(versions.get(file),version);versions.set(file,version);
}assert(versions.size>20);console.log('PASS: HTML, service worker imports and precache use matching content versions');
