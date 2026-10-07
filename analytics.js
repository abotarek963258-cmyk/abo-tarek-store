/* =========================================================
   ABO TAREK STORE
   ANALYTICS.JS
   Google Analytics 4 + Facebook Pixel
   DARK LUXURY / UNIVERSAL TRACKING EDITION
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};
  const CFG = ROOT.CONFIG || window.ABO_TAREK_CONFIG || {};

  /*
    ضع IDs هنا إذا كانت متوفرة.

    GA4 مثال:
    const GA4_ID = "G-XXXXXXXXXX";

    Facebook Pixel مثال:
    const FB_PIXEL_ID = "123456789012345";
  */

  const GA4_ID =
    String(
      CFG?.ANALYTICS?.GA4_ID ||
      CFG?.ANALYTICS?.GA_ID ||
      ""
    ).trim();

  const FB_PIXEL_ID =
    String(
      CFG?.ANALYTICS?.FB_PIXEL_ID ||
      CFG?.ANALYTICS?.FACEBOOK_PIXEL_ID ||
      ""
    ).trim();


  /* =========================================================
     INTERNAL STATE
     ========================================================= */

  const state = {
    ga4: false,
    facebook: false,
    initialized: false
  };


  /* =========================================================
     SAFE HELPERS
     ========================================================= */

  function cleanString(value, fallback = "") {
    if (value === null || value === undefined) {
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

      price: safeNumber(
        product.offerPrice ||
        product.price ||
        0
      ),

      quantity: safeNumber(
        product.quantity ||
        1,
        1
      )
    };
  }


  function getPageContext() {
    return {
      page_title: document.title || "",
      page_location: window.location.href,
      page_path: window.location.pathname,
      language: document.documentElement.lang || "ar",
      site_section:
        document.body?.dataset?.page ||
        ""
    };
  }


  /* =========================================================
     GOOGLE ANALYTICS 4
     ========================================================= */

  function initGA4() {
    if (!GA4_ID) {
      return false;
    }

    try {
      if (window.gtag && state.ga4) {
        return true;
      }

      const existingScript = document.querySelector(
        'script[src*="googletagmanager.com/gtag/js"]'
      );

      if (!existingScript) {
        const script = document.createElement("script");

        script.async = true;

        script.src =
          "https://www.googletagmanager.com/gtag/js?id=" +
          encodeURIComponent(GA4_ID);

        document.head.appendChild(script);
      }

      window.dataLayer = window.dataLayer || [];

      window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
      };

      window.gtag("js", new Date());

      window.gtag("config", GA4_ID, {
        page_title: document.title,
        page_location: window.location.href,
        language: document.documentElement.lang || "ar",
        currency: "EGP",
        send_page_view: true
      });

      state.ga4 = true;

      return true;

    } catch (error) {
      console.warn(
        "⚠️ GA4 initialization error:",
        error
      );

      return false;
    }
  }


  /* =========================================================
     FACEBOOK PIXEL
     ========================================================= */

  function initFacebookPixel() {
    if (!FB_PIXEL_ID) {
      return false;
    }

    try {
      if (window.fbq && state.facebook) {
        return true;
      }

      if (!window.fbq) {
        (function (f, b, e, v, n, t, s) {

          if (f.fbq) {
            return;
          }

          n = f.fbq = function () {
            n.callMethod
              ? n.callMethod.apply(n, arguments)
              : n.queue.push(arguments);
          };

          if (!f._fbq) {
            f._fbq = n;
          }

          n.push = n;
          n.loaded = true;
          n.version = "2.0";
          n.queue = [];

          t = b.createElement(e);
          t.async = true;
          t.src = v;

          s = b.getElementsByTagName(e)[0];

          s.parentNode.insertBefore(t, s);

        })(
          window,
          document,
          "script",
          "https://connect.facebook.net/en_US/fbevents.js"
        );
      }

      window.fbq("init", FB_PIXEL_ID);
      window.fbq("track", "PageView");

      state.facebook = true;

      return true;

    } catch (error) {
      console.warn(
        "⚠️ Facebook Pixel initialization error:",
        error
      );

      return false;
    }
  }


  /* =========================================================
     FACEBOOK EVENT MAP
     ========================================================= */

  const FB_EVENT_MAP = {
    view_product: "ViewContent",
    view_item: "ViewContent",

    add_to_cart: "AddToCart",

    remove_from_cart: "RemoveFromCart",

    begin_checkout: "InitiateCheckout",

    purchase: "Purchase",

    contact: "Contact",

    search: "Search",

    view_category: "ViewContent",

    add_to_wishlist: "AddToWishlist",

    share: "Share"
  };


  /* =========================================================
     UNIVERSAL TRACK
     ========================================================= */

  window.aboTrack = function (eventName, data = {}) {

    const event = cleanString(
      eventName,
      "custom_event"
    );

    const payload = {
      ...data,
      ...getPageContext()
    };

    try {

      /* ---------- GA4 ---------- */

      if (window.gtag && state.ga4) {
        window.gtag(
          "event",
          event,
          payload
        );
      }


      /* ---------- FACEBOOK ---------- */

      if (window.fbq && state.facebook) {

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
        "⚠️ Analytics tracking error:",
        error
      );
    }
  };


  /* =========================================================
     PAGE VIEW
     ========================================================= */

  window.aboTrackPageView = function () {

    try {

      const payload = getPageContext();

      if (window.gtag && state.ga4) {
        window.gtag(
          "event",
          "page_view",
          payload
        );
      }

      /*
        Facebook PageView يتم إطلاقه أثناء initialization،
        لذلك لا نعيده هنا لتجنب التكرار.
      */

    } catch (error) {
      console.warn(
        "⚠️ Page view tracking error:",
        error
      );
    }
  };


  /* =========================================================
     PRODUCT VIEW
     ========================================================= */

  window.aboTrackProductView = function (product) {

    if (!product) {
      return;
    }

    const item = normalizeProduct(product);

    window.aboTrack(
      "view_product",
      {
        currency: "EGP",

        value: item.price,

        items: [item],

        content_type: "product",

        content_ids: [
          item.item_id
        ],

        content_name: item.item_name
      }
    );
  };


  /* =========================================================
     ADD TO CART
     ========================================================= */

  window.aboTrackAddToCart = function (
    product,
    quantity = 1
  ) {

    if (!product) {
      return;
    }

    const item = normalizeProduct({
      ...product,
      quantity
    });

    window.aboTrack(
      "add_to_cart",
      {
        currency: "EGP",

        value:
          item.price *
          item.quantity,

        items: [item],

        content_type: "product",

        content_ids: [
          item.item_id
        ],

        content_name: item.item_name
      }
    );
  };


  /* =========================================================
     WISHLIST
     ========================================================= */

  window.aboTrackWishlist = function (product) {

    if (!product) {
      return;
    }

    const item = normalizeProduct(product);

    window.aboTrack(
      "add_to_wishlist",
      {
        currency: "EGP",

        value: item.price,

        items: [item],

        content_type: "product",

        content_ids: [
          item.item_id
        ],

        content_name: item.item_name
      }
    );
  };


  /* =========================================================
     SEARCH
     ========================================================= */

  window.aboTrackSearch = function (searchTerm) {

    const term = cleanString(searchTerm);

    if (!term) {
      return;
    }

    window.aboTrack(
      "search",
      {
        search_term: term
      }
    );
  };


  /* =========================================================
     CATEGORY VIEW
     ========================================================= */

  window.aboTrackCategory = function (category) {

    const name = cleanString(category);

    if (!name) {
      return;
    }

    window.aboTrack(
      "view_category",
      {
        item_category: name,

        content_name: name
      }
    );
  };


  /* =========================================================
     SHARE
     ========================================================= */

  window.aboTrackShare = function (
    method = "unknown"
  ) {

    window.aboTrack(
      "share",
      {
        method: cleanString(
          method,
          "unknown"
        )
      }
    );
  };


  /* =========================================================
     CONTACT
     ========================================================= */

  window.aboTrackContact = function (
    method = "unknown"
  ) {

    window.aboTrack(
      "contact",
      {
        method: cleanString(
          method,
          "unknown"
        )
      }
    );
  };


  /* =========================================================
     CHECKOUT
     ========================================================= */

  window.aboTrackCheckout = function (
    items = [],
    value = 0
  ) {

    const normalizedItems =
      Array.isArray(items)
        ? items.map(normalizeProduct)
        : [];

    window.aboTrack(
      "begin_checkout",
      {
        currency: "EGP",

        value: safeNumber(value),

        items: normalizedItems,

        content_type: "product"
      }
    );
  };


  /* =========================================================
     PURCHASE
     ========================================================= */

  window.aboTrackPurchase = function (
    transactionId,
    items = [],
    value = 0
  ) {

    const normalizedItems =
      Array.isArray(items)
        ? items.map(normalizeProduct)
        : [];

    window.aboTrack(
      "purchase",
      {
        transaction_id:
          cleanString(transactionId),

        currency: "EGP",

        value: safeNumber(value),

        items: normalizedItems
      }
    );
  };


  /* =========================================================
     AUTO EVENTS
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
          target.getAttribute("href") || "";

        const text =
          cleanString(
            target.textContent
          ).slice(0, 100);


        /* WhatsApp */

        if (
          href.includes("wa.me") ||
          href.includes("whatsapp.com")
        ) {
          window.aboTrackContact("whatsapp");
        }


        /* Phone */

        if (
          href.startsWith("tel:")
        ) {
          window.aboTrackContact("phone");
        }


        /* Catalog */

        if (
          href.includes("sections.html")
        ) {
          window.aboTrack(
            "view_category",
            {
              content_name:
                "كل الأصناف"
            }
          );
        }


        /* External social links */

        if (
          href.includes("facebook.com") ||
          href.includes("instagram.com") ||
          href.includes("tiktok.com")
        ) {
          window.aboTrack(
            "social_click",
            {
              platform:
                href.includes("facebook")
                  ? "facebook"
                  : href.includes("instagram")
                    ? "instagram"
                    : "tiktok"
            }
          );
        }


        /* Search buttons */

        if (
          target.matches(
            "#headerSearchBtn, #catalogSearchBtn"
          )
        ) {
          const input =
            document.querySelector(
              "#catalogSearch, #headerSearch"
            );

          if (input?.value) {
            window.aboTrackSearch(
              input.value
            );
          }
        }


        /* Share buttons */

        if (
          target.closest(
            "[data-share], .share-btn, .product-share"
          )
        ) {
          window.aboTrackShare(
            text || "share"
          );
        }

      },
      true
    );


    /* Search input */

    const searchInputs =
      document.querySelectorAll(
        "#catalogSearch, #headerSearch"
      );

    searchInputs.forEach(function (input) {

      let lastValue = "";

      input.addEventListener(
        "change",
        function () {

          const value =
            cleanString(input.value);

          if (
            value &&
            value !== lastValue
          ) {
            lastValue = value;

            window.aboTrackSearch(
              value
            );
          }
        }
      );

    });
  }


  /* =========================================================
     PRODUCT DATA EVENT
     ========================================================= */

  function bindProductEvents() {

    document.addEventListener(
      "abo:tarek:ready",
      function (event) {

        const detail =
          event.detail || {};

        if (
          detail.products &&
          Array.isArray(detail.products)
        ) {
          /*
            لا نسجل مشاهدة المنتجات هنا،
            حتى لا يتم احتساب كل المنتجات الموجودة
            في الصفحة كمشاهدات.
          */
        }

      }
    );
  }


  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {

    if (state.initialized) {
      return;
    }

    state.initialized = true;

    initGA4();
    initFacebookPixel();

    bindAutomaticTracking();
    bindProductEvents();

    console.log(
      "✅ ABO TAREK analytics initialized",
      {
        ga4: state.ga4,
        facebook: state.facebook
      }
    );
  }


  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState === "loading"
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


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.ABO_TAREK_ANALYTICS = {
    init,
    track: window.aboTrack,

    productView:
      window.aboTrackProductView,

    addToCart:
      window.aboTrackAddToCart,

    wishlist:
      window.aboTrackWishlist,

    search:
      window.aboTrackSearch,

    category:
      window.aboTrackCategory,

    share:
      window.aboTrackShare,

    contact:
      window.aboTrackContact,

    checkout:
      window.aboTrackCheckout,

    purchase:
      window.aboTrackPurchase,

    status: function () {
      return {
        ga4: state.ga4,
        facebook: state.facebook,
        ga4Id: GA4_ID
          ? "configured"
          : "not configured",
        facebookPixel:
          FB_PIXEL_ID
            ? "configured"
            : "not configured"
      };
    }
  };

})();
