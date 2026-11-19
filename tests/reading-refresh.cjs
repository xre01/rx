const fs = require('fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<main></main><nav class="rex-sidebar-nav"></nav><input id="gateway" value="https://gateway.test">', {
  url: 'https://test.invalid', runScripts: 'outside-only', pretendToBeVisual: true,
});
const w = dom.window;
let calls = 0, online = true, scroll = 0, fail = false, release;
w.CSS = { supports: () => true };
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = function () {};
Object.defineProperty(w.navigator, 'onLine', { get: () => online });
Object.defineProperty(w, 'scrollY', { get: () => scroll });
w.sessionStorage.setItem('arcane-session-password', 'test-key');
const intervals = [];
w.setInterval = callback => { intervals.push(callback.name); return intervals.length; };
w.fetch = async url => {
  calls++;
  if (release) await new Promise(resolve => { release = resolve; });
  if (fail) throw Error('Network failed');
  return { ok: true, json: async () => url.endsWith('/status') ? { editorSchemaVersion: 1 } : { records: [], complete: true } };
};
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
function touch(target, type, x, y, count = 1) {
  const event = new w.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', { value: Array.from({ length: count }, (_, identifier) => ({ clientX: x, clientY: y, identifier })) });
  target.dispatchEvent(event);
  return event;
}
(async () => {
  try {
    w.eval(fs.readFileSync('reading.js', 'utf8'));
    await tick();
    const panel = w.document.querySelector('#reading');
    panel.classList.add('active');
    const heading = panel.querySelector('h1');
    const status = panel.querySelector('.reading-pull-status');
    const button = panel.querySelector('.reading-sync-strip button');
    assert.deepEqual(intervals, ['refreshReadingDay']);
    assert.doesNotMatch(fs.readFileSync('notion-archive.js', 'utf8'), /setInterval\(autoRefresh/);
    assert.equal(button.hidden, false);
    function pull(distance = 100, target = heading, x = 10) {
      touch(target, 'touchstart', 10, 10);
      const move = touch(target, 'touchmove', x, 10 + distance);
      touch(target, 'touchend', x, 10 + distance, 0);
      return move;
    }
    let before = calls;
    assert.equal(pull(30).defaultPrevented, true);
    await tick(); assert.equal(calls, before);
    pull(100, heading, 250); await tick(); assert.equal(calls, before);
    scroll = 100; pull(); await tick(); assert.equal(calls, before); scroll = 0;
    pull(100, panel.querySelector('input')); await tick(); assert.equal(calls, before);
    const dialog = w.document.createElement('dialog'); dialog.open = true; w.document.body.append(dialog);
    pull(); await tick(); assert.equal(calls, before); dialog.remove();
    touch(heading, 'touchstart', 10, 10); touch(heading, 'touchmove', 10, 110);
    touch(heading, 'touchcancel', 10, 110, 0); touch(heading, 'touchend', 10, 110, 0);
    await tick(); assert.equal(calls, before);
    pull(); await tick(); assert.equal(calls, before + 2); assert.equal(status.textContent, 'Synced to Notion');
    before = calls; button.click(); await tick(); assert.equal(calls, before + 2, 'manual refresh bypasses the focus throttle');
    before = calls; online = false; pull(); await tick(); assert.equal(calls, before); assert.match(status.textContent, /Offline/);
    online = true; fail = true; pull(); await tick(); assert.match(status.textContent, /Sync failed/);
    assert.equal(button.disabled, false); assert.equal(button.textContent, 'Retry');
    fail = false; before = calls; button.click(); await tick(); assert.equal(calls, before + 2);
    release = () => {}; before = calls; pull(); await tick(); assert.equal(calls, before + 1);
    pull(); button.click(); await tick(); assert.equal(calls, before + 1, 'in-flight refresh is not duplicated');
    const finish = release; release = null; finish(); await tick(); assert.equal(calls, before + 2);
    assert.equal(w.document.documentElement.classList.contains('reading-pull-active'), false);
    before = calls; w.dispatchEvent(new w.Event('online')); await tick(); assert.equal(calls, before + 2);
    before = calls; const originalNow = w.Date.now; w.Date.now = () => originalNow() + 31000;
    w.dispatchEvent(new w.Event('focus')); await tick(); assert.equal(calls, before + 2);
    before = calls; w.Date.now = () => originalNow() + 62000;
    w.document.dispatchEvent(new w.Event('visibilitychange')); await tick(); assert.equal(calls, before + 2);
    before = calls; const text = w.document.createTextNode('Selected text'); heading.append(text);
    const selection = w.getSelection(), range = w.document.createRange();range.selectNodeContents(text);selection.addRange(range);
    pull();await tick();assert.equal(calls, before);selection.removeAllRanges();

    console.log('PASS: no Notion polling, pull threshold/direction/top/edit guards, cancellation, manual throttle bypass, offline/failure/retry, concurrent refresh and online recovery');
  } finally { w.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
