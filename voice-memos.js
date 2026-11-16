(() => {
  'use strict';
  const heading = document.querySelector('#home .compact-heading');
  if (!heading) return;
  const icons = {
    mic: '<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5m-3 0h6"/>',
    record: '<circle cx="12" cy="12" r="7" fill="currentColor"/>',
    pause: '<path d="M8 5v14m8-14v14" stroke-width="4"/>',
    resume: '<path d="m7 4 13 8-13 8z" fill="currentColor"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    save: '<path d="m4 12 5 5L20 6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
    Rename: '<path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14z"/>',
    Share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-4m-6 8 6 4"/>',
    Delete: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  };
  function setIcon(control, icon, label) {
    control.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + icons[icon] + '</svg>';
    control.setAttribute('aria-label', label);
    control.title = label;
  }
  const entry = document.createElement('button');
  entry.type = 'button';
  entry.className = 'memo-entry';
  setIcon(entry, 'mic', 'Voice memos');
  entry.setAttribute('aria-haspopup', 'dialog');
  heading.append(entry);

  const dialog = document.createElement('dialog');
  dialog.id = 'voiceMemos';
  dialog.setAttribute('aria-labelledby', 'memoHeading');
  dialog.innerHTML = `<header><h2 id="memoHeading">Voice memos</h2><button type="button" data-close aria-label="Close voice memos">×</button></header>
    <div class="memo-console"><output aria-label="Recording duration" aria-live="off">00:00</output>
    <div class="memo-controls"><button type="button" data-record>Record</button><button type="button" data-pause hidden>Pause</button><button type="button" data-stop hidden>Stop &amp; save</button></div></div>
    <p role="status"></p><section aria-label="Saved voice memos" class="memo-list"></section>`;
  document.body.append(dialog);
  const find = selector => dialog.querySelector(selector);
  const start = find('[data-record]'), pause = find('[data-pause]'), stop = find('[data-stop]');
  const clock = find('output'), status = find('[role=status]'), list = find('.memo-list');
  setIcon(find('[data-close]'), 'close', 'Close voice memos');
  setIcon(start, 'record', 'Record');
  setIcon(pause, 'pause', 'Pause');
  setIcon(stop, 'stop', 'Stop and save');
  const urls = new Set(), unsaved = new Map();
  let session = null, dbPromise, listRevision = 0;

  function database() {
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const open = indexedDB.open('rex-voice-memos', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('memos', {keyPath:'id'});
      open.onsuccess = () => {
        const db = open.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      open.onerror = () => reject(open.error);
    }).catch(error => { dbPromise = null; throw error; });
    return dbPromise;
  }
  async function transact(mode, operation) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('memos', mode);
      const request = operation(tx.objectStore('memos'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error || Error('Storage unavailable'));
    });
  }
  function duration(ms) {
    const secs = Math.floor(ms / 1000);
    return String(Math.floor(secs / 60)).padStart(2,'0') + ':' + String(secs % 60).padStart(2,'0');
  }
  function clearList() {
    list.querySelectorAll('audio').forEach(audio => { audio.pause(); audio.removeAttribute('src'); audio.load(); });
    list.replaceChildren();
    urls.forEach(url => URL.revokeObjectURL(url));
    urls.clear();
  }
  function memoRow(memo) {
    const row = document.createElement('article'), label = document.createElement('strong');
    const date = new Date(memo.created);
    const details = document.createElement('small');
    details.textContent = date.toLocaleString() + ' · ' + duration(memo.ms);
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'none';
    const url = URL.createObjectURL(memo.blob);
    urls.add(url);
    audio.src = url;
    const ext = ({'audio/mp4':'m4a','audio/ogg':'ogg','audio/webm':'webm','audio/wav':'wav'})[memo.blob.type.split(';')[0]] || 'audio';
    const originalName = 'Practice-' + date.toISOString().replace(/[:.]/g,'-');
    const actions = document.createElement('div');
    actions.className = 'memo-controls';
    const download = document.createElement('a');
    download.href = url; setIcon(download, 'download', 'Download');
    function showName() {
      label.textContent = memo.name || details.textContent;
      details.hidden = !memo.name;
      download.download = (memo.name || originalName) + '.' + ext;
    }
    showName();
    actions.append(download);
    function button(text, click) {
      const b = document.createElement('button');
      b.type = 'button'; setIcon(b, text, text); b.onclick = click; actions.append(b);
      return b;
    }
    const editor = document.createElement('form');
    editor.className = 'memo-name-editor';
    editor.hidden = true;
    editor.innerHTML = '<input required maxlength="100" aria-label="Recording name"><button type="submit">Save</button><button type="button">Cancel</button>';
    const input = editor.querySelector('input');
    setIcon(editor.querySelector('[type=submit]'), 'save', 'Save name');
    setIcon(editor.querySelector('[type=button]'), 'close', 'Cancel rename');
    const rename = button('Rename', () => {
      input.value = memo.name || originalName;
      input.setCustomValidity('');
      editor.hidden = false;
      input.focus(); input.select();
    });
    editor.querySelector('[type=button]').onclick = () => { editor.hidden = true; rename.focus(); };
    input.oninput = () => input.setCustomValidity('');
    editor.onsubmit = async event => {
      event.preventDefault();
      const suffix = '.' + ext;
      let name = input.value.trim();
      if (name.toLowerCase().endsWith(suffix)) name = name.slice(0, -suffix.length).trim();
      if (!name || /[<>:"/\\|?*\x00-\x1f]|\.$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(name)) {
        input.setCustomValidity('Enter a valid file name without path or reserved characters.');
        input.reportValidity(); return;
      }
      try {
        if (!unsaved.has(memo.id)) {
          const cursor = await transact('readwrite', store => {
            const request = store.openCursor(memo.id);
            request.onsuccess = () => {
              const current = request.result;
              if (current) current.update({...current.value, name});
            };
            return request;
          });
          if (!cursor) { await refresh(); status.textContent = 'This memo has been deleted.'; return; }
        }
        memo.name = name;
        showName(); editor.hidden = true; rename.focus();
        status.textContent = unsaved.has(memo.id) ? 'Renamed for this session. Download before leaving.' : 'Recording renamed.';
      } catch { status.textContent = 'Could not save the new name. Please retry.'; }
    };
    button('Share', async () => {
      try {
        const files = [new File([memo.blob], download.download, {type:memo.blob.type.split(';')[0]})];
        if (!navigator.canShare?.({files})) {
          status.textContent = 'Download the recording to share it from your files.';
          return;
        }
        await navigator.share({files});
      } catch (e) { if (e.name !== 'AbortError') status.textContent = 'Sharing unavailable. Use Download instead.'; }
    });
    button('Delete', async () => {
      if (!confirm('Delete this voice memo?')) return;
      try {
        if (!unsaved.has(memo.id)) await transact('readwrite', store => store.delete(memo.id));
        unsaved.delete(memo.id);
        await refresh();
      } catch { status.textContent = 'Could not delete the memo.'; }
    });
    row.append(label, details, audio, actions, editor);
    return row;
  }
  async function refresh() {
    const revision = ++listRevision;
    let records = [];
    try { records = await transact('readonly', store => store.getAll()); }
    catch { if (revision === listRevision) status.textContent = 'Device storage unavailable. Download recordings before leaving.'; }
    if (revision !== listRevision || !dialog.open) return;
    clearList();
    for (const memo of [...records,...unsaved.values()].sort((a,b) => b.created-a.created)) list.append(memoRow(memo));
    if (!list.children.length) list.textContent = 'No recordings yet.';
  }
  function controls(state) {
    start.hidden = state !== 'idle';
    pause.hidden = stop.hidden = !['recording','paused'].includes(state);
    setIcon(pause, state === 'paused' ? 'resume' : 'pause', state === 'paused' ? 'Resume' : 'Pause');
    setIcon(entry, state === 'paused' ? 'pause' : 'mic', ({recording:'Voice memos · Recording',paused:'Voice memos · Paused',saving:'Saving memo…'})[state] || 'Voice memos');
    entry.dataset.active = String(state === 'recording');
  }
  function elapsed(s) { return s.ms + (s.since === null ? 0 : performance.now() - s.since); }
  function freeze(s) { s.ms = elapsed(s); s.since = null; clock.textContent = duration(s.ms); }
  function release(s) { clearInterval(s.timer); s.stream?.getTracks().forEach(track => track.stop()); }
  start.onclick = async () => {
    if (session) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      status.textContent = 'Microphone recording requires a supported browser on HTTPS or localhost.';
      return;
    }
    const s = {created:Date.now(),ms:0,since:null,chunks:[]};
    session = s;
    controls('starting'); clock.textContent = '00:00'; status.textContent = 'Requesting microphone…';
    try {
      s.stream = await navigator.mediaDevices.getUserMedia({audio:true});
      if (session !== s) { release(s); return; }
      const recorder = s.recorder = new MediaRecorder(s.stream);
      recorder.ondataavailable = e => { if (e.data.size) s.chunks.push(e.data); };
      recorder.onerror = () => {
        s.interrupted = true;
        if (recorder.state !== 'inactive') recorder.stop();
      };
      recorder.onstop = async () => {
        freeze(s); release(s); controls('saving');
        const blob = new Blob(s.chunks, {type:s.chunks[0]?.type || recorder.mimeType});
        if (blob.size) {
          const memo = {id:crypto.randomUUID(),created:s.created,ms:s.ms,blob};
          try {
            await transact('readwrite', store => store.put(memo));
            status.textContent = s.interrupted ? 'Recording interrupted. Available audio saved.' : 'Saved on this device.';
          } catch {
            unsaved.set(memo.id,memo);
            status.textContent = 'Could not save on this device. Download before leaving.';
          }
        } else status.textContent = 'No audio was captured. Try recording again.';
        session = null; controls('idle'); await refresh();
      };
      recorder.start(1000);
      s.since = performance.now();
      s.timer = setInterval(() => { clock.textContent = duration(elapsed(s)); },250);
      controls('recording'); status.textContent = 'Recording';
    } catch (e) {
      release(s);
      if (session !== s) return;
      session = null; controls('idle');
      status.textContent = e.name === 'NotAllowedError' ? 'Microphone permission denied. Allow microphone access to record.' : 'Could not start the microphone. Check your input device.';
    }
  };
  pause.onclick = () => {
    const s = session;
    if (s?.recorder?.state === 'recording') {
      s.recorder.pause(); freeze(s); controls('paused'); status.textContent = 'Paused';
    } else if (s?.recorder?.state === 'paused') {
      s.recorder.resume(); s.since = performance.now(); controls('recording'); status.textContent = 'Recording';
    }
  };
  stop.onclick = () => {
    const s = session;
    if (s?.recorder && s.recorder.state !== 'inactive') {
      freeze(s); controls('saving'); s.recorder.stop();
    }
  };
  entry.onclick = () => { dialog.showModal(); refresh(); };
  find('[data-close]').onclick = () => dialog.close();
  dialog.onclose = () => {
    ++listRevision; clearList();
    if (session && !session.recorder) { session = null; controls('idle'); status.textContent = ''; }
  };
  window.addEventListener('beforeunload', event => {
    if (session || unsaved.size) { event.preventDefault(); event.returnValue = ''; }
  });
})();
