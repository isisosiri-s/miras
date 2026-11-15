'use strict';
/* Miras I/O: files, Excel/CSV/JSON, import planning, sync merge */

// ---------- saving / picking files ----------
async function saveFile(name, blob) {
  if (window.MirasNative && MirasNative.saveFile) { // PC: false = user closed the dialog, error = disk full / no access / file busy
    try { return await MirasNative.saveFile(name, blob); } catch (e) { console.warn('save', e); toast(t('save_fail'), 5000); return false; }
  }
  const cap = window.Capacitor;
  if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins.Filesystem && cap.Plugins.Share) {
    const buf = new Uint8Array(await blob.arrayBuffer());
    const res = await cap.Plugins.Filesystem.writeFile({ path: name, data: toB64(buf), directory: 'CACHE' });
    const how = await ask({ title: name, buttons: [{ label: t('save_dev'), v: 'save', cls: 'b1' }, { label: t('save_share'), v: 'share', cls: 'b2' }, { label: t('btn_cancel'), v: null, cls: 'bd' }] });
    if (how === 'share') await cap.Plugins.Share.share({ title: name, url: res.uri, dialogTitle: name });
    else if (how === 'save') {
      let P = cap.Plugins.MirasFiles; try { P = P || cap.registerPlugin('MirasFiles'); } catch (e) { }
      try { const r = await P.save({ name, mime: blob.type || 'application/octet-stream', src: res.uri }); if (r && r.saved) toast(t('file_saved')); }
      catch (e) { console.warn('save', e); await cap.Plugins.Share.share({ title: name, url: res.uri, dialogTitle: name }); }
    }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
function pickFile(accept) {
  return new Promise(res => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept || '';
    inp.style.display = 'none'; document.body.appendChild(inp);
    inp.onchange = () => { const f = inp.files[0]; inp.remove(); res(f || null); };
    inp.addEventListener('cancel', () => { inp.remove(); res(null); });
    inp.click();
  });
}
const readText = f => f.text();
const readBuf = f => f.arrayBuffer();

// ---------- export tables ----------
function boolText(v) { return v ? t('yes') : t('no'); }
function exportMatrix(recs, cols) {
  const head = cols.map(c => colName(c, false));
  const rows = recs.map(r => cols.map(c => {
    const v = r[c.key];
    switch (c.kind) {
      case 'id': return r.id;
      case 'check': return boolText(v);
      case 'number': return v === '' || v == null ? '' : v;
      case 'date': return v || '';
      case 'type': return v ? t('type_' + v) : '';
      default: return v ?? '';
    }
  }));
  return [head, ...rows];
}
function xlsxBlob(aoa, sheetName) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = aoa[0].map((_, i) => ({ wch: Math.min(48, Math.max(8, ...aoa.slice(0, 200).map(r => String(r[i] ?? '').length)) + 2) }));
  if (aoa.length > 1) ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: aoa[0].length - 1 } }) };
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Miras').slice(0, 31));
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function csvBlob(aoa) {
  const q = v => { v = String(v ?? ''); return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return new Blob(['﻿' + aoa.map(r => r.map(q).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}
const fileStamp = () => todayISO();
async function exportXlsx() {
  const recs = liveRecords().sort((a, b) => a.id - b.id);
  await saveFile(`miras-${fileStamp()}.xlsx`, xlsxBlob(exportMatrix(recs, visibleCols())));
}
async function exportCsv() {
  const recs = liveRecords().sort((a, b) => a.id - b.id);
  await saveFile(`miras-${fileStamp()}.csv`, csvBlob(exportMatrix(recs, visibleCols())));
}
async function exportColumnXlsx(colKey) {
  const c = colDef(colKey); const idc = colDef('id'), invc = colDef('inv'), tc = colDef('title');
  const recs = liveRecords().sort((a, b) => a.id - b.id);
  await saveFile(`miras-${colName(c).replace(/[^\wЀ-ӿ-]+/g, '_')}-${fileStamp()}.xlsx`, xlsxBlob(exportMatrix(recs, [idc, invc, tc, c])));
}

// ---------- backup ----------
function backupPayload() {
  return { kind: 'backup', created: Date.now(), device: { id: H.deviceId, kind: deviceKind() }, columns: DB.columns, colsTs: DB.colsTs, records: DB.records, reports: DB.reports, repTomb: DB.repTomb, repOrd: DB.repOrd };
}
async function createBackup() {
  const text = await sealFile(backupPayload(), DB._pw, H.enc);
  const name = `miras-${fileStamp()}.json`;
  if ((await saveFile(name, new Blob([text], { type: 'application/json' }))) === false) return null; // cancelled or failed: no false "backup done"
  H.lastBackup = Date.now(); await saveHeader();
  return name;
}
async function restoreBackup(payload) {
  if (!payload || payload.kind !== 'backup') throw new Error('format');
  loadDataObj({ records: payload.records, columns: payload.columns, colsTs: payload.colsTs, draft: null, reports: payload.reports, repTomb: payload.repTomb, repOrd: payload.repOrd });
  DB.columns = DB.columns; scheduleSave(); await flushSave();
  return liveRecords().length;
}
function deviceKind() {
  if (window.MirasNative && MirasNative.kind) return MirasNative.kind;
  if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) return 'phone';
  return 'web';
}
const deviceLabel = k => k === 'phone' ? t('dev_phone') : k === 'pc' ? t('dev_pc') : t('dev_web');

// ---------- Excel import ----------
const BOOL_TRUE = new Set(['да', 'yes', 'true', 'hawa', '+', '✓', '✔', 'истина', '1', 'y', 'x', 'есть', 'bar', 'ha']);
const BOOL_FALSE = new Set(['нет', 'no', 'false', 'yok', '-', '✗', '✘', 'ложь', '0', 'n', 'отсутствует', 'ok', '']);
function isBoolWord(s) { const n = norm(s); return (BOOL_TRUE.has(n) || BOOL_FALSE.has(n)) && !/^[01]$/.test(n) && n !== ''; }
function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return BOOL_TRUE.has(norm(v));
}
function cellStr(v) {
  if (v == null) return '';
  if (v instanceof Date) return dateISO(v);
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  return String(v).trim();
}
function dateISO(d) { const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000 + 43200000); return x.toISOString().slice(0, 10); }
function parseDateStr(s) {
  s = String(s).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}
function cellDate(v) { if (v instanceof Date) return dateISO(v); return parseDateStr(cellStr(v)); }

function guessKind(values) {
  const vs = values.filter(v => v !== '' && v != null);
  if (!vs.length) return { kind: 'text', undetected: false };
  if (vs.every(v => typeof v === 'boolean' || (typeof v === 'string' && isBoolWord(v)))) return { kind: 'check', undetected: false };
  if (vs.every(v => v instanceof Date || parseDateStr(cellStr(v)))) return { kind: 'date', undetected: false };
  const numeric = vs.filter(v => typeof v === 'number' || (typeof v === 'string' && parseNum(v) !== null && /\d/.test(v)));
  const share = numeric.length / vs.length;
  if (share === 1) return { kind: 'number', undetected: false };
  if (share >= 0.1) return { kind: 'text', undetected: true };
  return { kind: 'text', undetected: false };
}

const ALIASES = [
  ['id', /^(id|#|№|n°|п\/п|№ ?п\/п)$/],
  ['inv', /(инв|inv|inwent|envanter|inventar)/],
  ['restored', /(реставр|rejele|restor)/],
  ['scanned', null], // handled specially below
  ['title', /(назван|наименован|заглав|^ady|\bady\b|title|^name$|book name|kitap ad|имя книги)/],
  ['author', /(автор|awtor|author|yazar|muallif|составител)/],
  ['lang', /(язык|^dili?$|language|^lang)/],
  ['date', /(дата|век|год|^sene|asyr|centur|^date|year|tarih|yuzyil)/],
  ['type', /^(вид|тип|gornus|type|kind)/],
  ['pages', /(стран|лист|sahyp|warak|page|leaf|leaves|^pp?$)/],
  ['loc', /(хранен|мест|\byer|saklan|locat|storage|shelf|полка|шкаф)/],
];
function matchHeader(h) {
  const n = norm(h).replace(/[.:;,()]/g, '').trim();
  if (!n) return null;
  // exact match against current column names in all languages
  for (const c of liveCols()) {
    const names = new Set();
    if (c.names) for (const l of LANGS_ALL) if (c.names[l]) names.add(norm(c.names[l]));
    const b = builtinOf(c.key);
    if (b) for (const l of LANGS_ALL) { names.add(norm(I18N[l][b.i18n])); if (b.card) names.add(norm(I18N[l][b.card])); }
    names.delete('');
    if (names.has(n)) return c.key;
  }
  if (/(скан|skan|scan|оцифр|digiti)/.test(n)) { return /(дат|date|sene)/.test(n) ? null : 'scanned'; }
  for (const [key, re] of ALIASES) { if (re && re.test(n)) return key; }
  return null;
}
const LANGS_ALL = ['ru', 'tk', 'en'];

function parseWorkbook(buf) {
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '', blankrows: false });
  return rows;
}
const TYPE_MS = /(рукопис|golyazma|manuscript|ркп|manuskript|handschrift)/, TYPE_PR = /(печат|chap|cap |printed|print|книга|kitap|литограф|lithograph|dasbasma|das basma|tipograf)/;
function toType(s) { const n = norm(s); if (!n) return ''; if (TYPE_MS.test(n)) return 'manuscript'; if (/^cap|printed|печат|книга|kitap|литограф|lithograph|dasbasma|das basma/.test(n) || TYPE_PR.test(n)) return 'printed'; return null; }

function buildImportPlan(rows, fileName) {
  rows = rows.filter(r => r.some(c => cellStr(c) !== ''));
  if (!rows.length) return { empty: true };
  const head = rows[0].map(cellStr), body = rows.slice(1);
  const used = new Set(); const cols = [];
  head.forEach((h, idx) => {
    const values = body.map(r => r[idx]);
    if (!h && values.every(v => cellStr(v) === '')) return;
    const name = h || ('?' + (idx + 1));
    let target = matchHeader(h);
    if (target === 'id') { cols.push({ idx, name, target: 'ignore', reason: 'id' }); return; }
    if (target && used.has(target)) target = null;
    if (target) { used.add(target); cols.push({ idx, name, target, kind: colDef(target).kind }); return; }
    const g = guessKind(values);
    cols.push({ idx, name, target: 'new', kind: g.kind, undetected: g.undetected, chosen: !g.undetected });
  });
  return { empty: !body.length, fileName, cols, body, nCols: cols.length };
}
function convertCell(kind, v) {
  switch (kind) {
    case 'check': return toBool(v);
    case 'number': { if (typeof v === 'number') return v; const n = parseNum(v); return n === null ? cellStr(v) : n; }
    case 'date': return cellDate(v) || cellStr(v);
    case 'type': return toType(cellStr(v));
    default: return cellStr(v);
  }
}
function planRowValues(plan) {
  // returns array of {vals, ok} for builtin targets only (used for duplicate detection & final build)
  return plan.body.map(r => {
    const vals = {}; let typeBad = false;
    for (const c of plan.cols) {
      if (c.target === 'ignore' || c.kind === 'ignore') continue;
      const raw = r[c.idx];
      if (c.target === 'new') continue;
      let v = convertCell(builtinOf(c.target)?.kind || c.kind, raw);
      if (c.target === 'type' && v === null) { typeBad = true; v = ''; }
      if (c.target === 'scanned' || c.target === 'pages' || v !== '') vals[c.target] = v;
    }
    return { vals, typeBad };
  });
}
function detectImportDups(plan, rv) {
  const dups = []; const seenInv = new Map(), seenName = new Map(); let noInv = 0;
  rv.forEach((x, i) => {
    const v = x.vals; if (!v.inv) { noInv++; return; }
    const ik = invKey(v.inv); const nk = v.title && norm(v.title).length >= 2 ? norm(v.title) + '|' + norm(v.author || '') : null;
    let d = null;
    if (seenInv.has(ik)) d = { row: i, kind: 'file', other: seenInv.get(ik) };
    else if (nk && seenName.has(nk)) d = { row: i, kind: 'file', other: seenName.get(nk) };
    else {
      const ex = findByInv(v.inv); if (ex) d = { row: i, kind: 'exact', uuid: ex.uuid, id: ex.id };
      else if (nk) { const en = findByName(v.title, v.author); if (en) d = { row: i, kind: 'name', uuid: en.uuid, id: en.id }; }
    }
    if (d) { d.act = 'skip'; dups.push(d); } else { seenInv.set(ik, i); if (nk) seenName.set(nk, i); }
  });
  return { dups, noInv };
}
function applyImport(plan, rv, dups) {
  const stats = { added: 0, updated: 0, skipped: 0, cols: 0 };
  // new columns
  const newCols = [];
  for (const c of plan.cols) {
    if (c.target !== 'new' || c.kind === 'ignore') continue;
    let opts = [];
    if (c.kind === 'list') { const s = new Set(); for (const r of plan.body) { const v = cellStr(r[c.idx]); if (v) s.add(v); } opts = [...s].sort((a, b) => a.localeCompare(b)); }
    const def = addColumn({ names: { ru: c.name, tk: c.name, en: c.name }, kind: c.kind, opts });
    c.key = def.key; newCols.push(c); stats.cols++;
  }
  const dmap = new Map(dups.map(d => [d.row, d]));
  const base = Date.now();
  const fullVals = (i) => {
    const vals = { ...rv[i].vals };
    for (const c of newCols) { const v = convertCell(c.kind, plan.body[i][c.idx]); if (v !== '' && v !== false || c.kind === 'check') vals[c.key] = v; }
    return vals;
  };
  const created = new Map(); let nid = maxId() + 1;
  for (let i = 0; i < rv.length; i++) {
    const v = rv[i].vals; if (!v.inv) { stats.skipped++; continue; }
    const d = dmap.get(i);
    if (d && d.act === 'skip') { stats.skipped++; continue; }
    if (d && d.act === 'update' && d.kind !== 'file') {
      const ex = byUuid().get(d.uuid); const vals = fullVals(i); const upd = {};
      for (const k in vals) { const nv = vals[k]; if (nv === '' || nv == null) continue; if (ex[k] !== nv) upd[k] = nv; }
      if (Object.keys(upd).length) updateRecord(ex, upd);
      stats.updated++; continue;
    }
    const r = newRecord(fullVals(i), base + i, nid++); created.set(i, r); stats.added++;
  }
  scheduleSave();
  return stats;
}
async function exportDupsXlsx(plan, rv, dups) {
  const aoa = [[t('col_id'), t('imp_title'), t('col_inv'), t('col_title'), t('col_author'), t('imp_dups')]];
  for (const d of dups) {
    const v = rv[d.row].vals;
    aoa.push([d.id || '', d.row + 2, v.inv || '', v.title || '', v.author || '', d.kind === 'exact' ? t('imp_dup_kind_exact') : d.kind === 'name' ? t('imp_dup_kind_name') : t('imp_dup_kind_file')]);
  }
  aoa[0][1] = '#';
  await saveFile(`miras-duplicates-${fileStamp()}.xlsx`, xlsxBlob(aoa, 'Duplicates'));
}

// ---------- sync ----------
function syncPayload() {
  return { kind: 'sync', created: Date.now(), device: { id: H.deviceId, kind: deviceKind() }, columns: DB.columns, colsTs: DB.colsTs, records: DB.records, reports: DB.reports, repTomb: DB.repTomb, repOrd: DB.repOrd };
}
async function createSyncFile() {
  const name = `miras-sync-${deviceKind()}-${fileStamp()}.json`;
  const text = await sealFile(syncPayload(), DB._pw, H.enc);
  if ((await saveFile(name, new Blob([text], { type: 'application/json' }))) === false) return null;
  return name;
}
function valOf(r, key) { const v = r[key]; return v === undefined || v === null || v === false ? '' : v; }
function diffRecords(a, b) {
  const out = []; const cols = liveCols().filter(c => c.kind !== 'id');
  for (const c of cols) {
    const x = valOf(a, c.key), y = valOf(b, c.key);
    if (String(x) !== String(y)) out.push({ c, a: x, b: y });
  }
  return out;
}
function showVal(c, v) {
  if (v === '' || v == null) return t('empty_val');
  if (c.kind === 'check') return v ? t('yes_label') : t('no_label');
  if (c.kind === 'type') return t('type_' + v);
  if (c.kind === 'date') return fmtDate(v);
  if (c.kind === 'number') return typeof v === 'number' ? fmtNum(v) : String(v);
  return String(v);
}

// ---------- merge: records field by field, reports row by row ----------
const REC_META = new Set(['uuid', 'id', 'created', 'vv', 'ts', 'fts', 'del', 'purged']);
// a field without its own stamp was never edited (0); records from before field stamps fall back to the record time
const ftsOf = (r, k) => { const f = r.fts && r.fts[k]; if (f) return f; return r.fts && Object.keys(r.fts).length ? 0 : (r.ts || 0); };
const jclone = o => JSON.parse(JSON.stringify(o));
// two devices changed the same record: every field takes the newer value (ties are broken the same way on both sides)
function mergeRecord(lr, rr) {
  if (rr.purged) return jclone(rr);
  if (lr.purged) return jclone(lr);
  const out = jclone(lr); out.fts = { ...(lr.fts || {}) };
  for (const k of new Set([...Object.keys(lr), ...Object.keys(rr)])) {
    if (REC_META.has(k) || k[0] === '_') continue;
    const x = valOf(lr, k), y = valOf(rr, k), tx = ftsOf(lr, k), ty = ftsOf(rr, k);
    if (String(x) !== String(y) && (ty > tx || (ty === tx && String(y) > String(x)))) { if (k in rr) out[k] = jclone(rr[k]); else delete out[k]; }
    const m = Math.max(lr.fts && lr.fts[k] || 0, rr.fts && rr.fts[k] || 0); if (m) out.fts[k] = m;
  }
  const dl = lr.del || 0, dr = rr.del || 0;
  if (dl && dr) out.del = Math.max(dl, dr);
  else if (dl) out.del = (rr.ts || 0) > dl ? 0 : dl;
  else if (dr) out.del = (lr.ts || 0) > dr ? 0 : dr;
  else out.del = 0;
  out.vv = vvJoin(lr.vv, rr.vv); out.vv[H.deviceId] = (out.vv[H.deviceId] || 0) + 1; out.ts = Date.now(); out._s = null;
  return out;
}
function canonJson(x) {
  if (Array.isArray(x)) return '[' + x.map(canonJson).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).filter(k => k[0] !== '_').sort().map(k => JSON.stringify(k) + ':' + canonJson(x[k])).join(',') + '}';
  return JSON.stringify(x === undefined ? null : x);
}
function mergeReports(L, R) {
  const tomb = { ...(L.tomb || {}) }; for (const k in (R.tomb || {})) tomb[k] = Math.max(tomb[k] || 0, R.tomb[k]);
  const rowTs = r => r.ts || 0;
  const monthTs = m => Math.max(m.ts || 0, m.ordTs || 0, ...(m.rows || []).map(rowTs));
  const folderTs = f => Math.max(f.ts || 0, ...(f.months || []).map(monthTs));
  const dead = (xs, tsOf) => xs.length > 0 && xs.every(x => (tomb[x.id] || 0) > tsOf(x));
  const tie = (a, b) => canonJson(a) >= canonJson(b);
  const newer = (a, b) => ((a.ts || 0) !== (b.ts || 0) ? ((a.ts || 0) > (b.ts || 0) ? a : b) : (tie(a, b) ? a : b));
  const nk = v => String(v == null ? '' : v).trim().toLowerCase();
  const pairBy = (la, lb, keyFn) => {
    const pairs = [], used = new Set();
    for (const x of la) { const y = lb.find(o => o.id === x.id); if (y) { pairs.push([x, y]); used.add(y); } else pairs.push([x, null]); }
    for (const p of pairs) if (!p[1]) {
      const k = keyFn(p[0]), y = lb.find(o => !used.has(o) && !la.some(z => z.id === o.id) && keyFn(o) === k);
      if (y) { p[1] = y; used.add(y); }
    }
    for (const y of lb) if (!used.has(y)) pairs.push([null, y]);
    return pairs;
  };
  const cid = (a, b) => (a && b ? (a.id < b.id ? a.id : b.id) : (a || b).id);
  const orderBy = (a, b, listOf, ordA, ordB) => {
    if (!a || !b) return null;
    const ja = listOf(a).join(','), jb = listOf(b).join(',');
    return ordA !== ordB ? (ordA > ordB ? a : b) : (ja >= jb ? a : b);
  };
  const mergeMonth = (a, b) => {
    const src = [a, b].filter(Boolean); if (dead(src, monthTs)) return null;
    const ra = new Map(((a && a.rows) || []).map(r => [r.id, r])), rb = new Map(((b && b.rows) || []).map(r => [r.id, r]));
    const rows = new Map();
    for (const id of new Set([...ra.keys(), ...rb.keys()])) {
      const x = ra.get(id), y = rb.get(id), row = x && y ? newer(x, y) : (x || y);
      if ((tomb[id] || 0) > (row.ts || 0)) continue;
      rows.set(id, jclone(row));
    }
    const first = orderBy(a, b, m => (m.rows || []).map(r => r.id), a && a.ordTs || 0, b && b.ordTs || 0);
    const ids = []; const seen = new Set();
    for (const m of (first ? [first, first === a ? b : a] : src)) for (const r of (m.rows || [])) if (rows.has(r.id) && !seen.has(r.id)) { seen.add(r.id); ids.push(r.id); }
    const base = a && b ? newer(a, b) : src[0];
    const out = { id: cid(a, b), m: base.m, rows: ids.map(i => rows.get(i)) };
    const ts = Math.max(...src.map(x => x.ts || 0)), ot = Math.max(...src.map(x => x.ordTs || 0));
    if (ts) out.ts = ts; if (ot) out.ordTs = ot;
    return out;
  };
  const mergeFolder = (a, b) => {
    const src = [a, b].filter(Boolean); if (dead(src, folderTs)) return null;
    const months = pairBy((a && a.months) || [], (b && b.months) || [], m => m.m).map(([x, y]) => mergeMonth(x, y)).filter(Boolean);
    const base = a && b ? newer(a, b) : src[0];
    const out = { id: cid(a, b), name: base.name, months };
    const ts = Math.max(...src.map(x => x.ts || 0)); if (ts) out.ts = ts;
    return out;
  };
  const lf = L.reports || [], rf = R.reports || [], cmap = new Map(), merged = [];
  for (const [a, b] of pairBy(lf, rf, f => nk(f.name))) {
    const f = mergeFolder(a, b); if (!f) continue;
    merged.push(f); if (a) cmap.set(a.id, f.id); if (b) cmap.set(b.id, f.id);
  }
  const oL = L.ord || 0, oR = R.ord || 0, canonIds = list => list.map(f => cmap.get(f.id)).filter(Boolean);
  const first = oL !== oR ? (oL > oR ? lf : rf) : (canonIds(lf).join(',') >= canonIds(rf).join(',') ? lf : rf);
  const second = first === lf ? rf : lf, byId = new Map(merged.map(f => [f.id, f])), reports = [], seen = new Set();
  for (const f of [...first, ...second]) { const c = cmap.get(f.id); if (c && byId.has(c) && !seen.has(c)) { seen.add(c); reports.push(byId.get(c)); } }
  const flat = rs => { const m = new Map(); for (const f of rs) for (const mo of f.months) for (const r of mo.rows) m.set(r.id, canonJson(r)); return m; };
  const before = flat(lf), after = flat(reports), stat = { added: 0, changed: 0, removed: 0 };
  for (const [id, j] of after) { if (!before.has(id)) stat.added++; else if (before.get(id) !== j) stat.changed++; }
  for (const id of before.keys()) if (!after.has(id)) stat.removed++;
  const ord = Math.max(oL, oR);
  const changed = canonJson(reports) !== canonJson(lf) || canonJson(tomb) !== canonJson(L.tomb || {}) || ord !== oL;
  return { reports, tomb, ord, stat, changed };
}
// ---------- Wi-Fi sync (phone <-> PC) ----------
const LAN = { code: '', on: false, urls: [], last: null, bad: 0, reg: false };
const LAN_PORT = 47653;
function planStats(plan) {
  return { added: plan.added.length, changed: plan.changed.length, merged: plan.merged.length, deleted: plan.deleted.length, cols: plan.colChanges, rep: plan.rep ? plan.rep.stat : null };
}
function lanRefresh() {
  UI.listKey = '';
  if (UI.route === 'books' && typeof refreshList === 'function') refreshList();
  else if (UI.route === 'reports' && typeof renderRoute === 'function') renderRoute();
  else if (UI.route === 'sync' && !UI.sync && typeof viewSync === 'function') { const m = $('#main'); if (m) viewSync(m); }
}
// PC side: one request from the phone (encrypted with the pairing code)
async function lanHandle(text) {
  if (!DB.unlocked) return { status: 423, body: '' };
  let p; try { p = await openFile(text, LAN.code); } catch (_) { return { status: 403, body: '' }; }
  if (!p || p.kind !== 'sync' || !Array.isArray(p.records)) return { status: 400, body: '' };
  const plan = planMerge(p), r = plan.identical ? { renum: 0 } : await applyMerge(plan);
  LAN.last = { at: Date.now(), renum: r.renum, ...planStats(plan) }; LAN.bad = 0;
  const body = await sealFile(syncPayload(), LAN.code, true);
  lanRefresh();
  return { status: 200, body };
}
function lanEvent(ev) {
  if (ev.type === 'stopped') { LAN.on = false; }
  else if (ev.type === 'bad') { LAN.bad++; }
  lanRefresh();
}
async function lanStartPc() {
  if (!window.MirasLan) throw new Error('net');
  if (!LAN.reg) { MirasLan.onRequest(lanHandle); MirasLan.onEvent(lanEvent); LAN.reg = true; }
  const r = await MirasLan.start();
  if (!r || r.error) throw new Error(r && r.error === 'EADDRINUSE' ? 'port' : 'net');
  LAN.code = r.code; LAN.urls = r.urls; LAN.on = true; LAN.last = null; LAN.bad = 0;
}
async function lanStopPc() { if (window.MirasLan) await MirasLan.stop(); LAN.on = false; }
const lanTimeout = (pr, ms) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(new Error('net')), ms))]);
// phone side: send our data, get the merged data back, merge it too
async function lanSyncClient(addr, code) {
  let base = String(addr || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('net');
  if (!/^https?:\/\//i.test(base)) base = 'http://' + base;
  if (!/:\d+$/.test(base.replace(/^https?:\/\//i, ''))) base += ':' + LAN_PORT;
  let hello; try { const r = await lanTimeout(fetch(base + '/hello'), 15000); hello = await r.json(); } catch (_) { throw new Error('net'); }
  if (!hello || hello.app !== 'miras') throw new Error('net');
  const body = await sealFile(syncPayload(), code, true);
  let res; try { res = await lanTimeout(fetch(base + '/sync', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body }), 240000); } catch (_) { throw new Error('net'); }
  if (res.status === 403) throw new Error('code');
  if (res.status === 423) throw new Error('locked');
  if (res.status === 429) throw new Error('wait');
  if (res.status !== 200) throw new Error('net');
  let p; try { p = await openFile(await res.text(), code); } catch (_) { throw new Error('code'); }
  if (!p || p.kind !== 'sync') throw new Error('net');
  const plan = planMerge(p), r = plan.identical ? { renum: 0 } : await applyMerge(plan);
  return { plan, renum: r.renum };
}
function planMerge(payload) {
  if (!payload || payload.kind !== 'sync') throw new Error('format');
  const plan = { fromKind: payload.device?.kind, fromCount: payload.records.filter(r => !r.del && !r.purged).length, added: [], changed: [], deleted: [], merged: [], conflicts: [], ops: [], payload, colChanges: 0, rep: null };
  const L = byUuid();
  for (const rr of payload.records) {
    const lr = L.get(rr.uuid);
    if (!lr) {
      plan.ops.push({ type: 'add', rec: rr });
      if (!rr.del && !rr.purged) plan.added.push({ id: rr.id, inv: rr.inv, title: rr.title });
      continue;
    }
    const c = vvCmp(lr.vv, rr.vv);
    if (c === 0 || c === 1) continue;
    const item = { uuid: rr.uuid, id: lr.id, inv: (lr.inv || rr.inv), title: (lr.title || rr.title) };
    if (c === -1) {
      plan.ops.push({ type: 'replace', uuid: rr.uuid, rec: rr });
      if (rr.purged || (rr.del && !lr.del)) plan.deleted.push(item);
      else if (!rr.del && lr.del) plan.changed.push({ ...item, lines: [t('ch_restored')] });
      else plan.changed.push({ ...item, diffs: diffRecords(lr, rr) });
    } else {
      // changed on both devices: merge field by field
      const mrec = mergeRecord(lr, rr);
      plan.ops.push({ type: 'merge', uuid: rr.uuid, rec: mrec });
      const diffs = diffRecords(lr, mrec), lines = [];
      if (!!lr.del !== !!mrec.del) lines.push(mrec.del ? t('ch_deleted_here') : t('ch_restored'));
      plan.merged.push({ ...item, diffs, lines });
    }
  }
  // columns
  const lcols = new Map(DB.columns.map(c => [c.key, c]));
  for (const rc of payload.columns || []) {
    const lc = lcols.get(rc.key);
    if (!lc) plan.colChanges++;
    else if ((rc.mts || 0) > (lc.mts || 0)) plan.colChanges++;
  }
  if ((payload.colsTs || 0) > DB.colsTs) plan.colChanges = Math.max(plan.colChanges, 1);
  if (Array.isArray(payload.reports)) {
    plan.rep = mergeReports({ reports: DB.reports, tomb: DB.repTomb, ord: DB.repOrd }, { reports: payload.reports, tomb: payload.repTomb, ord: payload.repOrd });
    if (!plan.rep.changed) plan.rep = null;
  }
  plan.identical = !plan.ops.length && !plan.conflicts.length && !plan.colChanges && !plan.rep;
  return plan;
}
function setAllConflicts(plan, mode) {
  for (const c of plan.conflicts) c.choice = mode === 'newer' ? ((c.remote.ts || 0) > (c.local.ts || 0) ? 'remote' : 'local') : 'local';
}
async function applyMerge(plan) {
  const localIdsBefore = new Map(DB.records.map(r => [r.uuid, r.id]));
  const clone = o => JSON.parse(JSON.stringify(o));
  for (const op of plan.ops) {
    if (op.type === 'add') { const r = clone(op.rec); DB.records.push(r); }
    else { const i = DB.records.findIndex(r => r.uuid === op.uuid); if (i >= 0) DB.records[i] = clone(op.rec); }
  }
  for (const c of plan.conflicts) {
    const i = DB.records.findIndex(r => r.uuid === c.uuid); if (i < 0) continue;
    const base = clone(c.choice === 'remote' ? c.remote : c.local);
    base.vv = vvJoin(c.local.vv, c.remote.vv); base.vv[H.deviceId] = (base.vv[H.deviceId] || 0) + 1; base.ts = Date.now();
    DB.records[i] = base;
  }
  // columns
  const rcols = plan.payload.columns || [];
  const lmap = new Map(DB.columns.map(c => [c.key, c]));
  const merged = new Map();
  for (const rc of rcols) {
    const lc = lmap.get(rc.key);
    if (!lc || (rc.mts || 0) > (lc.mts || 0)) merged.set(rc.key, JSON.parse(JSON.stringify(rc)));
  }
  const useRemoteOrder = (plan.payload.colsTs || 0) > DB.colsTs;
  const resultMap = new Map(DB.columns.map(c => [c.key, c])); for (const [k, v] of merged) resultMap.set(k, v);
  let order = [];
  const push = k => { if (resultMap.has(k) && !order.includes(k)) order.push(k); };
  if (useRemoteOrder) { rcols.forEach(c => push(c.key)); DB.columns.forEach(c => push(c.key)); }
  else { DB.columns.forEach(c => push(c.key)); rcols.forEach(c => push(c.key)); }
  DB.columns = order.map(k => resultMap.get(k));
  if (useRemoteOrder) DB.colsTs = plan.payload.colsTs;
  DB.columns = DB.columns.filter(c => !(c.key === 'note' && c.b && !BUILTIN_KEYS.has('note')));
  for (const c of DB.columns) if (c.del) for (const r of DB.records) delete r[c.key];
  for (const b of BUILTIN_COLS) if (!DB.columns.find(c => c.key === b.key)) DB.columns.push({ key: b.key, b: 1, kind: b.kind, names: null, hidden: false, opts: [], mts: 0 });
  if (plan.rep) { DB.reports = plan.rep.reports; DB.repTomb = plan.rep.tomb; DB.repOrd = plan.rep.ord; }
  DB._byUuid = null;
  renumberIds();
  let renum = 0; for (const r of DB.records) { const o = localIdsBefore.get(r.uuid); if (o !== undefined && o !== r.id) renum++; }
  scheduleSave(); await flushSave();
  return { renum };
}
