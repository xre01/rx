(()=>{
'use strict';
const $=id=>document.getElementById(id),cfgKey='arcane-notion-gateway';
const grid=$('archiveGrid');
let archiveLoaded=false,archiveTruncated=false;
const connection=$('loadArchive').closest('.card');if(connection){
 const settings=node('section','archive-connections'),tabs=node('div','archive-connection-tabs'),notionPanel=node('section','archive-connection-panel');settings.setAttribute('aria-label','Connections');connection.before(settings);notionPanel.id='archiveNotionPanel';notionPanel.append(connection);
 const storage=$('archives').querySelector('.archive-dashboard-sync');
 if(storage){
  const storagePanel=node('section','archive-connection-panel archive-dashboard-sync');storagePanel.id='archiveStoragePanel';for(const child of [...storage.childNodes])if(child.nodeName!=='SUMMARY')storagePanel.append(child);storage.remove();tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Connection service');
  const panels=[notionPanel,storagePanel],buttons=['Notion','D1'].map((text,index)=>{const tab=button('',text);tab.id='archiveConnectionTab'+index;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panels[index].id);panels[index].setAttribute('role','tabpanel');panels[index].setAttribute('aria-labelledby',tab.id);tab.addEventListener('click',()=>select(index));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=1-index;else if(event.key==='Home')next=0;else if(event.key==='End')next=1;else return;event.preventDefault();select(next);buttons[next].focus()});tabs.append(tab);return tab});
  function select(index){buttons.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index})}select(0);settings.append(tabs,...panels);
 }else settings.append(notionPanel);
}
$('archives').querySelector('p.sub').textContent='Browse your saved check-ins.';
const archiveInMe=!!$('profilePopover');
if(archiveInMe){const area=$('archives');area.className='me-sync-settings';area.setAttribute('aria-label','Connections and sync');area.querySelector('h1')?.remove();area.querySelector('p.sub')?.remove();$('profilePopover').append(area);grid.hidden=true;}
if(archiveInMe){
 const notion=$('archiveNotionPanel'),storage=$('archiveStoragePanel'),fields=notion.querySelector('.archive-settings'),actions=notion.querySelector('.archive-controls');fields.classList.add('sync-settings-fields');for(const field of fields.children)field.classList.add('sync-settings-field');
 notion.querySelector('label[for="gateway"]').textContent='Worker URL';notion.querySelector('label[for="arcanePassword"]').textContent='Access key';actions.classList.add('sync-settings-actions');
 const oldStatus=$('archiveStatus'),status=node('p','sync-settings-status',oldStatus.textContent);status.id='archiveStatus';status.setAttribute('role','status');oldStatus.remove();notion.querySelector('.archive-banner')?.remove();actions.after(status);status.after($('archiveMessage'));
 if(storage){const storageFields=node('div','sync-settings-fields');for(const [i,field]of [...storage.querySelectorAll(':scope>label')].entries()){const wrapper=node('div','sync-settings-field'),caption=node('label','',i===0?'Worker URL':'Access key'),input=field.querySelector('input');caption.htmlFor=input.id;wrapper.append(caption,input);storageFields.append(wrapper);field.remove()}storage.prepend(storageFields);storage.querySelector('.profile-settings-actions').classList.add('sync-settings-actions');$('cloudStatus').classList.add('sync-settings-status');}
}
window.RexOpenConnections=(service='notion')=>setTimeout(()=>{const profile=$('profilePopover');if(profile?.hidden)$('profileToggle')?.click();document.getElementById(service==='storage'?'archiveConnectionTab1':'archiveConnectionTab0')?.click();setTimeout(()=>document.getElementById(service==='storage'?'cloudToken':'arcanePassword')?.focus(),0)},0);
let mediaUrls=[],revision=0,controller=null,lastPayload=null,requestRevision=0,requestController=null;
grid.classList.add('archive-grouped');
$('gateway').value=localStorage.getItem(cfgKey)||'https://rex-notion-calendar.xren0220.workers.dev';
$('arcanePassword').value=sessionStorage.getItem('arcane-session-password')||'';
const notionToggle=button('sync-icon-button','');notionToggle.id='notionConnect';$('loadArchive').before(notionToggle);$('clearArchive').hidden=true;
function updateNotionControls(){
 const enabled=!!sessionStorage.getItem('arcane-session-password'),busy=!!requestController,refresh=$('loadArchive'),svg=path=>'<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
 notionToggle.innerHTML=svg(enabled?'<path d="M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>':'<path d="m3 3 18 18M10 13a5 5 0 0 0 4.5 1.3M17 13l3-3a5 5 0 0 0-7-7l-1.7 1.7M7 11l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>');notionToggle.setAttribute('aria-label',enabled?'Disconnect Notion':'Connect Notion');notionToggle.setAttribute('aria-pressed',String(enabled));notionToggle.title=enabled?'Connected · Click to disconnect':'Connect';notionToggle.disabled=busy;
 refresh.classList.remove('action');refresh.classList.add('sync-icon-button');refresh.innerHTML=svg('<path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-2L20 8M4 16l2.3 3A7 7 0 0 0 17.9 17"/>');refresh.setAttribute('aria-label',busy?'Syncing Notion':'Sync Notion now');refresh.setAttribute('aria-busy',String(busy));refresh.title=busy?'Syncing…':'Sync now';refresh.disabled=busy||!enabled;
}
notionToggle.addEventListener('click',()=>{if(sessionStorage.getItem('arcane-session-password'))$('clearArchive').click();else{$('loadArchive').disabled=false;$('loadArchive').click();updateNotionControls()}});
updateNotionControls();

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
async function getMedia(origin,key,path,version,signal,scope){
  if(typeof path!=='string'||!path.startsWith('/api/media/')||path.includes('..'))throw Error('Invalid attachment address');
  const response=await fetch(origin+path,{headers:{'X-Arcane-Key':key},signal});
  if(!response.ok)throw new Error('Could not load attachment');
  const blob=await response.blob();
  if((scope?!scope.current():version!==revision)||signal.aborted)return null;
  const url=URL.createObjectURL(blob);(scope?scope.urls:mediaUrls).push(url);return url;
}
function safeLink(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null}catch{return null}}
function archivePracticeOnly(item){
 const reflection=s=>/^(?:Daily Reflection|reflection|skill)(?:\s*·\s*网站记录)?$/i.test(String(s||'').trim());
 if(reflection(item.category))return {...item,notes:[],richNotes:[],media:[]};
 const plain=b=>(b?.[b.type]?.rich_text||[]).map(t=>t.text?.content??t.plain_text??'').join('');let skip=false,found=false;
 const out={...item};
 if(Array.isArray(item.richNotes)){out.richNotes=item.richNotes.filter(b=>{if(b.type==='heading_3'){skip=reflection(plain(b));if(skip)found=true}return !skip});out.notes=out.richNotes.map(b=>[plain(b),b[b.type]?.children?.map(plain).join('\n')].filter(Boolean).join('\n'));}
 else if(Array.isArray(item.notes)){out.notes=item.notes.filter(line=>{if(reflection(line)){skip=true;found=true;return false}if(/^(?:PTE 练习|PTE practice|Practice notes)(?:\s*·.*)?$/i.test(line))skip=false;return !skip});}
 if(found){const known=Array.isArray(item.reflections),excluded=new Set((item.reflections||[]).flatMap(r=>r.media||[]).map(f=>f.proxy));out.media=known?(item.media||[]).filter(f=>!excluded.has(f.proxy)):[];}
 return out;
}
function recordCard(item,origin,key,version,signal,scope){
  const current=()=>!signal.aborted&&(scope?scope.current():version===revision),report=text=>scope?scope.report(text):msg(text);
  item=archivePracticeOnly(item);
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
        if(loadButton.disabled||!current())return;
        loadButton.disabled=true;loadButton.textContent='Loading…';
        try{
          const src=file.proxy?await getMedia(origin,key,file.proxy,version,signal,scope):safeLink(file.url);
          if(!current())return;
          if(!src)throw new Error('Invalid link');
          const media=node(file.type==='audio'?'audio':'img');
          if(file.type==='audio')media.controls=true;else{media.alt=file.name||'Study image';media.loading='lazy';}
          media.src=src;wrap.append(media);loadButton.remove();
        }catch(error){
          if(!current())return;
          loadButton.disabled=false;loadButton.textContent='Retry';report('Could not open an attachment: '+error.message);
        }
      });
      wrap.append(loadButton);
    }else if(safeLink(file.url)){const link=node('a','','Open attachment');link.href=safeLink(file.url);link.target='_blank';link.rel='noopener noreferrer';wrap.append(link);}
    if(file.proxy&&file.type!=='image'&&file.type!=='audio'){
      const open=button('ghost archive-media-load','Open attachment');open.addEventListener('click',async()=>{open.disabled=true;try{const url=await getMedia(origin,key,file.proxy,version,signal,scope);if(!url)return;const link=node('a','','Download '+(file.name||'attachment'));link.href=url;link.download=file.name||'attachment';wrap.append(link);open.remove()}catch(error){if(!current())return;open.disabled=false;report(error.message)}});wrap.append(open);
    }
    card.append(wrap);
  }
  if(Array.isArray(item.richNotes)){card.append(RexRichEditor.content('',item.richNotes));}else if(Array.isArray(item.notes))for(const text of item.notes)if(typeof text==='string')card.append(node('p','archive-note',text));
  const pageId=String(item.id||'');
  if(!Array.isArray(item.notes)&&!(item.media||[]).length&&/^[0-9a-f-]{36}$/i.test(pageId)){
    const details=button('ghost archive-details-load','View notes and attachments');card.append(details);
    details.addEventListener('click',async()=>{
      if(details.disabled||!current())return;details.disabled=true;details.textContent='Loading…';
      try{const response=await fetch(origin+'/api/entries/'+pageId,{headers:{'X-Arcane-Key':key},signal});const data=await response.json();if(!current())return;if(!response.ok)throw Error(data.error||'Could not load record');
       const content=recordCard({...item,notes:Array.isArray(data.notes)?data.notes:[],richNotes:data.richNotes,media:Array.isArray(data.media)?data.media:[],reflections:data.reflections},origin,key,version,signal,scope);
       const heading=content.querySelector('h3'),meta=content.querySelector('.meta'),link=content.querySelector('a');heading?.remove();meta?.remove();if(link?.textContent==='View in Notion ↗')link.remove();
       const body=node('div','archive-record-details');while(content.firstChild)body.append(content.firstChild);card.append(body);details.remove();
      }catch(error){if(!current())return;details.disabled=false;details.textContent='Retry loading record';report(error.message)}
    });
  }
  return card;
}
function renderArchive(groups,origin,key,version,signal){
 if(archiveInMe)return;
 const records=groups.flatMap(([,items])=>items),shell=node('section','archive-records-shell'),status=node('p','archive-records-status'),results=node('div','archive-calendar-results');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');shell.append(status,results);grid.append(shell);let limit=20;
 function renderResults(){
  cleanMedia();results.replaceChildren();status.textContent=records.length+' records · Newest first';
  status.hidden=!archiveLoaded;if(!archiveLoaded){status.textContent='';return;}
  if(!records.length){results.append(node('p','archive-empty',archiveTruncated?'No records in the loaded results.':'No saved records.'));return;}
  for(const item of records.slice(0,limit))results.append(recordCard(item,origin,key,version,signal));
  if(records.length>limit){const more=button('ghost','Load more');more.addEventListener('click',()=>{limit+=20;renderResults()});results.append(more);}
 }
 renderResults();
}
async function load(automatic=false){
 automatic=automatic===true;if(automatic&&($('loadArchive').disabled||document.hidden||navigator.onLine===false))return;
 let origin;try{origin=assertWorker($('gateway').value.trim());}catch(error){msg(error.message);return}
 const key=$('arcanePassword').value;if(!key){msg('Enter the access key');return}
 localStorage.setItem(cfgKey,origin);sessionStorage.setItem('arcane-session-password',key);
 const request=++requestRevision;if(requestController)requestController.abort();requestController=new AbortController();const signal=requestController.signal;
 $('loadArchive').disabled=true;updateNotionControls();$('archiveStatus').textContent='Syncing…';if(!automatic)msg('Loading study records from Notion…');
 try{
  const response=await fetch(origin+'/api/entries',{headers:{'X-Arcane-Key':key},signal,cache:'no-store'});const payload=await response.json();
  if(request!==requestRevision||signal.aborted)return;
  if(!response.ok)throw Error(payload.error||'Sync failed');if(!Array.isArray(payload.records))throw Error('Invalid Notion response');
  const list=payload.records.filter(item=>item&&typeof item==='object'),groups=groupedRecords(list.filter(item=>!/^(?:Daily Reflection|reflection|skill)$/i.test(item.category||'')).map(archivePracticeOnly));
  archiveLoaded=true;archiveTruncated=payload.truncated===true;
  $('archiveStatus').textContent='Connected · Auto sync on';
  window.RexNotionReconcile?.(list,{origin,complete:payload.truncated!==true&&list.length===payload.records.length&&list.every(item=>typeof item.id==='string'&&item.id)});
  msg('Synced '+list.length+' records across '+groups.length+' dates'+(payload.truncated?' · Only the first 500 records are loaded':''));
  const signature=JSON.stringify([origin,list]);if(automatic&&signature===lastPayload)return;lastPayload=signature;
  const version=++revision;if(controller)controller.abort();controller=new AbortController();grid.replaceChildren();cleanMedia();renderArchive(groups,origin,key,version,controller.signal);
 }catch(error){if(request!==requestRevision||signal.aborted)return;$('archiveStatus').textContent='Connection failed';msg(error.message+' · Check your connection settings. The list shows the last synced results.')}
 finally{if(request===requestRevision){requestController=null;updateNotionControls();dispatchEvent(new Event('rex-notion-connection-changed'))}}
}
/* The timeline shares the archive reader, with its own request and media lifecycle. */
let studyIndexCache=null,studyIndexPending=null;const studyDetails=new Map();
function studyConnection(){const key=$('arcanePassword').value||sessionStorage.getItem('arcane-session-password');if(!key)return null;return {origin:assertWorker($('gateway').value.trim()||localStorage.getItem(cfgKey)||'https://rex-notion-calendar.xren0220.workers.dev'),key}}
async function studyRequest(c,path,signal){const abort=new AbortController(),cancel=()=>abort.abort();signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();const timer=setTimeout(cancel,20000);try{const response=await fetch(c.origin+path,{headers:{'X-Arcane-Key':c.key},signal:abort.signal,cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(response.status===401||response.status===403?'Reconnect to Notion in Me → Connections.':data.error||'Could not load check-ins.');return data}finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel)}}
async function studyIndex({force=false}={}){
 const c=studyConnection();if(!c)return {records:[],connected:false,truncated:false};
 const same=value=>value&&value.origin===c.origin&&value.key===c.key;
 if(!force&&same(studyIndexCache)&&Date.now()-studyIndexCache.at<60000)return studyIndexCache.value;
 if(!force&&same(studyIndexPending))return studyIndexPending.promise;
 const pending={...c};pending.promise=(async()=>{const data=await studyRequest(c,'/api/entries');if(!Array.isArray(data.records))throw Error('Invalid Notion record list.');const records=data.records.filter(r=>r&&dayKey(r.date)&&/^[0-9a-f-]{36}$/i.test(r.id||'')&&!/^(?:Daily Reflection|reflection|skill)(?:\s*·\s*网站记录)?$/i.test(r.category||''));const value={records,connected:true,truncated:data.truncated===true};studyIndexCache={...c,at:Date.now(),value};return value})();studyIndexPending=pending;
 try{return await pending.promise}finally{if(studyIndexPending===pending)studyIndexPending=null}
}
function mountStudyCheckins(host,date){
 const abort=new AbortController(),urls=[],status=node('p','sub'),body=node('div','study-checkin-records');status.setAttribute('role','status');host.append(status,body);let alive=true,run=0,activeConnection=null;
 const scope={urls,current:()=>{if(!alive||abort.signal.aborted||!host.isConnected)return false;try{const c=studyConnection();return !activeConnection||!!c&&c.origin===activeConnection.origin&&c.key===activeConnection.key}catch{return false}},report:text=>{if(alive)status.textContent=text}};
 const refresh=button('ghost study-checkin-refresh','Refresh');refresh.setAttribute('aria-label','Refresh check-ins');host.append(refresh);
 async function load(force=false){const token=++run;refresh.disabled=true;status.textContent='Loading check-ins from Notion…';body.replaceChildren();for(const url of urls.splice(0))URL.revokeObjectURL(url);
  try{const c=studyConnection();if(!c){status.textContent='Connect to Notion in Me → Connections to load your check-ins.';return}activeConnection=c;const index=await studyIndex({force});if(!scope.current()||token!==run)return;
   const pages=index.records.filter(r=>dayKey(r.date)===date),results=new Array(pages.length);let cursor=0,failed=0;
   await Promise.all(Array.from({length:Math.min(3,pages.length)},async()=>{while(cursor<pages.length&&scope.current()){const i=cursor++,page=pages[i];try{const cacheKey=c.origin+'|'+page.id,cache=studyDetails.get(cacheKey);let data;if(!force&&cache&&cache.key===c.key&&Date.now()-cache.at<60000)data=cache.data;else{data=await studyRequest(c,'/api/entries/'+page.id,abort.signal);studyDetails.set(cacheKey,{key:c.key,at:Date.now(),data})}results[i]={...page,notes:Array.isArray(data.notes)?data.notes:[],richNotes:data.richNotes,media:Array.isArray(data.media)?data.media:[],reflections:data.reflections}}catch(error){if(abort.signal.aborted)throw error;failed++;results[i]={...page,notes:['Could not load this check-in. Refresh to retry.'],media:[]}}}}));
   if(!scope.current()||token!==run)return;
   const currentConnection=studyConnection();if(!currentConnection||currentConnection.origin!==c.origin||currentConnection.key!==c.key){status.textContent='Notion connection changed. Refresh to load check-ins.';return}
   for(const item of results)body.append(recordCard(item,c.origin,c.key,0,abort.signal,scope));
   status.textContent=failed?'Some check-ins could not be loaded. Refresh to retry.':!pages.length?(index.truncated?'No check-ins for this date in the loaded results.':'No saved check-ins for this date.'):(index.truncated?'Showing check-ins from the loaded Notion results.':'');
  }catch(error){if(scope.current()&&token===run)status.textContent=error.name==='AbortError'?'Loading timed out. Refresh to retry.':error.message}
  finally{if(alive&&token===run)refresh.disabled=false}
 }
 refresh.addEventListener('click',()=>load(true));load();return ()=>{alive=false;run++;abort.abort();host.querySelectorAll('audio').forEach(audio=>{audio.pause();audio.removeAttribute('src');audio.load()});for(const url of urls)URL.revokeObjectURL(url)};
}
async function searchStudyNotes(query,{signal}={}){
 const c=studyConnection();if(!c)return {matches:[],connected:false,partial:false};
 const index=await studyIndex(),terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),matches=[];let cursor=0,failed=0;
 await Promise.all(Array.from({length:Math.min(3,index.records.length)},async()=>{while(cursor<index.records.length&&!signal?.aborted){const page=index.records[cursor++];try{const cacheKey=c.origin+'|'+page.id,cache=studyDetails.get(cacheKey);let data;if(cache&&cache.key===c.key&&Date.now()-cache.at<60000)data=cache.data;else{data=await studyRequest(c,'/api/entries/'+page.id,signal);studyDetails.set(cacheKey,{key:c.key,at:Date.now(),data})}const item=archivePracticeOnly({...page,...data}),note=(item.notes||[]).join('\n'),text=[item.title,item.category,note,...(item.media||[]).map(f=>f.name||'')].join(' ').toLocaleLowerCase();if(terms.every(term=>text.includes(term)))matches.push({date:dayKey(page.date),title:page.title||'Check-in',note})}catch(error){if(signal?.aborted)throw error;failed++}}}));
 if(signal?.aborted)throw new DOMException('Search cancelled','AbortError');const active=studyConnection();if(!active||active.origin!==c.origin||active.key!==c.key)throw Error('Notion connection changed. Search again.');
 return {matches,connected:true,partial:index.truncated||failed>0,truncated:index.truncated,failed};
}
window.RexStudyCheckins={loadIndex:studyIndex,mount:mountStudyCheckins,search:searchStudyNotes};
addEventListener('rex-notion-saved',()=>{studyIndexCache=null;studyDetails.clear()});
$('archiveMessage').hidden=true;
renderArchive([], '', '', revision, new AbortController().signal);
$('loadArchive').addEventListener('click',()=>load());
function autoRefresh(){if($('gateway').value&&$('arcanePassword').value)load(true)}
addEventListener('online',autoRefresh);addEventListener('focus',autoRefresh);addEventListener('rex-notion-saved',()=>setTimeout(autoRefresh,500));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoRefresh()});
setInterval(autoRefresh,60000);setTimeout(()=>{updateNotionControls();autoRefresh()},0);
$('clearArchive').addEventListener('click',()=>{
  resetArchive();archiveLoaded=false;archiveTruncated=false;renderArchive([], '', '', revision, new AbortController().signal);localStorage.removeItem(cfgKey);sessionStorage.removeItem('arcane-session-password');
  $('gateway').value='';$('arcanePassword').value='';$('loadArchive').disabled=false;$('archiveStatus').textContent='Not connected';
  msg('Disconnected. Your original Notion records are retained.');
  studyIndexCache=null;studyDetails.clear();updateNotionControls();
  dispatchEvent(new Event('rex-notion-connection-changed'));
});
})();
