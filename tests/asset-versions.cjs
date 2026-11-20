const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
require('node:child_process').execFileSync(process.execPath, ['scripts/version-assets.cjs', '--check']);
const versions=new Map();for(const target of ['index.html','sw.js','manifest.webmanifest','focus-push-sw.js','asset-loader.js'])for(const [,file,version]of fs.readFileSync(target,'utf8').matchAll(/([A-Za-z0-9_./-]+\.(?:js|css|png|ico|webmanifest))\?v=([A-Za-z0-9_-]+)/g)){
 if(file==='sw.js')continue;
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);assert.equal(version,hash,target+': '+file+' has stale content version');
 if(versions.has(file))assert.equal(versions.get(file),version);versions.set(file,version);
}assert(versions.size>20);assert(versions.has('reva-icon-192.png'));assert(versions.has('manifest.webmanifest'));console.log('PASS: HTML, manifest, icons, service worker imports and precache use matching content versions');

// Exercise a real icon revision and a worker-only revision without changing repo files.
const vm=require('node:vm'),script=fs.readFileSync('scripts/version-assets.cjs','utf8'),memory=new Map();
const virtualFs={readFileSync(file,encoding){const bytes=memory.has(file)?memory.get(file):fs.readFileSync(file);return encoding?bytes.toString(encoding):bytes},writeFileSync(file,content){memory.set(file,Buffer.from(content))}};
const run=()=>vm.runInNewContext(script,{require:name=>name==='node:fs'?virtualFs:require(name),process:{argv:[]}});
const cacheName=()=>virtualFs.readFileSync('sw.js','utf8').match(/const CACHE='([^']+)'/)[1];
const before=cacheName();memory.set('reva-icon-192.png',Buffer.concat([fs.readFileSync('reva-icon-192.png'),Buffer.from([0])]));run();
const iconRelease=cacheName();assert.notEqual(iconRelease,before);const iconHash=crypto.createHash('sha256').update(memory.get('reva-icon-192.png')).digest('hex').slice(0,12);
for(const file of ['manifest.webmanifest','focus-push-sw.js','sw.js'])assert(virtualFs.readFileSync(file,'utf8').includes('reva-icon-192.png?v='+iconHash),file+' must use the revised icon');
memory.set('sw.js',Buffer.from(virtualFs.readFileSync('sw.js','utf8')+'\n// worker revision\n'));run();assert.notEqual(cacheName(),iconRelease);const workerRelease=cacheName();run();assert.equal(cacheName(),workerRelease);
console.log('PASS: icon revisions refresh all consumers and release cache; worker-only revisions also rotate cache; repeated build is stable');
