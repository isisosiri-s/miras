'use strict';
/* Miras — statistics screen, in-table cell editing (PC), hotkeys (PC) */

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

// ---------- editing cells by double click (wide screens) ----------
function bindCellEdit() {
  const rows = $('#rows'); if (!rows || rows._ce) return; rows._ce = 1;
  rows.addEventListener('dblclick', e => {
    if (!isWide()) return;
    const sp = e.target.closest('.tr > span'); const tr = e.target.closest('.tr'); if (!sp || !tr || sp.dataset.cb) return;
    const r = byUuid().get(tr.dataset.u); if (!r) return;
    const cols = UI.vr.cols || tableCols(); const off = tr.querySelector('[data-cb]') ? 1 : 0;
    const c = cols[[...tr.children].indexOf(sp) - off]; if (!c || c.kind === 'id') return;
    if (c.kind === 'check') { updateRecord(r, { [c.key]: !r[c.key] }); refreshList(); return; }
    startCellEdit(sp, r, c);
  });
}
function startCellEdit(sp, r, c) {
  const raw = r[c.key] ?? ''; let el;
  if (c.kind === 'type' || c.kind === 'list') {
    const opts = c.kind === 'type' ? [['', t('opt_none')], ['manuscript', t('type_manuscript')], ['printed', t('type_printed')]] : [['', t('opt_none')], ...(c.opts || []).map(o => [o, o])];
    el = document.createElement('select'); el.innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}" ${raw === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
  } else { el = document.createElement('input'); el.type = c.kind === 'date' ? 'date' : 'text'; el.value = c.kind === 'number' && typeof raw === 'number' ? String(raw).replace('.', LANG === 'en' ? '.' : ',') : raw; }
  el.className = 'inp'; el.style.cssText = 'width:100%;height:100%;box-sizing:border-box;margin:0;padding:2px 6px;font-size:inherit';
  sp.innerHTML = ''; sp.appendChild(el); el.focus(); if (el.select && el.tagName === 'INPUT') el.select();
  let done = false;
  const finish = ok => {
    if (done) return; done = true;
    if (ok) {
      let v = el.value.trim(); if (c.kind === 'number') { if (v === '') v = ''; else { const n = parseNum(v); v = n === null ? v : n; } }
      if (v !== raw) updateRecord(r, { [c.key]: v });
    }
    refreshList();
  };
  el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); finish(false); } });
  el.addEventListener('blur', () => finish(true));
  el.addEventListener('click', e => e.stopPropagation());
  el.addEventListener('dblclick', e => e.stopPropagation());
}

// ---------- hotkeys (PC) ----------
document.addEventListener('keydown', e => {
  if (!DB.unlocked || !isWide() || document.querySelector('.mb, .lockscr')) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
  const k = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && k === 'f') { e.preventDefault(); if (UI.route !== 'books') goRoute('books'); setTimeout(() => { const q = $('#q'); if (q) { q.focus(); q.select(); } }, 30); }
  else if (ctrl && k === 'n') { e.preventDefault(); addRecord(); }
  else if (ctrl && k === 's' && UI.card) { e.preventDefault(); saveCard(false); }
  else if (ctrl && k === 'l') { e.preventDefault(); doLock(); }
  else if (e.key === 'Escape' && UI.route === 'reports' && UI.rep.sel && !$('.modal') && !typing) { e.preventDefault(); history.back(); }
  else if (e.key === 'Escape' && UI.card && !typing) { e.preventDefault(); closeCard(false); }
  else if (k === '/' && !typing && !ctrl) { e.preventDefault(); if (UI.route !== 'books') goRoute('books'); setTimeout(() => { const q = $('#q'); if (q) q.focus(); }, 30); }
});
