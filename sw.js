// Cache version is bumped automatically on every deploy via build-time replacement.
// The token __BUILD_HASH__ gets replaced by `npm run build:css` (or any build step)
// with the current git short-hash. Falls back to a date-based version locally.
const BUILD_HASH = '796ee9b';
const CACHE_NAME = 'frame-' + (BUILD_HASH.startsWith('__') ? new Date().toISOString().slice(0, 10) : BUILD_HASH);
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/output.css',
  './js/app.js',
  './manifest.json',
  './img/favicon.svg'
];

// Install: pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache Firebase Realtime Database responses (contain auth tokens in URL)
  if (url.hostname.includes('firebasedatabase.app')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-only for other external API calls
  if (url.origin !== location.origin || event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for JSON data files (always fresh)
  if (url.pathname.match(/\.json$/)) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for CSS, JS, images
  if (url.pathname.match(/\.(css|js|png|jpg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first for HTML / navigation
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
