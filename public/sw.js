// CompliScan Service Worker
// Enables standalone PWA background priority and keeps mobile network sockets responsive

const CACHE_NAME = 'compliscan-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Never cache or intercept dynamic API calls or upload requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first strategy for app shell
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
