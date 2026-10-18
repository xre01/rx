(()=>{
'use strict';
const key='rex-reading-library-v1',main=document.querySelector('main'),nav=document.querySelector('.rex-sidebar-nav');if(!main||!nav)return;
const day=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-')};
let records=[],storageError='';try{const data=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(data))throw Error();records=data.filter(r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&Array.isArray(r.logs))}catch{storageError='Reading storage could not be loaded. Existing data has not been overwritten.'}
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const btn=(text,fn,cls='ghost')=>{const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n};
const panel=el('section','panelview reading-panel');panel.id='reading';main.append(panel);
const entry=btn('Reading',()=>{document.querySelectorAll('.panelview').forEach(p=>p.classList.toggle('active',p===panel));nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===entry);b.setAttribute('aria-current',b===entry?'page':'false')});window.scrollTo({top:0,behavior:'instant'})},'');entry.dataset.sideView='reading';const readingIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');readingIcon.setAttribute('viewBox','0 0 24 24');readingIcon.setAttribute('fill','none');readingIcon.setAttribute('stroke','currentColor');readingIcon.setAttribute('stroke-width','1.6');readingIcon.setAttribute('stroke-linecap','round');readingIcon.setAttribute('stroke-linejoin','round');readingIcon.setAttribute('aria-hidden','true');readingIcon.innerHTML='<path d="M12 6.5C9.5 4.8 6.5 4.2 3 5v14c3.5-.8 6.5-.2 9 1.5 2.5-1.7 5.5-2.3 9-1.5V5c-3.5-.8-6.5-.2-9 1.5Zm0 0v14M6 8.5c1.2-.1 2.2.1 3 .5m-3 3c1.2-.1 2.2.1 3 .5m6-3.5c.8-.4 1.8-.6 3-.5m-3 4c.8-.4 1.8-.6 3-.5"/>';entry.prepend(readingIcon);nav.insertBefore(entry,nav.lastElementChild);
const header=el('header','reading-heading'),title=el('div');title.append(el('div','eyebrow','REX · READING JOURNAL'),el('h1','','读书笔记'),el('p','sub','读过的文字，留下的想法。'));header.append(title);panel.append(header);
const feedback=el('p','sub');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');panel.append(feedback);
const library=el('section','card reading-library');panel.append(library);
const toolbar=el('div','reading-toolbar'),search=el('input');search.type='search';search.placeholder='搜索笔记或书名';search.setAttribute('aria-label','搜索读书笔记');
const type=el('select'),status=el('select');for(const [value,label]of [['','全部来源'],['book','书籍'],['article','文章']]){const o=el('option','',label);o.value=value;type.append(o)}for(const [value,label]of [['','All statuses'],['want','Want to read'],['reading','Reading'],['done','Finished'],['paused','Paused']]){const o=el('option','',label);o.value=value;status.append(o)}type.setAttribute('aria-label','Reading type');status.setAttribute('aria-label','Reading status');
const searchWrap=el('div','reading-search-wrap'),searchIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');searchIcon.setAttribute('viewBox','0 0 24 24');searchIcon.setAttribute('fill','none');searchIcon.setAttribute('stroke','currentColor');searchIcon.setAttribute('stroke-width','1.7');searchIcon.setAttribute('stroke-linecap','round');searchIcon.setAttribute('aria-hidden','true');const searchCircle=document.createElementNS('http://www.w3.org/2000/svg','circle');searchCircle.setAttribute('cx','10.5');searchCircle.setAttribute('cy','10.5');searchCircle.setAttribute('r','6.5');const searchHandle=document.createElementNS('http://www.w3.org/2000/svg','path');searchHandle.setAttribute('d','M16 16 L21 21');searchIcon.append(searchCircle,searchHandle);searchWrap.append(searchIcon,search);const actionGroup=el('div','reading-action-group');actionGroup.append(btn('写笔记',()=>notebook(),'action'),btn('书籍',()=>addBook(),'ghost reading-add-book'));toolbar.append(searchWrap,actionGroup);library.append(toolbar);const grid=el('div','reading-grid');library.append(grid);[search,type,status].forEach(n=>n.addEventListener('input',render));
let calendarMonth=day().slice(0,7),selectedDay='';
const calendar=el('section','reading-calendar');calendar.setAttribute('aria-label','笔记日历');panel.insertBefore(toolbar,library);panel.insertBefore(calendar,library);
function noteDays(r){return r.kind==='book'?bookNotes(r).map(n=>n.date):[noteDay(r)]}
function noteDay(r){return r.writtenDate||r.createdAt?.slice(0,10)||r.updated?.slice(0,10)||''}
function renderCalendar(){
 calendar.replaceChildren();const bar=el('div','reading-calendar-bar'),controls=el('div','reading-calendar-controls');
 const move=delta=>{const [y,m]=calendarMonth.split('-').map(Number);calendarMonth=new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7);renderCalendar()};
 const prev=btn('‹',()=>move(-1),'reading-calendar-arrow'),next=btn('›',()=>move(1),'reading-calendar-arrow');prev.setAttribute('aria-label','上个月');next.setAttribute('aria-label','下个月');
 controls.append(prev,el('strong','',calendarMonth.replace('-',' 年 ')+' 月'),next);bar.append(controls,btn('收起笔记',()=>{selectedDay='';render()},'reading-calendar-reset'));calendar.append(bar);
 const week=el('div','reading-calendar-week');for(const w of ['一','二','三','四','五','六','日'])week.append(el('span','',w));calendar.append(week);
 const days=el('div','reading-calendar-days'),[year,month]=calendarMonth.split('-').map(Number),offset=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7,count=new Date(Date.UTC(year,month,0)).getUTCDate();
 const counts=new Map();for(const r of records.filter(r=>r.kind==='article')){for(const date of noteDays(r))counts.set(date,(counts.get(date)||0)+1)}
 for(let i=0;i<offset;i++)days.append(el('span'));
 for(let n=1;n<=count;n++){const date=calendarMonth+'-'+String(n).padStart(2,'0'),total=counts.get(date)||0,b=btn(String(n),()=>{selectedDay=selectedDay===date?'':date;render()},'reading-calendar-day');if(total)b.classList.add('has-notes');if(date===day())b.classList.add('is-today');if(date===selectedDay)b.classList.add('is-selected');b.setAttribute('aria-label',date+'，'+(total?total+' 篇笔记':'无记录'));b.setAttribute('aria-pressed',String(date===selectedDay));b.title=date+' · '+(total?total+' 篇笔记':'无记录');days.append(b)}calendar.append(days);
 calendar.append(el('p','reading-calendar-legend','● 有文章笔记 · 无圆点表示暂无记录'));
 if(selectedDay)calendar.append(el('p','reading-calendar-selection',selectedDay+' · '+(counts.get(selectedDay)||0)+' 篇文章笔记'));
}
const shelf=el('section','reading-bookshelf'),shelfGrid=el('div','reading-shelf-grid');shelf.append(el('h2','','书架'),shelfGrid);const columns=el('div','reading-content-columns');panel.insertBefore(columns,library);panel.insertBefore(shelf,calendar);columns.append(library);
const names={want:'Want to read',reading:'Reading',done:'Finished',paused:'Paused'};
function save(next){if(storageError){feedback.textContent=storageError;return false}try{localStorage.setItem(key,JSON.stringify(next));records=next;render();queueReadingSync();return true}catch{feedback.textContent='Could not save. Your changes are still in the open form; check browser storage.';return false}}
function url(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
function card(r){const c=el('article','reading-note-card');const body=el('div','reading-item-body');const note=r.kind==='book'?bookNotes(r).filter(n=>!selectedDay||n.date===selectedDay).map(n=>n.note).join('\n\n'):r.body||r.logs.map(l=>l.note).filter(Boolean).join('\n\n');body.append(el('span','reading-note-source',(r.kind==='article'?'文章':'书籍')+' · '+(r.source||r.title)+(r.author?' / '+r.author:'')),btn(r.noteTitle||r.title,()=>r.kind==='book'?bookPage(r):notebook(r),'reading-note-title'),el('p','reading-note-excerpt',note||'还没有写下正文，点击开始记录你的想法。'));const foot=el('div','reading-note-footer');foot.append(el('time','reading-written-date','写于 '+(r.writtenDate||r.createdAt?.slice(0,10)||r.updated?.slice(0,10)||'日期未记录')),btn(r.kind==='book'?'打开书籍 →':'编辑笔记 →',()=>r.kind==='book'?bookPage(r):notebook(r),'reading-note-open'));body.append(foot);c.append(body);return c}
function render(){renderCalendar();
grid.replaceChildren();shelfGrid.replaceChildren();const q=search.value.trim().toLowerCase(),list=records.filter(r=>(r.kind==='book'||!selectedDay||noteDays(r).includes(selectedDay))&&(!type.value||r.kind===type.value)&&(!status.value||r.status===status.value)&&[r.title,r.source,r.body,r.author,r.tags,...r.logs.map(l=>l.note)].join(' ').toLowerCase().includes(q)).sort((a,b)=>(b.updated||'').localeCompare(a.updated||''));const books=list.filter(r=>r.kind==='book'),articles=list.filter(r=>r.kind==='article');shelf.hidden=false;library.hidden=!selectedDay;
 for(const r of books){const item=btn('',()=>bookPage(r),'reading-shelf-book');item.setAttribute('aria-label','打开书籍：'+(r.source||r.title));const jacket=el('span','reading-book-jacket');jacket.append(el('span','reading-book-mark','READING NOTES'),el('strong','',r.source||r.title),el('span','reading-book-count',bookNotes(r).length+' 篇笔记'));item.append(jacket);shelfGrid.append(item)}
 grid.append(el('h2','reading-article-heading',selectedDay?selectedDay+' · 文章笔记':'文章笔记'));if(selectedDay&&!articles.length)grid.append(el('p','sub','当天暂无文章笔记'));articles.forEach(r=>grid.append(articleContent(r)));
 feedback.textContent=storageError||(readingConnected?'Notion 已连接 · '+records.filter(readingDirty).length+' 条待同步':'本地草稿 · 尚未连接 Notion')}
function dialog(heading){const d=el('dialog','reading-dialog'),h=el('div','reading-dialog-heading'),id='reading-dialog-'+crypto.randomUUID();const title=el('h2','',heading);title.id=id;d.setAttribute('aria-labelledby',id);h.append(title,btn('×',()=>d.close()));d.append(h);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();return d}
function field(form,label,name,value='',inputType='text'){const wrap=el('label','',label),input=el(inputType==='textarea'?'textarea':'input');if(input.tagName==='INPUT')input.type=inputType;input.name=name;input.value=value;wrap.append(input);form.append(wrap);return input}
function choice(form,label,name,value,options){const wrap=el('label','',label),input=el('select');input.name=name;for(const [v,t]of options){const o=el('option','',t);o.value=v;input.append(o)}input.value=value;wrap.append(input);form.append(wrap);return input}
function fileDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('rex-reading-files-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('files');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('无法打开附件存储'))})}
async function storeFiles(files){const db=await fileDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite'),items=files.map(file=>({id:crypto.randomUUID(),name:file.name,type:file.type,size:file.size}));items.forEach((item,i)=>tx.objectStore('files').put(files[i],item.id));tx.oncomplete=()=>resolve(items);tx.onerror=tx.onabort=()=>reject(Error('附件保存失败，请检查本机存储空间'))})}finally{db.close()}}
async function readFile(id){const db=await fileDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files'),req=tx.objectStore('files').get(id);req.onsuccess=()=>req.result?resolve(req.result):reject(Error('此设备上找不到附件'));req.onerror=()=>reject(Error('附件读取失败'))})}finally{db.close()}}
function attachmentList(items,onRemove){const list=el('div','reading-attachments');for(const file of items||[]){const row=el('div','reading-file-row'),open=btn('打开附件',()=>openReadingFile(file,open,row),'reading-note-open');row.append(el('span','',file.name+' · '+Math.ceil(file.size/1024)+' KB'),el('span','reading-file-status saved',file.blockId?'已同步到 Notion':'已保存到本机'),open);if(onRemove)row.append(btn('移除',()=>onRemove(file),'reading-file-remove'));list.append(row)}return list}
function articleContent(r){const c=el('article','reading-article-content');c.append(el('h3','',r.source||r.title),el('time','reading-written-date',noteDay(r)));if(url(r.url)){const a=el('a','reading-original-link','查看原文 ↗');a.href=url(r.url);a.target='_blank';a.rel='noopener noreferrer';c.append(a)}c.append(attachmentList(r.attachments));c.append(el('p','reading-article-body',r.body||r.logs.map(n=>n.note).filter(Boolean).join('\n\n')||'暂无正文'),btn('编辑笔记',()=>notebook(r),'reading-note-open'));return c}
function bookNotes(r){
 const notes=(r.logs||[]).filter(n=>typeof n.note==='string').map(n=>({...n,date:n.date||noteDay(r)}));
 if(r.body)notes.unshift({id:'legacy-'+r.id,date:noteDay(r),note:r.body});
 return notes;
}
function bookPage(r){
 const d=dialog(r.source||r.title);d.classList.add('reading-notebook');
 const notes=bookNotes(r),top=el('div','reading-book-top');
 top.append(el('p','sub','书籍 · '+notes.length+' 篇笔记'),btn('＋ 追加笔记',()=>{d.close();bookEntry(r)},'action'));d.append(top);
 const history=el('div','reading-history');
 for(const n of [...notes].sort((a,b)=>b.date.localeCompare(a.date))){
 const item=el('article','reading-book-note');item.append(el('time','reading-book-date',n.date),el('p','',n.note),btn('编辑',()=>{d.close();bookEntry(r,n)},'reading-note-open'));if(n.date===selectedDay)item.classList.add('selected-book-note');history.append(item)}
 if(!notes.length)history.append(el('p','sub','从第一篇笔记开始，之后可以按日期继续追加。'));d.append(history);
}
function bookEntry(r,existing){
 const d=dialog((existing?'编辑笔记 · ':'追加笔记 · ')+(r.source||r.title));d.classList.add('reading-notebook');const form=el('form','reading-form');d.append(form);
 const date=field(form,'笔记日期','date',existing?.date||day(),'date');date.required=true;date.max=day();
 const note=field(form,'正文','note',existing?.note||'','textarea');note.required=true;note.placeholder='今天读到哪里，有哪些摘录和想法？';
 const submit=el('button','action','保存笔记');submit.type='submit';form.append(submit);
 form.addEventListener('submit',e=>{e.preventDefault();if(!note.value.trim())return note.focus();const n={...existing,id:existing?.id||crypto.randomUUID(),date:date.value,note:note.value},logs=existing?bookNotes(r).map(x=>x.id===existing.id?n:x):[...bookNotes(r),n],item={...r,body:'',logs,updated:new Date().toISOString()};if(save(records.map(x=>x.id===r.id?item:x))){d.close();bookPage(item)}});
}
function addBook(){
 const d=dialog('添加书籍'),form=el('form','reading-form');d.append(form);const name=field(form,'书名','bookName','');name.required=true;name.maxLength=200;name.placeholder='输入书名';const submit=el('button','action','添加到书架');submit.type='submit';form.append(submit);
 form.addEventListener('submit',e=>{e.preventDefault();const title=name.value.trim();if(!title)return name.focus();const now=new Date().toISOString(),item={id:crypto.randomUUID(),kind:'book',title,source:title,logs:[],body:'',status:'reading',createdAt:now,updated:now};if(save([...records,item]))d.close()});
}
function notebook(r,initialKind='article'){
 const d=dialog(r?'编辑文章笔记':'写笔记');d.classList.add('reading-notebook');const form=el('form','reading-form');d.append(form);
 const kind=choice(form,'类型','kind','article',[['article','文章']]);kind.closest('label').hidden=true;
 const books=records.filter(x=>x.kind==='book'),pick=choice(form,'选择书籍','bookId','',[['','＋ 新建一本书'],...books.map(x=>[x.id,x.source||x.title])]);
 const source=field(form,'文章名','source',r?.source||r?.title||'');source.maxLength=200;source.required=true;
 const date=field(form,'笔记日期','writtenDate',r?.writtenDate||day(),'date');date.required=true;date.max=day();
 const sourceArea=el('fieldset','reading-source-area');sourceArea.append(el('legend','','文章来源（可选）'));form.append(sourceArea);
 const link=field(sourceArea,'原文链接','url',r?.url||'','url');link.addEventListener('input',()=>link.setCustomValidity(''));
 const files=field(sourceArea,'上传文件（PDF、Word、图片）','files','','file');files.multiple=true;files.accept='.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.ogg';const fileHint=el('p','sub','每个文件最多 20 MB，最多 10 个附件。连接 Notion 后会自动同步附件。');let pendingFiles=[],keptFiles=[...(r?.attachments||[])];const sourceButtons=el('div','reading-source-buttons'),fileSelection=el('div','reading-pending-files');files.closest('label').classList.add('reading-file-picker');const pickFiles=(accept)=>{files.accept=accept;files.click()};sourceButtons.append(btn('Images',()=>pickFiles('image/*'),'reading-source-tab'),btn('Audio',()=>pickFiles('audio/*'),'reading-source-tab'),btn('Files',()=>pickFiles('.pdf,.doc,.docx,.txt,.epub'),'reading-source-tab'),btn('Links',()=>{link.closest('label').hidden=!link.closest('label').hidden;if(!link.closest('label').hidden)link.focus()},'reading-source-tab'));sourceArea.prepend(sourceButtons);sourceArea.append(fileSelection);function renderPending(){fileSelection.replaceChildren();for(const [i,file]of pendingFiles.entries()){const row=el('div','reading-file-row');row.append(el('span','',file.name+' · '+Math.ceil(file.size/1024)+' KB'),el('span','reading-file-status pending','待保存'),btn('移除',()=>{pendingFiles.splice(i,1);renderPending()},'reading-file-remove'));fileSelection.append(row)}}files.addEventListener('change',()=>{pendingFiles.push(...files.files);files.value='';renderPending()});sourceArea.append(fileHint);const oldFiles=el('div');function renderSaved(){oldFiles.replaceChildren(attachmentList(keptFiles,file=>{keptFiles=keptFiles.filter(x=>x.id!==file.id);renderSaved();fileHint.textContent='已移除附件，点击“保存笔记”后生效。'}))}renderSaved();sourceArea.append(oldFiles);sourceArea.append(el('p','reading-source-help','选中文件后显示“待保存”；点击保存笔记后，才会显示“已保存到本机”。连接 Notion 后会显示云端同步结果。'));
 
 const note=field(form,'正文','body',r?.body||'','textarea');note.required=true;note.placeholder='写下摘录、理解，以及自己的想法……';
 function toggle(){const book=kind.value==='book',selected=books.find(x=>x.id===pick.value);sourceArea.hidden=book;pick.closest('label').hidden=!book;source.closest('label').hidden=book&&!!selected;source.required=!(book&&selected);link.closest('label').hidden=book||!link.value;link.disabled=book;files.closest('label').hidden=book;files.disabled=book;fileHint.hidden=book;oldFiles.hidden=book}
 kind.addEventListener('change',toggle);pick.addEventListener('change',toggle);toggle();
 const submit=el('button','action','保存笔记');submit.type='submit';form.append(submit);
 form.addEventListener('submit',async e=>{e.preventDefault();const book=kind.value==='book',selected=book?books.find(x=>x.id===pick.value):null;
 if(!selected&&!source.value.trim())return source.focus();if(!note.value.trim())return note.focus();if(!book&&link.value&&!url(link.value)){link.setCustomValidity('请填写 http 或 https 链接');link.reportValidity();return}
 const selectedFiles=book?[]:[...pendingFiles];if(selectedFiles.some(f=>f.size>20*1024*1024)||keptFiles.length+selectedFiles.length>10){fileHint.textContent='请将每个文件控制在 20 MB 以内，总计最多 10 个附件。';return}submit.disabled=true;submit.textContent='正在保存…';fileHint.textContent='正在保存笔记和附件，请稍候。';let added=[];try{if(selectedFiles.length)added=await storeFiles(selectedFiles)}catch(error){fileHint.textContent=error.message;submit.disabled=false;submit.textContent='重试保存';return}
 const now=new Date().toISOString(),base=selected||r,item={...base,id:base?.id||crypto.randomUUID(),title:selected?selected.title:source.value.trim(),source:selected?(selected.source||selected.title):source.value.trim(),noteTitle:selected?selected.title:source.value.trim(),kind:kind.value,writtenDate:base?.writtenDate||date.value,createdAt:base?.createdAt||now,updated:now,status:base?.status||'reading',url:book?'':link.value,body:book?'':note.value,logs:book?[...(base?bookNotes(base):[]),{id:crypto.randomUUID(),date:date.value,note:note.value}]:base?.logs||[]};
 if(!book){item.writtenDate=date.value;item.attachments=[...keptFiles,...added]}
 if(save(base?records.map(x=>x.id===base.id?item:x):[...records,item])){d.close();if(book)bookPage(item)}else{submit.disabled=false;fileHint.textContent='笔记保存失败，请检查本机存储后重试。'}
 });
}

let readingConnected=false,readingSyncBusy=false,readingSyncTimer,readingMigrationDone=false;
const readingOrigin='https://rex-notion-calendar.xren0220.workers.dev';
const readingSettings=el('details','reading-sync-settings'),readingSummary=el('summary','','Notion · 未连接'),readingKey=el('input');
readingKey.type='password';readingKey.placeholder='现有 Notion 网关通行令';readingKey.autocomplete='off';readingKey.setAttribute('aria-label','Notion 网关通行令');
const readingSyncMessage=el('p','sub','连接后，阅读记录同步到 Reading and growth 数据库。通行令只保留在本次浏览器会话中。');readingSyncMessage.setAttribute('role','status');
const readingSyncActions=el('div','reading-sync-actions');readingSyncActions.append(btn('连接并同步',async()=>{if(!readingKey.value)return readingKey.focus();try{await readingRequest('/status');readingConnected=true;sessionStorage.setItem('rex-reading-access-key',readingKey.value);readingSummary.textContent='Notion · 已连接';await syncReading()}catch(error){readingConnected=false;readingSummary.textContent='Notion · 连接失败';readingSyncMessage.textContent=error.message}},'ghost'),btn('重试同步',()=>syncReading(),'ghost'),btn('断开',()=>{readingConnected=false;readingKey.value='';sessionStorage.removeItem('rex-reading-access-key');readingSummary.textContent='Notion · 未连接';readingSyncMessage.textContent='已断开，本机笔记与 Notion 原始记录保留。'},'ghost'));
readingSettings.append(readingSummary,readingKey,readingSyncActions,readingSyncMessage);panel.append(readingSettings);
try{readingKey.value=sessionStorage.getItem('rex-reading-access-key')||sessionStorage.getItem('arcane-session-password')||document.getElementById('arcanePassword')?.value||''}catch{}
async function readingRequest(path,options={}){const response=await fetch(readingOrigin+'/api/reading'+path,{...options,headers:{'X-Arcane-Key':readingKey.value},cache:'no-store'});let data;try{data=await response.json()}catch{throw Error('网关返回无效内容，请检查阅读接口是否已部署。')}if(!response.ok)throw Error(data.error||'Notion 连接失败');return data}
function readingDirty(r){return !r.remoteRevision||r.syncedUpdated!==r.updated}
function queueReadingSync(){clearTimeout(readingSyncTimer);if(readingConnected)readingSyncTimer=setTimeout(()=>syncReading(),500)}
async function syncReading(){
 if(readingSyncBusy)return;if(!readingConnected){readingSettings.open=true;readingSyncMessage.textContent='请先输入现有通行令并连接。';return}
 readingSyncBusy=true;readingSummary.textContent='Notion · 同步中…';
 try{
  if(!readingMigrationDone){await readingRequest('/migrate',{method:'POST',body:new FormData()});readingMigrationDone=true;}
  for(const original of [...records].filter(readingDirty)){
   readingSyncMessage.textContent='正在同步：'+original.title;
   const payload={...original,body:original.body||'',logs:original.logs||[],attachments:original.attachments||[]};delete payload.syncedUpdated;delete payload.notionUrl;delete payload.remotePageId;
   const form=new FormData();form.append('record',JSON.stringify(payload));let bytes=0;
   for(const f of payload.attachments){if(f.blockId)continue;const blob=await readFile(f.id);bytes+=blob.size;if(bytes>20*1024*1024)throw Error('单篇笔记待上传附件总大小需控制在 20 MiB 内。');form.append('files',blob,f.id)}
   const result=await readingRequest('/records',{method:'POST',body:form});if(!result.record?.id)throw Error('同步回执无效');
   const current=records.find(r=>r.id===original.id);
   if(current?.updated===original.updated)records=records.map(r=>r.id===original.id?{...result.record,syncedUpdated:original.updated}:r);
   else if(current)records=records.map(r=>r.id===original.id?{...r,remoteRevision:result.record.remoteRevision,remotePageId:result.record.remotePageId}:r);
   localStorage.setItem(key,JSON.stringify(records));
  }
  const remote=await readingRequest('/records');if(!Array.isArray(remote.records)||remote.complete!==true)throw Error('Notion 记录未完整加载，请稍后重试。');
  const map=new Map(records.map(r=>[r.id,r]));for(const r of remote.records){if(!r||typeof r.id!=='string'||!Array.isArray(r.logs))continue;const local=map.get(r.id);if(!local||!readingDirty(local))map.set(r.id,{...r,syncedUpdated:r.updated})}
  records=[...map.values()];localStorage.setItem(key,JSON.stringify(records));render();readingSummary.textContent='Notion · 已连接';readingSyncMessage.textContent='同步完成 · '+remote.records.length+' 条阅读记录';feedback.textContent='已同步到 Notion';
 }catch(error){readingSummary.textContent='Notion · 待重试';readingSyncMessage.textContent=error.message+' · 本地笔记已保留。';feedback.textContent='笔记已保存在本机 · Notion 同步未完成';}
 finally{readingSyncBusy=false}
}
async function openReadingFile(file,button,row){
 button.disabled=true;
 try{
 let blob;try{blob=await readFile(file.id)}catch{const record=records.find(r=>(r.attachments||[]).some(f=>f.id===file.id));if(!record?.remotePageId||!file.blockId)throw Error('此设备上找不到附件，请连接 Notion 后重试。');if(!readingConnected)throw Error('请先连接 Notion 再打开云端附件。');const response=await fetch(readingOrigin+'/api/reading/media?page='+encodeURIComponent(record.remotePageId)+'&file='+encodeURIComponent(file.id),{headers:{'X-Arcane-Key':readingKey.value},cache:'no-store'});if(!response.ok)throw Error('云端附件读取失败，请重试。');blob=await response.blob()}
 const href=URL.createObjectURL(blob),link=el('a','reading-file-download','点击打开 / 下载');link.href=href;link.target='_blank';link.rel='noopener';if(blob.type!=='application/pdf'&&!blob.type.startsWith('image/'))link.download=file.name;row.append(link);button.remove();setTimeout(()=>URL.revokeObjectURL(href),300000);
 }catch(error){button.disabled=false;button.textContent=error.message}
}

render();
if(location.hash==='#reading')entry.click();
})();

