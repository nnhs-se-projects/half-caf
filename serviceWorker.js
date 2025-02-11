const staticNNHSCoffe = "nnhs-coffee-site-v1";
const assets = [
  "/",
  "/auth",
  "/manifest.json",
  "/assets/models/NNHS-logo.png",
  "/js/auth2.js",
  "/css/styles.css",
];

self.addEventListener("install", (installEvent) => {
  installEvent.waitUntil(
    caches.open(staticNNHSCoffe).then((cache) => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", (fetchEvent) => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((res) => {
      return res || fetch(fetchEvent.request);
    })
  );
});
