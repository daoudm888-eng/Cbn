const CACHE_NAME = 'swim-club-v1';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // للملفات الخارجية (مثل Firebase وjsQR): جرّب الشبكة أولاً، وإلا استعمل الكاش إن وُجد
  if (new URL(req.url).origin !== self.location.origin) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // لملفات التطبيق نفسه: الكاش أولاً لضمان العمل بدون إنترنت، مع تحديث بالخلفية
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkResp) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResp.clone()));
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
