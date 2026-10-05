/* =========================================================
   ABO TAREK STORE - SERVICE WORKER
   PWA - Offline Support + Cache
   ========================================================= */

const CACHE_NAME = "abo-tarek-v1";
const RUNTIME_CACHE = "abo-tarek-runtime-v1";

/* ملفات أساسية تتحفظ عند أول زيارة */
const PRECACHE_URLS = [
  "/abo-tarek-store/",
  "/abo-tarek-store/index.html",
  "/abo-tarek-store/sections.html",
  "/abo-tarek-store/product.html",
  "/abo-tarek-store/style.css",
  "/abo-tarek-store/features.css",
  "/abo-tarek-store/config.js",
  "/abo-tarek-store/features.js",
  "/abo-tarek-store/app.js",
  "/abo-tarek-store/analytics.js",
  "/abo-tarek-store/assets/logo.png",
  "/abo-tarek-store/assets/storefront.jpg",
  "/abo-tarek-store/manifest.json"
];

/* =========================================================
   INSTALL
   ========================================================= */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

/* =========================================================
   ACTIVATE - إزالة الكاش القديم
   ========================================================= */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* =========================================================
   FETCH - Strategy
   ========================================================= */
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات غير GET
  if (request.method !== "GET") return;

  // تجاهل Google Apps Script (دائماً من الشبكة)
  if (url.hostname.includes("script.google.com") ||
      url.hostname.includes("script.googleusercontent.com")) {
    return;
  }

  // تجاهل Google Analytics و Facebook
  if (url.hostname.includes("google-analytics.com") ||
      url.hostname.includes("googletagmanager.com") ||
      url.hostname.includes("facebook.net") ||
      url.hostname.includes("facebook.com")) {
    return;
  }

  // تجاهل الملفات الإدارية
  if (url.pathname.includes("admin.html") ||
      url.pathname.includes("ادمن")) {
    return;
  }

  // Network First للأصول المحلية (HTML/CSS/JS)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, clone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            if (cached) return cached;
            // لو صفحة HTML وليست في الكاش، رجّع الرئيسية
            if (request.headers.get("accept")?.includes("text/html")) {
              return caches.match("/abo-tarek-store/");
            }
          });
        })
    );
    return;
  }

  // Cache First للصور والخطوط من مصادر خارجية
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, clone).catch(() => {});
          });
        }
        return response;
      }).catch(() => cached);
    })
  );
});

/* =========================================================
   SKIP WAITING
   ========================================================= */
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
