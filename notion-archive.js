(()=>{
'use strict';
const $=id=>document.getElementById(id),cfgKey='arcane-notion-gateway',batchSize=5;
const grid=$('archiveGrid');
let mediaUrls=[],revision=0,controller=null;
grid.classList.add('archive-grouped');
$('gateway').value=localStorage.getItem(cfgKey)||'https://rex-notion-calendar.xren0220.workers.dev';
$('arcanePassword').value=sessionStorage.getItem('arcane-session-password')||'';

function msg(text){$('archiveMessage').hidden=false;$('archiveMessage').textContent=text;}
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(cls,text){const n=node('button',cls,text);n.type='button';return n;}
function cleanMedia(){for(const url of mediaUrls)URL.revokeObjectURL(url);mediaUrls=[];}
function resetArchive(){revision+=1;if(controller)controller.abort();controller=null;grid.replaceChildren();cleanMedia();return revision;}
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
  const response=await fetch(origin+path,{headers:{'X-Arcane-Key':key},signal});
  if(!response.ok)throw new Error('Could not load attachment');
  const blob=await response.blob();
  if(version!==revision||signal.aborted)return null;
  const url=URL.createObjectURL(blob);mediaUrls.push(url);return url;
}
function recordCard(item,origin,key,version,signal){
  const card=node('article','archive-entry');
  card.append(node('h3','',item.title||'Untitled'));
  card.append(node('div','meta',`${item.date||'No date'} · ${item.category||'Study'} · ${item.completed?'✓ Completed':'In progress'}`));
  if(item.minutes!=null||item.exp!=null)card.append(node('div','meta',`${item.minutes==null?'':'⏱ '+item.minutes+' min'} ${item.exp==null?'':'✧ '+item.exp+' EXP'}`));
  if(item.url){const link=node('a','','View in Notion ↗');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}
  for(const file of Array.isArray(item.media)?item.media:[]){
    if(!file||typeof file!=='object')continue;
    const wrap=node('div','archive-attachment');wrap.append(node('span','archive-pill',file.name||'File'));
    if(file.type==='image'||file.type==='audio'){
      const loadButton=button('ghost archive-media-load',file.type==='audio'?'Load audio':'Load image');
      loadButton.addEventListener('click',async()=>{
        if(loadButton.disabled||version!==revision)return;
        loadButton.disabled=true;loadButton.textContent='Loading…';
        try{
          const src=file.proxy?await getMedia(origin,key,file.proxy,version,signal):file.url;
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
    }else if(file.url){const link=node('a','','Open attachment');link.href=file.url;link.target='_blank';link.rel='noopener noreferrer';wrap.append(link);}
    card.append(wrap);
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
async function load(){
  let origin;
  try{origin=assertWorker($('gateway').value.trim());}catch(error){msg(error.message);return;}
  const key=$('arcanePassword').value;
  if(!key){msg('Enter the access key');return;}
  localStorage.setItem(cfgKey,origin);sessionStorage.setItem('arcane-session-password',key);
  const version=resetArchive();controller=new AbortController();const signal=controller.signal;
  $('loadArchive').disabled=true;$('archiveStatus').textContent='Syncing…';msg('Loading study records from Notion…');
  try{
    const response=await fetch(origin+'/api/entries',{headers:{'X-Arcane-Key':key},signal});
    const payload=await response.json();
    if(version!==revision||signal.aborted)return;
    if(!response.ok)throw new Error(payload.error||'Sync failed');
    const list=Array.isArray(payload.records)?payload.records.filter(item=>item&&typeof item==='object'):[],groups=groupedRecords(list);
    $('archiveStatus').textContent='Connected';
    msg(list.length?`Synced ${list.length} records across ${groups.length} ${groups.length===1?'date':'dates'}${payload.truncated?' (first 500 records)':''}. Open a date to browse. Media loads on demand.`:'No records in the selected Notion database.');
    if(groups.length)renderArchive(groups,origin,key,version,signal);
  }catch(error){
    if(version!==revision||signal.aborted)return;
    $('archiveStatus').textContent='Connection failed';msg(error.message+'. Please check the Worker configuration, Notion permissions and website origin.');
  }finally{if(version===revision)$('loadArchive').disabled=false;}
}
$('loadArchive').addEventListener('click',load);
$('clearArchive').addEventListener('click',()=>{
  resetArchive();localStorage.removeItem(cfgKey);sessionStorage.removeItem('arcane-session-password');
  $('gateway').value='';$('arcanePassword').value='';$('loadArchive').disabled=false;$('archiveStatus').textContent='Not connected';
  msg('Disconnected. Your original Notion records are retained.');
});
})();
