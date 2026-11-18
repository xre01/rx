const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<main></main><nav class="rex-sidebar-nav"><button>Archive</button></nav>',{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.CSS={supports:()=>true};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
const key='rex-reading-library-v1',records=Array.from({length:13},(_,i)=>({id:'note-'+i,kind:'article',title:'Note '+i,body:'Keep this content '+i,logs:[],attachments:[],writtenDate:'2026-11-'+String(17-i).padStart(2,'0'),updated:'2026-11-17T00:00:00Z',tags:i<7?['Ideas']:i===12?'Focus, Work':['Focus']}));
w.localStorage.setItem(key,JSON.stringify(records));
const query=s=>w.document.querySelector(s),rows=()=>JSON.parse(w.localStorage.getItem(key)),submit=()=>query('.reading-tags-dialog form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
try{
 for(const f of ['rich-doc.js','rich-codec.js','rich-editor.js','reading-document.js','reading-editor.js','reading.js'])w.eval(fs.readFileSync(f,'utf8'));
 query('.reading-timeline-card').click();
 assert.equal(query('.reading-reader-back').textContent,'');assert.equal(query('.reading-reader-back').getAttribute('aria-label'),'Back to timeline');assert.ok(query('.reading-reader-back svg'));
 assert.deepEqual([...w.document.querySelectorAll('.reading-reader-controls button')].map(n=>n.getAttribute('aria-label')),['Edit tags','Edit note','Delete note']);assert.equal(query('.reading-note-reader .reading-note-actions'),null);for(const b of w.document.querySelectorAll('.reading-reader-controls button')){assert.ok(b.querySelector('svg'));assert.equal(b.textContent,'')}
 query('.reading-reader-tags').click();query('[name=tags]').value='Ideas, 学习, ideas';submit();
 assert.equal(query('.reading-tags-dialog'),null);assert.deepEqual(rows()[0].tags,['Ideas','学习']);assert.equal(rows()[0].body,records[0].body);assert.equal(rows()[0].writtenDate,records[0].writtenDate);assert.equal(w.document.activeElement,query('.reading-reader-tags'));
 assert.deepEqual([...w.document.querySelectorAll('.reading-note-tag')].map(n=>n.textContent),['Ideas','学习']);
 query('.reading-reader-tags').click();query('[name=tags]').value=Array.from({length:9},(_,i)=>'Tag '+i).join(',');submit();assert.match(query('.reading-tags-dialog [role=status]').textContent,/up to 8/);assert.deepEqual(rows()[0].tags,['Ideas','学习']);query('.reading-tags-dialog').close();
 query('.reading-reader-tags').click();query('[name=tags]').value='<img src=x>';submit();assert.equal(query('.reading-note-tag').textContent,'<img src=x>');assert.equal(query('.reading-note-tags img'),null);
 query('.reading-reader-tags').click();query('[name=tags]').value='Do not overwrite';const latest=rows();latest[0]={...latest[0],updated:'2026-11-18T00:00:00Z',tags:['Other tab']};w.localStorage.setItem(key,JSON.stringify(latest));submit();assert.match(query('.reading-tags-dialog [role=status]').textContent,/note changed/);assert.deepEqual(rows()[0].tags,['Other tab']);query('.reading-tags-dialog').close();w.dispatchEvent(new w.StorageEvent('storage',{key}));
 query('.reading-reader-tags').click();query('[name=tags]').value='';submit();assert.deepEqual(rows()[0].tags,[]);assert.equal(query('.reading-note-tag'),null);
 query('.reading-reader-back').click();let filter=query('.reading-tag-filter select');filter.value='ideas';filter.dispatchEvent(new w.Event('change'));assert.equal(query('.reading-timeline-page').textContent,'1 / 2');assert.equal(w.document.querySelectorAll('.reading-timeline-entry').length,5);
 query('.reading-timeline-next').click();assert.equal(w.document.querySelectorAll('.reading-timeline-entry').length,1);
 filter=query('.reading-tag-filter select');filter.value='focus';filter.dispatchEvent(new w.Event('change'));assert.equal(query('.reading-timeline-page').textContent,'1 / 2');assert.equal(query('.reading-timeline-title').textContent,'Note 7');
 filter=query('.reading-tag-filter select');filter.value='work';filter.dispatchEvent(new w.Event('change'));assert.equal(query('.reading-timeline-title').textContent,'Note 12');assert.equal(query('.reading-timeline-pagination'),null);
 const search=query('input[type=search]');search.value='No match';search.dispatchEvent(new w.Event('input'));assert.ok(query('.reading-timeline-empty'));
 console.log('PASS: icon toolbar, menu placement, tag add/remove/validation, Unicode/deduplication, safe text, conflict protection and tag filtering with five-note pages');
}finally{w.close()}
