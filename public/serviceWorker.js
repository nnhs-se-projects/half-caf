const staticNNHSCoffe = "nnhs-coffee-site-v1";
const assets = [
  "/",
  "/add-to-home.html",
  "/manifest.json",
  "/test-icon.png",
  "/assets/js/auth2.js",
  "/css/styles.css",
];

self.addEventListener("install", (installEvent) => {
  installEvent.waitUntil(
    caches.open(staticNNHSCoffe).then((cache) => {
      cache.addAll(assets);
    })
  );
  self.skipWaiting(); // Ensure the newest service worker activates immediately.
});

// New activate event to clean up old caches.
self.addEventListener("activate", (activateEvent) => {
  activateEvent.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== staticNNHSCoffe) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all clients that a new version is available.
        return self.clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then((clients) => {
            clients.forEach((client) =>
              client.postMessage({ type: "NEW_VERSION_AVAILABLE" })
            );
          });
      })
  );
});

self.addEventListener("fetch", (fetchEvent) => {
  const requestUrl = new URL(fetchEvent.request.url);
  if (!assets.includes(requestUrl.pathname)) {
    fetchEvent.respondWith(fetch(fetchEvent.request));
    return;
  }
  fetchEvent.respondWith(
    caches
      .match(fetchEvent.request)
      .then((res) => res || fetch(fetchEvent.request))
  );
});

self.addEventListener("message", (event) => {
  const { title, options } = event.data;
  if (title) {
    self.registration.showNotification(title, options);
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notifications") {
    event.waitUntil(
      fetch("/notifications")
        .then((res) => res.json())
        .then((notifications) => {
          notifications.forEach((note) => {
            self.registration.showNotification(note.type, {
              body: note.message,
              icon: "/img/Half_Caf_Logo_(1).png",
            });
          });
        })
        .catch((err) => console.error("Sync fetch error:", err))
    );
  }
});
