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
  const select=w.document.getElementById('profileTheme');
  const list=w.document.getElementById('profileThemeList');
  const choices=Array.from(list.children);
  assert.deepEqual(choices.map(button=>button.dataset.themeChoice),themes);
  select.click();
  assert.equal(w.document.activeElement,choices[0]);
  choices[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));
  assert.equal(w.document.activeElement,choices.at(-1));
  choices.at(-1).dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.ok(list.hidden);assert.equal(w.document.activeElement,select);
  function choose(id){select.click();choices.find(b=>b.dataset.themeChoice===id).click()}
  for(const id of themes){
    choose(id);
    assert.equal(w.localStorage.getItem(key),id);
    assert.equal(w.document.documentElement.dataset.uiTheme||'default',id);
    assert.ok(list.hidden);assert.equal(list.querySelector('[aria-pressed=true]').dataset.themeChoice,id);
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
  choose('default');
  assert.equal(list.querySelector('[aria-pressed=true]').dataset.themeChoice,'winter');
  assert.equal(w.document.documentElement.dataset.uiTheme, 'winter');
  assert.match(w.document.querySelector('[role=status]').textContent, /Could not/);
  w.dispatchEvent(new w.StorageEvent('storage', {key:null}));
  assert.equal(w.document.documentElement.hasAttribute('data-ui-theme'), false);
  console.log('PASS: six themes, accessible selection, persistence, browser color, storage failure and cross-tab changes');
} finally {
  w.close();
}
