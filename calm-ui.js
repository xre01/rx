/* Shared interaction feedback. Success is announced only after a confirmed result. */
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),toast=document.createElement('div');
 toast.className='calm-feedback';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true');
 const icon=document.createElement('span'),message=document.createElement('span'),dismiss=document.createElement('button');
 icon.setAttribute('aria-hidden','true');dismiss.type='button';dismiss.textContent='×';dismiss.setAttribute('aria-label','Dismiss notification');toast.append(icon,message,dismiss);document.body.append(toast);
 let timer=0,last='',lastAt=0;const timers=new Set(),observed=new WeakMap();
 function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id);return id}
 function close(){toast.hidden=true;clearTimeout(timer)}
 dismiss.addEventListener('click',close);
 function show(text,tone='success'){
  if(typeof text!=='string'||!text.trim())return;
  text=text.trim();const key=tone+':'+text;
  if(key===last&&Date.now()-lastAt<1200)return;
  last=key;lastAt=Date.now();clearTimeout(timer);icon.textContent=tone==='error'?'!':'✓';message.textContent=text;toast.dataset.tone=tone;toast.hidden=false;
  timer=setTimeout(close,tone==='error'?6000:2400);
 }
 addEventListener('rex-feedback',event=>show(event.detail?.message,event.detail?.tone));
 addEventListener('rex-notion-saved',()=>show('Synced to Notion'));
 addEventListener('rex-backfill-saved',()=>show('Saved'));
 const control=target=>target instanceof Element?target.closest('button,summary,[role="button"]'):null;
 function press(target){const node=control(target);if(!node||node.disabled||node.getAttribute('aria-disabled')==='true')return;node.classList.add('calm-pressed');later(()=>node.classList.remove('calm-pressed'),180)}
 document.addEventListener('pointerdown',event=>press(event.target));
 document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')press(event.target)});
 document.addEventListener('invalid',event=>{const node=event.target;node.classList.add('calm-invalid');node.addEventListener('input',()=>node.classList.remove('calm-invalid'),{once:true})},true);
 document.addEventListener('change',event=>{
  const input=event.target;if(reduced.matches||input?.type!=='checkbox'||!input.checked)return;
  const label=input.getAttribute('aria-label');
  requestAnimationFrame(()=>{
   const current=input.isConnected?input:label?[...document.querySelectorAll('input[aria-label]')].find(node=>node.getAttribute('aria-label')===label):null;
   const row=current?.closest('.life-task,.hero-task-row,.pte-question,.reading-file-row');if(!row)return;
   row.classList.add('calm-confirmed');later(()=>row.classList.remove('calm-confirmed'),600);
  });
 });
 const statusSelector='[role="status"],.reading-sync-strip';
 function visible(node){return !node.closest('[hidden],.panelview:not(.active),details:not([open])')}
 function result(node){
  if(node===toast||toast.contains(node))return;
  const text=node.textContent.replace(/\s+/g,' ').trim(),before=observed.get(node);observed.set(node,text);
  if(!text||text===before||!visible(node))return;
  if(/could not|couldn't|cannot |failed|failure|conflict|not saved|sync stopped|unavailable|incomplete|retry needed|retrying later/i.test(text))show(text,'error');
  else if(!/not connected|disconnected|pending|restored|not synced|not been saved/i.test(text)&&/\b(saved|synced|deleted|removed|completed|connected)\b/i.test(text))show(text);
 }
 function busy(button){
  const loading=button.dataset.state==='loading'||/^(syncing|saving|uploading|loading|connecting)\b/i.test(button.textContent.trim());
  if(loading&&button.getAttribute('aria-busy')!=='true'){button.dataset.calmBusy='true';button.setAttribute('aria-busy','true')}
  else if(!loading&&button.dataset.calmBusy==='true'){delete button.dataset.calmBusy;button.removeAttribute('aria-busy')}
 }
 document.querySelectorAll(statusSelector).forEach(node=>observed.set(node,node.textContent.replace(/\s+/g,' ').trim()));
 document.querySelectorAll('button').forEach(busy);
 const observer=new MutationObserver(changes=>{
  const statuses=new Set(),buttons=new Set();
  for(const change of changes){
   const node=change.target.nodeType===1?change.target:change.target.parentElement;if(!node||toast.contains(node))continue;
   const status=node.closest(statusSelector);if(status)statuses.add(status);
   const button=node.closest('button');if(button)buttons.add(button);
   for(const added of change.addedNodes||[]){if(added.nodeType!==1)continue;
    if(added.matches(statusSelector)&&!observed.has(added))observed.set(added,added.textContent.replace(/\s+/g,' ').trim());
    added.querySelectorAll(statusSelector).forEach(status=>{if(!observed.has(status))observed.set(status,status.textContent.replace(/\s+/g,' ').trim())});
    if(added.matches('button'))buttons.add(added);added.querySelectorAll('button').forEach(button=>buttons.add(button));
   }
  }
  statuses.forEach(result);buttons.forEach(busy);
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','data-state']});
 addEventListener('pagehide',()=>{observer.disconnect();close();timers.forEach(clearTimeout);timers.clear()},{once:true});
})();
