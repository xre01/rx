'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<main><section id="home" class="panelview active"></section></main><nav class="rex-sidebar-nav"><button data-side-view="home"><span>PTE</span></button></nav>', { url: 'https://test.invalid/', runScripts: 'outside-only' });
const w = dom.window, d = w.document;
w.Date = class extends Date { constructor(...args) { super(...(args.length ? args : ['2026-11-27T01:00:00Z'])); } static now() { return Date.parse('2026-11-27T01:00:00Z'); } };
w.scrollTo = () => {}; w.confirm = () => true;
w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
w.HTMLDialogElement.prototype.close = function () { this.dispatchEvent(new w.Event('close')); };
w.RexDashboardStore = { summary: () => ({ seconds: 0 }), focusTotal: () => 0 };
const key = 'rex-home-planner-v1';
const seed = { tasks: [
  { id: 'all', title: 'Plan the day', date: '2026-11-27' },
  { id: 'timed', title: 'Practise WFD', date: '2026-11-27', time: '17:30', subtasks: [{ id: 'one', title: 'Open practice' }, { id: 'two', title: 'Complete one question' }] },
  { id: 'weekend', title: 'Read', date: '2026-11-29' },
  { id: 'list', title: 'Undated task', date: '' },
], habits: [] };
w.localStorage.setItem(key, JSON.stringify(seed));
try {
  w.eval(fs.readFileSync('home-page.js', 'utf8'));
  const strip = d.querySelector('.agenda-week');
  const dates = () => [...strip.querySelectorAll('button')].map(button => button.dataset.date);
  assert.deepEqual(dates(), ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29']);
  assert.equal(strip.querySelector('[aria-pressed=true]').dataset.date, '2026-11-27');
  assert.equal(strip.querySelector('[aria-current=date]').dataset.date, '2026-11-27');
  assert.equal(strip.querySelectorAll('[tabindex="0"]').length, 1);
  assert.equal(strip.querySelector('.agenda-week-marker'), null, 'week dates do not show task dots');
  assert.equal(strip.querySelector('[data-date="2026-11-27"]').getAttribute('aria-description'), '2 tasks', 'task counts remain available to assistive technology');
  assert.equal(d.querySelector('.agenda-day-count').textContent, '2 tasks');
  assert.deepEqual([...d.querySelectorAll('.agenda-day-time')].map(time => time.textContent), ['All day', '17:30']);
  assert.equal(d.querySelector('[data-task-id=timed] time').dateTime, '2026-11-27T17:30');
  assert(d.querySelector('[data-task-id=timed] .task-subtasks'));
  const original = w.localStorage.getItem(key);
  strip.querySelector('[data-date="2026-11-29"]').click();
  assert.equal(d.querySelector('.agenda-date-input').value, '2026-11-29');
  assert.equal(d.querySelectorAll('.life-task').length, 1);
  assert.equal(d.querySelector('.life-task strong').textContent, 'Read');
  strip.querySelector('[data-date="2026-11-29"]').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  assert.equal(dates()[0], '2026-11-30');
  assert.equal(d.activeElement.dataset.date, '2026-11-30');
  const picker = d.querySelector('.agenda-date-input'); picker.value = '2028-02-29'; picker.dispatchEvent(new w.Event('change'));
  assert.deepEqual(dates().slice(0, 3), ['2028-02-28', '2028-02-29', '2028-03-01']);
  assert.equal(w.localStorage.getItem(key), original, 'date navigation does not write task data');
  d.querySelector('[data-agenda-view=month]').click();
  assert(strip.hidden); assert(d.querySelector('.agenda-day-heading').hidden);
  assert(!d.querySelector('.agenda-month').hidden);
  d.querySelector('[data-agenda-view=list]').click();
  assert(strip.hidden); assert.equal(d.querySelector('.life-task strong').textContent, 'Undated task');
  assert.equal(d.querySelector('.agenda-task-menu'), null, 'List retains its existing controls');
  d.querySelector('[data-agenda-view=day]').click(); d.querySelector('.agenda-today').click();
  const menu = d.querySelector('[data-task-id=all] .agenda-task-menu');
  menu.open = true; d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(menu.open, false); assert.equal(d.activeElement, menu.querySelector('summary'));
  menu.open = true; d.body.dispatchEvent(new w.Event('pointerdown', { bubbles: true })); assert.equal(menu.open, false);
  d.querySelector('[data-task-id=all] .agenda-day-title').click();
  assert(d.querySelector('.life-editor')); assert.equal(d.querySelector('.life-editor [name=title]').value, 'Plan the day');
  d.querySelector('.life-editor').close();
  const check = d.querySelector('[data-task-id=all] > input'); check.checked = true; check.dispatchEvent(new w.Event('change'));
  assert.equal(JSON.parse(w.localStorage.getItem(key)).tasks.find(task => task.id === 'all').done, true);
  d.querySelector('[data-task-id=all] [aria-label="Delete Plan the day"]').click();
  assert(!JSON.parse(w.localStorage.getItem(key)).tasks.some(task => task.id === 'all'));
  const saved = JSON.parse(w.localStorage.getItem(key));
  saved.tasks.push({ id: 'daily', title: 'Daily practice', date: '2026-11-27', repeat: 'daily', completedDates: {}, subtasks: [{ id: 'step', title: 'One question' }] });
  w.localStorage.setItem(key, JSON.stringify(saved));
  w.dispatchEvent(new w.StorageEvent('storage', { key }));
  const complete = () => d.querySelector('[data-task-id=daily] > input');
  complete().checked = true; complete().dispatchEvent(new w.Event('change'));
  strip.querySelector('[data-date="2026-11-28"]').click();
  assert.equal(complete().checked, false, 'another occurrence retains independent completion');
  const child = d.querySelector('[data-task-id=daily] .task-subtask input');
  child.checked = true; child.dispatchEvent(new w.Event('change'));
  assert.equal(complete().checked, true, 'finishing the subtask completes that occurrence');
  strip.querySelector('[data-date="2026-11-27"]').click();
  assert.equal(complete().checked, true);
  complete().checked = false; complete().dispatchEvent(new w.Event('change'));
  assert.equal(JSON.parse(w.localStorage.getItem(key)).tasks.find(task => task.id === 'daily').completedDates['2026-11-28'], true);
  const beforeFilter = w.localStorage.getItem(key);
  d.querySelector('[data-filter=done]').click();
  assert.equal(d.querySelectorAll('.life-task').length, 0);
  assert.equal(d.querySelector('.agenda-day-count').textContent, '0 tasks');
  assert.equal(w.localStorage.getItem(key), beforeFilter);
  d.querySelector('[data-filter=all]').click();
  const menus = [...d.querySelectorAll('.agenda-task-menu')];
  menus[0].open = true; menus[1].querySelector('summary').click();
  assert.equal(menus[0].open, false, 'opening a menu by keyboard-generated click closes the previous menu');
  const setItem = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = () => { throw Error('quota'); };
  try {
    complete().checked = true; complete().dispatchEvent(new w.Event('change'));
    assert.equal(complete().checked, false, 'failed save restores the checkbox');
    assert.equal(w.localStorage.getItem(key), beforeFilter, 'failed save preserves existing data');
  } finally { w.Storage.prototype.setItem = setItem; }
  w.confirm = () => false;
  d.querySelector('[data-task-id=daily] [aria-label="Delete Daily practice"]').click();
  assert(JSON.parse(w.localStorage.getItem(key)).tasks.some(task => task.id === 'daily'), 'cancelled deletion retains the recurring series');
  console.log('PASS: week dates, leap/month rollover, keyboard focus, right-side time, subtasks, task actions and unchanged Month/List');
} finally { w.close(); }
