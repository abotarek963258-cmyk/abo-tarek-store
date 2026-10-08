/* =========================================================
   ABO TAREK STORE
   MASTER CONFIGURATION
   DARK NAVY LUXURY
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     API
     ======================================================= */

  const DATA_URL =
    "https://script.google.com/macros/s/AKfycbycQxcL3WeELjc-YQ6EY86X-QZXUtWKLH2WHz_CDoRY72SIhd5mBRQBUVhVuA-AfgME/exec";

  /* =======================================================
     BRAND
     ======================================================= */

  const BRAND = {
    name: "أبو طارق للأدوات المنزلية",
    shortName: "أبو طارق",
    tagline: "كل اللي بيتك محتاجه في مكان واحد",

    colors: {
      navy: "#071321",
      navy2: "#0A1F33",
      navy3: "#102B43",
      cream: "#F7F0E3",
      cream2: "#EFE4D0",
      gold: "#D4AF37",
      goldLight: "#F0D77A",
      white: "#FFFFFF",
      text: "#F7F0E3",
      muted: "#B8C0C9",
      border: "rgba(212,175,55,.20)"
    }
  };

  /* =======================================================
     CONTACT
     ======================================================= */

  const CONTACT = {
    whatsapp: "201551604163",

    phones: [
      "01223599165",
      "01222474380",
      "01201344419",
      "035133602"
    ],

    branches: [
      {
        name: "كوبري الناموس",
        map:
          "https://maps.app.goo.gl/eSGccYFsFV8KmgCF7"
      },
      {
        name: "العوايد",
        map:
          "https://maps.app.goo.gl/UuSj8ifqPBFMFxDY6"
      }
    ]
  };

  /* =======================================================
     SOCIAL
     ======================================================= */

  const SOCIAL = {
    facebook:
      "https://www.facebook.com/profile.php?id=61587289863971",

    instagram:
      "https://www.instagram.com/abotarekstore/",

    tiktok:
      "https://www.tiktok.com/@abo.tarek.store2"
  };

  /* =======================================================
     DEFAULT SETTINGS
     ======================================================= */

  const DEFAULT_SETTINGS = {
    siteName:
      "أبو طارق للأدوات المنزلية",

    siteTagline:
      "كل اللي بيتك محتاجه في مكان واحد",

    heroTitle:
      "كل اللي بيتك محتاجه في مكان واحد",

    heroSubtitle:
      "من أدوات المطبخ والسفرة، للأكواب والكاسات، والشاي والقهوة وكل احتياجات البيت.",

    heroImage:
      "assets/storefront.jpg",

    logoImage:
      "assets/logo.png",

    whatsappNumber:
      "201551604163",

    phone1:
      "01223599165",

    phone2:
      "01222474380",

    phone3:
      "01201344419",

    phone4:
      "035133602",

    address1:
      "كوبري الناموس",

    address2:
      "العوايد",

    facebookUrl:
      "https://www.facebook.com/profile.php?id=61587289863971",

    instagramUrl:
      "https://www.instagram.com/abotarekstore/",

    tiktokUrl:
      "https://www.tiktok.com/@abo.tarek.store2",

    primaryColor:
      "#D4AF37",

    topStripText:
      "✦ أبو طارق للأدوات المنزلية — توصيل لكل الإسكندرية"
  };

  /* =======================================================
     CACHE
     ======================================================= */

  const CACHE_KEYS = {
    products:
      "abo_tarek_products_v15",

    catalog:
      "abo_tarek_catalog_v2",

    settings:
      "abo_tarek_settings_v3",

    sections:
      "abo_tarek_sections_v3",

    cart:
      "abo_tarek_cart_v2",

    wishlist:
      "abo_tarek_wishlist_v2",

    recentlyViewed:
      "abo_tarek_recent_v2"
  };

  const CACHE_TIMES = {
    products:
      30 * 60 * 1000,

    catalog:
      30 * 60 * 1000,

    settings:
      30 * 60 * 1000,

    sections:
      30 * 60 * 1000
  };

  /* =======================================================
     FEATURES
     ======================================================= */

  const FEATURES = {
    cart: true,
    wishlist: true,
    recentlyViewed: true,
    productModal: true,
    productDetails: true,
    multipleImages: true,
    prices: true,
    offers: true,
    adminSettings: true,
    adminImageUpload: true
  };

  /* =======================================================
     PRODUCTS
     ======================================================= */

  const PRODUCTS = {
    maxImages:
      8,

    maxQuantity:
      99,

    defaultSort:
      "sortOrder",

    defaultImage:
      "assets/logo.png"
  };

  /* =======================================================
     IMAGES
     ======================================================= */

  const IMAGES = {
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],

    maxUploadBytes:
      5 * 1024 * 1024,

    folders: {
      products:
        "products",

      hero:
        "products/hero",

      logo:
        "products/logo"
    }
  };

  /* =======================================================
     PRICING
     ======================================================= */

  const PRICING = {
    enabled:
      true,

    currency:
      "جنيه",

    currencyShort:
      "ج.م",

    showBasePrice:
      true,

    showOldPrice:
      true,

    showOfferPrice:
      true
  };

  /* =======================================================
     ADMIN
     ======================================================= */

  const ADMIN = {
    sessionKey:
      "abo_tarek_admin_session_v2",

    sessionHours:
      8,

    uploadMaxBytes:
      5 * 1024 * 1024
  };

  /* =======================================================
     PWA
     ======================================================= */

  const PWA = {
    enabled:
      true,

    serviceWorker:
      "./sw.js",

    scope:
      "./"
  };

  /* =======================================================
     ANALYTICS
     ======================================================= */

  const ANALYTICS = {
    enabled:
      true,

    GA4_ID:
      "",

    GA_ID:
      "",

    FB_PIXEL_ID:
      "",

    FACEBOOK_PIXEL_ID:
      ""
  };

  /* =======================================================
     SEO
     ======================================================= */

  const SEO = {
    siteUrl:
      "https://abotarek963258-cmyk.github.io/abo-tarek-store/",

    siteName:
      "أبو طارق للأدوات المنزلية",

    defaultTitle:
      "أبو طارق للأدوات المنزلية | أدوات منزلية في الإسكندرية",

    defaultDescription:
      "أبو طارق للأدوات المنزلية في الإسكندرية — أدوات مطبخ وسفرة، أكواب وكاسات، شاي وقهوة، أواني طهي وكل احتياجات البيت.",

    keywords:
      [
        "أبو طارق",
        "ابو طارق",
        "Abo Tarek",
        "أبو طارق للأدوات المنزلية",
        "أدوات منزلية",
        "أدوات منزلية الإسكندرية",
        "أدوات مطبخ",
        "أدوات سفرة",
        "أكواب وكاسات",
        "أواني طهي"
      ]
  };

  /* =======================================================
     API SETTINGS
     ======================================================= */

  const API = {
    url:
      DATA_URL,

    timeout:
      25000,

    method:
      "GET",

    version:
      "v15"
  };

  /* =======================================================
     STORAGE
     ======================================================= */

  const STORAGE = {
    version:
      "abo_tarek_storage_v2",

    products:
      CACHE_KEYS.products,

    cart:
      CACHE_KEYS.cart,

    wishlist:
      CACHE_KEYS.wishlist,

    recent:
      CACHE_KEYS.recentlyViewed
  };

  /* =======================================================
     CATEGORY ICONS
     ======================================================= */

  const CATEGORY_ICONS = {
    "سفرة":
      "🍽️",

    "شاي وقهوة":
      "☕",

    "أكواب وكاسات":
      "🥛",

    "مطبخ":
      "🍳",

    "أواني طهي":
      "🥘",

    "ميلامين":
      "🍽️",

    "أدوات منزلية":
      "🏠",

    "تنظيف":
      "🧽",

    "بلاستيك":
      "🧺",

    "default":
      "✦"
  };

  /* =======================================================
     URL HELPERS
     ======================================================= */

  function normalizeWhatsApp(number) {
    let value =
      String(
        number || ""
      ).trim();

    value =
      value.replace(
        /[\s\-()+]/g,
        ""
      );

    if (
      value.indexOf("00") === 0
    ) {
      value =
        value.substring(2);
    }

    if (
      value.indexOf("0") === 0 &&
      value.indexOf("20") !== 0
    ) {
      value =
        "20" +
        value.substring(1);
    }

    return value;
  }


  function buildWhatsAppUrl(
    message
  ) {
    const number =
      normalizeWhatsApp(
        getWhatsAppNumber()
      );

    const text =
      encodeURIComponent(
        String(message || "")
      );

    return (
      "https://wa.me/" +
      number +
      "?text=" +
      text
    );
  }


  function getWhatsAppNumber() {
    const stored =
      getRuntimeSetting(
        "whatsappNumber"
      );

    return normalizeWhatsApp(
      stored ||
      CONTACT.whatsapp
    );
  }


  function getRuntimeSetting(
    key
  ) {
    try {
      const runtime =
        window.ABO_TAREK_SETTINGS;

      if (
        runtime &&
        runtime[key] !== undefined
      ) {
        return runtime[key];
      }
    } catch (_) {}

    return DEFAULT_SETTINGS[key];
  }

  /* =======================================================
     IMAGE URL
     ======================================================= */

  function resolveImageUrl(
    value
  ) {
    const image =
      String(
        value || ""
      ).trim();

    if (!image) {
      return PRODUCTS.defaultImage;
    }

    if (
      image.indexOf("data:image") === 0
    ) {
      return image;
    }

    if (
      image.indexOf("https://") === 0 ||
      image.indexOf("http://") === 0
    ) {
      return image;
    }

    if (
      image.indexOf("//") === 0
    ) {
      return (
        window.location.protocol +
        image
      );
    }

    if (
      image.charAt(0) === "/"
    ) {
      return image;
    }

    try {
      return new URL(
        image,
        window.location.href
      ).href;
    } catch (_) {
      return image;
    }
  }

  /* =======================================================
     PRODUCT PRICE
     ======================================================= */

  function getProductPrice(
    product
  ) {
    if (!product) {
      return 0;
    }

    const offer =
      Number(
        product.offerPrice || 0
      );

    const base =
      Number(
        product.price || 0
      );

    if (
      product.isOffer &&
      offer > 0
    ) {
      return offer;
    }

    return base;
  }


  function formatPrice(
    value
  ) {
    const number =
      Number(value || 0);

    if (
      !isFinite(number) ||
      number <= 0
    ) {
      return "";
    }

    try {
      return (
        new Intl.NumberFormat(
          "ar-EG"
        ).format(number) +
        " " +
        PRICING.currencyShort
      );
    } catch (_) {
      return (
        String(number) +
        " " +
        PRICING.currencyShort
      );
    }
  }

  /* =======================================================
     CATEGORY ICON
     ======================================================= */

  function getCategoryIcon(
    category
  ) {
    const key =
      String(
        category || ""
      ).trim();

    return (
      CATEGORY_ICONS[key] ||
      CATEGORY_ICONS.default
    );
  }

  /* =======================================================
     DEFAULT SETTING
     ======================================================= */

  function getDefaultSetting(
    key
  ) {
    return DEFAULT_SETTINGS[key];
  }

  /* =======================================================
     CONFIG GETTER
     ======================================================= */

  function getConfig() {
    return {
      DATA_URL,
      BRAND,
      CONTACT,
      SOCIAL,
      DEFAULT_SETTINGS,
      CACHE_KEYS,
      CACHE_TIMES,
      FEATURES,
      PRODUCTS,
      IMAGES,
      PRICING,
      ADMIN,
      PWA,
      ANALYTICS,
      SEO,
      API,
      STORAGE,
      CATEGORY_ICONS
    };
  }

  /* =======================================================
     GLOBAL EXPORTS
     ======================================================= */

  window.ABO_TAREK_CONFIG = {
    DATA_URL,

    BRAND,

    CONTACT,

    SOCIAL,

    DEFAULT_SETTINGS,

    CACHE_KEYS,

    CACHE_TIMES,

    FEATURES,

    PRODUCTS,

    IMAGES,

    PRICING,

    ADMIN,

    PWA,

    ANALYTICS,

    SEO,

    API,

    STORAGE,

    CATEGORY_ICONS,

    getConfig,

    getCategoryIcon,

    getDefaultSetting,

    normalizeWhatsApp,

    buildWhatsAppUrl,

    getWhatsAppNumber,

    resolveImageUrl,

    getProductPrice,

    formatPrice,

    getRuntimeSetting,

    VERSION:
      "2026.10.08.15",

    READY:
      true
  };


  /* =======================================================
     BACKWARD COMPATIBILITY
     ======================================================= */

  window.ABO_TAREK =
    window.ABO_TAREK ||
    {};

  Object.assign(
    window.ABO_TAREK,
    window.ABO_TAREK_CONFIG
  );


  /* =======================================================
     RUNTIME SETTINGS HELPER
     ======================================================= */

  window.ABO_TAREK_APPLY_SETTINGS =
    function (settings) {

      if (
        !settings ||
        typeof settings !== "object"
      ) {
        return;
      }

      window.ABO_TAREK_SETTINGS =
        Object.assign(
          {},
          DEFAULT_SETTINGS,
          settings
        );

      try {
        document.documentElement
          .style
          .setProperty(
            "--brand-gold",
            window.ABO_TAREK_SETTINGS.primaryColor ||
              BRAND.colors.gold
          );
      } catch (_) {}
    };


  /* =======================================================
     READY EVENT
     ======================================================= */

  try {
    window.dispatchEvent(
      new CustomEvent(
        "abo-tarek:config-ready",
        {
          detail:
            window.ABO_TAREK_CONFIG
        }
      )
    );
  } catch (_) {}

})();
