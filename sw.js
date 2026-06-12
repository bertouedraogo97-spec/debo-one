// ════════════════════════════════════════════════════════
// 🌸 Debo-One · Service Worker
// © 2026 Ouedraogo Namketa Omar Bertrand
// ════════════════════════════════════════════════════════

const CACHE_NAME = 'debo-one-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ─── INSTALL : mise en cache des ressources ───────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE : nettoyage des anciens caches ──────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH : Cache-first, réseau en fallback ──────────
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Ignorer les requêtes chrome-extension et autres protocoles
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Pas en cache → réseau
      return fetch(event.request)
        .then(response => {
          // Ne pas mettre en cache les réponses invalides
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          // Mettre en cache pour la prochaine fois
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
          return response;
        })
        .catch(() => {
          // Hors ligne et pas en cache → page offline si HTML
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
