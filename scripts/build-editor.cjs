const fs=require('fs');
// Keep the server validator identical to the browser's versioned document format.
const file='workers/notion-worker.mjs',worker=fs.readFileSync(file,'utf8');
const marker=worker.indexOf('root.RexReadingDocument=');
if(marker<0)throw Error('Missing server document validator');
const start=worker.lastIndexOf('(function(root)',marker),closing='})(globalThis);',closeAt=worker.indexOf(closing,marker);
if(start<0||closeAt<0)throw Error('Incomplete server document validator');
const end=closeAt+closing.length;
fs.writeFileSync(file,worker.slice(0,start)+fs.readFileSync('reading-document.js','utf8').trimEnd()+worker.slice(end));
console.log('Synchronized browser and server document validation.');
