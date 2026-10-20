const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<main></main><nav class="rex-sidebar-nav"><button>Archive</button></nav>',{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.CSS={supports:()=>true};w.Blob=Blob;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
let created=0;const revoked=[];w.URL.createObjectURL=()=>`blob:test-${++created}`;w.URL.revokeObjectURL=href=>revoked.push(href);
const files=[{id:'i',name:'page.png',type:'image/png',size:10},{id:'p',name:'chapter.pdf',type:'application/pdf',size:10},{id:'t',name:'quote.txt',type:'text/plain',size:10},{id:'d',name:'draft.docx',size:10}];
w.localStorage.setItem('rex-reading-library-v1',JSON.stringify([{id:'book',kind:'book',title:'Book',logs:[{id:'one',date:'2026-10-20',note:'First',attachmentIds:['i','p','t','d']},{id:'two',date:'2026-10-20',note:'Second'}],attachments:files}]));
const tick=()=>new Promise(r=>setTimeout(r,15));
(async()=>{try{
 for(const f of ['rich-doc.js','rich-codec.js','rich-editor.js','reading-document.js','reading-editor.js'])w.eval(fs.readFileSync(f,'utf8'));
 let source=fs.readFileSync('reading.js','utf8'),at=source.lastIndexOf('})();');source=source.slice(0,at)+`readFile=async id=>{if(window.failPreview)throw Error('missing');return new Blob([id==='t'?'<script>unsafe</script>':'data'],{type:id==='i'?'image/png':id==='p'?'application/pdf':'text/plain'})};`+source.slice(at);w.eval(source);
 w.document.querySelector('.reading-shelf-book').click();await tick();assert.equal(w.document.querySelectorAll('.reading-day-group').length,1);assert.equal(w.document.querySelector('.reading-day-count').textContent,'2 entries');assert.equal(w.document.querySelectorAll('.reading-attachment-gallery').length,2);assert.ok(w.document.querySelector('.reading-attachment-cover img'));
 const preview=async index=>{w.document.querySelectorAll('.reading-attachment-cover')[index].click();await tick();return [...w.document.querySelectorAll('dialog')].at(-1)};
 let d=await preview(0);assert.ok(d.querySelector('.reading-preview-stage>img'));d.close();await tick();assert.ok(revoked.length>0);
 d=await preview(1);assert.ok(d.querySelector('iframe[title="PDF preview: chapter.pdf"]'));assert.ok(d.querySelector('a[download="chapter.pdf"]'));d.close();
 d=await preview(2);assert.equal(d.querySelector('pre').textContent,'<script>unsafe</script>');assert.equal(d.querySelector('script'),null);d.close();
 d=await preview(3);assert.match(d.querySelector('[role=status]').textContent,/not available/);assert.ok(d.querySelector('a[download="draft.docx"]'));d.close();
 w.failPreview=true;d=await preview(0);assert.match(d.querySelector('[role=status]').textContent,/unavailable/);assert.match(d.textContent,/Retry preview/);
 console.log('PASS: same-day grouping, thumbnail, image/PDF/text preview, safe text, downloads, failed preview retry and URL cleanup');
 }finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
