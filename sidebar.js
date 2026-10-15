(()=>{
'use strict';
const body=document.body,header=document.querySelector('.arcane-header'),main=document.querySelector('main'),dashboard=document.querySelector('.compact-dashboard');if(!header||!main||!dashboard)return;
const sidebar=document.createElement('aside');sidebar.className='rex-sidebar';sidebar.setAttribute('aria-label','Sidebar');
const brand=document.querySelector('.header-brand');if(brand)sidebar.append(brand);
const user=document.createElement('div');user.className='rex-sidebar-user';const profile=document.querySelector('.profile-menu');if(profile)user.append(profile);const greeting=document.createElement('div');greeting.innerHTML='<b>Welcome back, Rex</b><small>A little progress every day ✦</small>';user.append(greeting);sidebar.append(user);
const rule=document.createElement('div');rule.className='rex-sidebar-rule';rule.textContent='◇';sidebar.append(rule);
const icons={home:'<path d="m3 10 9-7 9 7v10H6V10m3 10v-7h6v7"/>',archives:'<path d="M3 5c3-1 6 0 9 2v14c-3-2-6-3-9-2V5Zm18 0c-3-1-6 0-9 2v14c3-2 6-3 9-2V5Z"/>'};
const nav=document.createElement('nav');nav.className='rex-sidebar-nav';nav.setAttribute('aria-label','Main navigation');for(const [view,title] of [['home','Overview'],['archives','Notion Archive']]){const button=document.createElement('button');button.type='button';button.dataset.sideView=view;button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[view]+'</svg><span>'+title+'</span><i aria-hidden="true">✦</i>';button.addEventListener('click',()=>{document.querySelectorAll('.panelview').forEach(panel=>panel.classList.toggle('active',panel.id===view));nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-current',b===button?'page':'false')});window.scrollTo({top:0,behavior:'instant'})});if(view==='home'){button.classList.add('active');button.setAttribute('aria-current','page')}nav.append(button)}sidebar.append(nav);
const sideFooter=document.createElement('div');sideFooter.className='rex-sidebar-footer';const lock=document.getElementById('rexLockButton');if(lock){lock.textContent='Lock page';sideFooter.append(lock)}const footerNote=document.createElement('small');footerNote.textContent='REX · SANCTUARY';sideFooter.append(footerNote);sidebar.append(sideFooter);header.hidden=true;body.insertBefore(sidebar,main);
const heading=dashboard.querySelector('.compact-heading');const date=document.createElement('time');date.className='rex-dashboard-date';function stamp(){date.textContent=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date())}stamp();heading.append(date);
const metricIcons=['<path d="M4 5h7v14H4zm9 0h7v14h-7M7 9h2m-2 4h2m7-4h2m-2 4h2"/>','<path d="M6 3h12M6 21h12M7 3v5l5 4 5-4V3M7 21v-5l5-4 5 4v5"/>','<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-12 5h6"/>','<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>'];
function polishMetrics(){dashboard.querySelectorAll('.compact-metrics>article,.compact-metrics>button').forEach((cell,i)=>{if(cell.querySelector('.rex-metric-icon'))return;const icon=document.createElement('span');icon.className='rex-metric-icon';icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+metricIcons[i]+'</svg>';cell.prepend(icon);if(i!==2){const hint=document.createElement('small');hint.className='rex-metric-hint';hint.textContent=['Keep going, one step at a time','Small moments of focus add up','','Track your days, see your progress'][i];cell.append(hint)}})}polishMetrics();new MutationObserver(polishMetrics).observe(dashboard.querySelector('.compact-metrics'),{childList:true});
const focus=document.createElement("section");focus.className="daily-reflection-host";dashboard.querySelector(".compact-side").append(focus);
// Brief count records remain count-only. Upload rows keep their existing entry buttons.
const taskHost=dashboard.querySelector('.hero-task-card');const prettyRows=()=>{taskHost.querySelectorAll('.hero-task-arrow').forEach(button=>{button.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/></svg>'})};prettyRows();new MutationObserver(prettyRows).observe(taskHost.querySelector('.hero-task-list'),{childList:true});
})();








