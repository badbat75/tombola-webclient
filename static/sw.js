// Basic service worker for the Tombola Web App
const CACHE_NAME = 'tombola-web-v1';
const urlsToCache = [
  '/',
  '/app.css',
  // Add other static assets as needed
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests for our domain
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http://localhost:5173')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
