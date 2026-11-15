'use strict';
/* Miras UI part 1: helpers, layers, dialogs, lock/setup, shell, books list, card */

const IC = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  sync: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>',
  menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a7a66" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  ok: (s = 22, c = '#1A8F3C') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6"/></svg>`,
  no: (s = 22, c = '#D32F2F') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  plus: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  warn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:1px"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>',
  trash: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  up: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  eye: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></svg>',
  eyeoff: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  lock: (s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M19 19v2H6"/></svg>',
  cols: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>',
  imp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>',
  gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  trashn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  file: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A8F3C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13l4 5M13 13l-4 5"/></svg>',
  finger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11v4a6 6 0 0 1-1 3M8 11a4 4 0 0 1 8 0v3M5 12a7 7 0 0 1 14 0v2M9 15c0 2-.5 3.500-1.500 5"/></svg>',
};
let _lid = 0;
function logoSvg(sz) {
  const id = 'lg' + (_lid++);
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 100 100" style="flex:none"><defs><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6E4524"/><stop offset="1" stop-color="#341D0E"/></linearGradient><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0D58A"/><stop offset="1" stop-color="#B5832C"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#${id}b)"/><rect x="6" y="6" width="88" height="88" rx="17" fill="none" stroke="url(#${id}g)" stroke-width="1.2" opacity=".7"/><g fill="url(#${id}g)" transform="translate(50 50) scale(0.92) translate(-52.5 -50)"><path d="M20 24h4.5v52H20z"/><path d="M19 24h11l25 52H44z"/><path d="M52 76h5L80 24h-4.5z"/><path d="M76 24h9v52h-9z"/><path d="M13 22h20v3H13zM14 75h17v3H14zM40 75h20v3H40zM70 22h22v3H70zM70 75h22v3H70z"/></g></svg>`;
}

const UI = {
  route: 'books', card: null, sel: new Set(), selMode: false, q: '', filter: 'all', shown: 150,
  list: [], listKey: '', layers: [], ignorePop: 0, imp: null, sync: null, routeLayer: null, wide: false,
};
const appEl = () => $('#app');
const isWide = () => window.matchMedia('(min-width:900px)').matches;

// ---------- layers / back ----------
function pushLayer(l) { UI.layers.push(l); history.pushState({ l: UI.layers.length }, ''); return l; }
UI.waiters = [];
function dropLayer(l) {
  const i = UI.layers.lastIndexOf(l); if (i < 0) return Promise.resolve();
  UI.layers.splice(i, 1); UI.ignorePop++;
  return new Promise(res => { const w = () => { clearTimeout(tm); res(); }; const tm = setTimeout(() => { const k = UI.waiters.indexOf(w); if (k >= 0) UI.waiters.splice(k, 1); res(); }, 400); UI.waiters.push(w); history.back(); });
}
window.addEventListener('popstate', async () => {
  if (UI.ignorePop > 0) { UI.ignorePop--; const w = UI.waiters.shift(); if (w) w(); return; }
  const top = UI.layers[UI.layers.length - 1]; if (!top) return;
  const ok = top.onBack ? await top.onBack() : true;
  if (ok !== false) { const i = UI.layers.lastIndexOf(top); if (i >= 0) UI.layers.splice(i, 1); top.onClose && top.onClose(); }
  else history.pushState({ l: UI.layers.length }, '');
});
function handleHardwareBack() {
  if (UI.layers.length) history.back(); else Native.minimize();
}

// ---------- dialogs / toast ----------
function toast(msg, ms = 2400) {
  $$('.toast').forEach(e => e.remove());
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d);
  setTimeout(() => d.remove(), ms);
}
// buttons: [{label, v, cls}] -> resolves with v (or null when dismissed)
function ask({ title, text, html, buttons, onMount, dismiss = true }) {
  return new Promise(resolve => {
    const mb = document.createElement('div'); mb.className = 'mb';
    const btns = (buttons || [{ label: t('ok'), v: true, cls: 'b1' }]).map((b, i) => `<button class="btn ${b.cls || 'b2'}" data-i="${i}">${esc(b.label)}</button>`).join('');
    mb.innerHTML = `<div class="modal" role="dialog">${title ? `<h3>${esc(title)}</h3>` : ''}${text ? `<p>${esc(text)}</p>` : ''}${html || ''}<div class="btns">${btns}</div></div>`;
    document.body.appendChild(mb);
    let done = false;
    const layer = { onBack: () => { finish(null, true); return true; } };
    const finish = (v, fromBack) => {
      if (done) return; done = true; mb.remove();
      if (!fromBack) dropLayer(layer).then(() => resolve(v)); else { const i = UI.layers.indexOf(layer); if (i >= 0) UI.layers.splice(i, 1); resolve(v); }
    };
    pushLayer(layer);
    mb.addEventListener('click', async e => {
      if (e.target === mb && dismiss) return finish(null);
      const b = e.target.closest('button[data-i]'); if (!b) return;
      const def = (buttons || [{ v: true }])[+b.dataset.i];
      if (def.check) { const ok = await def.check(mb); if (!ok) return; }
      if (def.keep) { def.onClick && def.onClick(mb); return; }
      finish(def.v === undefined ? true : (typeof def.v === 'function' ? def.v(mb) : def.v));
    });
    if (onMount) onMount(mb, finish);
    const f = mb.querySelector('input,select,textarea'); if (f && !/ro/.test(f.className)) setTimeout(() => f.focus(), 50);
  });
}
const confirmDlg = (text, okLabel, bad) => ask({ title: t('conf_title'), text, buttons: [{ label: t('btn_cancel'), v: false, cls: 'b2' }, { label: okLabel || t('ok'), v: true, cls: bad ? 'bad' : 'b1' }] });
// PIN prompts use the same on-screen pad (see padHtml/mountPad below; hoisted functions)
const askPassword = text => pinFlow(t('conf_title'), { cur: true, text });

// busy overlay: lets the browser paint before heavy synchronous work (big Excel files)
const tick = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
async function withBusy(text, fn) {
  const d = document.createElement('div'); d.className = 'busy';
  d.innerHTML = `<div class="busybox"><div class="spin"></div><div>${esc(text)}</div></div>`;
  document.body.appendChild(d); await tick();
  try { return await fn(); } finally { d.remove(); }
}
const askNewPin = (title, needCur) => pinFlow(title, { cur: !!needCur, create: true });
// stages: current PIN (verify) -> new PIN (4-6 digits) -> confirmation. Resolves with the PIN or null.
function pinFlow(title, { cur, create, text }) {
  let stage = cur ? 'cur' : 'new', first = null, pad, mbEl, fin;
  const sub = () => ({ cur: t('pw_cur'), new: t('pw_new'), cfm: t('setup_pw2') }[stage]);
  const render = () => {
    mbEl.querySelector('.padm').innerHTML = `<div class="psub">${esc(sub())}</div>${padHtml()}<div class="msg" id="pmsg"></div><button class="btn b1" id="pnext" style="display:none;width:100%;margin-top:6px">${t('ok')}</button>`;
    const msg = mbEl.querySelector('#pmsg'), nx = mbEl.querySelector('#pnext');
    const bad = m => { msg.textContent = m; pad.shake(); setTimeout(() => pad.clear(), 380); };
    const go = async v => {
      if (stage === 'cur') {
        if (!(await Auth.verifyPw(v))) return bad(t('pw_wrong'));
        if (!create) return fin(v);
        first = v; stage = 'new'; first = null; render();
      } else if (stage === 'new') {
        if (!PIN_RE.test(v)) return bad(t('setup_err_short'));
        first = v; stage = 'cfm'; render();
      } else { if (v !== first) return bad(t('setup_err_match')); fin(v); }
    };
    pad = mountPad(mbEl, {
      fixed: stage === 'cur' ? H.pinLen : stage === 'cfm' ? first.length : 0, max: 6,
      onChange: v => { msg.textContent = ''; nx.style.display = stage === 'new' && v.length >= 4 ? '' : 'none'; },
      onDone: go,
    });
    nx.onclick = () => go(pad.get());
  };
  return ask({
    title, text, html: '<div class="padm"></div>', buttons: [{ label: t('btn_cancel'), v: null }],
    onMount: (mb, finish) => { mbEl = mb; fin = finish; render(); },
  });
}

// ---------- lock / setup ----------
function langRow(onChange) {
  return `<div class="langrow">${['tk', 'ru', 'en'].map(l => `<button data-l="${l}" class="${H.lang === l ? 'on' : ''}">${l.toUpperCase()}</button>`).join('')}</div>`;
}
function bindLangRow(root, rerender) {
  $$('.langrow button', root).forEach(b => b.onclick = async () => { H.lang = b.dataset.l; applyPrefs(); await saveHeader(); rerender(); });
}
function fmtWait(s) { return s >= 60 ? t('t_min', { n: Math.floor(s / 60) }) + ' ' + t('t_sec', { n: s % 60 }) : t('t_sec', { n: s }); }


// ---------- on-screen PIN pad (no system keyboard) ----------
function padHtml(extraLeft) {
  return `<div class="pdots" id="pdots"></div><div class="pad" id="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join('')}${extraLeft || '<span></span>'}<button type="button" data-k="0">0</button><button type="button" data-k="del" class="del" aria-label="Delete"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M13 9.5l4 5M17 9.5l-4 5"/></svg></button></div>`;
}
// fixed: number of dots (PIN length) or 0 = variable (4..max). Returns controller.
function mountPad(root, { fixed = 0, max = 6, onChange, onDone }) {
  let v = '', off = false;
  const dots = $('#pdots', root);
  const draw = () => {
    const n = fixed || Math.max(4, v.length);
    dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="pdot${i < v.length ? ' on' : ''}"></i>`).join('');
  };
  const press = k => {
    if (off) return;
    if (k === 'del') v = v.slice(0, -1);
    else if (/^\d$/.test(k) && v.length < (fixed || max)) v += k; else return;
    draw(); onChange && onChange(v);
    if (fixed && v.length === fixed) onDone && onDone(v);
  };
  $$('#pad button[data-k]', root).forEach(b => b.onclick = () => press(b.dataset.k));
  const kd = e => {
    if (!document.body.contains(dots)) { document.removeEventListener('keydown', kd); return; }
    if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Enter' && !fixed && v.length >= 4) onDone && onDone(v);
  };
  document.addEventListener('keydown', kd);
  draw();
  return {
    get: () => v, clear() { v = ''; draw(); onChange && onChange(v); },
    shake() { dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake'); },
    disable(b) { off = !!b; $('#pad', root).classList.toggle('off', !!b); },
  };
}

let _lockTimer = null;
const digitsOnly = el => { el.value = el.value.replace(/\D/g, '').slice(0, 6); };
async function showLock() {
  UI.layers = []; clearInterval(_lockTimer);
  const el = appEl();
  const bioOk = H.bio && Native.isApp && await Native.hasBioCreds();
  const bioBtn = bioOk ? `<button type="button" id="bio" class="bio" aria-label="${esc(t('lock_bio'))}">${IC.finger.replace('currentColor', '#E3D3B4')}</button>` : '';
  el.innerHTML = `<div class="lockscr"><div class="lockbox pinbox">${langRow()}
    <div style="display:flex;justify-content:center">${logoSvg(72)}</div>
    <h1>Miras</h1><div class="sub">${t('tagline')}</div>
    ${padHtml(bioBtn)}
    <div class="msg" id="msg"></div>
    <div class="foot">${IC.lock(14, '#CDBB9D')} ${t('lock_encrypted')}</div></div></div>`;
  bindLangRow(el, showLock);
  const msg = $('#msg');
  let busy = false, pad;
  const refresh = () => {
    const li = Auth.lockInfo();
    if (li.wait > 0) { msg.textContent = t('lock_wait', { t: fmtWait(li.wait) }); pad.disable(true); return; }
    pad.disable(busy);
    if (msg.dataset.wrong) msg.textContent = t('lock_wrong') + ' · ' + t('lock_attempts', { n: li.left });
    else msg.textContent = li.fails > 0 ? t('lock_attempts', { n: li.left }) : '';
  };
  const submit = async v => {
    if (busy) return;
    busy = true; pad.disable(true);
    const r = await Auth.unlock(v);
    if (r.ok) { clearInterval(_lockTimer); return afterUnlock(); }
    busy = false; msg.dataset.wrong = '1'; pad.shake();
    setTimeout(() => { pad.clear(); refresh(); }, 380);
  };
  pad = mountPad(el, { fixed: H.pinLen, onDone: submit });
  refresh(); _lockTimer = setInterval(refresh, 1000);
  if ($('#bio')) $('#bio').onclick = async () => {
    const p = await Native.bioGet(); if (!p) return;
    const r = await Auth.unlock(p); if (r.ok) { clearInterval(_lockTimer); afterUnlock(); } else { await Native.bioClear(); H.bio = false; await saveHeader(); showLock(); }
  };
  if (bioOk && !UI.noAutoBio) { UI.noAutoBio = true; setTimeout(() => $('#bio') && $('#bio').click(), 300); }
}
function showSetup() {
  const el = appEl();
  let first = null; // step 1 PIN, step 2 confirmation
  const draw = () => {
    el.innerHTML = `<div class="lockscr"><div class="lockbox pinbox">${langRow()}
      <div style="display:flex;justify-content:center">${logoSvg(64)}</div>
      <h1>${t('setup_title')}</h1><div class="sub">${first ? t('setup_pw2') : t('setup_sub')}</div>
      ${padHtml()}
      <div class="msg" id="msg"></div>
      <button class="bgold" id="go" disabled>${first ? t('ok') : t('setup_btn')}</button>
      <button class="lnk" id="skip">${first ? t('btn_cancel') : t('setup_skip')}</button></div></div>`;
    bindLangRow(el, () => { first = null; draw(); });
    const msg = $('#msg'), go = $('#go');
    const pad = mountPad(el, {
      fixed: first ? first.length : 0, max: 6,
      onChange: v => { go.disabled = !first && v.length < 4 || (first && v.length !== first.length); msg.textContent = ''; },
      onDone: v => next(v),
    });
    const next = async v => {
      if (!first) { if (!PIN_RE.test(v)) { msg.textContent = t('setup_err_short'); return; } first = v; draw(); return; }
      if (v !== first) { msg.textContent = t('setup_err_match'); pad.shake(); setTimeout(() => pad.clear(), 380); return; }
      pad.disable(true); go.disabled = true; await Auth.setup(v); afterUnlock();
    };
    go.onclick = () => next(pad.get());
    $('#skip').onclick = async () => {
      if (first) { first = null; draw(); return; }
      $('#skip').disabled = true; await Auth.setup(null); afterUnlock();
    };
  };
  draw();
}

// ---------- shell ----------
const NAV = [['books', 'nav_books', 'book'], ['trash', 'nav_trash', 'trashn'], ['columns', 'nav_columns', 'cols'], ['ie', 'nav_import', 'imp'], ['sync', 'nav_sync', 'sync'], ['settings', 'nav_settings', 'gear']];
function mountShell() {
  UI.route = 'books'; UI.routeLayer = null; UI.card = null;
  appEl().innerHTML = `<div class="shell" id="shell">
    <aside class="side">
      <div class="brand">${logoSvg(44)}<div><b>Miras</b><span>${t('tagline')}</span></div></div>
      ${NAV.map(([k, lab, ic]) => `<button class="nav" data-r="${k}">${IC[ic]}<span>${t(lab)}</span></button>`).join('')}
      <div class="sp"></div>
      <div class="lg">${['tk', 'ru', 'en'].map(l => `<button data-l="${l}" class="${H.lang === l ? 'on' : ''}">${l.toUpperCase()}</button>`).join('')}</div>
      ${Auth.hasPin() ? `<button class="nav" id="navlock">${IC.lock(20)}<span>${t('nav_lock')}</span></button>` : ''}
    </aside>
    <section class="main" id="main"></section>
    <div id="cardhost"></div></div>`;
  $$('.side .nav[data-r]').forEach(b => b.onclick = () => goRoute(b.dataset.r));
  $$('.side .lg button').forEach(b => b.onclick = () => setLang(b.dataset.l));
  if ($('#navlock')) $('#navlock').onclick = () => doLock();
  renderRoute();
}
async function setLang(l) {
  H.lang = l; applyPrefs(); await saveHeader();
  const route = UI.route, cardOpen = !!UI.card;
  const draft = cardOpen ? { uuid: UI.card.uuid, isNew: UI.card.isNew, vals: readCard() } : null;
  const layers = UI.layers.filter(l => !(UI.card && l === UI.card.layer));
  mountShell(); UI.layers = layers; if (route !== 'books') { UI.route = route; renderRoute(); }
  if (draft) openCard(draft.isNew ? null : draft.uuid, draft.vals, true);
}
function animRoute() { const m = $('#main'); if (!m) return; m.classList.remove('routein'); void m.offsetWidth; m.classList.add('routein'); }
function goRoute(r) {
  if (r === UI.route) return;
  if (r === 'books') { if (UI.routeLayer) { const l = UI.routeLayer; UI.routeLayer = null; dropLayer(l); } UI.route = 'books'; renderRoute(); animRoute(); return; }
  if (UI.card) closeCard(false).then(ok => { if (ok) goRoute(r); });
  else {
    if (!UI.routeLayer) {
      UI.routeLayer = pushLayer({ onBack: () => { UI.route = 'books'; UI.routeLayer = null; renderRoute(); return true; } });
    }
    UI.route = r; renderRoute(); animRoute();
  }
}
function renderRoute() {
  const main = $('#main'); if (!main) return;
  $$('.side .nav[data-r]').forEach(b => b.classList.toggle('on', b.dataset.r === UI.route));
  const views = { books: viewBooks, trash: viewTrash, columns: viewColumns, settings: viewSettings, ie: viewIE, sync: viewSync, import: viewImport };
  UI.selMode = UI.selMode && UI.route === 'books';
  (views[UI.route] || viewBooks)(main);
}
function mobBar(title, withBack) {
  if (withBack) return `<div class="appbar mob back"><button class="ib" id="mbBack">${IC.back}</button><h2>${esc(title)}</h2></div>`;
  return `<div class="appbar mob"><h2>${esc(title)}</h2><button class="lchip" id="mbLang">${H.lang.toUpperCase()}</button><button class="ib" id="mbSync">${IC.sync}</button><button class="ib" id="mbMenu">${IC.menu}</button></div>`;
}
function bindMobBar() {
  const b = $('#mbBack'); if (b) b.onclick = () => history.back();
  const l = $('#mbLang'); if (l) l.onclick = () => setLang(H.lang === 'ru' ? 'tk' : H.lang === 'tk' ? 'en' : 'ru');
  const s = $('#mbSync'); if (s) s.onclick = () => goRoute('sync');
  const m = $('#mbMenu'); if (m) m.onclick = openMenu;
}
async function openMenu() {
  const items = [['trash', 'nav_trash'], ['columns', 'nav_columns'], ['ie', 'nav_import'], ['sync', 'nav_sync'], ['settings', 'nav_settings']];
  const html = items.map(([k, lab]) => `<button class="setrow" data-go="${k}"><span class="tt">${t(lab)}</span><span class="chev">${IC.chev}</span></button>`).join('') +
    `<button class="setrow" data-go="__sel"><span class="tt">${t('menu_select')}</span></button>${Auth.hasPin() ? `<button class="setrow" data-go="__lock"><span class="tt">${t('nav_lock')}</span></button>` : ''}`;
  const p = ask({ html: `<div class="group" style="margin:0">${html}</div>`, buttons: [{ label: t('close'), v: null, cls: 'b2' }] });
  setTimeout(() => $$('.mb [data-go]').forEach(b => b.onclick = () => {
    const mb = b.closest('.mb'); const k = b.dataset.go; mb.querySelector('.btn').click();
    setTimeout(() => { if (k === '__sel') enterSelMode(); else if (k === '__lock') doLock(); else goRoute(k); }, 30);
  }), 20);
  await p;
}

// ---------- books list ----------
function tableCols() {
  const vis = visibleCols();
  if (isWide()) return vis;
  return vis.filter(c => c.kind === 'id' || c.key === 'inv' || onPhone(c));
}
function colWidth(c) {
  if (!isWide()) {
    switch (c.key) { case 'id': return '34px'; case 'inv': return '86px'; case 'title': return 'minmax(190px,1fr)'; case 'scanned': return '48px'; case 'pages': return '56px'; case 'date': return '90px'; case 'type': return '96px'; case 'author': return 'minmax(140px,1fr)'; case 'lang': return 'minmax(90px,1fr)'; case 'loc': return 'minmax(110px,1fr)'; }
    return c.kind === 'check' ? '56px' : c.kind === 'number' ? '72px' : 'minmax(110px,1fr)';
  }
  switch (c.key) {
    case 'id': return '46px'; case 'inv': return '104px'; case 'title': return 'minmax(120px,2fr)';
    case 'author': return 'minmax(90px,1.3fr)'; case 'scanned': return '56px'; case 'pages': return '66px';
    case 'date': return '80px'; case 'type': return '100px'; case 'lang': return 'minmax(70px,1fr)'; case 'loc': return 'minmax(80px,1.2fr)';
  }
  return c.kind === 'check' ? '56px' : c.kind === 'number' ? '80px' : 'minmax(80px,1fr)';
}
function gridTpl(cols) { return (isWide() || UI.selMode ? '24px ' : '') + cols.map(colWidth).join(' '); }
// sticky (frozen) left columns: checkbox, ID, inventory number
function stickyLefts(cols) {
  const pad = isWide() ? 14 : 12, gap = isWide() ? 10 : 8, wId = isWide() ? 46 : 34, wInv = isWide() ? 104 : 86;
  let x = pad; const o = {};
  if (isWide() || UI.selMode) { o.cb = x; o.first = 'cb'; x += 24 + gap; }
  if (cols[0] && cols[0].kind === 'id') { o.id = x; if (!o.first) o.first = 'id'; x += wId + gap; if (cols[1] && cols[1].key === 'inv') { o.inv = x; o.last = 'inv'; } else o.last = 'id'; }
  return o;
}
const stk = (o, k) => o[k] !== undefined ? ` stk${o.first === k ? ' stkf' : ''}${o.last === k ? ' stkl' : ''}" style="left:${o[k]}px` : '';
function computeList() {
  const key = `${DB.rev}|${UI.q}|${UI.filter}`;
  if (UI.listKey === key) return UI.list;
  const toks = norm(UI.q).split(' ').filter(Boolean);
  let l = DB.records.filter(isLive);
  if (UI.filter === 'scanned') l = l.filter(r => r.scanned); else if (UI.filter === 'not') l = l.filter(r => !r.scanned);
  if (toks.length) l = l.filter(r => { const s = searchKey(r); return toks.every(x => s.includes(x)); });
  l.sort((a, b) => a.id - b.id);
  UI.list = l; UI.listKey = key; return l;
}
function viewBooks(main) {
  main.innerHTML = `${mobBar('Miras')}
  <div class="toolbar"><div class="trow"><div class="search">${IC.search}<input id="q" type="search" placeholder="${esc(t('search_ph'))}" value="${esc(UI.q)}" autocomplete="off"></div>
    <button class="sbtn only-wide" id="bImp">${IC.imp}${t('btn_import')}</button><button class="sbtn only-wide" id="bExp">${IC.imp.replace('M12 3v12M7 10l5 5 5-5', 'M12 15V3M7 8l5-5 5 5')}${t('btn_export')}</button><button class="sbtn pri only-wide" id="bNew">${IC.plus.replace('width="26" height="26"', 'width="18" height="18"')}${t('btn_new')}</button></div>
    <div class="chips" id="chips"></div></div>
  <div id="banner"></div><div class="counter" id="counter"></div><div class="prog"><i id="prog"></i></div>
  <div class="selbar hidden" id="selbar"></div>
  <div class="tablewrap" id="tw"><div class="th" id="th"></div><div id="rows"></div></div>
  <button class="fab only-narrow" id="fab" aria-label="${esc(t('btn_new'))}">${IC.plus}</button>`;
  bindMobBar();
  const q = $('#q');
  let qt; q.oninput = () => { clearTimeout(qt); qt = setTimeout(() => { UI.q = q.value; UI.shown = 150; refreshList(); }, 120); };
  $('#bNew').onclick = () => openCard(null); $('#fab').onclick = () => openCard(null);
  $('#bImp').onclick = () => startImport(); $('#bExp').onclick = () => goRoute('ie');
  renderChips();
  $('#tw').addEventListener('scroll', onListScroll, { passive: true });
  const rows = $('#rows');
  rows.addEventListener('click', onRowClick);
  let lp = null, lpFired = false;
  rows.addEventListener('touchstart', e => { const tr = e.target.closest('.tr'); if (!tr) return; lpFired = false; lp = setTimeout(() => { lpFired = true; if (navigator.vibrate) navigator.vibrate(20); enterSelMode(tr.dataset.u); }, 480); }, { passive: true });
  const cancelLp = () => clearTimeout(lp);
  rows.addEventListener('touchend', e => { cancelLp(); if (lpFired) { e.preventDefault(); } });
  rows.addEventListener('touchmove', cancelLp, { passive: true });
  rows.addEventListener('contextmenu', e => { if (e.target.closest('.tr')) e.preventDefault(); });
  refreshList();
}
function renderChips() {
  const c = $('#chips'); if (!c) return;
  c.innerHTML = [['all', t('f_all')], ['scanned', IC.ok(14) + t('f_scanned')], ['not', IC.no(14) + t('f_notscanned')]].map(([k, l]) => `<button class="chip ${UI.filter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('');
  $$('.chip', c).forEach(b => b.onclick = () => { UI.filter = b.dataset.f; UI.shown = 150; renderChips(); refreshList(); });
}
function rowHtml(r, cols, tpl) {
  const sel = UI.sel.has(r.uuid);
  const SL = stickyLefts(cols);
  const cb = (isWide() || UI.selMode) ? `<span class="cb ${sel ? 'on' : ''}${stk(SL, 'cb')}" data-cb="1">${sel ? IC.ok(14, '#fff') : ''}</span>` : '';
  const cells = cols.map(c => {
    if (c.kind === 'id') return `<span class="idc${stk(SL, 'id')}">${r.id}</span>`;
    if (c.kind === 'check') return `<span class="mid">${r[c.key] ? IC.ok(20) : IC.no(20)}</span>`;
    if (c.kind === 'number') return `<span class="num">${esc(cellText(c, r))}</span>`;
    return `<span class="${c.key === 'inv' ? 'inv' + stk(SL, 'inv') : 'tx'}">${esc(cellText(c, r))}</span>`;
  }).join('');
  const cur = UI.card && UI.card.uuid === r.uuid ? ' cur' : '';
  return `<div class="tr${sel ? ' sel' : ''}${cur}" data-u="${r.uuid}" style="grid-template-columns:${tpl}">${cb}${cells}</div>`;
}
function renderHead(cols, tpl) {
  const th = $('#th'); if (!th) return;
  const showCb = isWide() || UI.selMode;
  th.style.gridTemplateColumns = tpl;
  const SL = stickyLefts(cols);
  th.innerHTML = (showCb ? `<span class="${stk(SL, 'cb').slice(1)}"></span>` : '') + cols.map(c => `<span class="${c.kind === 'number' ? 'num' : c.kind === 'check' ? 'mid' : ''}${c.kind === 'id' ? stk(SL, 'id') : c.key === 'inv' ? stk(SL, 'inv') : ''}">${esc(colName(c))}</span>`).join('');
}
function refreshList() {
  if (UI.route !== 'books') return;
  const list = computeList(); const cols = tableCols(); const tpl = gridTpl(cols);
  renderHead(cols, tpl);
  const rows = $('#rows'); if (!rows) return;
  const total = counts();
  if (!list.length) {
    rows.innerHTML = `<div class="empty"><b>${total.total ? t('list_none') : t('list_empty')}</b>${total.total ? '' : t('list_empty_sub')}</div>`;
  } else {
    const slice = list.slice(0, UI.shown);
    rows.innerHTML = slice.map(r => rowHtml(r, cols, tpl)).join('') + moreHtml(list);
  }
  renderCounter(list, total); renderBanner(total); renderSelbar();
}
function moreHtml(list) { return list.length > UI.shown ? `<div class="more" id="more">${t('loading_more', { a: fmtInt(UI.shown), b: fmtInt(list.length) })}</div>` : ''; }
function onListScroll(e) {
  const tw = e.target; if (UI.shown >= UI.list.length) return;
  if (tw.scrollTop + tw.clientHeight >= tw.scrollHeight - 500) {
    const cols = tableCols(), tpl = gridTpl(cols); const from = UI.shown; UI.shown += 150;
    const rows = $('#rows'); $('#more') && $('#more').remove();
    rows.insertAdjacentHTML('beforeend', UI.list.slice(from, UI.shown).map(r => rowHtml(r, cols, tpl)).join('') + moreHtml(UI.list));
  }
}
function renderCounter(list, total) {
  const c = $('#counter'); if (!c) return;
  const found = (UI.q || UI.filter !== 'all') ? ` · ${t('list_found', { n: `<b>${fmtInt(list.length)}</b>` })}` : '';
  c.innerHTML = `<span>${t('list_total')}: <b>${fmtInt(total.total)}</b></span><span>· ${t('list_scanned')}: <b>${fmtInt(total.scanned)}</b></span>${found}<span class="pct">${fmtPct(total.scanned, total.total)}</span>`;
  $('#prog').style.width = (total.total ? total.scanned / total.total * 100 : 0) + '%';
}
function renderBanner(total) {
  const b = $('#banner'); if (!b) return;
  if (!total.total) { b.innerHTML = ''; return; }
  const d = H.lastBackup ? Math.floor((Date.now() - H.lastBackup) / 86400000) : null;
  if (d !== null && d <= 7) { b.innerHTML = ''; return; }
  b.innerHTML = `<div class="banner">${IC.warn}<span>${d === null ? t('backup_never') : t('backup_remind', { d })}</span><button class="sbtn" id="bkBtn">${t('set_backup_btn')}</button></div>`;
  $('#bkBtn').onclick = async () => { const n = await createBackup(); toast(t('backup_done', { f: n })); renderBanner(counts()); };
}
// selection
function enterSelMode(uuid) {
  if (!UI.selMode) { UI.selMode = true; if (!UI.selLayer) UI.selLayer = pushLayer({ onBack: () => { UI.selLayer = null; clearSel(true); return true; } }); }
  if (uuid) UI.sel.add(uuid);
  refreshList();
}
function clearSel(fromBack) {
  UI.sel.clear(); UI.selMode = false;
  if (UI.selLayer && !fromBack) { const l = UI.selLayer; UI.selLayer = null; dropLayer(l); } else UI.selLayer = null;
  refreshList();
}
function toggleSel(u) {
  if (UI.sel.has(u)) UI.sel.delete(u); else UI.sel.add(u);
  if (!isWide() && UI.sel.size === 0 && UI.selMode) { clearSel(); return; }
  refreshList();
}
function onRowClick(e) {
  const tr = e.target.closest('.tr'); if (!tr) return;
  const u = tr.dataset.u;
  if (e.target.closest('[data-cb]') || UI.selMode) return toggleSel(u);
  openCard(u);
}
function renderSelbar() {
  const s = $('#selbar'); if (!s) return;
  if (!UI.sel.size && !UI.selMode) { s.classList.add('hidden'); return; }
  s.classList.remove('hidden');
  s.innerHTML = `<span>${t('sel_count', { n: UI.sel.size })}</span>
    <button class="sb" id="sbAll">${t('sel_all')}</button>
    <button class="sb" id="sbMark">${IC.ok(14, '#fff')}&nbsp;${t('sel_mark')}</button>
    <button class="sb" id="sbChg">${t('sel_change')}</button>
    <button class="sb del" id="sbDel">${t('btn_delete')}</button>
    <button class="sb" id="sbX" aria-label="${esc(t('close'))}">${IC.close}</button>`;
  $('#sbAll').onclick = () => { computeList().forEach(r => UI.sel.add(r.uuid)); UI.selMode = true; refreshList(); };
  $('#sbX').onclick = () => clearSel();
  $('#sbMark').onclick = () => { const rs = selRecords().filter(r => !r.scanned); rs.forEach(r => updateRecord(r, { scanned: true })); toast(t('mass_done', { n: rs.length })); clearSel(); };
  $('#sbDel').onclick = async () => {
    const rs = selRecords(); if (!rs.length) return;
    if (await confirmDlg(t('confirm_del', { n: rs.length }), t('btn_delete'), true)) { trashRecords(rs); toast(t('toast_trashed', { n: rs.length })); clearSel(); }
  };
  $('#sbChg').onclick = () => massChange();
}
const selRecords = () => [...UI.sel].map(u => byUuid().get(u)).filter(Boolean);
function fieldInputHtml(c, val, id, opt = {}) {
  const v = val ?? '';
  if (c.kind === 'check') {
    const on = !!val;
    return `<button type="button" class="scanrow ${on ? 'on' : 'off'}" id="${id}" data-check="${on ? 1 : 0}"><span class="bx">${on ? IC.ok(16) : ''}</span><span>${esc(opt.label || colName(c, true))}</span><span class="rt">${on ? IC.ok(22) : IC.no(22)}</span></button>`;
  }
  if (c.kind === 'type') return `<select class="inp" id="${id}"><option value="">${esc(t('opt_none'))}</option>${['manuscript', 'printed'].map(k => `<option value="${k}" ${v === k ? 'selected' : ''}>${esc(t('type_' + k))}</option>`).join('')}</select>`;
  if (c.kind === 'list') return `<select class="inp" id="${id}"><option value="">${esc(t('opt_none'))}</option>${(c.opts || []).concat(v && !(c.opts || []).includes(v) ? [v] : []).map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  if (c.kind === 'date') return `<input class="inp" id="${id}" type="date" value="${esc(v)}">`;
  if (c.kind === 'number') return `<input class="inp" id="${id}" inputmode="decimal" autocomplete="off" value="${esc(typeof v === 'number' ? String(v).replace('.', LANG === 'en' ? '.' : ',') : v)}">`;
  return `<input class="inp" id="${id}" autocomplete="off" value="${esc(v)}" ${opt.list ? `list="${opt.list}"` : ''}>`;
}
function bindCheckButtons(root) {
  $$('[data-check]', root).forEach(b => b.onclick = () => {
    const on = b.dataset.check !== '1'; b.dataset.check = on ? 1 : 0;
    b.className = 'scanrow ' + (on ? 'on' : 'off');
    $('.bx', b).innerHTML = on ? IC.ok(16) : ''; $('.rt', b).innerHTML = on ? IC.ok(22) : IC.no(22);
    b.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
function readInput(c, root) {
  const el = $('#f_' + c.key, root); if (!el) return undefined;
  if (c.kind === 'check') return el.dataset.check === '1';
  const v = el.value.trim();
  if (c.kind === 'number') { if (v === '') return ''; const n = parseNum(v); return n === null ? v : n; }
  return v;
}
async function massChange() {
  const cols = liveCols().filter(c => c.kind !== 'id');
  if (!UI.sel.size) return;
  const opts = cols.map(c => `<option value="${c.key}">${esc(colName(c))}</option>`).join('');
  let cur = cols[0];
  const draw = m => { $('#chgin', m).innerHTML = fieldInputHtml(cur, cur.kind === 'check' ? false : '', 'f_' + cur.key, { label: colName(cur) }); bindCheckButtons(m); };
  const res = await ask({
    title: t('chg_title'), html: `<div class="fld"><div class="lbl">${t('chg_col')}</div><select class="inp" id="chgcol">${opts}</select></div><div class="fld"><div class="lbl">${t('chg_val')}</div><div id="chgin"></div></div>`,
    onMount: m => { draw(m); $('#chgcol', m).onchange = e => { cur = colDef(e.target.value); draw(m); }; },
    buttons: [{ label: t('btn_cancel'), v: null }, { label: t('chg_apply'), cls: 'b1', v: m => ({ key: cur.key, val: readInput(cur, m) }) }],
  });
  if (!res) return;
  const rs = selRecords(); rs.forEach(r => updateRecord(r, { [res.key]: res.val }));
  toast(t('mass_done', { n: rs.length })); clearSel();
}

// ---------- card ----------
function cardCols() { return visibleCols(); }
function cardDefaults() {
  const live = liveRecords(); if (!live.length) return {};
  const last = live.reduce((a, b) => (b.created > a.created ? b : a));
  const vals = {}; const ni = nextInv(last.inv); if (ni) vals.inv = ni;
  if (last.lang) vals.lang = last.lang; if (last.loc) vals.loc = last.loc;
  return vals;
}
function datalist(key) {
  const s = new Set(); for (const r of DB.records) if (isLive(r) && r[key]) { s.add(r[key]); if (s.size > 300) break; }
  return `<datalist id="dl_${key}">${[...s].sort().map(v => `<option value="${esc(v)}">`).join('')}</datalist>`;
}
async function openCard(uuid, draftVals, silentRerender) {
  if (UI.card && !silentRerender) {
    if (UI.card.uuid === uuid && !!uuid) return;
    const ok = await confirmLeaveCard(); if (!ok) return;
  }
  const isNew = !uuid; const rec = uuid ? byUuid().get(uuid) : null;
  const host = $('#cardhost'); if (!host) return;
  const base = rec ? Object.fromEntries(Object.keys(rec).map(k => [k, rec[k]])) : { scanned: false, ...cardDefaults() };
  const vals = base;
  const wasOpen = !!UI.card;
  UI.card = { uuid: uuid || null, isNew, init: null, rec };
  const cols = cardCols();
  const body = cols.map(c => {
    if (c.kind === 'id') return '';
    const half = ['type', 'pages', 'lang', 'date'].includes(c.key) || (!c.b && ['number', 'date', 'list'].includes(c.kind));
    const dl = ['lang', 'loc', 'author'].includes(c.key) ? c.key : null;
    const lbl = c.kind === 'check' ? '' : `<div class="lbl">${esc(colName(c, true))}</div>`;
    let inner = lbl + fieldInputHtml(c, vals[c.key], 'f_' + c.key, { list: dl ? 'dl_' + dl : null }) + (dl ? datalist(dl) : '') + (c.key === 'inv' ? '<div class="ferr hidden" id="invErr"></div>' : '');
    if (c.key === 'inv') {
      return `<div style="display:flex;gap:10px;flex:1 1 100%"><div class="fld" style="flex:0 0 72px"><div class="lbl">${t('col_id')}</div><input class="inp ro" disabled value="${isNew ? '' : (rec.id)}"></div><div class="fld" style="flex:1">${inner}</div></div>`;
    }
    return `<div class="fld ${half ? 'half' : ''}">${inner}</div>`;
  }).join('');
  host.innerHTML = `<div class="cardhead"><button class="ib backb" id="cBack">${IC.back}</button><h3>${isNew ? t('card_new') : t('card_title')}</h3>${!isNew ? `<button class="ib" id="cDel" aria-label="${esc(t('btn_delete'))}">${IC.trash}</button>` : ''}<button class="ib only-wide" id="cX">${IC.close}</button></div>
    <div class="cardbody" id="cBody">${body}<div class="warn hidden" id="dupWarn">${IC.warn}<span></span></div></div>
    <div class="actions"><button class="btn b2" id="cCancel">${t('btn_cancel')}</button>${isNew ? `<button class="btn b3" id="cNext">${t('card_save_next')}</button>` : ''}<button class="btn b1" id="cSave">${t('btn_save')}</button></div>`;
  host.classList.add('on'); $('#shell').classList.add('hascard');
  bindCheckButtons(host);
  UI.card.init = JSON.stringify(readCard());
  if (draftVals) applyCardVals(draftVals);
  $('#cBack').onclick = () => history.back();
  $('#cX').onclick = () => closeCard(false);
  $('#cCancel').onclick = () => closeCard(false);
  $('#cSave').onclick = () => saveCard(false);
  if ($('#cNext')) $('#cNext').onclick = () => saveCard(true);
  if ($('#cDel')) $('#cDel').onclick = async () => { if (await confirmDlg(t('card_del_confirm'), t('btn_delete'), true)) { const r = UI.card.rec; closeCard(true); trashRecords([r]); toast(t('toast_trashed', { n: 1 })); refreshList(); } };
  let dt; host.addEventListener('input', () => { clearTimeout(dt); dt = setTimeout(checkDups, 250); });
  checkDups();
  if (!wasOpen) {
    UI.card.layer = pushLayer({ onBack: async () => confirmLeaveCard(), onClose: () => closeCardUI() });
  } else UI.card.layer = UI.cardLayerKeep;
  UI.cardLayerKeep = UI.card.layer;
  refreshListRowsOnly();
  if (isNew) {
    const target = vals.inv ? $('#f_title', host) : $('#f_inv', host);
    setTimeout(() => { const a = document.activeElement; if (target && (!a || a === document.body || !host.contains(a))) target.focus(); }, 60);
  }
}
function applyCardVals(v) {
  const host = $('#cardhost');
  for (const c of cardCols()) {
    if (c.kind === 'id' || !(c.key in v)) continue;
    const el = $('#f_' + c.key, host); if (!el) continue;
    if (c.kind === 'check') { if ((el.dataset.check === '1') !== !!v[c.key]) el.click(); }
    else el.value = (typeof v[c.key] === 'number' ? String(v[c.key]).replace('.', LANG === 'en' ? '.' : ',') : (v[c.key] ?? ''));
  }
}
function refreshListRowsOnly() { if (UI.route === 'books') refreshList(); }
function readCard() {
  const host = $('#cardhost'); const vals = {};
  for (const c of cardCols()) { if (c.kind === 'id') continue; const v = readInput(c, host); if (v !== undefined) vals[c.key] = v; }
  return vals;
}
function cardDirty() { return !!UI.card && JSON.stringify(readCard()) !== UI.card.init; }
function checkDups() {
  const host = $('#cardhost'); if (!host || !UI.card) return;
  const inv = ($('#f_inv', host) || {}).value || '';
  const ie = $('#invErr', host), iEl = $('#f_inv', host);
  const ex = inv.trim() ? findByInv(inv, UI.card.uuid) : null;
  if (ie) { ie.classList.toggle('hidden', !ex); if (ex) ie.textContent = t('err_inv_dup', { id: ex.id }); if (iEl) iEl.classList.toggle('err', !!ex); }
  const title = ($('#f_title', host) || {}).value || '', author = ($('#f_author', host) || {}).value || '';
  const dn = findByName(title, author, UI.card.uuid); const w = $('#dupWarn', host);
  if (w) { w.classList.toggle('hidden', !dn); if (dn) $('span', w).textContent = t('card_dup', { id: dn.id }); }
}
async function confirmLeaveCard() {
  if (!cardDirty()) return true;
  const r = await ask({ title: t('dirty_title'), buttons: [{ label: t('dirty_stay'), v: 'stay', cls: 'b2' }, { label: t('dirty_discard'), v: 'discard', cls: 'bd' }, { label: t('dirty_save'), v: 'save', cls: 'b1' }], dismiss: false });
  if (r === 'save') return saveCardCore();
  return r === 'discard';
}
function closeCardUI() {
  UI.card = null; UI.cardLayerKeep = null;
  const host = $('#cardhost'); if (host) { host.classList.remove('on'); host.innerHTML = ''; }
  const sh = $('#shell'); if (sh) sh.classList.remove('hascard');
  refreshListRowsOnly();
}
async function closeCard(force) {
  if (!UI.card) return true;
  if (!force && !(await confirmLeaveCard())) return false;
  const l = UI.card.layer; closeCardUI(); if (l) await dropLayer(l);
  return true;
}
// validate + persist without touching the UI; returns true on success
function saveCardCore() {
  const host = $('#cardhost'); const vals = readCard();
  const inv = (vals.inv || '').trim();
  const ie = $('#invErr', host), iEl = $('#f_inv', host);
  if (!inv) { ie.classList.remove('hidden'); ie.textContent = t('err_inv_req'); iEl.classList.add('err'); iEl.focus(); return false; }
  const ex = findByInv(inv, UI.card.uuid);
  if (ex) { ie.classList.remove('hidden'); ie.textContent = t('err_inv_dup', { id: ex.id }); iEl.classList.add('err'); iEl.focus(); return false; }
  vals.inv = inv;
  if (UI.card.isNew) { UI.card.rec = newRecord(vals); UI.card.isNew = false; UI.card.uuid = UI.card.rec.uuid; } else updateRecord(UI.card.rec, vals);
  UI.card.init = JSON.stringify(readCard());
  toast(t('toast_saved'), 1200);
  return true;
}
async function saveCard(next) {
  if (!saveCardCore()) return false;
  const l = UI.card.layer; closeCardUI(); if (l) await dropLayer(l);
  if (next) openCard(null);
  return true;
}

async function doLock() {
  if (!Auth.hasPin()) { await flushSave(); return; }
  if (UI.card && cardDirty()) DB.draft = { uuid: UI.card.uuid, isNew: UI.card.isNew, vals: readCard() };
  else DB.draft = null;
  await Auth.lockNow();
  UI.card = null; UI.sel.clear(); UI.selMode = false; UI.route = 'books'; UI.q = ''; UI.filter = 'all'; UI.listKey = ''; UI.layers = [];
  showLock();
}
