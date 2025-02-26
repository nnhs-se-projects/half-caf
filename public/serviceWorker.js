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

self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error("Push event data error:", error);
      data = {};
    }
  }
  const title = data.title || "New Notification";
  const options = data.options || {
    body: "You have a new message.",
    icon: "/img/Half_Caf_Logo_(1).png",
    vibrate: [100, 50, 100],
  };
  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.error("showNotification error:", err);
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  // Optionally focus or open a window
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    })
  );
});
