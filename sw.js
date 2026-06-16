const CACHE = 'lul-v6';
const STATIC = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Never cache: weather, map APIs, tile images
  if (url.includes('wttr.in') || url.includes('nominatim') || url.includes('openstreetmap')) return;

  // index.html — always network, never cache
  if (url.endsWith('/') || url.includes('index.html') || url.endsWith('leveluplife/')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(res => res).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static libs — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
