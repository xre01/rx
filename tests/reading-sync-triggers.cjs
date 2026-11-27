const fs = require('fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<main></main><nav class="rex-sidebar-nav"></nav><input id="gateway" value="https://gateway.test">', {
  url: 'https://test.invalid', runScripts: 'outside-only', pretendToBeVisual: true,
});
const w = dom.window;
let calls = 0, online = true, fail = false, release;
w.CSS = { supports: () => true };
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = function () {};
Object.defineProperty(w.navigator, 'onLine', { get: () => online });
w.sessionStorage.setItem('arcane-session-password', 'test-key');
const intervals = [];
w.setInterval = callback => { intervals.push(callback.name); return intervals.length; };
w.fetch = async url => {
  calls++;
  if (release) await new Promise(resolve => { release = resolve; });
  if (fail) throw Error('Network failed');
  return { ok: true, json: async () => url.endsWith('/status') ? { editorSchemaVersion: 1 } : { records: [], complete: true } };
};
const tick = () => new Promise(resolve => setTimeout(resolve, 15));
(async () => {
  try {
    let source = fs.readFileSync('reading.js', 'utf8');
    assert.doesNotMatch(source, /reading-pull|refreshReadingFromUser|touchstart|touchmove/);
    assert.doesNotMatch(fs.readFileSync('app.css', 'utf8'), /reading-pull/);
    assert.doesNotMatch(fs.readFileSync('notion-archive.js', 'utf8'), /setInterval\(autoRefresh/);
    source = source.slice(0, source.lastIndexOf('})();')) + 'window.queueSyncForTest=queueReadingSync;})();';
    w.eval(source);
    await tick();
    const button = w.document.querySelector('.reading-sync-strip button');
    assert.deepEqual(intervals, ['refreshReadingDay']);
    assert.equal(button.textContent, 'Retry');
    assert.equal(button.hidden, true, 'successful sync has no refresh control');
    let before = calls;
    w.queueSyncForTest();
    await new Promise(resolve => setTimeout(resolve, 550));
    assert.equal(calls, before + 2, 'local changes still trigger prompt sync');
    before = calls;
    online = false;
    w.dispatchEvent(new w.Event('online')); await tick(); assert.equal(calls, before);
    online = true; fail = true;
    w.dispatchEvent(new w.Event('online')); await tick();
    assert.equal(button.hidden, false); assert.equal(button.disabled, false);
    fail = false; before = calls; button.click(); await tick();
    assert.equal(calls, before + 2, 'retry bypasses automatic-check throttle');
    assert.equal(button.hidden, true);
    before = calls; const originalNow = w.Date.now;
    w.Date.now = () => originalNow() + 31000;
    w.dispatchEvent(new w.Event('focus')); await tick(); assert.equal(calls, before + 2);
    before = calls; w.Date.now = () => originalNow() + 62000;
    w.document.dispatchEvent(new w.Event('visibilitychange')); await tick(); assert.equal(calls, before + 2);
    fail = true; w.dispatchEvent(new w.Event('online')); await tick(); fail = false;
    release = () => {}; before = calls; button.click(); await tick(); assert.equal(calls, before + 1);
    button.click(); await tick(); assert.equal(calls, before + 1, 'retry does not duplicate an active sync');
    const finish = release; release = null; finish(); await tick();
    assert.equal(calls, before + 2); assert.equal(button.hidden, true);
    console.log('PASS: no refresh UI, pull handlers or Notion polling; prompt change sync, focus/visibility/online checks, offline handling, retry for pending/failed sync and concurrency guards');
  } finally { w.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
