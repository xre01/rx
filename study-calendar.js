(()=>{
  'use strict';
  const home=document.getElementById('home'),calendar=document.createElement('section');
  calendar.className='dashboard-calendar-card';
  calendar.innerHTML='<div class="calendar-heading"><h2>✧ Study Calendar</h2><div class="calendar-navigation"><button type="button" data-month="-1" aria-label="Previous month">‹</button><span class="calendar-month"></span><button type="button" data-month="1" aria-label="Next month">›</button></div></div><div class="calendar-weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div class="calendar-days"></div><div class="calendar-selected" role="status" aria-live="polite"></div>';
  home.append(calendar);
  const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  let today=day(),selected=today,month=today.slice(0,7);
  function render(){
    const current=day();if(current!==today){if(selected===today)selected=current;if(month===today.slice(0,7))month=current.slice(0,7);today=current}
    const store=window.RexDashboardStore,active=new Set(store.summary().days);
    calendar.querySelector('.calendar-month').textContent=new Intl.DateTimeFormat('en-AU',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));
    const grid=calendar.querySelector('.calendar-days');grid.replaceChildren();
    const offset=(new Date(month+'-01T12:00:00Z').getUTCDay()+6)%7;
    for(let i=0;i<offset;i++){const space=document.createElement('span');space.setAttribute('aria-hidden','true');grid.append(space)}
    const [year,m]=month.split('-').map(Number),length=new Date(Date.UTC(year,m,0)).getUTCDate();
    for(let n=1;n<=length;n++){const d=month+'-'+String(n).padStart(2,'0'),b=document.createElement('button');b.type='button';b.textContent=n;b.className='calendar-day'+(active.has(d)?' has-activity':'')+(d===today?' is-today':'');b.setAttribute('aria-pressed',String(d===selected));b.setAttribute('aria-label',d+(active.has(d)?', Has study records':''));b.addEventListener('click',()=>{selected=d;render()});grid.append(b)}
    const s=store.summary(selected),count=s.counts.reduce((n,r)=>n+r.count,0);
    calendar.querySelector('.calendar-selected').textContent=selected+' · Completed '+count+' items · Focus '+Math.floor(s.seconds/60)+' min';
  }
  calendar.querySelectorAll('[data-month]').forEach(b=>b.addEventListener('click',()=>{const [y,m]=month.split('-').map(Number);month=new Date(Date.UTC(y,m-1+Number(b.dataset.month),1)).toISOString().slice(0,7);render()}));
  render();addEventListener('rex-local-changed',render);addEventListener('rex-cloud-changed',render);addEventListener('storage',render);setInterval(render,60000);
})();
