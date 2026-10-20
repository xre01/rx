(()=>{
'use strict';
const key='rex-reading-library-v1',main=document.querySelector('main'),nav=document.querySelector('.rex-sidebar-nav');if(!main||!nav)return;
const day=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-')};
let records=[],storageError='';try{const data=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(data))throw Error();records=data.filter(r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&Array.isArray(r.logs))}catch{storageError='Reading storage could not be loaded. Existing data has not been overwritten.'}
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const btn=(text,fn,cls='ghost')=>{const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n};
const panel=el('section','panelview reading-panel');panel.id='reading';main.append(panel);
const entry=btn('Reading',()=>{document.querySelectorAll('.panelview').forEach(p=>p.classList.toggle('active',p===panel));nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===entry);b.setAttribute('aria-current',b===entry?'page':'false')});window.scrollTo({top:0,behavior:'instant'})},'');entry.dataset.sideView='reading';const readingIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');readingIcon.setAttribute('viewBox','0 0 24 24');readingIcon.setAttribute('fill','none');readingIcon.setAttribute('stroke','currentColor');readingIcon.setAttribute('stroke-width','1.6');readingIcon.setAttribute('stroke-linecap','round');readingIcon.setAttribute('stroke-linejoin','round');readingIcon.setAttribute('aria-hidden','true');readingIcon.innerHTML='<path d="M12 6.5C9.5 4.8 6.5 4.2 3 5v14c3.5-.8 6.5-.2 9 1.5 2.5-1.7 5.5-2.3 9-1.5V5c-3.5-.8-6.5-.2-9 1.5Zm0 0v14M6 8.5c1.2-.1 2.2.1 3 .5m-3 3c1.2-.1 2.2.1 3 .5m6-3.5c.8-.4 1.8-.6 3-.5m-3 4c.8-.4 1.8-.6 3-.5"/>';entry.prepend(readingIcon);nav.insertBefore(entry,nav.lastElementChild);
const header=el('header','reading-heading'),title=el('div');title.append(el('div','eyebrow','REX · READING JOURNAL'),el('h1','','Reading notes'),el('p','sub','Keep the thoughts you find in your reading.'));header.append(title);panel.append(header);
const feedback=el('p','sub');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');panel.append(feedback);
const library=el('section','card reading-library');panel.append(library);
const toolbar=el('div','reading-toolbar'),search=el('input');search.type='search';search.placeholder='Search notes or books';search.setAttribute('aria-label','Search reading notes');
const type=el('select'),status=el('select');for(const [value,label]of [['','All sources'],['book','Books'],['article','Article']]){const o=el('option','',label);o.value=value;type.append(o)}for(const [value,label]of [['','All statuses'],['want','Want to read'],['reading','Reading'],['done','Finished'],['paused','Paused']]){const o=el('option','',label);o.value=value;status.append(o)}type.setAttribute('aria-label','Reading type');status.setAttribute('aria-label','Reading status');
const searchWrap=el('div','reading-search-wrap'),searchIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');searchIcon.setAttribute('viewBox','0 0 24 24');searchIcon.setAttribute('fill','none');searchIcon.setAttribute('stroke','currentColor');searchIcon.setAttribute('stroke-width','1.7');searchIcon.setAttribute('stroke-linecap','round');searchIcon.setAttribute('aria-hidden','true');const searchCircle=document.createElementNS('http://www.w3.org/2000/svg','circle');searchCircle.setAttribute('cx','10.5');searchCircle.setAttribute('cy','10.5');searchCircle.setAttribute('r','6.5');const searchHandle=document.createElementNS('http://www.w3.org/2000/svg','path');searchHandle.setAttribute('d','M16 16 L21 21');searchIcon.append(searchCircle,searchHandle);searchWrap.append(searchIcon,search);const actionGroup=el('div','reading-action-group');actionGroup.append(btn('Write note',()=>notebook(),'action'),btn('Books',()=>addBook(),'ghost reading-add-book'));toolbar.append(searchWrap,actionGroup);library.append(toolbar);const grid=el('div','reading-grid');library.append(grid);[search,type,status].forEach(n=>n.addEventListener('input',render));
let calendarMonth=day().slice(0,7),selectedDay='',calendarToday=day();
function refreshReadingDay(){const current=day();if(current===calendarToday)return;if(calendarMonth===calendarToday.slice(0,7))calendarMonth=current.slice(0,7);if(selectedDay===calendarToday)selectedDay=current;calendarToday=current;render()}
setInterval(refreshReadingDay,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshReadingDay()});
const calendar=el('section','reading-calendar');calendar.setAttribute('aria-label','Notes calendar');panel.insertBefore(toolbar,library);panel.insertBefore(calendar,library);
function noteDays(r){return r.kind==='book'?bookNotes(r).map(n=>n.date):[noteDay(r)]}
function noteDay(r){return r.writtenDate||r.createdAt?.slice(0,10)||r.updated?.slice(0,10)||''}
function renderCalendar(){
 calendar.replaceChildren();const bar=el('div','reading-calendar-bar'),controls=el('div','reading-calendar-controls');
 const move=delta=>{const [y,m]=calendarMonth.split('-').map(Number);calendarMonth=new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7);renderCalendar()};
 const prev=btn('‹',()=>move(-1),'reading-calendar-arrow'),next=btn('›',()=>move(1),'reading-calendar-arrow');prev.setAttribute('aria-label','Previous month');next.setAttribute('aria-label','Next month');
 controls.append(prev,el('strong','',new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(calendarMonth+'-01T12:00:00Z'))),next);const todayButton=btn('Today',()=>{calendarMonth=day().slice(0,7);selectedDay=day();render()},'reading-calendar-today');todayButton.setAttribute('aria-label','Return to today');const calendarActions=el('div','reading-calendar-actions');calendarActions.append(todayButton,btn('Hide notes',()=>{selectedDay='';render()},'reading-calendar-reset'));bar.append(controls,calendarActions);calendar.append(bar);
 const week=el('div','reading-calendar-week');for(const w of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])week.append(el('span','',w));calendar.append(week);
 const days=el('div','reading-calendar-days'),[year,month]=calendarMonth.split('-').map(Number),offset=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7,count=new Date(Date.UTC(year,month,0)).getUTCDate();
 const counts=new Map();for(const r of records.filter(r=>!r.deleted&&r.kind==='article')){for(const date of noteDays(r))counts.set(date,(counts.get(date)||0)+1)}
 for(let i=0;i<offset;i++)days.append(el('span'));
 for(let n=1;n<=count;n++){const date=calendarMonth+'-'+String(n).padStart(2,'0'),total=counts.get(date)||0,b=btn(String(n),()=>{selectedDay=selectedDay===date?'':date;render()},'reading-calendar-day');if(total)b.classList.add('has-notes');if(date===day()){b.classList.add('is-today');b.setAttribute('aria-current','date');b.append(el('small','reading-today-label','Today'))}if(date===selectedDay)b.classList.add('is-selected');b.setAttribute('aria-label',date+(date===day()?' · Today':'')+' · '+(total?total+' notes':'No entries'));b.setAttribute('aria-pressed',String(date===selectedDay));b.title=date+' · '+(total?total+' notes':'No entries');days.append(b)}calendar.append(days);
 calendar.append(el('p','reading-calendar-legend','● Article notes · No dot means no entries'));
 if(selectedDay)calendar.append(el('p','reading-calendar-selection',selectedDay+' · '+(counts.get(selectedDay)||0)+' article notes'));
}
const shelf=el('section','reading-bookshelf'),shelfGrid=el('div','reading-shelf-grid');shelf.append(el('h2','','Bookshelf'),shelfGrid);const columns=el('div','reading-content-columns');panel.insertBefore(columns,library);panel.insertBefore(shelf,calendar);columns.append(library);
const names={want:'Want to read',reading:'Reading',done:'Finished',paused:'Paused'};
function save(next){if(storageError){feedback.textContent=storageError;return false}try{if(!localStorage.getItem('rex-reading-editor-backup-v1'))localStorage.setItem('rex-reading-editor-backup-v1',localStorage.getItem(key)||'[]');localStorage.setItem(key,JSON.stringify(next));records=next;updateReadingXp();render();updateSyncStatus();queueReadingSync();return true}catch{feedback.textContent='Could not save. Your changes are still in the open form; check browser storage.';return false}}
function url(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
function card(r){const c=el('article','reading-note-card');const body=el('div','reading-item-body');const note=r.kind==='book'?bookNotes(r).filter(n=>!selectedDay||n.date===selectedDay).map(n=>n.note).join('\n\n'):r.body||r.logs.map(l=>l.note).filter(Boolean).join('\n\n');body.append(el('span','reading-note-source',(r.kind==='article'?'Article':'Books')+' · '+(r.source||r.title)+(r.author?' / '+r.author:'')),btn(r.noteTitle||r.title,()=>r.kind==='book'?bookPage(r):notebook(r),'reading-note-title'),el('p','reading-note-excerpt',note||'Start writing your thoughts.'));const foot=el('div','reading-note-footer');foot.append(el('time','reading-written-date','Written on '+(r.writtenDate||r.createdAt?.slice(0,10)||r.updated?.slice(0,10)||'No date')),btn(r.kind==='book'?'Open book →':'Edit note →',()=>r.kind==='book'?bookPage(r):notebook(r),'reading-note-open'));body.append(foot);c.append(body);return c}
function render(){renderCalendar();
grid.replaceChildren();shelfGrid.replaceChildren();const q=search.value.trim().toLowerCase(),list=records.filter(r=>!r.deleted&&(r.kind==='book'||!selectedDay||noteDays(r).includes(selectedDay))&&(!type.value||r.kind===type.value)&&(!status.value||r.status===status.value)&&[r.title,r.source,r.body,r.author,r.tags,...r.logs.map(l=>l.note)].join(' ').toLowerCase().includes(q)).sort((a,b)=>(b.updated||'').localeCompare(a.updated||''));const books=list.filter(r=>r.kind==='book'),articles=list.filter(r=>r.kind==='article');shelf.hidden=false;library.hidden=!selectedDay;
 for(const r of books){const item=btn('',()=>bookPage(r),'reading-shelf-book');item.setAttribute('aria-label','Open book: '+(r.source||r.title));const jacket=el('span','reading-book-jacket');jacket.append(el('span','reading-book-mark','READING NOTES'),el('strong','',r.source||r.title),el('span','reading-book-count',bookNotes(r).length+' notes'));item.append(jacket);shelfGrid.append(item)}
 grid.append(el('h2','reading-article-heading',selectedDay?selectedDay+' · Article notes':'Article notes'));if(selectedDay&&!articles.length)grid.append(el('p','sub','No article notes for this date.'));articles.forEach(r=>grid.append(articleContent(r)));
 feedback.textContent=storageError||''}
function dialog(heading){const d=el('dialog','reading-dialog'),h=el('div','reading-dialog-heading'),id='reading-dialog-'+crypto.randomUUID();const title=el('h2','',heading);title.id=id;d.setAttribute('aria-labelledby',id);h.append(title,btn('×',()=>d.close()));d.append(h);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();return d}
function field(form,label,name,value='',inputType='text'){const wrap=el('label','',label),input=el(inputType==='textarea'?'textarea':'input');if(input.tagName==='INPUT')input.type=inputType;input.name=name;input.value=value;wrap.append(input);form.append(wrap);return input}
function choice(form,label,name,value,options){const wrap=el('label','',label),input=el('select');input.name=name;for(const [v,t]of options){const o=el('option','',t);o.value=v;input.append(o)}input.value=value;wrap.append(input);form.append(wrap);return input}
function fileDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('rex-reading-files-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('files');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('Could not open attachment storage.'))})}
async function storeFiles(files){const db=await fileDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite'),items=files.map(file=>({id:crypto.randomUUID(),name:file.name,type:file.type,size:file.size}));items.forEach((item,i)=>tx.objectStore('files').put(files[i],item.id));tx.oncomplete=()=>resolve(items);tx.onerror=tx.onabort=()=>reject(Error('Could not save attachments. Check your device storage.'))})}finally{db.close()}}
async function readFile(id){const db=await fileDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files'),req=tx.objectStore('files').get(id);req.onsuccess=()=>req.result?resolve(req.result):reject(Error('Attachment not found on this device.'));req.onerror=()=>reject(Error('Could not read the attachment.'))})}finally{db.close()}}
function attachmentList(items,onRemove){const list=el('div','reading-attachments');for(const file of items||[]){const row=el('div','reading-file-row'),open=btn('Open attachment',()=>openReadingFile(file,open,row),'reading-note-open');row.append(el('span','',file.name+' · '+Math.ceil(file.size/1024)+' KB'),el('span','reading-file-status saved',file.blockId?'Synced to Notion':'Saved on this device'),open);if(onRemove)row.append(btn('Remove',()=>onRemove(file),'reading-file-remove'));list.append(row)}return list}
function articleContent(r){const c=el('article','reading-article-content reading-journal-card'),head=el('header','reading-note-head'),meta=el('div','reading-note-stamp'),date=el('time','reading-written-date',noteDay(r));date.dateTime=noteDay(r);meta.append(el('span','reading-note-kicker','ARTICLE NOTES'),date);head.append(meta,noteActions(()=>notebook(r),()=>deleteReading(r)));c.append(head,el('h3','',r.noteTitle||r.source||r.title));if(url(r.url)){const a=el('a','reading-original-link','View source ↗');a.href=url(r.url);a.target='_blank';a.rel='noopener noreferrer';c.append(a)}const content=el('div','reading-note-prose');content.append(RexReadingEditor.content(r.body,r.richBody,r.editorBody));c.append(content,attachmentList(r.attachments),recallPrompt());return c}
function bookNotes(r){
 const notes=(r.logs||[]).filter(n=>typeof n.note==='string').map(n=>({...n,date:n.date||noteDay(r)}));
 if(r.body)notes.unshift({id:'legacy-'+r.id,date:noteDay(r),note:r.body,richNote:r.richBody,editorNote:r.editorBody});
 return notes;
}
function noteActions(edit,remove){
 const menu=el('details','reading-note-actions'),toggle=el('summary','','•••');toggle.setAttribute('aria-label','Note actions');
 const options=el('div','reading-note-action-list');options.append(btn('Edit note',()=>{menu.open=false;edit()},'reading-note-action'),btn('Delete note',()=>{menu.open=false;remove()},'reading-note-action reading-note-delete'));menu.append(toggle,options);
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.open=false;toggle.focus()}});return menu;
}
function recallPrompt(){
 const recall=el('details','reading-recall'),toggle=el('summary','','Take a moment to recall');
 recall.append(toggle,el('p','','Look away from your notes. What is one idea you remember, and how would you explain it in your own words?'));return recall;
}
function bookPage(r){
 const d=dialog(r.source||r.title);d.classList.add('reading-notebook','reading-book-reader');
 const notes=bookNotes(r),top=el('div','reading-book-top');
 top.append(el('p','sub','Books · '+notes.length+' notes'),btn('+ Add note',()=>{d.close();bookEntry(r)},'action'),btn('Delete book',()=>deleteReading(r,d),'reading-note-open'));d.append(top);
 const history=el('div','reading-history');
 for(const n of [...notes].sort((a,b)=>b.date.localeCompare(a.date))){
 const item=el('article','reading-book-note'),head=el('header','reading-note-head'),meta=el('div','reading-note-stamp'),date=el('time','reading-book-date',n.date);date.dateTime=n.date;
 meta.append(el('span','reading-note-kicker','READING JOURNAL'),date);head.append(meta,noteActions(()=>{d.close();bookEntry(r,n)},()=>{if(!confirm('Delete this note? This cannot be undone.'))return;const current=records.find(x=>x.id===r.id);if(!current)return;const next={...current,body:'',logs:bookNotes(current).filter(x=>x.id!==n.id),updated:new Date().toISOString()};if(save(records.map(x=>x.id===r.id?next:x))){d.close();bookPage(next)}}));
 const content=el('div','reading-note-prose');content.append(RexReadingEditor.content(n.note,n.richNote,n.editorNote));
 const foot=el('footer','reading-note-bottom');foot.append(el('span','reading-note-number','NOTE '+String(notes.indexOf(n)+1).padStart(2,'0')),recallPrompt());
 item.append(head,content,attachmentList((r.attachments||[]).filter(f=>(n.attachmentIds||[]).includes(f.id))),foot);if(n.date===selectedDay)item.classList.add('selected-book-note');history.append(item)}
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
 form.addEventListener('submit',async e=>{e.preventDefault();if(!note.value.trim())return richNote.editor.commands.focus();if(pending.some(f=>f.size>20*1024*1024)||pending.reduce((n,f)=>n+f.size,0)>20*1024*1024){fileStatus.textContent='Keep new files within 20 MiB total.';return}let current=records.find(x=>x.id===r.id);if(!current||current.deleted||current.updated!==r.updated){fileStatus.textContent='This book changed while you were editing. Your draft is still here; copy it before reopening the book.';return}if((current.attachments||[]).length+pending.length>10){fileStatus.textContent='A book can hold up to 10 attachments.';return}
 submit.disabled=true;try{const rich=richNote.html(),doc=richNote.document(),added=pending.length?await storeFiles(pending):[];current=records.find(x=>x.id===r.id);if(!current||current.deleted||current.updated!==r.updated)throw Error('This book changed. Your draft is retained; reopen the book before saving.');const n={...existing,id:existing?.id||crypto.randomUUID(),date:date.value,note:note.value,richNote:rich,editorNote:doc,attachmentIds:[...kept,...added.map(f=>f.id)]},logs=existing?bookNotes(current).map(x=>x.id===existing.id?n:x):[...bookNotes(current),n],item={...current,body:'',logs,attachments:[...(current.attachments||[]),...added],updated:new Date().toISOString()};if(save(records.map(x=>x.id===current.id?item:x))){d.close();bookPage(item)}}catch(error){fileStatus.textContent=error.message}finally{submit.disabled=false}});
}
function addBook(){
 const d=dialog('Add book'),form=el('form','reading-form');d.append(form);const name=field(form,'Book title','bookName','');name.required=true;name.maxLength=200;name.placeholder='Enter book title';const submit=el('button','action','Add to bookshelf');submit.type='submit';form.append(submit);
 form.addEventListener('submit',e=>{e.preventDefault();const title=name.value.trim();if(!title)return name.focus();const now=new Date().toISOString(),item={id:crypto.randomUUID(),kind:'book',title,source:title,logs:[],body:'',status:'reading',createdAt:now,updated:now};if(save([...records,item]))d.close()});
}
function notebook(r,initialKind='article'){
 const d=dialog(r?'Edit article note':'Write note');d.classList.add('reading-notebook');const form=el('form','reading-form');d.append(form);
 const kind=choice(form,'Type','kind','article',[['article','Article']]);kind.closest('label').hidden=true;
 const books=records.filter(x=>!x.deleted&&x.kind==='book'),pick=choice(form,'Choose a book','bookId','',[['','+ Add a new book'],...books.map(x=>[x.id,x.source||x.title])]);
 const source=field(form,'Article title','source',r?.source||r?.title||'');source.maxLength=200;source.required=true;
 const date=field(form,'Note date','writtenDate',r?.writtenDate||day(),'date');date.required=true;date.max=day();
 const sourceArea=el('fieldset','reading-source-area');sourceArea.append(el('legend','','Article source (optional)'));form.append(sourceArea);
 const link=field(sourceArea,'Source link','url',r?.url||'','url');link.addEventListener('input',()=>link.setCustomValidity(''));
 const files=field(sourceArea,'Upload files (PDF, Word, images)','files','','file');files.multiple=true;files.accept='.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.ogg';const fileHint=el('p','sub','Up to 10 attachments, 20 MB each. Attachments sync when Notion is connected.');let pendingFiles=[],keptFiles=[...(r?.attachments||[])];const sourceButtons=el('div','reading-source-buttons'),fileSelection=el('div','reading-pending-files');files.closest('label').classList.add('reading-file-picker');const pickFiles=(accept)=>{files.accept=accept;files.click()};sourceButtons.append(btn('Images',()=>pickFiles('image/*'),'reading-source-tab'),btn('Audio',()=>pickFiles('audio/*'),'reading-source-tab'),btn('Files',()=>pickFiles('.pdf,.doc,.docx,.txt,.epub'),'reading-source-tab'),btn('Links',()=>{link.closest('label').hidden=!link.closest('label').hidden;if(!link.closest('label').hidden)link.focus()},'reading-source-tab'));sourceArea.prepend(sourceButtons);sourceArea.append(fileSelection);function renderPending(){fileSelection.replaceChildren();for(const [i,file]of pendingFiles.entries()){const row=el('div','reading-file-row');row.append(el('span','',file.name+' · '+Math.ceil(file.size/1024)+' KB'),el('span','reading-file-status pending','Pending'),btn('Remove',()=>{pendingFiles.splice(i,1);renderPending()},'reading-file-remove'));fileSelection.append(row)}}files.addEventListener('change',()=>{pendingFiles.push(...files.files);files.value='';renderPending()});sourceArea.append(fileHint);const oldFiles=el('div');function renderSaved(){oldFiles.replaceChildren(attachmentList(keptFiles,file=>{keptFiles=keptFiles.filter(x=>x.id!==file.id);renderSaved();fileHint.textContent='Attachment removed. Save your note to apply.'}))}renderSaved();sourceArea.append(oldFiles);sourceArea.append(el('p','reading-source-help','Selected files are pending until you save. Saved attachments show their sync status.'));

 const note=field(form,'Notes','body',r?.body||'','textarea');const richNote=RexReadingEditor.attach(note,r?.richBody,r?.editorBody);
 function toggle(){const book=kind.value==='book',selected=books.find(x=>x.id===pick.value);sourceArea.hidden=book;pick.closest('label').hidden=!book;source.closest('label').hidden=book&&!!selected;source.required=!(book&&selected);link.closest('label').hidden=book||!link.value;link.disabled=book;files.closest('label').hidden=book;files.disabled=book;fileHint.hidden=book;oldFiles.hidden=book}
 kind.addEventListener('change',toggle);pick.addEventListener('change',toggle);toggle();
 const submit=el('button','action','Save note');submit.type='submit';form.append(submit);
 form.addEventListener('submit',async e=>{e.preventDefault();const book=kind.value==='book',selected=book?books.find(x=>x.id===pick.value):null;
 if(!selected&&!source.value.trim())return source.focus();if(!note.value.trim())return note.focus();if(!book&&link.value&&!url(link.value)){link.setCustomValidity('Enter an HTTP or HTTPS link.');link.reportValidity();return}
 const selectedFiles=book?[]:[...pendingFiles];if(selectedFiles.some(f=>f.size>20*1024*1024)||keptFiles.length+selectedFiles.length>10){fileHint.textContent='Choose up to 10 files, no larger than 20 MB each.';return}submit.disabled=true;submit.textContent='Saving…';fileHint.textContent='Saving note and attachments…';let added=[];try{if(selectedFiles.length)added=await storeFiles(selectedFiles)}catch(error){fileHint.textContent=error.message;submit.disabled=false;submit.textContent='Retry save';return}
 const now=new Date().toISOString(),base=selected||r,item={...base,id:base?.id||crypto.randomUUID(),title:selected?selected.title:source.value.trim(),source:selected?(selected.source||selected.title):source.value.trim(),noteTitle:selected?selected.title:source.value.trim(),kind:kind.value,writtenDate:base?.writtenDate||date.value,createdAt:base?.createdAt||now,updated:now,status:base?.status||'reading',url:book?'':link.value,body:book?'':note.value,logs:book?[...(base?bookNotes(base):[]),{id:crypto.randomUUID(),date:date.value,note:note.value}]:base?.logs||[]};
 if(!book){item.richBody=richNote.html();item.editorBody=richNote.document();item.writtenDate=date.value;item.attachments=[...keptFiles,...added]}
 if(save(base?records.map(x=>x.id===base.id?item:x):[...records,item])){d.close();if(book)bookPage(item)}else{submit.disabled=false;fileHint.textContent='Could not save your note. Check storage and retry.'}
 });
}

let readingConnected=false,readingSyncBusy=false,readingSyncTimer,readingMigrationDone=false,readingSyncError="",readingSyncedAt=0;
const readingOrigin='https://rex-notion-calendar.xren0220.workers.dev';
const readingSettings=el('details','reading-sync-settings'),readingSummary=el('summary','','Notion · Disconnected'),readingKey=el('input');
readingKey.type='password';readingKey.placeholder='Your existing Notion gateway access key';readingKey.autocomplete='off';readingKey.setAttribute('aria-label','Notion gateway access key');
const readingSyncMessage=el('p','sub');readingSyncMessage.setAttribute('role','status');
const readingSyncActions=el('div','reading-sync-actions');readingSyncActions.append(btn('Connect & sync',async()=>{if(!readingKey.value)return readingKey.focus();try{const status=await readingRequest('/status');if(status.editorSchemaVersion!==1)throw Error('The reading service needs the editor update. Local notes are retained.');readingConnected=true;sessionStorage.setItem('rex-reading-access-key',readingKey.value);readingSummary.textContent='Notion · Connected';await syncReading()}catch(error){readingConnected=false;readingSummary.textContent='Notion · Connection failed';readingSyncMessage.textContent=error.message;readingSyncError=error.message;updateSyncStatus()}},'ghost'),btn('Retry sync',()=>syncReading(),'ghost'),btn('Disconnect',()=>{readingConnected=false;readingKey.value='';sessionStorage.removeItem('rex-reading-access-key');readingSummary.textContent='Notion · Disconnected';readingSyncMessage.textContent='Disconnected. Local notes and Notion records are retained.';readingSyncError='';updateSyncStatus()},'ghost'));
readingSettings.append(readingSummary,readingKey,readingSyncActions,readingSyncMessage);panel.append(readingSettings);
try{readingKey.value=sessionStorage.getItem('rex-reading-access-key')||sessionStorage.getItem('arcane-session-password')||document.getElementById('arcanePassword')?.value||''}catch{}
const syncStrip=el('div','reading-sync-strip'),syncLabel=el('span'),syncRetry=btn('Retry',()=>{if(!readingConnected&&readingKey.value){readingLastRefresh=0;restoreReadingConnection()}else syncReading()},'ghost');syncStrip.setAttribute('role','status');syncStrip.setAttribute('aria-live','polite');syncStrip.append(syncLabel,syncRetry);header.append(syncStrip);
function updateSyncStatus(){const pending=records.filter(readingDirty).length;let state,text;if(readingSyncBusy){state='syncing';text='Syncing to Notion…'}else if(!navigator.onLine){state='pending';text=pending?'Offline · '+pending+' pending':'Offline · Saved on this device'}else if(readingSyncError){state='error';text='Sync failed · Changes kept on this device'}else if(!readingConnected){state='local';text=pending?'Saved on this device · '+pending+' pending':'Notion not connected'}else if(pending){state='pending';text='Saved on this device · '+pending+' pending'}else{state='synced';text='Synced to Notion'+(readingSyncedAt?' · '+new Date(readingSyncedAt).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}):'')}syncStrip.dataset.state=state;syncLabel.textContent=text;syncRetry.hidden=!(state==='error'||state==='pending');syncRetry.disabled=readingSyncBusy||!navigator.onLine;syncStrip.title=readingSyncError||text;dispatchEvent(new CustomEvent('rex-reading-updated'));}
addEventListener('offline',updateSyncStatus);addEventListener('online',updateSyncStatus);
async function readingRequest(path,options={}){const response=await fetch(readingOrigin+'/api/reading'+path,{...options,headers:{'X-Arcane-Key':readingKey.value},cache:'no-store'});let data;try{data=await response.json()}catch{throw Error('Invalid gateway response. Check the reading service.')}if(!response.ok)throw Error(data.error&& !/[\u3400-\u9fff]/.test(data.error)?data.error:'Notion request failed ('+response.status+'). Check the access key and database permissions.');return data}
function readingDirty(r){return !r.remoteRevision||r.syncedUpdated!==r.updated}
function queueReadingSync(){readingSyncError="";updateSyncStatus();clearTimeout(readingSyncTimer);if(readingConnected)readingSyncTimer=setTimeout(()=>syncReading(),500)}
async function syncReading(){
 if(readingSyncBusy)return;if(!readingConnected){readingSettings.open=true;readingSyncMessage.textContent='Enter your access key and connect first.';return}
 readingSyncBusy=true;readingSyncError='';updateSyncStatus();readingSummary.textContent='Notion · Syncing…';
 try{
  if(!readingMigrationDone){await readingRequest('/migrate',{method:'POST',body:new FormData()});readingMigrationDone=true;}
  const before=await readingRequest('/records');if(!Array.isArray(before.records)||before.complete!==true)throw Error('Could not load reading records.');for(const removed of before.records.filter(r=>r.deleted)){const i=records.findIndex(r=>r.id===removed.id);if(i>=0)records[i]={...removed,syncedUpdated:removed.updated};}localStorage.setItem(key,JSON.stringify(records));updateReadingXp();
  const remoteBefore=new Map(before.records.map(r=>[r.id,r]));
  for(const local of records.filter(readingDirty)){const remote=remoteBefore.get(local.id);if(remote&&!remote.deleted&&local.remoteRevision&&remote.remoteRevision!==local.remoteRevision)throw Error('This note changed in Notion and on this device: '+local.title+'. Your local version is retained. Resolve both versions before retrying.');}
  for(const original of [...records].filter(readingDirty)){
   readingSyncMessage.textContent='Syncing: '+original.title;
   const payload={...original,editorClientVersion:1,body:original.body||'',logs:original.logs||[],attachments:original.attachments||[]};delete payload.syncedUpdated;delete payload.notionUrl;delete payload.remotePageId;
   const form=new FormData();form.append('record',JSON.stringify(payload));let bytes=0;
   for(const f of payload.attachments){if(f.blockId)continue;const blob=await readFile(f.id);bytes+=blob.size;if(bytes>20*1024*1024)throw Error('Keep pending attachments below 20 MiB per note.');form.append('files',blob,f.id)}
   const result=await readingRequest('/records',{method:'POST',body:form});if(!result.record?.id)throw Error('Invalid sync response.');
   const current=records.find(r=>r.id===original.id);
   if(current?.updated===original.updated)records=records.map(r=>r.id===original.id?{...result.record,syncedUpdated:original.updated}:r);
   else if(current)records=records.map(r=>r.id===original.id?{...r,remoteRevision:result.record.remoteRevision,remotePageId:result.record.remotePageId}:r);
   localStorage.setItem(key,JSON.stringify(records));
  }
  const remote=await readingRequest('/records');if(!Array.isArray(remote.records)||remote.complete!==true)throw Error('Notion records could not be fully loaded. Please retry.');
  const map=new Map(records.map(r=>[r.id,r]));for(const r of remote.records){if(!r||typeof r.id!=='string'||!Array.isArray(r.logs))continue;const local=map.get(r.id);if(!local||!readingDirty(local))map.set(r.id,{...r,syncedUpdated:r.updated})}
  records=[...map.values()];localStorage.setItem(key,JSON.stringify(records));updateReadingXp();render();readingSummary.textContent='Notion · Connected';readingSyncMessage.textContent='Synced · '+remote.records.filter(r=>!r.deleted).length+' reading records';feedback.textContent='Synced to Notion';readingSyncedAt=Date.now();readingSyncError='';
 }catch(error){readingSyncError=error.message;readingSummary.textContent='Notion · Retry needed';readingSyncMessage.textContent=error.message+' · Local notes are retained.';feedback.textContent='Saved on this device · Notion sync incomplete';}
 finally{readingSyncBusy=false;updateSyncStatus();if(readingConnected&&!readingSyncError&&records.some(readingDirty))queueReadingSync()}
}
async function openReadingFile(file,button,row){
 button.disabled=true;
 try{
 let blob;try{blob=await readFile(file.id)}catch{const record=records.find(r=>(r.attachments||[]).some(f=>f.id===file.id));if(!record?.remotePageId||!file.blockId)throw Error('Attachment unavailable on this device. Connect to Notion and retry.');if(!readingConnected)throw Error('Connect to Notion to open cloud attachments.');const response=await fetch(readingOrigin+'/api/reading/media?page='+encodeURIComponent(record.remotePageId)+'&file='+encodeURIComponent(file.id),{headers:{'X-Arcane-Key':readingKey.value},cache:'no-store'});if(!response.ok)throw Error('Could not load the attachment. Please retry.');blob=await response.blob()}
 const href=URL.createObjectURL(blob),link=el('a','reading-file-download','Open / download');link.href=href;link.target='_blank';link.rel='noopener';if(blob.type!=='application/pdf'&&!blob.type.startsWith('image/'))link.download=file.name;row.append(link);button.remove();setTimeout(()=>URL.revokeObjectURL(href),300000);
 }catch(error){button.disabled=false;button.textContent=error.message}
}

function updateReadingXp(){try{window.RexReadingXP?.reconcile(records,day())}catch{feedback.textContent='Notes saved. XP could not update; please retry.'}}
function deleteReading(r,dialog){
 const current=records.find(x=>x.id===r.id);if(!current)return;
 const deleted={id:current.id,kind:current.kind,title:current.title,body:'',logs:[],attachments:[],deleted:true,updated:new Date().toISOString(),remoteRevision:current.remoteRevision,remotePageId:current.remotePageId};
 if(save(records.map(x=>x.id===r.id?deleted:x))){dialog?.close();feedback.textContent='Deleted. Reading XP has been recalculated.';}
}
addEventListener('storage',e=>{if(e.key!==key)return;try{const next=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(next)){records=next;updateReadingXp();render();updateSyncStatus()}}catch{}});

let readingLastRefresh=0,readingRestoreBusy=false;
async function restoreReadingConnection(){
 if(document.visibilityState==='hidden'||readingSyncBusy||readingRestoreBusy||!readingKey.value)return;
 if(Date.now()-readingLastRefresh<30000)return;
 readingLastRefresh=Date.now();readingRestoreBusy=true;
 try{if(!readingConnected){const status=await readingRequest('/status');if(status.editorSchemaVersion!==1)throw Error('The reading service needs the editor update. Local notes are retained.');readingConnected=true;sessionStorage.setItem('rex-reading-access-key',readingKey.value);}await syncReading();}
 catch(error){readingSyncError=error.message;readingSummary.textContent='Notion · Retry needed';readingSyncMessage.textContent=error.message+' · Local notes are retained.';}
 finally{readingRestoreBusy=false;updateSyncStatus()}
}
addEventListener('focus',restoreReadingConnection);
addEventListener('online',()=>{readingLastRefresh=0;restoreReadingConnection();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')restoreReadingConnection();});
setInterval(restoreReadingConnection,60000);
updateSyncStatus();
updateReadingXp();
render();
restoreReadingConnection();
if(location.hash==='#reading')entry.click();
})();



