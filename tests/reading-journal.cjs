const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<main></main><nav class="rex-sidebar-nav"><button>Archive</button></nav>',{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.CSS={supports:()=>true};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
const key='rex-reading-library-v1',original={id:'book',kind:'book',title:'Journal',body:'Legacy note',writtenDate:'2026-10-18',logs:[{id:'new',date:'2026-10-20',note:'Newest note'},{id:'old',date:'2026-10-19',note:'Keep this note'}],attachments:[]};
w.localStorage.setItem(key,JSON.stringify([original]));
try{
 for(const f of ['rich-doc.js','rich-codec.js','rich-editor.js','reading-document.js','reading-editor.js','reading.js'])w.eval(fs.readFileSync(f,'utf8'));
 w.document.querySelector('.reading-shelf-book').click();
 const first=()=>w.document.querySelector('.reading-book-note');
 assert.equal(first().querySelector('.reading-note-prose').textContent,'Newest note');
 const menu=first().querySelector('.reading-note-actions');menu.open=true;menu.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(menu.open,false);
 assert.match(first().querySelector('.reading-recall').textContent,/own words/);
 w.confirm=()=>false;first().querySelector('.reading-note-delete').click();assert.deepEqual(JSON.parse(w.localStorage.getItem(key)),[original]);
 w.confirm=()=>true;first().querySelector('.reading-note-delete').click();
 const after=JSON.parse(w.localStorage.getItem(key))[0];assert.equal(after.body,'');assert.deepEqual(after.logs.map(n=>n.note),['Legacy note','Keep this note']);assert.equal(w.document.querySelectorAll('.reading-book-note').length,2);
 assert.equal(first().querySelector('.reading-note-prose').textContent,'Keep this note');
 first().querySelector('.reading-note-action').click();assert.ok(w.document.querySelector('.reading-form'));assert.equal(w.document.querySelector('textarea[name=note]').value,'Keep this note');
 console.log('PASS: journal order, keyboard dismissal, recall prompt, cancellation, confirmed deletion preserves legacy/sibling notes, edit opens correct note');
}finally{w.close()}
