'use strict';
/* Miras boot, auto-lock, privacy cover, service worker */

async function afterUnlock() {
  UI.noAutoBio = true;
  await Native.setShotBlock(H.shot);
  mountShell();
  history.replaceState({ root: 1 }, '');
  if (DB.draft) { const d = DB.draft; DB.draft = null; scheduleSave(); openCard(d.isNew ? null : d.uuid, d.vals, true); }
}

let _hiddenAt = 0;
function onVisibility() {
  const cover = $('#cover');
  if (document.hidden) {
    if (DB.unlocked) { cover.classList.add('on'); cover.innerHTML = ''; }
    _hiddenAt = Date.now();
    if (DB.unlocked) {
      if (H.autolock === 0) doLock();
      else flushSave();
    }
  } else {
    cover.classList.remove('on');
    if (DB.unlocked && H.autolock > 0 && _hiddenAt && Date.now() - _hiddenAt >= H.autolock * 1000) doLock();
    _hiddenAt = 0;
  }
}

async function boot() {
  const ready = await loadHeader();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', () => { if (DB.unlocked) flushSave(); });
  Native.onBackButton(handleHardwareBack);
  window.addEventListener('resize', () => { if (DB.unlocked && UI.route === 'books') refreshList(); });
  if (!ready) showSetup(); else showLock();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  document.getElementById('cover').innerHTML = logoSvg(96);
}
boot();
