/* Service worker: يخزّن ملفات الواجهة فقط. لا يلمس أي طلب لقاعدة البيانات (Supabase) أو غيره من الدومينات. */
const CACHE = 'fs-shell-v3';
const SHELL = ['./', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // Supabase / CDN / الخطوط: مباشرة من الشبكة
  e.respondWith(
    fetch(req).then(res => {                            // الشبكة أولاً عشان التحديثات تظهر فوراً
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./')))
  );
});
