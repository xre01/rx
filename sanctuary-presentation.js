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
