'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
// A changed file gets a changed URL in HTML and the offline manifest together.
for(const target of ['index.html','sw.js']){
 const text=fs.readFileSync(target,'utf8').replace(/([A-Za-z0-9_./-]+\.(?:js|css))\?v=[A-Za-z0-9_-]+/g,(match,file)=>{
  if(!fs.existsSync(file)||file==='sw.js')return match;
  const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
  return file+'?v='+hash;
 });fs.writeFileSync(target,text);
}
