const staticNNHSCoffe = "nnhs-coffee-site-v1";
const assets = [
  "/",
  "/auth.ejs",
  "js/auth2.js",
  "/img/huskie.jpg",
  "/assets/models/NNHS-logo.png",
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
