/* Read-only weekly summary for the reference layout. No storage or sync writes. */
(()=>{
 'use strict';
 const host=document.querySelector('.compact-main>.reference-welcome'),store=window.RexDashboardStore;
 if(!host||!store)return;
 const card=document.createElement('section');card.className='sanctuary-weekly';card.setAttribute('aria-label','Weekly Progress');
 card.innerHTML='<div class="sanctuary-week-chart"><h2>Weekly Progress</h2><div class="sanctuary-week-bars" role="img"></div></div><div class="sanctuary-week-totals"><div><span>Total Questions</span><strong></strong><small>this week</small></div><div><span>Focus Time</span><strong></strong><small>min</small></div></div>';
 host.append(card);
 function render(){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const date=new Date(today+'T12:00:00Z'),monday=date.getTime()-((date.getUTCDay()+6)%7)*86400000;
  const days=Array.from({length:7},(_,i)=>{const key=new Date(monday+i*86400000).toISOString().slice(0,10),summary=store.summary(key);return {key,count:summary.counts.reduce((n,r)=>n+r.count,0),seconds:summary.seconds};});
  const bars=card.querySelector('.sanctuary-week-bars'),max=Math.max(1,...days.map(d=>d.count));bars.replaceChildren();
  bars.setAttribute('aria-label',days.map(d=>d.key+': '+d.count+' questions').join(', '));
  days.forEach((day,i)=>{const col=document.createElement('div'),value=document.createElement('span'),track=document.createElement('div'),bar=document.createElement('span'),label=document.createElement('small');
   col.className=day.key===today?'is-today':'';value.textContent=day.count;track.className='sanctuary-bar-track';bar.style.height=day.count?day.count/max*100+'%':'2px';label.textContent=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i];track.append(bar);col.append(value,track,label);bars.append(col);
  });
  const totals=card.querySelectorAll('strong');totals[0].textContent=days.reduce((n,d)=>n+d.count,0);totals[1].textContent=Math.floor(days.reduce((n,d)=>n+d.seconds,0)/60);
 }
 render();for(const event of ['rex-local-changed','rex-cloud-changed','storage'])addEventListener(event,render);setInterval(render,60000);
})();

/* Present native count inputs as compact practice cards. Existing forms own saving. */
(()=>{
 'use strict';
 const rows=document.querySelector('.pte-count-rows');if(!rows)return;
 const names={SST:'Summarize Spoken Text','FIB L':'Fill in the Blanks (Listening)','MC single choice':'Multiple Choice (Single)','MC multiple choice':'Multiple Choice (Multiple)',HCS:'Highlight Correct Summary',SMW:'Select Missing Word',HIW:'Highlight Incorrect Words',WFD:'Write From Dictation'};
 function decorate(){for(const row of rows.children){
  if(row.querySelector('.sanctuary-count-stepper'))continue;
  const input=row.querySelector('input'),title=row.querySelector('span');if(!input||!title)continue;
  const type=input.dataset.type,icon=document.createElement('span'),copy=document.createElement('span'),subtitle=document.createElement('small'),controls=document.createElement('span');
  icon.className='sanctuary-practice-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+({SST:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5"/>','FIB L':'<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12h3v8H4zM17 12h3v8h-3z"/>','MC single choice':'<path d="M9 5h12M9 12h12M9 19h8"/><circle cx="3" cy="5" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="19" r="1"/>','MC multiple choice':'<path d="M9 5h12M9 12h12M9 19h8"/><path d="M2 4h3v3H2zM2 11h3v3H2zM2 18h3v3H2z"/>',HCS:'<path d="M20 12v8H4V4h10M8 10l4 4 9-11"/>',SMW:'<path d="M3 5h18M3 12h18M3 19h12M20 19h1"/>',HIW:'<path d="M6 3h9l4 4v6M6 3v18h7M9 8h4M9 12h5M9 16h2M13 20l7-7 2 2-7 7-3 1z"/>',WFD:'<path d="M3 10v4M7 6v12M12 3v18M17 7v10M21 10v4"/>'}[type]||'<path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/>')+'</svg>';
  copy.className='sanctuary-practice-copy';subtitle.textContent=names[type]||'Completed questions';title.replaceWith(copy);copy.append(title,subtitle);
  controls.className='sanctuary-count-stepper';
  for(const [direction,label] of [[-1,'Decrease'],[1,'Increase']]){const button=document.createElement('button');button.type='button';button.textContent=direction===1?'+':'−';button.setAttribute('aria-label',label+' '+type+' count');button.addEventListener('click',event=>{event.preventDefault();direction===1?input.stepUp():input.stepDown();input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});controls.append(button);}
  controls.insertBefore(input,controls.lastChild);row.prepend(icon);row.append(controls);
 }}
 decorate();new MutationObserver(decorate).observe(rows,{childList:true});
})();

/* Speaking/writing/reading cards retain their existing targets and actions. */
(()=>{
 'use strict';
 const host=document.querySelector('.hero-task-card');if(!host)return;
 const descriptions={DI:'Describe Image',SGD:'Summarize Group Discussion',RL:'Re-tell Lecture',RTS:'Respond to a Situation',WE:'Write Essay',SWT:'Summarize Written Text'};
 function decorate(){for(const row of host.querySelectorAll('.hero-task-row')){
  if(row.querySelector('.sanctuary-task-icon'))continue;
  const name=row.querySelector('b');if(!name)continue;
  const type=name.firstChild?.textContent?.trim()||name.textContent.trim(),icon=document.createElement('span');icon.className='sanctuary-practice-icon sanctuary-task-icon';icon.setAttribute('aria-hidden','true');
  icon.innerHTML='<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+({DI:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',SGD:'<path d="M3 4h14v10H9l-4 4v-4H3zM17 8h4v11h-3l-3 3v-5M6 8h8M6 11h5"/>',RL:'<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/>',RTS:'<path d="M3 4h18v13H11l-5 4v-4H3zM7 8h10M7 12h6"/>'}[type]||'<path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/>')+'</svg>';
  if(descriptions[type]&&!name.querySelector('small')){const subtitle=document.createElement('small');subtitle.textContent=descriptions[type];name.append(subtitle);}
  row.prepend(icon);
 }}
 decorate();new MutationObserver(decorate).observe(host,{childList:true,subtree:true});
})();
