'use strict';
// Miras Wi-Fi sync server (runs in the Windows app). It only relays encrypted text to the app window;
// the 6-digit code is the encryption key, so nothing readable travels over the network.
const http = require('http'), os = require('os'), crypto = require('crypto');

const PORT = 47653, MAX_BODY = 300 * 1024 * 1024, IDLE_MS = 15 * 60 * 1000;

function localIps() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) {
    if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  }
  return out;
}
const newCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

// onRequest(text) -> Promise<{status, body}>; resolves after the app window has merged the data
function startServer(onRequest, onEvent) {
  const st = { fails: 0, until: 0, total: 0 };
  let idle = null, server = null;
  const emit = (type, extra) => { try { onEvent && onEvent({ type, ...extra }); } catch (_) { /* ignore */ } };
  const bump = () => { clearTimeout(idle); idle = setTimeout(() => stop('idle'), IDLE_MS); };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
  const send = (res, status, body, type) => { res.writeHead(status, { ...cors, 'Content-Type': type || 'text/plain; charset=utf-8' }); res.end(body); };

  server = http.createServer((req, res) => {
    bump();
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (req.method === 'GET' && req.url === '/hello') return send(res, 200, JSON.stringify({ app: 'miras', lan: 1 }), 'application/json');
    if (req.method === 'POST' && req.url === '/sync') {
      if (Date.now() < st.until) return send(res, 429, 'wait');
      const chunks = []; let size = 0, dead = false;
      req.on('data', c => { size += c.length; if (size > MAX_BODY) { dead = true; send(res, 413, 'big'); req.destroy(); } else chunks.push(c); });
      req.on('end', async () => {
        if (dead) return;
        try {
          const r = await onRequest(Buffer.concat(chunks).toString('utf8'));
          if (r.status === 403) {
            st.fails++;
            if (st.fails >= 10) { send(res, 403, 'bad'); return stop('fails'); }
            if (st.fails % 3 === 0) st.until = Date.now() + 60000;
            emit('bad');
          } else if (r.status === 200) { st.fails = 0; st.total++; emit('ok', { total: st.total }); }
          send(res, r.status, r.body || '');
        } catch (e) { send(res, 500, 'err'); }
      });
      req.on('error', () => { /* client left */ });
      return;
    }
    send(res, 404, 'no');
  });
  server.on('error', e => emit('error', { message: String(e && e.code || e) }));
  let stopped = false;
  function stop(why) {
    if (stopped) return; stopped = true; clearTimeout(idle);
    try { server.close(); server.closeAllConnections && server.closeAllConnections(); } catch (_) { /* ignore */ }
    emit('stopped', { why });
  }
  return new Promise(resolve => {
    server.once('error', e => resolve({ error: String(e && e.code || e) }));
    server.listen(PORT, '0.0.0.0', () => {
      bump();
      resolve({ port: PORT, urls: localIps().map(ip => `http://${ip}:${PORT}`), stop });
    });
  });
}

module.exports = { startServer, newCode, localIps, PORT };
