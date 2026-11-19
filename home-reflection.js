/* Home presentation for the existing reflection draft and attachment controls. */
(()=>{
'use strict';
const home=document.getElementById('lifeHome'),host=document.querySelector('.daily-summary-card'),api=window.RexDailyReflection;
if(!home||!host||!api)return;
const note=host.querySelector('textarea'),history=host.querySelector('.summary-history'),date=host.querySelector('header time');
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const paths={trash:'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v8m4-8v8',back:'M19 12H5m6-6-6 6 6 6',edit:'M16 4a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4L16 4ZM14 6l4 4',history:'M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2',save:'m5 12 4 4L19 6',journal:'M6 3h13v18H6zM3 7h5M3 12h5M3 17h5M11 8h4M11 12h4'};
function iconButton(name,label,fn){const b=el('button','home-reflection-icon');b.type='button';b.setAttribute('aria-label',label);b.title=label;b.addEventListener('click',fn);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const [key,value]of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(key,value);const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]);svg.append(path);b.append(svg);return b}
const card=el('section','life-card home-reflection-card');card.id='homeDailyReflection';card.dataset.view='summary';card.setAttribute('aria-label','生活');
const heading=el('div','home-reflection-heading'),caption=el('div'),title=el('h2','','生活'),stamp=el('time','home-reflection-date'),controls=el('div','home-reflection-controls');caption.append(title,stamp);
let view='summary',returnY=0,opening=false,returnTarget=null;
const quickEntry=iconButton('journal','生活',()=>open(day(),'read',quickEntry));quickEntry.classList.add('life-reflection-toggle');quickEntry.setAttribute('aria-controls',card.id);home.querySelector('.life-heading-actions')?.append(quickEntry);
const back=iconButton('back','Back to Home',()=>leave()),edit=iconButton('edit','Edit reflection',()=>open(api.date,'edit')),historyButton=iconButton('history','Reflection history',async()=>{if(view==='edit'&&!await flush())return;history.click()}),save=iconButton('save','Save reflection',async()=>{if(await flush())setView('read')});
const remove=iconButton('trash','Delete life record',async()=>{
 const date=api.date;
 if(!window.confirm('Delete all life records for '+date+' from this device and Notion, including links and attachments?'))return;
 remove.disabled=true;
 try{
  const result=await api.deleteDraft(date);if(result){refresh();edit.focus();message.textContent=result.pending?'已从本机删除，Notion 删除待同步。恢复连接后会继续处理。':'已从本机和 Notion 删除生活记录。'}
  else message.textContent='Could not delete this reflection. Please try again.';
 }finally{remove.disabled=false}
});
const retryDelete=iconButton('history','Retry Notion deletion',async()=>{await api.flushDeletions();refresh();message.textContent=api.pendingDeletionDates.includes(api.date)?'Notion 删除仍待同步，请检查连接后重试。':'Notion 删除已同步。'});
controls.append(edit,remove,retryDelete,historyButton,save);heading.append(back,caption,controls);
const preview=el('button','home-reflection-preview');preview.type='button';preview.setAttribute('aria-label','Read reflection');const excerpt=el('span','home-reflection-excerpt'),hint=el('span','home-reflection-hint','Read note ↗');preview.append(excerpt,hint);preview.addEventListener('click',()=>open(api.date,'read'));
const reading=el('article','home-reflection-reading'),readTitle=el('h2','','生活'),body=el('p','home-reflection-body');readTitle.tabIndex=-1;reading.append(readTitle,body);
const message=el('p','sub home-reflection-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
host.prepend(el('h2','home-reflection-edit-title','生活'));
card.append(heading,preview,reading,host,message);home.querySelector('.life-columns').after(card);
function refresh(){
 const text=note.value.trim(),files=host.querySelectorAll('.summary-file').length,links=host.querySelectorAll('.summary-links a').length;
 remove.hidden=view!=='read'||!(text||files||links);retryDelete.hidden=view==='summary'||!api.pendingDeletionDates.includes(api.date);
 stamp.textContent=date.textContent;stamp.dateTime=date.textContent;
 excerpt.textContent=text||(files||links?[files?files+' attachments':'',links?links+' links':''].filter(Boolean).join(' · '):"记录生活、感受与反思…");
 body.textContent=text||(!files&&!links?'这一天还没有生活记录。':'');hint.textContent=text||files||links?'Read note ↗':'Write a reflection ↗';
}
function setView(next){
 view=next;card.dataset.view=view;const full=view!=='summary';card.hidden=!full;quickEntry.setAttribute('aria-expanded',String(full));home.classList.toggle('home-reflection-open',full);preview.hidden=full;reading.hidden=view!=='read';host.hidden=!full;back.hidden=!full;save.hidden=view!=='edit';edit.hidden=view==='edit';title.hidden=full;caption.classList.toggle('is-detail',full);refresh();
 if(view==='edit'){note.focus({preventScroll:true});card.scrollIntoView({block:'start',behavior:'instant'})}
 else if(view==='read'){readTitle.focus({preventScroll:true});card.scrollIntoView({block:'start',behavior:'instant'})}
}
async function flush(){const ok=await api.saveDraft();if(!ok)message.textContent='Could not save yet. Your draft is still open; please retry.';else message.textContent='';return ok}
async function open(targetDate,mode='read',trigger=quickEntry){
 if(opening)return false;opening=true;
 try{const ok=await api.open(targetDate);if(!ok){message.textContent='This date could not be opened yet. Please retry.';return false}if(view==='summary'){returnY=window.scrollY;returnTarget=trigger}document.querySelector('.rex-sidebar-nav [data-side-view="lifeHome"]')?.click();message.textContent='';setView(mode==='edit'?'edit':'read');return true}finally{opening=false}
}
async function leave(){
 if(view==='edit'){if(await flush())setView('read');return}
 setView('summary');(returnTarget?.isConnected&&returnTarget!==preview?returnTarget:quickEntry).focus({preventScroll:true});window.scrollTo({top:returnY,behavior:'instant'});
}
addEventListener('rex-life-deletion-status',refresh);note.addEventListener('input',refresh);new MutationObserver(refresh).observe(host,{childList:true,subtree:true,characterData:true});
document.querySelector('.rex-sidebar-nav [data-side-view="lifeHome"]')?.addEventListener('click',async()=>{if(opening)return;if(view==='edit'&&!await flush())return;if(view!=='summary')setView('summary');await api.open(day());refresh()});
function day(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
window.RexHomeReflection={open};setView('summary');
})();
