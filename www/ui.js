'use strict';
/* Gazna UI part 1: helpers, layers, dialogs, lock/setup, shell, books list, card */

const IC = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  sync: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>',
  menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a7a66" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  // default colours follow the theme (--ok / --bad) instead of fixed hex values
  ok: (s = 22, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c || 'currentColor'}"${c ? '' : ' style="color:var(--ok)"'} stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6"/></svg>`,
  no: (s = 22, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c || 'currentColor'}"${c ? '' : ' style="color:var(--bad)"'} stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  // "not done yet" (not scanned / not restored): a normal state, so a neutral empty circle — red is kept for errors
  off: (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:var(--outline)" stroke-width="2.2"><circle cx="12" cy="12" r="8"/></svg>`,
  plus: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  warn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:1px"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>',
  lamp: (sz = 22) => `<svg class="lampsvg" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>`,
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
  report: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  stats: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
  gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  trashn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  // reports: same line style as the rest of the set (emoji looked different on every phone)
  folder: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  folderOpen: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1"/><path d="M3 17l2.4-6.2A2 2 0 0 1 7.3 9.5H21l-2.6 7.2a2 2 0 0 1-1.9 1.3H5a2 2 0 0 1-2-1z"/></svg>',
  dots: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/></svg>',
  drag: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  sort: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3.5 7.5L7 4l3.5 3.5M17 20V4M13.5 16.5L17 20l3.5-3.5"/></svg>',
  select: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12.5l3 3 5-6"/></svg>',
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  file: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A8F3C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13l4 5M13 13l-4 5"/></svg>',
  finger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11v4a6 6 0 0 1-1 3M8 11a4 4 0 0 1 8 0v3M5 12a7 7 0 0 1 14 0v2M9 15c0 2-.5 3.500-1.500 5"/></svg>',
};
let _lid = 0;
function logoSvg(sz) {
  const id = 'lg' + (_lid++);
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 100 100" style="flex:none"><defs><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6E4524"/><stop offset="1" stop-color="#341D0E"/></linearGradient><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0D58A"/><stop offset="1" stop-color="#B5832C"/></linearGradient><linearGradient id="${id}i" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F0D58A"/><stop offset="1" stop-color="#B5832C"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#${id}b)"/><rect x="6" y="6" width="88" height="88" rx="17" fill="none" stroke="url(#${id}g)" stroke-width="1.2" opacity=".7"/><path fill="url(#${id}i)" transform="translate(50 50) scale(0.0405 -0.0405) translate(-818.5 -668)" d="M1406 70Q1282 29 1118.0 4.5Q954 -20 823 -20Q604 -20 440.5 60.0Q277 140 188.5 293.0Q100 446 100 655Q100 992 292.5 1174.0Q485 1356 842 1356Q929 1356 1000.5 1349.0Q1072 1342 1134.0 1330.0Q1196 1318 1362 1271V963H1272L1248 1137Q1169 1191 1074.0 1221.0Q979 1251 878 1251Q645 1251 538.5 1106.0Q432 961 432 657Q432 374 544.5 228.5Q657 83 870 83Q986 83 1091 118V506L919 532V606H1537V532L1406 506Z"/></svg>`;
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
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 180); }, ms);
}
// buttons: [{label, v, cls}] -> resolves with v (or null when dismissed)
// Material: a confirmation / alert (text + up to 3 buttons) is a centred dialog; option lists and forms stay bottom sheets.
// `sheet: true` forces a bottom sheet (a choice menu), `center: true` forces a centred dialog.
function ask({ title, text, html, buttons, onMount, dismiss = true, sheet = false, center }) {
  return new Promise(resolve => {
    const bl = buttons || [{ label: t('ok'), v: true, cls: 'b1' }];
    const centred = center !== undefined ? !!center : (!sheet && !html && !onMount && bl.length <= 3);
    const mb = document.createElement('div'); mb.className = 'mb' + (centred ? ' center' : '');
    const stack = bl.length >= 4 || (bl.length >= 3 && bl.some(b => String(b.label).length > 16));
    // order: Android puts Cancel first (left) and the confirming action right; Windows dialogs put the
    // confirming action first and Cancel / Close last. data-i keeps the original index either way.
    let order = bl.map((b, i) => i);
    if (document.documentElement.classList.contains('pc') && bl.length > 1 && (bl[0].v === null || bl[0].v === false)) order = [...order.slice(1), 0];
    const btns = order.map(i => { const b = bl[i]; return `<button class="btn ${b.cls || 'b2'}" data-i="${i}">${esc(b.label)}</button>`; }).join('');
    mb.innerHTML = `<div class="modal" role="dialog">${title ? `<h3>${esc(title)}</h3>` : ''}${text ? `<p>${esc(text)}</p>` : ''}${html || ''}<div class="btns${stack ? ' stack' : ''}">${btns}</div></div>`;
    document.body.appendChild(mb);
    let done = false;
    const layer = { onBack: () => { finish(null, true); return true; } };
    const finish = (v, fromBack) => {
      if (done) return; done = true; mb.classList.add('out'); setTimeout(() => mb.remove(), 170);
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
    const f = mb.querySelector('input,select,textarea'); if (f && !/ro/.test(f.className)) setTimeout(() => (f._ddBtn || f).focus(), 50);
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
    if (dots.children.length !== n) dots.innerHTML = Array.from({ length: n }, () => '<i class="pdot"></i>').join('');
    for (let i = 0; i < n; i++) dots.children[i].classList.toggle('on', i < v.length);
  };
  const press = k => {
    if (off) return;
    if (k === 'del') v = v.slice(0, -1);
    else if (/^\d$/.test(k) && v.length < (fixed || max)) v += k; else return;
    draw(); onChange && onChange(v);
    if (fixed && v.length === fixed) onDone && onDone(v);
  };
  // react on finger-down (no click delay); the click handler stays for mouse/keyboard-less cases
  let lastDown = 0;
  $$('#pad button[data-k]', root).forEach(b => {
    b.addEventListener('pointerdown', e => { if (e.button) return; lastDown = Date.now(); press(b.dataset.k); });
    b.addEventListener('click', () => { if (Date.now() - lastDown > 600) press(b.dataset.k); });
  });
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
async function showLock() {
  UI.layers = []; clearInterval(_lockTimer);
  const el = appEl();
  const bioOk = H.bio && Native.isApp && await Native.hasBioCreds();
  const bioBtn = bioOk ? `<button type="button" id="bio" class="bio" aria-label="${esc(t('lock_bio'))}">${IC.finger.replace('currentColor', '#E3D3B4')}</button>` : '';
  el.innerHTML = `<div class="lockscr"><div class="lockbox pinbox">${langRow()}
    <div style="display:flex;justify-content:center">${logoSvg(72)}</div>
    <h1>Gazna</h1>
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
    if (UI.bioBusy) return; UI.bioBusy = true;
    let p = null; try { p = await Native.bioGet(); } finally { setTimeout(() => { UI.bioBusy = false; }, 800); }
    if (!p) return;
    const r = await Auth.unlock(p); if (r.ok) { clearInterval(_lockTimer); afterUnlock(); } else { await Native.bioClear(); H.bio = false; await saveHeader(); showLock(); }
  };
  // the fingerprint prompt may only start while the app is on screen: started in the background it pulls the whole app back to the front
  if (bioOk && Date.now() - (UI.lastAutoBio || 0) > 4000) { UI.lastAutoBio = Date.now(); UI.bioPending = true; setTimeout(autoBio, 350); }
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
const NAV = [['books', 'nav_books', 'book'], ['stats', 'nav_stats', 'stats'], ['reports', 'nav_reports', 'report'], ['trash', 'nav_trash', 'trashn'], ['columns', 'nav_columns', 'cols'], ['ie', 'nav_import', 'imp'], ['sync', 'nav_sync', 'sync'], ['settings', 'nav_settings', 'gear']];
function mountShell() {
  UI.route = 'books'; UI.routeLayer = null; UI.card = null;
  UI.sort = H.sort && H.sort.key && colDef(H.sort.key) && (H.sort.dir === 1 || H.sort.dir === -1) ? { key: H.sort.key, dir: H.sort.dir } : null;
  appEl().innerHTML = `<div class="shell" id="shell">
    <button class="sidebtn" id="sideBtn" aria-haspopup="menu" aria-label="${esc(t('side_menu'))}">${IC.menu}</button>
    <aside class="side">
      <div class="brand">${logoSvg(44)}<div><b>Gazna</b></div></div>
      ${NAV.map(([k, lab, ic]) => `<button class="nav" data-r="${k}" aria-label="${esc(t(lab))}">${IC[ic]}<span>${t(lab)}</span></button>`).join('')}
      <div class="sp"></div>
      <div class="lg">${['tk', 'ru', 'en'].map(l => `<button data-l="${l}" class="${H.lang === l ? 'on' : ''}">${l.toUpperCase()}</button>`).join('')}</div>
      ${Auth.hasPin() ? `<button class="nav" id="navlock">${IC.lock(20)}<span>${t('nav_lock')}</span></button>` : ''}
    </aside>
    <section class="main" id="main"></section>
    <div id="cardhost"></div></div>`;
  applySide(); { const sb = $('#sideBtn'); if (sb) sb.onclick = () => sideMenu(sb); }
  $$('.side .nav[data-r]').forEach(b => b.onclick = () => goRoute(b.dataset.r));
  $$('.side .lg button').forEach(b => b.onclick = () => setLang(b.dataset.l));
  if ($('#navlock')) $('#navlock').onclick = () => doLock();
  renderRoute();
}
// ---- sidebar: full / narrow (icons) / hidden (PC, tablet, wide landscape phone). Local setting; default hidden ----
const SIDE_MODES = ['full', 'narrow', 'hidden'];
const sideMode = () => (SIDE_MODES.includes(H.side) ? H.side : 'hidden');
function applySide() { const sh = $('#shell'); if (sh) SIDE_MODES.forEach(m => sh.classList.toggle('side-' + m, m === sideMode())); }
function setSide(m) {
  if (!SIDE_MODES.includes(m)) return; if (m !== 'hidden') H.sideLast = m; H.side = m; saveHeader(); applySide();
  const v = UI.vr; if (v) { v.from = -1; renderWindow(true); }
}
function toggleSide() { setSide(sideMode() === 'hidden' ? (H.sideLast || 'full') : 'hidden'); } // Ctrl+B
function sideMenu(btn) {
  document.querySelectorAll('.sidemenu').forEach(e => e.remove());
  const m = document.createElement('div'); m.className = 'sidemenu'; m.setAttribute('role', 'menu');
  const cur = sideMode();
  m.innerHTML = [['full', 'side_full'], ['narrow', 'side_narrow'], ['hidden', 'side_hidden']].map(([k, l]) => `<button role="menuitem" data-m="${k}"><span class="ck">${k === cur ? IC.ok(16) : ''}</span>${esc(t(l))}</button>`).join('');
  const r = btn.getBoundingClientRect(); m.style.left = r.left + 'px'; m.style.top = r.bottom + 4 + 'px'; document.body.appendChild(m);
  const close = () => { m.remove(); document.removeEventListener('pointerdown', out, true); document.removeEventListener('keydown', key, true); };
  const out = e => { if (!m.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); btn.focus(); } };
  m.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) { close(); setSide(b.dataset.m); } });
  document.addEventListener('pointerdown', out, true); document.addEventListener('keydown', key, true);
  const f = m.querySelector('button'); if (f) f.focus();
}
async function setLang(l) {
  H.lang = l; applyPrefs(); await saveHeader();
  const route = UI.route, cardOpen = !!UI.card;
  const draft = cardOpen ? { uuid: UI.card.uuid, isNew: UI.card.isNew, vals: readCard() } : null;
  const layers = UI.layers.filter(l => !(UI.card && l === UI.card.layer));
  mountShell(); UI.layers = layers; if (route !== 'books') { UI.route = route; renderRoute(); }
  if (draft) openCard(draft.isNew ? null : draft.uuid, draft.vals, true);
}
function animRoute(cls = 'routein') { const m = $('#main'); if (!m) return; m.classList.remove('routein', 'routefwd', 'routeback'); void m.offsetWidth; m.classList.add(cls); if (animLevel() >= 3) setTimeout(countUpAll, 40); }
function goRoute(r) {
  if (r === UI.route) return;
  if (r === 'books') { if (UI.routeLayer) { const l = UI.routeLayer; UI.routeLayer = null; dropLayer(l); } UI.route = 'books'; renderRoute(); animRoute(); return; }
  if (UI.card) closeCard(false).then(ok => { if (ok) goRoute(r); });
  else {
    if (!UI.routeLayer) {
      UI.routeLayer = pushLayer({ onBack: () => { if (UI.route === 'reports' && repBack()) return false; UI.route = 'books'; UI.routeLayer = null; renderRoute(); return true; } });
    }
    UI.route = r; renderRoute(); animRoute();
  }
}
function renderRoute() {
  const main = $('#main'); if (!main) return;
  $$('.side .nav[data-r]').forEach(b => b.classList.toggle('on', b.dataset.r === UI.route));
  const views = { books: viewBooks, stats: viewStats, reports: viewReports, trash: viewTrash, columns: viewColumns, settings: viewSettings, ie: viewIE, sync: viewSync, import: viewImport };
  UI.selMode = UI.selMode && UI.route === 'books';
  (views[UI.route] || viewBooks)(main);
}
function mobBar(title) { // every screen but the list: burger (opens the menu) + title
  return `<div class="appbar mob back"><button class="ib" id="mbBack" aria-label="${esc(t('menu_btn'))}">${IC.menu}</button><h2>${esc(title)}</h2></div>`;
}
function bindMobBar() {
  const b = $('#mbBack'); if (b) b.onclick = () => openMenu();
  const m = $('#mbMenu'); if (m) m.onclick = () => openMenu();
}
// ---------- books list ----------
function tableCols() {
  const vis = visibleCols();
  if (isWide()) return vis;
  return vis.filter(c => c.kind === 'id' || c.key === 'inv' || onPhone(c));
}
// ---- column widths (per device, adjustable) ----
const CW_DEF = { id: [40, 46], inv: [92, 104], title: [240, 320], author: [180, 200], lang: [110, 120], date: [100, 110], type: [110, 120], pages: [76, 80], loc: [170, 190], scanned: [64, 64], restored: [72, 72] };
const CB_W = 36, CW_MIN = 36, CW_MAX = 600;
const cwMode = () => isWide() ? 'w' : 'p';
function defW(c) { const d = CW_DEF[c.key]; return d ? d[cwMode() === 'w' ? 1 : 0] : (c.kind === 'check' ? 64 : c.kind === 'number' ? 84 : 170); }
function colW(c) { const u = H.colw && H.colw[cwMode()] && H.colw[cwMode()][c.key]; return u || defW(c); }
function setColW(c, w) {
  H.colw = H.colw || { p: {}, w: {} }; const m = cwMode(); H.colw[m] = H.colw[m] || {};
  if (!w) delete H.colw[m][c.key]; else H.colw[m][c.key] = Math.max(CW_MIN, Math.min(CW_MAX, Math.round(w)));
}
function layout(cols) {
  let x = 0; const L = {}, ws = [];
  if (isWide() || UI.selMode) { L.cb = 0; x += CB_W; ws.push(CB_W); }
  for (const c of cols) { const w = colW(c); if (c.kind === 'id') L.id = x; else if (c.key === 'inv') L.inv = x; ws.push(w); x += w; }
  return { tpl: ws.map(w => w + 'px').join(' '), L, total: x };
}
function applyLayout(cols) {
  const tw = $('#tw'); if (!tw) return; const o = layout(cols);
  tw.style.setProperty('--tpl', o.tpl);
  for (const k of ['cb', 'id', 'inv']) tw.style.setProperty('--l-' + k, (o.L[k] || 0) + 'px');
}
// sticky (frozen) left columns: checkbox, ID, inventory number (left offsets come from CSS variables)
function stickyLefts(cols) {
  const o = {};
  if (isWide() || UI.selMode) { o.cb = 0; o.first = 'cb'; }
  if (cols[0] && cols[0].kind === 'id') { o.id = 0; if (!o.first) o.first = 'id'; if (cols[1] && cols[1].key === 'inv') { o.inv = 0; o.last = 'inv'; } else o.last = 'id'; }
  return o;
}
const stk = (o, k) => o[k] !== undefined ? ` stk${o.first === k ? ' stkf' : ''}${o.last === k ? ' stkl' : ''}" style="left:var(--l-${k})` : '';
const cellVal = (c, r) => String(cellText(c, r) ?? '').trim();
function sortKeyOf(c, r) { if (c.kind === 'id') return r.id; if (c.kind === 'number') { const v = r[c.key]; return v === '' || v == null ? null : (typeof v === 'number' ? v : parseNum(String(v))); } if (c.kind === 'check') return r[c.key] ? 1 : 0; const v = cellVal(c, r); return v ? norm(v).replace(/\d+/g, m => m.padStart(12, '0')) : null; }
function computeList() {
  const cf = UI.colf || {};
  const key = `${DB.rev}|${UI.q}|${UI.filter}|${UI.sort ? UI.sort.key + UI.sort.dir : ''}|${Object.keys(cf).map(k => k + ':' + cf[k].join('\u0001')).join('|')}`;
  if (UI.listKey === key) return UI.list;
  const toks = norm(UI.q).split(' ').filter(Boolean);
  let l = DB.records.filter(isLive);
  if (UI.filter === 'scanned') l = l.filter(r => r.scanned); else if (UI.filter === 'not') l = l.filter(r => !r.scanned);
  else if (UI.filter === 'pin') l = l.filter(r => r.pin);
  else if (UI.filter === 'rest') l = l.filter(r => r.restored); else if (UI.filter === 'notrest') l = l.filter(r => !r.restored);
  else if (UI.filter === 'recent') { const lim = Date.now() - 7 * 86400000; l = l.filter(r => (r.ts || 0) >= lim || (r.created || 0) >= lim); }
  if (toks.length) l = l.filter(r => { const s = searchKey(r); return toks.every(x => s.includes(x)); });
  for (const k of Object.keys(cf)) { const c = colDef(k); if (!c) continue; const set = new Set(cf[k]); l = l.filter(r => set.has(cellVal(c, r))); }
  if (UI.sort && colDef(UI.sort.key)) {
    const c = colDef(UI.sort.key), d = UI.sort.dir;
    const ks = new Map(l.map(r => [r, sortKeyOf(c, r)]));
    l.sort((a, b) => { const x = ks.get(a), y = ks.get(b); if (x === null && y === null) return a.id - b.id; if (x === null) return 1; if (y === null) return -1; return (x < y ? -d : x > y ? d : 0) || (a.id - b.id); });
  } else l.sort((a, b) => a.id - b.id);
  UI.list = l; UI.listKey = key; return l;
}
function viewBooks(main) {
  main.classList.remove('hdrhide');
  main.innerHTML = `<div class="toolbar"><div class="trow">
    <button class="ib tbmenu only-narrow" id="mbMenu" aria-label="${esc(t('menu_btn'))}">${IC.menu}</button>
    <div class="search">${IC.search}<input id="q" type="search" placeholder="${esc(t('search_ph'))}" value="${esc(UI.q)}" autocomplete="off"><span class="fchip hidden" id="fchip"><button id="fchipB" type="button"></button><button id="fchipX" type="button" aria-label="${esc(t('flt_reset'))}">${IC.close}</button></span></div>
    <button class="ib tbbtn" id="tbRec" aria-label="${esc(t('f_recent'))}">${IC.recent}</button><button class="ib tbbtn tbpin hidden" id="tbPin" aria-label="${esc(t('f_pinned'))}">${IC.lamp(22)}</button>
    <button class="sbtn only-wide" id="bImp">${IC.imp}${t('btn_import')}</button><button class="sbtn only-wide" id="bExp">${IC.imp.replace('M12 3v12M7 10l5 5 5-5', 'M12 15V3M7 8l5-5 5 5')}${t('btn_export')}</button><button class="sbtn pri only-wide" id="bNew">${IC.plus.replace('width="26" height="26"', 'width="18" height="18"')}${t('btn_new')}</button></div>
    <div class="tiles" id="chips"></div></div>
  <div id="banner"></div><div class="counter hidden" id="counter"></div>
  <div class="selbar hidden" id="selbar"></div>
  <div class="tablewrap" id="tw"><div class="th" id="th"></div><div id="rows"></div></div>
  <div class="srail" id="srail"><div class="sbub" id="sbub"></div><div class="sthumb" id="sthumb"></div></div>
  <button class="jmpbtn hidden" id="jmpbtn" aria-label="${esc(t('go_top'))}">${IC.up}</button>
  <button class="fab only-narrow" id="fab" aria-label="${esc(t('btn_new'))}">${IC.plus}</button>`;
  bindMobBar();
  const q = $('#q');
  let qt; q.oninput = () => { clearTimeout(qt); qt = setTimeout(() => { UI.q = q.value; refreshList(); const w = $('#tw'); if (w) w.scrollTop = 0; }, 120); };
  $('#bNew').onclick = () => addRecord(); $('#fab').onclick = () => addRecord();
  $('#bImp').onclick = () => startImport(); $('#bExp').onclick = () => goRoute('ie');
  renderChips();
  $('#tbRec').onclick = () => { UI.filter = UI.filter === 'recent' ? 'all' : 'recent'; renderChips(); refreshList(); const w = $('#tw'); if (w) w.scrollTop = 0; };
  $('#tbPin').onclick = () => { UI.filter = UI.filter === 'pin' ? 'all' : 'pin'; renderChips(); refreshList(); const w = $('#tw'); if (w) w.scrollTop = 0; };
  $('#fchipX').onclick = () => { UI.colf = {}; renderChips(); refreshList(); };
  $('#fchipB').onclick = () => colFilterList();
  $('#tw').addEventListener('scroll', onListScroll, { passive: true }); bindResize(); bindRail();
  const rows = $('#rows');
  rows.addEventListener('click', onRowClick);
  let lp = null, lpFired = false, lx = 0, ly = 0;
  const scrolledJustNow = () => Date.now() - (UI.lastScroll || 0) < 200;
  const cancelLp = () => { clearTimeout(lp); lp = null; };
  // a touch that only stops a fling, or a finger that slides / scrolls, is never a long press
  rows.addEventListener('touchstart', e => {
    const tr = e.target.closest('.tr'); cancelLp(); if (!tr || scrolledJustNow()) return;
    lpFired = false; const tc = e.touches[0]; lx = tc.clientX; ly = tc.clientY;
    lp = setTimeout(() => { lp = null; if (scrolledJustNow()) return; lpFired = true; if (navigator.vibrate) navigator.vibrate(20); enterSelMode(tr.dataset.u); }, 480);
  }, { passive: true });
  rows.addEventListener('touchend', e => { cancelLp(); if (lpFired) { e.preventDefault(); } });
  rows.addEventListener('touchmove', e => { const tc = e.touches[0]; if (tc && (Math.abs(tc.clientX - lx) > 8 || Math.abs(tc.clientY - ly) > 8)) cancelLp(); }, { passive: true });
  rows.addEventListener('touchcancel', cancelLp, { passive: true });
  $('#tw').addEventListener('scroll', cancelLp, { passive: true });
  rows.addEventListener('contextmenu', e => { if (e.target.closest('.tr')) e.preventDefault(); });
  // wide screens: the card overlays the list; a click on empty list space closes it (rows open their own card)
  $('#tw').addEventListener('click', e => { if (UI.card && isWide() && !e.target.closest('.tr,.th')) closeCard(false); });
  if (UI.firstPaint) { UI.firstPaint = false; requestAnimationFrame(() => setTimeout(() => { if ($('#rows')) refreshList(); }, 0)); } else refreshList();
}
function tileCounts() {
  const hasQ = norm(UI.q).trim() || Object.keys(UI.colf || {}).length;
  if (!hasQ) { const c = counts(); return { all: c.total, scanned: c.scanned, not: c.total - c.scanned, rest: c.rest, notrest: c.total - c.rest }; }
  const key = `${DB.rev}|${UI.q}|${Object.keys(UI.colf).map(k => k + ':' + UI.colf[k].join('\u0001')).join('|')}`;
  if (UI._tcKey === key) return UI._tc;
  const toks = norm(UI.q).split(' ').filter(Boolean), cf = UI.colf || {}, cks = Object.keys(cf).map(k => [colDef(k), new Set(cf[k])]).filter(x => x[0]);
  const o = { all: 0, scanned: 0, not: 0, rest: 0, notrest: 0 };
  for (const r of DB.records) {
    if (!isLive(r)) continue;
    if (toks.length) { const sk = searchKey(r); if (!toks.every(x => sk.includes(x))) continue; }
    if (cks.length && !cks.every(([c, set]) => set.has(cellVal(c, r)))) continue;
    o.all++; if (r.scanned) o.scanned++; else o.not++; if (r.restored) o.rest++; else o.notrest++;
  }
  UI._tcKey = key; UI._tc = o; return o;
}
const scanUiOn = () => H.scan !== false && H.scanUi !== false;
function renderChips() {
  const c = $('#chips'); if (!c) return;
  const rf = H.rest && H.restUi, sc = scanUiOn(), n = tileCounts();
  const T = (k, lab) => `<button class="ftile ${UI.filter === k ? 'on' : ''}" data-f="${k}"><b class="tn">${fmtInt(n[k])}</b><span class="tl">${esc(lab)}</span></button>`;
  c.className = 'tiles' + (rf ? ' two' : '') + (!sc && !rf ? ' one' : '');
  c.innerHTML = `<div class="trw">${T('all', t('f_all'))}${sc ? T('scanned', t('f_scanned')) + T('not', t('f_notscanned')) : ''}</div>` + (rf ? `<div class="trw r2">${T('rest', t('f_rest'))}${T('notrest', t('f_notrest'))}</div>` : '');
  $$('.ftile', c).forEach(b => b.onclick = () => { UI.filter = b.dataset.f; renderChips(); refreshList(); const w = $('#tw'); if (w) w.scrollTop = 0; });
  const nf = Object.keys(UI.colf || {}).length, fc = $('#fchip');
  if (fc) { fc.classList.toggle('hidden', !nf); $('#fchipB').innerHTML = IC.funnel + '<b>' + nf + '</b>'; }
  const rec = $('#tbRec'), pn = $('#tbPin'), hasPin = UI.filter === 'pin' || DB.records.some(r => r.pin && isLive(r));
  if (rec) rec.classList.toggle('on', UI.filter === 'recent');
  if (pn) { pn.classList.toggle('hidden', !hasPin); pn.classList.toggle('on', UI.filter === 'pin'); }
}
function rowHtml(r, cols, tpl) {
  const sel = UI.sel.has(r.uuid);
  const SL = stickyLefts(cols);
  const cb = (isWide() || UI.selMode) ? `<span class="cbc${stk(SL, 'cb')}" data-cb="1"><b class="cb ${sel ? 'on' : ''}">${sel ? IC.ok(14, 'currentColor') : ''}</b></span>` : '';
  const cells = cols.map(c => {
    if (c.kind === 'id') return `<span class="idc${stk(SL, 'id')}"><i>${r.id}</i></span>`;
    if (c.kind === 'check') return `<span class="mid">${r[c.key] ? IC.ok(20) : IC.off(20)}</span>`;
    if (c.kind === 'number') return `<span class="num"><i>${esc(cellText(c, r))}</i></span>`;
    return `<span class="${c.key === 'inv' ? 'inv' + stk(SL, 'inv') : 'tx'}"><i>${esc(cellText(c, r))}</i></span>`;
  }).join('');
  const cur = UI.card && UI.card.uuid === r.uuid ? ' cur' : '';
  return `<div class="tr${sel ? ' sel' : ''}${cur}${r.pin ? ' pin' : ''}${UI.hlU === r.uuid ? ' hl' : ''}" data-u="${r.uuid}">${cb}${cells}</div>`;
}
function renderHead(cols, tpl) {
  const th = $('#th'); if (!th) return;
  const showCb = isWide() || UI.selMode;
  const SL = stickyLefts(cols);
  th.innerHTML = (showCb ? `<span class="${stk(SL, 'cb').slice(1)}"></span>` : '') + cols.map(c => `<span data-k="${c.key}" class="${UI.sort && UI.sort.key === c.key ? 'srt ' : ''}${c.kind === 'number' ? 'num' : c.kind === 'check' ? 'mid' : ''}${UI.colf && UI.colf[c.key] ? ' flt' : ''}${c.kind === 'id' ? stk(SL, 'id') : c.key === 'inv' ? stk(SL, 'inv') : ''}"><i>${esc(colName(c))}${UI.sort && UI.sort.key === c.key ? (UI.sort.dir > 0 ? ' ▲' : ' ▼') : ''}</i><u class="rz" data-k="${c.key}"></u></span>`).join('');
}
function bindResize() {
  const th = $('#th'); if (!th) return;
  th.addEventListener('pointerdown', e => {
    const h = e.target.closest('.rz'); if (!h) return;
    e.preventDefault(); e.stopPropagation();
    const cols = tableCols(); const c = cols.find(x => x.key === h.dataset.k); if (!c) return;
    const w0 = colW(c), x0 = e.clientX; h.setPointerCapture(e.pointerId); h.classList.add('on');
    const mv = ev => { setColW(c, w0 + ev.clientX - x0); applyLayout(cols); };
    const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); h.classList.remove('on'); saveHeader(); };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  });
  th.addEventListener('click', e => { if (e.target.closest('.rz')) { e.stopPropagation(); return; } const sp = e.target.closest('#th>span[data-k]'); if (sp) colMenu(sp.dataset.k); });
}
// ---- virtualised list: only the rows near the viewport exist in the DOM (fixed row height) ----
const VBUF0 = 24, VBUFMAX = 72; // rows kept above / below the viewport (grows with the scroll speed: a fast fling must not outrun the drawn rows); the window is rebuilt only when the view gets within VMARGIN rows of its edge
let VBUF = VBUF0, VMARGIN = 8;
function setBuf(rowsPerFrame) { VBUF = Math.max(VBUF0, Math.min(VBUFMAX, VBUF0 + Math.ceil(rowsPerFrame * 6))); VMARGIN = Math.max(8, Math.round(VBUF / 3)); }
UI.sort = null; UI.colf = {};
UI.vr = { rh: 66, from: -1, to: -1, cols: null, raf: 0 };
// row height = font size x --row-em (4.1 on phones: two-line titles, big touch rows; denser on the Windows app)
function rowHeightPx() { const cs = getComputedStyle(document.documentElement); return Math.round(parseFloat(cs.fontSize) * (parseFloat(cs.getPropertyValue('--row-em')) || 4.1)); }
function renderWindow(force) {
  const rows = $('#rows'), tw = $('#tw'); const list = UI.list; if (!rows || !tw || !list || !list.length) return;
  const v = UI.vr, rh = v.rh, n = list.length;
  const rowsTop = rows.getBoundingClientRect().top - tw.getBoundingClientRect().top + tw.scrollTop;
  const top = Math.max(0, tw.scrollTop - rowsTop), h = tw.clientHeight || 600;
  const vis0 = Math.floor(top / rh), vis1 = Math.min(n, Math.ceil((top + h) / rh));
  const mg = force === 'idle' ? Math.max(VMARGIN, VBUF0 - 6) : VMARGIN; // after a fling stops, top the window up on the side that is running low
  if (force !== true && v.from >= 0 && (vis0 >= v.from + mg || v.from === 0) && (vis1 <= v.to - mg || v.to === n)) return;
  const from = Math.max(0, Math.min(n - 1, vis0 - VBUF)), to = Math.min(n, vis1 + VBUF);
  const of = v.from, ot = v.to;
  rows.style.paddingTop = from * rh + 'px'; rows.style.paddingBottom = (n - to) * rh + 'px';
  if (force !== true && of >= 0 && v.list === list && v.cols === v.shown && from < ot && to > of && rows.children.length === ot - of) {
    // scrolled a little: keep the rows that are still in the window, drop the ones that left, add only the new ones
    const keepFrom = Math.max(of, from), keepTo = Math.min(ot, to);
    for (let i = of; i < keepFrom; i++) rows.removeChild(rows.firstChild);
    for (let i = keepTo; i < ot; i++) rows.removeChild(rows.lastChild);
    if (from < keepFrom) rows.insertAdjacentHTML('afterbegin', list.slice(from, keepFrom).map(r => rowHtml(r, v.cols, '')).join(''));
    if (to > keepTo) rows.insertAdjacentHTML('beforeend', list.slice(keepTo, to).map(r => rowHtml(r, v.cols, '')).join(''));
  } else rows.innerHTML = list.slice(from, to).map(r => rowHtml(r, v.cols, '')).join('');
  v.from = from; v.to = to; v.list = list; v.shown = v.cols;
}
function flipHdr(p) { if (animLevel() < 2) return; p.classList.remove('hdrflip'); void p.offsetWidth; p.classList.add('hdrflip'); }
const LAND_SHORT = '(max-height:520px),(max-height:660px) and (max-width:899px)';
function onListScroll() {
  const v = UI.vr; if (v.raf || v.drag) return; // while the slider is held it draws the rows itself
  v.raf = requestAnimationFrame(now => {
    const tw0 = $('#tw');
    if (tw0) {
      const dt = Math.max(1, now - (v.lastT || now - 16)), dy = Math.abs(tw0.scrollTop - (v.lastTop || 0));
      if (v.lastT && dt < 250) {
        setBuf((dy / dt) * 16 / (v.rh || 60));
        // device that cannot keep ~30 fps while scrolling: simplify the glow/shadows (animations stay)
        if (dt > 34) { v.slowN = (v.slowN || 0) + 1; if (v.slowN >= 6 && !document.documentElement.classList.contains('slow')) document.documentElement.classList.add('slow'); } else v.slowN = Math.max(0, (v.slowN || 0) - 1);
      }
      v.lastT = now; v.lastTop = tw0.scrollTop; v.slowN = v.slowN || 0;
      if (animLevel() >= 2) { // the + button steps aside while scrolling down, comes back when scrolling up or after a pause
        const f = $('.fab'), st = tw0.scrollTop, d = st - (v.fabTop || 0);
        if (f && Math.abs(d) > 10) { f.classList.toggle('fabhide', d > 0 && st > 160); v.fabTop = st; }
      }
      clearTimeout(v.idleT); v.idleT = setTimeout(() => { v.lastT = 0; setBuf(0); if ($('#rows')) renderWindow('idle'); }, 140);
      clearTimeout(v.fabT); v.fabT = setTimeout(() => { const fb = $('.fab'); if (fb) fb.classList.remove('fabhide'); }, 1000);
    }
    v.raf = 0;
    const tw = $('#tw');
    renderWindow(false); updateRail(); jmpScroll();
  });
}
// ---- right-hand scroll slider (touch screens): thin at rest, fat + bubble "№ N" while held; one round jump button ----
const railOn = () => matchMedia('(pointer:coarse)').matches;
const RAIL_TH = 52;
function updateRail() {
  const tw = $('#tw'), r = $('#srail'), th = $('#sthumb'); if (!tw || !r) return;
  const max = tw.scrollHeight - tw.clientHeight;
  const show = railOn() && max > tw.clientHeight * 1.5;
  r.style.display = show ? 'block' : 'none'; if (!show) return;
  const fb = $('.fab'), fabH = fb && getComputedStyle(fb).display !== 'none' && !fb.classList.contains('hidden') ? 84 : 0; // the track stops above the + button
  const hh = ($('#th') || {}).offsetHeight || 38, rh = tw.clientHeight - hh - fabH;
  r.style.top = (tw.offsetTop + hh) + 'px'; r.style.height = rh + 'px';
  const k = Math.max(0, Math.min(1, tw.scrollTop / max));
  th.style.height = RAIL_TH + 'px'; th.style.transform = `translateY(${k * (rh - RAIL_TH)}px)`;
  const bub = $('#sbub'); if (bub) bub.style.transform = `translateY(${k * (rh - RAIL_TH) + RAIL_TH / 2 - 17}px)`;
  if (r.classList.contains('on') && bub) { const n = UI.list.length, i = Math.min(n, Math.max(1, Math.round(k * (n - 1)) + 1)); bub.textContent = '№ ' + fmtInt(i); }
}
function bindRail() {
  const tw = $('#tw'), r = $('#srail'); if (!tw || !r) return;
  let ty = null, raf = 0, lastI = -1;
  // pointer events can arrive faster than frames: remember the last position and draw once per frame, with a small row buffer (the window is rebuilt on every jump anyway)
  const frame = () => {
    raf = 0; if (ty === null) return;
    const b = r.getBoundingClientRect(), max = tw.scrollHeight - tw.clientHeight;
    const k = Math.max(0, Math.min(1, (ty - b.top - RAIL_TH / 2) / (b.height - RAIL_TH)));
    const n = (UI.list || []).length, i = Math.round(k * Math.max(0, n - 1));
    if (i === lastI) { updateRail(); return; } lastI = i;
    tw.scrollTop = k * max; renderWindow(false); updateRail();
  };
  const go = e => { ty = e.clientY; if (!raf) raf = requestAnimationFrame(frame); };
  r.addEventListener('pointerdown', e => { e.preventDefault(); r.setPointerCapture(e.pointerId); r.classList.add('on'); UI.vr.drag = true; lastI = -1; VBUF = 8; VMARGIN = 3; go(e); });
  r.addEventListener('pointermove', e => { if (r.classList.contains('on')) go(e); });
  const up = () => { r.classList.remove('on'); ty = null; if (raf) { cancelAnimationFrame(raf); raf = 0; } UI.vr.drag = false; setBuf(0); renderWindow('idle'); updateRail(); }; r.addEventListener('pointerup', up); r.addEventListener('pointercancel', up);
  const jb = $('#jmpbtn');
  if (jb) jb.onclick = () => { const mx = tw.scrollHeight - tw.clientHeight; tw.scrollTop = jb.dataset.dir === 'up' ? 0 : mx; jb.classList.remove('on'); };
  window.addEventListener('resize', updateRail);
}
// the jump button: scrolling down shows ↑ (to the start), scrolling up shows ↓ (to the end); gone after ~2 s idle and at the ends of the list
const JM = { last: 0, dir: 0, t: 0 };
function jmpScroll() {
  const tw = $('#tw'), b = $('#jmpbtn'); if (!tw || !b) return;
  const st = tw.scrollTop, mx = tw.scrollHeight - tw.clientHeight, h = tw.clientHeight, d = st - JM.last;
  if (Math.abs(d) > 4) { JM.dir = d > 0 ? 1 : -1; JM.last = st; }
  const long = mx > h * 1.5;
  const show = long && ((JM.dir > 0 && st > h * 0.7) || (JM.dir < 0 && st < mx - h * 0.7));
  if (b.dataset.dir !== (JM.dir > 0 ? 'up' : 'down')) { b.dataset.dir = JM.dir > 0 ? 'up' : 'down'; b.innerHTML = JM.dir > 0 ? IC.up : IC.down; b.setAttribute('aria-label', t(JM.dir > 0 ? 'go_top' : 'go_end')); }
  b.classList.remove('hidden'); b.classList.toggle('on', show);
  clearTimeout(JM.t); if (show) JM.t = setTimeout(() => b.classList.remove('on'), 2000);
}
function jmpUpdate() { const b = $('#jmpbtn'), tw = $('#tw'); if (!b || !tw) return; if (tw.scrollHeight - tw.clientHeight < tw.clientHeight * 1.5) b.classList.remove('on'); }

// ---- column header menu: sort, filter, auto width, hide ----
function setSort(key, dir) { UI.sort = dir ? { key, dir } : null; H.sort = UI.sort ? { ...UI.sort } : null; saveHeader(); refreshList(); } // the chosen order is a setting of THIS device (not synced)
function autoFit(c) {
  const cv = document.createElement('canvas').getContext('2d'); const fs = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.9;
  cv.font = `${fs}px Inter, system-ui, sans-serif`; let mx = cv.measureText(colName(c)).width + 24;
  const recs = UI.list || []; const step = Math.max(1, Math.floor(recs.length / 3000));
  for (let i = 0; i < recs.length; i += step) { const w = cv.measureText(cellVal(c, recs[i])).width; if (w > mx) mx = w; }
  setColW(c, Math.min(420, mx + 20)); applyLayout(tableCols()); saveHeader();
}
async function colMenu(key) {
  const c = colDef(key); if (!c) return;
  const sorted = UI.sort && UI.sort.key === key ? UI.sort.dir : 0, filt = !!(UI.colf && UI.colf[key]);
  const items = [['asc', t('m_sort_asc'), sorted === 1], ['desc', t('m_sort_desc'), sorted === -1]];
  if (UI.sort) items.push(['sort0', t('m_sort_off')]);
  if (c.kind !== 'id') items.push(['filter', t('m_filter'), filt]); if (filt) items.push(['filter0', t('m_filter_off')]);
  items.push(['fit', t('m_fit')]);
  if (c.kind !== 'id' && !(builtinOf(c.key) || {}).noHide) items.push(['hide', t('m_hide')]);
  const html = `<div class="group" style="margin:0">${items.map(([k, l, on]) => `<button class="setrow" data-go="${k}"><span class="tt">${esc(l)}</span>${on ? `<span class="chev" style="color:var(--accent)">${IC.ok(18)}</span>` : ''}</button>`).join('')}</div>`;
  const p = ask({ title: colName(c), html, buttons: [{ label: t('close'), v: null, cls: 'b2' }] });
  setTimeout(() => $$('.mb [data-go]').forEach(b => b.onclick = () => {
    const mb = b.closest('.mb'); const k = b.dataset.go; mb.querySelector('.btn').click();
    setTimeout(async () => {
      if (k === 'asc') setSort(key, 1); else if (k === 'desc') setSort(key, -1); else if (k === 'sort0') setSort(key, 0);
      else if (k === 'filter') await colFilterDlg(c); else if (k === 'filter0') { delete UI.colf[key]; renderChips(); refreshList(); }
      else if (k === 'fit') autoFit(c);
      else if (k === 'hide') { c.hidden = true; c.mts = Date.now(); colStamp(); scheduleSave(); refreshList(); }
    }, 30);
  }), 20);
  await p;
}
async function colFilterDlg(c) {
  const counts = new Map(); for (const r of DB.records) if (isLive(r)) { const v = cellVal(c, r); counts.set(v, (counts.get(v) || 0) + 1); }
  const lab = v => v === '' ? t('empty_val') : (c.kind === 'check' ? (v ? t('yes_label') : t('no_label')) : v);
  const all = [...counts.keys()].sort((a, b) => a === '' ? 1 : b === '' ? -1 : norm(a) < norm(b) ? -1 : norm(a) > norm(b) ? 1 : 0);
  const sel = new Set(UI.colf[c.key] || all); let q = '';
  const res = await ask({
    title: t('f_title', { x: colName(c) }),
    html: `<input class="inp" id="fq" placeholder="${esc(t('f_search'))}" autocomplete="off"><div style="display:flex;gap:8px;margin:8px 0"><button class="sbtn" id="fAll">${t('f_all')}</button><button class="sbtn" id="fNone">${t('f_none')}</button><span class="ss" id="fInfo" style="margin-left:auto;align-self:center"></span></div><div id="fl" style="max-height:42vh;overflow:auto"></div>`,
    onMount: m => {
      const draw = () => {
        const nq = norm(q); const vis = all.filter(v => !nq || norm(lab(v)).includes(nq)); const show = vis.slice(0, 300);
        $('#fl', m).innerHTML = show.map(v => `<label class="setrow" style="padding:8px 4px"><input type="checkbox" data-v="${esc(v)}" ${sel.has(v) ? 'checked' : ''} style="margin-right:10px"><span class="tt">${esc(lab(v))}</span><span class="ss">${counts.get(v)}</span></label>`).join('') + (vis.length > show.length ? `<div class="ss" style="padding:8px">${t('loading_more', { a: show.length, b: vis.length })}</div>` : '');
        $('#fInfo', m).textContent = `${sel.size} / ${all.length}`;
        $$('#fl input', m).forEach(i => i.onchange = () => { if (i.checked) sel.add(i.dataset.v); else sel.delete(i.dataset.v); $('#fInfo', m).textContent = `${sel.size} / ${all.length}`; });
      };
      $('#fq', m).oninput = e => { q = e.target.value; draw(); };
      $('#fAll', m).onclick = () => { const nq = norm(q); all.filter(v => !nq || norm(lab(v)).includes(nq)).forEach(v => sel.add(v)); draw(); };
      $('#fNone', m).onclick = () => { const nq = norm(q); all.filter(v => !nq || norm(lab(v)).includes(nq)).forEach(v => sel.delete(v)); draw(); };
      draw();
    },
    buttons: [{ label: t('btn_cancel'), v: null }, { label: t('chg_apply'), cls: 'b1', v: true }]
  });
  if (!res) return;
  if (sel.size >= all.length) delete UI.colf[c.key]; else UI.colf[c.key] = [...sel];
  renderChips(); refreshList(); const w = $('#tw'); if (w) w.scrollTop = 0;
}
function refreshList() {
  if (UI.route !== 'books') return;
  const list = computeList(); const cols = tableCols();
  applyLayout(cols); renderHead(cols, '');
  const rows = $('#rows'), tw = $('#tw'); if (!rows) return;
  const total = counts();
  const v = UI.vr; v.cols = cols; v.rh = rowHeightPx(); tw.style.setProperty('--rh', v.rh + 'px');
  if (!list.length) {
    rows.style.paddingTop = rows.style.paddingBottom = '0px'; v.from = v.to = -1;
    rows.innerHTML = `<div class="empty"><b>${total.total ? t('list_none') : t('list_empty')}</b>${total.total ? '' : t('list_empty_sub').replace('{fab}', '<span class="fabi"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg></span>')}</div>`;
  } else renderWindow(true);
  { const k = list.length + ':' + (list[0] && list[0].uuid); if (k !== UI._lk) { UI._lk = k; rows.classList.remove('listin'); void rows.offsetWidth; rows.classList.add('listin'); clearTimeout(UI._lkT); UI._lkT = setTimeout(() => rows.classList.remove('listin'), animLevel() >= 3 ? 800 : 320); } }
  renderCounter(list, total); renderBanner(total); renderSelbar(); updateRail();
}
function renderCounter(list, total) { // the numbers live on the filter tiles now
  renderChips(); jmpUpdate();
}
function renderBanner(total) {
  const b = $('#banner'); if (!b) return;
  if (!total.total) { b.innerHTML = ''; return; }
  const d = H.lastBackup ? Math.floor((Date.now() - H.lastBackup) / 86400000) : null;
  if (d !== null && d <= 7) { b.innerHTML = ''; return; }
  b.innerHTML = `<div class="banner">${IC.warn}<span>${d === null ? t('backup_never') : t('backup_remind', { d, w: noun('day', d) })}</span><button class="sbtn" id="bkBtn">${t('set_backup_btn')}</button></div>`;
  $('#bkBtn').onclick = async () => { const n = await createBackup(); if (n) toast(t('backup_done', { f: n })); renderBanner(counts()); };
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
  const fab = $('#fab'), on = !!(UI.sel.size || UI.selMode);
  if (fab) fab.classList.toggle('hidden', on);
  if (s.parentElement) s.parentElement.classList.toggle('selmode', on);
  if (!on) { s.classList.add('hidden'); s.innerHTML = ''; return; }
  s.classList.remove('hidden');
  const rs = selRecords(), allPin = rs.length && rs.every(r => r.pin);
  s.innerHTML = `<div class="selhead"><button class="selx" id="sbX" aria-label="${esc(t('close'))}">${IC.close}</button><span class="selcnt">${t('sel_count', { n: UI.sel.size })}</span><button class="selall" id="sbAll">${t('sel_all')}</button></div>
    <div class="selact">${scanUiOn() ? `<button class="sb pri" id="sbMark">${IC.ok(22, 'currentColor')}<span>${esc(t('col_scan'))}</span></button>` : ''}${H.rest ? `<button class="sb" id="sbRest">${IC.ok(22, 'currentColor')}<span>${esc(t('col_rest'))}</span></button>` : ''}<button class="sb" id="sbPin">${IC.lamp(22)}<span>${allPin ? t('pin_off') : t('pin_on')}</span></button><button class="sb" id="sbChg">${IC.edit}<span>${esc(t('sel_edit'))}</span></button><button class="sb del" id="sbDel">${IC.trash}<span>${t('btn_delete')}</span></button></div>`;
  const rb = $('#sbRest'); if (rb) rb.onclick = () => { const r2 = selRecords().filter(r => !r.restored); r2.forEach(r => updateRecord(r, { restored: true })); toast(t('mass_done', { n: r2.length })); clearSel(); };
  $('#sbAll').onclick = () => { computeList().forEach(r => UI.sel.add(r.uuid)); UI.selMode = true; refreshList(); };
  $('#sbX').onclick = () => clearSel();
  $('#sbPin').onclick = () => { const rs = selRecords(), on = !rs.every(r => r.pin); rs.forEach(r => updateRecord(r, { pin: on })); toast(t(on ? 'pin_done' : 'unpin_done', { n: rs.length })); clearSel(); };
  const mb = $('#sbMark'); if (mb) mb.onclick = () => { const rs = selRecords().filter(r => !r.scanned); rs.forEach(r => updateRecord(r, { scanned: true })); toast(t('mass_done', { n: rs.length })); clearSel(); };
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
    const lOn = c.key === 'restored' ? t('rest_card') : (opt.label || colName(c, true)), lOff = c.key === 'restored' ? t('rest_card_off') : lOn;
    return `<button type="button" class="scanrow ${on ? 'on' : 'off'}" id="${id}" data-check="${on ? 1 : 0}"><span class="bx">${on ? IC.ok(16) : ''}</span><span class="lt" data-on="${esc(lOn)}" data-off="${esc(lOff)}">${esc(on ? lOn : lOff)}</span><span class="rt">${on ? IC.ok(22) : IC.off(22)}</span></button>`;
  }
  if (c.kind === 'type') return `<select class="inp" id="${id}"><option value="">${esc(t('opt_none'))}</option>${['manuscript', 'printed'].map(k => `<option value="${k}" ${v === k ? 'selected' : ''}>${esc(t('type_' + k))}</option>`).join('')}</select>`;
  if (c.kind === 'list') return `<select class="inp" id="${id}"><option value="">${esc(t('opt_none'))}</option>${(c.opts || []).concat(v && !(c.opts || []).includes(v) ? [v] : []).map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  // a value that is not a valid ISO date (old import, typed elsewhere) is shown as text: a date input would show it empty and saving would erase it
  if (c.kind === 'date') return v === '' || isIsoDate(v) ? `<input class="inp" id="${id}" type="date" value="${esc(v)}">` : `<input class="inp" id="${id}" autocomplete="off" value="${esc(v)}">`;
  if (c.kind === 'number') return `<input class="inp" id="${id}" inputmode="decimal" autocomplete="off" value="${esc(typeof v === 'number' ? String(v).replace('.', LANG === 'en' ? '.' : ',') : v)}">`;
  return `<input class="inp" id="${id}" autocomplete="off" value="${esc(v)}">`;
}
function bindCheckButtons(root) {
  $$('[data-check]', root).forEach(b => b.onclick = () => {
    const on = b.dataset.check !== '1'; b.dataset.check = on ? 1 : 0;
    b.className = 'scanrow ' + (on ? 'on' : 'off');
    $('.bx', b).innerHTML = on ? IC.ok(16) : ''; $('.rt', b).innerHTML = on ? IC.ok(22) : IC.off(22);
    const lt = $('.lt', b); if (lt) lt.textContent = on ? lt.dataset.on : lt.dataset.off;
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
// card field order is fixed (independent of the table column order)
function cardCols() {
  const vis = visibleCols(); const by = {}; for (const c of vis) by[c.key] = c;
  const HEAD = ['id', 'inv', 'title', 'author', 'lang', 'date', 'type', 'pages', 'loc'], TAIL = ['scanned', 'restored'];
  const out = []; for (const k of HEAD) if (by[k]) out.push(by[k]);
  for (const c of vis) if (!HEAD.includes(c.key) && !TAIL.includes(c.key)) out.push(c);
  for (const k of TAIL) if (by[k]) out.push(by[k]);
  return out;
}
const cardTitleOf = (isNew, type) => t((isNew ? 'card_new' : 'card_title') + (type === 'manuscript' || type === 'printed' ? '_' + type : ''));
async function addRecord() {
  const v = await ask({ title: t('add_what'), sheet: true, buttons: [{ label: t('type_manuscript'), v: 'manuscript', cls: 'b1' }, { label: t('type_printed'), v: 'printed', cls: 'b1' }, { label: t('btn_cancel'), v: null, cls: 'b2' }] });
  if (v) openCard(null, undefined, false, v);
}
function cardDefaults() {
  const live = liveRecords(); if (!live.length) return {};
  const last = live.reduce((a, b) => (b.created > a.created ? b : a));
  const vals = {}; const ni = nextInv(last.inv); if (ni) vals.inv = ni;
  if (last.lang) vals.lang = last.lang; if (last.loc) vals.loc = last.loc;
  return vals;
}

// ---------- "storage place" (loc): custom dropdown instead of the native <datalist> ----------
// The Electron datalist popup shows ~20 entries and does not scroll (values like DVD-77 were unreachable).
// Empty field: the 3 most recently used places, newest first. Typing: ALL matching places (same
// normalisation as the main search), virtualised so thousands of values scroll without lag. Free text stays allowed.
// Same dropdown for storage place, language and author. Empty field: place / language show the 3 most recently
// used values (newest first), author shows nothing until the user types.
const COMBO_RECENT = { loc: 3, lang: 3, author: 0 };
const _cIdx = {};
function comboIndex(key) {
  const c = _cIdx[key]; if (c && c.rev === DB.rev) return c;
  const last = new Map(); // value -> latest time a live record with it was created / edited
  for (const r of DB.records) {
    if (!isLive(r)) continue;
    const v = String(r[key] ?? '').trim(); if (!v) continue;
    const at = Math.max(r.ts || 0, r.created || 0);
    if (!(last.get(v) >= at)) last.set(v, at);
  }
  const items = [...last].map(([v, at]) => ({ v, at, n: norm(v) }));
  const recent = items.slice().sort((a, b) => b.at - a.at).slice(0, COMBO_RECENT[key] || 0).map(x => x.v);
  const coll = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }); // DVD-9 before DVD-10
  items.sort((a, b) => coll.compare(a.v, b.v));
  return (_cIdx[key] = { rev: DB.rev, items, recent });
}
function comboMatches(key, q) {
  const I = comboIndex(key), toks = norm(q).split(' ').filter(Boolean);
  if (!toks.length) return I.recent;
  const pre = [], rest = []; // values starting with the typed text first, then the other matches
  for (const x of I.items) if (toks.every(k => x.n.includes(k))) (x.n.startsWith(toks[0]) ? pre : rest).push(x.v);
  return pre.concat(rest);
}
const locMatches = q => comboMatches('loc', q); // kept for the tests
function bindCombo(root, key) {
  const inp = $('#f_' + key, root); if (!inp) return;
  const wrap = inp.parentElement; wrap.classList.add('combo');
  const box = document.createElement('div'); box.className = 'combo-list hidden'; box.id = 'f_' + key + '_list'; box.setAttribute('role', 'listbox');
  const sizer = document.createElement('div'); sizer.className = 'combo-sizer'; box.appendChild(sizer); wrap.appendChild(box);
  inp.setAttribute('role', 'combobox'); inp.setAttribute('aria-autocomplete', 'list'); inp.setAttribute('aria-controls', box.id); inp.setAttribute('aria-expanded', 'false');
  // list[0] is the best / newest match. Opening upward shows it NEAREST to the field (reversed visually).
  let list = [], hi = -1, open = false, R = 44, muted = false, raf = 0, up = false;
  const rowH = () => Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize) * 2.75); // 44px phone, ~38px PC
  const topOf = i => (up ? list.length - 1 - i : i) * R;
  // only the rows in view exist in the DOM
  const render = () => {
    raf = 0; if (!open) return;
    const n = list.length, vis = Math.floor(box.scrollTop / R), cnt = Math.ceil((box.clientHeight || 300) / R) + 8;
    let lo = Math.max(0, vis - 4), hiI = Math.min(n, lo + cnt);
    let h = ''; for (let k = lo; k < hiI; k++) { const i = up ? n - 1 - k : k; h += `<div class="combo-it${i === hi ? ' on' : ''}" role="option" data-i="${i}" style="top:${k * R}px;height:${R}px">${esc(list[i])}</div>`; }
    sizer.innerHTML = h;
  };
  // below the field, or above it when there is no room below (landscape phone, keyboard open, bottom of the card)
  const place = () => {
    const sc = inp.closest('.cardbody') || document.documentElement, ir = inp.getBoundingClientRect(), sr = sc.getBoundingClientRect();
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const below = Math.min(sr.bottom, vh) - ir.bottom - 8, above = ir.top - Math.max(sr.top, 0) - (ir.top - wrap.getBoundingClientRect().top) - 8;
    const want = Math.min(list.length, 6.5) * R; // half a row peeks out: the list visibly scrolls
    const wasUp = up; up = below < Math.min(want, R * 3.5) && above > below;
    box.classList.toggle('up', up);
    box.style.maxHeight = Math.max(R * 2, Math.min(want, up ? above : below)) + 'px';
    if (up !== wasUp || !open) box.scrollTop = up ? box.scrollHeight : 0;
  };
  const card = inp.closest('.cardbody');
  const hide = () => { if (!open) return; open = false; hi = -1; box.classList.add('hidden'); inp.setAttribute('aria-expanded', 'false'); if (card) card.classList.remove('combo-room'); };
  // not enough room under the field (landscape phone, open keyboard): scroll the card so the field sits at its top
  const makeRoom = () => {
    if (!card) return;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight, sr = card.getBoundingClientRect();
    const below = Math.min(sr.bottom, vh) - inp.getBoundingClientRect().bottom - 8;
    if (below >= Math.min(list.length, 4.5) * R) return;
    card.classList.add('combo-room'); // temporary bottom padding so the card can scroll that far
    card.scrollTop += wrap.getBoundingClientRect().top - sr.top - 4;
  };
  const show = () => {
    list = comboMatches(key, inp.value); hi = -1;
    if (!list.length) return hide();
    box.scrollTop = 0; R = rowH(); sizer.style.height = list.length * R + 'px';
    box.classList.remove('hidden'); open = true; inp.setAttribute('aria-expanded', 'true');
    makeRoom(); place(); render();
  };
  const pick = v => { inp.value = v; hide(); muted = true; inp.dispatchEvent(new Event('input', { bubbles: true })); muted = false; }; // input event: dirty check + duplicate check
  const seeHi = () => { const top = topOf(hi); if (top < box.scrollTop) box.scrollTop = top; else if (top + R > box.scrollTop + box.clientHeight) box.scrollTop = top + R - box.clientHeight; render(); };
  // arriving with the arrow keys (card navigation) keeps the list closed; mouse / Tab / touch open it
  inp.addEventListener('focus', () => { if (inp._quiet) { inp._quiet = false; return; } show(); });
  inp.addEventListener('input', () => { if (!muted) show(); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { if (open && hi >= 0) { e.preventDefault(); e.stopPropagation(); pick(list[hi]); } else if (!open) { e.preventDefault(); show(); } else e.preventDefault(); }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); e.stopPropagation(); hide(); } } // close the list, not the card
    else if (e.key === 'Tab') hide();
    else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && open) {
      e.preventDefault(); e.stopPropagation();
      const d = (e.key === 'ArrowDown' ? 1 : -1) * (up ? -1 : 1); // visually down = towards the field when the list is above
      hi = hi < 0 ? (d > 0 || up ? 0 : list.length - 1) : Math.max(0, Math.min(list.length - 1, hi + d)); seeHi();
    }
  });
  box.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(render); }, { passive: true });
  box.addEventListener('mousedown', e => e.preventDefault()); // mouse: keep the focus (and caret) in the field
  box.addEventListener('click', e => { const it = e.target.closest('[data-i]'); if (it) pick(list[+it.dataset.i]); }); // no click after a touch scroll
  // outside tap / click, or focus moving to another field, closes it; listeners go away with the card
  const alive = () => document.body.contains(inp);
  const outside = e => { if (!alive()) return off(); if (open && !wrap.contains(e.target)) hide(); };
  const focusIn = e => { if (!alive()) return off(); if (open && e.target !== inp && !box.contains(e.target)) hide(); };
  const relayout = () => { if (!alive()) return off(); if (open) { place(); render(); } };
  const off = () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('focusin', focusIn); window.removeEventListener('resize', relayout); if (window.visualViewport) window.visualViewport.removeEventListener('resize', relayout); };
  document.addEventListener('pointerdown', outside, true); document.addEventListener('focusin', focusIn);
  window.addEventListener('resize', relayout); if (window.visualViewport) window.visualViewport.addEventListener('resize', relayout);
}
const bindCombos = root => ['loc', 'lang', 'author'].forEach(k => bindCombo(root, k));
async function openCard(uuid, draftVals, silentRerender, presetType) {
  if (UI.card && !silentRerender) {
    if (UI.card.uuid === uuid && !!uuid) return;
    const ok = await confirmLeaveCard(); if (!ok) return;
  }
  const isNew = !uuid; const rec = uuid ? byUuid().get(uuid) : null;
  const host = $('#cardhost'); if (!host) return;
  const base = rec ? Object.fromEntries(Object.keys(rec).map(k => [k, rec[k]])) : { scanned: false, ...cardDefaults(), ...(presetType ? { type: presetType } : {}) };
  const vals = base;
  const wasOpen = !!UI.card;
  UI.card = { uuid: uuid || null, isNew, init: null, rec, preset: presetType || '' };
  const cols = cardCols();
  const body = cols.map(c => {
    if (c.kind === 'id') return '';
    const half = ['type', 'pages', 'lang', 'date'].includes(c.key) || (!c.b && ['number', 'date', 'list'].includes(c.kind));
    const lbl = c.kind === 'check' ? '' : `<div class="lbl">${esc(colName(c, true))}</div>`;
    let inner = lbl + fieldInputHtml(c, vals[c.key], 'f_' + c.key) + (c.key === 'inv' ? '<div class="ferr hidden" id="invErr"></div>' : '');
    if (c.key === 'inv') {
      return `<div style="display:flex;gap:10px;flex:1 1 100%"><div class="fld" style="flex:0 0 72px"><div class="lbl">${t('col_id')}</div><input class="inp ro" disabled value="${isNew ? '' : (rec.id)}"></div><div class="fld" style="flex:1">${inner}</div></div>`;
    }
    return `<div class="fld ${half ? 'half' : ''}">${inner}</div>`;
  }).join('');
  host.innerHTML = `<div class="cardhead"><button class="ib backb" id="cBack">${IC.close}</button><h3 id="cTitle">${cardTitleOf(isNew, vals.type)}</h3>${!isNew ? `<button class="ib lamp${rec && rec.pin ? ' on' : ''}" id="cPin" aria-pressed="${rec && rec.pin ? 'true' : 'false'}" aria-label="${esc(t(rec && rec.pin ? 'pin_off' : 'pin_on'))}">${IC.lamp(22)}</button><button class="ib" id="cDel" aria-label="${esc(t('btn_delete'))}">${IC.trash}</button>` : ''}<button class="ib only-wide" id="cX" aria-label="${esc(t('close'))}">${IC.close}</button></div>
    <div class="cardbody" id="cBody">${body}<div class="warn hidden" id="dupWarn">${IC.warn}<span></span></div>${isNew ? '' : cardRepsHtml(rec)}</div>
    <div class="actions${isNew ? '' : ' nav'}"><!-- no Cancel: the cross (and X on PC) already leaves the card -->${isNew ? `<button class="btn b2" id="cNext">${t('card_save_next')}</button>` : `<button class="navb" id="cPrev" aria-label="${esc(t('card_prev'))}">${IC.prev}</button>`}<button class="btn b1" id="cSave">${t('btn_save')}</button>${isNew ? '' : `<button class="navb" id="cNxt" aria-label="${esc(t('card_next'))}">${IC.next}</button>`}</div>`;
  if (!wasOpen && window.cardSheetReset) cardSheetReset(host);
  host.classList.add('on'); $('#shell').classList.add('hascard');
  bindCheckButtons(host); bindCombos(host); bindCardReps(host);
  UI.card.init = JSON.stringify(readCard());
  if (draftVals) applyCardVals(draftVals);
  { const tt = $('#f_type', host); if (tt) tt.addEventListener('change', () => { $('#cTitle').textContent = cardTitleOf(UI.card.isNew, tt.value); }); }
  if ($('#cPin')) $('#cPin').onclick = () => togglePin();
  host.classList.toggle('pinned', !!(rec && rec.pin));
  $('#cBack').onclick = () => history.back();
  $('#cX').onclick = () => closeCard(false);
  $('#cSave').onclick = () => saveCard(false);
  if ($('#cPrev')) { $('#cPrev').onclick = () => cardNav(-1); $('#cNxt').onclick = () => cardNav(1); updateCardNav(); }
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
  const host = $('#cardhost');
  if (host) {
    host.classList.remove('on'); if (!host.dataset.swiped) { host.style.animation = ''; host.style.transform = ''; host.style.transition = ''; }
    if (animLevel() >= 2 && host.firstChild && !host.dataset.swiped) { // slide out; the content is cleared when it is over (unless another card was opened meanwhile)
      host.classList.add('closing'); clearTimeout(UI._cct);
      UI._cct = setTimeout(() => { host.classList.remove('closing'); if (!UI.card) host.innerHTML = ''; }, 190);
    } else { host.classList.remove('closing'); host.innerHTML = ''; }
  }
  const sh = $('#shell'); if (sh) sh.classList.remove('hascard');
  refreshListRowsOnly();
}
// lamp in the card header: pin / unpin the open record at once (independent of the Save button; shared by sync)
function togglePin() {
  const c = UI.card; if (!c || c.isNew || !c.rec) return;
  const rec = byUuid().get(c.uuid) || c.rec, on = !rec.pin; updateRecord(rec, { pin: on }); c.rec = rec;
  const b = $('#cPin'); if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', t(on ? 'pin_off' : 'pin_on')); }
  const h = $('#cardhost'); if (h) h.classList.toggle('pinned', on);
  if (on && b && animLevel() >= 3) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); }
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
  vals.inv = inv; if (UI.card.isNew && UI.card.preset && vals.type === undefined) vals.type = UI.card.preset;
  if (UI.card.isNew) { UI.card.rec = newRecord(vals); UI.card.isNew = false; UI.card.uuid = UI.card.rec.uuid; }
  else {
    // write only the fields the user changed in this card: a sync that arrived while the card was open
    // may have updated other fields, and the stale values still shown in the card must not overwrite them
    const init = JSON.parse(UI.card.init || '{}'), upd = {};
    for (const k of Object.keys(vals)) if (JSON.stringify(vals[k]) !== JSON.stringify(init[k])) upd[k] = vals[k];
    const rec = byUuid().get(UI.card.uuid) || UI.card.rec; UI.card.rec = rec;
    if (Object.keys(upd).length) updateRecord(rec, upd);
  }
  UI.card.init = JSON.stringify(readCard());
  toast(t('toast_saved'), 1200);
  return true;
}
async function saveCard(next) {
  const wasNew = !!(UI.card && UI.card.isNew);
  if (!saveCardCore()) return false;
  const newUuid = UI.card.uuid;
  const pre = (UI.card.rec && UI.card.rec.type) || UI.card.preset || '';
  const l = UI.card.layer; closeCardUI(); if (l) await dropLayer(l);
  if (next) openCard(null, undefined, false, pre);
  else if (wasNew) revealRecord(newUuid);
  return true;
}
// bring list row i into view (centred when `centre` and it was off-screen); the virtual list re-renders itself on scroll
function scrollToIndex(i, centre) {
  const tw = $('#tw'), rows = $('#rows'); if (!tw || !rows) return;
  const rh = UI.vr.rh, rowsTop = rows.getBoundingClientRect().top - tw.getBoundingClientRect().top + tw.scrollTop, vh = tw.clientHeight;
  const hh = ($('#th') || {}).offsetHeight || 0, y = rowsTop + i * rh;
  if (y < tw.scrollTop + hh) tw.scrollTop = Math.max(0, centre ? y - Math.max(0, (vh - rh) / 2) : y - hh);
  else if (y + rh > tw.scrollTop + vh) tw.scrollTop = centre ? y - Math.max(0, (vh - rh) / 2) : y + rh - vh;
  renderWindow(true);
}
// after a new record is saved: scroll the list to it and flash its row (the order is the chosen sort; ID never changes)
function revealRecord(uuid) {
  const tw = $('#tw'); if (!tw || UI.route !== 'books') return;
  let l = computeList(), i = l.findIndex(r => r.uuid === uuid);
  if (i < 0) { UI.q = ''; UI.filter = 'all'; UI.colf = {}; const q = $('#q'); if (q) q.value = ''; renderChips(); refreshList(); l = UI.list; i = l.findIndex(r => r.uuid === uuid); if (i < 0) return; }
  const v = UI.vr; scrollToIndex(i, true);
  UI.hlU = uuid; v.from = -1; renderWindow(true);
  setTimeout(() => { if (UI.hlU === uuid) { UI.hlU = null; v.from = -1; renderWindow(true); } }, 2300);
}

async function doLock() {
  if (!Auth.hasPin()) { await flushSave(); return; }
  if (UI.card && cardDirty()) DB.draft = { uuid: UI.card.uuid, isNew: UI.card.isNew, vals: readCard() };
  else DB.draft = null;
  // where the person was (screen, search, filters, report folder/month, scroll): kept in memory only and restored after the PIN
  const tw = $('#tw');
  UI.lockState = { route: UI.route, q: UI.q, filter: UI.filter, colf: Object.assign({}, UI.colf || {}), rep: UI.rep ? Object.assign({}, UI.rep) : null, scroll: tw ? tw.scrollTop : 0 };
  await Auth.lockNow();
  UI.card = null; UI.sel.clear(); UI.selMode = false; UI.route = 'books'; UI.q = ''; UI.filter = 'all'; UI.colf = {}; UI.listKey = ''; UI.layers = []; UI.routeLayer = null;
  document.querySelectorAll('.mb').forEach(e => e.remove());
  showLock();
}

function autoBio() { if (document.hidden) return; UI.bioPending = false; const b = $('#bio'); if (b) b.click(); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && UI.bioPending) setTimeout(autoBio, 350); });

// previous / next record of the list the card was opened from (same search, filters and order)
function cardNeighbour(dir) { if (!UI.card || UI.card.isNew) return null; const l = computeList(), i = l.findIndex(r => r.uuid === UI.card.uuid); const r = i < 0 ? null : l[i + dir]; return r || null; }
function updateCardNav() { const p = $('#cPrev'), n = $('#cNxt'); if (p) p.classList.toggle('dis', !cardNeighbour(-1)); if (n) n.classList.toggle('dis', !cardNeighbour(1)); }
async function cardNav(dir) {
  const r = cardNeighbour(dir); if (!r) return;
  await openCard(r.uuid); // asks "save changes?" itself when the card was edited
  if (UI.card && UI.card.uuid === r.uuid) { const l = computeList(), i = l.findIndex(x => x.uuid === r.uuid); if (i >= 0 && UI.route === 'books') scrollToIndex(i, false); const b = $('#cBody'); if (b) b.scrollTop = 0; }
}
