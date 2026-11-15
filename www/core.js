'use strict';
/* Miras core: i18n, utils, crypto, storage, data model */
const APP_VERSION = '1.1.7';
const PBKDF_ITER = 250000;
const TRASH_DAYS = 30;

// ---------- small utils ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function uuid() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// ---------- i18n ----------
let LANG = 'ru';
function t(key, p) {
  let s = (I18N[LANG] && I18N[LANG][key]);
  if (s === undefined) s = (I18N.en[key] ?? ('[[' + key + ']]'));
  if (p) for (const k in p) s = s.split('{' + k + '}').join(p[k]);
  return s;
}
function plIdx(n) { n = Math.abs(n); const a = n % 10, b = n % 100; if (a === 1 && b !== 11) return 0; if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 1; return 2; }
function noun(k, n) {
  const f = NOUNS[k][LANG];
  if (LANG === 'ru') return f[plIdx(n)];
  if (LANG === 'en') return n === 1 ? f[0] : f[1];
  return f[0];
}
function fmtInt(n) { return Number(n).toLocaleString(LANG === 'en' ? 'en-US' : 'ru-RU'); }
function fmtNum(n) {
  if (n === '' || n == null) return '';
  const x = Number(n); if (!isFinite(x)) return String(n);
  return x.toLocaleString(LANG === 'en' ? 'en-US' : 'ru-RU', { maximumFractionDigits: 6 });
}
function fmtPct(a, b) { const v = b ? (a / b * 100) : 0; const s = v.toFixed(1); return (LANG === 'en' ? s : s.replace('.', ',')) + '%'; }
function parseNum(s) {
  if (typeof s === 'number') return s;
  s = String(s ?? '').trim().replace(/[\s ]/g, '');
  if (!s) return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}
function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return iso || '';
  return LANG === 'en' ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}.${m[2]}.${m[1]}`;
}
function fmtDateTime(ts) {
  const d = new Date(ts); const p = n => String(n).padStart(2, '0');
  return LANG === 'en' ? `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` : `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// ---------- normalisation for search / dedupe ----------
const _MAP = { 'ä': 'a', 'ž': 'z', 'ç': 'c', 'ň': 'n', 'ö': 'o', 'ş': 's', 'ü': 'u', 'ý': 'y', 'ё': 'е', 'ı': 'i', 'ə': 'a', 'ğ': 'g', 'ß': 's' };
function norm(s) {
  s = String(s ?? '').toLowerCase();
  s = s.replace(/[äžçňöşüýёıəğß]/g, c => _MAP[c]);
  s = s.replace(/[À-ɏḀ-ỿ]/g, c => c.normalize('NFD').replace(/[̀-ͯ]/g, ''));
  s = s.replace(/['’ʿʾ`´]/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

// ---------- crypto ----------
const TE = new TextEncoder(), TD = new TextDecoder();
function toB64(buf) { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
function fromB64(s) { const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; }
async function kdf(secret, salt, iter) {
  const base = await crypto.subtle.importKey('raw', TE.encode(String(secret).normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function aesEnc(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return out;
}
async function aesDec(key, blob) {
  const b = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, key, b.slice(12)));
}
const importDK = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
async function wrapRaw(secret, raw, iter = PBKDF_ITER) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const k = await kdf(secret, salt, iter);
  return { salt: toB64(salt), iter, w: toB64(await aesEnc(k, raw)) };
}
async function unwrapRaw(secret, o) {
  const k = await kdf(secret, fromB64(o.salt), o.iter);
  return aesDec(k, fromB64(o.w)); // throws on wrong secret
}
const REC_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function genRecoveryCode() {
  const r = crypto.getRandomValues(new Uint8Array(16)); let s = '';
  for (const x of r) s += REC_ALPHABET[x % REC_ALPHABET.length];
  return s.match(/.{4}/g).join('-');
}
function normRecovery(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').replace(/I|L/g, '1')
    .split('').map(c => c).join('');
}
// Recovery codes use an alphabet without 0/O/1/I/L, so normalising O->0, I/L->1 can never collide with a real char.
// The code is canonicalised as XXXX-XXXX-XXXX-XXXX before key derivation.
function canonRecovery(s) { const n = normRecovery(s); return n.match(/.{1,4}/g)?.join('-') || ''; }

// Encrypted file (backup / sync): password-based
async function sealFile(obj, password, encrypt) {
  const json = JSON.stringify(obj, (k, v) => (k[0] === '_' ? undefined : v));
  if (!encrypt) return JSON.stringify({ app: 'miras', fmt: 1, enc: false, data: JSON.parse(json) });
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await kdf(password, salt, PBKDF_ITER);
  const ct = await aesEnc(key, TE.encode(json));
  return JSON.stringify({ app: 'miras', fmt: 1, enc: true, salt: toB64(salt), iter: PBKDF_ITER, ct: toB64(ct) });
}
async function openFile(text, password) {
  let w; try { w = JSON.parse(text); } catch { throw new Error('format'); }
  if (!w || w.app !== 'miras') throw new Error('format');
  if (!w.enc) return w.data;
  if (password == null) throw new Error('password');
  try {
    const key = await kdf(password, fromB64(w.salt), w.iter);
    return JSON.parse(TD.decode(await aesDec(key, fromB64(w.ct))));
  } catch { throw new Error('password'); }
}

// ---------- key-value storage (IndexedDB, or native file via Electron) ----------
const KV = {
  _db: null,
  async _open() {
    if (this._db) return this._db;
    this._db = await new Promise((res, rej) => {
      const rq = indexedDB.open('miras', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
    });
    return this._db;
  },
  async get(k) {
    if (window.MirasNative && MirasNative.kvGet) return MirasNative.kvGet(k);
    const db = await this._open();
    return new Promise((res, rej) => { const r = db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  },
  async set(k, v) {
    if (window.MirasNative && MirasNative.kvSet) return MirasNative.kvSet(k, v);
    const db = await this._open();
    return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
  },
};

// ---------- built-in columns ----------
const BUILTIN_COLS = [
  { key: 'id', kind: 'id', i18n: 'col_id', locked: true },
  { key: 'inv', kind: 'text', i18n: 'col_inv', card: 'card_inv', noHide: true },
  { key: 'title', kind: 'text', i18n: 'col_title', noHide: true },
  { key: 'author', kind: 'text', i18n: 'col_author' },
  { key: 'lang', kind: 'text', i18n: 'col_lang' },
  { key: 'date', kind: 'text', i18n: 'col_date' },
  { key: 'type', kind: 'type', i18n: 'col_type' },
  { key: 'pages', kind: 'number', i18n: 'col_pages' },
  { key: 'loc', kind: 'text', i18n: 'col_loc' },
  { key: 'scanned', kind: 'check', i18n: 'col_scan', card: 'list_scanned' },
];
const BUILTIN_KEYS = new Set(BUILTIN_COLS.map(c => c.key));
const FIELD_KEYS = ['inv', 'title', 'author', 'lang', 'date', 'type', 'pages', 'loc', 'scanned'];

function defaultColumns() {
  return BUILTIN_COLS.map(c => ({ key: c.key, b: 1, kind: c.kind, names: null, hidden: false, opts: [], mts: 0 }));
}

// ---------- global state ----------
const H = { // header: not encrypted
  v: 1, lang: 'ru', theme: 'light', font: 'm', autolock: 60, shot: true, bio: false, enc: false, pinLen: 0,
  deviceId: '', pw: null, rec: null, lock: { fails: 0, until: 0 }, lastBackup: 0, setupDone: false,
};
const DB = { // data: only in memory while unlocked
  records: [], columns: defaultColumns(), colsTs: 0, draft: null, rev: 0,
  _dk: null, _rawDK: null, _pw: null, _byUuid: null, _invMap: null, _invRev: -1, unlocked: false,
};

function detectLang() {
  const l = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  return ['ru', 'tk', 'en'].includes(l) ? l : 'ru';
}
function applyPrefs() {
  LANG = H.lang;
  document.documentElement.lang = LANG;
  document.documentElement.dataset.theme = H.theme;
  document.documentElement.dataset.font = H.font;
}
async function saveHeader() { await KV.set('header', JSON.parse(JSON.stringify(H))); }
async function loadHeader() {
  const h = await KV.get('header');
  if (h) { Object.assign(H, h); delete H.rec; }
  else { H.lang = detectLang(); H.deviceId = uuid(); }
  if (!H.deviceId) H.deviceId = uuid();
  applyPrefs();
  return !!(h && h.setupDone);
}

// ---------- persistence of data ----------
let _saveTimer = null, _saving = Promise.resolve();
function persistObj() {
  return { v: 1, records: DB.records, columns: DB.columns, colsTs: DB.colsTs, draft: DB.draft };
}
async function writeData() {
  if (!DB.unlocked) return;
  const json = JSON.stringify(persistObj(), (k, v) => (k[0] === '_' ? undefined : v));
  if (H.enc) await KV.set('data', await aesEnc(DB._dk, TE.encode(json)));
  else await KV.set('data', json);
}
function scheduleSave() {
  DB.rev++;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => { _saving = _saving.then(writeData).catch(e => console.error('save', e)); }, 350);
}
async function flushSave() {
  clearTimeout(_saveTimer);
  _saving = _saving.then(writeData).catch(e => console.error('save', e));
  await _saving;
}
function loadDataObj(o) {
  DB.records = o.records || []; DB.columns = o.columns || defaultColumns();
  DB.colsTs = o.colsTs || 0; DB.draft = o.draft || null;
  // ensure built-ins present
  for (const b of BUILTIN_COLS) if (!DB.columns.find(c => c.key === b.key)) DB.columns.push({ key: b.key, b: 1, kind: b.kind, names: null, hidden: false, opts: [], mts: 0 });
  DB._byUuid = null; DB.rev++;
}

// ---------- auth ----------
// PIN is optional. Without a PIN the data is stored unencrypted and the app opens directly.
// With a PIN: random data key wrapped by the PIN, data encrypted with AES-256-GCM.
const PIN_RE = /^\d{4,6}$/;
const Auth = {
  hasPin() { return !!H.pw; },
  async setup(pin) {
    H.setupDone = true; H.lock = { fails: 0, until: 0 }; delete H.rec;
    DB.records = []; DB.columns = defaultColumns(); DB.colsTs = 0; DB.draft = null; DB.unlocked = true;
    if (pin) {
      const raw = crypto.getRandomValues(new Uint8Array(32));
      H.pw = await wrapRaw(pin, raw); H.enc = true; H.pinLen = pin.length;
      DB._rawDK = raw; DB._dk = await importDK(raw); DB._pw = pin;
    } else { H.pw = null; H.enc = false; H.pinLen = 0; }
    await saveHeader(); await writeData();
  },
  // turn the PIN on later (from settings)
  async enablePin(pin) {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    H.pw = await wrapRaw(pin, raw); H.enc = true; H.pinLen = pin.length; H.lock = { fails: 0, until: 0 };
    DB._rawDK = raw; DB._dk = await importDK(raw); DB._pw = pin;
    await saveHeader(); await writeData();
  },
  // turn the PIN off (caller verified the PIN)
  async disablePin() {
    H.pw = null; H.enc = false; H.pinLen = 0; H.bio = false;
    DB._rawDK = null; DB._dk = null; DB._pw = null;
    await saveHeader(); await writeData();
  },
  lockInfo() {
    const now = Date.now(); const L = H.lock;
    return { fails: L.fails, wait: Math.max(0, Math.ceil((L.until - now) / 1000)), recOnly: false, left: 3 - (L.fails % 3) };
  },
  async _fail() {
    H.lock.fails++;
    if (H.lock.fails % 3 === 0) { const st = H.lock.fails / 3; H.lock.until = Date.now() + (st === 1 ? 30000 : 300000); }
    await saveHeader();
  },
  async unlock(pw) {
    const li = this.lockInfo();
    if (li.wait > 0) return { ok: false, ...li };
    let raw;
    try { raw = await unwrapRaw(pw, H.pw); } catch { await this._fail(); return { ok: false, ...this.lockInfo(), wrong: true }; }
    H.lock = { fails: 0, until: 0 }; await saveHeader();
    await this._open(raw, pw);
    return { ok: true };
  },
  async openPlain() { await this._open(null, null); },
  async _open(raw, pw) {
    DB._rawDK = raw; DB._dk = raw ? await importDK(raw) : null; DB._pw = pw;
    const data = await KV.get('data');
    if (data == null) { loadDataObj({}); }
    else if (typeof data === 'string') loadDataObj(JSON.parse(data));
    else loadDataObj(JSON.parse(TD.decode(await aesDec(DB._dk, data))));
    DB.unlocked = true;
    purgeOldTrash();
  },
  async verifyPw(pw) { try { await unwrapRaw(pw, H.pw); return true; } catch { return false; } },
  async changePw(newPw) { H.pw = await wrapRaw(newPw, DB._rawDK); H.pinLen = newPw.length; DB._pw = newPw; await saveHeader(); },
  async lockNow() {
    clearTimeout(_saveTimer);
    await flushSave();
    DB.records = []; DB.columns = defaultColumns(); DB.draft = null; DB._dk = null; DB._rawDK = null; DB._pw = null;
    DB._byUuid = null; DB._invMap = null; DB.unlocked = false;
  },
};

// ---------- records ----------
function byUuid() {
  if (!DB._byUuid) { DB._byUuid = new Map(); for (const r of DB.records) DB._byUuid.set(r.uuid, r); }
  return DB._byUuid;
}
function touch(r) {
  r.vv = r.vv || {}; r.vv[H.deviceId] = (r.vv[H.deviceId] || 0) + 1; r.ts = Date.now(); r._s = null;
}
const isLive = r => !r.del && !r.purged;
function liveRecords() { return DB.records.filter(isLive); }
function maxId() { let m = 0; for (const r of DB.records) if (r.id > m) m = r.id; return m; }
function searchKey(r) { return r._s || (r._s = norm(`${r.inv || ''} ${r.title || ''} ${r.author || ''}`)); }
function invKey(s) { return norm(s).replace(/\s+/g, ''); }
function invMap() {
  if (DB._invMap && DB._invRev === DB.rev) return DB._invMap;
  const m = new Map();
  for (const r of DB.records) if (isLive(r) && r.inv) { const k = invKey(r.inv); if (!m.has(k)) m.set(k, r); }
  DB._invMap = m; DB._invRev = DB.rev; return m;
}
function findByInv(inv, exceptUuid) {
  const r = invMap().get(invKey(inv));
  return r && r.uuid !== exceptUuid ? r : null;
}
function nameKey(r) { return norm(r.title || '') + '|' + norm(r.author || ''); }
function nameMap() {
  if (DB._nameMap && DB._nameRev === DB.rev) return DB._nameMap;
  const m = new Map();
  for (const r of DB.records) if (isLive(r)) { const k = nameKey(r); if (!m.has(k)) m.set(k, r); }
  DB._nameMap = m; DB._nameRev = DB.rev; return m;
}
function findByName(title, author, exceptUuid) {
  if (norm(title).length < 2) return null;
  const r = nameMap().get(norm(title) + '|' + norm(author || ''));
  return r && r.uuid !== exceptUuid ? r : null;
}
function newRecord(vals, created, forcedId) {
  const r = { uuid: uuid(), id: forcedId || maxId() + 1, created: created || Date.now(), del: 0, vv: {}, ts: 0 };
  for (const k of FIELD_KEYS) r[k] = k === 'scanned' ? false : '';
  Object.assign(r, vals); touch(r);
  DB.records.push(r); if (DB._byUuid) DB._byUuid.set(r.uuid, r);
  scheduleSave(); return r;
}
function updateRecord(r, vals) {
  Object.assign(r, vals); touch(r); scheduleSave();
}
function trashRecords(rs) { const now = Date.now(); for (const r of rs) { r.del = now; touch(r); } scheduleSave(); }
function restoreRecords(rs) { for (const r of rs) { r.del = 0; touch(r); } scheduleSave(); }
const PURGE_KEEP = ['uuid', 'id', 'created', 'del', 'vv', 'ts', 'purged'];
function purgeRecords(rs) {
  for (const r of rs) {
    for (const k of Object.keys(r)) if (!PURGE_KEEP.includes(k)) delete r[k];
    r.purged = true; r.del = r.del || Date.now(); touch(r);
  }
  scheduleSave();
}
function purgeOldTrash() {
  const lim = Date.now() - TRASH_DAYS * 86400000;
  const old = DB.records.filter(r => r.del && !r.purged && r.del < lim);
  if (old.length) purgeRecords(old);
}
function trashDaysLeft(r) { return Math.max(0, Math.ceil((r.del + TRASH_DAYS * 86400000 - Date.now()) / 86400000)); }
function nextInv(prev) {
  const m = /^(.*?)(\d+)(\D*)$/.exec(String(prev || '').trim());
  if (!m) return '';
  const n = String(Number(m[2]) + 1).padStart(m[2].length, '0');
  return m[1] + n + m[3];
}
function counts() {
  let total = 0, scanned = 0;
  for (const r of DB.records) if (isLive(r)) { total++; if (r.scanned) scanned++; }
  return { total, scanned };
}

// ---------- columns ----------
function visibleCols() { return DB.columns.filter(c => !c.del && !c.hidden); }
// phone list: ID, inventory number, title and scan flag by default; the user can toggle any column
const PHONE_DEFAULT = ['id', 'inv', 'title', 'scanned'];
function onPhone(c) { return c.ph !== undefined ? !!c.ph : PHONE_DEFAULT.includes(c.key); }
function liveCols() { return DB.columns.filter(c => !c.del); }
function colDef(key) { return DB.columns.find(c => c.key === key && !c.del); }
function builtinOf(key) { return BUILTIN_COLS.find(b => b.key === key); }
function colName(c, forCard) {
  const n = c.names;
  if (n) { const v = n[LANG] || n.ru || n.tk || n.en; if (v) return v; }
  const b = builtinOf(c.key);
  if (b) return t(forCard && b.card ? b.card : b.i18n);
  return c.key;
}
function colStamp() { DB.colsTs = Date.now(); }
function addColumn({ names, kind, opts, afterKey }) {
  const key = 'c_' + uuid().slice(0, 8);
  const def = { key, b: 0, kind, names, hidden: false, opts: opts || [], mts: Date.now() };
  const live = DB.columns;
  let idx = live.length;
  if (afterKey === '__start') idx = 1;
  else if (afterKey) { const i = live.findIndex(c => c.key === afterKey); if (i >= 0) idx = i + 1; }
  live.splice(idx, 0, def); colStamp(); scheduleSave(); return def;
}
function moveColumn(key, dir) {
  const arr = DB.columns; const vis = arr.filter(c => !c.del);
  const i = vis.findIndex(c => c.key === key); const j = i + dir;
  if (i <= 0 || j <= 0 || j >= vis.length) return; // id stays first
  const a = arr.indexOf(vis[i]), b = arr.indexOf(vis[j]);
  [arr[a], arr[b]] = [arr[b], arr[a]]; colStamp(); scheduleSave();
}
function deleteColumn(key) {
  const c = DB.columns.find(c => c.key === key); if (!c || c.b) return;
  c.del = 1; c.mts = Date.now(); c.names = null; c.opts = [];
  for (const r of DB.records) delete r[key];
  colStamp(); scheduleSave();
}
function cellText(c, r) {
  const v = r[c.key];
  switch (c.kind) {
    case 'id': return r.id;
    case 'check': return v ? '✓' : '';
    case 'number': return v === '' || v == null ? '' : (typeof v === 'number' ? fmtNum(v) : String(v));
    case 'date': return fmtDate(v);
    case 'type': return v ? t('type_' + v) : '';
    default: return v ?? '';
  }
}
const KINDS = ['text', 'number', 'check', 'list', 'date'];
const KIND_LABEL = { text: 'type_text', number: 'type_number', check: 'type_check', list: 'type_list', date: 'type_date' };

// ---------- sync / merge helpers (version vectors) ----------
function vvCmp(a, b) {
  a = a || {}; b = b || {};
  let aGE = true, bGE = true;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k] || 0, y = b[k] || 0;
    if (x < y) aGE = false; if (y < x) bGE = false;
  }
  if (aGE && bGE) return 0;   // equal
  if (aGE) return 1;          // a dominates
  if (bGE) return -1;         // b dominates
  return 2;                   // concurrent
}
function vvJoin(a, b) { const o = { ...(a || {}) }; for (const k in (b || {})) o[k] = Math.max(o[k] || 0, b[k]); return o; }
function renumberIds() {
  const sorted = DB.records.slice().sort((x, y) => (x.created - y.created) || (x.uuid < y.uuid ? -1 : 1));
  let changed = 0, i = 1;
  for (const r of sorted) { if (r.id !== i && r.id != null) changed++; r.id = i++; }
  DB._byUuid = null; return changed;
}
