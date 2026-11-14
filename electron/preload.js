'use strict';
const { ipcRenderer } = require('electron');
const B64 = u8 => Buffer.from(u8).toString('base64');
const enc = v => v instanceof Uint8Array ? { __u8: B64(v) } : v;
const dec = v => v && typeof v === 'object' && typeof v.__u8 === 'string' ? new Uint8Array(Buffer.from(v.__u8, 'base64')) : v;
window.MirasNative = {
  kind: 'pc',
  kvGet: async k => dec(await ipcRenderer.invoke('kv:get', k)),
  kvSet: (k, v) => ipcRenderer.invoke('kv:set', k, enc(v)),
  saveFile: async (name, blob) => ipcRenderer.invoke('file:save', name, new Uint8Array(await blob.arrayBuffer())),
  setProtect: on => ipcRenderer.invoke('protect', on),
};
