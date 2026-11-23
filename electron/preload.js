'use strict';
const { ipcRenderer } = require('electron');
const B64 = u8 => Buffer.from(u8).toString('base64');
const enc = v => v instanceof Uint8Array ? { __u8: B64(v) } : v;
const dec = v => v && typeof v === 'object' && typeof v.__u8 === 'string' ? new Uint8Array(Buffer.from(v.__u8, 'base64')) : v;
window.GaznaLan = {
  start: () => ipcRenderer.invoke('lan:start'),
  stop: () => ipcRenderer.invoke('lan:stop'),
  onRequest: fn => ipcRenderer.on('lan:req', async (_e, { id, text }) => { let r; try { r = await fn(text); } catch (_) { r = { status: 500, body: '' }; } ipcRenderer.send('lan:res', { id, r }); }),
  onEvent: fn => ipcRenderer.on('lan:event', (_e, ev) => fn(ev)),
};
window.GaznaNative = {
  kind: 'pc',
  kvGet: async k => dec(await ipcRenderer.invoke('kv:get', k)),
  kvSet: (k, v) => ipcRenderer.invoke('kv:set', k, enc(v)),
  saveFile: async (name, blob) => ipcRenderer.invoke('file:save', name, new Uint8Array(await blob.arrayBuffer())),
  setProtect: on => ipcRenderer.invoke('protect', on),
};
