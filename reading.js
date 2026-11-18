(()=>{
'use strict';
const key='rex-reading-library-v1',main=document.querySelector('main'),nav=document.querySelector('.rex-sidebar-nav');if(!main||!nav)return;
const day=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-')};
let records=[],storageError='';
function loadLibrary(){
 try{
  const data=JSON.parse(localStorage.getItem(key)??'[]');
  if(!Array.isArray(data)||!data.every(r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&Array.isArray(r.logs)))throw Error();
  records=data;storageError='';return true;
 }catch{storageError='Reading storage could not be loaded. Existing data has not been overwritten.';return false}
}
loadLibrary();
function pendingBytes(files){return files.reduce((sum,file)=>sum+(file.blockId?0:file.size||0),0)}

const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const btn=(text,fn,cls='ghost')=>{const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n};
function readingSvg(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const [key,value] of Object.entries({viewBox:'0 0 24 24',width:'20',height:'20',focusable:'false',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(key,value);if(name==='more'){for(const x of [5,12,19]){const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('cx',x);dot.setAttribute('cy','12');dot.setAttribute('r','1');svg.append(dot)}}else{const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',({back:'M19 12H5m6-6-6 6 6 6',tag:'M20 13l-7 7a2 2 0 0 1-3 0l-7-7V4h9l8 8a1 1 0 0 1 0 1ZM7 8h.01',edit:'M16 4a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4L16 4ZM14 6l4 4',delete:'M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6m4-6v6'})[name]);svg.append(path)}return svg}
function readingIconButton(name,label,fn,cls){const b=btn('',fn,'reading-icon-button '+cls);b.setAttribute('aria-label',label);b.title=label;b.append(readingSvg(name));return b}
function readingTags(r){const raw=Array.isArray(r.tags)?r.tags:typeof r.tags==='string'?r.tags.split(/[,，\n]/):[],seen=new Set();return raw.filter(t=>typeof t==='string').map(t=>t.trim()).filter(t=>{const key=t.toLowerCase();if(!t||seen.has(key))return false;seen.add(key);return true})}
function allReadingTags(){const map=new Map();for(const r of records.filter(r=>!r.deleted&&r.kind==='article'))for(const tag of readingTags(r))if(!map.has(tag.toLowerCase()))map.set(tag.toLowerCase(),tag);return [...map.values()].sort((a,b)=>a.localeCompare(b))}
const panel=el('section','panelview reading-panel');panel.id='reading';main.append(panel);
const entry=btn('Reading',()=>{document.querySelectorAll('.panelview').forEach(p=>p.classList.toggle('active',p===panel));nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===entry);b.setAttribute('aria-current',b===entry?'page':'false')});window.scrollTo({top:0,behavior:'instant'})},'');entry.dataset.sideView='reading';const readingIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');readingIcon.setAttribute('viewBox','0 0 24 24');readingIcon.setAttribute('fill','none');readingIcon.setAttribute('stroke','currentColor');readingIcon.setAttribute('stroke-width','1.6');readingIcon.setAttribute('stroke-linecap','round');readingIcon.setAttribute('stroke-linejoin','round');readingIcon.setAttribute('aria-hidden','true');readingIcon.innerHTML='<path d="M12 6.5C9.5 4.8 6.5 4.2 3 5v14c3.5-.8 6.5-.2 9 1.5 2.5-1.7 5.5-2.3 9-1.5V5c-3.5-.8-6.5-.2-9 1.5Zm0 0v14M6 8.5c1.2-.1 2.2.1 3 .5m-3 3c1.2-.1 2.2.1 3 .5m6-3.5c.8-.4 1.8-.6 3-.5m-3 4c.8-.4 1.8-.6 3-.5"/>';entry.prepend(readingIcon);nav.insertBefore(entry,nav.lastElementChild);
const header=el('header','reading-heading'),title=el('div');title.append(el('div','eyebrow','REX · READING JOURNAL'),el('h1','','Reading notes'),el('p','sub','Keep the thoughts you find in your reading.'));header.append(title);panel.append(header);
const feedback=el('p','sub');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');panel.append(feedback);
const library=el('section','card reading-library');panel.append(library);
const toolbar=el('div','reading-toolbar'),search=el('input');search.type='search';search.placeholder='Search notes or books';search.setAttribute('aria-label','Search reading notes');
const searchWrap=el('div','reading-search-wrap'),searchIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');searchIcon.setAttribute('viewBox','0 0 24 24');searchIcon.setAttribute('fill','none');searchIcon.setAttribute('stroke','currentColor');searchIcon.setAttribute('stroke-width','1.7');searchIcon.setAttribute('stroke-linecap','round');searchIcon.setAttribute('aria-hidden','true');const searchCircle=document.createElementNS('http://www.w3.org/2000/svg','circle');searchCircle.setAttribute('cx','10.5');searchCircle.setAttribute('cy','10.5');searchCircle.setAttribute('r','6.5');const searchHandle=document.createElementNS('http://www.w3.org/2000/svg','path');searchHandle.setAttribute('d','M16 16 L21 21');searchIcon.append(searchCircle,searchHandle);searchWrap.append(searchIcon,search);const actionGroup=el('div','reading-action-group');actionGroup.append(btn('Write note',()=>notebook(),'action'),btn('Books',()=>addBook(),'ghost reading-add-book'));toolbar.append(searchWrap,actionGroup);library.append(toolbar);const grid=el('div','reading-grid');library.append(grid);search.addEventListener('input',render);
const timelinePageSize=5;
let selectedDay='',readingToday=day(),timelinePage=1,timelineQuery='',timelineTag='';
let activeArticleId='',articleReturn={id:'',scrollY:0};
const articleReader=el('section','reading-note-reader');articleReader.hidden=true;articleReader.setAttribute('aria-label','Reading note');library.append(articleReader);
function refreshReadingDay(){const current=day();if(current===readingToday)return;readingToday=current;render()}
setInterval(refreshReadingDay,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshReadingDay()});
panel.insertBefore(toolbar,library);
function noteDay(r){return r.writtenDate||r.createdAt?.slice(0,10)||r.updated?.slice(0,10)||''}
function renderTimeline(articles,q){
 const query=q+'\0'+timelineTag;if(query!==timelineQuery){timelinePage=1;timelineQuery=query}
 const pageCount=Math.max(1,Math.ceil(articles.length/timelinePageSize));timelinePage=Math.min(timelinePage,pageCount);
 const start=(timelinePage-1)*timelinePageSize,end=Math.min(start+timelinePageSize,articles.length),heading=el('h2','reading-article-heading','Reading timeline');heading.tabIndex=-1;
 const summary=el('p','sub reading-timeline-summary',(articles.length?String(start+1)+'–'+end+' of ':'')+articles.length+' article '+(articles.length===1?'note':'notes')+' · Newest first');summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');summary.setAttribute('aria-atomic','true');
 const headingRow=el('div','reading-timeline-heading');headingRow.append(heading);const tags=allReadingTags();if(tags.length){const filter=el('label','reading-tag-filter'),select=el('select');select.setAttribute('aria-label','Filter notes by tag');select.append(el('option','','All tags'));select.firstChild.value='';for(const tag of tags){const option=el('option','',tag);option.value=tag.toLowerCase();select.append(option)}select.value=timelineTag;select.addEventListener('change',()=>{timelineTag=select.value;timelinePage=1;render();grid.querySelector('.reading-tag-filter select')?.focus({preventScroll:true})});filter.append(readingSvg('tag'),select);headingRow.append(filter)}
 grid.id='reading-timeline-results';grid.append(headingRow,summary);
 if(!articles.length){grid.append(el('p','reading-timeline-empty',q?'No notes match your search.':'Your reading timeline starts here. Write a note to capture your first thought.'));return}
 const timeline=el('div','reading-timeline');timeline.setAttribute('aria-label','Article notes by year');const groups=new Map();
 for(const r of articles.slice(start,end)){const year=noteDay(r).slice(0,4)||'Undated';if(!groups.has(year))groups.set(year,[]);groups.get(year).push(r)}
 for(const [year,items] of groups){
  const group=el('section','reading-timeline-year'),heading=el('h3','reading-timeline-year-heading',year),notes=el('div','reading-timeline-notes');
  for(const r of items){
   const date=noteDay(r),card=el('div','reading-timeline-entry'),summary=btn('',()=>openArticleReader(r.id),'reading-timeline-card'),stamp=el('time','reading-timeline-stamp');summary.dataset.noteId=r.id;summary.setAttribute('aria-label','Read note: '+(r.noteTitle||r.source||r.title)+' · '+date);if(date)stamp.dateTime=date;
   stamp.append(el('strong','reading-timeline-day',date.slice(8,10)||'—'),el('span','reading-timeline-month',date?new Intl.DateTimeFormat('en',{month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'Undated'));
   const text=el('span','reading-timeline-text');text.append(el('strong','reading-timeline-title',r.noteTitle||r.source||r.title),el('span','reading-timeline-excerpt',(r.body||'').replace(/\s+/g,' ').trim()||((r.attachments||[]).length?'Attachments · Open to read':'Open to read')));
   const meta=el('span','reading-timeline-meta',date===day()?'Today':'');if((r.attachments||[]).length)meta.append(el('span','',r.attachments.length+' attachments'));const labels=readingTags(r);if(labels.length)meta.append(el('span','reading-timeline-tags',labels.slice(0,2).map(t=>'#'+t).join(' · ')+(labels.length>2?' +'+(labels.length-2):'')));text.append(meta);summary.append(stamp,text);card.append(summary);
   notes.append(card);
  }group.append(heading,notes);timeline.append(group);
 }grid.append(timeline);
 if(pageCount>1){
  const pager=el('nav','reading-timeline-pagination');pager.setAttribute('aria-label','Reading timeline pages');
  const move=delta=>{timelinePage=Math.max(1,Math.min(pageCount,timelinePage+delta));render();const title=grid.querySelector('.reading-article-heading');title.focus({preventScroll:true});title.scrollIntoView({block:'start',behavior:'instant'})};
  const prev=btn('‹ Previous',()=>move(-1),'ghost reading-timeline-prev'),next=btn('Next ›',()=>move(1),'ghost reading-timeline-next');prev.disabled=timelinePage===1;next.disabled=timelinePage===pageCount;
  for(const [button,label] of [[prev,'Previous page'],[next,'Next page']]){button.setAttribute('aria-label',label);button.setAttribute('aria-controls',grid.id)}
  const page=el('span','reading-timeline-page',timelinePage+' / '+pageCount);page.setAttribute('aria-label','Page '+timelinePage+' of '+pageCount);
  pager.append(prev,page,next);grid.append(pager);
 }
}
function restoreArticlePosition(){
 const card=[...grid.querySelectorAll('.reading-timeline-card')].find(n=>n.dataset.noteId===articleReturn.id);
 (card||grid.querySelector('.reading-article-heading'))?.focus({preventScroll:true});window.scrollTo({top:articleReturn.scrollY,behavior:'instant'});
}
function openArticleReader(id){
 if(!records.some(r=>r.id===id&&!r.deleted&&r.kind==='article'))return;
 articleReturn={id,scrollY:window.scrollY};activeArticleId=id;renderArticleReader();
 articleReader.scrollIntoView({block:'start',behavior:'instant'});articleReader.querySelector('.reading-reader-title').focus({preventScroll:true});
}
function closeArticleReader(){activeArticleId='';renderArticleReader();restoreArticlePosition()}
function renderArticleReader(){
 const r=records.find(r=>r.id===activeArticleId&&!r.deleted&&r.kind==='article'),removed=!!activeArticleId&&!r;
 if(removed)activeArticleId='';
 grid.hidden=!!r;articleReader.hidden=!r;panel.classList.toggle('reading-note-open',!!r);articleReader.replaceChildren();
 if(!r){if(removed)restoreArticlePosition();return}
 const bar=el('header','reading-reader-bar'),controls=el('div','reading-reader-controls'),tag=readingIconButton('tag','Edit tags',()=>editArticleTags(r),'reading-reader-tags');if(readingTags(r).length)tag.classList.add('has-tags');tag.title='Edit tags'+(readingTags(r).length?' · '+readingTags(r).join(', '):'');controls.append(tag,readingIconButton('edit','Edit note',()=>notebook(r),'reading-reader-edit'),readingIconButton('delete','Delete note',()=>deleteReading(r),'reading-reader-delete'));bar.append(readingIconButton('back','Back to timeline',closeArticleReader,'reading-reader-back'),controls);
 articleReader.append(bar,articleContent(r));
}
function editArticleTags(r){
 const d=dialog('Note tags');d.classList.add('reading-tags-dialog');const form=el('form','reading-form'),input=field(form,'Tags','tags',readingTags(r).join(', '));input.placeholder='e.g. Learning, Ideas';const help=el('p','sub','Separate with commas · Up to 8 tags, 32 characters each'),status=el('p','sub');status.setAttribute('role','status');form.append(help);
 const known=allReadingTags();if(known.length){const choices=el('div','reading-tag-choices');for(const tag of known)choices.append(btn(tag,()=>{const tags=readingTags({tags:input.value});if(!tags.some(t=>t.toLowerCase()===tag.toLowerCase()))input.value=[...tags,tag].join(', ');input.focus()},'ghost'));form.append(choices)}
 const actions=el('div','reading-tag-actions'),submit=el('button','action','Save tags');submit.type='submit';actions.append(btn('Cancel',()=>d.close()),submit);form.append(status,actions);d.append(form);
 d.addEventListener('close',()=>articleReader.querySelector('.reading-reader-tags')?.focus({preventScroll:true}),{once:true});
 form.addEventListener('submit',e=>{e.preventDefault();const tags=readingTags({tags:input.value});if(tags.length>8||tags.some(t=>t.length>32)){status.textContent='Use up to 8 tags, with 32 characters or fewer each.';return}if(!loadLibrary()){status.textContent=storageError;return}const current=records.find(x=>x.id===r.id);if(!current||current.deleted||current.updated!==r.updated||current.remoteRevision!==r.remoteRevision){status.textContent='This note changed. Reopen its tags to use the latest version.';return}if(JSON.stringify(tags)===JSON.stringify(readingTags(current))){d.close();return}const item={...current,tags,updated:new Date(Math.max(Date.now(),(Date.parse(current.updated)||0)+1)).toISOString()};if(save(records.map(x=>x.id===r.id?item:x),'Tags saved'))d.close();else status.textContent='Could not save tags. Your changes are still here.'});
 input.focus();
}
const shelf=el('section','reading-bookshelf'),shelfGrid=el('div','reading-shelf-grid');shelf.append(el('h2','','Bookshelf'),shelfGrid);const columns=el('div','reading-content-columns');panel.insertBefore(columns,library);panel.insertBefore(shelf,columns);columns.append(library);
function save(next,message='Saved'){if(storageError){feedback.textContent=storageError;return false}try{if(!localStorage.getItem('rex-reading-editor-backup-v1'))localStorage.setItem('rex-reading-editor-backup-v1',localStorage.getItem(key)||'[]');localStorage.setItem(key,JSON.stringify(next));records=next;render();updateSyncStatus();queueReadingSync();dispatchEvent(new CustomEvent('rex-feedback',{detail:{message,tone:'success'}}));return true}catch{feedback.textContent='Could not save. Your changes are still in the open form; check browser storage.';return false}}
function url(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
function render(){
grid.replaceChildren();shelfGrid.replaceChildren();if(timelineTag&&!allReadingTags().some(t=>t.toLowerCase()===timelineTag))timelineTag='';const q=search.value.trim().toLowerCase(),list=records.filter(r=>!r.deleted&&[r.title,r.source,r.body,r.author,...readingTags(r),...r.logs.map(l=>l.note)].join(' ').toLowerCase().includes(q)).sort((a,b)=>(b.updated||'').localeCompare(a.updated||''));const books=list.filter(r=>r.kind==='book'),articles=list.filter(r=>r.kind==='article'&&(!timelineTag||readingTags(r).some(t=>t.toLowerCase()===timelineTag))).sort((a,b)=>noteDay(b).localeCompare(noteDay(a))||(b.createdAt||b.updated||'').localeCompare(a.createdAt||a.updated||''));shelf.hidden=false;library.hidden=false;
 let shelfRow;for(const [index,r] of books.entries()){if(index%3===0){shelfRow=el('div','reading-shelf-row');shelfGrid.append(shelfRow)}const item=btn('',()=>bookPage(r),'reading-shelf-book');item.setAttribute('aria-label','Open book: '+(r.source||r.title));const jacket=el('span','reading-book-jacket');jacket.append(el('span','reading-book-mark','READING NOTES'),el('strong','',r.source||r.title),el('span','reading-book-count',bookNotes(r).length+' notes'));item.append(jacket);shelfRow.append(item)}
 renderTimeline(articles,q);
 renderArticleReader();
 feedback.textContent=storageError||''}
function dialog(heading){const d=el('dialog','reading-dialog'),h=el('div','reading-dialog-heading'),id='reading-dialog-'+crypto.randomUUID();const title=el('h2','',heading);title.id=id;d.setAttribute('aria-labelledby',id);h.append(title,btn('×',()=>d.close()));d.append(h);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();return d}
function field(form,label,name,value='',inputType='text'){const wrap=el('label','',label),input=el(inputType==='textarea'?'textarea':'input');if(input.tagName==='INPUT')input.type=inputType;input.name=name;input.value=value;wrap.append(input);form.append(wrap);return input}
function fileDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('rex-reading-files-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('files');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('Could not open attachment storage.'))})}
async function storeFiles(files){const db=await fileDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite'),items=files.map(file=>({id:crypto.randomUUID(),name:file.name,type:file.type,size:file.size}));items.forEach((item,i)=>tx.objectStore('files').put(files[i],item.id));tx.oncomplete=()=>resolve(items);tx.onerror=tx.onabort=()=>reject(Error('Could not save attachments. Check your device storage.'))})}finally{db.close()}}
async function readFile(id){const db=await fileDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files'),req=tx.objectStore('files').get(id);req.onsuccess=()=>req.result?resolve(req.result):reject(Error('Attachment not found on this device.'));req.onerror=()=>reject(Error('Could not read the attachment.'))})}finally{db.close()}}
function attachmentList(items,onRemove,preview=false){const list=el('div','reading-attachments'+(preview?' reading-attachment-gallery':''));for(const file of items||[]){const row=el('div','reading-file-row'),open=btn(preview?'Preview':'Open attachment',()=>openReadingFile(file),'reading-note-open');if(preview){const cover=btn(fileKind(file)==='image'?'▧':fileKind(file).toUpperCase(),()=>openReadingFile(file),'reading-attachment-cover');cover.setAttribute('aria-label','Preview '+file.name);row.append(cover);if(fileKind(file)==='image')loadThumbnail(file,cover,list)}const info=el('div','reading-file-info');info.append(el('span','reading-file-name',file.name),el('span','reading-file-detail',fileKind(file).toUpperCase()+' · '+Math.ceil((file.size||0)/1024)+' KB'));row.append(info,el('span','reading-file-status saved',file.blockId?'Synced to Notion':'Saved on this device'),open);if(onRemove)row.append(btn('Remove',()=>onRemove(file),'reading-file-remove'));list.append(row)}return list}
function articleContent(r){const c=el('article','reading-reader-article'),head=el('header','reading-note-head'),meta=el('div','reading-note-stamp'),date=el('time','reading-written-date',noteDay(r));date.dateTime=noteDay(r);meta.append(date);head.append(meta);const title=el('h2','reading-reader-title',r.noteTitle||r.source||r.title);title.tabIndex=-1;c.append(head,title);const tags=readingTags(r);if(tags.length){const labels=el('div','reading-note-tags');tags.forEach(t=>labels.append(el('span','reading-note-tag',t)));c.append(labels)}if(url(r.url)){const a=el('a','reading-original-link','View source ↗');a.href=url(r.url);a.target='_blank';a.rel='noopener noreferrer';c.append(a)}const content=el('div','reading-note-prose');content.append(RexReadingEditor.content(r.body,r.richBody,r.editorBody));c.append(content,attachmentList(r.attachments,null,true));return c}
function bookNotes(r){
 const notes=(r.logs||[]).filter(n=>typeof n.note==='string').map(n=>({...n,date:n.date||noteDay(r)}));
 if(r.body)notes.unshift({id:'legacy-'+r.id,date:noteDay(r),note:r.body,richNote:r.richBody,editorNote:r.editorBody});
 return notes;
}
function noteActions(edit,remove){
 const actions=el('div','reading-note-direct-actions');actions.setAttribute('role','group');actions.setAttribute('aria-label','Note actions');actions.append(readingIconButton('edit','Edit note',edit,'reading-note-edit'),readingIconButton('delete','Delete note',remove,'reading-note-delete'));return actions;
}
function journalDate(value){const date=el('time','reading-book-date',value);date.dateTime=value;return date}
function bookPage(r){
 const d=dialog(r.source||r.title);d.classList.add('reading-notebook','reading-book-reader');
 const notes=bookNotes(r),top=el('div','reading-book-top');
 const actions=el('div','reading-book-actions');actions.setAttribute('role','group');actions.setAttribute('aria-label','Book actions');const add=readingIconButton('edit','Add note',()=>{d.close();bookEntry(r)},'reading-book-add');const plus=document.createElementNS('http://www.w3.org/2000/svg','path');plus.setAttribute('d','M12 5v14M5 12h14');add.querySelector('svg').replaceChildren(plus);const discard=readingIconButton('delete','Discard book',()=>deleteReading(r,d),'reading-book-delete');const discardSvg=discard.querySelector('svg');discardSvg.setAttribute('viewBox','0 0 32 32');discardSvg.setAttribute('stroke-width','1.7');discardSvg.replaceChildren();const iconParts=[['M15.8 5H7a4 4 0 0 0-4 4v17a3 3 0 0 0 3 3h15M3 26a3 3 0 0 1 3-3h15l-.8 3 .8 3M21 16v7M9.5 16.5h4m-4 3.5h7M7.5 26h10',1.7],['M30.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',1.7],['M20.5 6.5l5 5m0-5-5 5',1.7]];for(const [data,weight]of iconParts){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',data);path.setAttribute('stroke-width',String(weight));discardSvg.append(path)};actions.append(add,discard);top.append(el('p','sub','Books · '+notes.length+' notes'),actions);d.append(top);
 const history=el('div','reading-history');let lastDate='',section;
 for(const n of [...notes].sort((a,b)=>b.date.localeCompare(a.date))){
 if(n.date!==lastDate){lastDate=n.date;section=el('section','reading-day-group');const heading=el('h3','reading-day-heading');heading.append(journalDate(n.date),el('span','reading-day-count',notes.filter(x=>x.date===n.date).length+(notes.filter(x=>x.date===n.date).length===1?' entry':' entries')));section.append(heading);history.append(section)}
 const item=el('article','reading-book-note'),head=el('header','reading-note-head'),meta=el('div','reading-note-stamp');
 meta.append(el('span','reading-note-kicker','NOTE'));head.append(meta,noteActions(()=>{d.close();bookEntry(r,n)},()=>{if(!confirm('Delete this note? This cannot be undone.'))return;const current=records.find(x=>x.id===r.id);if(!current)return;const next={...current,body:'',logs:bookNotes(current).filter(x=>x.id!==n.id),updated:new Date().toISOString()};if(save(records.map(x=>x.id===r.id?next:x))){d.close();bookPage(next)}}));
 const content=el('div','reading-note-prose');content.append(RexReadingEditor.content(n.note,n.richNote,n.editorNote));
 item.append(head,content,attachmentList((r.attachments||[]).filter(f=>(n.attachmentIds||[]).includes(f.id)),null,true));if(n.date===selectedDay)item.classList.add('selected-book-note');section.append(item)}
 if(!notes.length)history.append(el('p','sub','Add your first note, then keep writing as you read.'));d.append(history);
}
function bookEntry(r,existing){
 const d=dialog((existing?'Edit note · ':'Add note · ')+(r.source||r.title));d.classList.add('reading-notebook');const form=el('form','reading-form');d.append(form);
 const date=field(form,'Note date','date',existing?.date||day(),'date');date.required=true;date.max=day();
 const note=field(form,'Notes','note',existing?.note||'','textarea');const richNote=RexReadingEditor.attach(note,existing?.richNote,existing?.editorNote);
 const files=el('input');files.type='file';files.multiple=true;files.hidden=true;files.accept='.pdf,.doc,.docx,.txt,.epub,image/*,audio/*';form.append(files);
 const pending=[],kept=[...(existing?.attachmentIds||[])],attachmentArea=el('div','reading-note-files'),fileStatus=el('p','sub');fileStatus.setAttribute('role','status');form.append(attachmentArea,fileStatus);
 const attachButton=btn('＋ File',()=>files.click(),'reading-attach-button');attachButton.setAttribute('aria-label','Attach file');richNote.tools.prepend(attachButton);
 function renderFiles(){attachmentArea.replaceChildren();const saved=(r.attachments||[]).filter(f=>kept.includes(f.id));attachmentArea.append(attachmentList(saved,f=>{kept.splice(kept.indexOf(f.id),1);renderFiles()}));for(const [i,file]of pending.entries()){const row=el('div','reading-file-row');row.append(el('span','',file.name),btn('Remove',()=>{pending.splice(i,1);renderFiles()},'reading-file-remove'));attachmentArea.append(row);}}
 files.addEventListener('change',()=>{pending.push(...files.files);files.value='';renderFiles()});renderFiles();
 const submit=el('button','action','Save note');submit.type='submit';form.append(submit);
 form.addEventListener('submit',async e=>{e.preventDefault();if(!note.value.trim())return richNote.editor.commands.focus();if(pending.some(f=>f.size>20*1024*1024)||pending.reduce((n,f)=>n+f.size,0)>20*1024*1024){fileStatus.textContent='Keep new files within 20 MiB total.';return}let current=records.find(x=>x.id===r.id);if(!current||current.deleted||current.updated!==r.updated){fileStatus.textContent='This book changed while you were editing. Your draft is still here; copy it before reopening the book.';return}if(!existing&&bookNotes(current).length>=40){fileStatus.textContent='A book can hold up to 40 notes. Your draft is still open.';return}if(pendingBytes([...(current.attachments||[]),...pending])>20*1024*1024){fileStatus.textContent='Keep pending files within 20 MiB total.';return}if((current.attachments||[]).length+pending.length>10){fileStatus.textContent='A book can hold up to 10 attachments.';return}
 submit.disabled=true;try{const rich=richNote.html(),doc=richNote.document(),added=pending.length?await storeFiles(pending):[];current=records.find(x=>x.id===r.id);if(!current||current.deleted||current.updated!==r.updated)throw Error('This book changed. Your draft is retained; reopen the book before saving.');const n={...existing,id:existing?.id||crypto.randomUUID(),date:date.value,note:note.value,richNote:rich,editorNote:doc,attachmentIds:[...kept,...added.map(f=>f.id)]},logs=existing?bookNotes(current).map(x=>x.id===existing.id?n:x):[...bookNotes(current),n],item={...current,body:'',logs,attachments:[...(current.attachments||[]),...added],updated:new Date().toISOString()};if(save(records.map(x=>x.id===current.id?item:x))){d.close();bookPage(item)}}catch(error){fileStatus.textContent=error.message}finally{submit.disabled=false}});
}
function addBook(){
 const d=dialog('Add book'),form=el('form','reading-form');d.append(form);const name=field(form,'Book title','bookName','');name.required=true;name.maxLength=200;name.placeholder='Enter book title';const submit=el('button','action','Add to bookshelf');submit.type='submit';form.append(submit);
 form.addEventListener('submit',e=>{e.preventDefault();const title=name.value.trim();if(!title)return name.focus();const now=new Date().toISOString(),item={id:crypto.randomUUID(),kind:'book',title,source:title,logs:[],body:'',status:'reading',createdAt:now,updated:now};if(save([...records,item]))d.close()});
}
function notebook(r){
 const d=dialog(r?'Edit article note':'Write note');d.classList.add('reading-notebook');const form=el('form','reading-form');d.append(form);
 const source=field(form,'Article title','source',r?.source||r?.title||'');source.maxLength=200;source.required=true;
 const date=field(form,'Note date','writtenDate',r?.writtenDate||day(),'date');date.required=true;date.max=day();
 const sourceArea=el('fieldset','reading-source-area');sourceArea.append(el('legend','','Article source (optional)'));form.append(sourceArea);
 const link=field(sourceArea,'Source link','url',r?.url||'','url');link.addEventListener('input',()=>link.setCustomValidity(''));
 const files=field(sourceArea,'Upload files (PDF, Word, images)','files','','file');files.multiple=true;files.accept='.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.ogg';const fileHint=el('p','sub','Up to 10 attachments, 20 MiB total pending upload. Attachments sync when Notion is connected.');let pendingFiles=[],keptFiles=[...(r?.attachments||[])];const sourceButtons=el('div','reading-source-buttons'),fileSelection=el('div','reading-pending-files');files.closest('label').classList.add('reading-file-picker');const pickFiles=(accept)=>{files.accept=accept;files.click()};sourceButtons.append(btn('Images',()=>pickFiles('image/*'),'reading-source-tab'),btn('Audio',()=>pickFiles('audio/*'),'reading-source-tab'),btn('Files',()=>pickFiles('.pdf,.doc,.docx,.txt,.epub'),'reading-source-tab'),btn('Links',()=>{link.closest('label').hidden=!link.closest('label').hidden;if(!link.closest('label').hidden)link.focus()},'reading-source-tab'));sourceArea.prepend(sourceButtons);sourceArea.append(fileSelection);function renderPending(){fileSelection.replaceChildren();for(const [i,file]of pendingFiles.entries()){const row=el('div','reading-file-row');row.append(el('span','',file.name+' · '+Math.ceil(file.size/1024)+' KB'),el('span','reading-file-status pending','Pending'),btn('Remove',()=>{pendingFiles.splice(i,1);renderPending()},'reading-file-remove'));fileSelection.append(row)}}files.addEventListener('change',()=>{pendingFiles.push(...files.files);files.value='';renderPending()});sourceArea.append(fileHint);const oldFiles=el('div');function renderSaved(){oldFiles.replaceChildren(attachmentList(keptFiles,file=>{keptFiles=keptFiles.filter(x=>x.id!==file.id);renderSaved();fileHint.textContent='Attachment removed. Save your note to apply.'}))}renderSaved();sourceArea.append(oldFiles);sourceArea.append(el('p','reading-source-help','Selected files are pending until you save. Saved attachments show their sync status.'));

 const note=field(form,'Notes','body',r?.body||'','textarea');const richNote=RexReadingEditor.attach(note,r?.richBody,r?.editorBody);
 link.closest('label').hidden=!link.value;
 const submit=el('button','action','Save note');submit.type='submit';form.append(submit);
 form.addEventListener('submit',async e=>{e.preventDefault();
 if(!source.value.trim())return source.focus();if(!note.value.trim())return note.focus();if(link.value&&!url(link.value)){link.setCustomValidity('Enter an HTTP or HTTPS link.');link.reportValidity();return}
 const selectedFiles=[...pendingFiles];if(pendingBytes([...keptFiles,...selectedFiles])>20*1024*1024||keptFiles.length+selectedFiles.length>10){fileHint.textContent='Choose up to 10 files with at most 20 MiB pending upload.';return}submit.disabled=true;submit.textContent='Saving…';fileHint.textContent='Saving note and attachments…';let added=[];try{if(selectedFiles.length)added=await storeFiles(selectedFiles)}catch(error){fileHint.textContent=error.message;submit.disabled=false;submit.textContent='Retry save';return}
 if(!loadLibrary()){fileHint.textContent=storageError;submit.disabled=false;return}
 const base=r&&records.find(record=>record.id===r.id);
 if(r&&(!base||base.deleted||base.updated!==r.updated||base.remoteRevision!==r.remoteRevision)){
  fileHint.textContent='This article changed while you were editing. Your draft is still open; copy it before reopening the article.';
  submit.disabled=false;submit.textContent='Save note';return;
 }
 const now=new Date().toISOString(),item={...base,id:base?.id||crypto.randomUUID(),title:source.value.trim(),source:source.value.trim(),noteTitle:source.value.trim(),kind:'article',writtenDate:base?.writtenDate||date.value,createdAt:base?.createdAt||now,updated:now,status:base?.status||'reading',url:link.value,body:note.value,logs:base?.logs||[]};
 item.richBody=richNote.html();item.editorBody=richNote.document();item.writtenDate=date.value;item.attachments=[...keptFiles,...added];
 if(save(base?records.map(x=>x.id===base.id?item:x):[...records,item])){d.close()}else{submit.disabled=false;fileHint.textContent='Could not save your note. Check storage and retry.'}
 });
}

let readingConnected=false,readingSyncBusy=false,readingSyncTimer,readingMigrationDone=false,readingSyncError="",readingSyncedAt=0;
let readingOrigin='https://rex-notion-calendar.xren0220.workers.dev',readingConnectionAbort=new AbortController();
const readingKey={value:''},readingSummary={textContent:''},readingSyncMessage={textContent:''};
function adoptReadingConnection(){
 let origin='',access='';try{access=sessionStorage.getItem('arcane-session-password')||'';const address=document.getElementById('gateway')?.value||localStorage.getItem('arcane-notion-gateway')||readingOrigin;const url=new URL(address);if(url.protocol!=='https:'||url.username||url.password)throw Error();origin=url.origin}catch{access=''}
 if(access===readingKey.value&&(!access||origin===readingOrigin))return false;
 clearTimeout(readingSyncTimer);readingConnectionAbort.abort();readingConnectionAbort=new AbortController();readingOrigin=origin||readingOrigin;readingKey.value=access;readingConnected=false;readingMigrationDone=false;readingSyncError='';readingSyncedAt=0;return true;
}
adoptReadingConnection();
const syncStrip=el('div','reading-sync-strip'),syncLabel=el('span'),syncRetry=btn('Retry',()=>{if(!readingConnected&&readingKey.value){readingLastRefresh=0;restoreReadingConnection()}else syncReading()},'ghost');syncStrip.setAttribute('role','status');syncStrip.setAttribute('aria-live','polite');syncStrip.append(syncLabel,syncRetry);title.append(syncStrip);
function updateSyncStatus(){const pending=records.filter(readingDirty).length;let state,text;if(readingSyncBusy){state='syncing';text='Syncing to Notion…'}else if(!navigator.onLine){state='pending';text=pending?'Offline · '+pending+' pending':'Offline · Saved on this device'}else if(readingSyncError){state='error';text='Sync failed · Changes kept on this device'}else if(!readingConnected){state='local';text=pending?'Saved on this device · '+pending+' pending':'Notion not connected'}else if(pending){state='pending';text='Saved on this device · '+pending+' pending'}else{state='synced';text='Synced to Notion'+(readingSyncedAt?' · '+new Date(readingSyncedAt).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}):'')}syncStrip.dataset.state=state;syncLabel.textContent=text;syncRetry.hidden=!(state==='error'||state==='pending');syncRetry.disabled=readingSyncBusy||!navigator.onLine;syncStrip.title=readingSyncError||text;dispatchEvent(new CustomEvent('rex-reading-updated'));}
addEventListener('offline',updateSyncStatus);addEventListener('online',updateSyncStatus);
async function readingRequest(path,options={}){const connectionSignal=readingConnectionAbort.signal;const response=await fetch(readingOrigin+'/api/reading'+path,{...options,signal:readingConnectionAbort.signal,headers:{'X-Arcane-Key':readingKey.value},cache:'no-store'});let data;try{data=await response.json()}catch{throw Error('Invalid gateway response. Check the reading service.')}if(connectionSignal.aborted)throw Error('Notion connection changed.');if(!response.ok)throw Error(data.error&& !/[\u3400-\u9fff]/.test(data.error)?data.error:'Notion request failed ('+response.status+'). Check the access key and database permissions.');return data}
function readingDirty(r){return !r.remoteRevision||r.syncedUpdated!==r.updated}
function queueReadingSync(){readingSyncError="";updateSyncStatus();clearTimeout(readingSyncTimer);if(readingConnected)readingSyncTimer=setTimeout(()=>syncReading(),500)}
async function syncReading(){
 if(readingSyncBusy)return;if(!readingConnected){window.RexOpenConnections?.('notion');return}
 const syncSignal=readingConnectionAbort.signal;readingSyncBusy=true;readingSyncError='';updateSyncStatus();readingSummary.textContent='Notion · Syncing…';
 try{
  if(!loadLibrary())throw Error(storageError);
  if(!readingMigrationDone){await readingRequest('/migrate',{method:'POST',body:new FormData()});readingMigrationDone=true;}
  const before=await readingRequest('/records');if(!Array.isArray(before.records)||before.complete!==true)throw Error('Could not load reading records.');
  const remoteBefore=new Map(before.records.map(r=>[r.id,r]));
  if(!loadLibrary())throw Error(storageError);
  const failures=[];
  for(const original of [...records].filter(readingDirty)){
   if(!loadLibrary())throw Error(storageError);
   const latest=records.find(r=>r.id===original.id);
   if(!latest||latest.updated!==original.updated||!readingDirty(latest))continue;
   try{
    const remote=remoteBefore.get(original.id);
    if(remote?.deleted){
     if(!original.deleted)throw Error('Deleted on another device. Your local draft is retained.');
     records=records.map(r=>r.id===original.id?{...remote,syncedUpdated:remote.updated}:r);
     localStorage.setItem(key,JSON.stringify(records));
     continue;
    }
    if(remote&&original.remoteRevision&&remote.remoteRevision!==original.remoteRevision)
     throw Error('Changed on another device. Your local version is retained.');
    readingSyncMessage.textContent='Syncing: '+original.title;
    const payload={...original,editorClientVersion:1,body:original.body||'',logs:original.logs||[],attachments:original.attachments||[]};delete payload.syncedUpdated;delete payload.notionUrl;delete payload.remotePageId;
    const form=new FormData();form.append('record',JSON.stringify(payload));let bytes=0;
    for(const f of payload.attachments){if(f.blockId)continue;const blob=await readFile(f.id);bytes+=blob.size;if(bytes>20*1024*1024)throw Error('Keep pending attachments below 20 MiB per note.');form.append('files',blob,f.id)}
    const result=await readingRequest('/records',{method:'POST',body:form});if(result.record?.id!==original.id||!result.record.remoteRevision)throw Error('Invalid sync response.');
    if(!loadLibrary())throw Error(storageError);
    if(original.tags!==undefined&&JSON.stringify(readingTags(original))!==JSON.stringify(readingTags(result.record))){records=records.map(r=>r.id===original.id?{...r,remoteRevision:result.record.remoteRevision,remotePageId:result.record.remotePageId}:r);localStorage.setItem(key,JSON.stringify(records));throw Error('The reading service needs the tags update. Tags are kept on this device.')}
    const current=records.find(r=>r.id===original.id);
    if(current?.updated===original.updated)records=records.map(r=>r.id===original.id?{...result.record,syncedUpdated:original.updated}:r);
    else if(current)records=records.map(r=>r.id===original.id?{...r,remoteRevision:result.record.remoteRevision,remotePageId:result.record.remotePageId}:r);
    localStorage.setItem(key,JSON.stringify(records));
   }catch(error){if(syncSignal.aborted)throw error;failures.push(original.title+' · '+error.message)}
  }
  const remote=await readingRequest('/records');if(!Array.isArray(remote.records)||remote.complete!==true)throw Error('Notion records could not be fully loaded. Please retry.');
  if(!loadLibrary())throw Error(storageError);
  const map=new Map(records.map(r=>[r.id,r]));for(const r of remote.records){if(!r||typeof r.id!=='string'||!Array.isArray(r.logs))continue;const local=map.get(r.id);if(!local||!readingDirty(local))map.set(r.id,{...r,syncedUpdated:r.updated})}
  records=[...map.values()];localStorage.setItem(key,JSON.stringify(records));render();if(failures.length)throw Error(failures.join(' / '));readingSummary.textContent='Notion · Connected';readingSyncMessage.textContent='Synced · '+remote.records.filter(r=>!r.deleted).length+' reading records';feedback.textContent='Synced to Notion';readingSyncedAt=Date.now();readingSyncError='';
 }catch(error){readingSyncError=readingKey.value?error.message:'';readingSummary.textContent='Notion · Retry needed';readingSyncMessage.textContent=error.message+' · Local notes are retained.';feedback.textContent='Saved on this device · Notion sync incomplete';}
 finally{readingSyncBusy=false;updateSyncStatus();if(!syncSignal.aborted&&readingConnected&&!readingSyncError&&records.some(readingDirty))queueReadingSync()}
}
function fileKind(file){const name=(file.name||'').toLowerCase(),type=file.type||'';return type.startsWith('image/')||/\.(png|jpe?g|gif|webp|avif|bmp|svg)$/.test(name)?'image':type==='application/pdf'||name.endsWith('.pdf')?'pdf':type.startsWith('audio/')||/\.(mp3|wav|m4a|ogg)$/.test(name)?'audio':type==='text/plain'||/\.(txt|md)$/.test(name)?'text':(name.split('.').pop()||'file').slice(0,8)}
async function readingBlob(file){try{return await readFile(file.id)}catch{const record=records.find(r=>(r.attachments||[]).some(f=>f.id===file.id));if(!record?.remotePageId||!file.blockId)throw Error('Attachment unavailable on this device. Connect to Notion and retry.');if(!readingConnected)throw Error('Connect to Notion to open cloud attachments.');const signal=readingConnectionAbort.signal;const response=await fetch(readingOrigin+'/api/reading/media?page='+encodeURIComponent(record.remotePageId)+'&file='+encodeURIComponent(file.id),{headers:{'X-Arcane-Key':readingKey.value},cache:'no-store',signal});if(!response.ok)throw Error('Could not load the attachment. Please retry.');const blob=await response.blob();if(signal.aborted)throw Error('Notion connection changed.');return blob}}
function releaseWhenRemoved(node,href){const observer=new MutationObserver(()=>{if(!node.isConnected){URL.revokeObjectURL(href);observer.disconnect()}});observer.observe(document.body,{childList:true,subtree:true})}
function loadThumbnail(file,cover,list){
 const load=async()=>{try{const blob=await readingBlob(file);if(!list.isConnected)return;const href=URL.createObjectURL(blob),img=el('img');img.alt=file.name;img.loading='lazy';img.src=href;img.addEventListener('error',()=>{img.remove();cover.textContent='IMAGE'},{once:true});cover.replaceChildren(img);releaseWhenRemoved(cover,href)}catch{cover.textContent='IMAGE';cover.title='Click to load preview'}};
 if(typeof IntersectionObserver==='undefined'){setTimeout(load,0);return}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();cleanup.disconnect();load()}});observer.observe(cover);const cleanup=new MutationObserver(()=>{if(!list.isConnected){observer.disconnect();cleanup.disconnect()}});cleanup.observe(document.body,{childList:true,subtree:true});
}
async function openReadingFile(file){
 const d=dialog(file.name);d.classList.add('reading-file-preview');const status=el('p','reading-preview-status','Loading preview…'),stage=el('div','reading-preview-stage');status.setAttribute('role','status');d.append(status,stage);
 const load=async()=>{status.textContent='Loading preview…';stage.replaceChildren();try{const blob=await readingBlob(file);if(!d.isConnected)return;const kind=fileKind(file),safeBlob=kind==='pdf'?new Blob([blob],{type:'application/pdf'}):kind==='image'?new Blob([blob],{type:/^image\/(png|jpeg|gif|webp|avif|bmp|svg\+xml)$/.test(blob.type)?blob.type:'image/png'}):blob,href=URL.createObjectURL(safeBlob);releaseWhenRemoved(d,href);
 if(kind==='image'){const img=el('img');img.alt=file.name;img.src=href;img.addEventListener('error',()=>status.textContent='This image could not be displayed. Download it to view.');stage.append(img)}
 else if(kind==='pdf'){const frame=el('iframe');frame.title='PDF preview: '+file.name;frame.src=href;stage.append(frame);status.textContent='If the PDF does not appear on your device, use Open in new tab.'}
 else if(kind==='audio'){const audio=el('audio');audio.controls=true;audio.src=href;stage.append(audio)}
 else if(kind==='text'){stage.append(el('pre','',await blob.slice(0,200000).text()));if(blob.size>200000)status.textContent='Showing the first 200 KB. Download to read the full file.'}
 else status.textContent='Preview is not available for this file type. Download to open it in your app.';
 if(status.textContent==='Loading preview…')status.textContent='';const actions=el('div','reading-preview-actions'),download=el('a','reading-file-download','Download');download.href=href;download.download=file.name;actions.append(download);if(['image','pdf'].includes(kind)){const full=el('a','reading-file-download','Open in new tab ↗');full.href=href;full.target='_blank';full.rel='noopener noreferrer';actions.prepend(full)}stage.append(actions);
 }catch(error){if(!d.isConnected)return;status.textContent=error.message;stage.append(btn('Retry preview',load,'reading-note-open'))}};await load();
}

function deleteReading(r,dialog){
 const current=records.find(x=>x.id===r.id);if(!current)return;
 const deleted={id:current.id,kind:current.kind,title:current.title,body:'',logs:[],attachments:[],deleted:true,updated:new Date().toISOString(),remoteRevision:current.remoteRevision,remotePageId:current.remotePageId};
 if(save(records.map(x=>x.id===r.id?deleted:x),'Deleted')){dialog?.close();feedback.textContent='Deleted.';}
}
addEventListener('storage',e=>{if(e.key!==key)return;loadLibrary();render();updateSyncStatus()});

let readingLastRefresh=0,readingRestoreBusy=false;
async function restoreReadingConnection(){
 if(adoptReadingConnection())readingLastRefresh=0;
 if(!readingKey.value){updateSyncStatus();return}
 if(document.visibilityState==='hidden'||readingSyncBusy||readingRestoreBusy)return;
 if(Date.now()-readingLastRefresh<30000)return;
 const attemptSignal=readingConnectionAbort.signal;readingLastRefresh=Date.now();readingRestoreBusy=true;
 try{if(!readingConnected){const status=await readingRequest('/status');if(status.editorSchemaVersion!==1)throw Error('The reading service needs the editor update. Local notes are retained.');readingConnected=true;}await syncReading();}
 catch(error){if(attemptSignal===readingConnectionAbort.signal){readingSyncError=readingKey.value?error.message:'';readingSummary.textContent='Notion · Retry needed';readingSyncMessage.textContent=error.message+' · Local notes are retained.';}}
 finally{readingRestoreBusy=false;updateSyncStatus();if(attemptSignal!==readingConnectionAbort.signal){readingLastRefresh=0;restoreReadingConnection()}}
}
addEventListener('rex-notion-connection-changed',()=>{adoptReadingConnection();readingLastRefresh=0;updateSyncStatus();restoreReadingConnection()});
addEventListener('focus',restoreReadingConnection);
addEventListener('online',()=>{readingLastRefresh=0;restoreReadingConnection();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')restoreReadingConnection();});
setInterval(restoreReadingConnection,60000);
updateSyncStatus();

render();
restoreReadingConnection();
if(location.hash==='#reading')entry.click();
})();



