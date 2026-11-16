const fs=require('fs'),assert=require('node:assert/strict');
const existing=fs.readFileSync('tests/home-page.cjs','utf8');
const setup=new Function('require',existing.slice(0,existing.indexOf("const key='rex-home-planner"))+';return setup;')(require);
const key='rex-home-planner-v1',r=setup({},'2026-11-17T02:00:00Z'),{w,doc}=r;
const click=s=>doc.querySelector(s).click(),submit=()=>doc.querySelector('.life-editor form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
try{
 click('[data-agenda-view=list]');
 assert.equal(doc.querySelector('#agenda-tab-list').textContent,'');
 assert.equal(doc.querySelector('#agenda-tab-list').getAttribute('aria-label'),'清单');
 click('[data-add=task]');
 assert.equal(doc.querySelector('[name=date]').value,'');
 doc.querySelector('[name=title]').value='Shopping';
 click('.subtask-add');doc.querySelector('[name=subtaskTitle]').value='Coffee';
 submit();
 let task=JSON.parse(w.localStorage.getItem(key)).tasks[0];
 assert.equal(task.date,'');
 assert(doc.querySelector('.life-tasks').textContent.includes('Shopping'));
 assert.equal(doc.querySelector('[aria-label="Select agenda date"]').closest('label').className,'agenda-date');
 click('[aria-label="Complete subtask Coffee"]');
 task=JSON.parse(w.localStorage.getItem(key)).tasks[0];assert.equal(task.done,true);
 assert.equal(task.subtaskChecks.undated[task.subtasks[0].id],true);
 const firstCompletion=task.completedAt;
 assert.equal(firstCompletion,w.Date.now());
 assert.match(doc.querySelector('.task-completed-at').textContent,/Completed · Today 13:00/);
 const nextDay=setup({[key]:w.localStorage.getItem(key)},'2026-11-18T02:00:00Z');
 nextDay.doc.querySelector('[data-agenda-view=list]').click();
 assert.match(nextDay.doc.querySelector('.task-completed-at').textContent,/17 Nov 2026/);
 nextDay.w.close();
 const legacy=JSON.parse(w.localStorage.getItem(key));delete legacy.tasks[0].completedAt;
 const old=setup({[key]:JSON.stringify(legacy)},'2026-11-18T02:00:00Z');
 old.doc.querySelector('[data-agenda-view=list]').click();
 assert.equal(old.doc.querySelector('.task-completed-at').textContent,'Completed');
 old.w.close();
 click('[aria-label="Complete Shopping"]');
 assert.equal(JSON.parse(w.localStorage.getItem(key)).tasks[0].completedAt,undefined);
 w.Date.now=()=>firstCompletion+60000;
 click('[aria-label="Complete Shopping"]');
 assert.equal(JSON.parse(w.localStorage.getItem(key)).tasks[0].completedAt,firstCompletion+60000);
 click('.life-edit-button');submit();
 assert.equal(JSON.parse(w.localStorage.getItem(key)).tasks[0].completedAt,firstCompletion+60000);
 click('.life-edit-button');click('.subtask-add');
 [...doc.querySelectorAll('[name=subtaskTitle]')].at(-1).value='Milk';submit();
 assert.equal(JSON.parse(w.localStorage.getItem(key)).tasks[0].completedAt,undefined);
 w.Date.now=()=>firstCompletion+120000;
 click('[aria-label="Complete subtask Milk"]');
 assert.equal(JSON.parse(w.localStorage.getItem(key)).tasks[0].completedAt,firstCompletion+120000);
 click('[aria-label="Complete Shopping"]');
 assert.equal(doc.querySelector('.list-schedule'),null);
 click('.life-edit-button');doc.querySelector('[name=date]').value='2026-11-17';submit();
 task=JSON.parse(w.localStorage.getItem(key)).tasks[0];assert.equal(task.date,'2026-11-17');
 assert(!doc.querySelector('.life-tasks').textContent.includes('Shopping'));
 click('[data-agenda-view=day]');assert(doc.querySelector('.life-tasks').textContent.includes('Shopping'));
 click('.life-edit-button');doc.querySelector('[name=date]').value='';submit();
 click('[data-agenda-view=list]');assert(doc.querySelector('.life-tasks').textContent.includes('Shopping'));
 const reload=setup({[key]:w.localStorage.getItem(key)},'2026-11-18T02:00:00Z');
 reload.doc.querySelector('[data-agenda-view=list]').click();
 assert.equal(JSON.parse(reload.w.localStorage.getItem(key)).tasks[0].date,'');
 assert(reload.doc.querySelector('.life-tasks').textContent.includes('Shopping'));
 reload.w.close();
 console.log('PASS: undated tasks, subtasks, scheduling, date removal, List isolation and reload without rollover');
}finally{w.close()}
{
 const r=setup({[key]:JSON.stringify({tasks:[
  {id:'open',title:'Open',date:'',done:false},
  {id:'older',title:'Older',date:'',done:true,completedAt:1000},
  {id:'legacy',title:'Legacy',date:'',done:true},
  {id:'newer',title:'Newer',date:'',done:true,completedAt:2000}
 ],habits:[]})},'2026-11-17T02:00:00Z');
 try{
  r.doc.querySelector('[data-agenda-view=list]').click();
  const ids=()=>Array.from(r.doc.querySelectorAll('.life-tasks .life-task'),row=>row.dataset.taskId);
  assert.deepEqual(ids(),['newer','older','legacy','open']);
  r.doc.querySelector('[aria-label="Complete Open"]').click();
  assert.deepEqual(ids(),['open','newer','older','legacy']);
  r.doc.querySelector('[aria-label="Complete Open"]').click();
  assert.deepEqual(ids(),['newer','older','legacy','open']);
  console.log('PASS: completed list tasks sort newest first, legacy timestamps follow, reopened tasks return after completions');
 }finally{r.w.close()}
}
{
 const record={id:'convert',title:'Convert list task',date:'',done:false,repeat:'none',subtasks:[{id:'child',title:'Prepare'}],subtaskChecks:{undated:{child:false}}};
 const r=setup({[key]:JSON.stringify({tasks:[record],habits:[]})},'2026-11-17T02:00:00Z');
 try {
  const d=r.doc;
  d.querySelector('[data-agenda-view=list]').click();d.querySelector('.life-edit-button').click();
  d.querySelector('[name=date]').value='2026-11-17';d.querySelector('[name=repeat]').value='daily';
  d.querySelector('[name=repeat]').dispatchEvent(new r.w.Event('change'));
  d.querySelector('.life-editor form').dispatchEvent(new r.w.Event('submit',{cancelable:true}));
  const saved=JSON.parse(r.w.localStorage.getItem(key)).tasks[0];
  const validate=new Function(fs.readFileSync('workers/sync-worker.mjs','utf8').split('export default')[0]+';return validPlannerRecord;')();
  assert.equal(saved.repeat,'daily');
  assert.equal(saved.completedDates.undated,undefined);
  assert(validate({id:'task:convert',data:{type:'task',position:0,value:saved}}),'converted list tasks remain D1-valid');
  console.log('PASS: undated subtasks convert to recurring tasks without invalid D1 history keys');
 } finally {r.w.close()}
}
