'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');

const versions = new Map();
function version(file) {
  if (!versions.has(file)) {
    const bytes = fs.readFileSync(file);
    versions.set(file, crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12));
  }
  return versions.get(file);
}

function updateUrls(text) {
  return text.replace(/([A-Za-z0-9_./-]+\.(?:js|css|png|ico|webmanifest))\?v=[A-Za-z0-9_-]+/g,
    (url, file) => file === 'sw.js' ? url : file + '?v=' + version(file));
}

// Update nested resources before hashing the manifest and parent scripts.
for (const file of ['manifest.webmanifest','focus-push-sw.js','asset-loader.js']) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = updateUrls(original);
  if (original !== updated) {
    if (process.argv.includes('--check')) throw Error(file + ' has stale resource versions.');
    fs.writeFileSync(file, updated);
  }
}

const html = updateUrls(fs.readFileSync('index.html', 'utf8'));
const worker = updateUrls(fs.readFileSync('sw.js', 'utf8'));
const entries = ['CORE','OPTIONAL'].flatMap(name => JSON.parse(worker.match(new RegExp('^const '+name+'=(\\[.*?\\])\\.map','m'))[1]));
const release = crypto.createHash('sha256');
// Worker-only changes also start a fresh release without hashing the hash itself.
release.update(worker.replace(/^const CACHE='[^']+';/m, "const CACHE='<release>';"));
for (const entry of entries) {
  const file = entry.split('?')[0];
  const content = file === 'index.html' ? html : fs.readFileSync(file);
  release.update(entry).update('\0').update(crypto.createHash('sha256').update(content).digest());
}
const name = 'rex-focus-offline-' + release.digest('hex').slice(0, 16);
const updatedWorker = worker.replace(/^const CACHE='[^']+';/m, "const CACHE='" + name + "';");
for (const [file, content] of [['index.html', html], ['sw.js', updatedWorker]]) {
  if (fs.readFileSync(file, 'utf8') === content) continue;
  if (process.argv.includes('--check')) throw Error(file + ' has stale asset versions. Run pnpm build.');
  fs.writeFileSync(file, content);
}
