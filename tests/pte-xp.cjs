const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const values=new Map(),events={},ctx={Intl,Date,console,day:()=>"2026-10-19",window:{},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},addEventListener:(n,f)=>(events[n]??=[]).push(f),dispatchEvent:e=>(events[e.type]||[]).forEach(f=>f(e)),Event:class{constructor(type){this.type=type}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dashboard-store.js','utf8'),ctx);
const pte=fs.readFileSync('pte.js','utf8'),start=pte.indexOf('const pteXpRates='),end=pte.indexOf("addEventListener('rex-pte-backfilled'",start);vm.runInContext(pte.slice(start,end),ctx);
const state=()=>JSON.parse(values.get('arcane-sanctuary-v1'));
values.set('arcane-sanctuary-v1',JSON.stringify({xp:12,focusXp:12,skill:{will:12},log:[]}));
const records={'pte|di':{kind:'pte',id:'2026-10-19:speaking:DI',data:{date:'2026-10-19',type:'speaking:DI',count:2}},'pte|wfd':{kind:'pte',id:'2026-10-19:listening:WFD',data:{date:'2026-10-19',type:'listening:WFD',count:30}}};
ctx.window.RexDashboardStore.apply(records);ctx.dispatchEvent(new ctx.Event('rex-cloud-changed'));
assert.equal(state().xp,48);assert.equal(state().ptePracticeXp,36);assert.equal(state().focusXp,12);
ctx.dispatchEvent(new ctx.Event('rex-cloud-changed'));assert.equal(state().xp,48);
values.set('rex-pte-daily-v1',JSON.stringify({'2026-10-19':[{type:'DI',done:true},{type:'DI',done:true}]}));
// Cloud merge baseline already represents the local rows; do not count a second time.
ctx.window.RexDashboardStore.refresh();ctx.window.RexDashboardStore.apply(records);ctx.dispatchEvent(new ctx.Event('rex-cloud-changed'));assert.equal(state().xp,48);
values.set('rex-pte-daily-v1',JSON.stringify({'2026-10-19':[{type:'DI',done:true}]}));ctx.dispatchEvent(new ctx.Event('rex-local-changed'));assert.equal(state().xp,45);
records['pte|wfd'].data.count=0;ctx.window.RexDashboardStore.apply(records);ctx.dispatchEvent(new ctx.Event('rex-cloud-changed'));assert.equal(state().xp,18);
records.extra={kind:'pte',id:'2026-10-19:custom:Exercise',data:{date:'2026-10-19',type:'custom:Exercise',count:99}};ctx.window.RexDashboardStore.apply(records);ctx.dispatchEvent(new ctx.Event('rex-cloud-changed'));assert.equal(state().xp,18);
console.log('PASS: cloud DI + WFD + focus = 48, idempotent merge, deletion and non-PTE exclusion');

