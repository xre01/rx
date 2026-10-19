(()=>{'use strict';
const stateKey='arcane-sanctuary-v1',read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const day=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
function calculate(records,now=Date.now()){
 const secondsByDay={},byDay={},seen=new Set();
 for(const r of records||[]){if(!r||r.deleted||!Number.isFinite(r.seconds)||r.seconds<60||!Number.isFinite(r.endedAt)||r.endedAt>now||!Number.isFinite(new Date(r.endedAt).getTime()))continue;
  const id=r.id||[r.endedAt,r.mode,r.seconds].join('-');if(seen.has(id))continue;seen.add(id);const date=day(r.endedAt);secondsByDay[date]=(secondsByDay[date]||0)+r.seconds;
 }
 for(const [date,seconds]of Object.entries(secondsByDay))byDay[date]=Math.min(30,Math.floor(seconds/300));
 return {total:Object.values(byDay).reduce((sum,x)=>sum+x,0),byDay,secondsByDay};
}
let busy=false;
function reconcile(){if(busy)return;busy=true;try{
 const records=[...read('rex-focus-sessions-v1',[]),...read('rex-focus-abandoned-v1',[])],result=calculate(records),state=read(stateKey,{}),previous=Math.max(0,Number(state.focusXp)||0),delta=result.total-previous;
 if(delta){state.xp=Math.max(0,(Number(state.xp)||0)+delta);state.focusXp=result.total;state.skill=state.skill||{};state.skill.will=Math.max(0,(Number(state.skill.will)||0)+delta);state.log=Array.isArray(state.log)?state.log:[];state.log.unshift(day(Date.now())+' · Focus XP '+(delta>0?'+':'')+delta+' EXP');state.log=state.log.slice(0,100);localStorage.setItem(stateKey,JSON.stringify(state));dispatchEvent(new Event('rex-local-changed'));dispatchEvent(new Event('rex-cloud-changed'));}
 const note=document.getElementById('focusXpRule');if(note)note.textContent='Focus XP · +'+(result.byDay[day(Date.now())]||0)+' / 30 today · 5 min = 1 EXP';return result;
 }finally{busy=false;}}
window.RexFocusXP={calculate,reconcile};
const actions=document.querySelector('#focusTimerView .focus-actions');if(actions){const note=document.createElement('p');note.id='focusXpRule';note.className='focus-stat-note';note.setAttribute('role','status');actions.after(note);}
const update=()=>{try{reconcile();}catch{const note=document.getElementById('focusXpRule');if(note)note.textContent='Could not update Focus XP. Check device storage.';}};
addEventListener('rex-local-changed',update);addEventListener('rex-cloud-changed',update);addEventListener('storage',update);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});update();
})();
