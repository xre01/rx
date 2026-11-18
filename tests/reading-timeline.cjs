const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<main></main><nav class="rex-sidebar-nav"><button>Archive</button></nav>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;
w.CSS={supports:()=>true};
let scrolls=0,scrollY=0;w.HTMLElement.prototype.scrollIntoView=function(){scrolls++};w.scrollTo=options=>{scrollY=options.top};Object.defineProperty(w,'scrollY',{get:()=>scrollY});
const records=[
{id:'old',kind:'article',title:'Older thought',body:'older',writtenDate:'2025-10-12',updated:'2026-11-17',logs:[]},
{id:'new',kind:'article',title:'Newest thought',body:'new',writtenDate:'2026-11-16',logs:[]},
{id:'same',kind:'article',title:'Another thought',body:'second',writtenDate:'2026-11-16',logs:[]},
{id:'gone',kind:'article',title:'Deleted',writtenDate:'2026-11-17',deleted:true,logs:[]},
{id:'book',kind:'book',title:'Books remain',logs:[]}
];
w.localStorage.setItem('rex-reading-library-v1',JSON.stringify(records));
(async()=>{try{
for(const f of ['rich-doc.js','rich-codec.js','rich-editor.js','reading-document.js','reading-editor.js','reading.js'])w.eval(fs.readFileSync(f,'utf8'));
assert.equal(w.document.querySelector('.reading-calendar'),null);
assert.equal(w.document.querySelector('.reading-library').hidden,false);
assert.deepEqual([...w.document.querySelectorAll('.reading-timeline-stamp')].map(n=>n.dateTime),['2026-11-16','2026-11-16','2025-10-12']);
assert.equal(w.document.querySelectorAll('.reading-timeline-year')[0].querySelectorAll('.reading-timeline-entry').length,2);
assert.equal(w.document.querySelectorAll('.reading-timeline-entry').length,3);
assert.equal(w.document.querySelectorAll('.reading-shelf-book').length,1);
assert.equal(w.document.querySelector('.reading-timeline-pagination'),null);
const search=w.document.querySelector('input[type=search]');search.value='Older';search.dispatchEvent(new w.Event('input'));
assert.equal(w.document.querySelectorAll('.reading-timeline-entry').length,1);
assert.equal(w.document.querySelector('.reading-timeline-stamp').dateTime,'2025-10-12');
search.value='no match';search.dispatchEvent(new w.Event('input'));assert.match(w.document.querySelector('.reading-timeline-empty').textContent,/No notes match/);
search.value='';search.dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelectorAll('.reading-timeline-entry').length,3);
assert.deepEqual([...w.document.querySelectorAll('.reading-timeline-year-heading')].map(n=>n.textContent),['2026','2025']);
assert.equal(w.document.querySelectorAll('.reading-timeline article').length,0);
const firstCard=w.document.querySelector('.reading-timeline-card');assert.equal(firstCard.tagName,'BUTTON');scrollY=360;firstCard.click();
assert.equal(w.document.querySelectorAll('.reading-timeline article').length,0);assert.equal(w.document.querySelector('.reading-grid').hidden,true);assert.equal(w.document.querySelector('.reading-note-reader').hidden,false);assert.equal(w.document.querySelector('.reading-note-reader .reading-note-prose').textContent,'new');
assert.equal(w.document.activeElement,w.document.querySelector('.reading-reader-title'));
w.document.querySelector('.reading-reader-back').click();assert.equal(w.document.querySelector('.reading-grid').hidden,false);assert.equal(w.document.querySelector('.reading-note-reader').hidden,true);assert.equal(w.document.activeElement,firstCard);assert.equal(scrollY,360);scrolls=0;
assert.deepEqual(JSON.parse(w.localStorage.getItem('rex-reading-library-v1')),records);
const many=Array.from({length:13},(_,i)=>({id:'page-'+i,kind:'article',title:'Page '+i,body:'text',writtenDate:i<12?'2026-11-'+String(17-i).padStart(2,'0'):'2025-12-'+String(43-i).padStart(2,'0'),logs:[]}));
const replace=rows=>{w.localStorage.setItem('rex-reading-library-v1',JSON.stringify(rows));w.dispatchEvent(new w.StorageEvent('storage',{key:'rex-reading-library-v1'}))};
const titles=()=>[...w.document.querySelectorAll('.reading-timeline-title')].map(n=>n.textContent);
const prev=()=>w.document.querySelector('.reading-timeline-prev'),next=()=>w.document.querySelector('.reading-timeline-next');
const page=()=>w.document.querySelector('.reading-timeline-page').textContent;
replace(many);
assert.equal(titles().length,5);assert.equal(page(),'1 / 3');assert.equal(prev().disabled,true);assert.equal(next().disabled,false);
assert.match(w.document.querySelector('.reading-timeline-summary').textContent,/1–5 of 13/);
next().click();assert.deepEqual(titles(),many.slice(5,10).map(r=>r.title));assert.equal(page(),'2 / 3');assert.equal(prev().disabled,false);
assert.equal(w.document.activeElement,w.document.querySelector('.reading-article-heading'));assert.equal(scrolls,1);
scrollY=840;w.document.querySelector('.reading-timeline-card').click();w.document.querySelector('.reading-reader-back').click();assert.equal(page(),'2 / 3');assert.equal(scrollY,840);assert.equal(w.document.activeElement.dataset.noteId,'page-5');
next().click();assert.deepEqual(titles(),many.slice(10).map(r=>r.title));assert.equal(page(),'3 / 3');assert.equal(next().disabled,true);
assert.deepEqual([...w.document.querySelectorAll('.reading-timeline-year-heading')].map(n=>n.textContent),['2026','2025']);
assert.match(w.document.querySelector('.reading-timeline-summary').textContent,/11–13 of 13/);
prev().click();assert.deepEqual(titles(),many.slice(5,10).map(r=>r.title));assert.equal(page(),'2 / 3');
search.value='Page 12';search.dispatchEvent(new w.Event('input'));assert.deepEqual(titles(),['Page 12']);assert.equal(w.document.querySelector('.reading-timeline-pagination'),null);
search.value='';search.dispatchEvent(new w.Event('input'));assert.equal(page(),'1 / 3');assert.equal(titles()[0],'Page 0');
next().click();next().click();replace(many.slice(0,6));assert.equal(page(),'2 / 2');assert.deepEqual(titles(),['Page 5']);
replace(many.slice(0,5));assert.equal(titles().length,5);assert.equal(w.document.querySelector('.reading-timeline-pagination'),null);
replace([]);assert.ok(w.document.querySelector('.reading-timeline-empty'));assert.equal(w.document.querySelector('.reading-timeline-pagination'),null);
replace(many);assert.equal(page(),'1 / 3');
assert.deepEqual(JSON.parse(w.localStorage.getItem('rex-reading-library-v1')),many);
next().click();w.document.querySelector('.reading-timeline-card').click();replace(many.map(r=>r.id==='page-5'?{...r,body:'Synced update'}:r));assert.equal(w.document.querySelector('.reading-note-reader .reading-note-prose').textContent,'Synced update');
replace(many.filter(r=>r.id!=='page-5'));assert.equal(w.document.querySelector('.reading-note-reader').hidden,true);assert.equal(w.document.querySelector('.reading-grid').hidden,false);assert.equal(page(),'2 / 3');
console.log('PASS: year groups, 5-note pages, both directions, global search, reader/back focus and position, edit/sync refresh and deletion handling');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
