const staticNNHSCoffe = "nnhs-coffee-site-v1";
const assets = [
  "/",
  "/add-to-home.html",
  "/manifest.json",
  "/assets/models/NNHS-logo.png",
  "/assets/js/auth2.js",
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
