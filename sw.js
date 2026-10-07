/* =========================================================
   ABO TAREK STORE - SERVICE WORKER
   PWA - OFFLINE SUPPORT + SMART CACHE
   DARK NAVY LUXURY EDITION
   ========================================================= */

"use strict";


/* =========================================================
   1. VERSION / CACHE NAMES
   ========================================================= */

const CACHE_VERSION = "v6";

const CACHE_NAME =
  "abo-tarek-cache-" + CACHE_VERSION;

const RUNTIME_CACHE =
  "abo-tarek-runtime-" + CACHE_VERSION;

const IMAGE_CACHE =
  "abo-tarek-images-" + CACHE_VERSION;


/* =========================================================
   2. BASE PATH
   GitHub Pages:
   /abo-tarek-store/
   ========================================================= */

const BASE_PATH = "/abo-tarek-store/";


/* =========================================================
   3. CORE FILES
   يتم حفظ الملفات الأساسية عند أول تثبيت
   ========================================================= */

const PRECACHE_URLS = [

  /* Home */
  BASE_PATH,
  BASE_PATH + "index.html",

  /* Catalog */
  BASE_PATH + "sections.html",

  /* Product */
  BASE_PATH + "product.html",

  /* Main CSS */
  BASE_PATH + "style.css",
  BASE_PATH + "features.css",

  /* JavaScript */
  BASE_PATH + "config.js",
  BASE_PATH + "features.js",
  BASE_PATH + "app.js",
  BASE_PATH + "analytics.js",
  BASE_PATH + "pwa.js",

  /* PWA */
  BASE_PATH + "manifest.json",

  /* Main branding */
  BASE_PATH + "assets/logo.png",
  BASE_PATH + "assets/storefront.jpg"
];


/* =========================================================
   4. HELPERS
   ========================================================= */

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}


function isHTMLRequest(request) {

  const accept =
    request.headers.get("accept") || "";

  return (
    request.mode === "navigate" ||
    accept.includes("text/html")
  );
}


function isImageRequest(request) {

  const destination =
    request.destination || "";

  return (
    destination === "image" ||
    /\.(png|jpe?g|webp|gif|svg|avif|ico)$/i.test(
      new URL(request.url).pathname
    )
  );
}


function isFontRequest(request) {

  const destination =
    request.destination || "";

  return (
    destination === "font" ||
    /\.(woff2?|ttf|otf)$/i.test(
      new URL(request.url).pathname
    )
  );
}


function isStaticAsset(request) {

  const destination =
    request.destination || "";

  const path =
    new URL(request.url).pathname;

  return (
    ["script", "style", "worker"].includes(destination) ||
    /\.(js|css|json)$/i.test(path)
  );
}


function isIgnoredRequest(url) {

  const hostname =
    url.hostname.toLowerCase();

  /* Google Apps Script */

  if (
    hostname.includes(
      "script.google.com"
    ) ||
    hostname.includes(
      "script.googleusercontent.com"
    )
  ) {
    return true;
  }


  /* Google Analytics */

  if (
    hostname.includes(
      "google-analytics.com"
    ) ||
    hostname.includes(
      "googletagmanager.com"
    ) ||
    hostname.includes(
      "googlesyndication.com"
    ) ||
    hostname.includes(
      "doubleclick.net"
    )
  ) {
    return true;
  }


  /* Facebook */

  if (
    hostname.includes(
      "facebook.net"
    ) ||
    hostname.includes(
      "facebook.com"
    ) ||
    hostname.includes(
      "connect.facebook.net"
    )
  ) {
    return true;
  }


  return false;
}


function isAdminRequest(url) {

  const pathname =
    url.pathname.toLowerCase();

  return (
    pathname.endsWith(
      "/admin.html"
    ) ||
    pathname.includes(
      "/admin/"
    ) ||
    pathname.includes(
      "/ادمن"
    )
  );
}


/* =========================================================
   5. INSTALL
   ========================================================= */

self.addEventListener(
  "install",
  event => {

    console.log(
      "[SW] Installing:",
      CACHE_VERSION
    );


    event.waitUntil(

      caches
        .open(CACHE_NAME)

        .then(cache => {

          /*
            addAll ممكن يفشل بالكامل لو ملف واحد
            غير موجود، لذلك نحفظ الملفات واحدة واحدة.
          */

          return Promise.all(
            PRECACHE_URLS.map(
              url =>
                cache
                  .add(url)
                  .catch(error => {

                    console.warn(
                      "[SW] Precache failed:",
                      url,
                      error
                    );

                  })
            )
          );
        })

        .then(() => {

          /*
            تفعيل النسخة الجديدة فوراً.
          */

          return self.skipWaiting();
        })
    );
  }
);


/* =========================================================
   6. ACTIVATE
   حذف الإصدارات القديمة
   ========================================================= */

self.addEventListener(
  "activate",
  event => {

    console.log(
      "[SW] Activating:",
      CACHE_VERSION
    );


    event.waitUntil(

      caches
        .keys()

        .then(cacheNames => {

          return Promise.all(

            cacheNames
              .filter(cacheName => {

                return (

                  cacheName.startsWith(
                    "abo-tarek-"
                  ) &&

                  cacheName !==
                    CACHE_NAME &&

                  cacheName !==
                    RUNTIME_CACHE &&

                  cacheName !==
                    IMAGE_CACHE
                );
              })

              .map(cacheName => {

                console.log(
                  "[SW] Removing old cache:",
                  cacheName
                );

                return caches.delete(
                  cacheName
                );
              })
          );
        })

        .then(() => {

          /*
            السيطرة على الصفحات المفتوحة
            بدون الحاجة لإعادة فتح الموقع.
          */

          return self.clients.claim();
        })
    );
  }
);


/* =========================================================
   7. NETWORK FIRST
   مناسب للـ HTML / CSS / JS
   ========================================================= */

function networkFirst(request) {

  return fetch(request)

    .then(response => {

      if (
        response &&
        response.ok
      ) {

        const clone =
          response.clone();

        caches
          .open(RUNTIME_CACHE)
          .then(cache => {

            cache
              .put(request, clone)
              .catch(() => {});

          });
      }

      return response;
    })

    .catch(() => {

      return caches
        .match(request)
        .then(cached => {

          if (cached) {
            return cached;
          }


          /*
            لو صفحة غير موجودة في الكاش،
            رجّع الصفحة الرئيسية.
          */

          if (
            isHTMLRequest(request)
          ) {

            return caches.match(
              BASE_PATH
            );
          }


          return Response.error();
        });
    });
}


/* =========================================================
   8. CACHE FIRST
   للصور والخطوط
   ========================================================= */

function cacheFirst(
  request,
  cacheName
) {

  return caches
    .match(request)
    .then(cached => {

      if (cached) {
        return cached;
      }


      return fetch(request)

        .then(response => {

          /*
            لا نخزن أخطاء السيرفر.
          */

          if (
            response &&
            (
              response.ok ||
              response.type ===
                "opaque"
            )
          ) {

            const clone =
              response.clone();

            caches
              .open(cacheName)
              .then(cache => {

                cache
                  .put(request, clone)
                  .catch(() => {});

              });
          }

          return response;
        })

        .catch(() => {

          return Response.error();
        });
    });
}


/* =========================================================
   9. FETCH
   ========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;

    /* GET فقط */

    if (
      request.method !== "GET"
    ) {
      return;
    }


    let url;

    try {

      url =
        new URL(
          request.url
        );

    } catch (_) {

      return;
    }


    /* =====================================================
       External services
       لا نتدخل فيها.
       ===================================================== */

    if (
      isIgnoredRequest(url)
    ) {
      return;
    }


    /* =====================================================
       Admin
       لا نعمل لها cache.
       ===================================================== */

    if (
      isAdminRequest(url)
    ) {
      return;
    }


    /* =====================================================
       HTML / NAVIGATION
       Network First
       ===================================================== */

    if (
      isHTMLRequest(request) &&
      isSameOrigin(url)
    ) {

      event.respondWith(
        networkFirst(request)
      );

      return;
    }


    /* =====================================================
       Local JS / CSS / JSON
       Network First
       ===================================================== */

    if (
      isSameOrigin(url) &&
      isStaticAsset(request)
    ) {

      event.respondWith(
        networkFirst(request)
      );

      return;
    }


    /* =====================================================
       Images
       Cache First
       ===================================================== */

    if (
      isImageRequest(request)
    ) {

      /*
        الصور الخارجية يمكن تخزينها حتى لو
        كانت opaque response.
      */

      event.respondWith(
        cacheFirst(
          request,
          IMAGE_CACHE
        )
      );

      return;
    }


    /* =====================================================
       Fonts
       Cache First
       ===================================================== */

    if (
      isFontRequest(request)
    ) {

      event.respondWith(
        cacheFirst(
          request,
          RUNTIME_CACHE
        )
      );

      return;
    }


    /* =====================================================
       Other same-origin resources
       Network First
       ===================================================== */

    if (
      isSameOrigin(url)
    ) {

      event.respondWith(
        networkFirst(request)
      );

      return;
    }


    /* =====================================================
       External resources
       لا نتدخل فيها إلا للصور والخطوط.
       ===================================================== */

    return;
  }
);


/* =========================================================
   10. MESSAGE HANDLER
   يسمح للموقع بطلب تفعيل النسخة الجديدة
   ========================================================= */

self.addEventListener(
  "message",
  event => {

    if (
      !event.data
    ) {
      return;
    }


    /* Skip waiting */

    if (
      event.data.type ===
      "SKIP_WAITING"
    ) {

      self.skipWaiting();

      return;
    }


    /* Clear all Abu Tarek caches */

    if (
      event.data.type ===
      "CLEAR_CACHE"
    ) {

      event.waitUntil(

        caches
          .keys()
          .then(keys => {

            return Promise.all(

              keys
                .filter(key =>
                  key.startsWith(
                    "abo-tarek-"
                  )
                )
                .map(key =>
                  caches.delete(key)
                )
            );
          })
      );

      return;
    }


    /* Return current SW version */

    if (
      event.data.type ===
      "GET_VERSION"
    ) {

      if (
        event.source &&
        event.source.postMessage
      ) {

        event.source.postMessage({
          type:
            "SW_VERSION",
          version:
            CACHE_VERSION
        });
      }
    }
  }
);


/* =========================================================
   11. ONLINE / OFFLINE MESSAGE
   ========================================================= */

self.addEventListener(
  "online",
  () => {

    console.log(
      "[SW] Network online"
    );
  }
);


self.addEventListener(
  "offline",
  () => {

    console.log(
      "[SW] Network offline"
    );
  }
);


/* =========================================================
   12. FINAL LOG
   ========================================================= */

console.log(
  "✅ Abu Tarek Service Worker loaded:",
  CACHE_VERSION
);
