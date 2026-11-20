(()=>{
'use strict';
const $=id=>document.getElementById(id),store=window.RexDashboardStore,key='rex-dashboard-cloud-v2',allowed=new Set(['pte','focus','abandoned','countdown','checkin','planner']);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const session=typeof sessionStorage==='undefined'?null:sessionStorage,rememberKey='rex-cloud-remember-key';
function rememberD1(){return localStorage.getItem(rememberKey)!=='false'}
function saveConnection(origin,access){session?.setItem('rex-cloud-session-origin',origin);session?.setItem('rex-cloud-session-token',access);localStorage.setItem('rex-cloud-origin',origin);if(rememberD1())localStorage.setItem('rex-cloud-token',access);else localStorage.removeItem('rex-cloud-token')}
const initial=read(key,null);
let model=initial&&typeof initial==='object'&&!Array.isArray(initial)?initial:{known:{},pending:{},baseline:{}},busy=false,again=false,timer,retryCount=0,blocked='';model.known??={};model.pending??={};model.baseline??={};
const recordKey=r=>r.kind+'|'+r.id,message=value=>{$('cloudStatus').textContent=value;updateControls()},save=()=>localStorage.setItem(key,JSON.stringify(model));
function updateControls(){
 const connect=$('cloudConnect'),refresh=$('cloudSyncNow'),disconnect=$('cloudDisconnect');if(!connect?.setAttribute)return;
 const bookmark=$('rememberD1Password');if(bookmark?.type==='checkbox')bookmark.checked=rememberD1();
 const enabled=!!config(),icon=paths=>'<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
 connect.classList.remove('sync-icon-button');connect.classList.add('service-switch');connect.setAttribute('role','switch');if(!connect.querySelector('.service-switch-track'))connect.innerHTML='<span class="service-switch-track" aria-hidden="true"><span class="service-switch-thumb"></span></span>';window.RexServiceSwitch?.attach(connect);refresh.classList.add('sync-icon-button');disconnect.hidden=true;
 connect.setAttribute('aria-label','D1 connection');connect.setAttribute('aria-checked',String(enabled));connect.title=enabled?'D1 on · Switch off':'D1 off · Switch on';connect.disabled=busy;connect.setAttribute('aria-busy',String(busy));
 refresh.innerHTML=icon('<path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-2L20 8M4 16l2.3 3A7 7 0 0 0 17.9 17"/>');refresh.setAttribute('aria-label',busy?'Syncing dashboard':'Sync dashboard now');refresh.setAttribute('aria-busy',String(busy));refresh.title=busy?'Syncing…':'Sync now';refresh.disabled=busy||!enabled;
}
function capture(){store.refresh();const current=store.snapshot(model.baseline);for(const [id,r]of Object.entries(current))if(JSON.stringify(r)!==model.baseline[id])model.pending[id]={...model.pending[id],...r,deleted:false,baseRevision:model.pending[id]?.baseRevision??model.known[id]?.revision??0};for(const id of Object.keys(model.baseline))if(!current[id]){const r=JSON.parse(model.baseline[id]);model.pending[id]={...model.pending[id],...r,data:{},deleted:true,baseRevision:model.pending[id]?.baseRevision??model.known[id]?.revision??0}}model.baseline=Object.fromEntries(Object.entries(current).map(([id,r])=>[id,JSON.stringify(r)]));save()}
function apply(){store.apply({...model.known,...model.pending});model.baseline=Object.fromEntries(Object.entries(store.snapshot(model.baseline)).map(([id,r])=>[id,JSON.stringify(r)]));save();dispatchEvent(new Event('rex-cloud-changed'))}
function config(){const origin=localStorage.getItem('rex-cloud-origin'),token=rememberD1()?localStorage.getItem('rex-cloud-token'):null;if(rememberD1())return origin&&token?{origin,token}:null;const sessionOrigin=session?.getItem('rex-cloud-session-origin'),sessionToken=session?.getItem('rex-cloud-session-token');return sessionOrigin&&sessionToken?{origin:sessionOrigin,token:sessionToken}:null}
function reloadModel(){
 const raw=localStorage.getItem(key);if(!raw)return;
 const saved=JSON.parse(raw);
 if(!saved||!saved.known||!saved.pending||!saved.baseline)throw Error('Unreadable sync state. Existing data has been retained.');
 model=saved;
}
function sameRecord(a,b){return a.deleted===b.deleted&&JSON.stringify(a.data)===JSON.stringify(b.data)}
function conflictPanel(){
 if(!document.createElement||!$('cloudStatus')?.after)return;
 let panel=$('cloudConflicts');if(!panel){panel=document.createElement('div');panel.id='cloudConflicts';$('cloudStatus').after(panel)}
 panel.replaceChildren();
 for(const [id,record]of Object.entries(model.pending).filter(([,r])=>r.conflict)){
  const row=document.createElement('details'),label=document.createElement('summary');
  label.textContent='Sync conflict · '+(record.data?.value?.title||record.data?.title||record.id);row.append(label);
  const describe=version=>{
   if(!version||version.deleted)return 'Deleted';
   const value=version.data?.value||version.data||{};
   return [value.title,value.date,value.done===true?'Completed':value.done===false?'Unfinished':'',value.dueDate?'Due '+value.dueDate:'',Number.isFinite(value.count)?value.count+' practices':'',Array.isArray(value.days)?value.days.length+' check-ins':''].filter(Boolean).join(' · ')||'Saved record';
  };
  const details=document.createElement('p');details.textContent='This device: '+describe(record)+' / D1: '+describe(model.known[id])+'. Your changes are retained until you choose.';row.append(details);
  for(const [text,keepLocal]of [['Keep my version',true],['Use D1 version',false]]){
   const button=document.createElement('button');button.type='button';button.textContent=text;button.disabled=busy;
   button.addEventListener('click',()=>resolveConflict(id,keepLocal));row.append(button);
  }panel.append(row);
 }
}
async function locked(action){return navigator.locks?.request?navigator.locks.request('rex-dashboard-sync',action):action()}
async function resolveConflict(id,keepLocal){
 if(busy)return;busy=true;updateControls();
 try{await locked(()=>{reloadModel();capture();const pending=model.pending[id];if(!pending?.conflict)return;
  if(keepLocal){pending.baseRevision=model.known[id]?.revision||0;delete pending.conflict}else delete model.pending[id];
  save();apply();
 });message(keepLocal?'Your version is queued for D1 sync':'D1 version restored on this device');schedule()}
 catch(error){message('Could not resolve conflict · '+error.message)}
 finally{busy=false;updateControls();conflictPanel()}
}
async function request(config,record){
 const response=await fetch(config.origin+'/api/sync',{method:record?'POST':'GET',headers:{'X-Sync-Key':config.token,...(record?{'Content-Type':'application/json'}:{})},body:record?JSON.stringify(record):undefined,signal:AbortSignal.timeout(20000)});
 let data;try{data=await response.json()}catch{throw Object.assign(Error('Invalid D1 response'),{retryable:response.status>=500})}
 if(!response.ok&&response.status!==409)throw Object.assign(Error(data.error||'D1 sync failed'),{retryable:response.status===429||response.status>=500,status:response.status});
 if(record&&(!data.record||data.record.kind!==record.kind||data.record.id!==record.id||!Number.isSafeInteger(data.record.revision)))throw Object.assign(Error('Invalid D1 acknowledgement. Changes are retained.'),{retryable:false});
 return {data,status:response.status};
}
function assertConnection(connection){const current=config();if(!current||current.origin!==connection.origin||current.token!==connection.token)throw Object.assign(Error('Connection changed. Sync stopped.'),{retryable:false})}
function summary(remote){
 const pending=Object.values(model.pending),conflicts=pending.filter(r=>r.conflict).length;
 if(conflicts)return 'Saved on this device · '+conflicts+' conflicts need your choice';
 if(pending.length){
  const reason=pending.some(r=>r.kind==='planner')&&(!remote.supportedKinds.includes('planner')||remote.schemaVersion<3||!remote.plannerLists||!remote.plannerDeadlines||!remote.plannerCompletionTimes)?' · Update D1 Worker to sync all planner fields':'';
  return 'Saved on this device · '+pending.length+' pending'+reason;
 }
 return 'Synced to D1 · '+new Date(model.lastSuccess).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'});
}
async function performSync(){
 reloadModel();capture();const connection=config();
 if(!connection){message('D1 not connected · Records saved on this device');return}
 if(!navigator.onLine){message('Offline · Records saved on this device; waiting to sync');return}
 message('Syncing records to D1…');
 const remote=await request(connection);assertConnection(connection);
 if(remote.data.storage!=='d1'||!['pte','countdown','checkin'].every(kind=>remote.data.supportedKinds?.includes(kind))||!Array.isArray(remote.data.records))throw Object.assign(Error('Update the D1 Worker before connecting.'),{retryable:false});
 const plannerReady=remote.data.schemaVersion>=3&&remote.data.supportedKinds.includes('planner');
 // Other tabs can change local records while the GET request is in flight.
 // Capture against the previous revisions before applying any remote data.
 capture();
 for(const record of remote.data.records){
  if(!allowed.has(record.kind)||record.kind==='planner'&&!plannerReady)continue;
  const id=recordKey(record),pending=model.pending[id];model.known[id]=record;
  if(pending){if(sameRecord(pending,record))delete model.pending[id];else if(pending.baseRevision!==record.revision)pending.conflict=true;}
 }
 save();apply();
 for(const id of Object.keys(model.pending)){
  const sent=model.pending[id];
  if(sent.conflict||sent.kind==='planner'&&(!plannerReady||sent.data?.value?.completedAt&&!remote.data.plannerCompletionTimes||sent.data?.value?.date===''&&!remote.data.plannerLists||sent.data?.value?.dueDate&&!remote.data.plannerDeadlines))continue;
  const signature=JSON.stringify(sent),payload={...sent};delete payload.conflict;
  const result=await request(connection,payload);assertConnection(connection);capture();
  model.known[id]=result.data.record;
  if(result.status===409){if(model.pending[id])model.pending[id].conflict=true;}
  else if(JSON.stringify(model.pending[id])===signature)delete model.pending[id];
  else if(model.pending[id])model.pending[id].baseRevision=result.data.record.revision;
  save();
 }
 capture();apply();retryCount=0;blocked='';
 if(!Object.keys(model.pending).length){model.lastSuccess=Date.now();save()}
 message(summary(remote.data));
}
async function sync(manual=false){
 if(manual){blocked='';retryCount=0;clearTimeout(timer)}
 if(blocked)return;
 if(busy){again=true;return}
 busy=true;updateControls();
 try{await locked(performSync)}catch(error){
  const retryable=error.retryable??(error instanceof TypeError||error.name==='TimeoutError'||error.name==='AbortError'||error.message==='Failed to fetch');
  if(retryable&&retryCount<5){const delay=Math.min(60000,2000*2**retryCount++);message('Sync unavailable · Local changes retained · Retrying in '+delay/1000+'s');schedule(delay)}
  else{blocked=error.status===401||error.status===403?'auth':'manual';message('Sync stopped · '+error.message+' · Changes retained; retry after checking the connection')}
 }finally{busy=false;updateControls();conflictPanel();if(again){again=false;if(!retryCount&&!blocked)schedule()}}
}
function schedule(delay=700){if(blocked)return;clearTimeout(timer);timer=setTimeout(()=>sync(),delay)}
const url=$('cloudOrigin'),token=$('cloudToken');url.value=localStorage.getItem('rex-cloud-origin')||'https://rex-sync.xren0220.workers.dev';token.value=localStorage.getItem('rex-cloud-token')||'';token.autocomplete='current-password';token.name='rex-dashboard-sync-key';
if(!rememberD1()&&localStorage.getItem('rex-cloud-token')){const origin=localStorage.getItem('rex-cloud-origin');if(origin)saveConnection(origin,localStorage.getItem('rex-cloud-token'))}
const initialConnection=config();if(initialConnection){url.value=initialConnection.origin;token.value=initialConnection.token}
if(token.closest){const field=token.closest('.sync-settings-field')||token.parentElement;if(field){const label=document.createElement('label');label.className='archive-remember sync-remember-icon';label.title='Remember D1 access key on this device';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id='rememberD1Password';checkbox.checked=rememberD1();checkbox.setAttribute('aria-label',label.title);label.append(checkbox);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const [name,value]of Object.entries({viewBox:'0 0 24 24',width:'16',height:'16',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(name,value);const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M6 4h12v17l-6-4-6 4V4Z');svg.append(path);label.append(svg);field.append(label);checkbox.addEventListener('change',()=>{const current=config();localStorage.setItem(rememberKey,String(checkbox.checked));if(current)saveConnection(current.origin,current.token);else if(!checkbox.checked)localStorage.removeItem('rex-cloud-token');updateControls()})}}
$('cloudConnect').addEventListener('click',()=>{if(config()){$('cloudDisconnect').click();return}try{const u=new URL(url.value.trim());if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Error('Enter the HTTPS address of your D1 Worker');if(!token.value.trim())throw Error('Enter the D1 sync access key');const old=localStorage.getItem('rex-cloud-origin');if(old&&old!==u.origin)throw Error('Disconnect before connecting another D1 service');saveConnection(u.origin,token.value.trim());sync(true)}catch(error){message(error.message)}});
$('cloudDisconnect').addEventListener('click',()=>{if(busy){message('Please wait for D1 sync to finish.');return}localStorage.removeItem('rex-cloud-origin');localStorage.removeItem('rex-cloud-token');session?.removeItem('rex-cloud-session-origin');session?.removeItem('rex-cloud-session-token');model={known:{},pending:{},baseline:{}};blocked='';retryCount=0;clearTimeout(timer);save();conflictPanel();token.value='';message('D1 disconnected · Local dashboard and Notion records retained')});$('cloudSyncNow').addEventListener('click',()=>sync(true));
 addEventListener('rex-local-changed',()=>{if(!retryCount)schedule()});
 addEventListener('online',()=>{if(blocked!=='auth'){blocked='';retryCount=0;schedule()}});
 addEventListener('storage',event=>{if(['rex-home-planner-v1','rex-pte-daily-v1','rex-pte-other-counts-v1','rex-custom-cultivation-v1','rex-focus-sessions-v1','rex-focus-abandoned-v1','rex-countdown-targets-v1','rex-home-countdown-targets-v1','rex-daily-growth-v1','arcane-sanctuary-v1'].includes(event.key)&&!retryCount)schedule()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!retryCount)schedule()});
 setInterval(()=>{if(!document.hidden&&!retryCount)sync()},60000);
 addEventListener('storage',event=>{if(['rex-cloud-origin','rex-cloud-token',rememberKey].includes(event.key))updateControls()});
 updateControls();conflictPanel();schedule();
})();
