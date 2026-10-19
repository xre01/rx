const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const base = 'https://xre01.github.io/rx/';
const assets = vm.runInNewContext(fs.readFileSync('sw.js', 'utf8') + '; CORE', {
  URL, importScripts() {}, self: {location: {href: base + 'sw.js'}, addEventListener() {}}
});
const check = value => {
  const url = new URL(value, base);
  if (url.origin !== new URL(base).origin) return;
  const path = decodeURIComponent(url.pathname.slice(new URL(base).pathname.length));
  assert.ok(fs.existsSync(path), `Missing resource: ${value}`);
};
assets.forEach(check);
const html = fs.readFileSync('index.html', 'utf8');
for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)) check(match[1]);
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
for (const icon of manifest.icons) {
  check(icon.src);
  assert.ok(assets.includes(new URL(icon.src, base).href), `Icon missing from offline cache: ${icon.src}`);
  const bytes = fs.readFileSync(icon.src.split('?')[0]);
  const [width, height] = icon.sizes.split('x').map(Number);
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
}
const ico = fs.readFileSync('rex-wing.ico');
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 7);
for (const file of fs.readdirSync('.').filter(name => /\.(js|html|webmanifest)$/.test(name))) {
  assert.ok(!/monogram1|rex-icon-|favicon-rex|apple-touch-icon-rex/.test(fs.readFileSync(file, 'utf8')), `Legacy icon reference: ${file}`);
}
console.log('PASS: local page and precache resources exist, manifest icon dimensions match, ICO contains seven sizes, no legacy icon references');
