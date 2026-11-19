const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<main></main><nav class="rex-sidebar-nav"><button>Archive</button></nav>',{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.CSS={supports:()=>true};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=function(){};
const key='rex-reading-library-v1',book={id:'book',kind:'book',title:'Keep this book',logs:[{id:'n',date:'2026-10-18',note:'Book note'}],attachments:[]};
w.localStorage.setItem(key,JSON.stringify([book]));
for(const f of ['rich-doc.js','rich-codec.js','rich-editor.js','reading-document.js','reading-editor.js'])w.eval(fs.readFileSync(f,'utf8'));
let api;const attach=w.RexReadingEditor.attach;w.RexReadingEditor.attach=(...args)=>api=attach(...args);
w.eval(fs.readFileSync('reading.js','utf8'));const click=text=>[...w.document.querySelectorAll('button')].find(b=>b.textContent===text).click(),tick=()=>new Promise(r=>setTimeout(r,15));
(async()=>{try{
 click('Write note');let form=w.document.querySelector('dialog form');
 assert.equal(form.querySelector('fieldset,legend,.reading-source-help'),null);
 assert.equal(form.querySelector('.reading-source-status').textContent,'');
 assert.equal(form.querySelectorAll('.reading-source-buttons button').length,4);
 const sourceLink=form.querySelector('[name=url]');assert.equal(sourceLink.closest('label').hidden,true);
 [...form.querySelectorAll('.reading-source-buttons button')].find(b=>b.textContent==='Links').click();
 assert.equal(sourceLink.closest('label').hidden,false);
 assert.equal(form.querySelectorAll('select[name=kind],select[name=bookId]').length,0);form.querySelector('[name=source]').value='Article title';form.querySelector('[name=url]').value='https://example.com/article';const date=form.querySelector('[name=writtenDate]').value;api.editor.commands.setContent('<p>First thought</p>');form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));await tick();
 let rows=JSON.parse(w.localStorage.getItem(key)),article=rows.find(r=>r.kind==='article');assert.ok(article);assert.equal(article.body,'First thought');assert.equal(article.url,'https://example.com/article');assert.equal(article.editorBody.version,1);assert.equal(article.writtenDate,date);assert.deepEqual(rows.find(r=>r.kind==='book'),book);
 assert.equal(w.document.querySelector('.reading-library').hidden,false);assert.equal(w.document.querySelector('.reading-timeline-stamp').dateTime,date);w.document.querySelector('.reading-timeline-card').click();await tick();w.document.querySelector('.reading-reader-edit').click();form=w.document.querySelector('dialog form');assert.equal(form.querySelector('[name=source]').value,'Article title');assert.equal(form.querySelector('[name=url]').value,'https://example.com/article');api.editor.commands.setContent('<p>Updated thought</p>');form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));await tick();
 rows=JSON.parse(w.localStorage.getItem(key));assert.equal(rows.length,2);assert.equal(rows.find(r=>r.id===article.id).body,'Updated thought');assert.deepEqual(rows.find(r=>r.kind==='book'),book);
 assert.equal(w.document.querySelector('.reading-note-reader').hidden,false);assert.match(w.document.querySelector('.reading-reader-article .reading-note-prose').textContent,/Updated thought/);assert.equal(w.document.querySelector('.reading-reader-article .reading-original-link').href,'https://example.com/article');w.document.querySelector('.reading-reader-back').click();

 // Select two individually small files whose combined pending upload exceeds the limit.
 click('Write note');
 form=w.document.querySelector('dialog form');
 form.querySelector('[name=source]').value='Large batch';
 api.editor.commands.setContent('<p>Keep my draft</p>');
 const picker=form.querySelector('[type=file]');
 Object.defineProperty(picker,'files',{value:[{name:'a.pdf',size:12*1024*1024},{name:'b.pdf',size:12*1024*1024}]});
 picker.dispatchEvent(new w.Event('change'));
 form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
 await tick();
 assert.match(form.textContent,/at most 20 MiB/);
 assert.equal(JSON.parse(w.localStorage.getItem(key)).length,2);
 form.closest('dialog').close();w.document.querySelector('.reading-timeline-card').click();await tick();

 w.document.querySelector('.reading-reader-edit').click();
 form=w.document.querySelector('dialog form');
 const changed=rows.map(r=>r.id===article.id?{...r,updated:'newer',body:'Other tab'}:r);
 w.localStorage.setItem(key,JSON.stringify(changed));
 api.editor.commands.setContent('<p>Stale form</p>');
 form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
 await tick();
 assert.match(form.textContent,/article changed/);
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)),changed);
 form.closest('dialog').close();w.document.querySelector('.reading-reader-delete').click();const deleted=JSON.parse(w.localStorage.getItem(key));assert.equal(deleted.find(r=>r.id===article.id).deleted,true);assert.deepEqual(deleted.find(r=>r.kind==='book'),book);assert.equal(w.document.querySelector('.reading-note-reader').hidden,true);
 console.log('PASS: direct edit/delete icons, article creation/edit, rich content and link/date retention, correct record identity, separate book notes preserved');
 }finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
