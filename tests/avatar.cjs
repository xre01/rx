const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

(async () => {
  const dom = new JSDOM('<button id="profileToggle"></button><input id="avatarFile" type="file"><button id="avatarUpload"></button><button id="avatarRemove"></button><span id="avatarStatus"></span>', {
    url: 'https://example.test/rx/', runScripts: 'outside-only',
  });
  const w = dom.window, doc = w.document;
  const pending = [], released = [];
  w.Image = class {
    decode() { return new Promise(resolve => pending.push(resolve)); }
  };
  w.URL.createObjectURL = file => file.name;
  w.URL.revokeObjectURL = url => released.push(url);
  w.eval(fs.readFileSync('avatar.js', 'utf8'));
  const input = doc.getElementById('avatarFile');
  function select(name) {
    Object.defineProperty(input, 'files', { configurable: true, value: [new w.File(['x'], name, {type: 'image/png'})] });
    input.dispatchEvent(new w.Event('change'));
  }
  select('first');
  select('second');
  pending[0]();
  await new Promise(setImmediate);
  assert.equal(doc.getElementById('avatarStatus').textContent, 'Processing avatar…');
  doc.getElementById('avatarRemove').click();
  pending[1]();
  await new Promise(setImmediate);
  assert.equal(w.localStorage.getItem('rex-avatar-v1'), null);
  assert.equal(doc.querySelector('#profileToggle img').getAttribute('src'), 'avatar-3d.webp');
  assert.equal(doc.getElementById('avatarStatus').textContent, 'Default avatar restored');
  assert.deepEqual(released, ['first', 'second']);
  dom.window.close();
  console.log('PASS: stale avatar selections cannot overwrite the current selection or restore a removed avatar');
})().catch(error => { console.error(error); process.exitCode = 1; });
