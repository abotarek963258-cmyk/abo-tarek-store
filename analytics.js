/* =========================================================
   ABO TAREK STORE - ANALYTICS
   Google Analytics 4 + Facebook Pixel
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     املأ الـ IDs هنا (اختياري)
     لو مش عندك IDs، سيبهم فاضيين
     ========================================================= */

  const GA4_ID = "";
  const FB_PIXEL_ID = "";

  /* =========================================================
     Google Analytics 4
     ========================================================= */

  if (GA4_ID && GA4_ID.trim()) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID, {
      page_title: document.title,
      page_location: window.location.href,
      language: "ar",
      currency: "EGP"
    });
  }

  /* =========================================================
     Facebook Pixel
     ========================================================= */

  if (FB_PIXEL_ID && FB_PIXEL_ID.trim()) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("init", FB_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  /* =========================================================
     Track Function - Universal
     ========================================================= */

  window.aboTrack = function (eventName, data = {}) {
    try {
      if (window.gtag) {
        window.gtag("event", eventName, data);
      }

      if (window.fbq) {
        const fbEvents = {
          "view_product": "ViewContent",
          "add_to_cart": "AddToCart",
          "begin_checkout": "InitiateCheckout",
          "purchase": "Purchase",
          "contact": "Contact",
          "search": "Search",
          "view_category": "ViewContent"
        };
        const fbEvent = fbEvents[eventName] || eventName;
        window.fbq("track", fbEvent, data);
      }
    } catch (err) {
      console.warn("Track error:", err);
    }
  };

  console.log("✅ analytics.js loaded");

})();
