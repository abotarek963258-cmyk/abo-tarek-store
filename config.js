/* =========================================================
   ABO TAREK STORE
   CONFIGURATION
   FINAL STABLE MASTER

   This file contains:
   - Apps Script API
   - WhatsApp
   - Store identity
   - Contact information
   - Social links
   - Theme
   - Cache settings
   - PWA settings

   IMPORTANT:
   This file DOES NOT fetch data.
   This file DOES NOT initialize the app.
   This file only exposes configuration.
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     MAIN API
     ========================================================= */

  const API_URL =
    "https://script.google.com/macros/s/AKfycbycQxcL3WeELjc-YQ6EY86X-QZXUtWKLH2WHz_CDoRY72SIhd5mBRQBUVhVuA-AfgME/exec";


  /* =========================================================
     STORE
     ========================================================= */

  const STORE = {

    name:
      "أبو طارق للأدوات المنزلية",

    shortName:
      "أبو طارق",

    englishName:
      "Abo Tarek",

    tagline:
      "كل اللي بيتك محتاجه في مكان واحد",

    description:
      "أبو طارق للأدوات المنزلية في الإسكندرية — أدوات منزلية، مطبخ، سفرة، شاي وقهوة، أكواب وكاسات، أواني طهي وميلامين.",

    city:
      "الإسكندرية",

    country:
      "مصر",

    address1:
      "كوبري الناموس",

    address2:
      "العوايد"

  };


  /* =========================================================
     CONTACT
     ========================================================= */

  const CONTACT = {

    whatsapp:
      "201551604163",

    phones: [
      "01223599165",
      "01222474380",
      "01201344419",
      "035133602"
    ]

  };


  /* =========================================================
     SOCIAL
     ========================================================= */

  const SOCIAL = {

    facebook:
      "https://www.facebook.com/profile.php?id=61587289863971",

    instagram:
      "https://www.instagram.com/abotarekstore/",

    tiktok:
      "https://www.tiktok.com/@abo.tarek.store2"

  };


  /* =========================================================
     URLS
     ========================================================= */

  const URLS = {

    home:
      "./index.html",

    catalog:
      "./sections.html",

    product:
      "./product.html",

    admin:
      "./admin.html",

    logo:
      "./assets/logo.png",

    hero:
      "./assets/storefront.jpg",

    storefront:
      "./assets/storefront.jpg"

  };


  /* =========================================================
     THEME
     ========================================================= */

  const THEME = {

    primary:
      "#D4AF37",

    gold:
      "#D4AF37",

    goldDark:
      "#B99628",

    navy:
      "#071321",

    navyLight:
      "#0B1C2D",

    cream:
      "#F7F1E4",

    creamDark:
      "#EEE5D3"

  };


  /* =========================================================
     CACHE
     ========================================================= */

  const CACHE = {

    products:
      "abo_tarek_products_v11",

    catalog:
      "abo_tarek_catalog_v10",

    cart:
      "abo_tarek_cart_v1",

    wishlist:
      "abo_tarek_wishlist_v1",

    settings:
      "abo_tarek_settings_v1",

    ttl:
      30 * 60 * 1000,

    backgroundRefresh:
      10 * 60 * 1000

  };


  /* =========================================================
     PRODUCT LIMITS
     ========================================================= */

  const PRODUCTS = {

    maxImages:
      5,

    maxQuantity:
      99

  };


  /* =========================================================
     CATEGORIES
     ========================================================= */

  const CATEGORIES = {

    icons: {

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
        "🏠"

    }

  };


  /* =========================================================
     UI
     ========================================================= */

  const UI = {

    lazyImageRootMargin:
      "180px",

    searchDebounce:
      120,

    skeletonCount:
      8,

    maxRecentProducts:
      8,

    maxRelatedProducts:
      6

  };


  /* =========================================================
     PWA
     ========================================================= */

  const PWA = {

    enabled:
      true,

    serviceWorker:
      "./sw.js",

    scope:
      "./",

    manifest:
      "./manifest.webmanifest"

  };


  /* =========================================================
     ANALYTICS
     ========================================================= */

  const ANALYTICS = {

    /*
     * Leave empty until real IDs are available.
     * No analytics request is made when IDs are empty.
     */

    googleMeasurementId:
      "",

    facebookPixelId:
      "",

    enabled:
      false

  };


  /* =========================================================
     SEO
     ========================================================= */

  const SEO = {

    siteUrl:
      "https://abotarek963258-cmyk.github.io/abo-tarek-store/",

    defaultTitle:
      "أبو طارق للأدوات المنزلية | أدوات منزلية في الإسكندرية",

    defaultDescription:
      "أبو طارق للأدوات المنزلية في الإسكندرية — تشكيلة من أدوات المطبخ والسفرة والشاي والقهوة والأكواب والكاسات وأواني الطهي واحتياجات البيت.",

    keywords: [
      "أبو طارق",
      "ابو طارق",
      "Abo Tarek",
      "أبو طارق للأدوات المنزلية",
      "أدوات منزلية",
      "أدوات منزلية الإسكندرية",
      "محلات أدوات منزلية الإسكندرية",
      "مستلزمات المطبخ",
      "أدوات المطبخ",
      "أدوات سفرة",
      "أكواب وكاسات",
      "شاي وقهوة",
      "أواني طهي"
    ]

  };


  /* =========================================================
     DEFAULT SITE SETTINGS
     ========================================================= */

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
      "./assets/storefront.jpg",

    logoImage:
      "./assets/logo.png",

    whatsappNumber:
      CONTACT.whatsapp,

    phone1:
      CONTACT.phones[0],

    phone2:
      CONTACT.phones[1],

    phone3:
      CONTACT.phones[2],

    phone4:
      CONTACT.phones[3],

    address1:
      CONTACT.address1,

    address2:
      CONTACT.address2,

    facebookUrl:
      SOCIAL.facebook,

    instagramUrl:
      SOCIAL.instagram,

    tiktokUrl:
      SOCIAL.tiktok,

    primaryColor:
      THEME.primary,

    topStripText:
      "✦ أبو طارق للأدوات المنزلية — توصيل لكل الإسكندرية"

  };


  /* =========================================================
     PUBLIC CONFIG OBJECT
     ========================================================= */

  const CFG = {

    VERSION:
      "7000",

    API_URL,

    DATA_URL:
      API_URL,

    STORE,

    CONTACT,

    SOCIAL,

    URLS,

    THEME,

    CACHE,

    PRODUCTS,

    CATEGORIES,

    UI,

    PWA,

    ANALYTICS,

    SEO,

    DEFAULT_SETTINGS

  };


  /* =========================================================
     GLOBAL EXPORT
     ========================================================= */

  window.ABO_TAREK_CONFIG =
    CFG;

  window.CFG =
    CFG;


  /* =========================================================
     BACKWARD COMPATIBILITY
     ========================================================= */

  /*
   * Older files may use these names.
   * Keeping them prevents unnecessary breakage.
   */

  window.DATA_URL =
    API_URL;

  window.WHATSAPP_NUMBER =
    CONTACT.whatsapp;


  /* =========================================================
     SMALL HELPERS
     ========================================================= */

  window.ABO_TAREK_CONFIG_HELPERS = {

    formatPhone(phone) {

      return String(
        phone || ""
      ).replace(
        /[^\d+]/g,
        ""
      );

    },

    whatsappURL(message = "") {

      return (
        "https://wa.me/" +
        CONTACT.whatsapp +
        (
          message
            ? "?text=" +
              encodeURIComponent(
                message
              )
            : ""
        )
      );

    },

    absoluteURL(path) {

      if (!path) {
        return "";
      }

      try {

        return new URL(
          path,
          window.location.href
        ).href;

      } catch (_) {

        return String(path);

      }

    },

    isExternalURL(value) {

      if (!value) {
        return false;
      }

      return /^https?:\/\//i.test(
        String(value)
      );

    }

  };
})();
