'use strict';
/* Gazna — statistics screen, in-table cell editing (PC), hotkeys (PC) */

// ---------- statistics ----------
function statsTop(key, n) {
  const m = new Map();
  for (const r of DB.records) if (isLive(r)) { const v = String(r[key] ?? '').trim(); if (v) m.set(v, (m.get(v) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}
function statsBlock(title, rows, total) {
  if (!rows.length) return '';
  const mx = Math.max(...rows.map(r => r[1]));
  return `<div class="group" style="margin:10px 12px"><div class="setrow col"><div class="tt">${esc(title)}</div>${rows.map(([k, n]) => `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;gap:10px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(k)}</span><span class="ss">${n}${total ? ` · ${(n * 100 / total).toFixed(1).replace('.', LANG === 'en' ? '.' : ',')}%` : ''}</span></div><div style="height:6px;border-radius:3px;background:var(--chip);margin-top:3px"><div style="height:6px;border-radius:3px;background:var(--accent);width:${Math.max(2, n * 100 / mx)}%"></div></div></div>`).join('')}</div></div>`;
}
function viewStats(main) {
  const c = counts(); const live = DB.records.filter(isLive);
  const pct = n => c.total ? (n * 100 / c.total).toFixed(1).replace('.', LANG === 'en' ? '.' : ',') + '%' : '–';
  let pages = 0, pn = 0; for (const r of live) { const v = typeof r.pages === 'number' ? r.pages : parseNum(String(r.pages ?? '')); if (typeof v === 'number' && isFinite(v)) { pages += v; pn++; } }
  const card = (l, v, s, ctr) => `<div style="flex:1 1 140px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:12px 14px${ctr ? ';text-align:center' : ''}"><div class="ss">${esc(l)}</div><div style="font-size:1.5rem;font-weight:700;margin-top:2px">${v}</div>${s ? `<div class="ss">${s}</div>` : ''}</div>`;
  const row = (...cs) => `<div style="display:flex;gap:10px;margin:10px 12px 0">${cs.join('')}</div>`;
  const types = ['manuscript', 'printed'].map(k => [t('type_' + k), live.filter(r => r.type === k).length]).filter(x => x[1]);
  const noType = live.filter(r => !r.type).length; if (noType) types.push([t('st_notype'), noType]);
  const body = `${row(card(t('st_total'), c.total, '', true))}
    ${row(card(t('st_scanned'), c.scanned, pct(c.scanned)), card(t('st_notscanned'), c.total - c.scanned, pct(c.total - c.scanned)))}
    ${H.rest ? row(card(t('st_rest'), c.rest, pct(c.rest)), card(t('st_notrest'), c.total - c.rest, pct(c.total - c.rest))) : ''}
    ${row(card(t('st_pages'), fmtNum(pages)), card(t('st_trash'), DB.records.filter(r => r.del && !r.purged).length))}
    ${statsBlock(t('st_types'), types, c.total)}${statsBlock(t('st_langs'), statsTop('lang', 10), c.total)}${statsBlock(t('st_locs'), statsTop('loc', 10), c.total)}${statsBlock(t('st_authors'), statsTop('author', 10), c.total)}`;
  pageShell(main, t('nav_stats'), body);
}

// ---------- hotkeys ----------
// By PHYSICAL key (e.code): they work on any keyboard layout (Russian, Turkmen ...) and at any window width.
document.addEventListener('keydown', e => {
  if (!DB.unlocked || document.querySelector('.lockscr')) return;
  if (document.querySelector('.mb')) return; // a dialog is open: it owns the keys
  const ae = document.activeElement || {}, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName || '');
  const ctrl = (e.ctrlKey || e.metaKey) && !e.altKey, code = e.code;
  const inCard = !!(ae.closest && ae.closest('#cardhost'));
  const toSearch = sel => { if (UI.route !== 'books') goRoute('books'); setTimeout(() => { const q = $('#q'); if (q) { q.focus(); if (sel) q.select(); } }, 30); };
  if (ctrl && code === 'KeyF') { e.preventDefault(); toSearch(true); }
  else if (ctrl && code === 'KeyN') { e.preventDefault(); addRecord(); }
  else if (ctrl && (code === 'KeyS' || code === 'Enter' || code === 'NumpadEnter') && UI.card) { e.preventDefault(); saveCard(false); }
  else if (ctrl && code === 'KeyL') { e.preventDefault(); doLock(); }
  else if (ctrl && code === 'KeyD') { e.preventDefault(); if (UI.card && !UI.card.isNew) togglePin(); }
  else if (ctrl && code === 'KeyB') { e.preventDefault(); if (typeof toggleSide === 'function') toggleSide(); }
  else if (e.altKey && !ctrl && (code === 'ArrowDown' || code === 'ArrowUp') && UI.card && !UI.card.isNew) {
    e.preventDefault(); const l = computeList(), i = l.findIndex(r => r.uuid === UI.card.uuid), n = l[i + (code === 'ArrowDown' ? 1 : -1)];
    if (n) { scrollToIndex(i + (code === 'ArrowDown' ? 1 : -1), false); openCard(n.uuid); }
  }
  else if (code === 'Escape' && UI.route === 'reports' && UI.rep.sel && !$('.modal') && !typing) { e.preventDefault(); history.back(); }
  else if (code === 'Escape' && UI.card && (!typing || inCard)) { e.preventDefault(); closeCard(false); }
  else if (code === 'Slash' && !e.shiftKey && !typing && !ctrl && !e.altKey) { e.preventDefault(); toSearch(false); }
});
