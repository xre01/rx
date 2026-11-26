const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const fixture = fs.readFileSync('tests/home-page.cjs', 'utf8');
const setup = new Function('require', fixture.slice(0, fixture.indexOf("const key='rex-home-planner")) + ';return setup;')(require);
const storageKey = 'rex-home-planner-v1';
const clock = '2026-11-26T02:00:00Z';
const single = { id: 'write', title: '写周报', date: '', done: false };
const recurring = { id: 'study', title: 'PTE exam practice', date: '2026-11-26', repeat: 'daily', completedDates: {} };
const { w, doc } = setup({ [storageKey]: JSON.stringify({ tasks: [single, recurring], habits: [] }) }, clock);
const click = selector => doc.querySelector(selector).click();
const read = id => JSON.parse(w.localStorage.getItem(storageKey)).tasks.find(task => task.id === id);
const submit = () => doc.querySelector('.life-editor form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
const stepInputs = () => [...doc.querySelectorAll('[name=subtaskTitle]')];

try {
  click('[data-agenda-view=list]');
  click('[aria-label="自动拆解 · 写周报"]');
  assert.equal(stepInputs()[0].value, '打开文档，写下三个要点');
  assert.equal(read('write').subtasks, undefined);
  [...doc.querySelectorAll('.life-editor button')].find(button => button.textContent === 'Cancel').click();
  assert.equal(read('write').subtasks, undefined);
  click('[aria-label="自动拆解 · 写周报"]');
  stepInputs()[0].value = '列出本周完成的三件事';
  submit();
  assert.equal(read('write').subtasks.length, 3);
  assert.equal(read('write').subtasks[0].title, '列出本周完成的三件事');
  assert.equal(doc.querySelector('[aria-label="自动拆解 · 写周报"]'), null);
  assert.match(doc.querySelector('.task-next-step').textContent, /列出本周完成的三件事/);
  let focusGoal;
  w.RexFocusTimer = { startStep: goal => { focusGoal = goal; } };
  click('.task-next-step button');
  assert.equal(focusGoal, '列出本周完成的三件事');
  click('[aria-label="Complete subtask 列出本周完成的三件事"]');
  assert.equal(read('write').done, false);
  assert.match(doc.querySelector('.task-next-step').textContent, /根据要点写出第一段或第一页/);
  doc.querySelectorAll('.task-subtask input:not(:checked)').forEach(input => {
    doc.querySelector('[aria-label="' + input.getAttribute('aria-label') + '"]').click();
  });
  assert.equal(read('write').done, true);
  assert.equal(doc.querySelector('.task-next-step'), null);

  click('[data-add=task]');
  click('.task-editor .task-breakdown-action');
  assert.equal(stepInputs().length, 0);
  doc.querySelector('[name=title]').value = 'Open the file, then review the draft；send it';
  click('.task-editor .task-breakdown-action');
  assert.deepEqual(stepInputs().map(input => input.value), ['Open the file', 'review the draft', 'send it']);
  submit();
  assert(JSON.parse(w.localStorage.getItem(storageKey)).tasks.some(task => task.subtasks?.[2]?.title === 'send it'));

  click('[data-agenda-view=day]');
  click('[aria-label="自动拆解 · PTE exam practice"]');
  assert.match(stepInputs()[0].value, /pick one question/);
  submit();
  const child = read('study').subtasks[0];
  click('[aria-label="Complete subtask ' + child.title + '"]');
  assert.equal(read('study').subtaskChecks['2026-11-26'][child.id], true);
  assert.equal(read('study').subtaskChecks['2026-11-27'], undefined);
} finally {
  w.close();
}

const html = fs.readFileSync('index.html', 'utf8');
const timer = new JSDOM(html, { url: 'https://rx.test', runScripts: 'outside-only' }).window;
try {
  timer.matchMedia = () => ({ matches: true });
  timer.eval(fs.readFileSync('focus-timer.js', 'utf8'));
  const readTimer = () => JSON.parse(timer.localStorage.getItem('rex-focus-active-v1'));
  const trigger = timer.document.createElement('button');
  const mode = name => timer.document.querySelector('[data-timer-mode=' + name + ']');
  mode('up').click();
  timer.RexFocusTimer.startStep('Open one page', trigger);
  const active = readTimer();
  assert.equal(active.goal, 'Open one page');
  assert.equal(active.activity, 'home');
  assert.equal(active.total, 300);
  assert.equal(active.mode, 'down');
  assert.equal(active.running, true);
  assert.equal(mode('down').getAttribute('aria-pressed'), 'true');
  timer.RexFocusTimer.startStep('Another step', trigger);
  assert.deepEqual(readTimer(), active);
  timer.document.querySelector('#focusStart').click();
  const paused = readTimer();
  assert.equal(paused.running, false);
  timer.RexFocusTimer.startStep('Still another step', trigger);
  assert.deepEqual(readTimer(), paused);
} finally {
  timer.close();
}
console.log('PASS: task breakdown drafts, planner completion, recurring steps and five-minute focus');
