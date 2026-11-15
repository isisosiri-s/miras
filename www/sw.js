/* Miras service worker: web/PWA only. Network-first so a new version is never hidden by an old cache. */
const V = 'miras-' + '1.1.17';
const FILES = ['./', 'index.html', 'style.css', 'i18n.js', 'core.js', 'io.js', 'native.js', 'ui.js', 'ui2.js', 'ui3.js', 'app.js', 'vendor/xlsx.full.min.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { if (r && r.ok) { const c = r.clone(); caches.open(V).then(ch => ch.put(e.request, c)).catch(() => { }); } return r; }).catch(() => caches.match(e.request)));
});
