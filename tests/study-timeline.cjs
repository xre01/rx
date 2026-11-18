const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<section id="home"></section>',{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),shift=n=>new Date(Date.parse(today+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
let days=Array.from({length:11},(_,i)=>shift(-i-1)).concat('2025-01-01',shift(1)),scroll=0,saved;
w.scrollTo=o=>{scroll=o.top};Object.defineProperty(w,'scrollY',{get:()=>scroll});w.HTMLElement.prototype.scrollIntoView=function(){};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
w.RexDashboardStore={summary:date=>({days,counts:date===today?[]:[{type:'speaking:DI',label:'DI',count:2},{type:'speaking:RS',label:'RS',count:3}],seconds:date===today?0:1500,sessions:date===today?[]:[{goal:'DI practice',seconds:1500}]})};
w.RexStudyMakeup={read:()=>[],save:r=>{saved=r;return r}};
const query=s=>w.document.querySelector(s),cards=()=>[...w.document.querySelectorAll('.study-day-card')],page=()=>query('.study-page-number').textContent;
try{
 w.eval(fs.readFileSync('study-calendar.js','utf8'));
 assert.equal(query('.calendar-days'),null);assert.equal(cards().length,5);assert.equal(cards()[0].dataset.date,today);assert.equal(page(),'1 / 3');assert.match(query('.study-page-summary').textContent,/of 13 days/);
 query('[aria-label="Next page"]').click();assert.equal(page(),'2 / 3');scroll=500;cards()[0].click();assert.equal(query('.study-timeline-list').hidden,true);assert.equal(query('.study-details').hidden,false);assert.match(query('.study-details').textContent,/DI practice/);assert.match(query('.study-detail-stats').textContent,/25 min/);assert.equal(query('.calendar-makeup').hidden,false);
 assert.equal(query('.study-details').textContent.toLowerCase().includes('reflection'),false);
 query('[aria-label="Back to study timeline"]').click();assert.equal(page(),'2 / 3');assert.equal(scroll,500);assert.equal(w.document.activeElement.dataset.date,shift(-5));
 query('[aria-label="Next page"]').click();assert.equal(page(),'3 / 3');assert.equal(cards().length,3);assert.deepEqual([...w.document.querySelectorAll('.study-year-heading')].map(n=>n.textContent),[today.slice(0,4),'2025']);assert.equal(query('[aria-label="Next page"]').disabled,true);
 const picker=query('[aria-label="Open study date"]');picker.value='2024-12-03';picker.dispatchEvent(new w.Event('change'));assert.equal(query('.study-detail-bar time').textContent,'2024-12-03');query('.calendar-makeup').click();const form=query('form');assert.equal(form.elements.date.value,'2024-12-03');form.elements.module.value='speaking';form.elements.type.value='DI';form.elements.count.value='4';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(saved.date,'2024-12-03');assert.equal(saved.count,4);
 query('[aria-label="Back to study timeline"]').click();query('.study-timeline-heading button').click();assert.equal(query('.study-detail-bar time').textContent,today);assert.equal(query('.study-detail-actions .calendar-makeup'),null);
 query('[aria-label="Back to study timeline"]').click();
 const wait=e=>{e.preventDefault()};w.addEventListener('rex-date-selected',wait);cards()[1].click();assert.equal(query('.study-details').hidden,true);assert.match(query('.study-timeline-status').textContent,/Opening/);w.dispatchEvent(new w.CustomEvent('rex-date-ready',{detail:{date:shift(-1)}}));assert.equal(query('.study-detail-bar time').textContent,shift(-1));
 query('[aria-label="Back to study timeline"]').click();cards()[1].click();w.dispatchEvent(new w.CustomEvent('rex-date-switch-failed',{detail:{date:shift(-1),message:'Draft retained'}}));assert.equal(query('.study-details').hidden,true);assert.equal(query('.study-timeline-status').textContent,'Draft retained');w.removeEventListener('rex-date-selected',wait);
 days=[];w.dispatchEvent(new w.Event('rex-cloud-changed'));assert.equal(cards().length,1);assert.equal(query('.study-timeline-pagination'),null);
 console.log('PASS: five-day year-grouped pages, today/future handling, daily breakdown, back position, arbitrary dates, backfill, no reflection entry and asynchronous date success/failure');
}finally{w.close()}
