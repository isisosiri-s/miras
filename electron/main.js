'use strict';
// ---- startup log: written FIRST so a silent failure on an old Windows can be diagnosed ----
const os = require('os');
// log lives in the program's data folder (%APPDATA%/Miras) next to the database, not on the desktop; the old places are only fallbacks
const LOG_DIRS = [process.env.APPDATA && require('path').join(process.env.APPDATA, 'Miras'), process.env.PORTABLE_EXECUTABLE_DIR, os.tmpdir()].filter(Boolean);
function log(...a) {
  const fs = require('fs'), line = new Date().toISOString() + ' ' + a.map(x => (x && x.stack) || (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ') + '\n';
  for (const d of LOG_DIRS) {
    try {
      fs.mkdirSync(d, { recursive: true });
      const f = require('path').join(d, 'miras-log.txt');
      try { if (fs.statSync(f).size > 200 * 1024) fs.renameSync(f, f + '.old'); } catch (_) { /* no log yet */ }
      fs.appendFileSync(f, line); return;
    } catch (_) { /* next dir */ }
  }
}
process.on('uncaughtException', e => { log('uncaughtException', e); });
process.on('unhandledRejection', e => { log('unhandledRejection', e); });
log('--- start', 'miras electron', process.versions.electron, 'chrome', process.versions.chrome, 'node', process.versions.node, '| win', os.release(), process.arch, '| argv', process.argv.join(' '));
const { app, BrowserWindow, ipcMain, dialog, Menu, screen } = require('electron');
const path = require('path'), fs = require('fs');

// Database lives in ONE file next to user data: %APPDATA%/Miras/miras-db.json
// Safety net: a daily backup (last 3 kept) and, if the file is ever unreadable, it is moved aside (never overwritten)
// and the newest good backup is restored.
const dbFile = () => path.join(app.getPath('userData'), 'miras-db.json');
const BACKUPS_KEEP = 3;
let store = null, writing = Promise.resolve(), backupDay = '', notice = null;
const dayStr = () => process.env.MIRAS_TEST_DAY || new Date().toISOString().slice(0, 10).replace(/-/g, '');
const listBackups = () => { try { return fs.readdirSync(app.getPath('userData')).filter(n => /^miras-db\.bak-\d{8}\.json$/.test(n)).sort().reverse(); } catch { return []; } };
function load() {
  if (store) return store;
  const f = dbFile();
  let raw = null, missing = false; try { raw = fs.readFileSync(f, 'utf8'); } catch (e) { missing = !!(e && e.code === 'ENOENT'); }
  if (missing) { store = {}; return store; } // first run
  if (raw === null) raw = '';
  try { store = JSON.parse(raw); if (!store || typeof store !== 'object') throw new Error('bad'); return store; } catch { /* unreadable: handled below */ }
  const bad = path.join(app.getPath('userData'), 'miras-db.corrupt-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  try { fs.renameSync(f, bad); } catch { /* ignore */ }
  store = {}; notice = { bad, from: null };
  for (const n of listBackups()) {
    try { const o = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), n), 'utf8')); if (o && typeof o === 'object') { store = o; notice.from = n; break; } } catch { /* try the next one */ }
  }
  if (notice.from) { try { fs.writeFileSync(f, JSON.stringify(store)); } catch { /* ignore */ } }
  return store;
}
function showNotice() {
  if (!notice) return; const n = notice; notice = null;
  const win = BrowserWindow.getAllWindows()[0];
  const d = n.from ? n.from.slice(13, 17) + '-' + n.from.slice(17, 19) + '-' + n.from.slice(19, 21) : '';
  const msg = n.from
    ? `База данных была повреждена и восстановлена из резервной копии от ${d}. Правки после этой даты могли не сохраниться.\n\nMaglumat bazasy zeperlenipdi we ${d} senesindäki nusgadan dikeldildi. Şondan soňky üýtgeşmeler ýitip bilerdi.\n\nThe database was damaged and restored from the backup of ${d}. Changes after that date may be lost.\n\n${n.bad}`
    : `База данных повреждена, резервной копии нет. Приложение запущено с пустой базой. Восстановите данные из копии (Импорт и экспорт) или синхронизацией.\n\nMaglumat bazasy zeperlenipdi, nusga ýok. Programma boş baza bilen açyldy. Maglumatlary nusgadan (Import we eksport) ýa-da sinhronlaşdyrma arkaly dikeldiň.\n\nThe database is damaged and there is no backup; starting empty. Restore from a backup (Import and export) or by syncing.\n\n${n.bad}`;
  dialog.showMessageBox(win || undefined, { type: n.from ? 'warning' : 'error', title: 'Miras', message: msg }).catch(() => {});
}
function dailyBackup() {
  const day = dayStr(); if (backupDay === day) return; backupDay = day;
  const f = dbFile(), dir = app.getPath('userData');
  try {
    if (!fs.existsSync(f)) return;
    fs.copyFileSync(f, path.join(dir, `miras-db.bak-${day}.json`));
    for (const n of listBackups().slice(BACKUPS_KEEP)) { try { fs.unlinkSync(path.join(dir, n)); } catch { /* ignore */ } }
  } catch (e) { console.error(e); }
}
// rename over the old file; antivirus / indexer may hold it for a moment on Windows (EPERM/EBUSY/EACCES): retry briefly
async function renameRetry(a, b) {
  for (let i = 0; ; i++) {
    try { return await fs.promises.rename(a, b); } catch (e) {
      if (i >= 6 || !['EPERM', 'EBUSY', 'EACCES'].includes(e && e.code)) throw e;
      await new Promise(r => setTimeout(r, 80 * (i + 1)));
    }
  }
}
function persist() {
  try { dailyBackup(); } catch (e) { log('daily backup failed', e); } // copies the last good file once a day, before it is overwritten
  const data = JSON.stringify(store), f = dbFile(), tmp = f + '.tmp';
  const job = writing.then(() => fs.promises.writeFile(tmp, data)).then(() => renameRetry(tmp, f));
  writing = job.catch(() => { }); // keep the queue alive for the next write
  // the failure goes back to the window (kv:set rejects) so the user is told the data was NOT saved
  return job.catch(e => { log('db write failed', e); throw e; });
}
ipcMain.handle('kv:get', (_e, k) => load()[k] ?? null);
ipcMain.handle('kv:set', (_e, k, v) => { load()[k] = v; return persist(); });
ipcMain.handle('file:save', async (e, name, bytes) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showSaveDialog(win, { defaultPath: name });
  if (r.canceled || !r.filePath) return false;
  await fs.promises.writeFile(r.filePath, Buffer.from(bytes));
  return true;
});
ipcMain.handle('protect', (e, on) => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.setContentProtection(!!on); });

// ---- Wi-Fi sync: the server only relays encrypted text to the window, which merges the data ----
const lan = require('./lan');
let lanSrv = null, lanSeq = 0; const lanPending = new Map();
ipcMain.on('lan:res', (_e, { id, r }) => { const p = lanPending.get(id); if (p) { lanPending.delete(id); p(r); } });
ipcMain.handle('lan:start', async e => {
  if (lanSrv) { try { lanSrv.stop('restart'); } catch (_) { /* ignore */ } lanSrv = null; }
  const sender = e.sender, code = lan.newCode();
  const s = await lan.startServer(text => new Promise(resolve => {
    const id = ++lanSeq, to = setTimeout(() => { lanPending.delete(id); resolve({ status: 504, body: '' }); }, 180000);
    lanPending.set(id, r => { clearTimeout(to); resolve(r); });
    if (sender.isDestroyed()) return resolve({ status: 503, body: '' });
    sender.send('lan:req', { id, text });
  }), ev => { if (!sender.isDestroyed()) sender.send('lan:event', ev); });
  if (s.error) return { error: s.error };
  lanSrv = s; return { code, port: s.port, urls: s.urls };
});
ipcMain.handle('lan:stop', () => { if (lanSrv) { lanSrv.stop('user'); lanSrv = null; } return true; });

function createWindow() {
  const wa = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: Math.min(1280, wa.width), height: Math.min(820, wa.height), minWidth: Math.min(960, wa.width), minHeight: Math.min(600, wa.height),
    backgroundColor: '#F6F1E9', title: 'Miras', icon: path.join(__dirname, '../www/icon-512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false, nodeIntegration: false, sandbox: false, // only local trusted files are loaded
      spellcheck: false,
    },
  });
  win.setContentProtection(true); // default ON; the app switch can change it
  Menu.setApplicationMenu(null);
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('did-fail-load', (_e, c, d) => log('did-fail-load', c, d));
  win.on('closed', () => log('window closed'));
  win.loadFile(path.join(__dirname, '../www/index.html'));
  log('window created');
  win.webContents.once('did-finish-load', () => { log('page loaded'); load(); showNotice(); }); // surface a database problem right away
}
app.disableHardwareAcceleration(); // old GPU drivers / Windows builds: software rendering is plenty for this UI
app.on('child-process-gone', (_e, d) => log('child-process-gone', d));
app.on('render-process-gone', (_e, _w, d) => log('render-process-gone', d));
const lock = app.requestSingleInstanceLock();
log('single-instance lock', lock);
if (!lock) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(() => { log('ready'); createWindow(); }).catch(e => log('ready failed', e));
  app.on('window-all-closed', () => app.quit());
}
