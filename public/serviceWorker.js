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

self.addEventListener("sync", (event) => {
  if (event.tag === "mobileNotifications") {
    event.waitUntil(handleMobileNotifications());
  }
});

async function handleMobileNotifications() {
  try {
    // Fetch notifications from the server endpoint (implement this endpoint on your server)
    const response = await fetch("/mobileNotifications");
    if (response.ok) {
      const notifications = await response.json();
      notifications.forEach((notif) => {
        self.registration.showNotification(notif.title, notif.options);
      });
    }
  } catch (error) {
    console.error("Mobile notifications sync failed:", error);
  }
}
