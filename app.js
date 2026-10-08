/* =========================================================
   ABO TAREK STORE
   APP ENGINE
   FINAL STABLE EDITION
   Public Data • Products • Sections • Search • Home
   Mobile Menu • Cart Bridge • Site Settings
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};
  const CFG = window.ABO_TAREK_CONFIG || ROOT.CONFIG || {};

  const DATA_URL =
    CFG.DATA_URL ||
    "https://script.google.com/macros/s/AKfycbycQxcL3WeELjc-YQ6EY86X-QZXUtWKLH2WHz_CDoRY72SIhd5mBRQBUVhVuA-AfgME/exec";

  const CACHE_KEY =
    CFG.CACHE_KEYS?.products ||
    "abo_tarek_products_v14";

  const SECTIONS_CACHE_KEY =
    CFG.CACHE_KEYS?.sections ||
    "abo_tarek_sections_v3";

  const SETTINGS_CACHE_KEY =
    CFG.CACHE_KEYS?.settings ||
    "abo_tarek_settings_v3";

  const CACHE_TTL =
    Number(
      CFG.CACHE_TIMES?.products ||
      CFG.CACHE_TTL ||
      30 * 60 * 1000
    );

  const REQUEST_TIMEOUT =
    Number(
      CFG.API?.TIMEOUT ||
      CFG.API_TIMEOUT ||
      25000
    );

  const BG_REFRESH_AFTER =
    Number(
      CFG.CACHE_TIMES?.background ||
      10 * 60 * 1000
    );

  /* =========================================================
     STATE
     ========================================================= */

  let products = [];
  let sections = [];
  let settings = {};

  let initialized = false;
  let refreshInFlight = null;

  let currentSearch = "";
  let currentCategory = "";

  let imageObserver = null;

  let mobileMenuButton = null;
  let mobileMenu = null;

  /* =========================================================
     HELPERS
     ========================================================= */

  function cleanText(value) {
    return String(value == null ? "" : value).trim();
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(
      String(value == null ? "" : value)
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
    );

    return Number.isFinite(n) ? n : fallback;
  }

  function toBool(value, fallback = false) {
    if (value === true || value === 1) {
      return true;
    }

    const text = cleanText(value).toLowerCase();

    if (
      [
        "true",
        "1",
        "yes",
        "y",
        "نعم",
        "صح"
      ].includes(text)
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "n",
        "لا",
        "خطأ"
      ].includes(text)
    ) {
      return false;
    }

    return fallback;
  }

  function getProductId(product) {
    if (!product) {
      return "";
    }

    return cleanText(
      product.id ||
      product.productId ||
      product.code ||
      product.sku ||
      product.name
    );
  }

  function normalizeProduct(product) {
    if (!product || typeof product !== "object") {
      return null;
    }

    const id = getProductId(product);

    if (!id) {
      return null;
    }

    let images = [];

    if (Array.isArray(product.images)) {
      images = product.images
        .map(cleanText)
        .filter(Boolean);
    } else if (typeof product.images === "string") {
      try {
        const parsed = JSON.parse(product.images);

        if (Array.isArray(parsed)) {
          images = parsed
            .map(cleanText)
            .filter(Boolean);
        }
      } catch (error) {
        images = product.images
          .split(/[,\n|]+/)
          .map(cleanText)
          .filter(Boolean);
      }
    }

    const mainImage = cleanText(
      product.image ||
      product.imageUrl ||
      images[0]
    );

    if (mainImage && !images.includes(mainImage)) {
      images.unshift(mainImage);
    }

    return {
      id,

      name: cleanText(
        product.name ||
        product.title ||
        "منتج"
      ),

      category: cleanText(product.category),

      image: mainImage,

      images,

      description: cleanText(
        product.description
      ),

      active: toBool(
        product.active,
        true
      ),

      showHome: toBool(
        product.showHome,
        false
      ),

      isOffer: toBool(
        product.isOffer,
        false
      ),

      sortOrder: safeNumber(
        product.sortOrder,
        0
      ),

      price: safeNumber(
        product.price,
        0
      ),

      oldPrice: safeNumber(
        product.oldPrice,
        0
      ),

      offerPrice: safeNumber(
        product.offerPrice,
        0
      )
    };
  }

  function normalizeSection(section) {
    if (!section || typeof section !== "object") {
      return null;
    }

    const id = cleanText(
      section.id ||
      section.name
    );

    const name = cleanText(
      section.name ||
      section.title
    );

    if (!name) {
      return null;
    }

    return {
      id,
      name,

      sortOrder: safeNumber(
        section.sortOrder,
        0
      ),

      active: toBool(
        section.active,
        true
      )
    };
  }

  function normalizeSettings(value) {
    if (!value || typeof value !== "object") {
      return {};
    }

    return {
      ...value
    };
  }

  function sortProducts(list) {
    return list.sort((a, b) => {
      const orderA = safeNumber(a.sortOrder, 0);
      const orderB = safeNumber(b.sortOrder, 0);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return String(a.name || "").localeCompare(
        String(b.name || ""),
        "ar"
      );
    });
  }

  function sortSections(list) {
    return list.sort((a, b) => {
      const orderA = safeNumber(a.sortOrder, 0);
      const orderB = safeNumber(b.sortOrder, 0);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return String(a.name || "").localeCompare(
        String(b.name || ""),
        "ar"
      );
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function dispatch(name, detail = {}) {
    try {
      document.dispatchEvent(
        new CustomEvent(name, {
          detail
        })
      );
    } catch (error) {}
  }

  /* =========================================================
     IMAGE HELPERS
     ========================================================= */

  function resolveImage(image) {
    if (!image) {
      return "";
    }

    try {
      if (typeof CFG.resolveImageUrl === "function") {
        return CFG.resolveImageUrl(image);
      }

      if (typeof ROOT.resolveImageUrl === "function") {
        return ROOT.resolveImageUrl(image);
      }
    } catch (error) {}

    return image;
  }

  function getProductImage(product) {
    if (!product) {
      return "";
    }

    return resolveImage(
      product.image ||
      (
        Array.isArray(product.images)
          ? product.images[0]
          : ""
      )
    );
  }

  function setupLazyImages() {
    if (!("IntersectionObserver" in window)) {
      document
        .querySelectorAll("img[data-src]")
        .forEach(img => {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        });

      return;
    }

    if (!imageObserver) {
      imageObserver =
        new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (!entry.isIntersecting) {
                return;
              }

              const img = entry.target;
              const src = img.dataset.src;

              if (src) {
                img.src = src;
                img.removeAttribute("data-src");
              }

              imageObserver.unobserve(img);
            });
          },
          {
            rootMargin: "250px 0px"
          }
        );
    }

    document
      .querySelectorAll("img[data-src]")
      .forEach(img => {
        imageObserver.observe(img);
      });
  }

  /* =========================================================
     PRICE
     ========================================================= */

  function getProductPrice(product) {
    if (!product) {
      return 0;
    }

    try {
      if (typeof CFG.getProductPrice === "function") {
        return safeNumber(
          CFG.getProductPrice(product),
          0
        );
      }
    } catch (error) {}

    if (safeNumber(product.offerPrice, 0) > 0) {
      return safeNumber(
        product.offerPrice,
        0
      );
    }

    return safeNumber(
      product.price,
      0
    );
  }

  function formatPrice(value) {
    const amount = safeNumber(value, 0);

    if (amount <= 0) {
      return "";
    }

    try {
      if (typeof CFG.formatPrice === "function") {
        return CFG.formatPrice(amount);
      }

      return (
        new Intl.NumberFormat("ar-EG").format(
          amount
        ) + " جنيه"
      );
    } catch (error) {
      return (
        amount.toLocaleString("en-US") +
        " جنيه"
      );
    }
  }

  /* =========================================================
     STORAGE
     ========================================================= */

  function readStorage(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return fallback;
      }

      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function saveCache() {
    writeStorage(
      CACHE_KEY,
      products
    );

    writeStorage(
      SECTIONS_CACHE_KEY,
      sections
    );

    writeStorage(
      SETTINGS_CACHE_KEY,
      settings
    );

    writeStorage(
      CACHE_KEY + "_time",
      Date.now()
    );
  }

  function getCacheTime() {
    try {
      return safeNumber(
        localStorage.getItem(
          CACHE_KEY + "_time"
        ),
        0
      );
    } catch (error) {
      return 0;
    }
  }

  function loadCache() {
    const cachedProducts =
      readStorage(
        CACHE_KEY,
        []
      );

    const cachedSections =
      readStorage(
        SECTIONS_CACHE_KEY,
        []
      );

    const cachedSettings =
      readStorage(
        SETTINGS_CACHE_KEY,
        {}
      );

    if (Array.isArray(cachedProducts)) {
      products =
        sortProducts(
          cachedProducts
            .map(normalizeProduct)
            .filter(Boolean)
        );
    }

    if (Array.isArray(cachedSections)) {
      sections =
        sortSections(
          cachedSections
            .map(normalizeSection)
            .filter(Boolean)
        );
    }

    settings =
      normalizeSettings(
        cachedSettings
      );

    return (
      products.length > 0 ||
      sections.length > 0
    );
  }

  /* =========================================================
     API
     ========================================================= */

  function fetchWithTimeout(
    url,
    options = {},
    timeout = REQUEST_TIMEOUT
  ) {
    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        () => {
          controller.abort();
        },
        timeout
      );

    return fetch(
      url,
      {
        ...options,
        signal:
          controller.signal
      }
    ).finally(() => {
      window.clearTimeout(timer);
    });
  }

  async function fetchPublicBundle() {
    const url =
      DATA_URL +
      (
        DATA_URL.includes("?")
          ? "&"
          : "?"
      ) +
      "t=" +
      Date.now();

    const response =
      await fetchWithTimeout(
        url,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        "HTTP " +
        response.status
      );
    }

    const data =
      await response.json();

    if (!data || data.ok === false) {
      throw new Error(
        data?.error ||
        "استجابة غير صالحة من السيرفر"
      );
    }

    return data;
  }

  function applyBundle(data) {
    const bundle =
      data?.data &&
      typeof data.data === "object"
        ? data.data
        : data;

    const rawProducts =
      Array.isArray(bundle?.products)
        ? bundle.products
        : [];

    const rawSections =
      Array.isArray(bundle?.sections)
        ? bundle.sections
        : [];

    const rawSettings =
      bundle?.settings &&
      typeof bundle.settings === "object"
        ? bundle.settings
        : {};

    products =
      sortProducts(
        rawProducts
          .map(normalizeProduct)
          .filter(
            product =>
              product &&
              product.active !== false
          )
      );

    sections =
      sortSections(
        rawSections
          .map(normalizeSection)
          .filter(
            section =>
              section &&
              section.active !== false
          )
      );

    settings =
      normalizeSettings(
        rawSettings
      );

    saveCache();

    applySiteSettings();
  }

  async function refreshData(options = {}) {
    if (refreshInFlight) {
      return refreshInFlight;
    }

    refreshInFlight =
      (async () => {
        try {
          const data =
            await fetchPublicBundle();

          applyBundle(data);

          renderAll();

          dispatch(
            "abo-tarek:data-updated",
            {
              products: products.slice(),
              sections: sections.slice(),
              settings: {
                ...settings
              }
            }
          );

          return true;
        } catch (error) {
          if (!options.silent) {
            showConnectionError(error);
          }

          return false;
        } finally {
          refreshInFlight = null;
        }
      })();

    return refreshInFlight;
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function getSetting(key, fallback = "") {
    const value =
      settings?.[key];

    if (
      value == null ||
      value === ""
    ) {
      return fallback;
    }

    return value;
  }

  function setText(selector, value) {
    document
      .querySelectorAll(selector)
      .forEach(element => {
        element.textContent = value;
      });
  }

  function applySiteSettings() {
    const siteName =
      getSetting(
        "siteName",
        "أبو طارق للأدوات المنزلية"
      );

    const tagline =
      getSetting(
        "siteTagline",
        "كل اللي بيتك محتاجه في مكان واحد"
      );

    const heroTitle =
      getSetting(
        "heroTitle",
        "كل اللي بيتك محتاجه في مكان واحد"
      );

    const heroSubtitle =
      getSetting(
        "heroSubtitle",
        "من أدوات المطبخ والسفرة، للأكواب والكاسات، والشاي والقهوة"
      );

    const logo =
      getSetting(
        "logoImage",
        "assets/logo.png"
      );

    const hero =
      getSetting(
        "heroImage",
        "assets/storefront.jpg"
      );

    const whatsapp =
      getSetting(
        "whatsappNumber",
        CFG.WHATSAPP_NUMBER ||
        "201551604163"
      );

    const phone1 =
      getSetting(
        "phone1",
        "01223599165"
      );

    const phone2 =
      getSetting(
        "phone2",
        "01222474380"
      );

    const phone3 =
      getSetting(
        "phone3",
        "01201344419"
      );

    const phone4 =
      getSetting(
        "phone4",
        "035133602"
      );

    const address1 =
      getSetting(
        "address1",
        "كوبري الناموس"
      );

    const address2 =
      getSetting(
        "address2",
        "العوايد"
      );

    setText(
      "[data-site-name]",
      siteName
    );

    setText(
      "[data-site-tagline]",
      tagline
    );

    setText(
      "[data-hero-title]",
      heroTitle
    );

    setText(
      "[data-hero-subtitle]",
      heroSubtitle
    );

    setText(
      "[data-phone-1]",
      phone1
    );

    setText(
      "[data-phone-2]",
      phone2
    );

    setText(
      "[data-phone-3]",
      phone3
    );

    setText(
      "[data-phone-4]",
      phone4
    );

    setText(
      "[data-address-1]",
      address1
    );

    setText(
      "[data-address-2]",
      address2
    );

    document
      .querySelectorAll("[data-site-logo]")
      .forEach(img => {
        img.src =
          resolveImage(logo);
      });

    document
      .querySelectorAll("[data-hero-image]")
      .forEach(img => {
        img.src =
          resolveImage(hero);
      });

    const title =
      document.querySelector("title");

    if (
      title &&
      document.body.classList.contains(
        "dark-luxury-home"
      )
    ) {
      title.textContent =
        siteName +
        " | " +
        tagline;
    }

    const whatsappDigits =
      String(whatsapp || "")
        .replace(/\D/g, "");

    document
      .querySelectorAll("[data-whatsapp]")
      .forEach(link => {
        if (whatsappDigits) {
          link.href =
            "https://wa.me/" +
            whatsappDigits;
        }
      });

    document
      .querySelectorAll("[data-phone]")
      .forEach(link => {
        const phone =
          cleanText(
            link.dataset.phone ||
            phone1
          );

        link.href =
          "tel:" +
          phone.replace(
            /\s+/g,
            ""
          );
      });

    applySocialSettings();

    updateMobileMenuContact(
      whatsappDigits,
      phone1
    );
  }

  function applySocialSettings() {
    const facebook =
      getSetting(
        "facebookUrl",
        ""
      );

    const instagram =
      getSetting(
        "instagramUrl",
        ""
      );

    const tiktok =
      getSetting(
        "tiktokUrl",
        ""
      );

    document
      .querySelectorAll(
        "[data-social='facebook'], [data-setting='facebook']"
      )
      .forEach(link => {
        if (facebook) {
          link.href =
            facebook;
        }
      });

    document
      .querySelectorAll(
        "[data-social='instagram'], [data-setting='instagram']"
      )
      .forEach(link => {
        if (instagram) {
          link.href =
            instagram;
        }
      });

    document
      .querySelectorAll(
        "[data-social='tiktok'], [data-setting='tiktok']"
      )
      .forEach(link => {
        if (tiktok) {
          link.href =
            tiktok;
        }
      });
  }

  function updateMobileMenuContact(
    whatsappDigits,
    phone1
  ) {
    document
      .querySelectorAll(
        ".mobile-menu-contact-btn.whatsapp"
      )
      .forEach(link => {
        if (whatsappDigits) {
          link.href =
            "https://wa.me/" +
            whatsappDigits;
        }
      });

    document
      .querySelectorAll(
        ".mobile-menu-contact-btn.phone"
      )
      .forEach(link => {
        link.href =
          "tel:" +
          String(phone1 || "")
            .replace(/\s+/g, "");
      });
  }

  /* =========================================================
     CATEGORY GRID
     ========================================================= */

  function getCategoryIcon(category) {
    try {
      if (
        typeof CFG.getCategoryIcon ===
        "function"
      ) {
        return CFG.getCategoryIcon(category);
      }
    } catch (error) {}

    const icons = {
      "سفرة": "🍽️",
      "شاي وقهوة": "☕",
      "أكواب وكاسات": "🥛",
      "مطبخ": "🍳",
      "أواني طهي": "🥘",
      "ميلامين": "🍽️",
      "أدوات منزلية": "🏠"
    };

    return (
      icons[cleanText(category)] ||
      "🛍️"
    );
  }

  function renderCategories() {
    const container =
      document.querySelector(
        "#categoryGrid"
      );

    if (!container) {
      return;
    }

    if (!sections.length) {
      const categories =
        [
          ...new Set(
            products
              .map(
                product =>
                  product.category
              )
              .filter(Boolean)
          )
        ];

      sections =
        categories.map(
          (name, index) => ({
            id: name,
            name,
            sortOrder: index,
            active: true
          })
        );
    }

    container.innerHTML =
      sections
        .filter(
          section =>
            section.active !== false
        )
        .map(
          section => {
            const count =
              products.filter(
                product =>
                  product.category ===
                  section.name
              ).length;

            return `
              <a
                class="category-card"
                href="sections.html?category=${encodeURIComponent(
                  section.name
                )}"
                data-category-card
              >
                <span class="category-card-icon">
                  ${getCategoryIcon(
                    section.name
                  )}
                </span>

                <span class="category-card-content">
                  <strong>
                    ${escapeHtml(
                      section.name
                    )}
                  </strong>

                  <small>
                    ${count}
                    ${
                      count === 1
                        ? "منتج"
                        : "منتجات"
                    }
                  </small>
                </span>

                <span class="category-card-arrow">
                  ←
                </span>
              </a>
            `;
          }
        )
        .join("");

    setupLazyImages();
  }

  /* =========================================================
     PRODUCT CARD
     ========================================================= */

  function renderProductCard(
    product,
    options = {}
  ) {
    const price =
      getProductPrice(product);

    const oldPrice =
      safeNumber(
        product.oldPrice,
        0
      );

    const isOffer =
      toBool(
        product.isOffer,
        false
      );

    const image =
      getProductImage(product);

    const lazy =
      options.lazy !== false;

    const features =
      window.ABO_TAREK_FEATURES;

    const favorite =
      features &&
      typeof features.isInWishlist ===
        "function"
        ? features.isInWishlist(product)
        : false;

    const imageHtml =
      image
        ? `
          <img
            ${
              lazy
                ? `data-src="${escapeHtml(image)}"`
                : `src="${escapeHtml(image)}"`
            }
            src="${
              lazy
                ? "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                : escapeHtml(image)
            }"
            alt="${escapeHtml(
              product.name
            )}"
            loading="lazy"
            decoding="async"
          >
        `
        : `
          <div class="product-card-placeholder">
            🛍️
          </div>
        `;

    return `
      <article
        class="product-card"
        data-product-id="${escapeHtml(
          product.id
        )}"
      >
        <div class="product-card-media">

          ${
            isOffer
              ? `
                <span class="product-offer-badge">
                  عرض
                </span>
              `
              : ""
          }

          <button
            type="button"
            class="wishlist-btn ${
              favorite
                ? "is-active active"
                : ""
            }"
            data-product-id="${escapeHtml(
              product.id
            )}"
            data-wishlist-id="${escapeHtml(
              product.id
            )}"
            aria-label="${
              favorite
                ? "إزالة من المفضلة"
                : "إضافة للمفضلة"
            }"
            aria-pressed="${
              favorite
                ? "true"
                : "false"
            }"
          >
            <span data-wishlist-icon>
              ${
                favorite
                  ? "♥"
                  : "♡"
              }
            </span>
          </button>

          <a
            class="product-card-image-link"
            href="product.html?id=${encodeURIComponent(
              product.id
            )}"
            aria-label="${escapeHtml(
              product.name
            )}"
          >
            ${imageHtml}
          </a>
        </div>

        <div class="product-card-body">

          ${
            product.category
              ? `
                <span class="product-card-category">
                  ${escapeHtml(
                    product.category
                  )}
                </span>
              `
              : ""
          }

          <h3 class="product-card-title">
            <a
              href="product.html?id=${encodeURIComponent(
                product.id
              )}"
            >
              ${escapeHtml(
                product.name
              )}
            </a>
          </h3>

          ${
            product.description
              ? `
                <p class="product-card-description">
                  ${escapeHtml(
                    product.description
                  ).slice(0, 110)}
                </p>
              `
              : ""
          }

          <div class="product-card-bottom">

            <div class="product-card-pricing">

              ${
                price > 0
                  ? `
                    <strong class="product-price">
                      ${formatPrice(price)}
                    </strong>
                  `
                  : `
                    <span class="product-price product-price-empty">
                      السعر عند الطلب
                    </span>
                  `
              }

              ${
                oldPrice > price &&
                price > 0
                  ? `
                    <del class="product-old-price">
                      ${formatPrice(oldPrice)}
                    </del>
                  `
                  : ""
              }

            </div>

            <button
              type="button"
              class="add-to-cart-btn"
              data-product-id="${escapeHtml(
                product.id
              )}"
            >
              <span>🛒</span>
              <span>أضف للسلة</span>
            </button>

          </div>

          <a
            class="product-details-link"
            href="product.html?id=${encodeURIComponent(
              product.id
            )}"
          >
            عرض التفاصيل
            <span>←</span>
          </a>

        </div>
      </article>
    `;
  }

  /* =========================================================
     PRODUCT COLLECTIONS
     ========================================================= */

  function getFeaturedProducts() {
    return products
      .filter(
        product =>
          product.showHome
      )
      .slice(0, 12);
  }

  function getOfferProducts() {
    return products
      .filter(
        product =>
          product.isOffer
      )
      .slice(0, 12);
  }

  function getLatestProducts() {
    return products.slice(0, 12);
  }

  function renderProductCollection(
    selector,
    list,
    emptyText =
      "لا توجد منتجات حالياً"
  ) {
    const container =
      document.querySelector(
        selector
      );

    if (!container) {
      return;
    }

    if (!list.length) {
      container.innerHTML = `
        <div class="products-empty">
          <span>🛍️</span>
          <p>
            ${escapeHtml(
              emptyText
            )}
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      list
        .map(
          product =>
            renderProductCard(
              product
            )
        )
        .join("");

    setupLazyImages();
  }

  function renderHomeProducts() {
    const featured =
      getFeaturedProducts();

    const latest =
      getLatestProducts();

    const offers =
      getOfferProducts();

    renderProductCollection(
      "#offersGrid",
      offers,
      "لا توجد عروض حالياً"
    );

    const mainProducts =
      featured.length
        ? featured
        : latest;

    renderProductCollection(
      "#productsGrid",
      mainProducts,
      "لا توجد منتجات حالياً"
    );

    renderRecentlyViewed();
  }

  /* =========================================================
     RECENTLY VIEWED
     ========================================================= */

  function renderRecentlyViewed() {
    const section =
      document.querySelector(
        "#recentlyViewed"
      );

    const grid =
      document.querySelector(
        "#recentlyViewedGrid"
      );

    if (!section || !grid) {
      return;
    }

    let recent = [];

    try {
      if (
        window.ABO_TAREK_FEATURES &&
        typeof window
          .ABO_TAREK_FEATURES
          .getRecentlyViewed ===
          "function"
      ) {
        recent =
          window.ABO_TAREK_FEATURES
            .getRecentlyViewed();
      }
    } catch (error) {}

    if (!recent.length) {
      section.hidden = true;
      return;
    }

    const mapped =
      recent
        .map(
          recentProduct => {
            const id =
              getProductId(
                recentProduct
              );

            return (
              products.find(
                product =>
                  getProductId(
                    product
                  ) === id
              ) ||
              normalizeProduct(
                recentProduct
              )
            );
          }
        )
        .filter(Boolean)
        .slice(0, 8);

    if (!mapped.length) {
      section.hidden = true;
      return;
    }

    section.hidden = false;

    grid.innerHTML =
      mapped
        .map(
          product =>
            renderProductCard(
              product
            )
        )
        .join("");

    setupLazyImages();
  }

  /* =========================================================
     SEARCH / FILTER
     ========================================================= */

  function getFilteredProducts() {
    let result =
      products.slice();

    if (currentCategory) {
      result =
        result.filter(
          product =>
            product.category ===
            currentCategory
        );
    }

    const query =
      cleanText(
        currentSearch
      ).toLowerCase();

    if (query) {
      result =
        result.filter(
          product => {
            const haystack =
              [
                product.name,
                product.category,
                product.description
              ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(
              query
            );
          }
        );
    }

    return result;
  }

  function runSearch(query) {
    currentSearch =
      cleanText(query);

    const filtered =
      getFilteredProducts();

    const grid =
      document.querySelector(
        "#productsGrid"
      );

    if (grid) {
      renderProductCollection(
        "#productsGrid",
        filtered,
        "مفيش منتجات مطابقة لبحثك"
      );
    }

    if (
      currentSearch ||
      currentCategory
    ) {
      const section =
        document.querySelector(
          "#products"
        );

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }

    dispatch(
      "abo-tarek:search",
      {
        query:
          currentSearch,
        category:
          currentCategory,
        results:
          filtered.length
      }
    );
  }

  function setCategory(category) {
    currentCategory =
      cleanText(category);

    const filtered =
      getFilteredProducts();

    renderProductCollection(
      "#productsGrid",
      filtered,
      "لا توجد منتجات في هذا القسم"
    );

    dispatch(
      "abo-tarek:category-changed",
      {
        category:
          currentCategory,
        results:
          filtered.length
      }
    );
  }

  /* =========================================================
     PRODUCT ACTIONS
     ========================================================= */

  function findProductById(id) {
    const cleanId =
      cleanText(id);

    if (!cleanId) {
      return null;
    }

    return (
      products.find(
        product =>
          getProductId(
            product
          ) === cleanId
      ) ||
      null
    );
  }

  function handleProductActions(event) {
    const addButton =
      event.target.closest(
        ".add-to-cart-btn"
      );

    if (addButton) {
      event.preventDefault();
      event.stopPropagation();

      const id =
        addButton.getAttribute(
          "data-product-id"
        );

      const product =
        findProductById(id);

      if (!product) {
        return;
      }

      const features =
        window.ABO_TAREK_FEATURES;

      if (
        features &&
        typeof features.addToCart ===
          "function"
      ) {
        features.addToCart(
          product,
          1
        );
      }

      updateMobileCartCount();

      return;
    }

    const wishlistButton =
      event.target.closest(
        ".wishlist-btn"
      );

    if (wishlistButton) {
      event.preventDefault();
      event.stopPropagation();

      const id =
        wishlistButton.getAttribute(
          "data-product-id"
        ) ||
        wishlistButton.getAttribute(
          "data-wishlist-id"
        );

      const product =
        findProductById(id);

      if (!product) {
        return;
      }

      const features =
        window.ABO_TAREK_FEATURES;

      if (
        features &&
        typeof features.toggleWishlist ===
          "function"
      ) {
        features.toggleWishlist(
          product
        );
      }

      updateRenderedWishlistState();

      return;
    }
  }

  function updateRenderedWishlistState() {
    const features =
      window.ABO_TAREK_FEATURES;

    if (
      !features ||
      typeof features.isInWishlist !==
        "function"
    ) {
      return;
    }

    document
      .querySelectorAll(
        ".wishlist-btn[data-product-id]"
      )
      .forEach(button => {
        const id =
          button.getAttribute(
            "data-product-id"
          );

        const active =
          features.isInWishlist(id);

        button.classList.toggle(
          "is-active",
          active
        );

        button.classList.toggle(
          "active",
          active
        );

        button.setAttribute(
          "aria-pressed",
          active
            ? "true"
            : "false"
        );

        const icon =
          button.querySelector(
            "[data-wishlist-icon]"
          );

        if (icon) {
          icon.textContent =
            active
              ? "♥"
              : "♡";
        }
      });
  }

  /* =========================================================
     SEARCH EVENTS
     ========================================================= */

  function setupSearch() {
    const forms =
      document.querySelectorAll(
        "[data-site-search], #siteSearchForm, .site-search-form, #headerSearchForm"
      );

    forms.forEach(form => {
      if (
        form.dataset.appSearchReady ===
        "1"
      ) {
        return;
      }

      form.dataset.appSearchReady =
        "1";

      form.addEventListener(
        "submit",
        event => {
          event.preventDefault();

          const input =
            form.querySelector(
              "input[name='q'], input[type='search'], input"
            );

          runSearch(
            input
              ? input.value
              : ""
          );
        }
      );
    });

    document
      .querySelectorAll(
        "[data-search-input], #headerSearchInput"
      )
      .forEach(input => {
        if (
          input.dataset.appSearchReady ===
          "1"
        ) {
          return;
        }

        input.dataset.appSearchReady =
          "1";

        input.addEventListener(
          "input",
          event => {
            const value =
              event.target.value;

            if (
              value.length === 0 ||
              value.length >= 2
            ) {
              currentSearch =
                value;

              renderProductCollection(
                "#productsGrid",
                getFilteredProducts(),
                "مفيش منتجات مطابقة لبحثك"
              );
            }
          }
        );
      });
  }

  /* =========================================================
     MOBILE MENU
     ========================================================= */

  function getMobileMenuElements() {
    const button =
      document.querySelector(
        "#menuBtn, #menuToggle, [data-menu-toggle], [data-mobile-menu-toggle], .menu-toggle"
      );

    const menu =
      document.querySelector(
        "#mobileMenu, [data-mobile-menu], .mobile-menu"
      );

    return {
      button,
      menu
    };
  }

  function isMobileMenuOpen() {
    return Boolean(
      mobileMenu &&
      mobileMenu.classList.contains(
        "is-open"
      )
    );
  }

  function updateMobileMenuAria(open) {
    if (mobileMenuButton) {
      mobileMenuButton.setAttribute(
        "aria-expanded",
        open ? "true" : "false"
      );

      mobileMenuButton.setAttribute(
        "aria-label",
        open
          ? "إغلاق القائمة"
          : "فتح القائمة"
      );

      mobileMenuButton.classList.toggle(
        "is-active",
        open
      );
    }

    if (mobileMenu) {
      mobileMenu.setAttribute(
        "aria-hidden",
        open ? "false" : "true"
      );
    }
  }

  function openMobileMenu() {
    if (!mobileMenu) {
      return;
    }

    mobileMenu.classList.add(
      "is-open"
    );

    document.body.classList.add(
      "mobile-menu-open"
    );

    updateMobileMenuAria(true);

    updateMobileCartCount();

    const firstLink =
      mobileMenu.querySelector(
        ".mobile-menu-link, .mobile-menu-close"
      );

    if (firstLink) {
      window.setTimeout(() => {
        try {
          firstLink.focus({
            preventScroll: true
          });
        } catch (error) {}
      }, 80);
    }
  }

  function closeMobileMenu() {
    if (!mobileMenu) {
      return;
    }

    mobileMenu.classList.remove(
      "is-open"
    );

    document.body.classList.remove(
      "mobile-menu-open"
    );

    updateMobileMenuAria(false);
  }

  function toggleMobileMenu() {
    if (isMobileMenuOpen()) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function updateMobileCartCount() {
    const countElement =
      document.querySelector(
        "#mobileMenuCartCount"
      );

    if (!countElement) {
      return;
    }

    let count = 0;

    try {
      const features =
        window.ABO_TAREK_FEATURES;

      if (
        features &&
        typeof features.getCartCount ===
          "function"
      ) {
        count =
          safeNumber(
            features.getCartCount(),
            0
          );
      } else {
        const cart =
          readStorage(
            "abo_tarek_cart_v1",
            []
          );

        if (Array.isArray(cart)) {
          count =
            cart.reduce(
              (total, item) =>
                total +
                safeNumber(
                  item?.quantity,
                  0
                ),
              0
            );
        }
      }
    } catch (error) {}

    countElement.textContent =
      String(count);

    countElement.classList.toggle(
      "has-items",
      count > 0
    );
  }

  function setupMobileMenu() {
    const elements =
      getMobileMenuElements();

    const button =
      elements.button;

    const menu =
      elements.menu;

    if (!button || !menu) {
      return;
    }

    mobileMenuButton =
      button;

    mobileMenu =
      menu;

    if (
      mobileMenu.dataset.appMobileMenuReady !==
      "1"
    ) {
      mobileMenu.dataset.appMobileMenuReady =
        "1";

      mobileMenu
        .querySelectorAll(
          "[data-mobile-menu-close], .mobile-menu-backdrop, .mobile-menu-close"
        )
        .forEach(element => {
          element.addEventListener(
            "click",
            event => {
              event.preventDefault();
              closeMobileMenu();
            }
          );
        });

      mobileMenu
        .querySelectorAll(
          ".mobile-menu-link:not(.mobile-menu-button)"
        )
        .forEach(link => {
          link.addEventListener(
            "click",
            () => {
              closeMobileMenu();
            }
          );
        });

      const cartButton =
        mobileMenu.querySelector(
          "[data-cart-button]"
        );

      if (cartButton) {
        cartButton.addEventListener(
          "click",
          event => {
            event.preventDefault();

            closeMobileMenu();

            window.setTimeout(() => {
              const features =
                window.ABO_TAREK_FEATURES;

              if (
                features &&
                typeof features.openCart ===
                  "function"
              ) {
                features.openCart();
              }
            }, 120);
          }
        );
      }
    }

    if (
      button.dataset.appMobileMenuButtonReady !==
      "1"
    ) {
      button.dataset.appMobileMenuButtonReady =
        "1";

      button.addEventListener(
        "click",
        event => {
          event.preventDefault();
          event.stopPropagation();

          toggleMobileMenu();
        }
      );
    }

    updateMobileMenuAria(
      isMobileMenuOpen()
    );

    updateMobileCartCount();
  }

  function setupMobileMenuGlobalEvents() {
    if (
      document.body.dataset.mobileMenuGlobalReady ===
      "1"
    ) {
      return;
    }

    document.body.dataset.mobileMenuGlobalReady =
      "1";

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape" &&
          isMobileMenuOpen()
        ) {
          closeMobileMenu();

          if (mobileMenuButton) {
            try {
              mobileMenuButton.focus({
                preventScroll: true
              });
            } catch (error) {}
          }
        }
      }
    );

    window.addEventListener(
      "resize",
      () => {
        if (
          window.innerWidth > 850 &&
          isMobileMenuOpen()
        ) {
          closeMobileMenu();
        }
      }
    );

    document.addEventListener(
      "abo-tarek:cart-updated",
      () => {
        updateMobileCartCount();
      }
    );

    document.addEventListener(
      "abo-tarek:cart-changed",
      () => {
        updateMobileCartCount();
      }
    );

    document.addEventListener(
      "abo-tarek:features-ready",
      () => {
        updateMobileCartCount();
      }
    );
  }

  /* =========================================================
     ACTIVE NAV
     ========================================================= */

  function setupActiveNavigation() {
    const path =
      window.location.pathname;

    const page =
      path.endsWith("sections.html")
        ? "sections"
        : path.endsWith("product.html")
        ? "product"
        : "home";

    document
      .querySelectorAll(
        "[data-nav]"
      )
      .forEach(link => {
        const value =
          cleanText(
            link.getAttribute(
              "data-nav"
            )
          );

        link.classList.toggle(
          "is-active",
          value === page
        );
      });
  }

  /* =========================================================
     WHATSAPP BUTTONS
     ========================================================= */

  function setupWhatsAppButtons() {
    const number =
      String(
        getSetting(
          "whatsappNumber",
          CFG.WHATSAPP_NUMBER ||
          "201551604163"
        )
      ).replace(
        /\D/g,
        ""
      );

    if (!number) {
      return;
    }

    document
      .querySelectorAll(
        "[data-whatsapp]"
      )
      .forEach(button => {
        if (
          button.dataset.whatsappReady ===
          "1"
        ) {
          return;
        }

        button.dataset.whatsappReady =
          "1";

        button.href =
          "https://wa.me/" +
          number;
      });
  }

  /* =========================================================
     CONNECTION UI
     ========================================================= */

  function setLoading(active) {
    document.body.classList.toggle(
      "is-loading-data",
      active
    );
  }

  function showConnectionError(error) {
    console.warn(
      "[Abo Tarek] Data refresh failed:",
      error
    );

    if (
      products.length ||
      sections.length
    ) {
      return;
    }

    const grids =
      document.querySelectorAll(
        "#productsGrid, #offersGrid, #categoryGrid"
      );

    grids.forEach(grid => {
      if (!grid) {
        return;
      }

      grid.innerHTML = `
        <div class="products-error">
          <span>⚠️</span>
          <strong>
            تعذر تحميل البيانات حالياً
          </strong>
          <p>
            تأكد من الاتصال بالإنترنت وحاول مرة أخرى.
          </p>
          <button
            type="button"
            class="retry-data-btn"
          >
            إعادة المحاولة
          </button>
        </div>
      `;
    });
  }

  function setupRetry() {
    if (
      document.body.dataset.retryReady ===
      "1"
    ) {
      return;
    }

    document.body.dataset.retryReady =
      "1";

    document.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            ".retry-data-btn"
          );

        if (!button) {
          return;
        }

        refreshData({
          silent: false
        });
      }
    );
  }

  /* =========================================================
     ONLINE / OFFLINE
     ========================================================= */

  function setupConnectionEvents() {
    if (
      document.body.dataset.connectionReady ===
      "1"
    ) {
      return;
    }

    document.body.dataset.connectionReady =
      "1";

    window.addEventListener(
      "online",
      () => {
        document.body.classList.remove(
          "is-offline"
        );

        refreshData({
          silent: true
        });
      }
    );

    window.addEventListener(
      "offline",
      () => {
        document.body.classList.add(
          "is-offline"
        );
      }
    );
  }

  /* =========================================================
     VISIBILITY / BACKGROUND REFRESH
     ========================================================= */

  function setupVisibilityRefresh() {
    if (
      document.body.dataset.visibilityReady ===
      "1"
    ) {
      return;
    }

    document.body.dataset.visibilityReady =
      "1";

    document.addEventListener(
      "visibilitychange",
      () => {
        if (
          document.visibilityState !==
          "visible"
        ) {
          return;
        }

        const cacheAge =
          Date.now() -
          getCacheTime();

        if (
          cacheAge >
          BG_REFRESH_AFTER
        ) {
          refreshData({
            silent: true
          });
        }

        updateMobileCartCount();
      }
    );
  }

  /* =========================================================
     RENDER ALL
     ========================================================= */

  function renderAll() {
    applySiteSettings();

    renderCategories();

    renderHomeProducts();

    setupSearch();

    setupMobileMenu();

    setupMobileMenuGlobalEvents();

    setupActiveNavigation();

    setupWhatsAppButtons();

    setupLazyImages();

    updateRenderedWishlistState();

    updateMobileCartCount();

    const features =
      window.ABO_TAREK_FEATURES;

    if (
      features &&
      typeof features.refreshFeatureButtons ===
        "function"
    ) {
      features.refreshFeatureButtons();
    }
  }

  /* =========================================================
     EVENT SETUP
     ========================================================= */

  function setupEvents() {
    if (
      document.body.dataset.appEventsReady ===
      "1"
    ) {
      return;
    }

    document.body.dataset.appEventsReady =
      "1";

    document.addEventListener(
      "click",
      handleProductActions
    );

    document.addEventListener(
      "abo-tarek:wishlist-updated",
      () => {
        updateRenderedWishlistState();
      }
    );

    document.addEventListener(
      "abo-tarek:recently-viewed-updated",
      () => {
        renderRecentlyViewed();
      }
    );

    document.addEventListener(
      "abo-tarek:features-ready",
      () => {
        updateRenderedWishlistState();
        renderRecentlyViewed();
        updateMobileCartCount();
      }
    );

    document.addEventListener(
      "abo-tarek:cart-updated",
      () => {
        updateMobileCartCount();
      }
    );

    setupRetry();

    setupConnectionEvents();

    setupVisibilityRefresh();

    setupMobileMenuGlobalEvents();
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  const API = {
    version:
      "final-stable-1.1.0",

    get products() {
      return products.slice();
    },

    get sections() {
      return sections.slice();
    },

    get settings() {
      return {
        ...settings
      };
    },

    getProductById:
      findProductById,

    getProducts:
      () =>
        products.slice(),

    getSections:
      () =>
        sections.slice(),

    getSettings:
      () => ({
        ...settings
      }),

    search:
      runSearch,

    filterByCategory:
      setCategory,

    refresh:
      () =>
        refreshData({
          silent: false
        }),

    getProductPrice,

    formatPrice,

    normalizeProduct,

    resolveImage,

    openMobileMenu,

    closeMobileMenu,

    toggleMobileMenu,

    getMobileMenuState:
      isMobileMenuOpen,

    updateMobileCartCount
  };

  window.ABO_TAREK_APP =
    API;

  /* =========================================================
     INIT
     ========================================================= */

  async function init() {
    if (initialized) {
      return;
    }

    initialized = true;

    setLoading(true);

    loadCache();

    setupEvents();

    renderAll();

    /*
      لو عندنا Cache:
      الصفحة تظهر فوراً،
      وبعدها نعمل تحديث هادئ.
    */
    if (
      products.length ||
      sections.length
    ) {
      setLoading(false);

      const cacheAge =
        Date.now() -
        getCacheTime();

      refreshData({
        silent: true
      });

      if (
        cacheAge <=
        CACHE_TTL
      ) {
        dispatch(
          "abo-tarek:app-ready",
          {
            products:
              products.slice(),
            sections:
              sections.slice(),
            settings: {
              ...settings
            }
          }
        );

        return;
      }
    }

    /*
      مفيش Cache:
      أول طلب لازم يجيب البيانات.
    */
    await refreshData({
      silent: false
    });

    setLoading(false);

    dispatch(
      "abo-tarek:app-ready",
      {
        products:
          products.slice(),
        sections:
          sections.slice(),
        settings: {
          ...settings
        }
      }
    );
  }

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
