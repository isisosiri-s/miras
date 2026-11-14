'use strict';
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path'), fs = require('fs');

// Database lives in ONE file next to user data: %APPDATA%/Miras/miras-db.json
const dbFile = () => path.join(app.getPath('userData'), 'miras-db.json');
let store = null, writing = Promise.resolve();
function load() {
  if (store) return store;
  try { store = JSON.parse(fs.readFileSync(dbFile(), 'utf8')); } catch { store = {}; }
  return store;
}
function persist() {
  const data = JSON.stringify(store), f = dbFile(), tmp = f + '.tmp';
  writing = writing.then(() => fs.promises.writeFile(tmp, data).then(() => fs.promises.rename(tmp, f))).catch(e => console.error(e));
  return writing;
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

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 420, minHeight: 600,
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
  win.loadFile(path.join(__dirname, '../www/index.html'));
}
const lock = app.requestSingleInstanceLock();
if (!lock) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
