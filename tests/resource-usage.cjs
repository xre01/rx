const fs=require('fs'),assert=require('assert/strict');
const files=fs.readdirSync('.'),sources=files.filter(f=>/\.(html|js|css|webmanifest)$/.test(f)&&f!=='sw.js').map(file=>({file,text:fs.readFileSync(file,'utf8')}));
const assets=files.filter(f=>/\.(css|png|webp|ico|webmanifest)$/.test(f));
for(const file of assets)assert.ok(sources.some(s=>s.file!==file&&s.text.includes(file)),`${file} is referenced only by its own file or the offline cache`);
console.log(`PASS: all ${assets.length} stylesheet, image, icon and manifest assets have references outside the offline precache`);
