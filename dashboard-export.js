(()=>{
'use strict';
const add=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
function range(period,date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Choose a valid date.');let start=date,end=date;const [y,m]=date.split('-').map(Number);if(period==='week'){start=add(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7));end=add(start,6);}else if(period==='month'){start=date.slice(0,7)+'-01';end=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);}else if(period==='year'){start=y+'-01-01';end=y+'-12-31';}else if(period!=='day')throw Error('Choose a period.');const dates=[];for(let d=start;d<=end;d=add(d,1))dates.push(d);return {start,end,dates};}
function aggregate(store,period,date){const r=range(period,date),types=new Map(),active=new Set(store.summary().days),buckets=period==='year'?Array.from({length:12},(_,i)=>({label:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],count:0})):r.dates.map(d=>({label:period==='week'?['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d+'T12:00:00Z').getUTCDay()]:d.slice(8),count:0}));let total=0,seconds=0,days=0;for(const [i,d]of r.dates.entries()){const summary=store.summary(d);seconds+=summary.seconds;if(active.has(d))days++;for(const row of summary.counts){total+=row.count;const label=row.label||row.type.split(':').slice(1).join(':');types.set(label,(types.get(label)||0)+row.count);buckets[period==='year'?Number(d.slice(5,7))-1:i].count+=row.count;}}return {...r,total,seconds,days,types:[...types].sort((a,b)=>b[1]-a[1]),buckets};}
if(typeof module==='object'&&module.exports){module.exports={range,aggregate};return;}
const store=window.RexDashboardStore,controls=document.querySelector('.dashboard-view-controls');if(!store||!controls)return;
const open=controls.querySelector('.dashboard-export')||document.createElement('button');open.type='button';open.className='dashboard-export';open.title='Export PNG';open.setAttribute('aria-label',open.title);open.innerHTML='<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20h17M6.5 16.5v-5M12 16.5v-12M17.5 16.5v-8"/></svg>';controls.append(open);
const dialog=document.createElement('dialog');dialog.id='dashboardExport';dialog.setAttribute('aria-labelledby','dashboardExportTitle');dialog.innerHTML='<header><h2 id="dashboardExportTitle">Export Dashboard</h2><button type="button" class="export-close" aria-label="Close export">×</button></header><div class="export-options"><label>Period<select name="period"><option value="day">Day</option><option value="week" selected>Week</option><option value="month">Month</option><option value="year">Year</option></select></label><label>Date<input name="date" type="date" required></label></div><p class="export-help">Weeks run Monday–Sunday. Choose any date within the period.</p><p class="export-status" role="status"></p><img class="export-image" alt="Dashboard statistics PNG preview"><footer><button type="button" class="export-download">Download PNG</button></footer>';document.body.append(dialog);
const period=dialog.querySelector('select'),date=dialog.querySelector('input'),status=dialog.querySelector('.export-status'),image=dialog.querySelector('img'),download=dialog.querySelector('.export-download');let filename='';

function makePicker(field,label){
  const wrapper=field.parentElement;
  const host=document.createElement('div');
  host.className='export-field';
  const caption=document.createElement('span');
  caption.textContent=label;
  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.className='export-picker';
  trigger.setAttribute('aria-label',label);
  trigger.setAttribute('aria-expanded','false');
  const popup=document.createElement('div');
  popup.id='export'+label+'Picker';
  popup.className='export-picker-panel';
  popup.hidden=true;
  trigger.setAttribute('aria-controls',popup.id);
  field.hidden=true;
  field.tabIndex=-1;
  wrapper.replaceWith(host);
  host.append(caption,field,trigger,popup);
  function close(focus=false){
    popup.hidden=true;
    trigger.setAttribute('aria-expanded','false');
    if(focus)trigger.focus();
  }
  trigger.addEventListener('click',()=>{
    const opening=popup.hidden;
    for(const panel of dialog.querySelectorAll('.export-picker-panel'))panel.hidden=true;
    for(const button of dialog.querySelectorAll('.export-picker'))button.setAttribute('aria-expanded','false');
    if(opening){
      popup.hidden=false;
      trigger.setAttribute('aria-expanded','true');
      popup.querySelector('[aria-pressed="true"],[aria-selected="true"],button')?.focus();
    }
  });
  host.addEventListener('keydown',event=>{
    if(!popup.hidden&&event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true)}
  });
  dialog.addEventListener('click',event=>{if(!host.contains(event.target))close()});
  dialog.addEventListener('close',()=>close());
  return {trigger,popup,close};
}
const periodPicker=makePicker(period,'Period');
for(const option of period.options){
  const button=document.createElement('button');
  button.type='button';
  button.className='export-period-option';
  button.textContent=option.text;
  button.dataset.period=option.value;
  button.addEventListener('click',()=>{
    period.value=option.value;
    period.dispatchEvent(new Event('change'));
    periodPicker.close(true);
  });
  button.addEventListener('keydown',event=>{
    const options=Array.from(periodPicker.popup.children),index=options.indexOf(button);
    const next={ArrowDown:(index+1)%options.length,ArrowUp:(index+options.length-1)%options.length,Home:0,End:options.length-1}[event.key];
    if(next!==undefined){event.preventDefault();options[next].focus()}
  });
  periodPicker.popup.append(button);
}
const datePicker=makePicker(date,'Date');
datePicker.popup.classList.add('export-calendar');
let calendarMonth='';
const monthHeader=document.createElement('div');
monthHeader.className='export-calendar-heading';
const previous=document.createElement('button'),next=document.createElement('button'),monthTitle=document.createElement('span');
previous.type=next.type='button';
previous.textContent='‹';next.textContent='›';
previous.setAttribute('aria-label','Previous month');next.setAttribute('aria-label','Next month');
monthTitle.setAttribute('aria-live','polite');
monthHeader.append(previous,monthTitle,next);
const weekHeader=document.createElement('div');
weekHeader.className='export-calendar-weekdays';
for(const name of ['Mo','Tu','We','Th','Fr','Sa','Su']){
  const span=document.createElement('span');span.textContent=name;weekHeader.append(span);
}
const days=document.createElement('div');
days.className='export-calendar-days';
const todayButton=document.createElement('button');
todayButton.type='button';todayButton.className='export-calendar-today';todayButton.textContent='Today';
datePicker.popup.append(monthHeader,weekHeader,days,todayButton);
function sydneyToday(){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
function chooseDate(value){
  date.value=value;
  date.dispatchEvent(new Event('change'));
  datePicker.close(true);
}
function moveMonth(delta){
  const value=new Date(calendarMonth+'T12:00:00Z');
  value.setUTCMonth(value.getUTCMonth()+delta);
  const year=value.getUTCFullYear();
  if(year<1||year>9999)return;
  calendarMonth=value.toISOString().slice(0,10);
  renderCalendar();
}
function renderCalendar(focusDate){
  const first=calendarMonth||date.value.slice(0,7)+'-01';
  calendarMonth=first;
  monthTitle.textContent=new Intl.DateTimeFormat('en-AU',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(first+'T12:00:00Z'));
  const start=add(first,-((new Date(first+'T12:00:00Z').getUTCDay()+6)%7));
  days.replaceChildren();
  for(let i=0;i<42;i++){
    const value=add(start,i),button=document.createElement('button');
    button.type='button';
    button.textContent=String(Number(value.slice(8)));
    button.dataset.date=value;
    button.className=value.slice(0,7)===first.slice(0,7)?'':'is-outside';
    button.setAttribute('aria-label',value);
    button.setAttribute('aria-pressed',String(value===date.value));
    if(value===sydneyToday())button.setAttribute('aria-current','date');
    button.tabIndex=value===(focusDate||date.value)?0:-1;
    button.addEventListener('click',()=>chooseDate(value));
    button.addEventListener('keydown',event=>{
      const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
      let target;
      if(Object.hasOwn(offsets,event.key))target=add(value,offsets[event.key]);
      if(event.key==='Home')target=add(value,-((new Date(value+'T12:00:00Z').getUTCDay()+6)%7));
      if(event.key==='End')target=add(value,6-((new Date(value+'T12:00:00Z').getUTCDay()+6)%7));
      if(event.key==='PageUp'||event.key==='PageDown'){
        event.preventDefault();moveMonth((event.key==='PageUp'?-1:1)*(event.shiftKey?12:1));
        target=calendarMonth;
      }
      if(target){
        event.preventDefault();calendarMonth=target.slice(0,7)+'-01';renderCalendar(target);
        days.querySelector('[data-date="'+target+'"]')?.focus();
      }
    });
    days.append(button);
  }
  if(!days.querySelector('[tabindex="0"]'))days.querySelector('button:not(.is-outside)').tabIndex=0;
}
previous.addEventListener('click',()=>moveMonth(-1));
next.addEventListener('click',()=>moveMonth(1));
todayButton.addEventListener('click',()=>chooseDate(sydneyToday()));
datePicker.trigger.addEventListener('click',()=>{
  if(!datePicker.popup.hidden){
    calendarMonth=date.value.slice(0,7)+'-01';renderCalendar();
    days.querySelector('[tabindex="0"]')?.focus();
  }
});
function updatePickers(){
  periodPicker.trigger.textContent=period.selectedOptions[0].textContent;
  for(const button of periodPicker.popup.children)button.setAttribute('aria-pressed',String(button.dataset.period===period.value));
  datePicker.trigger.textContent=new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date.value+'T12:00:00Z'));
  datePicker.trigger.setAttribute('aria-label','Date, '+datePicker.trigger.textContent);
}
function draw(){download.disabled=true;try{updatePickers();const data=aggregate(store,period.value,date.value),rows=Math.max(1,data.types.length),height=980+rows*46,width=1600;const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('PNG export is unavailable in this browser.');const style=getComputedStyle(document.documentElement);
const color=(name,fallback)=>style.getPropertyValue('--calm-'+name).trim()||fallback;
const palette={page:color('page','#e9eee4'),surface:color('surface','#f3f5ed'),inset:color('inset','#e2e9dc'),text:color('text','#293d36'),muted:color('muted','#586b60'),accent:color('accent','#486650'),border:color('border','#bccab7')};
const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,palette.page);gradient.addColorStop(1,palette.inset);ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
function text(value,x,y,size=24,color=palette.text,font='system-ui, sans-serif'){ctx.font=(size>=48?'500 ':'400 ')+size+'px '+font;ctx.fillStyle=color;ctx.fillText(String(value),x,y);}
function box(x,y,w,h,r=26,color='#ffffffdc'){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
function fit(value,maxWidth,size=24){ctx.font=size+'px system-ui, sans-serif';let s=String(value);while(ctx.measureText(s).width>maxWidth&&s.length>1)s=s.slice(0,-2);return s===String(value)?s:s+'…';}
box(40,40,width-80,height-80,34,palette.surface);
text(({day:'Daily',week:'Weekly',month:'Monthly',year:'Yearly'})[period.value]+' Dashboard',86,185,48,palette.text);text(data.start+(data.start===data.end?'':'  —  '+data.end),86,235,24,palette.muted);
const stats=[['Completed',data.total,'questions'],['Focus time',Math.floor(data.seconds/60),'minutes'],['Study days',data.days,'/ '+data.dates.length+' days']];stats.forEach(([label,value,unit],i)=>{const x=86+i*482;box(x,280,454,160,22,palette.inset);text(label,x+25,323,22,palette.muted);text(value,x+25,389,52,palette.accent);text(unit,x+25,420,18,palette.muted);});
text(period.value==='year'?'Monthly practice':'Daily practice',86,498,27,palette.text);const chartX=100,chartY=550,chartW=1400,chartH=190,max=Math.max(1,...data.buckets.map(b=>b.count)),step=chartW/data.buckets.length;ctx.strokeStyle=palette.border;ctx.beginPath();ctx.moveTo(chartX,chartY+chartH);ctx.lineTo(chartX+chartW,chartY+chartH);ctx.stroke();data.buckets.forEach((b,i)=>{const bw=Math.min(58,step*.56),h=b.count?b.count/max*(chartH-30):4,x=chartX+i*step+(step-bw)/2;box(x,chartY+chartH-h,bw,h,Math.min(8,bw/2),b.count?palette.accent:palette.inset);if(data.buckets.length<=12||i%3===0||i===data.buckets.length-1){ctx.textAlign='center';text(b.label,x+bw/2,chartY+chartH+35,18,palette.muted);ctx.textAlign='left';}if(b.count){ctx.textAlign='center';text(b.count,x+bw/2,chartY+chartH-h-12,18,palette.muted);ctx.textAlign='left';}});
if(!data.total){ctx.textAlign='center';text('No practice recorded yet',800,chartY+chartH/2,24,palette.muted);ctx.textAlign='left';}
text('Practice by type',86,835,27,palette.text);if(!data.types.length)text('No completed practice in this period.',86,890,24,palette.muted);data.types.forEach(([label,count],i)=>{const y=880+i*46;text(fit(label,430),86,y+10,23,palette.muted);box(560,y-8,780,9,4,palette.inset);if(data.total)box(560,y-8,Math.max(8,count/data.total*780),9,4,palette.accent);ctx.textAlign='right';text(count,1500,y+10,23,palette.muted);ctx.textAlign='left';});
text('Local records + backfills · Sydney dates · Generated '+new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',year:'numeric',month:'short',day:'numeric'}).format(new Date()),86,height-85,18,palette.muted);image.src=canvas.toDataURL('image/png');filename='Rex-Dashboard-'+period.value+'-'+data.start+'.png';status.textContent=data.start+(data.start===data.end?'':' — '+data.end)+' · '+data.total+' questions';download.disabled=false;}catch(error){status.textContent=error.message;image.removeAttribute('src');}}
function openExport(){date.value=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());draw();dialog.showModal();}window.RexDashboardExport={open:openExport};open.addEventListener('click',openExport);for(const field of [period,date])field.addEventListener('change',draw);dialog.querySelector('.export-close').addEventListener('click',()=>dialog.close());download.addEventListener('click',()=>{if(!image.src||download.disabled)return;const raw=atob(image.src.split(',')[1]),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='PNG saved. You can also save the preview image.';});
})();
