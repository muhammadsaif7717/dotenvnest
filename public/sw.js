self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// A minimal fetch listener is required by some browsers (like Chrome) to trigger the PWA install prompt.
self.addEventListener("fetch", (event) => {
  // We don't cache anything to ensure the app is always up-to-date,
  // but intercepting the fetch fulfills the PWA criteria.
});
