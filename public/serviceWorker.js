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

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Notification";
  const options = data.options || {};
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "notifications-sync") {
    event.waitUntil(
      (async () => {
        try {
          // Replace '/notifications' with your actual endpoint that returns notification data
          const response = await fetch("/notifications");
          if (!response.ok) throw new Error("Network response was not ok");
          const notifications = await response.json();
          notifications.forEach((notification) => {
            self.registration.showNotification(
              notification.title,
              notification.options
            );
          });
        } catch (err) {
          console.error("Periodic sync failed:", err);
        }
      })()
    );
  }
});
