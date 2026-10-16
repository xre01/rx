(()=>{
'use strict';
const $=id=>document.getElementById(id),cfgKey='arcane-notion-gateway',batchSize=5;
const grid=$('archiveGrid');
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
function dayLabel(day){return day?new Intl.DateTimeFormat('en',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T00:00:00Z')):'No date';}
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
  if(Array.isArray(item.notes))for(const text of item.notes)if(typeof text==='string')card.append(node('p','archive-note',text));
  const pageId=String(item.id||'');
  if(!Array.isArray(item.notes)&&!(item.media||[]).length&&/^[0-9a-f-]{36}$/i.test(pageId)){
    const details=button('ghost archive-details-load','View notes and attachments');card.append(details);
    details.addEventListener('click',async()=>{
      if(details.disabled||version!==revision)return;details.disabled=true;details.textContent='Loading…';
      try{const response=await fetch(origin+'/api/entries/'+pageId,{headers:{'X-Arcane-Key':key},signal});const data=await response.json();if(version!==revision||signal.aborted)return;if(!response.ok)throw Error(data.error||'Could not load record');
       const content=recordCard({...item,notes:Array.isArray(data.notes)?data.notes:[],media:Array.isArray(data.media)?data.media:[]},origin,key,version,signal);
       const heading=content.querySelector('h3'),meta=content.querySelector('.meta'),link=content.querySelector('a');heading?.remove();meta?.remove();if(link?.textContent==='View in Notion ↗')link.remove();
       const body=node('div','archive-record-details');while(content.firstChild)body.append(content.firstChild);card.append(body);details.remove();
      }catch(error){if(version!==revision||signal.aborted)return;details.disabled=false;details.textContent='Retry loading record';msg(error.message)}
    });
  }
  return card;
}
function dayGroup(day,records,index,origin,key,version,signal){
  const details=node('details','archive-day'),summary=node('summary','archive-summary');
  const title=node('span','archive-day-heading'),date=node(day?'time':'span','archive-day-date',dayLabel(day));
  if(day)date.dateTime=day;
  title.append(date);
  if(index===0&&day)title.append(node('span','archive-day-latest','Latest'));
  summary.append(title,node('span','archive-day-count',`${records.length} ${records.length===1?'record':'records'}`));
  details.append(summary);
  let rendered=0,content=null,cards=null,more=null;
  function showMore(){
    if(version!==revision||signal.aborted)return;
    if(!content){
      content=node('div','archive-day-content');cards=node('div','archive-day-records');
      more=button('archive-more-records','Show more records');
      more.setAttribute('aria-label','Show more records for '+dayLabel(day));
      more.addEventListener('click',showMore);content.append(cards,more);details.append(content);
    }
    const end=Math.min(rendered+batchSize,records.length);
    for(;rendered<end;rendered++)cards.append(recordCard(records[rendered],origin,key,version,signal));
    const remaining=records.length-rendered;
    more.hidden=remaining===0;
    more.textContent=remaining?`Show more records (${remaining} remaining)`:'All records shown';
  }
  details.addEventListener('toggle',()=>{if(details.open&&rendered===0)showMore();});
  if(index===0){details.open=true;showMore();}
  return details;
}
function renderArchive(groups,origin,key,version,signal){
  let visible=0;
  const earlier=button('archive-earlier-dates','Show earlier dates');
  function showEarlier(){
    if(version!==revision||signal.aborted)return;
    const end=Math.min(visible+batchSize,groups.length);
    for(;visible<end;visible++){const [day,records]=groups[visible];grid.append(dayGroup(day,records,visible,origin,key,version,signal));}
    const remaining=groups.length-visible;
    earlier.hidden=remaining===0;
    earlier.textContent=remaining?`Show earlier dates (${remaining} remaining)`:'All dates shown';
    grid.append(earlier);
  }
  earlier.addEventListener('click',showEarlier);showEarlier();
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
  if(!response.ok)throw Error(payload.error||'Sync failed');if(!Array.isArray(payload.records))throw Error('Invalid Notion response; existing records retained');
  const list=payload.records.filter(item=>item&&typeof item==='object'),groups=groupedRecords(list);
  $('archiveStatus').textContent='Connected · Auto sync on';
  window.RexNotionReconcile?.(list,{origin,complete:payload.truncated!==true&&list.length===payload.records.length&&list.every(item=>typeof item.id==='string'&&item.id)});
  msg(list.length?'Synced '+list.length+' records across '+groups.length+' dates'+(payload.truncated?' (first 500 records)':'')+'. Open a date to browse. Attachments load on demand.':'No records in the selected Notion database.');
  const signature=JSON.stringify([origin,list]);if(automatic&&signature===lastPayload)return;lastPayload=signature;
  const version=++revision;if(controller)controller.abort();controller=new AbortController();grid.replaceChildren();cleanMedia();if(groups.length)renderArchive(groups,origin,key,version,controller.signal);
 }catch(error){if(request!==requestRevision||signal.aborted)return;$('archiveStatus').textContent='Connection failed';msg(error.message+'. Existing records have been retained. Check the connection and access key.')}
 finally{if(request===requestRevision){$('loadArchive').disabled=false;requestController=null}}
}
$('loadArchive').addEventListener('click',()=>load());
function autoRefresh(){if($('gateway').value&&$('arcanePassword').value)load(true)}
addEventListener('online',autoRefresh);addEventListener('focus',autoRefresh);addEventListener('rex-notion-saved',()=>setTimeout(autoRefresh,500));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoRefresh()});
setInterval(autoRefresh,60000);setTimeout(autoRefresh,0);
$('clearArchive').addEventListener('click',()=>{
  resetArchive();localStorage.removeItem(cfgKey);sessionStorage.removeItem('arcane-session-password');
  $('gateway').value='';$('arcanePassword').value='';$('loadArchive').disabled=false;$('archiveStatus').textContent='Not connected';
  msg('Disconnected. Your original Notion records are retained.');
});
})();
