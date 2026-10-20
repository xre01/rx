(()=>{
'use strict';
const $=id=>document.getElementById(id),cfgKey='arcane-notion-gateway';
const grid=$('archiveGrid');
let archiveLoaded=false,archiveTruncated=false,archiveMonth=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit'}).format(new Date()).slice(0,7),archiveDay='';
const connection=$('loadArchive').closest('.card');if(connection){const settings=node('details','archive-connection');const summary=node('summary','','Notion connection');connection.before(settings);settings.append(summary,connection);}
$('archives').querySelector('p.sub').textContent='Browse your check-ins by date or search their content.';
let mediaUrls=[],revision=0,controller=null,lastPayload=null,requestRevision=0,requestController=null;
grid.classList.add('archive-grouped');
$('gateway').value=localStorage.getItem(cfgKey)||'https://rex-notion-calendar.xren0220.workers.dev';
$('arcanePassword').value=sessionStorage.getItem('arcane-session-password')||'';

function msg(text){$('archiveMessage').hidden=false;$('archiveMessage').textContent=text;}
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(cls,text){const n=node('button',cls,text);n.type='button';return n;}
function cleanMedia(){for(const url of mediaUrls)URL.revokeObjectURL(url);mediaUrls=[];}
function resetArchive(){lastPayload=null;requestRevision+=1;if(requestController)requestController.abort();requestController=null;revision+=1;if(controller)controller.abort();controller=null;grid.replaceChildren();cleanMedia();return revision;}
function assertWorker(input){const url=new URL(input);if(url.protocol!=='https:')throw new Error('Worker URL must use HTTPS');return url.origin;}
function dayKey(value){
  if(typeof value!=='string')return '';
  const match=value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/);
  if(!match)return '';
  const day=match[1],date=new Date(day+'T00:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===day?day:'';
}
function groupedRecords(records){
  const groups=new Map();
  for(const item of records){const day=dayKey(item.date);if(!groups.has(day))groups.set(day,[]);groups.get(day).push(item);}
  return [...groups].sort(([a],[b])=>!a?1:!b?-1:b.localeCompare(a));
}
async function getMedia(origin,key,path,version,signal){
  if(typeof path!=='string'||!path.startsWith('/api/media/')||path.includes('..'))throw Error('Invalid attachment address');
  const response=await fetch(origin+path,{headers:{'X-Arcane-Key':key},signal});
  if(!response.ok)throw new Error('Could not load attachment');
  const blob=await response.blob();
  if(version!==revision||signal.aborted)return null;
  const url=URL.createObjectURL(blob);mediaUrls.push(url);return url;
}
function safeLink(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null}catch{return null}}
function recordCard(item,origin,key,version,signal){
  const card=node('article','archive-entry');
  card.append(node('h3','',item.title||'Untitled'));
  card.append(node('div','meta',`${item.date||'No date'} · ${item.category||'Study'} · ${item.completed?'✓ Completed':'In progress'}`));
  if(item.minutes!=null||item.exp!=null)card.append(node('div','meta',`${item.minutes==null?'':'⏱ '+item.minutes+' min'} ${item.exp==null?'':'✧ '+item.exp+' EXP'}`));
  if(safeLink(item.url)){const link=node('a','','View in Notion ↗');link.href=safeLink(item.url);link.target='_blank';link.rel='noopener noreferrer';card.append(link);}
  for(const file of Array.isArray(item.media)?item.media:[]){
    if(!file||typeof file!=='object')continue;
    const wrap=node('div','archive-attachment');wrap.append(node('span','archive-pill',file.name||'File'));
    if(file.type==='image'||file.type==='audio'){
      const loadButton=button('ghost archive-media-load',file.type==='audio'?'Load audio':'Load image');
      loadButton.addEventListener('click',async()=>{
        if(loadButton.disabled||version!==revision)return;
        loadButton.disabled=true;loadButton.textContent='Loading…';
        try{
          const src=file.proxy?await getMedia(origin,key,file.proxy,version,signal):safeLink(file.url);
          if(version!==revision||signal.aborted)return;
          if(!src)throw new Error('Invalid link');
          const media=node(file.type==='audio'?'audio':'img');
          if(file.type==='audio')media.controls=true;else{media.alt=file.name||'Study image';media.loading='lazy';}
          media.src=src;wrap.append(media);loadButton.remove();
        }catch(error){
          if(version!==revision||signal.aborted)return;
          loadButton.disabled=false;loadButton.textContent='Retry';msg('Could not open an attachment: '+error.message);
        }
      });
      wrap.append(loadButton);
    }else if(safeLink(file.url)){const link=node('a','','Open attachment');link.href=safeLink(file.url);link.target='_blank';link.rel='noopener noreferrer';wrap.append(link);}
    if(file.proxy&&file.type!=='image'&&file.type!=='audio'){
      const open=button('ghost archive-media-load','Open attachment');open.addEventListener('click',async()=>{open.disabled=true;try{const url=await getMedia(origin,key,file.proxy,version,signal);if(!url)return;const link=node('a','','Download '+(file.name||'attachment'));link.href=url;link.download=file.name||'attachment';wrap.append(link);open.remove()}catch(error){if(version!==revision||signal.aborted)return;open.disabled=false;msg(error.message)}});wrap.append(open);
    }
    card.append(wrap);
  }
  if(Array.isArray(item.richNotes)){card.append(RexRichEditor.content('',item.richNotes));}else if(Array.isArray(item.notes))for(const text of item.notes)if(typeof text==='string')card.append(node('p','archive-note',text));
  const pageId=String(item.id||'');
  if(!Array.isArray(item.notes)&&!(item.media||[]).length&&/^[0-9a-f-]{36}$/i.test(pageId)){
    const details=button('ghost archive-details-load','View notes and attachments');card.append(details);
    details.addEventListener('click',async()=>{
      if(details.disabled||version!==revision)return;details.disabled=true;details.textContent='Loading…';
      try{const response=await fetch(origin+'/api/entries/'+pageId,{headers:{'X-Arcane-Key':key},signal});const data=await response.json();if(version!==revision||signal.aborted)return;if(!response.ok)throw Error(data.error||'Could not load record');
       const content=recordCard({...item,notes:Array.isArray(data.notes)?data.notes:[],richNotes:data.richNotes,media:Array.isArray(data.media)?data.media:[]},origin,key,version,signal);
       const heading=content.querySelector('h3'),meta=content.querySelector('.meta'),link=content.querySelector('a');heading?.remove();meta?.remove();if(link?.textContent==='View in Notion ↗')link.remove();
       const body=node('div','archive-record-details');while(content.firstChild)body.append(content.firstChild);card.append(body);details.remove();
      }catch(error){if(version!==revision||signal.aborted)return;details.disabled=false;details.textContent='Retry loading record';msg(error.message)}
    });
  }
  return card;
}
function renderArchive(groups,origin,key,version,signal){
 const records=groups.flatMap(([,items])=>items),byDay=new Map(groups),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const shell=node('section','archive-calendar-shell'),toolbar=node('div','archive-calendar-toolbar'),search=document.createElement('input');search.type='search';search.placeholder='Search notes, activities or filenames…';search.setAttribute('aria-label','Search check-in content');
 const navigation=node('div','archive-month-nav'),previous=button('','‹'),next=button('','›'),caption=node('strong');previous.setAttribute('aria-label','Previous month');next.setAttribute('aria-label','Next month');const current=button('','Today');navigation.append(previous,caption,next,current);toolbar.append(navigation,search);
 const legend=node('p','archive-calendar-legend'),week=node('div','archive-calendar-week'),days=node('div','archive-calendar-days'),status=node('p','archive-search-status'),results=node('div','archive-calendar-results');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 for(const text of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])week.append(node('span','',text));shell.append(toolbar,legend,week,days,status,results);grid.append(shell);
 let query='',searchVersion=0,timer,limit=20;const detailsCache=new Map();
 function content(item){const details=detailsCache.get(item.id)||{};return [item.title,item.date,item.category,...(Array.isArray(item.notes)?item.notes:[]),...(details.notes||[]),...(Array.isArray(item.media)?item.media:[]).map(f=>f?.name||''),...(details.media||[]).map(f=>f?.name||'')].filter(Boolean).join(' ').toLocaleLowerCase();}
 function matches(item){return !query||query.split(/\s+/).every(term=>content(item).includes(term));}
 function renderResults(){
  cleanMedia();results.replaceChildren();limit=Math.max(20,limit);const list=records.filter(item=>matches(item)&&(query||dayKey(item.date)===archiveDay));
  status.textContent=query?'Found '+list.length+' matching records':archiveDay?(archiveDay+' · '+list.length+' records'):'Select a date to view records';
  if(!archiveLoaded){status.textContent='Sync Notion to see your recorded dates';return;}
  if(!list.length){results.append(node('p','archive-empty',query?'No matching records.':archiveTruncated?'No records for this date in the loaded results.':'No records for this date.'));return;}
  for(const item of list.slice(0,limit))results.append(recordCard({...item,...detailsCache.get(item.id)},origin,key,version,signal));
  if(list.length>limit){const more=button('ghost','Load more');more.addEventListener('click',()=>{limit+=20;renderResults()});results.append(more);}
 }
 function renderDays(){
  days.replaceChildren();caption.textContent=archiveMonth.replace('-',' / ');legend.textContent=archiveLoaded?(archiveTruncated?'● Recorded · Unmarked dates may have records outside the loaded results':'● Recorded · Unmarked dates have no records'):'Not synced · Record status is not available yet';
  const offset=(new Date(archiveMonth+'-01T12:00:00Z').getUTCDay()+6)%7;for(let i=0;i<offset;i++)days.append(node('span'));
  const [y,m]=archiveMonth.split('-').map(Number),length=new Date(Date.UTC(y,m,0)).getUTCDate();
  for(let i=1;i<=length;i++){const date=archiveMonth+'-'+String(i).padStart(2,'0'),items=byDay.get(date)||[],b=button('archive-date',String(i));if(items.length)b.classList.add('has-records');if(date===today)b.classList.add('is-today');if(date===archiveDay)b.classList.add('is-selected');b.setAttribute('aria-pressed',String(date===archiveDay));b.setAttribute('aria-label',date+' · '+(items.length?items.length+' records':archiveLoaded&&!archiveTruncated?'No records':'Status unavailable'));b.addEventListener('click',()=>{archiveDay=date;search.value='';query='';searchVersion++;limit=20;renderDays();renderResults()});days.append(b);}
 }
 function move(delta){const [y,m]=archiveMonth.split('-').map(Number);archiveMonth=new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7);renderDays();}
 previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));current.addEventListener('click',()=>{archiveMonth=today.slice(0,7);archiveDay=today;query='';search.value='';searchVersion++;renderDays();renderResults()});
 async function indexNotes(token){
  const pending=records.filter(item=>!Array.isArray(item.notes)&&/^[0-9a-f-]{36}$/i.test(String(item.id||''))&&!detailsCache.has(item.id));let cursor=0,failed=0;
  await Promise.all(Array.from({length:Math.min(3,pending.length)},async()=>{while(cursor<pending.length&&token===searchVersion&&version===revision&&!signal.aborted){const item=pending[cursor++];try{const response=await fetch(origin+'/api/entries/'+item.id,{headers:{'X-Arcane-Key':key},signal});if(!response.ok)throw Error();const data=await response.json();detailsCache.set(item.id,{notes:Array.isArray(data.notes)?data.notes:[],richNotes:data.richNotes,media:Array.isArray(data.media)?data.media:[]});}catch{failed++;}}}));
  if(token!==searchVersion||version!==revision||signal.aborted)return;renderResults();if(failed)status.textContent+=' · Some notes could not be loaded. Search again to retry';if(archiveTruncated)status.textContent+=' · Searching loaded records only';
 }
 search.addEventListener('input',()=>{clearTimeout(timer);query=search.value.trim().toLocaleLowerCase();limit=20;const token=++searchVersion;renderResults();if(query){status.textContent+=' · Searching note content…';timer=setTimeout(()=>indexNotes(token),250);}});
 if(!archiveDay)archiveDay=today;renderDays();renderResults();
}
async function load(automatic=false){
 automatic=automatic===true;if(automatic&&($('loadArchive').disabled||document.hidden||navigator.onLine===false))return;
 let origin;try{origin=assertWorker($('gateway').value.trim());}catch(error){msg(error.message);return}
 const key=$('arcanePassword').value;if(!key){msg('Enter the access key');return}
 localStorage.setItem(cfgKey,origin);sessionStorage.setItem('arcane-session-password',key);
 const request=++requestRevision;if(requestController)requestController.abort();requestController=new AbortController();const signal=requestController.signal;
 $('loadArchive').disabled=true;$('archiveStatus').textContent='Syncing…';if(!automatic)msg('Loading study records from Notion…');
 try{
  const response=await fetch(origin+'/api/entries',{headers:{'X-Arcane-Key':key},signal,cache:'no-store'});const payload=await response.json();
  if(request!==requestRevision||signal.aborted)return;
  if(!response.ok)throw Error(payload.error||'Sync failed');if(!Array.isArray(payload.records))throw Error('Invalid Notion response');
  const list=payload.records.filter(item=>item&&typeof item==='object'),groups=groupedRecords(list);
  archiveLoaded=true;archiveTruncated=payload.truncated===true;
  $('archiveStatus').textContent='Connected · Auto sync on';
  window.RexNotionReconcile?.(list,{origin,complete:payload.truncated!==true&&list.length===payload.records.length&&list.every(item=>typeof item.id==='string'&&item.id)});
  msg('Synced '+list.length+' records across '+groups.length+' dates'+(payload.truncated?' · Only the first 500 records are loaded':''));
  const signature=JSON.stringify([origin,list]);if(automatic&&signature===lastPayload)return;lastPayload=signature;
  const version=++revision;if(controller)controller.abort();controller=new AbortController();grid.replaceChildren();cleanMedia();renderArchive(groups,origin,key,version,controller.signal);
 }catch(error){if(request!==requestRevision||signal.aborted)return;$('archiveStatus').textContent='Connection failed';msg(error.message+' · Check your connection settings. The calendar shows the last synced results.')}
 finally{if(request===requestRevision){$('loadArchive').disabled=false;requestController=null}}
}
$('archiveMessage').hidden=true;
renderArchive([], '', '', revision, new AbortController().signal);
$('loadArchive').addEventListener('click',()=>load());
function autoRefresh(){if($('gateway').value&&$('arcanePassword').value)load(true)}
addEventListener('online',autoRefresh);addEventListener('focus',autoRefresh);addEventListener('rex-notion-saved',()=>setTimeout(autoRefresh,500));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoRefresh()});
setInterval(autoRefresh,60000);setTimeout(autoRefresh,0);
$('clearArchive').addEventListener('click',()=>{
  resetArchive();archiveLoaded=false;archiveTruncated=false;renderArchive([], '', '', revision, new AbortController().signal);localStorage.removeItem(cfgKey);sessionStorage.removeItem('arcane-session-password');
  $('gateway').value='';$('arcanePassword').value='';$('loadArchive').disabled=false;$('archiveStatus').textContent='Not connected';
  msg('Disconnected. Your original Notion records are retained.');
});
})();
