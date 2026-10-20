const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<main></main><nav class="rex-sidebar-nav"><button>Archive</button></nav>',{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.CSS={supports:()=>true};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
const key='rex-reading-library-v1',book={id:'book',kind:'book',title:'Keep this book',logs:[{id:'n',date:'2026-10-18',note:'Book note'}],attachments:[]};
w.localStorage.setItem(key,JSON.stringify([book]));
for(const f of ['rich-doc.js','rich-codec.js','rich-editor.js','reading-document.js','reading-editor.js'])w.eval(fs.readFileSync(f,'utf8'));
let api;const attach=w.RexReadingEditor.attach;w.RexReadingEditor.attach=(...args)=>api=attach(...args);
w.eval(fs.readFileSync('reading.js','utf8'));const click=text=>[...w.document.querySelectorAll('button')].find(b=>b.textContent===text).click(),tick=()=>new Promise(r=>setTimeout(r,15));
(async()=>{try{
 click('Write note');let form=w.document.querySelector('dialog form');assert.equal(form.querySelectorAll('select[name=kind],select[name=bookId]').length,0);form.querySelector('[name=source]').value='Article title';form.querySelector('[name=url]').value='https://example.com/article';const date=form.querySelector('[name=writtenDate]').value;api.editor.commands.setContent('<p>First thought</p>');form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));await tick();
 let rows=JSON.parse(w.localStorage.getItem(key)),article=rows.find(r=>r.kind==='article');assert.ok(article);assert.equal(article.body,'First thought');assert.equal(article.url,'https://example.com/article');assert.equal(article.editorBody.version,1);assert.equal(article.writtenDate,date);assert.deepEqual(rows.find(r=>r.kind==='book'),book);
 w.document.querySelector(`.reading-calendar-day[aria-label^="${date}"]`).click();w.document.querySelector('.reading-journal-card .reading-note-action').click();form=w.document.querySelector('dialog form');assert.equal(form.querySelector('[name=source]').value,'Article title');assert.equal(form.querySelector('[name=url]').value,'https://example.com/article');api.editor.commands.setContent('<p>Updated thought</p>');form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));await tick();
 rows=JSON.parse(w.localStorage.getItem(key));assert.equal(rows.length,2);assert.equal(rows.find(r=>r.id===article.id).body,'Updated thought');assert.deepEqual(rows.find(r=>r.kind==='book'),book);
 console.log('PASS: article creation/edit, rich content and link/date retention, correct record identity, separate book notes preserved');
 }finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
