const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const key = 'rex-ui-theme-v1';
const themes = ['default', 'newyear', 'halloween', 'christmas', 'winter', 'pokemon'];

function setup(stored) {
  const dom = new JSDOM('<div id="profilePopover"><div class="profile-settings"></div></div>', {
    url: 'https://test.example', runScripts: 'outside-only',
  });
  const w = dom.window;
  if (stored) w.localStorage.setItem(key, stored);
  w.eval(fs.readFileSync('theme-ui.js', 'utf8'));
  // The page loads theme-ui.js before parsing the theme-color meta element.
  w.document.head.innerHTML = '<meta name="theme-color" content="#E8F0E8">';
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return w;
}

const w = setup('unknown');
try {
  assert.equal(w.localStorage.getItem(key), null);
  const buttons = [...w.document.querySelectorAll('[data-theme-choice]')];
  assert.deepEqual(buttons.map(b => b.dataset.themeChoice), themes);
  for (const button of buttons) {
    const id = button.dataset.themeChoice;
    button.click();
    assert.equal(w.localStorage.getItem(key), id);
    assert.equal(w.document.documentElement.dataset.uiTheme || 'default', id);
    assert.deepEqual(buttons.filter(b => b.getAttribute('aria-pressed') === 'true'), [button]);
    const reload = setup(id);
    assert.equal(reload.document.documentElement.dataset.uiTheme || 'default', id);
    const color = reload.document.querySelector('meta').content;
    assert.equal(color, w.document.querySelector('meta').content);
    assert.equal(color === '#E8F0E8', id === 'default');
    reload.close();
  }
  w.dispatchEvent(new w.StorageEvent('storage', {key, newValue:'winter'}));
  assert.equal(w.document.documentElement.dataset.uiTheme, 'winter');
  w.Storage.prototype.setItem = () => { throw Error('quota'); };
  buttons[0].click();
  assert.equal(w.document.documentElement.dataset.uiTheme, 'winter');
  assert.match(w.document.querySelector('[role=status]').textContent, /Could not/);
  w.dispatchEvent(new w.StorageEvent('storage', {key:null}));
  assert.equal(w.document.documentElement.hasAttribute('data-ui-theme'), false);
  console.log('PASS: six themes, accessible selection, persistence, browser color, storage failure and cross-tab changes');
} finally {
  w.close();
}
