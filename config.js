/* =========================================================
   ABO TAREK STORE
   CONFIGURATION MASTER
   DARK NAVY LUXURY
   FINAL STABLE EDITION
   ========================================================= */

(function () {
  "use strict";

  window.ABO_TAREK = window.ABO_TAREK || {};

  /* =======================================================
     MASTER CONFIG
     ======================================================= */

  const CONFIG = {

    /* -------------------------------------------------------
       API
       ------------------------------------------------------- */

    DATA_URL:
      "https://script.google.com/macros/s/AKfycbycQxcL3WeELjc-YQ6EY86X-QZXUtWKLH2WHz_CDoRY72SIhd5mBRQBUVhVuA-AfgME/exec",

    /* -------------------------------------------------------
       CONTACT
       ------------------------------------------------------- */

    WHATSAPP_NUMBER: "201551604163",

    CONTACT: {
      WHATSAPP: "201551604163",

      PHONES: [
        "01223599165",
        "01222474380",
        "01201344419",
        "035133602"
      ],

      PHONE1: "01223599165",
      PHONE2: "01222474380",
      PHONE3: "01201344419",
      PHONE4: "035133602",

      ADDRESSES: [
        "كوبري الناموس",
        "العوايد"
      ],

      ADDRESS1: "كوبري الناموس",
      ADDRESS2: "العوايد"
    },

    /* -------------------------------------------------------
       SOCIAL
       ------------------------------------------------------- */

    SOCIAL: {
      FACEBOOK:
        "https://www.facebook.com/profile.php?id=61587289863971",

      INSTAGRAM:
        "https://www.instagram.com/abotarekstore/",

      TIKTOK:
        "https://www.tiktok.com/@abo.tarek.store2"
    },

    /* -------------------------------------------------------
       LOCAL STORAGE
       ------------------------------------------------------- */

    CACHE_KEYS: {
      PRODUCTS: "abo_tarek_products_v14",
      SETTINGS: "abo_tarek_settings_v14",
      CART: "abo_tarek_cart_v4",
      WISHLIST: "abo_tarek_wishlist_v3",
      RECENT: "abo_tarek_recent_v3",
      ADMIN_SESSION: "abo_tarek_admin_session_v4"
    },

    CACHE_TIME: 30 * 60 * 1000,

    BACKGROUND_REFRESH_TIME: 5 * 60 * 1000,

    SETTINGS_CACHE_TIME: 60 * 60 * 1000,

    /* -------------------------------------------------------
       CATEGORY ICONS
       ------------------------------------------------------- */

    CATEGORY_ICONS: {
      "سفرة": "🍽️",
      "سفرة وطعام": "🍽️",

      "شاي وقهوة": "☕",
      "شاي": "☕",
      "قهوة": "☕",

      "أكواب وكاسات": "🥛",
      "أكواب": "🥛",
      "كاسات": "🥛",

      "مطبخ": "🍳",
      "أدوات المطبخ": "🍳",

      "أواني طهي": "🥘",
      "حلل وأواني": "🥘",

      "ميلامين": "🍽️",

      "أدوات منزلية": "🏠",
      "أدوات منزلية متنوعة": "🏠",

      "تنظيف": "🧹",

      "تخزين": "🧺",

      "بلاستيك": "🧴",

      "أخرى": "✦"
    },

    FALLBACK_ICON: "✦",

    /* -------------------------------------------------------
       DEFAULT SETTINGS
       ------------------------------------------------------- */

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

      primaryColor:
        "#D4AF37",

      topStripText:
        "✦ أبو طارق للأدوات المنزلية — توصيل لكل الإسكندرية"
    },

    /* -------------------------------------------------------
       SITE
       ------------------------------------------------------- */

    SITE: {
      NAME:
        "أبو طارق للأدوات المنزلية",

      TAGLINE:
        "كل اللي بيتك محتاجه في مكان واحد",

      CITY:
        "الإسكندرية",

      COUNTRY:
        "مصر",

      LANGUAGE:
        "ar",

      DIR:
        "rtl",

      CURRENCY:
        "ج.م"
    },

    /* -------------------------------------------------------
       COLORS
       ------------------------------------------------------- */

    COLORS: {

      NAVY:
        "#071321",

      NAVY_2:
        "#0B1D30",

      NAVY_3:
        "#102943",

      NAVY_4:
        "#12304A",

      NAVY_SOFT:
        "#173957",

      CREAM:
        "#F6F0E2",

      CREAM_2:
        "#FBF8F1",

      CREAM_3:
        "#EBE2CF",

      GOLD:
        "#D4AF37",

      GOLD_2:
        "#E4C35A",

      GOLD_3:
        "#F2D98B",

      TEXT:
        "#F6F0E2",

      TEXT_DARK:
        "#071321",

      MUTED:
        "#AEB8C4",

      BORDER:
        "rgba(212,175,55,.22)"
    },

    /* -------------------------------------------------------
       FEATURES
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       PRODUCTS
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       CART
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       WISHLIST
       ------------------------------------------------------- */

    WISHLIST: {

      ENABLED:
        true,

      STORAGE_KEY:
        "abo_tarek_wishlist_v3"
    },

    /* -------------------------------------------------------
       RECENT PRODUCTS
       ------------------------------------------------------- */

    RECENT: {

      ENABLED:
        true,

      STORAGE_KEY:
        "abo_tarek_recent_v3",

      MAX_ITEMS:
        12
    },

    /* -------------------------------------------------------
       ADMIN
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       IMAGES
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       PRICING
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       API BEHAVIOR
       ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       STORAGE VERSION
       ------------------------------------------------------- */

    STORAGE_VERSION:
      "14"
  };


  /* =======================================================
     EXPOSE MASTER CONFIG
     ======================================================= */

  window.ABO_TAREK.CONFIG = CONFIG;

  /*
     Compatibility alias.
     بعض الملفات القديمة تعتمد على ABO_TAREK_CONFIG مباشرة.
  */

  window.ABO_TAREK_CONFIG = CONFIG;


  /* =======================================================
     SAFE GETTER
     ======================================================= */

  window.ABO_TAREK.getConfig = function (key, fallback) {

    try {

      if (!key) {
        return fallback;
      }

      const parts = String(key).split(".");
      let value = CONFIG;

      for (let i = 0; i < parts.length; i++) {

        if (
          value === null ||
          value === undefined ||
          !Object.prototype.hasOwnProperty.call(value, parts[i])
        ) {
          return fallback;
        }

        value = value[parts[i]];
      }

      return value === undefined ? fallback : value;

    } catch (error) {

      return fallback;
    }
  };


  /* =======================================================
     CATEGORY ICON
     ======================================================= */

  window.ABO_TAREK.getCategoryIcon = function (category) {

    const value = String(category || "").trim();

    if (!value) {
      return CONFIG.FALLBACK_ICON;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        CONFIG.CATEGORY_ICONS,
        value
      )
    ) {
      return CONFIG.CATEGORY_ICONS[value];
    }

    const normalized = value.toLowerCase();

    const keys = Object.keys(CONFIG.CATEGORY_ICONS);

    for (let i = 0; i < keys.length; i++) {

      const key = String(keys[i]).toLowerCase();

      if (
        normalized.indexOf(key) !== -1 ||
        key.indexOf(normalized) !== -1
      ) {
        return CONFIG.CATEGORY_ICONS[keys[i]];
      }
    }

    return CONFIG.FALLBACK_ICON;
  };


  /* =======================================================
     DEFAULT SETTING
     ======================================================= */

  window.ABO_TAREK.getDefaultSetting = function (
    key,
    fallback
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        CONFIG.DEFAULT_SETTINGS,
        key
      )
    ) {
      return CONFIG.DEFAULT_SETTINGS[key];
    }

    return fallback;
  };


  /* =======================================================
     NORMALIZE WHATSAPP NUMBER
     ======================================================= */

  window.ABO_TAREK.normalizeWhatsApp = function (number) {

    let value = String(number || "").trim();

    if (!value) {
      value = CONFIG.WHATSAPP_NUMBER;
    }

    /*
      إزالة أي مسافات أو رموز.
    */

    value = value.replace(/[^\d+]/g, "");

    /*
      لو الرقم يبدأ بـ +
    */

    if (value.charAt(0) === "+") {
      value = value.substring(1);
    }

    /*
      مصر:
      015xxxxxxxx
      010xxxxxxxx
      011xxxxxxxx
      012xxxxxxxx
      016xxxxxxxx

      تتحول إلى:
      2015xxxxxxxx
      2010xxxxxxxx
      ...
    */

    if (/^01\d{9}$/.test(value)) {
      value = "20" + value.substring(1);
    }

    /*
      لو مكتوب 20 بالفعل.
    */

    if (/^20\d{10}$/.test(value)) {
      return value;
    }

    /*
      لو الرقم محلي بعدد غير قياسي،
      نرجعه كما هو بدل ما نفسده.
    */

    return value;
  };


  /* =======================================================
     BUILD WHATSAPP URL
     ======================================================= */

  window.ABO_TAREK.buildWhatsAppUrl = function (message) {

    const number =
      window.ABO_TAREK.normalizeWhatsApp(
        CONFIG.WHATSAPP_NUMBER
      );

    const text =
      encodeURIComponent(
        String(message || "")
      );

    return "https://wa.me/" + number + "?text=" + text;
  };


  /* =======================================================
     GET CONTACT NUMBER
     ======================================================= */

  window.ABO_TAREK.getWhatsAppNumber = function (settings) {

    const source =
      settings &&
      settings.whatsappNumber
        ? settings.whatsappNumber
        : CONFIG.WHATSAPP_NUMBER;

    return window.ABO_TAREK.normalizeWhatsApp(source);
  };


  /* =======================================================
     IMAGE URL HELPER
     ======================================================= */

  window.ABO_TAREK.resolveImageUrl = function (
    image,
    fallback
  ) {

    const value = String(image || "").trim();

    if (!value) {
      return fallback || "assets/storefront.jpg";
    }

    /*
      روابط كاملة.
    */

    if (
      /^https?:\/\//i.test(value) ||
      /^data:image\//i.test(value)
    ) {
      return value;
    }

    /*
      مسار GitHub / assets.
    */

    if (value.charAt(0) === "/") {
      return value;
    }

    return value;
  };


  /* =======================================================
     PRODUCT PRICE HELPERS
     ======================================================= */

  window.ABO_TAREK.getProductPrice = function (product) {

    if (!product) {
      return null;
    }

    const offer =
      Number(product.offerPrice);

    const price =
      Number(product.price);

    const oldPrice =
      Number(product.oldPrice);

    if (
      product.isOffer === true &&
      Number.isFinite(offer) &&
      offer > 0
    ) {
      return offer;
    }

    if (
      Number.isFinite(price) &&
      price > 0
    ) {
      return price;
    }

    if (
      Number.isFinite(oldPrice) &&
      oldPrice > 0
    ) {
      return oldPrice;
    }

    return null;
  };


  window.ABO_TAREK.formatPrice = function (value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "";
    }

    return (
      number.toLocaleString("ar-EG", {
        maximumFractionDigits:
          CONFIG.PRICING.DECIMAL_PLACES
      }) +
      " " +
      CONFIG.PRICING.CURRENCY_SHORT
    );
  };


  /* =======================================================
     DEBUG / VERSION
     ======================================================= */

  window.ABO_TAREK.VERSION =
    "14.0.0";

  window.ABO_TAREK.CONFIG_READY =
    true;


  /* =======================================================
     OPTIONAL CONSOLE MESSAGE
     ======================================================= */

  if (
    window.location &&
    window.location.hostname === "localhost"
  ) {

    console.log(
      "[Abo Tarek] Config loaded:",
      CONFIG
    );
  }

})();
