/* =========================================================
   ABO TAREK STORE
   CONFIG.JS
   إعدادات موحدة لكل الموقع
   ========================================================= */

window.ABO_TAREK = window.ABO_TAREK || {};

window.ABO_TAREK.CONFIG = {

  /* ===== API ===== */
  DATA_URL: "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec",

  /* ===== WhatsApp ===== */
  WHATSAPP_NUMBER: "201551604163",

  /* ===== Cache Keys ===== */
  CACHE_KEYS: {
    PRODUCTS: "abo_tarek_products_v12",
    SETTINGS: "abo_tarek_settings_v12",
    CART: "abo_tarek_cart_v2",
    WISHLIST: "abo_tarek_wishlist_v1",
    RECENT: "abo_tarek_recent_v1",
    ADMIN_SESSION: "abo_tarek_admin_session_v2"
  },

  /* ===== Cache Times ===== */
  CACHE_TIME: 30 * 60 * 1000,
  BACKGROUND_REFRESH_TIME: 5 * 60 * 1000,
  SETTINGS_CACHE_TIME: 60 * 60 * 1000,

  /* ===== Icons ===== */
  CATEGORY_ICONS: {
    "سفرة": "🍽️",
    "شاي وقهوة": "☕",
    "أكواب وكاسات": "🥛",
    "مطبخ": "🍳",
    "أواني طهي": "🥘",
    "ميلامين": "🟩",
    "أدوات منزلية": "🏠",
    "مستلزمات المنزل": "🏠",
    "أطقم عشاء": "🍽️",
    "أكواب": "☕",
    "كاسات": "🥂",
    "صيني": "🍽️",
    "بلاستيك": "🧺",
    "زجاج": "🫙",
    "منظمات": "🗂️",
    "الكل": "🛍️"
  },

  FALLBACK_ICON: "✦",

  /* ===== Default Settings (لو Apps Script مش رجع حاجة) ===== */
  DEFAULT_SETTINGS: {
    siteName: "أبو طارق للأدوات المنزلية",
    siteTagline: "كل اللي بيتك محتاجه في مكان واحد",
    heroTitle: "كل اللي بيتك محتاجه في مكان واحد",
    heroSubtitle: "من أدوات المطبخ والسفرة، للأكواب والكاسات، والشاي والقهوة",
    heroImage: "assets/storefront.jpg",
    logoImage: "assets/logo.png",
    whatsappNumber: "201551604163",
    phone1: "01223599165",
    phone2: "01222474380",
    phone3: "01201344419",
    phone4: "035133602",
    address1: "كوبري الناموس",
    address2: "العوايد",
    facebookUrl: "https://www.facebook.com/profile.php?id=61587289863971",
    instagramUrl: "https://www.instagram.com/abotarekstore/",
    tiktokUrl: "https://www.tiktok.com/@abo.tarek.store2",
    primaryColor: "#c9a45b",
    topStripText: "✦ أبو طارق للأدوات المنزلية"
  }
};

/* ===== Helpers مشتركة ===== */

window.ABO_TAREK.UTILS = {

  cleanText: function (value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  },

  escapeHtml: function (value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  escapeAttribute: function (value) {
    return window.ABO_TAREK.UTILS.escapeHtml(value);
  },

  normalizeArabic: function (value) {
    return window.ABO_TAREK.UTILS.cleanText(value)
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ـ/g, "")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/\s+/g, " ");
  },

  isActive: function (value) {
    if (value === false || value === 0) return false;
    const text = window.ABO_TAREK.UTILS.normalizeArabic(value);
    if (["false", "0", "no", "inactive", "غير نشط", "مخفي"].includes(text)) {
      return false;
    }
    return true;
  },

  isFlagEnabled: function (value, defaultValue) {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;

    const text = window.ABO_TAREK.UTILS.normalizeArabic(value);

    if (["false", "0", "no", "off", "مخفي"].includes(text)) return false;
    if (["true", "1", "yes", "on", "نعم", "ظاهر"].includes(text)) return true;

    return defaultValue;
  },

  parsePrice: function (value) {
    if (value === null || value === undefined) return 0;
    const text = window.ABO_TAREK.UTILS.cleanText(value);
    if (!text) return 0;
    const numeric = Number(text.replace(/,/g, "").replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  },

  formatPrice: function (value) {
    const price = window.ABO_TAREK.UTILS.cleanText(value);
    if (!price) return "";
    const numeric = window.ABO_TAREK.UTILS.parsePrice(price);
    if (Number.isFinite(numeric) && numeric > 0) {
      return new Intl.NumberFormat("ar-EG").format(numeric) + " جنيه";
    }
    return price;
  },

  categoryIcon: function (category) {
    const key = window.ABO_TAREK.UTILS.cleanText(category);
    const icons = window.ABO_TAREK.CONFIG.CATEGORY_ICONS;
    return icons[key] || window.ABO_TAREK.CONFIG.FALLBACK_ICON;
  },

  getImageSources: function (image) {
    const original = window.ABO_TAREK.UTILS.cleanText(image);
    if (!original) return [];
    const sources = [];

    if (
      original.startsWith("https://") ||
      original.startsWith("http://") ||
      original.startsWith("data:")
    ) {
      sources.push(original);
      return sources;
    }

    const relative = original.replace(/^\.?\//, "").replace(/^\/+/, "");
    sources.push(
      "https://abotarek963258-cmyk.github.io/abo-tarek-store/" +
      relative.split("/").map(function (p) { return encodeURIComponent(p); }).join("/")
    );
    return sources;
  }
};

console.log("✅ config.js loaded");
