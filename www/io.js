'use strict';
/* Miras I/O: files, Excel/CSV/JSON, import planning, sync merge */

// ---------- saving / picking files ----------
async function saveFile(name, blob) {
  if (window.MirasNative && MirasNative.saveFile) return MirasNative.saveFile(name, blob);
  const cap = window.Capacitor;
  if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins.Filesystem && cap.Plugins.Share) {
    const buf = new Uint8Array(await blob.arrayBuffer());
    const res = await cap.Plugins.Filesystem.writeFile({ path: name, data: toB64(buf), directory: 'CACHE' });
    await cap.Plugins.Share.share({ title: name, url: res.uri, dialogTitle: name });
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
  return { kind: 'backup', created: Date.now(), device: { id: H.deviceId, kind: deviceKind() }, columns: DB.columns, colsTs: DB.colsTs, records: DB.records };
}
async function createBackup() {
  const text = await sealFile(backupPayload(), DB._pw, H.enc);
  const name = `miras-${fileStamp()}.json`;
  await saveFile(name, new Blob([text], { type: 'application/json' }));
  H.lastBackup = Date.now(); await saveHeader();
  return name;
}
async function restoreBackup(payload) {
  if (!payload || payload.kind !== 'backup') throw new Error('format');
  loadDataObj({ records: payload.records, columns: payload.columns, colsTs: payload.colsTs, draft: null });
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
  ['scanned', null], // handled specially below
  ['title', /(назван|наименован|заглав|^ady|\bady\b|title|^name$|book name|kitap ad|имя книги)/],
  ['author', /(автор|awtor|author|yazar|muallif|составител)/],
  ['lang', /(язык|^dili?$|language|^lang)/],
  ['date', /(дата|век|год|^sene|asyr|centur|^date|year|tarih|yuzyil)/],
  ['type', /^(вид|тип|gornus|type|kind)/],
  ['pages', /(стран|листов|sahyp|page|^pp?$)/],
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
const TYPE_MS = /(рукопис|golyazma|manuscript|ркп|manuskript|handschrift)/, TYPE_PR = /(печат|chap|cap |printed|print|книга|kitap|литограф|tipograf)/;
function toType(s) { const n = norm(s); if (!n) return ''; if (TYPE_MS.test(n)) return 'manuscript'; if (/^cap|printed|печат|книга|kitap|литограф/.test(n) || TYPE_PR.test(n)) return 'printed'; return null; }

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
  return { kind: 'sync', created: Date.now(), device: { id: H.deviceId, kind: deviceKind() }, columns: DB.columns, colsTs: DB.colsTs, records: DB.records };
}
async function createSyncFile() {
  const name = `miras-sync-${deviceKind()}-${fileStamp()}.json`;
  const text = await sealFile(syncPayload(), DB._pw, H.enc);
  await saveFile(name, new Blob([text], { type: 'application/json' }));
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
function planMerge(payload) {
  if (!payload || payload.kind !== 'sync') throw new Error('format');
  const plan = { fromKind: payload.device?.kind, fromCount: payload.records.filter(r => !r.del && !r.purged).length, added: [], changed: [], deleted: [], conflicts: [], ops: [], payload, colChanges: 0 };
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
      const diffs = diffRecords(lr, rr);
      const delDiff = !!lr.del !== !!rr.del;
      plan.conflicts.push({ ...item, local: lr, remote: rr, diffs, delDiff, choice: (rr.ts || 0) > (lr.ts || 0) ? 'remote' : 'local' });
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
  plan.identical = !plan.ops.length && !plan.conflicts.length && !plan.colChanges;
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
  for (const c of DB.columns) if (c.del) for (const r of DB.records) delete r[c.key];
  for (const b of BUILTIN_COLS) if (!DB.columns.find(c => c.key === b.key)) DB.columns.push({ key: b.key, b: 1, kind: b.kind, names: null, hidden: false, opts: [], mts: 0 });
  DB._byUuid = null;
  renumberIds();
  let renum = 0; for (const r of DB.records) { const o = localIdsBefore.get(r.uuid); if (o !== undefined && o !== r.id) renum++; }
  scheduleSave(); await flushSave();
  return { renum };
}
