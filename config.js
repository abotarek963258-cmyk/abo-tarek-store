/* =========================================================
   ABO TAREK STORE
   CONFIGURATION MASTER FILE
   DARK NAVY LUXURY EDITION
   ========================================================= */

window.ABO_TAREK = window.ABO_TAREK || {};

window.ABO_TAREK.CONFIG = {

  /* =======================================================
     API
     ======================================================= */

  DATA_URL:
    "https://script.google.com/macros/s/AKfycbycQxcL3WeELjc-YQ6EY86X-QZXUtWKLH2WHz_CDoRY72SIhd5mBRQBUVhVuA-AfgME/exec",

  /* =======================================================
     WHATSAPP
     ======================================================= */

  WHATSAPP_NUMBER:
    "201551604163",


  /* =======================================================
     CACHE KEYS
     ======================================================= */

  CACHE_KEYS: {

    PRODUCTS:
      "abo_tarek_products_v14",

    SETTINGS:
      "abo_tarek_settings_v14",

    CART:
      "abo_tarek_cart_v4",

    WISHLIST:
      "abo_tarek_wishlist_v3",

    RECENT:
      "abo_tarek_recent_v3",

    ADMIN_SESSION:
      "abo_tarek_admin_session_v4"

  },


  /* =======================================================
     CACHE TIMES
     ======================================================= */

  CACHE_TIME:
    30 * 60 * 1000,

  BACKGROUND_REFRESH_TIME:
    5 * 60 * 1000,

  SETTINGS_CACHE_TIME:
    60 * 60 * 1000,


  /* =======================================================
     CATEGORY ICONS
     ======================================================= */

  CATEGORY_ICONS: {

    "سفرة":
      "🍽️",

    "سفرة وأكل":
      "🍽️",

    "شاي وقهوة":
      "☕",

    "أكواب وكاسات":
      "🥛",

    "أكواب":
      "🥛",

    "كاسات":
      "🥂",

    "مطبخ":
      "🍳",

    "أدوات المطبخ":
      "🍳",

    "أواني طهي":
      "🥘",

    "حلل":
      "🥘",

    "ميلامين":
      "🍽️",

    "أدوات منزلية":
      "🏠",

    "منزل":
      "🏠",

    "بلاستيك":
      "🧺",

    "تنظيف":
      "🧹",

    "تخزين":
      "📦",

    "مستلزمات منزلية":
      "🏡"

  },

  FALLBACK_ICON:
    "✦",


  /* =======================================================
     DEFAULT SETTINGS
     ======================================================= */

  DEFAULT_SETTINGS: {

    siteName:
      "أبو طارق للأدوات المنزلية",

    siteTagline:
      "كل اللي بيتك محتاجه في مكان واحد",

    heroTitle:
      "كل اللي بيتك محتاجه في مكان واحد",

    heroSubtitle:
      "من أدوات المطبخ والسفرة، للأكواب والكاسات، والشاي والقهوة",

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

    /* Dark Navy Luxury */
    primaryColor:
      "#D4AF37",

    topStripText:
      "✦ أبو طارق للأدوات المنزلية — توصيل لكل الإسكندرية"

  },


  /* =======================================================
     BRAND COLORS
     ======================================================= */

  COLORS: {

    navy:
      "#071321",

    navySoft:
      "#0A1F33",

    navyCard:
      "#0D263D",

    navyLight:
      "#12324B",

    cream:
      "#F5EFE3",

    creamSoft:
      "#EDE4D2",

    gold:
      "#D4AF37",

    goldLight:
      "#E7C85A",

    goldDark:
      "#A9871F",

    white:
      "#FFFFFF",

    muted:
      "#AAB6C3",

    border:
      "rgba(212, 175, 55, 0.22)"

  },


  /* =======================================================
     SITE INFORMATION
     ======================================================= */

  SITE: {

    NAME:
      "أبو طارق للأدوات المنزلية",

    SHORT_NAME:
      "أبو طارق",

    DESCRIPTION:
      "أبو طارق للأدوات المنزلية في الإسكندرية — أدوات منزلية ومطبخ وسفرة وأكواب وكاسات وشاي وقهوة.",

    CITY:
      "الإسكندرية",

    COUNTRY:
      "مصر"

  },


  /* =======================================================
     CONTACT
     ======================================================= */

  CONTACT: {

    WHATSAPP:
      "201551604163",

    PHONES: [
      "01223599165",
      "01222474380",
      "01201344419",
      "035133602"
    ],

    ADDRESSES: [
      "كوبري الناموس",
      "العوايد"
    ]

  },


  /* =======================================================
     SOCIAL
     ======================================================= */

  SOCIAL: {

    FACEBOOK:
      "https://www.facebook.com/profile.php?id=61587289863971",

    INSTAGRAM:
      "https://www.instagram.com/abotarekstore/",

    TIKTOK:
      "https://www.tiktok.com/@abo.tarek.store2"

  },


  /* =======================================================
     FEATURE FLAGS
     ======================================================= */

  FEATURES: {

    CART:
      true,

    WISHLIST:
      true,

    RECENT:
      true,

    PRODUCT_MODAL:
      true,

    MULTIPLE_IMAGES:
      true,

    PRICES:
      true,

    OFFERS:
      true,

    ADMIN_SETTINGS:
      true,

    ADMIN_IMAGE_UPLOAD:
      true

  },


  /* =======================================================
     PRODUCT SETTINGS
     ======================================================= */

  PRODUCTS: {

    MAX_ADDITIONAL_IMAGES:
      5,

    DEFAULT_SORT:
      "sortOrder",

    SHOW_INACTIVE:
      false,

    SHOW_HOME_ONLY:
      false

  },


  /* =======================================================
     CART SETTINGS
     ======================================================= */

  CART: {

    ENABLED:
      true,

    STORAGE_KEY:
      "abo_tarek_cart_v4",

    WHATSAPP_NUMBER:
      "201551604163",

    MAX_QUANTITY:
      99

  },


  /* =======================================================
     WISHLIST SETTINGS
     ======================================================= */

  WISHLIST: {

    ENABLED:
      true,

    STORAGE_KEY:
      "abo_tarek_wishlist_v3"

  },


  /* =======================================================
     RECENT PRODUCTS
     ======================================================= */

  RECENT: {

    ENABLED:
      true,

    STORAGE_KEY:
      "abo_tarek_recent_v3",

    MAX_ITEMS:
      12

  },


  /* =======================================================
     ADMIN
     ======================================================= */

  ADMIN: {

    SESSION_KEY:
      "abo_tarek_admin_session_v4",

    SESSION_DURATION:
      8 * 60 * 60 * 1000,

    MAX_UPLOAD_MB:
      5,

    MAX_PRODUCT_IMAGES:
      6

  },


  /* =======================================================
     IMAGE SETTINGS
     ======================================================= */

  IMAGES: {

    MAX_SIZE_BYTES:
      5 * 1024 * 1024,

    ALLOWED_TYPES: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif"
    ],

    PRODUCT_FOLDER:
      "products",

    HERO_FOLDER:
      "products/hero",

    LOGO_FOLDER:
      "products/logo"

  },


  /* =======================================================
     PRICE SETTINGS
     ======================================================= */

  PRICING: {

    ENABLED:
      true,

    CURRENCY:
      "جنيه",

    CURRENCY_SHORT:
      "ج.م",

    SHOW_CURRENCY:
      true,

    DECIMAL_PLACES:
      0

  },


  /* =======================================================
     API SETTINGS
     ======================================================= */

  API: {

    METHOD:
      "POST",

    GET_METHOD:
      "GET",

    REQUEST_TIMEOUT:
      20000,

    RETRY_COUNT:
      2

  },


  /* =======================================================
     STORAGE VERSION
     ======================================================= */

  STORAGE_VERSION:
    "14"

};


/* =========================================================
   SAFE GLOBAL ALIASES
   ========================================================= */

window.ABO_TAREK_CONFIG =
  window.ABO_TAREK.CONFIG;


/* =========================================================
   SMALL HELPERS
   ========================================================= */

window.ABO_TAREK.getConfig =
  function (key, fallback) {

    try {

      const config =
        window.ABO_TAREK.CONFIG;

      if (
        key === undefined ||
        key === null ||
        key === ""
      ) {
        return config;
      }

      const parts =
        String(key).split(".");

      let current =
        config;

      for (
        let i = 0;
        i < parts.length;
        i++
      ) {

        if (
          current === null ||
          current === undefined
        ) {
          return fallback;
        }

        if (
          !Object.prototype.hasOwnProperty.call(
            current,
            parts[i]
          )
        ) {
          return fallback;
        }

        current =
          current[parts[i]];
      }

      return current;

    } catch (error) {

      return fallback;

    }

  };


/* =========================================================
   GET CATEGORY ICON
   ========================================================= */

window.ABO_TAREK.getCategoryIcon =
  function (category) {

    const icons =
      window.ABO_TAREK.CONFIG.CATEGORY_ICONS;

    const fallback =
      window.ABO_TAREK.CONFIG.FALLBACK_ICON;

    const name =
      String(
        category || ""
      ).trim();

    if (!name) {
      return fallback;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        icons,
        name
      )
    ) {
      return icons[name];
    }

    return fallback;

  };


/* =========================================================
   GET DEFAULT SETTING
   ========================================================= */

window.ABO_TAREK.getDefaultSetting =
  function (key, fallback) {

    const defaults =
      window.ABO_TAREK.CONFIG.DEFAULT_SETTINGS;

    if (
      Object.prototype.hasOwnProperty.call(
        defaults,
        key
      )
    ) {
      return defaults[key];
    }

    return fallback;

  };


/* =========================================================
   NORMALIZE WHATSAPP NUMBER
   ========================================================= */

window.ABO_TAREK.normalizeWhatsApp =
  function (number) {

    let value =
      String(
        number ||
        window.ABO_TAREK.CONFIG.WHATSAPP_NUMBER ||
        ""
      );

    value =
      value.replace(
        /[^\d]/g,
        ""
      );

    if (
      value.indexOf("00") === 0
    ) {
      value =
        value.substring(2);
    }

    if (
      value.indexOf("01") === 0
    ) {
      value =
        "20" +
        value.substring(1);
    }

    return value;

  };


/* =========================================================
   BUILD WHATSAPP URL
   ========================================================= */

window.ABO_TAREK.buildWhatsAppUrl =
  function (message) {

    const number =
      window.ABO_TAREK.normalizeWhatsApp(
        window.ABO_TAREK.CONFIG.WHATSAPP_NUMBER
      );

    const text =
      encodeURIComponent(
        String(
          message || ""
        )
      );

    return (
      "https://wa.me/" +
      number +
      "?text=" +
      text
    );

  };


/* =========================================================
   EOF
   ========================================================= */
