(()=>{
'use strict';
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),toast=document.createElement('div');toast.className='ui-success-toast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(toast);let timer;
function pulse(element){if(!element||reduced.matches)return;element.classList.remove('ui-success');requestAnimationFrame(()=>element.classList.add('ui-success'));element.addEventListener('animationend',()=>element.classList.remove('ui-success'),{once:true});}
function show(date,message){toast.textContent='✓ '+message;toast.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{toast.hidden=true;},2300);const day=[...document.querySelectorAll('.calendar-day')].find(el=>el.getAttribute('aria-label')?.startsWith(date));pulse(day);pulse(document.querySelector('.compact-metrics>article'));}
addEventListener('rex-notion-saved',event=>show(event.detail?.date||'','Synced to Notion'));
addEventListener('rex-backfill-saved',event=>show(event.detail?.date||'','Backfill saved'));
const form=document.getElementById('pteOtherForm'),feedback=document.getElementById('pteOtherFeedback');if(form&&feedback)form.addEventListener('submit',()=>{if(feedback.textContent==='Daily question targets saved.'){const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());show(date,'Practice saved');}});
})();
