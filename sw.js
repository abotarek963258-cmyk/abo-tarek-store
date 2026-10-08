/* =========================================================
   ABO TAREK STORE
   SERVICE WORKER
   FINAL STABLE EDITION
   PWA + SMART CACHE + OFFLINE SUPPORT
   ========================================================= */

"use strict";

/* =========================================================
   1. VERSION
   ========================================================= */

const VERSION = "v7";

const STATIC_CACHE = `abo-tarek-static-${VERSION}`;
const RUNTIME_CACHE = `abo-tarek-runtime-${VERSION}`;
const IMAGE_CACHE = `abo-tarek-images-${VERSION}`;

const CACHE_PREFIX = "abo-tarek-";


/* =========================================================
   2. BASE PATH
   يعمل تلقائياً على GitHub Pages
   ========================================================= */

const BASE_PATH =
  new URL("./", self.location.href).pathname;


/* =========================================================
   3. CORE FILES
   نحاول حفظ الملفات الأساسية فقط.
   لو ملف غير موجود، لا نفشل تثبيت الـSW بالكامل.
   ========================================================= */

const CORE_FILES = [
  "./",
  "./index.html",
  "./sections.html",
  "./product.html",

  "./style.css",
  "./features.css",

  "./config.js",
  "./app.js",
  "./features.js",
  "./analytics.js",
  "./pwa.js",

  "./manifest.json"
];


/* =========================================================
   4. URL HELPERS
   ========================================================= */

function getURL(requestOrURL) {
  try {
    return new URL(
      typeof requestOrURL === "string"
        ? requestOrURL
        : requestOrURL.url,
      self.location.href
    );
  } catch (_) {
    return null;
  }
}


function isSameOrigin(url) {
  return !!url &&
    url.origin === self.location.origin;
}


function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (
      request.method === "GET" &&
      (
        request.headers.get("accept") || ""
      ).includes("text/html")
    )
  );
}


function isStaticAsset(request) {

  const url = getURL(request);

  if (!url) {
    return false;
  }

  const path =
    url.pathname.toLowerCase();

  const destination =
    request.destination || "";

  return (
    destination === "script" ||
    destination === "style" ||
    destination === "worker" ||
    /\.(js|css)$/i.test(path)
  );
}


function isImageRequest(request) {

  const url = getURL(request);

  if (!url) {
    return false;
  }

  const destination =
    request.destination || "";

  const path =
    url.pathname.toLowerCase();

  return (
    destination === "image" ||
    /\.(png|jpe?g|webp|gif|svg|avif|ico)$/i.test(path)
  );
}


function isFontRequest(request) {

  const url = getURL(request);

  if (!url) {
    return false;
  }

  const destination =
    request.destination || "";

  const path =
    url.pathname.toLowerCase();

  return (
    destination === "font" ||
    /\.(woff2?|ttf|otf)$/i.test(path)
  );
}


/* =========================================================
   5. EXTERNAL SERVICES
   لا نتدخل في APIs والتحليلات.
   ========================================================= */

function isExternalService(url) {

  if (!url) {
    return true;
  }

  const host =
    url.hostname.toLowerCase();

  return (
    host.includes("script.google.com") ||
    host.includes("script.googleusercontent.com") ||

    host.includes("google-analytics.com") ||
    host.includes("googletagmanager.com") ||
    host.includes("googlesyndication.com") ||
    host.includes("doubleclick.net") ||

    host.includes("facebook.net") ||
    host.includes("connect.facebook.net") ||
    host.includes("facebook.com")
  );
}


/* =========================================================
   6. ADMIN
   لوحة الإدارة لا يتم تخزينها في الكاش.
   ========================================================= */

function isAdminRequest(url) {

  if (!url) {
    return false;
  }

  const path =
    url.pathname.toLowerCase();

  return (
    path.endsWith("/admin.html") ||
    path.includes("/admin/")
  );
}


/* =========================================================
   7. CACHE HELPERS
   ========================================================= */

async function putInCache(
  cacheName,
  request,
  response
) {

  if (
    !response ||
    (
      !response.ok &&
      response.type !== "opaque"
    )
  ) {
    return;
  }

  try {

    const cache =
      await caches.open(cacheName);

    await cache.put(
      request,
      response.clone()
    );

  } catch (error) {

    console.warn(
      "[SW] Cache write failed:",
      error
    );
  }
}


/* =========================================================
   8. NETWORK FIRST
   للصفحات HTML
   ========================================================= */

async function networkFirstHTML(request) {

  try {

    const response =
      await fetch(request);

    if (
      response &&
      response.ok
    ) {

      await putInCache(
        RUNTIME_CACHE,
        request,
        response
      );

      return response;
    }

    throw new Error(
      "HTML network response failed"
    );

  } catch (_) {

    const cached =
      await caches.match(request);

    if (cached) {
      return cached;
    }

    const home =
      await caches.match(
        new URL(
          "./index.html",
          self.location.href
        ).pathname
      );

    if (home) {
      return home;
    }

    return new Response(
      `
      <!doctype html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport"
              content="width=device-width,initial-scale=1">
        <title>أبو طارق للأدوات المنزلية</title>
      </head>
      <body>
        <h1>أبو طارق للأدوات المنزلية</h1>
        <p>لا يوجد اتصال بالإنترنت حالياً.</p>
      </body>
      </html>
      `,
      {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      }
    );
  }
}


/* =========================================================
   9. STALE WHILE REVALIDATE
   للـCSS / JS
   ========================================================= */

async function staleWhileRevalidate(request) {

  const cached =
    await caches.match(request);

  const networkPromise =
    fetch(request)
      .then(response => {

        if (
          response &&
          response.ok
        ) {

          putInCache(
            RUNTIME_CACHE,
            request,
            response
          );
        }

        return response;

      })
      .catch(() => null);

  if (cached) {

    /*
      نرجع النسخة الموجودة فوراً
      ونحدثها في الخلفية.
    */

    return cached;
  }

  const network =
    await networkPromise;

  if (network) {
    return network;
  }

  return Response.error();
}


/* =========================================================
   10. CACHE FIRST
   للصور والخطوط
   ========================================================= */

async function cacheFirst(
  request,
  cacheName
) {

  const cached =
    await caches.match(request);

  if (cached) {
    return cached;
  }

  try {

    const response =
      await fetch(request);

    if (
      response &&
      (
        response.ok ||
        response.type === "opaque"
      )
    ) {

      await putInCache(
        cacheName,
        request,
        response
      );
    }

    return response;

  } catch (_) {

    return Response.error();
  }
}


/* =========================================================
   11. INSTALL
   ========================================================= */

self.addEventListener(
  "install",
  event => {

    console.log(
      "[SW] Installing",
      VERSION
    );

    event.waitUntil(

      (async () => {

        const cache =
          await caches.open(
            STATIC_CACHE
          );

        /*
          نحفظ كل ملف منفرداً.
          لو ملف ناقص، باقي الملفات لا تتأثر.
        */

        await Promise.allSettled(

          CORE_FILES.map(
            async relativeURL => {

              try {

                const url =
                  new URL(
                    relativeURL,
                    self.location.href
                  );

                const response =
                  await fetch(
                    new Request(
                      url,
                      {
                        cache: "no-cache"
                      }
                    )
                  );

                if (
                  response.ok
                ) {

                  await cache.put(
                    url.pathname +
                      url.search,
                    response.clone()
                  );
                }

              } catch (error) {

                console.warn(
                  "[SW] Could not precache:",
                  relativeURL
                );
              }
            }
          )
        );

        /*
          تفعيل النسخة الجديدة فوراً.
        */

        await self.skipWaiting();

      })()
    );
  }
);


/* =========================================================
   12. ACTIVATE
   ========================================================= */

self.addEventListener(
  "activate",
  event => {

    console.log(
      "[SW] Activating",
      VERSION
    );

    event.waitUntil(

      (async () => {

        const cacheNames =
          await caches.keys();

        await Promise.all(

          cacheNames
            .filter(name => {

              return (
                name.startsWith(
                  CACHE_PREFIX
                ) &&
                name !== STATIC_CACHE &&
                name !== RUNTIME_CACHE &&
                name !== IMAGE_CACHE
              );

            })
            .map(name =>
              caches.delete(name)
            )
        );

        await self.clients.claim();

        console.log(
          "[SW] Activated",
          VERSION
        );

      })()
    );
  }
);


/* =========================================================
   13. FETCH
   ========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;

    /*
      GET فقط.
      لا نلمس POST أو PUT أو DELETE.
    */

    if (
      request.method !== "GET"
    ) {
      return;
    }

    const url =
      getURL(request);

    if (!url) {
      return;
    }


    /* =====================================================
       Apps Script / Analytics / Facebook
       لا يتم تخزينها.
       ===================================================== */

    if (
      isExternalService(url)
    ) {
      return;
    }


    /* =====================================================
       Admin
       لا يتم تخزين لوحة الإدارة.
       ===================================================== */

    if (
      isAdminRequest(url)
    ) {
      return;
    }


    /* =====================================================
       HTML
       Network First
       ===================================================== */

    if (
      isSameOrigin(url) &&
      isNavigationRequest(request)
    ) {

      event.respondWith(
        networkFirstHTML(request)
      );

      return;
    }


    /* =====================================================
       Local JS / CSS
       Stale While Revalidate
       ===================================================== */

    if (
      isSameOrigin(url) &&
      isStaticAsset(request)
    ) {

      event.respondWith(
        staleWhileRevalidate(request)
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
        نسمح بالصور الخارجية،
        لكن لا نتدخل في خدمات التحليلات.
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
       Other same-origin GET
       ===================================================== */

    if (
      isSameOrigin(url)
    ) {

      event.respondWith(
        staleWhileRevalidate(request)
      );

      return;
    }

    /*
      أي طلب خارجي غير معروف:
      اتركه للمتصفح الطبيعي.
    */
  }
);


/* =========================================================
   14. MESSAGE HANDLER
   ========================================================= */

self.addEventListener(
  "message",
  event => {

    const data =
      event.data;

    if (!data) {
      return;
    }


    /* -----------------------------------------------------
       Activate new version
       ----------------------------------------------------- */

    if (
      data.type ===
      "SKIP_WAITING"
    ) {

      self.skipWaiting();

      return;
    }


    /* -----------------------------------------------------
       Clear Abu Tarek caches
       ----------------------------------------------------- */

    if (
      data.type ===
      "CLEAR_CACHE"
    ) {

      event.waitUntil(

        caches
          .keys()
          .then(keys =>

            Promise.all(

              keys
                .filter(key =>
                  key.startsWith(
                    CACHE_PREFIX
                  )
                )
                .map(key =>
                  caches.delete(key)
                )
            )
          )
      );

      return;
    }


    /* -----------------------------------------------------
       Return SW version
       ----------------------------------------------------- */

    if (
      data.type ===
      "GET_VERSION"
    ) {

      if (
        event.source &&
        typeof
          event.source.postMessage ===
          "function"
      ) {

        event.source.postMessage({

          type:
            "SW_VERSION",

          version:
            VERSION
        });
      }
    }
  }
);


/* =========================================================
   15. FINAL
   ========================================================= */

console.log(
  "✅ Abu Tarek Service Worker ready:",
  VERSION
);
