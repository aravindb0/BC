/* Offline cache for Black Bulls Grimoire. Bump VERSION when you change any file. */
const VERSION = 'bb-grimoire-v3';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/style.css', './js/data.js', './js/pics.js', './js/app.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
  './fonts/cinzel-latin-600-normal.woff2', './fonts/cinzel-latin-800-normal.woff2',
  './fonts/rajdhani-latin-500-normal.woff2', './fonts/rajdhani-latin-600-normal.woff2', './fonts/rajdhani-latin-700-normal.woff2',
  './fonts/inter-latin-400-normal.woff2', './fonts/inter-latin-500-normal.woff2', './fonts/inter-latin-600-normal.woff2', './fonts/inter-latin-700-normal.woff2'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // Network-first for pages so updates arrive; cache-first for everything else.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); return r; })));
});
