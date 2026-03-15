const CACHE_VERSION = "v0.1.3";
const STATIC_CACHE = `mushaf-static-${CACHE_VERSION}`;
const AUDIO_RECITATION_CACHE = `mushaf-recitation-${CACHE_VERSION}`;
const AUDIO_WORD_CACHE = `mushaf-word-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  `./css/styles.css?v=${CACHE_VERSION}`,
  `./css/tailwind-output.css?v=${CACHE_VERSION}`,
  `./js/app.js?v=${CACHE_VERSION}`,
  `./js/utils.js?v=${CACHE_VERSION}`,
  `./js/config.js?v=${CACHE_VERSION}`,
  `./js/render.js?v=${CACHE_VERSION}`,
  `./js/i18n.js?v=${CACHE_VERSION}`,
  `./js/actions.js?v=${CACHE_VERSION}`,
  `./manifest.json?v=${CACHE_VERSION}`,
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Outfit:wght@300;400;600&display=swap",
];

// Helper to limit cache size
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete oldest (FIFO)
    await cache.delete(keys[0]);
    // Note: We don't recurse here to keep it simple, 
    // it will eventually trim down on subsequent fetches.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isMp3 = url.pathname.endsWith(".mp3");
  const isWordAudio = isMp3 && url.pathname.includes("/assets/audio/");
  const isRecitation = isMp3 && !isWordAudio;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        
        if (isWordAudio) {
          caches.open(AUDIO_WORD_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
            trimCache(AUDIO_WORD_CACHE, 300); // Cache up to 300 words (~20MB)
          });
        } else if (isRecitation) {
          caches.open(AUDIO_RECITATION_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
            trimCache(AUDIO_RECITATION_CACHE, 20); // Cache up to 20 recitations (~30MB)
          });
        } else {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [STATIC_CACHE, AUDIO_RECITATION_CACHE, AUDIO_WORD_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
