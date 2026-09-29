const CACHE = 'planner-v8';
const FILES = ['./', './index.html', './app.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Свои файлы: сначала сеть (всегда свежий код), при отсутствии интернета — кэш.
// Внешние (Tailwind CDN): сначала кэш, фоном обновляем.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === self.location.origin;
  const store = res => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return res; };
  if (same) {
    e.respondWith(fetch(e.request).then(store).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(store)));
    e.waitUntil(fetch(e.request).then(store).catch(() => {}));
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list =>
    list.length ? list[0].focus() : clients.openWindow('./index.html')));
});
