(()=>{
'use strict';
const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
function calculate(records,today){
 const books=new Set(),articles=new Map(),seen=new Set();
 for(const r of records||[]){
  if(!r||r.deleted||seen.has(r.id))continue;seen.add(r.id);
  if(r.kind==='book'){for(const n of r.logs||[])if(validDay(n.date)&&n.date<=today&&typeof n.note==='string'&&n.note.trim())books.add(n.date);if(typeof r.body==='string'&&r.body.trim()&&validDay(r.writtenDate)&&r.writtenDate<=today)books.add(r.writtenDate);}
  if(r.kind==='article'&&validDay(r.writtenDate)&&r.writtenDate<=today&&typeof r.body==='string'&&r.body.trim())articles.set(r.writtenDate,(articles.get(r.writtenDate)||0)+1);
 }
 const bookXp=books.size*3,articleXp=[...articles.values()].reduce((sum,count)=>sum+Math.min(10,count)*3,0);
 return {bookXp,articleXp,total:bookXp+articleXp};
}
function reconcile(records,today){
 const total=calculate(records,today).total,key='arcane-sanctuary-v1',state=JSON.parse(localStorage.getItem(key)||'{}'),previous=Math.max(0,Number(state.readingXp)||0),delta=total-previous;
 if(!delta)return total;
 state.xp=Math.max(0,(Number(state.xp)||0)+delta);state.readingXp=total;state.skill=state.skill||{};state.skill.wisdom=Math.max(0,(Number(state.skill.wisdom)||0)+delta);
 localStorage.setItem(key,JSON.stringify(state));dispatchEvent(new Event('rex-local-changed'));dispatchEvent(new Event('rex-cloud-changed'));return total;
}
window.RexReadingXP={calculate,reconcile};
})();

