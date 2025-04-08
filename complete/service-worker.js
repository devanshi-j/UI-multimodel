const CACHE_NAME = 'ar-model-cache-v1';
const FILES_TO_CACHE = [
  '../assets/models/chair/chair1/scene.gltf',
  '../assets/models/chair/chair2/scene.gltf',
  '../assets/models/chair/chair3/scene.gltf',
  '../assets/models/chair/chair4/scene.gltf',
  '../assets/models/chair/chair5/scene.gltf',
  '../assets/models/table/table1/scene.gltf',
  '../assets/models/table/table2/scene.gltf',
  '../assets/models/table/table3/scene.gltf',
  '../assets/models/table/table4/scene.gltf',
  '../assets/models/table/table5/scene.gltf',
  '../assets/models/sofa/sofa1/scene.gltf',
  '../assets/models/sofa/sofa2/scene.gltf',
  '../assets/models/sofa/sofa3/scene.gltf',
  '../assets/models/sofa/sofa4/scene.gltf',
  '../assets/models/sofa/sofa5/scene.gltf',
  '../assets/models/vase/vase1/scene.gltf',
  '../assets/models/vase/vase2/scene.gltf',
  '../assets/models/vase/vase3/scene.gltf',
  '../assets/models/vase/vase4/scene.gltf',
  '../assets/models/vase/vase5/scene.gltf',
  '../assets/models/rug/rug1/scene.gltf',
  '../assets/models/rug/rug2/scene.gltf',
  '../assets/models/rug/rug3/scene.gltf',
  '../assets/models/rug/rug4/scene.gltf',
  '../assets/models/rug/rug5/scene.gltf',
  '../assets/models/chair/chair1/scene.bin',
  '../assets/models/chair/chair2/scene.bin',
  '../assets/models/chair/chair3/scene.bin',
  '../assets/models/chair/chair4/scene.bin',
  '../assets/models/chair/chair5/scene.bin',
  '../assets/models/table/table1/scene.bin',
  '../assets/models/table/table2/scene.bin',
  '../assets/models/table/table3/scene.bin',
  '../assets/models/table/table4/scene.bin',
  '../assets/models/table/table5/scene.bin',
  '../assets/models/sofa/sofa1/scene.bin',
  '../assets/models/sofa/sofa2/scene.bin',
  '../assets/models/sofa/sofa3/scene.bin',
  '../assets/models/sofa/sofa4/scene.bin',
  '../assets/models/sofa/sofa5/scene.bin',
  '../assets/models/vase/vase1/scene.bin',
  '../assets/models/vase/vase2/scene.bin',
  '../assets/models/vase/vase3/scene.bin',
  '../assets/models/vase/vase4/scene.bin',
  '../assets/models/vase/vase5/scene.bin',
  '../assets/models/rug/rug1/scene.bin',
  '../assets/models/rug/rug2/scene.bin',
  '../assets/models/rug/rug3/scene.bin',
  '../assets/models/rug/rug4/scene.bin',
  '../assets/models/rug/rug5/scene.bin'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching assets');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
