// ===== Gazna 1.3 redesign layer: icons, strings, menu drawer, hints, font guard, column-filter list =====
Object.assign(IC, {
  backup: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  up: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg>',
  down: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5.5 12.5L12 19l6.5-6.5"/></svg>',
  recent: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>',
  funnel: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/></svg>',
  moon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.500z"/></svg>',
  sun: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/></svg>',
  prev: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  help: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.500"/><path d="M9.500 9.500a2.600 2.600 0 1 1 3.800 2.300c-.9.5-1.300 1-1.300 2M12 17.200v.1"/></svg>',
  all: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M19 19v2H6"/></svg>',
});
{
  const S = {
    ru: { search_ph: 'Поиск', menu_btn: 'Меню', nav_backup: 'Резервная копия', nav_all: 'Все записи', flt_title: 'Фильтры колонок', flt_reset: 'Сбросить всё', set_scan: 'Скан', set_scan_sub: 'Галочка в карточке, колонка в списке и в Excel',
      set_scanui: 'Фильтры и счётчик сканирования', set_scanui_sub: 'Блоки «Есть скан / Нет скана» и счётчик в списке', set_rest: 'Реставрация', set_restui_sub: 'Блоки «Реставрирован / Не реставрирован» и счётчик в списке',
      set_g_look: 'Внешний вид', set_g_list: 'Список', set_g_sec: 'Безопасность', set_g_data: 'Данные', set_g_about: 'О приложении',
      st_scanned_lbl: 'со сканом', trash_restore_all: 'Восстановить все', sel_edit: 'Изменить', card_prev: 'Предыдущая запись', card_next: 'Следующая запись', trash_sel: 'Выбрано: {n}', theme_switch: 'Сменить тему' },
    tk: { search_ph: 'Gözleg', menu_btn: 'Menýu', nav_backup: 'Ätiýaçlyk nusga', nav_all: 'Ähli ýazgylar', flt_title: 'Sütün süzgüçleri', flt_reset: 'Hemmesini arassala', set_scan: 'Skan', set_scan_sub: 'Kartoçkada bellik, sanawda we Excel-de sütün',
      set_scanui: 'Skan: süzgüçler we sanawy', set_scanui_sub: 'Sanawda «Skan bar / Skan ýok» bloklary we sanawy', set_rest: 'Rejeleme', set_restui: 'Rejeleme: süzgüçler we sanawy', set_restui_sub: 'Sanawda «Rejelenen / Rejelenmedik» bloklary we sanawy',
      set_g_look: 'Daşky görnüş', set_g_list: 'Sanaw', set_g_sec: 'Howpsuzlyk', set_g_data: 'Maglumatlar', set_g_about: 'Programma barada',
      st_scanned_lbl: 'skanly', trash_restore_all: 'Hemmesini dikelt', sel_edit: 'Üýtget', card_prev: 'Öňki ýazgy', card_next: 'Indiki ýazgy', trash_sel: 'Saýlanan: {n}', theme_switch: 'Temany üýtget' },
    en: { search_ph: 'Search', menu_btn: 'Menu', nav_backup: 'Backup', nav_all: 'All records', flt_title: 'Column filters', flt_reset: 'Reset all', set_scan: 'Scan', set_scan_sub: 'Checkbox in the record, column in the list and Excel',
      set_scanui: 'Scan filters and counter', set_scanui_sub: '“Scanned / Not scanned” blocks and a counter in the list', set_rest: 'Restoration', set_restui_sub: '“Restored / Not restored” blocks and a counter in the list',
      set_g_look: 'Appearance', set_g_list: 'List', set_g_sec: 'Security', set_g_data: 'Data', set_g_about: 'About',
      st_scanned_lbl: 'scanned', trash_restore_all: 'Restore all', sel_edit: 'Edit', card_prev: 'Previous record', card_next: 'Next record', trash_sel: 'Selected: {n}', theme_switch: 'Switch theme' },
  };
  for (const l in S) Object.assign(I18N[l], S[l]);
  // the menu entry for the list is "All records", not "Books"
  I18N.ru.nav_books = S.ru.nav_all; I18N.tk.nav_books = S.tk.nav_all; I18N.en.nav_books = S.en.nav_all;
}

// ---- burger menu: a drawer from the left (opens only by tapping ☰: no edge swipe, it would fight Android's back gesture) ----
async function openMenu(warm) {
  if ($('.drawer')) return;
  const trashN = DB.records.filter(r => r.del && !r.purged).length, total = counts().total;
  const items = [['books', 'nav_books', 'all', fmtInt(total)], ['trash', 'nav_trash', 'trashn', trashN ? String(trashN) : ''], ['reports', 'nav_reports', 'report', ''], ['stats', 'nav_stats', 'stats', ''], ['columns', 'nav_columns', 'cols', ''], ['ie', 'nav_import', 'imp', ''], ['backup', 'nav_backup', 'backup', ''], ['sync', 'nav_sync', 'sync', ''], ['settings', 'nav_settings', 'gear', '']];
  const wrap = document.createElement('div'); wrap.className = 'drawerwrap';
  wrap.innerHTML = `<div class="dscrim"></div><aside class="drawer" role="dialog" aria-label="${esc(t('menu_btn'))}">
    <div class="dhead"><img src="icon.svg" alt="" width="44" height="44"><b>Gazna</b><button class="themebtn" id="dTheme" aria-label="${esc(t('theme_switch'))}">${H.theme === 'dark' ? IC.sun : IC.moon}</button></div>
    <div class="dlang">${['ru', 'tk', 'en'].map(l => `<button data-l="${l}" class="${H.lang === l ? 'on' : ''}">${l.toUpperCase()}</button>`).join('')}</div>
    <nav class="ditems">${items.map(([k, lab, ic, bd], ix) => `<button class="ditem${UI.route === k ? ' on' : ''}" data-go="${k}" style="--i:${ix}">${IC[ic]}<span>${esc(t(lab))}</span>${bd ? `<em>${esc(bd)}</em>` : ''}</button>`).join('')}
    ${Auth.hasPin() ? `<button class="ditem lock" data-go="__lock" style="--i:${items.length}">${IC.lock(20)}<span>${esc(t('nav_lock'))}</span></button>` : ''}</nav></aside>`;
  document.body.appendChild(wrap);
  if (warm !== 'warm' && window.Diag) Diag.mark('menu');
  if (warm === 'warm') { wrap.style.cssText = 'visibility:hidden;pointer-events:none'; void wrap.offsetHeight; wrap.remove(); return; } // pre-warm: first real open has no style/layout cold start
  const goT = setTimeout(() => wrap.classList.add('go'), animLevel() >= 2 ? 210 : 0);
  let closed = false; const layer = { onBack: () => { shut(true); return true; } };
  const shut = fromBack => {
    if (closed) return Promise.resolve(); closed = true; clearTimeout(goT); wrap.classList.add('go', 'out');
    setTimeout(() => wrap.remove(), animLevel() >= 2 ? 200 : 0);
    if (!fromBack) return dropLayer(layer); const i = UI.layers.indexOf(layer); if (i >= 0) UI.layers.splice(i, 1); return Promise.resolve();
  };
  pushLayer(layer);
  $('.dscrim', wrap).onclick = () => shut();
  $('#dTheme', wrap).onclick = async () => {
    await window.switchTheme(H.theme === 'dark' ? 'light' : 'dark'); const tb = $('#dTheme', wrap); if (tb) tb.innerHTML = H.theme === 'dark' ? IC.sun : IC.moon;
  };
  $$('.dlang button', wrap).forEach(b => b.onclick = async () => { await shut(); setLang(b.dataset.l); });
  $$('[data-go]', wrap).forEach(b => b.onclick = async () => {
    const k = b.dataset.go; await shut();
    if (k === '__lock') doLock(); else if (k === 'books') { if (UI.route !== 'books') goRoute('books'); } else goRoute(k);
  });
  // swipe the drawer to the left to close it
  const dr = $('.drawer', wrap); let sx = null, dx = 0;
  dr.addEventListener('touchstart', e => { sx = e.touches[0].clientX; dx = 0; }, { passive: true });
  dr.addEventListener('touchmove', e => { if (sx === null) return; dx = Math.min(0, e.touches[0].clientX - sx); dr.style.transition = 'none'; dr.style.transform = `translateX(${dx}px)`; }, { passive: true });
  dr.addEventListener('touchend', () => { if (sx === null) return; sx = null; dr.style.transition = ''; if (dx < -70) shut(); else dr.style.transform = ''; }, { passive: true });
}

(function () { const w = () => { try { if (!document.querySelector('.drawer') && !UI.layers.length) openMenu('warm'); } catch (e) {} }; window.addEventListener('load', () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(w, { timeout: 4000 }) : w()), 1500)); })();

// ---- funnel chip in the search field: the list of active column filters ----
async function colFilterList() {
  const cf = UI.colf || {}, rows = Object.keys(cf).map(k => { const c = colDef(k); return c ? `<div class="fltrow"><b>${esc(colName(c))}</b><span>${esc(cf[k].map(v => v || t('empty_val')).join(', '))}</span></div>` : ''; }).join('');
  const r = await ask({ title: t('flt_title'), html: `<div class="fltlist">${rows}</div>`, buttons: [{ label: t('close'), v: null, cls: 'b2' }, { label: t('flt_reset'), v: 'reset', cls: 'bad' }] });
  if (r === 'reset') { UI.colf = {}; renderChips(); refreshList(); }
}

// ---- very narrow screen (split screen, small phones): a large font would not fit, so the whole app shows the small one; the setting itself stays ----
(function () {
  const guard = () => { const de = document.documentElement; if (H && H.font === 'l' && window.innerWidth < 340) de.dataset.font = 's'; else if (H && H.font) de.dataset.font = H.font; };
  const orig = applyPrefs; applyPrefs = function () { orig.apply(this, arguments); guard(); };
  window.addEventListener('resize', guard); guard();
})();

// ---- remember where the person was (screen, search, filters, scroll) and put them back after the PIN, also after the app was closed completely ----
(function () {
  const KEY = 'gazna.ui'; let last = '', lastScroll = 0;
  const snap = () => { const tw = $('#tw'); if (tw) lastScroll = tw.scrollTop; return { ts: Date.now(), route: UI.route, q: UI.q || '', filter: UI.filter || 'all', colf: UI.colf || {}, rep: UI.rep ? Object.assign({}, UI.rep) : null, scroll: lastScroll }; };
  const save = () => { if (typeof DB === 'undefined' || !DB.unlocked) return; try { const s = JSON.stringify(snap()); if (s !== last) { last = s; localStorage.setItem(KEY, s); } } catch (_) { } };
  window.loadSavedUi = function () {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o || Date.now() - (o.ts || 0) > 7 * 86400000) return null;
      if (!['books', 'stats', 'reports', 'trash', 'columns', 'settings', 'ie', 'backup', 'sync'].includes(o.route)) o.route = 'books';
      if (!['all', 'scanned', 'not', 'rest', 'notrest', 'recent', 'pin'].includes(o.filter)) o.filter = 'all';
      if (o.filter === 'scanned' || o.filter === 'not') { if (H.scan === false || H.scanUi === false) o.filter = 'all'; }
      if ((o.filter === 'rest' || o.filter === 'notrest') && !(H.rest && H.restUi)) o.filter = 'all';
      if (typeof o.q !== 'string') o.q = ''; if (!o.colf || typeof o.colf !== 'object') o.colf = {};
      return o;
    } catch (_) { return null; }
  };
  setInterval(save, 1500);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
})();

// keyboard open on a phone held upright: the viewport gets short and looks like a landscape phone, but the screen is still upright -> mark it, the filter tiles step aside
(() => {
  const upright = () => { try { return screen.orientation ? /portrait/.test(screen.orientation.type) : screen.height >= screen.width; } catch (e) { return true; } };
  const upd = () => document.documentElement.classList.toggle('kbopen', upright() && window.innerWidth < 900 && window.innerHeight < 520);
  window.addEventListener('resize', upd); window.addEventListener('orientationchange', () => setTimeout(upd, 200)); upd();
})();

// theme switch: a single cheap curtain layer; with minimal animations the theme just switches at once.
window.switchTheme = async th => {
  const apply = () => { H.theme = th; applyPrefs(); };
  window.Diag && Diag.mark('theme');
  if (animLevel() >= 2) {
    // one cheap layer: fade to the new background, switch under it, fade away (no snapshots, no per-element transitions)
    const c = document.createElement('div'); c.style.cssText = `position:fixed;inset:0;z-index:300;pointer-events:none;opacity:0;background:${th === 'dark' ? '#1C1712' : '#F6F1E9'};transition:opacity .16s ease-out;will-change:opacity`;
    document.body.appendChild(c); void c.offsetWidth; c.style.opacity = '1';
    await new Promise(r => setTimeout(r, 170)); const de = document.documentElement; de.classList.add('notr'); apply(); void de.offsetWidth;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); de.classList.remove('notr');
    c.style.transition = 'opacity .2s ease-in'; c.style.opacity = '0'; setTimeout(() => c.remove(), 260);
  } else apply();
  await saveHeader();
};

// ---- diagnostics: hidden frame counter (Settings -> tap the version 5 times). Shows the worst frame during menu / theme / slider.
window.Diag = (() => {
  const D = { on: false, hold: {}, until: {}, mark(n) { if (!D.on) return; const now = performance.now(); if (!(D.until[n] > now)) D.hold[n] = 0; D.until[n] = now + (n === 'rail' ? 700 : 1200); } };
  let box, last = 0, fr = [], shown = 0, raf = 0;
  const loop = now => {
    if (!D.on) return; const dt = now - last; last = now; if (dt > 0 && dt < 2000) { fr.push(dt); if (fr.length > 40) fr.shift(); for (const n in D.until) if (D.until[n] > now) D.hold[n] = Math.max(D.hold[n] || 0, dt); }
    if (now - shown > 300) { shown = now; const avg = fr.reduce((a, b) => a + b, 0) / (fr.length || 1), mx = Math.max(0, ...fr);
      box.textContent = `fps ${Math.round(1000 / (avg || 16))} · max ${Math.round(mx)}ms\n` + ['menu', 'theme', 'rail'].map(n => `${n} ${Math.round(D.hold[n] || 0)}`).join(' · '); }
    raf = requestAnimationFrame(loop);
  };
  D.set = v => {
    D.on = v; try { localStorage.setItem('gz_diag', v ? '1' : ''); } catch (e) {}
    if (v) { if (!box) { box = document.createElement('div'); box.style.cssText = 'position:fixed;right:4px;top:calc(env(safe-area-inset-top) + 4px);z-index:9999;background:rgba(0,0,0,.78);color:#7CFF7C;font:11px/1.35 monospace;padding:3px 6px;border-radius:6px;white-space:pre;pointer-events:none'; document.body.appendChild(box); } box.style.display = ''; last = performance.now(); raf = requestAnimationFrame(loop); }
    else { if (box) box.style.display = 'none'; cancelAnimationFrame(raf); }
  };
  let ok = false; try { ok = !!localStorage.getItem('gz_diag'); } catch (e) {}
  if (ok) window.addEventListener('load', () => D.set(true));
  return D;
})();

// ---- built-in smoothness test: Settings -> "Smoothness test". Walks through the app by itself and measures the worst frame of every action.
window.Bench = (() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const measure = async (fn, tail = 250) => {
    let mx = 0, bad = 0, last = performance.now(), run = true;
    const f = t => { const d = t - last; last = t; if (d < 1500) { if (d > mx) mx = d; if (d > 50) bad++; } if (run) requestAnimationFrame(f); };
    requestAnimationFrame(f); await fn(); await sleep(tail); run = false; return { mx: Math.round(mx), bad };
  };
  const swipe = async (y0, y1) => {
    const t = document.querySelector('#cBody') || document.querySelector('#cardhost'); if (!t) return;
    const mk = (type, y) => { const tt = new Touch({ identifier: 1, target: t, clientX: 200, clientY: y }); t.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [tt], changedTouches: [tt], bubbles: true, cancelable: true })); };
    mk('touchstart', y0); for (let i = 1; i <= 14; i++) { mk('touchmove', y0 + (y1 - y0) * i / 14); await sleep(16); } mk('touchend', y1); await sleep(450);
  };
  const dragRail = async (down) => {
    const r = $('#srail'), rb = UI.railBench; if (!r || !rb) return; const b = r.getBoundingClientRect(), a = b.top + 24, z = b.bottom - 24;
    rb.down(down ? a : z); for (let i = 1; i <= 36; i++) { rb.move(down ? a + (z - a) * i / 36 : z - (z - a) * i / 36); await sleep(16); } rb.up(); await sleep(650);
  };
  const run = async () => {
    if (Bench.busy) return; Bench.busy = true;
    const shield = document.createElement('div'); shield.style.cssText = 'position:fixed;inset:0;z-index:9997;background:transparent';
    const pill = document.createElement('div'); pill.style.cssText = 'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 16px);transform:translateX(-50%);z-index:9998;background:rgba(0,0,0,.82);color:#fff;font:600 14px system-ui;padding:8px 14px;border-radius:20px;white-space:nowrap';
    document.body.append(shield, pill);
    const origTheme = H.theme, res = [], steps = [];
    const S = (name, fn, tail) => steps.push([name, fn, tail]);
    S('Меню: открыть', async () => { openMenu(); await sleep(650); });
    S('Меню: закрыть', async () => { const x = $('.dscrim'); if (x) x.click(); await sleep(350); });
    S('Тема: переключить', async () => { await switchTheme(origTheme === 'dark' ? 'light' : 'dark'); await sleep(300); }, 300);
    S('Тема: вернуть', async () => { await switchTheme(origTheme); await sleep(300); }, 300);
    S('Ползунок: вниз', () => dragRail(true), 100);
    S('Ползунок: вверх', () => dragRail(false), 100);
    S('Список: быстрая прокрутка', async () => { const tw = $('#tw'); if (!tw) return; tw.scrollTop = 0; await sleep(100); for (let i = 0; i < 70; i++) { tw.scrollTop += 150; await new Promise(r => requestAnimationFrame(r)); } await sleep(250); tw.scrollTop = 0; await sleep(200); });
    S('Поиск: ввод текста', async () => { const q = $('#q'); if (!q) return; q.focus(); for (const w of ['a', 'ab', 'abd', 'abdu']) { q.value = w; q.dispatchEvent(new Event('input', { bubbles: true })); await sleep(140); } q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); q.blur(); await sleep(300); });
    S('Режим выбора', async () => { const l = UI.list || []; if (!l.length) return; UI.sel.clear(); UI.sel.add(l[3].uuid); UI.selMode = true; refreshList(); await sleep(350); clearSel(); await sleep(250); });
    S('Карточка: открыть', async () => { const l = UI.list || []; if (l.length) { openCard(l[5].uuid); await sleep(700); } });
    S('Карточка: свайп вниз', () => swipe(200, 520), 200);
    S('Карточка: свайп вверх', () => swipe(600, 200), 200);
    S('Карточка: закрыть', async () => { await closeCard(true); await sleep(400); });
    for (const r of ['stats', 'reports', 'trash', 'columns', 'settings', 'ie', 'backup', 'sync']) S('Экран: ' + r, async () => { goRoute(r); await sleep(450); }, 150);
    S('Экран: список', async () => { goRoute('books'); await sleep(450); }, 150);
    try {
      if (UI.route !== 'books') { goRoute('books'); await sleep(600); }
      const diagWas = window.Diag && Diag.on; if (diagWas) Diag.set(false);
      for (let i = 0; i < steps.length; i++) {
        pill.textContent = `Проверка ${i + 1}/${steps.length} — не трогайте экран`;
        let r; try { r = await measure(steps[i][1], steps[i][2]); } catch (e) { r = { mx: -1, bad: 0, err: String(e && e.message || e).slice(0, 60) }; }
        res.push([steps[i][0], r]);
      }
      if (diagWas) Diag.set(true);
    } finally {
      try { if (H.theme !== origTheme) await switchTheme(origTheme); } catch (e) {}
      shield.remove(); pill.remove(); Bench.busy = false;
    }
    show(res);
  };
  const show = res => {
    const col = m => m < 0 ? '#999' : m <= 33 ? '#2e9e4f' : m <= 50 ? '#d19a10' : '#cc3b2e';
    const ok = res.filter(([, r]) => r.mx >= 0 && r.mx <= 33).length, mid = res.filter(([, r]) => r.mx > 33 && r.mx <= 50).length, bad = res.filter(([, r]) => r.mx > 50).length;
    const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:9998;background:var(--bg);color:var(--text);overflow:auto;padding:calc(env(safe-area-inset-top) + 14px) 14px calc(env(safe-area-inset-bottom) + 14px)';
    const ua = (navigator.userAgent.match(/Chrome\/(\d+)/) || [])[1] || '?';
    ov.innerHTML = `<div style="font:700 1.15rem system-ui;margin-bottom:4px">Проверка плавности</div>
      <div style="font:.85rem system-ui;opacity:.8;margin-bottom:10px">Версия ${esc(APP_VERSION)} · записей ${DB.records.length} · анимации ${animLevel()} · WebView ${ua} · ${window.innerWidth}×${window.innerHeight}</div>
      <div style="font:700 1rem system-ui;margin-bottom:10px"><span style="color:#2e9e4f">● ${ok} плавно</span>  <span style="color:#d19a10">● ${mid} терпимо</span>  <span style="color:#cc3b2e">● ${bad} тормозит</span></div>
      <table style="width:100%;border-collapse:collapse;font:.92rem system-ui">${res.map(([n, r]) => `<tr style="border-bottom:1px solid var(--border)"><td style="padding:7px 4px">${esc(n)}</td><td style="padding:7px 4px;text-align:right;font-weight:700;color:${col(r.mx)}">${r.mx < 0 ? 'ошибка' : r.mx + ' мс'}</td><td style="padding:7px 4px;text-align:right;opacity:.7;width:56px">${r.bad ? '×' + r.bad : ''}</td></tr>`).join('')}</table>
      <div style="font:.78rem system-ui;opacity:.7;margin:10px 0">Число — самый тяжёлый кадр (до 33 мс плавно, до 50 терпимо). «×N» — сколько кадров дольше 50 мс.</div>
      <div style="display:flex;gap:10px"><button class="sbtn" id="bnClose" style="flex:1;height:46px">Закрыть</button><button class="sbtn" id="bnAgain" style="flex:1;height:46px">Ещё раз</button></div>`;
    document.body.appendChild(ov);
    $('#bnClose', ov).onclick = () => ov.remove();
    $('#bnAgain', ov).onclick = () => { ov.remove(); setTimeout(run, 100); };
  };
  return { run, busy: false };
})();
