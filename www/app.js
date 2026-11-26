'use strict';
/* Gazna boot, auto-lock, privacy cover, service worker */

// Windows desktop app (Electron): html.pc switches on the Windows / Fluent styles in style.css
const IS_PC = !!(window.GaznaNative && GaznaNative.kind === 'pc');
if (IS_PC) {
  document.documentElement.classList.add('pc');
  // Windows shows a tooltip on hover for icon-only buttons: reuse their aria-label
  document.addEventListener('mouseover', e => {
    const b = e.target.closest && e.target.closest('[aria-label]');
    if (b && !b.title && !b.closest('.toolbar .trow, .actions.nav, .jmpbtn, .drawer, .colhead')) { const l = b.getAttribute('aria-label'); if (l && l !== '…') b.title = l; }
  }, { passive: true });
}

async function afterUnlock() {
  await Native.setShotBlock(H.shot);
  UI.firstPaint = true; // first list build waits one frame: the app frame appears (and fades in) before the heavy work
  let ls = UI.lockState; UI.lockState = null; // set by doLock (in memory only): restore the screen the person was on
  if (!ls && window.loadSavedUi) ls = window.loadSavedUi(); // app was closed completely: the last screen is kept on the device
  if (ls) { UI.q = ls.q; UI.filter = ls.filter; UI.colf = ls.colf || {}; if (ls.rep) Object.assign(UI.rep, ls.rep); }
  mountShell();
  history.replaceState({ root: 1 }, '');
  if (ls) {
    if (ls.route && ls.route !== 'books') { try { goRoute(ls.route); } catch (e) { } }
    else if (ls.scroll) setTimeout(() => { const tw = $('#tw'); if (tw && ls.scroll) { tw.scrollTop = ls.scroll; if (typeof renderWindow === 'function') renderWindow(); } }, 350);
  }
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

document.addEventListener('scroll', () => { UI.lastScroll = Date.now(); }, { capture: true, passive: true });
async function boot() {
  try { if ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 4) <= 2) document.documentElement.classList.add('lite'); document.documentElement.dataset.anim = String(animLevel()); } catch (_) { /* ignore */ }
  const t0 = Date.now(), sp = document.getElementById('splash');
  sp.innerHTML = logoSvg(110) + '<b>Gazna</b>';
  const hideSplash = () => setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 450); }, Math.max(0, (IS_PC ? 0 : 900) - (Date.now() - t0))); // desktop apps open straight away, no held splash
  const ready = await loadHeader();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', () => { if (DB.unlocked) flushSave(); });
  Native.onBackButton(handleHardwareBack);
  Native.initBars();
  { let lw = window.innerWidth; // the on-screen keyboard only changes the height: no need to rebuild the whole list (it took ~180 ms on a phone every time the search field was tapped)
    window.addEventListener('resize', () => { if (!(DB.unlocked && UI.route === 'books')) return; const w = window.innerWidth; if (w !== lw) { lw = w; refreshList(); } else { renderWindow(false); updateRail(); } }); }
  if (!ready) showSetup();
  else if (!Auth.hasPin()) { await Auth.openPlain(); afterUnlock(); }
  else showLock();
  if ('serviceWorker' in navigator) {
    if (Native.cap) {
      // inside the Android/Windows app the files ship with the app: drop any old cache so updates are always visible
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => { });
      if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => { });
    } else if (location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  }
  document.getElementById('cover').innerHTML = logoSvg(96);
  hideSplash();
}
boot();
