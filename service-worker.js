/**
 * @file service-worker.js
 * @description Service Worker for caching static assets and audio recitations
 */

// Cache version - hardcoded since ServiceWorker runs in isolated context
const CACHE_VERSION = "v0.1.7";
const STATIC_CACHE = `mushaf-static-${CACHE_VERSION}`;
const AUDIO_RECITATION_CACHE = `mushaf-recitation-${CACHE_VERSION}`;
const AUDIO_WORD_CACHE = `mushaf-word-${CACHE_VERSION}`;

// Maximum cache sizes - hardcoded since ServiceWorker runs in isolated context
const MAX_WORDS_CACHE = 300; // ~20MB for word audio
const MAX_RECITATIONS_CACHE = 20; // ~30MB for recitations

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

// CACHING CONFIGURATION
const CACHE_CONFIG = {
  QUOTA_WARNING_THRESHOLD: 0.85, // 85% of quota triggers cleanup
  MAX_CACHE_AGE_DAYS: 30, // Remove caches older than 30 days
};

/**
 * Cache Statistics & Monitoring
 */
async function getCacheStats() {
  try {
    const results = await Promise.all([
      caches.match({}, CACHE_CONFIG.QUOTA_WARNING_THRESHOLD) || {},
    ]);
    return results[0];
  } catch (err) {
    console.warn("[ServiceWorker] Cache stats failed:", err);
    return null;
  }
}

/**
 * Advanced cache cleanup with LRU eviction strategy
 */
async function cleanupCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length <= MAX_WORDS_CACHE) return false;
  
  // Sort by fetch time (oldest first) using request.time property
  keys.sort((a, b) => {
    const dateA = new URL(a.url).searchParams.get("time") || 0;
    const dateB = new URL(b.url).searchParams.get("time") || 0;
    return dateA - dateB;
  });
  
  // Delete oldest entries above threshold, keeping maxItems most recent
  let deletedCount = 0;
  for (const [index, key] of keys.entries()) {
    if (deletedCount >= Math.max(0, keys.length - MAX_WORDS_CACHE)) {
      break;
    }
    await cache.delete(key);
    deletedCount++;
  }
  
  return deletedCount > 0;
}

/**
 * Periodic cache cleanup routine - runs on activation and periodically afterward
 */
async function runPeriodicCleanup() {
  const cachesToCleanup = [
    { name: AUDIO_WORD_CACHE, max: MAX_WORDS_CACHE },
    { name: AUDIO_RECITATION_CACHE, max: MAX_RECITATIONS_CACHE },
  ];

  for (const { name, max } of cachesToCleanup) {
    await cleanupCache(name);
  }
  
  // Clean up stale versioned caches older than MAX_CACHE_AGE_DAYS
  const allCaches = await caches.keys();
  const now = Date.now();
  const thirtyDaysMs = CACHE_CONFIG.MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
  
  for (const cacheName of allCaches) {
    const matchPattern = new RegExp(`mushaf-\\w+-${CACHE_VERSION.replace(/[^a-zA-Z0-9.-]/g, '')}`);
    if (!matchPattern.test(cacheName)) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const key of keys) {
          const url = new URL(key.url);
          // Check request time if available
          const requestTimeParam = url.searchParams.get("time");
          let requestDate = null;
          
          if (requestTimeParam) {
            requestDate = new Date(parseInt(requestTimeParam));
          } else {
            // Fallback to cache modification time
            try {
              // Not directly available, skip timestamp check for old requests
            } catch (e) {}
          }
          
          // Skip deleting if within age limit
          if (!requestDate || (now - requestDate.getTime() < thirtyDaysMs)) {
            await cache.delete(key);
          }
        }
      } catch (err) {
        console.warn(`[SW] Failed to cleanup ${cacheName}:`, err);
      }
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await cache.addAll(ASSETS_TO_CACHE);
      
      // Run initial cleanup on install
      const activeClients = await self.clients.matchAll();
      
      return Promise.all([
        cache.addAll(ASSETS_TO_CACHE),
        runPeriodicCleanup(),
      ]);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches from previous versions
      caches.keys().then((cacheNames) => {
        const validCaches = [STATIC_CACHE, AUDIO_RECITATION_CACHE, AUDIO_WORD_CACHE];
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]).then(() => {
      // Claim clients and run periodic cleanup
      return self.clients.claim().then(() => runPeriodicCleanup());
    }).catch(console.error)
  );
});

/**
 * Handles incoming messages
 */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data === "CLEAN_UP") {
    event.waitUntil(runPeriodicCleanup());
  }
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
            trimCache(AUDIO_WORD_CACHE, MAX_WORDS_CACHE); // Cache up to 300 words (~20MB)
          });
        } else if (isRecitation) {
          caches.open(AUDIO_RECITATION_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
            trimCache(AUDIO_RECITATION_CACHE, MAX_RECITATIONS_CACHE); // Cache up to 20 recitations (~30MB)
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
