(() => {
  const toggle = document.getElementById('profileToggle');
  const input = document.getElementById('avatarFile');
  const status = document.getElementById('avatarStatus');
  const key = 'rex-avatar-v1';
  const editAvatar = document.getElementById('profileAvatarEdit');
  const settings = document.getElementById('avatarSettings');
  if (editAvatar && settings) {
    editAvatar.addEventListener('click', () => {
      settings.hidden = !settings.hidden;
      editAvatar.setAttribute('aria-expanded', String(!settings.hidden));
      if (!settings.hidden) document.getElementById('avatarUpload').focus();
    });
  }
  let selection = 0;

  function render() {
    let value;
    try {
      value = localStorage.getItem(key);
    } catch {
      // The default avatar also works when browser storage is unavailable.
    }
    const custom = /^data:image\/(jpeg|png|webp);base64,/.test(value);
    const img = document.createElement('img');
    img.decoding = 'async';
    img.width = img.height = 44;
    img.src = custom ? value : 'avatar-3d.webp';
    img.alt = custom ? 'My Avatar' : 'Rex Character avatar';
    toggle.replaceChildren(img);
    editAvatar?.replaceChildren(img.cloneNode());
  }

  document.getElementById('avatarUpload').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const selected = ++selection;
    input.value = '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      status.textContent = 'Select a JPG, PNG or WebP image';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      status.textContent = 'Select an image no larger than 10 MB';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      status.textContent = 'Processing avatar…';
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      if (selected !== selection) return;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      canvas.getContext('2d').drawImage(image, (512 - width) / 2, (512 - height) / 2, width, height);
      localStorage.setItem(key, canvas.toDataURL('image/png'));
      render();
      status.textContent = 'Avatar saved on this device';
      dispatchEvent(new Event('rex-local-changed'));
    } catch {
      if (selected === selection) status.textContent = 'Could not read or save the image. Try another image.';
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  });
  document.getElementById('avatarRemove').addEventListener('click', () => {
    ++selection;
    try {
      localStorage.removeItem(key);
    } catch {
      status.textContent = 'Could not remove the saved avatar.';
      return;
    }
    render();
    status.textContent = 'Default avatar restored';
    dispatchEvent(new Event('rex-local-changed'));
  });
  addEventListener('rex-cloud-changed', render);
  addEventListener('storage', e => {
    if (e.key === key || e.key === null) render();
  });
  render();
})();
