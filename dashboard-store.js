(()=>{
  'use strict';
  const key='rex-dashboard-metrics-v1';
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const state=read(key,{counts:{},baseline:{},checkins:{}});
  state.counts??={};state.baseline??={};state.checkins??={};
  const day=(value=Date.now())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
  const save=()=>localStorage.setItem(key,JSON.stringify(state));
  const records=()=>read('rex-focus-sessions-v1',[]).filter(r=>r&&Number.isFinite(r.seconds)&&r.seconds>=60&&Number.isFinite(r.endedAt));
  function localCounts(){
    const counts={};
    const add=(date,type,n)=>{n=Number(n);if(!validDate(date)||typeof type!=='string'||!type.trim()||!Number.isSafeInteger(n)||n<0)return;type=type.trim().slice(0,80);const id=date+':'+type;counts[id]??={date,type,count:0};counts[id].count+=n};
    for(const [date,rows] of Object.entries(read('rex-pte-daily-v1',{})))if(Array.isArray(rows))for(const r of rows)if(r?.done)add(date,'speaking:'+r.type,1);
    for(const r of read('rex-pte-other-counts-v1',[]))if(r)add(r.date,(r.module||'speaking')+':'+r.type,r.count);
    for(const task of read('rex-custom-cultivation-v1',[])){
      if(!task||!task.title||task.module==='writing'&&/^swt$/i.test(task.title.trim()))continue;
      const type=(task.module||'custom')+':'+task.title;
      if(task.repeat){for(const [date,r]of Object.entries(task.history||{}))add(date,type,r?.done||0)}else add(task.date,type,task.done||0);
    }
    return counts;
  }
  function refresh(){
    const current=localCounts();
    for(const id of new Set([...Object.keys(current),...Object.keys(state.baseline)])){
      const count=current[id]?.count||0,previous=state.baseline[id]||0,delta=count-previous;
      if(delta&&(state.counts[id]||current[id])){const existing=state.counts[id]||{...current[id],count:0};state.counts[id]={...existing,count:Math.max(0,existing.count+delta)}}
    }
    state.baseline=Object.fromEntries(Object.entries(current).map(([id,r])=>[id,r.count]));
    for(const r of Object.values(state.counts))if(r.count>0)state.checkins[r.date]=true;
    for(const r of records())state.checkins[day(r.endedAt)]=true;
    for(const r of read('rex-daily-growth-v1',[]))if(validDate(r?.date))state.checkins[r.date]=true;
    for(const [date,list]of Object.entries(read('arcane-sanctuary-v1',{}).done||{}))if(validDate(date)&&Array.isArray(list)&&list.length)state.checkins[date]=true;
    save();
  }
  function snapshot(){
    const result={};
    for(const [id,data]of Object.entries(state.counts))result['pte|'+id]={kind:'pte',id,data:{date:data.date,type:data.type,count:data.count}};
    for(const date of Object.keys(state.checkins))result['checkin|'+date]={kind:'checkin',id:date,data:{date}};
    for(const target of read('rex-countdown-targets-v1',[]))if(target?.id&&validDate(target.date))result['countdown|'+target.id]={kind:'countdown',id:target.id,data:{title:target.title,date:target.date}};
    for(const [kind,key]of [['focus','rex-focus-sessions-v1'],['abandoned','rex-focus-abandoned-v1']])for(const record of read(key,[])){
      if(!record||!Number.isFinite(record.seconds)||record.seconds<60||!Number.isFinite(record.endedAt))continue;
      const id=record.id||[record.endedAt,record.mode,record.seconds].join('-');
      const data={endedAt:record.endedAt,seconds:record.seconds,mode:record.mode,goal:typeof record.goal==='string'?record.goal.slice(0,80):''};
      result[kind+'|'+id]={kind,id,data};
    }
    return result;
  }
  function apply(all){
    state.counts={};state.checkins={};const countdown=[],focus=[],abandoned=[];
    for(const r of Object.values(all)){
      if(r.deleted)continue;
      if(r.kind==='pte')state.counts[r.id]=r.data;
      if(r.kind==='checkin')state.checkins[r.data.date]=true;
      if(r.kind==='countdown')countdown.push({id:r.id,...r.data});
      if(r.kind==='focus'&&r.data.seconds>=60)focus.push({...r.data,id:r.id});
      if(r.kind==='abandoned'&&r.data.seconds>=60)abandoned.push({...r.data,id:r.id});
    }
    localStorage.setItem('rex-countdown-targets-v1',JSON.stringify(countdown));
    localStorage.setItem('rex-focus-sessions-v1',JSON.stringify(focus));
    localStorage.setItem('rex-focus-abandoned-v1',JSON.stringify(abandoned));
    save();
  }
  function summary(date=day()){
    const counts=Object.values(state.counts).filter(r=>r.date===date&&r.count>0).map(r=>({...r,label:r.type.slice(r.type.indexOf(':')+1)}));
    const sessions=records().filter(r=>day(r.endedAt)===date);
    return {counts,seconds:sessions.reduce((n,r)=>n+r.seconds,0),days:Object.keys(state.checkins).filter(date=>date<=day()).sort(),sessions};
  }
  window.RexDashboardStore={refresh,snapshot,apply,summary};
  try{refresh()}catch{}
  addEventListener('rex-local-changed',()=>{try{refresh()}catch{}});
  addEventListener('storage',event=>{if(event.key===key){const saved=read(key,{});state.counts=saved.counts||{};state.baseline=saved.baseline||{};state.checkins=saved.checkins||{}}else try{refresh()}catch{}});
})();
