// Service Worker for TREAD PWA
const CACHE_NAME = 'tread-v2';
const urlsToCache = [
  '/TREAD/',
  '/TREAD/index.html',
  '/TREAD/css/style.css',
  '/TREAD/js/script.js',
  '/TREAD/js/gradient.js',
  '/TREAD/js/prompts.js',
  '/TREAD/js/collage.js',
  '/TREAD/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});