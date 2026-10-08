/* =========================================================
   ABO TAREK STORE
   SERVICE WORKER — FINAL STABLE
   VERSION 8
   ========================================================= */

"use strict";


/* =========================================================
   VERSION / CACHE NAMES
   ========================================================= */

const VERSION = "v8";

const STATIC_CACHE =
  `abo-tarek-static-${VERSION}`;

const RUNTIME_CACHE =
  `abo-tarek-runtime-${VERSION}`;

const IMAGE_CACHE =
  `abo-tarek-images-${VERSION}`;


/* =========================================================
   BASE PATH
   ========================================================= */

const BASE_PATH =
  new URL("./", self.location.href).pathname;


/* =========================================================
   CORE FILES
   ========================================================= */

const CORE_FILES = [

  "./",

  "./index.html",
  "./sections.html",
  "./product.html",

  "./style.css",
  "./features.css",

  "./config.js",
  "./features.js",
  "./app.js",

  "./analytics.js",
  "./pwa.js",

  "./manifest.json",

  "./assets/logo.png",
  "./assets/storefront.jpg"

];


/* =========================================================
   HELPERS
   ========================================================= */

function isGET(request) {

  return request.method === "GET";

}


function isSameOrigin(request) {

  try {

    const url =
      new URL(
        request.url
      );

    return (
      url.origin ===
      self.location.origin
    );

  } catch (_) {

    return false;

  }

}


function isAdminRequest(request) {

  try {

    const url =
      new URL(
        request.url
      );

    return (
      url.pathname.includes(
        "/admin"
      )
    );

  } catch (_) {

    return false;

  }

}


function isExternalService(request) {

  try {

    const url =
      new URL(
        request.url
      );


    const host =
      url.hostname.toLowerCase();


    return (

      host.includes(
        "script.google.com"
      ) ||

      host.includes(
        "googleapis.com"
      ) ||

      host.includes(
        "googletagmanager.com"
      ) ||

      host.includes(
        "google-analytics.com"
      ) ||

      host.includes(
        "analytics.google.com"
      ) ||

      host.includes(
        "facebook.com"
      ) ||

      host.includes(
        "connect.facebook.net"
      ) ||

      host.includes(
        "wa.me"
      ) ||

      host.includes(
        "whatsapp.com"
      )

    );

  } catch (_) {

    return true;

  }

}


function isHTML(request) {

  const accept =
    request.headers.get(
      "accept"
    ) || "";


  return (
    accept.includes(
      "text/html"
    )
  );

}


function isImage(request) {

  try {

    const url =
      new URL(
        request.url
      );


    return (

      /\.(png|jpg|jpeg|gif|webp|svg|avif)$/i
        .test(url.pathname)

    );

  } catch (_) {

    return false;

  }

}


function isFont(request) {

  try {

    const url =
      new URL(
        request.url
      );


    return (
      /\.(woff2?|ttf|otf)$/i
        .test(url.pathname)
    );

  } catch (_) {

    return false;

  }

}


function isStaticAsset(request) {

  try {

    const url =
      new URL(
        request.url
      );


    return (

      /\.(js|css|json|ico|webmanifest)$/i
        .test(url.pathname)

    );

  } catch (_) {

    return false;

  }

}


/* =========================================================
   SAFE CACHE WRITE
   ========================================================= */

async function putInCache(
  cacheName,
  request,
  response
) {

  if (!response) {
    return false;
  }


  if (
    response.type ===
    "opaque"
  ) {

    /*
      Opaque responses are still cacheable.
      Clone BEFORE anything can consume them.
    */

    try {

      const clone =
        response.clone();


      const cache =
        await caches.open(
          cacheName
        );


      await cache.put(
        request,
        clone
      );


      return true;

    } catch (error) {

      console.warn(
        "[SW] Opaque cache write failed:",
        error
      );

      return false;

    }

  }


  if (
    !response.ok
  ) {

    return false;

  }


  try {

    /*
      IMPORTANT:
      Clone immediately.
    */

    const clone =
      response.clone();


    const cache =
      await caches.open(
        cacheName
      );


    await cache.put(
      request,
      clone
    );


    return true;

  } catch (error) {

    console.warn(
      "[SW] Cache write failed:",
      error
    );

    return false;

  }

}


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      (async () => {

        const cache =
          await caches.open(
            STATIC_CACHE
          );


        /*
          Don't let one missing file
          break the entire installation.
        */

        await Promise.allSettled(

          CORE_FILES.map(
            async relativePath => {

              try {

                const url =
                  new URL(
                    relativePath,
                    self.location.href
                  );


                const request =
                  new Request(
                    url.href,
                    {
                      cache: "no-store"
                    }
                  );


                const response =
                  await fetch(
                    request
                  );


                if (
                  response.ok
                ) {

                  /*
                    Clone before cache.put.
                  */

                  const clone =
                    response.clone();


                  await cache.put(
                    request,
                    clone
                  );

                } else {

                  console.warn(
                    "[SW] Precache skipped:",
                    url.pathname,
                    response.status
                  );

                }

              } catch (error) {

                console.warn(
                  "[SW] Precache failed:",
                  relativePath,
                  error
                );

              }

            }
          )

        );


        /*
          Activate immediately.
        */

        await self.skipWaiting();

      })()

    );

  }
);


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      (async () => {

        const keys =
          await caches.keys();


        await Promise.all(

          keys
            .filter(key => {

              return (

                key.startsWith(
                  "abo-tarek-static-"
                ) ||

                key.startsWith(
                  "abo-tarek-runtime-"
                ) ||

                key.startsWith(
                  "abo-tarek-images-"
                )

              );

            })
            .filter(key => {

              return (

                key !==
                STATIC_CACHE &&

                key !==
                RUNTIME_CACHE &&

                key !==
                IMAGE_CACHE

              );

            })
            .map(
              key =>
                caches.delete(
                  key
                )
            )

        );


        await self.clients.claim();


        console.log(
          "[SW] Activated:",
          VERSION
        );

      })()

    );

  }
);


/* =========================================================
   NETWORK FIRST — HTML
   ========================================================= */

async function networkFirstHTML(
  request
) {

  try {

    const response =
      await fetch(
        request
      );


    if (
      response &&
      response.ok
    ) {

      /*
        Clone immediately.
      */

      const clone =
        response.clone();


      const cache =
        await caches.open(
          RUNTIME_CACHE
        );


      await cache.put(
        request,
        clone
      );

    }


    return response;

  } catch (error) {

    const cached =
      await caches.match(
        request
      );


    if (cached) {

      return cached;

    }


    /*
      If exact request is not cached,
      try the homepage.
    */

    const fallback =
      await caches.match(
        new URL(
          "./index.html",
          self.location.href
        ).href
      );


    if (fallback) {

      return fallback;

    }


    throw error;

  }

}


/* =========================================================
   STALE WHILE REVALIDATE
   ========================================================= */

async function staleWhileRevalidate(
  request,
  cacheName
) {

  const cache =
    await caches.open(
      cacheName
    );


  const cached =
    await cache.match(
      request
    );


  const networkPromise =
    fetch(
      request
    )
      .then(
        async response => {

          if (
            response &&
            (
              response.ok ||
              response.type ===
              "opaque"
            )
          ) {

            /*
              Clone BEFORE cache.put.
            */

            const clone =
              response.clone();


            try {

              await cache.put(
                request,
                clone
              );

            } catch (error) {

              console.warn(
                "[SW] Runtime cache update failed:",
                error
              );

            }

          }


          return response;

        }
      )
      .catch(
        () => null
      );


  if (cached) {

    /*
      Return cached immediately.
      Network update happens in background.
    */

    networkPromise.catch(
      () => {}
    );


    return cached;

  }


  const network =
    await networkPromise;


  if (network) {

    return network;

  }


  throw new Error(
    "Network unavailable"
  );

}


/* =========================================================
   CACHE FIRST — IMAGES / FONTS
   ========================================================= */

async function cacheFirst(
  request,
  cacheName
) {

  const cache =
    await caches.open(
      cacheName
    );


  const cached =
    await cache.match(
      request
    );


  if (cached) {

    return cached;

  }


  try {

    const response =
      await fetch(
        request
      );


    if (
      response &&
      (
        response.ok ||
        response.type ===
        "opaque"
      )
    ) {

      /*
        Clone BEFORE cache.put.
      */

      const clone =
        response.clone();


      try {

        await cache.put(
          request,
          clone
        );

      } catch (error) {

        console.warn(
          "[SW] Image cache write failed:",
          error
        );

      }

    }


    return response;

  } catch (error) {

    throw error;

  }

}


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    /*
      Only GET requests.
    */

    if (
      !isGET(request)
    ) {

      return;

    }


    /*
      Don't interfere with
      external APIs/services.
    */

    if (
      isExternalService(
        request
      )
    ) {

      return;

    }


    /*
      Don't interfere with admin.
    */

    if (
      isAdminRequest(
        request
      )
    ) {

      return;

    }


    /*
      Only same-origin resources.
    */

    if (
      !isSameOrigin(
        request
      )
    ) {

      return;

    }


    if (
      isHTML(request)
    ) {

      event.respondWith(
        networkFirstHTML(
          request
        )
      );

      return;

    }


    if (
      isImage(request) ||
      isFont(request)
    ) {

      event.respondWith(

        cacheFirst(
          request,
          IMAGE_CACHE
        )
          .catch(
            () =>
              fetch(request)
          )

      );

      return;

    }


    if (
      isStaticAsset(request)
    ) {

      event.respondWith(

        staleWhileRevalidate(
          request,
          RUNTIME_CACHE
        )
          .catch(
            () =>
              fetch(request)
          )

      );

      return;

    }

  }
);


/* =========================================================
   MESSAGE HANDLER
   ========================================================= */

self.addEventListener(
  "message",
  event => {

    const data =
      event.data || {};


    if (
      data.type ===
      "SKIP_WAITING"
    ) {

      self.skipWaiting();

      return;

    }


    if (
      data.type ===
      "CLEAR_CACHE"
    ) {

      event.waitUntil(

        caches.keys()
          .then(
            keys =>
              Promise.all(
                keys
                  .filter(
                    key =>
                      key.startsWith(
                        "abo-tarek-"
                      )
                  )
                  .map(
                    key =>
                      caches.delete(
                        key
                      )
                  )
              )
          )

      );

      return;

    }


    if (
      data.type ===
      "GET_VERSION"
    ) {

      event.source?.postMessage({

        type:
          "SW_VERSION",

        version:
          VERSION

      });

    }

  }
);


/* =========================================================
   DEBUG
   ========================================================= */

console.log(
  "[SW] Abu Tarek Service Worker loaded:",
  VERSION
);

console.log(
  "[SW] Base path:",
  BASE_PATH
);
