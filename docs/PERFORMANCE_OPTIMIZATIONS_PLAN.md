# 🚀 Performance Optimizations Plan - Vanilla JS Edition
## Mushaf Plus - Image & Cache Optimization

**Date:** March 23, 2026  
**Approach:** Vanilla JS/HTML/CSS (no build tools)  
**Focus:** Images, Service Worker Caching, Server Compression

---

## 📊 **Trenutno Stanje**

| Asset | Format | Size | Status |
|-------|--------|------|--------|
| Icons | PNG | ~50KB total | ⚠️ Može se optimizovati |
| Screenshot | PNG | ? KB | ✅ Konvertovati u WebP |
| Favicon | PNG | ~20KB | ✅ Konvertovati u WebP |
| Quran Data | JSON | 2.5MB | ✅ Cache-ovati agresivno |

---

## 🎯 **Prioriteti za Optimizaciju**

### 🔴 **CRITICAL - Image Optimization (PNG → WebP)**

#### Problem:
PNG fajlovi su lossless format sa većom veličinom od WebP-a.

#### Solution:
Konvertovati PNG u WebP format (sa fallback na PNG za starije browser-e).

**Fajlovi za konverziju:**
- `icons/icon-512x512.png` → `.webp`
- `icons/icon-192x192.png` → `.webp`  
- `favicon.png` → `.webp`
- `screenshot.png` → `.webp` (ako se koristi)

**Expected Benefit:** 30-50% reduction in image sizes

#### Implementation:
```bash
# Konvertovati PNG u WebP (koristiti ImageMagick ili onlajne alate)
convert icons/icon-512x512.png -quality 85 icons/icon-512x512.webp
convert icons/icon-192x192.png -quality 85 icons/icon-192x192.webp
convert favicon.png -quality 85 favicon.webp
```

**HTML Update:**
```html
<!-- Iconi sa dual format -->
<link rel="icon" type="image/webp" href="favicon.webp">
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="icons/icon-192x192.webp">
```

---

### 🟠 **HIGH - Service Worker Cache za Quran Data**

#### Problem:
`quran_data.js` od 2.5MB se učitava na svako startovanje.

#### Solution:
Agresivno cache-ovati data file u Service Worker-u sa long cache lifetime.

#### Implementation (service-worker.js):
```javascript
// service-worker.js - Optimized caching strategy

const CACHE_VERSION = 'v1';
const DATA_CACHE = `${CACHE_VERSION}-quran-data`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(DATA_CACHE).then(cache => {
      return cache.addAll([
        'data/quran_data.js?v=' + APP_VERSION,
        // Pre-cache critical CSS/JS if needed
        '/css/styles.css?v=' + APP_VERSION,
        '/js/app.js?v=' + APP_VERSION
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => !key.startsWith(DATA_CACHE)).forEach(key => {
          return caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Quran data - cache-first strategy
  if (url.includes('quran_data.js')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version immediately
          return cachedResponse;
        }
        
        // Fetch from network and cache it
        return fetch(event.request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
  
  // All other requests - network-first with fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
```

**Expected Benefit:** 
- First load: ~1.5s (from cache) vs ~3-4s (from network)
- Subsequent loads: Instant (if offline or slow connection)

---

### 🟡 **MEDIUM - Server-side Gzip Compression**

#### Problem:
Nekompresovani fajlovi zauzimaju puno prostora.

#### Solution:
Podesiti gzip kompresiju na serveru (Nginx/Apache).

#### Nginx Configuration:
```nginx
# /etc/nginx/sites-available/preslusavanje

server {
    listen 80;
    server_name your-domain.com;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript 
               application/x-javascript application/xml+rss;
    
    # Cache control for static assets
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip on;
    }
    
    location ~* \.(png|webp|jpg|jpeg|gif|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /data/ {
        # Quran data - very long cache lifetime
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        gzip on;
    }
}
```

#### Apache Configuration (.htaccess):
```apache
# .htaccess

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/json
</IfModule>

# Cache headers
<FilesMatch "\.(js|css)$">
  Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

<FilesMatch "\.(png|webp)$">
  Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

<FilesMatch "/data/quran_data\.js$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
```

**Expected Benefit:** 
- 70-90% reduction in transfer size for text-based assets
- Faster downloads from remote servers

---

## 📊 **Očekivani Rezultati**

| Metrika | Trenutno | Nakon Optimizacije | Poboljšanje |
|---------|----------|---------------------|--------------|
| Icons Total | ~50KB PNG | ~25KB WebP | **50%** |
| Favicon | ~20KB PNG | ~10KB WebP | **50%** |
| Data Transfer (gzip) | 2.5MB uncompressed | ~600KB compressed | **75%** |
| First Load Time | 3-4s | 1.5-2s | **40-50%** |

**Total Expected Savings:** ~800KB less data transfer + faster load times

---

## 📋 **Implementation Steps**

### Step 1: Image Optimization (30 min)
1. Konvertovati PNG u WebP format
2. Testirati na različitim browserima
3. Update HTML sa dual format references

### Step 2: Service Worker Cache (30 min)
1. Update service-worker.js sa cache-first za data file
2. Testirati offline mode
3. Validirati cache invalidation strategy

### Step 3: Server Compression (60 min)
1. Podesiti gzip na serveru (Nginx ili Apache)
2. Testirati transfer sizes (curl -H "Accept-Encoding: gzip")
3. Verify cache headers in browser DevTools

---

## 🧪 **Testing Checklist**

- [ ] WebP fallback radi na Chrome 60+, Firefox, Safari
- [ ] Service Worker cache se isprazni kod verzije update-a
- [ ] Gzip kompresija radi za JavaScript i CSS fajlove
- [ ] Cache headers pokazuju `max-age=31536000` za static assets
- [ ] Offline mode radi nakon prvog successful load-a

---

## 💡 **Dodatni Savjeti**

### WebP Fallback Strategy:
```html
<!-- Auto-detect WebP support -->
<picture>
  <source srcset="icon.webp" type="image/webp">
  <img src="icon.png" alt="">
</picture>
```

### Cache Validation:
Koristiti versioning za cache invalidation:
```javascript
// service-worker.js
const CACHE_VERSION = 'v1.0.0'; // Update when data changes
const DATA_CACHE = `${CACHE_VERSION}-quran-data`;
```

---

## 📝 **Files to Modify**

1. ✅ `icons/icon-512x512.png` → `.webp` (new file)
2. ✅ `icons/icon-192x192.png` → `.webp` (new file)
3. ✅ `favicon.png` → `.webp` (new file)
4. ✅ `service-worker.js` (cache strategy update)
5. ✅ `index.html` (dual format references)
6. ✅ Server config (gzip + cache headers)

---

## ⏱️ **Timeline**

- **Day 1:** Image konverzija + HTML updates
- **Day 2:** Service Worker cache implementation
- **Day 3:** Server compression setup + testing
- **Day 4:** Validation & performance testing

---

*Plan created: March 23, 2026*  
*Status: Ready for implementation*  
*Estimated effort: 2-3 hours total*