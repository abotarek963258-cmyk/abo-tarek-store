/* =========================================================
   ABO TAREK STORE
   ANALYTICS.JS
   LIGHTWEIGHT UNIVERSAL TRACKING
   Google Analytics 4 + Facebook Pixel
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};
  const CFG =
    ROOT.CONFIG ||
    window.ABO_TAREK_CONFIG ||
    {};

  const ANALYTICS =
    CFG.ANALYTICS ||
    {};

  const GA4_ID = String(
    ANALYTICS.GA4_ID ||
    ANALYTICS.GA_ID ||
    ""
  ).trim();

  const FB_PIXEL_ID = String(
    ANALYTICS.FB_PIXEL_ID ||
    ANALYTICS.FACEBOOK_PIXEL_ID ||
    ""
  ).trim();


  /* =========================================================
     STATE
     ========================================================= */

  const state = {
    initialized: false,
    ga4: false,
    facebook: false,
    pageViewSent: false
  };


  /* =========================================================
     HELPERS
     ========================================================= */

  function cleanString(value, fallback = "") {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    return String(value).trim();
  }


  function safeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }


  function normalizeProduct(product = {}) {
    const price = safeNumber(
      product.offerPrice ||
      product.price ||
      0
    );

    const quantity = Math.max(
      1,
      safeNumber(
        product.quantity,
        1
      )
    );

    return {
      item_id: cleanString(
        product.id ||
        product.productId ||
        product.code ||
        ""
      ),

      item_name: cleanString(
        product.name ||
        product.title ||
        "منتج"
      ),

      item_category: cleanString(
        product.category ||
        ""
      ),

      price,
      quantity
    };
  }


  function getPageContext() {
    return {
      page_title:
        document.title || "",

      page_location:
        window.location.href,

      page_path:
        window.location.pathname,

      language:
        document.documentElement.lang ||
        "ar",

      site_section:
        document.body?.dataset?.page ||
        ""
    };
  }


  function loadScript(src) {
    return new Promise(function (resolve, reject) {

      const existing =
        document.querySelector(
          'script[src="' + src + '"]'
        );

      if (existing) {
        resolve(existing);
        return;
      }

      const script =
        document.createElement("script");

      script.async = true;
      script.src = src;

      script.onload = function () {
        resolve(script);
      };

      script.onerror = function () {
        reject(
          new Error(
            "Analytics script failed"
          )
        );
      };

      document.head.appendChild(
        script
      );
    });
  }


  /* =========================================================
     GOOGLE ANALYTICS 4
     ========================================================= */

  async function initGA4() {

    if (!GA4_ID) {
      return false;
    }

    try {

      window.dataLayer =
        window.dataLayer || [];

      window.gtag =
        window.gtag ||
        function () {
          window.dataLayer.push(
            arguments
          );
        };


      if (
        !document.querySelector(
          'script[data-abo-ga4="true"]'
        )
      ) {

        const script =
          document.createElement(
            "script"
          );

        script.async = true;

        script.dataset.aboGa4 =
          "true";

        script.src =
          "https://www.googletagmanager.com/gtag/js?id=" +
          encodeURIComponent(
            GA4_ID
          );

        document.head.appendChild(
          script
        );
      }


      window.gtag(
        "js",
        new Date()
      );


      window.gtag(
        "config",
        GA4_ID,
        {
          currency: "EGP",

          language:
            document.documentElement
              .lang || "ar",

          page_title:
            document.title,

          page_location:
            window.location.href,

          send_page_view: false
        }
      );


      state.ga4 = true;

      return true;

    } catch (error) {

      console.warn(
        "ABO TAREK GA4 error:",
        error
      );

      return false;
    }
  }


  /* =========================================================
     FACEBOOK PIXEL
     ========================================================= */

  async function initFacebookPixel() {

    if (!FB_PIXEL_ID) {
      return false;
    }

    try {

      if (!window.fbq) {

        (function (
          f,
          b,
          e,
          v,
          n,
          t,
          s
        ) {

          if (f.fbq) {
            return;
          }

          n =
            f.fbq =
            function () {

              n.callMethod
                ? n.callMethod.apply(
                    n,
                    arguments
                  )
                : n.queue.push(
                    arguments
                  );
            };

          if (!f._fbq) {
            f._fbq = n;
          }

          n.push = n;
          n.loaded = true;
          n.version = "2.0";
          n.queue = [];

          t =
            b.createElement(e);

          t.async = true;

          t.src = v;

          s =
            b.getElementsByTagName(e)[0];

          s.parentNode.insertBefore(
            t,
            s
          );

        })(
          window,
          document,
          "script",
          "https://connect.facebook.net/en_US/fbevents.js"
        );
      }


      window.fbq(
        "init",
        FB_PIXEL_ID
      );


      state.facebook = true;

      return true;

    } catch (error) {

      console.warn(
        "ABO TAREK Facebook Pixel error:",
        error
      );

      return false;
    }
  }


  /* =========================================================
     FACEBOOK EVENT MAP
     ========================================================= */

  const FB_EVENT_MAP = {

    view_product:
      "ViewContent",

    view_item:
      "ViewContent",

    add_to_cart:
      "AddToCart",

    remove_from_cart:
      "RemoveFromCart",

    begin_checkout:
      "InitiateCheckout",

    purchase:
      "Purchase",

    contact:
      "Contact",

    search:
      "Search",

    view_category:
      "ViewContent",

    add_to_wishlist:
      "AddToWishlist",

    share:
      "Share",

    social_click:
      "Contact"
  };


  /* =========================================================
     UNIVERSAL TRACK
     ========================================================= */

  function track(
    eventName,
    data = {}
  ) {

    const event =
      cleanString(
        eventName,
        "custom_event"
      );

    const payload = {
      ...data,
      ...getPageContext()
    };


    try {

      /* ---------- GA4 ---------- */

      if (
        state.ga4 &&
        typeof window.gtag ===
          "function"
      ) {

        window.gtag(
          "event",
          event,
          payload
        );
      }


      /* ---------- FACEBOOK ---------- */

      if (
        state.facebook &&
        typeof window.fbq ===
          "function"
      ) {

        const facebookEvent =
          FB_EVENT_MAP[event] ||
          event;

        window.fbq(
          "track",
          facebookEvent,
          data
        );
      }

    } catch (error) {

      console.warn(
        "ABO TAREK analytics tracking error:",
        error
      );
    }
  }


  /* =========================================================
     PAGE VIEW
     ========================================================= */

  function trackPageView() {

    if (
      state.pageViewSent
    ) {
      return;
    }

    state.pageViewSent = true;


    const payload =
      getPageContext();


    if (
      state.ga4 &&
      typeof window.gtag ===
        "function"
    ) {

      window.gtag(
        "event",
        "page_view",
        payload
      );
    }


    if (
      state.facebook &&
      typeof window.fbq ===
        "function"
    ) {

      window.fbq(
        "track",
        "PageView"
      );
    }
  }


  /* =========================================================
     PRODUCT VIEW
     ========================================================= */

  function trackProductView(
    product
  ) {

    if (!product) {
      return;
    }

    const item =
      normalizeProduct(
        product
      );


    track(
      "view_product",
      {
        currency: "EGP",

        value: item.price,

        items: [item],

        content_type:
          "product",

        content_ids: [
          item.item_id
        ],

        content_name:
          item.item_name
      }
    );
  }


  /* =========================================================
     ADD TO CART
     ========================================================= */

  function trackAddToCart(
    product,
    quantity = 1
  ) {

    if (!product) {
      return;
    }

    const item =
      normalizeProduct({
        ...product,
        quantity
      });


    track(
      "add_to_cart",
      {
        currency: "EGP",

        value:
          item.price *
          item.quantity,

        items: [item],

        content_type:
          "product",

        content_ids: [
          item.item_id
        ],

        content_name:
          item.item_name
      }
    );
  }


  /* =========================================================
     WISHLIST
     ========================================================= */

  function trackWishlist(
    product
  ) {

    if (!product) {
      return;
    }

    const item =
      normalizeProduct(
        product
      );


    track(
      "add_to_wishlist",
      {
        currency: "EGP",

        value:
          item.price,

        items: [item],

        content_type:
          "product",

        content_ids: [
          item.item_id
        ],

        content_name:
          item.item_name
      }
    );
  }


  /* =========================================================
     SEARCH
     ========================================================= */

  function trackSearch(
    searchTerm
  ) {

    const term =
      cleanString(
        searchTerm
      );

    if (!term) {
      return;
    }

    track(
      "search",
      {
        search_term: term
      }
    );
  }


  /* =========================================================
     CATEGORY
     ========================================================= */

  function trackCategory(
    category
  ) {

    const name =
      cleanString(
        category
      );

    if (!name) {
      return;
    }

    track(
      "view_category",
      {
        item_category:
          name,

        content_name:
          name
      }
    );
  }


  /* =========================================================
     SHARE
     ========================================================= */

  function trackShare(
    method = "unknown"
  ) {

    track(
      "share",
      {
        method:
          cleanString(
            method,
            "unknown"
          )
      }
    );
  }


  /* =========================================================
     CONTACT
     ========================================================= */

  function trackContact(
    method = "unknown"
  ) {

    track(
      "contact",
      {
        method:
          cleanString(
            method,
            "unknown"
          )
      }
    );
  }


  /* =========================================================
     CHECKOUT
     ========================================================= */

  function trackCheckout(
    items = [],
    value = 0
  ) {

    const normalizedItems =
      Array.isArray(items)
        ? items.map(
            normalizeProduct
          )
        : [];


    track(
      "begin_checkout",
      {
        currency: "EGP",

        value:
          safeNumber(value),

        items:
          normalizedItems,

        content_type:
          "product"
      }
    );
  }


  /* =========================================================
     PURCHASE
     ========================================================= */

  function trackPurchase(
    transactionId,
    items = [],
    value = 0
  ) {

    const normalizedItems =
      Array.isArray(items)
        ? items.map(
            normalizeProduct
          )
        : [];


    track(
      "purchase",
      {
        transaction_id:
          cleanString(
            transactionId
          ),

        currency: "EGP",

        value:
          safeNumber(value),

        items:
          normalizedItems
      }
    );
  }


  /* =========================================================
     AUTOMATIC CLICK TRACKING
     ========================================================= */

  function bindAutomaticTracking() {

    document.addEventListener(
      "click",
      function (event) {

        const target =
          event.target.closest(
            "a[href],button"
          );

        if (!target) {
          return;
        }


        const href =
          target.getAttribute(
            "href"
          ) || "";


        const text =
          cleanString(
            target.textContent
          ).slice(
            0,
            100
          );


        /* WhatsApp */

        if (
          href.includes(
            "wa.me"
          ) ||
          href.includes(
            "whatsapp.com"
          )
        ) {

          trackContact(
            "whatsapp"
          );
        }


        /* Phone */

        if (
          href.startsWith(
            "tel:"
          )
        ) {

          trackContact(
            "phone"
          );
        }


        /* Catalog */

        if (
          href.includes(
            "sections.html"
          )
        ) {

          trackCategory(
            "كل الأصناف"
          );
        }


        /* Social */

        if (
          href.includes(
            "facebook.com"
          ) ||
          href.includes(
            "instagram.com"
          ) ||
          href.includes(
            "tiktok.com"
          )
        ) {

          track(
            "social_click",
            {
              platform:
                href.includes(
                  "facebook"
                )
                  ? "facebook"
                  : href.includes(
                      "instagram"
                    )
                    ? "instagram"
                    : "tiktok"
            }
          );
        }


        /* Search */

        if (
          target.matches(
            "#headerSearchBtn, #catalogSearchBtn"
          )
        ) {

          const input =
            document.querySelector(
              "#catalogSearch, #headerSearch"
            );

          if (
            input?.value
          ) {

            trackSearch(
              input.value
            );
          }
        }


        /* Share */

        if (
          target.closest(
            "[data-share], .share-btn, .product-share"
          )
        ) {

          trackShare(
            text ||
            "share"
          );
        }

      },
      true
    );


    /* Search fields */

    const inputs =
      document.querySelectorAll(
        "#catalogSearch, #headerSearch"
      );


    inputs.forEach(
      function (input) {

        let lastValue =
          "";

        input.addEventListener(
          "change",
          function () {

            const value =
              cleanString(
                input.value
              );

            if (
              value &&
              value !== lastValue
            ) {

              lastValue =
                value;

              trackSearch(
                value
              );
            }
          }
        );
      }
    );
  }


  /* =========================================================
     FEATURE EVENTS
     ========================================================= */

  function bindFeatureEvents() {

    document.addEventListener(
      "abo-tarek:add-to-cart",
      function (event) {

        /*
          app.js / features.js may already
          call analytics directly.

          This listener intentionally does
          NOT track the event, preventing
          duplicate AddToCart events.
        */

        return;
      }
    );


    document.addEventListener(
      "abo-tarek:wishlist",
      function (event) {

        /*
          Reserved for future integration.
          No automatic tracking here to avoid
          duplicate Wishlist events.
        */

        return;
      }
    );
  }


  /* =========================================================
     INITIALIZATION
     ========================================================= */

  async function init() {

    if (
      state.initialized
    ) {
      return;
    }

    state.initialized =
      true;


    /*
      Analytics is intentionally initialized
      asynchronously so it never becomes a
      dependency for the store itself.
    */

    try {

      await Promise.allSettled([
        initGA4(),
        initFacebookPixel()
      ]);

    } catch (error) {

      console.warn(
        "ABO TAREK analytics initialization warning:",
        error
      );
    }


    bindAutomaticTracking();
    bindFeatureEvents();


    trackPageView();


    window.dispatchEvent(
      new CustomEvent(
        "abo-tarek:analytics-ready",
        {
          detail:
            getStatus()
        }
      )
    );
  }


  /* =========================================================
     STATUS
     ========================================================= */

  function getStatus() {

    return {

      ga4:
        state.ga4,

      facebook:
        state.facebook,

      ga4Id:
        GA4_ID
          ? "configured"
          : "not configured",

      facebookPixel:
        FB_PIXEL_ID
          ? "configured"
          : "not configured",

      initialized:
        state.initialized
    };
  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.aboTrack =
    track;

  window.aboTrackPageView =
    trackPageView;

  window.aboTrackProductView =
    trackProductView;

  window.aboTrackAddToCart =
    trackAddToCart;

  window.aboTrackWishlist =
    trackWishlist;

  window.aboTrackSearch =
    trackSearch;

  window.aboTrackCategory =
    trackCategory;

  window.aboTrackShare =
    trackShare;

  window.aboTrackContact =
    trackContact;

  window.aboTrackCheckout =
    trackCheckout;

  window.aboTrackPurchase =
    trackPurchase;


  window.ABO_TAREK_ANALYTICS = {

    init,

    track,

    productView:
      trackProductView,

    addToCart:
      trackAddToCart,

    wishlist:
      trackWishlist,

    search:
      trackSearch,

    category:
      trackCategory,

    share:
      trackShare,

    contact:
      trackContact,

    checkout:
      trackCheckout,

    purchase:
      trackPurchase,

    status:
      getStatus
  };


  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  } else {

    init();
  }

})();
