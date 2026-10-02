/* Service worker: يخزّن ملفات الواجهة فقط. لا يلمس أي طلب لقاعدة البيانات (Supabase) أو غيره من الدومينات. */
const CACHE = 'fs-shell-v6';
const SHELL = ['./', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'fs-img-v1').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {                 // Supabase / CDN / الخطوط: مباشرة من الشبكة، ما عدا الصور (كروت السلامة) نحفظها للعرض بدون نت
    if (req.destination === 'image') {
      e.respondWith(caches.open('fs-img-v1').then(c => c.match(req).then(hit => {
        const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })));
    }
    return;
  }
  e.respondWith(
    fetch(req).then(res => {                            // الشبكة أولاً عشان التحديثات تظهر فوراً
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./')))
  );
});
