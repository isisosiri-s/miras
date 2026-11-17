'use strict';
/* Miras — reports: folders (e.g. 2026) -> months -> rows. The archive is only read, never changed. */

UI.rep = { f: null, m: null, pick: null };
const REP_KINDS = ['manuscript', 'printed', 'book', 'other'];
// books and "other" are typed in by hand (no archive inventory number) and always count as scanned
const repManual = k => k === 'book' || k === 'other';
const repKindLabel = k => (repManual(k) ? t('rep_k_' + k) : t('type_' + k));
const repMonthName = n => t('rep_m' + n);
const repFolder = id => DB.reports.find(f => f.id === id);
const repMonthOf = (f, id) => (f ? f.months.find(m => m.id === id) : null);
// a sync replaces the report objects while a dialog may still hold the old ones: find the live month again
// (by id, else by folder name + month number, the same keys the merge pairs them by)
function repLiveMonth(f, m) {
  const nk = s => String(s == null ? '' : s).trim().toLowerCase();
  const lf = DB.reports.find(x => x.id === f.id) || DB.reports.find(x => nk(x.name) === nk(f.name));
  if (!lf) return null;
  return lf.months.find(x => x.id === m.id) || lf.months.find(x => x.m === m.m) || null;
}
// change stamps and delete markers: they let two devices merge reports
const repTomb = id => { DB.repTomb[id] = Date.now(); };
const repBadge = k => (k === 'printed' ? 'l' : k === 'book' ? 'b' : k === 'other' ? 'o' : '');

function repBack() {
  const R = UI.rep;
  if (R.sel) { if (R.selOff) R.selOff(); else R.sel = null; return true; }
  if (R.pick) { R.pick = null; renderRoute(); return true; }
  if (R.m) { R.m = null; renderRoute(); animRoute('routeback'); return true; }
  if (R.f) { R.f = null; renderRoute(); animRoute('routeback'); return true; }
  return false;
}
function repRerender() { const p = $('.page'), y = p ? p.scrollTop : 0; renderRoute(); const q = $('.page'); if (q) q.scrollTop = y; }
function repLeavesOf(v) { const n = typeof v === 'number' ? v : parseNum(String(v ?? '')); return typeof n === 'number' && isFinite(n) ? n : 0; }
function repRec(row) { return !repManual(row.kind) && row.inv ? findByInv(row.inv) : null; }
function repRowTitle(row) { const r = repRec(row); return (r && r.title) || row.title || ''; }
function repRowScanned(row) { if (repManual(row.kind)) return true; // books and "other" in a report always count as scanned
  const r = repRec(row); return !!(r && r.scanned); }
// totals for one month or (array) for a whole folder; books always count as scanned
function repStats(m) {
  const s = { n: 0, l: 0, sn: 0, sl: 0, rest: 0, by: { manuscript: { n: 0, l: 0 }, printed: { n: 0, l: 0 }, book: { n: 0, l: 0 }, other: { n: 0, l: 0 } } };
  for (const mo of (Array.isArray(m) ? m : [m])) for (const row of mo.rows) {
    const l = repLeavesOf(row.leaves); s.n++; s.l += l;
    const b = s.by[row.kind] || s.by.manuscript; b.n++; b.l += l;
    if (repRowScanned(row)) { s.sn++; s.sl += l; }
    const r = repRec(row); if (r && r.restored) s.rest++;
  }
  return s;
}
// inventory search ignores case, spaces, hyphens and other punctuation
const repKey = s => norm(s).replace(/[^\p{L}\p{N}]+/gu, '');
function repSearchInv(q) {
  const k = repKey(q), out = []; if (!k) return { out, more: false };
  for (const f of DB.reports) for (const m of [...f.months].sort((a, b) => b.m - a.m)) for (const row of m.rows) {
    if (repManual(row.kind) || !row.inv || !repKey(row.inv).includes(k)) continue;
    if (out.length >= 100) return { out, more: true };
    out.push({ f, m, row });
  }
  return { out, more: false };
}
function repHitsHtml(q) {
  const { out, more } = repSearchInv(q);
  if (!out.length) return `<div class="empty">${esc(t('rep_g_none'))}</div>`;
  return out.map(({ f, m, row }) => `<div class="rp-pr" data-hit="1" data-f="${f.id}" data-m="${m.id}" data-id="${row.id}"><span class="bd ${repBadge(row.kind)}">${esc(repKindLabel(row.kind).slice(0, 5).toUpperCase())}</span><div class="rp-t"><b>${esc(repRowTitle(row)) || '–'}</b><span>${esc(t('rep_inv'))} ${esc(row.inv)} · ${esc(f.name)} · ${esc(repMonthName(m.m))}</span></div><span class="sc ${repRowScanned(row) ? 'y' : 'n'}">✓</span></div>`).join('') + (more ? `<div class="rp-hint">${esc(t('rep_g_more', { n: 100 }))}</div>` : '');
}
// where else (another month) is this inventory number already listed?
function repWhere(inv, exceptMonth) {
  const k = invKey(inv); if (!k) return null;
  for (const f of DB.reports) for (const m of f.months) {
    if (exceptMonth && (m === exceptMonth || m.id === exceptMonth.id)) continue;
    if (m.rows.some(r => !repManual(r.kind) && invKey(r.inv) === k)) return `${repMonthName(m.m)} ${f.name}`;
  }
  return null;
}
const repHere = (m, inv, exceptRow) => { const k = invKey(inv); return !!k && m.rows.some(r => !(exceptRow && r.id === exceptRow.id) && !repManual(r.kind) && invKey(r.inv) === k); };

// ---------- entry point ----------
function viewReports(main) {
  const R = UI.rep;
  if (R.f && !repFolder(R.f)) { R.f = null; R.m = null; R.pick = null; }
  const f = repFolder(R.f);
  if (R.m && !repMonthOf(f, R.m)) { R.m = null; R.pick = null; }
  if (!f) return repViewFolders(main);
  const m = repMonthOf(f, R.m);
  if (!m) return repViewMonths(main, f);
  if (R.pick) return repViewPick(main, f, m);
  return repViewMonth(main, f, m);
}
function repShell(main, title, inner, addLabel, onAdd, up) {
  const right = `${up ? `<button class="sbtn only-wide" id="rpUp" aria-label="${esc(t('close'))}">${IC.back}</button>` : ''}${onAdd ? `<button class="sbtn pri only-wide" id="rpAddW">${IC.plus.replace('width="26" height="26"', 'width="18" height="18"')}${esc(addLabel)}</button>` : ''}`;
  pageShell(main, title, inner, right);
  if (onAdd) {
    main.insertAdjacentHTML('beforeend', `<button class="fab only-narrow" id="rpFab" aria-label="${esc(addLabel)}">${IC.plus}</button>`);
    $('#rpFab').onclick = onAdd; $('#rpAddW').onclick = onAdd;
  }
  if (up) $('#rpUp').onclick = () => history.back();
}
function repEnter(patch) { Object.assign(UI.rep, patch); renderRoute(); animRoute('routefwd'); const p = $('.page'); if (p) p.scrollTop = 0; }

// ---------- dialogs ----------
function repNameDlg(title, val) {
  return ask({
    title, html: `<input class="inp" id="rpName" autocomplete="off" maxlength="60" placeholder="${esc(t('rep_folder_ph'))}" value="${esc(val || '')}">`,
    buttons: [{ label: t('btn_cancel'), v: null, cls: 'b2' }, { label: t('btn_save'), cls: 'b1', check: mb => { const ok = $('#rpName', mb).value.trim(); if (!ok) $('#rpName', mb).focus(); return !!ok; }, v: mb => $('#rpName', mb).value.trim() }],
  });
}

// ---------- level 1: folders ----------
function repViewFolders(main) {
  const rows = DB.reports.map(f => {
    const n = f.months.reduce((a, m) => a + m.rows.length, 0);
    return `<div class="rp-item" data-f="${f.id}"><span class="rp-h" aria-hidden="true">⋮⋮</span><span class="rp-ic">📁</span><div class="rp-tx"><div class="n">${esc(f.name)}</div><div class="s">${f.months.length ? t('rep_folder_sub', { m: f.months.length, n }) : t('rep_empty')}</div></div><button class="rp-dots" data-fm="${f.id}" aria-label="…">⋯</button><span class="chev">${IC.chev}</span></div>`;
  }).join('');
  const R = UI.rep, hasRows = DB.reports.some(f => f.months.some(m => m.rows.length));
  const listHtml = `<div class="rp-list" id="rpFl">${rows || `<div class="empty"><b>${t('rep_empty')}</b></div>`}</div>`;
  const inner = `${hasRows ? `<div class="rp-search"><input class="inp" id="rpGQ" type="search" autocomplete="off" placeholder="${esc(t('rep_gsearch'))}" value="${esc(R.gq || '')}"></div>` : ''}<div id="rpGBody">${hasRows && R.gq ? repHitsHtml(R.gq) : listHtml}</div>`;
  repShell(main, t('nav_reports'), inner, t('rep_new_folder'), async () => {
    const name = await repNameDlg(t('rep_new_folder')); if (!name) return;
    const f = { id: uuid(), name, months: [], ts: Date.now() }; DB.reports.push(f); scheduleSave(); repEnter({ f: f.id });
  });
  const body = $('#rpGBody');
  const bindList = () => { const fl = $('#rpFl'); if (fl) repDrag(fl, '.rp-item', ids => { const by = new Map(DB.reports.map(x => [x.id, x])); const next = ids.map(i => by.get(i)).filter(Boolean); if (next.length === DB.reports.length && next.some((x, i) => x !== DB.reports[i])) { DB.reports = next; DB.repOrd = Date.now(); scheduleSave(); } }, 'f'); };
  bindList();
  const gq = $('#rpGQ');
  if (gq) { let qt; gq.oninput = () => { clearTimeout(qt); qt = setTimeout(() => { R.gq = gq.value.trim(); body.innerHTML = R.gq ? repHitsHtml(R.gq) : listHtml; bindList(); }, 150); }; }
  $('#pg').onclick = async e => {
    if (e.target.closest('.rp-h')) return;
    const hit = e.target.closest('[data-hit]');
    if (hit) { repEnter({ f: hit.dataset.f, m: hit.dataset.m, hl: hit.dataset.id }); return; }
    const d = e.target.closest('[data-fm]');
    if (d) {
      e.stopPropagation(); const f = repFolder(d.dataset.fm); if (!f) return;
      const v = await ask({ title: f.name, buttons: [{ label: t('rep_rename'), v: 'ren', cls: 'b2' }, { label: t('btn_delete'), v: 'del', cls: 'bad' }, { label: t('btn_cancel'), v: null, cls: 'bd' }] });
      if (v === 'ren') { const nm = await repNameDlg(t('rep_rename'), f.name); if (nm) { f.name = nm; f.ts = Date.now(); scheduleSave(); renderRoute(); } }
      else if (v === 'del' && await confirmDlg(t('rep_del_folder', { n: f.name }), t('btn_delete'), true)) { DB.reports = DB.reports.filter(x => x !== f); repTomb(f.id); scheduleSave(); renderRoute(); }
      return;
    }
    const it = e.target.closest('[data-f]'); if (it) repEnter({ f: it.dataset.f, m: null });
  };
}

// ---------- level 2: months of a folder ----------
function repViewMonths(main, f) {
  const ms = [...f.months].sort((a, b) => b.m - a.m);
  const rows = ms.map(m => {
    const s = repStats(m);
    return `<div class="rp-item" data-m="${m.id}"><span class="rp-ic">📂</span><div class="rp-tx"><div class="n">${esc(repMonthName(m.m))}</div><div class="s">${s.n ? REP_KINDS.filter(k => s.by[k].n).map(k => s.by[k].n + ' ' + t('rep_ab_' + k)).join(' · ') : t('rep_empty')}</div></div><button class="rp-dots" data-md="${m.id}" aria-label="…">⋯</button><span class="chev">${IC.chev}</span></div>`;
  }).join('');
  const fs = repStats(f.months), kc = k => `<div class="rp-c"><div class="l">${esc(t('rep_c_' + k))}</div><div class="v">${fs.by[k].n}</div><div class="s">${fmtNum(fs.by[k].l)} ${esc(t('rep_leaves').toLowerCase())}</div></div>`;
  const total = f.months.length ? `<div class="rp-cards">${REP_KINDS.map(kc).join('')}</div>` : '';
  repShell(main, f.name, `${total}<div class="rp-list">${rows || `<div class="empty"><b>${t('rep_empty')}</b></div>`}</div>`, t('rep_add_month'), async () => {
    const used = new Set(f.months.map(m => m.m));
    const n = await ask({
      title: t('rep_pick_month'), html: `<div class="rp-months">${Array.from({ length: 12 }, (_, i) => `<button type="button" class="rp-mo" data-mo="${i + 1}" ${used.has(i + 1) ? 'disabled' : ''}>${esc(repMonthName(i + 1))}</button>`).join('')}</div>`,
      buttons: [{ label: t('btn_cancel'), v: null, cls: 'b2' }],
      onMount: (mb, finish) => $$('[data-mo]', mb).forEach(b => b.onclick = () => finish(+b.dataset.mo)),
    });
    if (!n) return;
    const m = { id: uuid(), m: n, rows: [], ts: Date.now() }; f.months.push(m); scheduleSave(); repEnter({ m: m.id });
  }, true);
  $('#pg').onclick = async e => {
    const d = e.target.closest('[data-md]');
    if (d) {
      e.stopPropagation(); const m = repMonthOf(f, d.dataset.md); if (!m) return;
      const nm = `${repMonthName(m.m)} ${f.name}`;
      if (await confirmDlg(t('rep_del_month', { n: nm }), t('btn_delete'), true)) { f.months = f.months.filter(x => x !== m); repTomb(m.id); scheduleSave(); renderRoute(); }
      return;
    }
    const it = e.target.closest('[data-m]'); if (it) repEnter({ m: it.dataset.m });
  };
}

// ---------- level 3: the report ----------
function repRowHtml(row) {
  const rec = repRec(row), sc = repRowScanned(row), title = repRowTitle(row);
  const sub = repManual(row.kind) ? t('rep_manual') : (row.inv ? `${t('rep_inv')} ${esc(row.inv)}${rec ? '' : ` · ${t('rep_not_in_archive')}`}` : '');
  const lv = row.leaves === '' || row.leaves == null ? '–' : fmtNum(repLeavesOf(row.leaves));
  return `<div class="rp-row" data-id="${row.id}"><span class="rp-h" aria-hidden="true">⋮⋮</span><span class="chk">✓</span><span class="bd ${repBadge(row.kind)}">${esc(repKindLabel(row.kind).slice(0, 5).toUpperCase())}</span><div class="rp-t"><b>${esc(title) || '–'}</b><span>${sub}</span></div><div class="rp-q">${lv}<i>${esc(t('rep_leaves').toLowerCase())}</i></div><span class="sc ${sc ? 'y' : 'n'}">✓</span></div>`;
}
function repViewMonth(main, f, m) {
  const R = UI.rep; R.sel = null; R.selOff = null;
  const s = repStats(m);
  const card = k => `<div class="rp-c"><div class="l">${esc(t('rep_c_' + k))}</div><div class="v">${s.by[k].n}</div><div class="s">${fmtNum(s.by[k].l)} ${esc(t('rep_leaves').toLowerCase())}</div></div>`;
  const inner = `<div class="rp-cards">${REP_KINDS.map(card).join('')}</div>
    <div class="rp-tools"><button class="btn b2" id="rpSort">⇅ ${esc(t('rep_sort_type'))}</button><button class="btn b2" id="rpSel">☑ ${esc(t('rep_select'))}</button><button class="btn b1" id="rpArc">+ ${esc(t('rep_from_archive'))}</button></div>
    <div id="rpRows">${m.rows.length ? m.rows.map(repRowHtml).join('') : `<div class="empty">${esc(t('rep_list_empty'))}</div>`}</div>
    <div class="rp-bar hidden" id="rpSelBar"><button class="btn b2" id="rpSCancel">${esc(t('btn_cancel'))}</button><button class="btn b2" id="rpSAll"></button><button class="btn bad" id="rpSDel"></button></div>`;
  repShell(main, `${f.name} · ${repMonthName(m.m)}`, inner, t('rep_add'), () => repRowDlg(f, m, null), true);
  $('#rpArc').onclick = () => { UI.rep.pick = { sel: new Set(), q: '' }; renderRoute(); animRoute(); const p = $('.page'); if (p) p.scrollTop = 0; };
  $('#rpSort').onclick = () => { m.rows = m.rows.map((r, i) => [r, i]).sort((a, b) => REP_KINDS.indexOf(a[0].kind) - REP_KINDS.indexOf(b[0].kind) || a[1] - b[1]).map(x => x[0]); m.ordTs = Date.now(); scheduleSave(); repRerender(); };
  const box = $('#rpRows'), bar = $('#rpSelBar');
  // selection mode (in place, so the scroll position stays)
  const syncSel = () => {
    const on = !!R.sel;
    box.classList.toggle('sel', on); bar.classList.toggle('hidden', !on);
    const fab = $('#rpFab'); if (fab) fab.classList.toggle('hidden', on);
    const aw = $('#rpAddW'); if (aw) aw.classList.toggle('hidden', on);
    $('.rp-tools').classList.toggle('hidden', on);
    if (!on) return;
    $$('.rp-row', box).forEach(el => { const c = R.sel.has(el.dataset.id); el.classList.toggle('on', c); el.querySelector('.chk').classList.toggle('on', c); });
    $('#rpSAll').textContent = R.sel.size && R.sel.size === m.rows.length ? t('rep_sel_none') : t('rep_sel_all');
    $('#rpSDel').textContent = t('rep_del_n', { n: R.sel.size }); $('#rpSDel').disabled = !R.sel.size;
  };
  R.selOff = () => { R.sel = null; syncSel(); };
  $('#rpSel').onclick = () => { if (!m.rows.length) return; R.sel = new Set(); syncSel(); };
  $('#rpSCancel').onclick = () => history.back();
  $('#rpSAll').onclick = () => { R.sel = R.sel.size === m.rows.length ? new Set() : new Set(m.rows.map(r => r.id)); syncSel(); };
  $('#rpSDel').onclick = async () => {
    const n = R.sel.size; if (!n) return;
    if (!(await confirmDlg(t('rep_del_rows', { n }), t('btn_delete'), true))) return;
    const del = R.sel; del.forEach(repTomb); m.rows = m.rows.filter(r => !del.has(r.id)); R.sel = null; R.selOff = null; scheduleSave(); repRerender();
  };
  let lp = null, swallow = false;
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('.rp-h') || R.sel) return;
    const r = e.target.closest('.rp-row'); if (!r || Date.now() - (UI.lastScroll || 0) < 200) return;
    const x0 = e.clientX, y0 = e.clientY;
    const stop = () => { clearTimeout(lp); lp = null; box.removeEventListener('pointermove', mv); box.removeEventListener('pointerup', stop); box.removeEventListener('pointercancel', stop); };
    const mv = ev => { if (Math.abs(ev.clientX - x0) > 10 || Math.abs(ev.clientY - y0) > 10) stop(); };
    box.addEventListener('pointermove', mv); box.addEventListener('pointerup', stop); box.addEventListener('pointercancel', stop);
    lp = setTimeout(() => { stop(); if (Date.now() - (UI.lastScroll || 0) < 200) return; swallow = true; setTimeout(() => { swallow = false; }, 700); R.sel = new Set([r.dataset.id]); syncSel(); if (navigator.vibrate) try { navigator.vibrate(15); } catch (_) {} }, 450);
  });
  box.addEventListener('contextmenu', e => e.preventDefault());
  box.addEventListener('click', e => {
    if (e.target.closest('.rp-h')) return;
    if (swallow) { swallow = false; return; }
    const r = e.target.closest('.rp-row'); if (!r) return;
    if (R.sel) { const id = r.dataset.id; if (R.sel.has(id)) R.sel.delete(id); else R.sel.add(id); syncSel(); return; }
    const row = m.rows.find(x => x.id === r.dataset.id); if (row) repRowDlg(f, m, row);
  });
  repDrag(box, '.rp-row', ids => {
    const by = new Map(m.rows.map(r => [r.id, r])), next = ids.map(i => by.get(i)).filter(Boolean);
    if (next.length === m.rows.length && next.some((r, i) => r !== m.rows[i])) { m.rows = next; m.ordTs = Date.now(); scheduleSave(); }
  });
  if (R.hl) {
    const el = $(`.rp-row[data-id="${R.hl}"]`, box); R.hl = null;
    if (el) setTimeout(() => { el.scrollIntoView({ block: 'center' }); el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 2200); }, 60);
  }
}

// drag an item (row or folder) by its handle; onDone gets the new id order
function repDrag(box, sel, onDone, idKey) {
  const key = idKey || 'id';
  box.addEventListener('pointerdown', e => {
    const h = e.target.closest('.rp-h'); if (!h) return;
    const row = h.closest(sel); if (!row) return; e.preventDefault();
    h.setPointerCapture(e.pointerId); row.classList.add('drag');
    const scroller = $('.page'); let y0 = e.clientY, lastY = e.clientY, raf = 0;
    const place = () => {
      const dy = lastY - y0; row.style.transform = `translateY(${dy}px)`;
      const rect = row.getBoundingClientRect(), mid = rect.top + rect.height / 2;
      for (const o of box.querySelectorAll(sel)) {
        if (o === row) continue; const b = o.getBoundingClientRect();
        if (mid > b.top && mid < b.bottom) {
          row.style.transform = ''; const t0 = row.getBoundingClientRect().top;
          box.insertBefore(row, b.top < rect.top ? o : o.nextSibling);
          y0 += row.getBoundingClientRect().top - t0; row.style.transform = `translateY(${lastY - y0}px)`; break;
        }
      }
    };
    const loop = () => {
      raf = 0; const sr = scroller.getBoundingClientRect();
      if (lastY < sr.top + 60) scroller.scrollTop -= 10; else if (lastY > sr.bottom - 60) scroller.scrollTop += 10; else return;
      place(); raf = requestAnimationFrame(loop);
    };
    const mv = ev => { lastY = ev.clientY; place(); if (!raf) raf = requestAnimationFrame(loop); };
    const up = () => {
      h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
      cancelAnimationFrame(raf); row.classList.remove('drag'); row.style.transform = '';
      onDone([...box.querySelectorAll(sel)].map(x => x.dataset[key]));
    };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  });
}

// add / edit one row
function repRowDlg(f, m0, row) {
  // always work on the live month (a Wi-Fi sync may have replaced it while this dialog was open)
  const live = () => repLiveMonth(f, m0);
  const gone = () => { toast(t('rep_gone'), 4000); return null; };
  const st = { kind: row ? row.kind : 'manuscript', userKind: !!row, userLeaves: !!row && row.leaves !== '' };
  const html = `<div class="seg" id="rpKind">${REP_KINDS.map(k => `<button type="button" data-k="${k}" class="${k === st.kind ? 'on' : ''}">${esc(repKindLabel(k))}</button>`).join('')}</div>
    <div id="rpInvBox"><div class="lbl">${esc(t('rep_inv'))}</div><input class="inp" id="rpInv" autocomplete="off" value="${esc(row && !repManual(row.kind) ? row.inv || '' : '')}"><div class="rp-found" id="rpFound"></div></div>
    <div id="rpTitleBox"><div class="lbl">${esc(t('rep_title'))}</div><input class="inp" id="rpTitle" autocomplete="off" value="${esc(row ? row.title || '' : '')}"></div>
    <div><div class="lbl">${esc(t('rep_leaves'))}</div><input class="inp" id="rpLeaves" inputmode="decimal" autocomplete="off" value="${row && row.leaves !== '' && row.leaves != null ? esc(String(row.leaves).replace('.', LANG === 'en' ? '.' : ',')) : ''}"></div>
    <div class="group" id="rpScanBox" style="margin:0">${rowSwitch('rpScan', esc(t('rep_scanned_sw')), '', row ? !!row.scanned : false)}</div>`;
  const read = mb => {
    const inv = $('#rpInv', mb).value.trim(), title = $('#rpTitle', mb).value.trim(), lv = $('#rpLeaves', mb).value.trim();
    const n = lv === '' ? '' : parseNum(lv);
    return { kind: st.kind, inv: repManual(st.kind) ? '' : inv, title, leaves: n === null ? '' : n, scanned: repManual(st.kind) };
  };
  // validate, resolve duplicates; returns the clean values or null
  const prepare = async mb => {
    const v = read(mb);
    const m = live(); if (!m) return gone();
    if (repManual(v.kind)) { if (!v.title) { toast(t('rep_title_need')); $('#rpTitle', mb).focus(); return null; } }
    else {
      if (!v.inv) { toast(t('rep_inv_need')); $('#rpInv', mb).focus(); return null; }
      if (repHere(m, v.inv, row)) { toast(t('rep_in_this')); return null; }
      // editing a row without changing its inventory number: the user was already asked when it was added
      const sameInv = row && !repManual(row.kind) && invKey(row.inv) === invKey(v.inv);
      const where = sameInv ? null : repWhere(v.inv, m);
      if (where) {
        const ok = await ask({ title: t('rep_dup_title', { inv: v.inv }), text: t('rep_dup_text', { t: v.title || v.inv, m: where }), dismiss: false, buttons: [{ label: t('rep_add_anyway'), v: true, cls: 'b1' }, { label: t('rep_skip'), v: false, cls: 'b2' }] });
        if (!ok) return null;
      }
      const rec = findByInv(v.inv); if (rec) v.title = rec.title || v.title;
    }
    return v;
  };
  const sync = mb => {
    const k = st.kind, inv = $('#rpInv', mb).value.trim(), rec = !repManual(k) && inv ? findByInv(inv) : null;
    $$('#rpKind button', mb).forEach(b => b.classList.toggle('on', b.dataset.k === k));
    $('#rpInvBox', mb).classList.toggle('hidden', repManual(k));
    $('#rpScanBox', mb).classList.add('hidden');
    $('#rpTitleBox', mb).classList.toggle('hidden', !repManual(k) && (!!rec || !inv));
    const fd = $('#rpFound', mb);
    if (repManual(k) || !inv) fd.textContent = '';
    else if (rec) { fd.className = 'rp-found ok'; fd.textContent = `✓ ${rec.title || ''}${rec.author ? ' · ' + rec.author : ''}`; }
    else { fd.className = 'rp-found bad'; fd.textContent = t('rep_not_in_archive'); }
    if (rec) {
      if (!st.userKind && (rec.type === 'manuscript' || rec.type === 'printed') && st.kind !== rec.type) { st.kind = rec.type; $$('#rpKind button', mb).forEach(b => b.classList.toggle('on', b.dataset.k === st.kind)); }
      if (!st.userLeaves && rec.pages !== '' && rec.pages != null) $('#rpLeaves', mb).value = String(rec.pages).replace('.', LANG === 'en' ? '.' : ',');
    }
  };
  const buttons = [{ label: t('btn_cancel'), v: null, cls: 'b2' }];
  if (row) buttons.push({ label: t('btn_delete'), v: 'del', cls: 'bad' });
  else buttons.push({ label: t('rep_add_more'), cls: 'b3', keep: true, onClick: async mb => {
    const v = await prepare(mb); if (!v) return;
    const m = live(); if (!m) return gone();
    m.rows.push({ id: uuid(), ts: Date.now(), ...v }); scheduleSave(); repRerender();
    $('#rpInv', mb).value = ''; $('#rpTitle', mb).value = ''; $('#rpLeaves', mb).value = ''; st.userKind = false; st.userLeaves = false; sync(mb); $('#rpInv', mb).focus();
  } });
  buttons.push({ label: row ? t('rep_save') : t('rep_add_btn'), cls: 'b1', check: async mb => { const v = await prepare(mb); if (!v) return false; mb._v = v; return true; }, v: mb => mb._v });
  return ask({
    title: row ? t('rep_edit_row') : t('rep_add'), html, buttons,
    onMount: mb => {
      $$('#rpKind button', mb).forEach(b => b.onclick = () => { st.kind = b.dataset.k; st.userKind = true; sync(mb); });
      $('#rpInv', mb).addEventListener('input', () => sync(mb));
      $('#rpLeaves', mb).addEventListener('input', () => { st.userLeaves = true; });
      $('#rpScan', mb).onclick = () => $('#rpScan', mb).querySelector('.sw').classList.toggle('on');
      sync(mb);
    },
  }).then(async v => {
    if (v === 'del') {
      if (!(await confirmDlg(t('rep_del_row'), t('btn_delete'), true))) return;
      const m = live(); if (m) m.rows = m.rows.filter(r => r.id !== row.id);
      repTomb(row.id); scheduleSave(); repRerender(); return;
    }
    if (!v || typeof v !== 'object') return;
    const m = live(); if (!m) return gone();
    const cur = row ? m.rows.find(r => r.id === row.id) : null;
    if (cur) Object.assign(cur, v, { ts: Date.now() });
    else if (row) m.rows.push({ ...row, ...v, ts: Date.now() }); // removed on the other device meanwhile: the edit keeps it
    else m.rows.push({ id: uuid(), ts: Date.now(), ...v });
    scheduleSave(); repRerender();
  });
}

// ---------- pick records from the archive ----------
function repPickList(R, m) {
  const q = norm(R.q || '');
  const live = liveRecords().sort((a, b) => a.id - b.id), out = [];
  for (const r of live) {
    if (q && !(norm(r.inv || '').includes(q) || norm(r.title || '').includes(q) || norm(r.author || '').includes(q))) continue;
    out.push(r); if (out.length >= 80) break;
  }
  return out;
}
function repPickHtml(R, m) {
  const list = repPickList(R, m);
  if (!list.length) return `<div class="empty">${esc(t('rep_none'))}</div>`;
  return list.map(r => {
    const here = repHere(m, r.inv), where = here ? `${repMonthName(m.m)}` : repWhere(r.inv, m);
    const note = where ? ` · ${esc(t('rep_in_report', { m: where }))}` : '';
    return `<div class="rp-pr${R.sel.has(r.uuid) ? ' on' : ''}" data-u="${r.uuid}"><span class="chk${R.sel.has(r.uuid) ? ' on' : ''}">✓</span><span class="bd ${repBadge(r.type)}">${esc(repKindLabel(r.type || 'manuscript').slice(0, 5).toUpperCase())}</span><div class="rp-t"><b>${esc(r.title || '–')}</b><span>${esc(t('rep_inv'))} ${esc(r.inv)} · ${r.pages !== '' && r.pages != null ? esc(fmtNum(repLeavesOf(r.pages))) : '–'} ${esc(t('rep_leaves').toLowerCase())}${note}</span></div><span class="sc ${r.scanned ? 'y' : 'n'}">✓</span></div>`;
  }).join('') + `<div class="rp-hint">${esc(t('rep_hint_pick'))}</div>`;
}
function repViewPick(main, f, m) {
  const R = UI.rep.pick;
  const inner = `<div class="rp-search"><input class="inp" id="rpQ" type="search" autocomplete="off" placeholder="${esc(t('rep_search'))}" value="${esc(R.q)}"></div><div id="rpPickList">${repPickHtml(R, m)}</div>
    <div class="rp-bar"><button class="btn b2" id="rpPCancel">${esc(t('btn_cancel'))}</button><button class="btn b1" id="rpPAdd">${esc(t('rep_add_btn'))} (<span id="rpPN">${R.sel.size}</span>)</button></div>`;
  repShell(main, `${f.name} · ${repMonthName(m.m)}`, inner, '', null, true);
  const upd = () => { $('#rpPN').textContent = R.sel.size; };
  let qt; $('#rpQ').oninput = () => { clearTimeout(qt); qt = setTimeout(() => { R.q = $('#rpQ').value; $('#rpPickList').innerHTML = repPickHtml(R, m); }, 150); };
  $('#rpPickList').onclick = e => {
    const r = e.target.closest('.rp-pr'); if (!r) return;
    const u = r.dataset.u; if (R.sel.has(u)) R.sel.delete(u); else R.sel.add(u);
    r.classList.toggle('on', R.sel.has(u)); r.querySelector('.chk').classList.toggle('on', R.sel.has(u)); upd();
  };
  $('#rpPCancel').onclick = () => history.back();
  $('#rpPAdd').onclick = () => repPickAdd(f, m, R);
}
async function repPickAdd(f, m0, R) {
  const recs = [...R.sel].map(u => byUuid().get(u)).filter(r => r && isLive(r)).sort((a, b) => a.id - b.id);
  if (!recs.length) return;
  let added = 0, sc = 0, ns = 0, rs = 0, nrs = 0, skipped = 0;
  for (const rec of recs) {
    const m = repLiveMonth(f, m0); // re-resolved after every prompt: a sync may have replaced the month
    if (!m) { toast(t('rep_gone'), 4000); break; }
    if (repHere(m, rec.inv)) { skipped++; continue; }
    const where = repWhere(rec.inv, m);
    if (where) {
      const ok = await ask({ title: t('rep_dup_title', { inv: rec.inv }), text: t('rep_dup_text', { t: rec.title || rec.inv, m: where }), dismiss: false, buttons: [{ label: t('rep_add_anyway'), v: true, cls: 'b1' }, { label: t('rep_skip'), v: false, cls: 'b2' }] });
      if (!ok) { skipped++; continue; }
    }
    const lm = repLiveMonth(f, m0); if (!lm) { toast(t('rep_gone'), 4000); break; } // the prompt above may have waited through a sync
    lm.rows.push({ id: uuid(), ts: Date.now(), kind: rec.type === 'printed' ? 'printed' : 'manuscript', inv: rec.inv, title: rec.title || '', leaves: rec.pages === '' || rec.pages == null ? '' : repLeavesOf(rec.pages), scanned: false });
    added++; if (rec.scanned) sc++; else ns++; if (rec.restored) rs++; else nrs++;
  }
  scheduleSave();
  UI.rep.pick = null; renderRoute();
  const p = x => `<p>${x}</p>`;
  await ask({ title: t('rep_result', { a: added, n: recs.length }), html: p(esc(t('rep_res_scan', { a: sc, b: ns }))) + (H.rest ? p(esc(t('rep_res_rest', { a: rs, b: nrs }))) : '') + (skipped ? `<p class="rp-s">${esc(t('rep_skipped', { n: skipped }))}</p>` : ''), buttons: [{ label: t('ok'), v: true, cls: 'b1' }] });
}
