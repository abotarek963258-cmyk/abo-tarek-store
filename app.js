/* =========================================================
   ABO TAREK STORE
   app.js
   FINAL — HOMEPAGE PRODUCTS + STABLE ORDER + WISHLIST BRIDGE
   ========================================================= */

(() => {
  "use strict";

  const CFG =
    window.ABO_TAREK_CONFIG ||
    window.CFG ||
    {};

  const DATA_URL =
    window.DATA_URL ||
    CFG.DATA_URL ||
    "https://script.google.com/macros/s/AKfycbycQxcL3WeELjc-YQ6EY86X-QZXUtWKLH2WHz_CDoRY72SIhd5mBRQBUVhVuA-AfgME/exec";

  const WHATSAPP_NUMBER =
    window.WHATSAPP_NUMBER ||
    "201551604163";

  const CACHE_KEY =
    CFG?.CACHE?.productsKey ||
    "abo_tarek_products_v11";

  const CACHE_TTL =
    Number(CFG?.CACHE?.ttl) ||
    30 * 60 * 1000;

  const BACKGROUND_REFRESH_TIME =
    Number(CFG?.CACHE?.backgroundRefresh) ||
    10 * 60 * 1000;

  const CATEGORY_ICONS = {
    "سفرة": "🍽️",
    "شاي وقهوة": "☕",
    "أكواب وكاسات": "🥛",
    "مطبخ": "🍳",
    "أواني طهي": "🥘",
    "ميلامين": "🍽️",
    "أدوات منزلية": "🏠"
  };

  const FALLBACK_ICON = "🏠";

  let products = [];
  let sections = [];
  let activeCategory = "الكل";
  let searchTerm = "";
  let productsPromise = null;
  let backgroundRefreshTimer = null;

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  function cleanText(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeArabic(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ـ/g, "")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/\s+/g, " ");
  }

  function isActive(value) {
    if (
      value === false ||
      value === 0 ||
      value === null ||
      value === undefined
    ) {
      return false;
    }

    const valueText = normalizeArabic(value);

    return ![
      "false",
      "0",
      "no",
      "inactive",
      "غير نشط"
    ].includes(valueText);
  }

  function toNumber(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number =
      Number(
        String(value)
          .replace(/,/g, "")
          .replace(/[^\d.-]/g, "")
      );

    return Number.isFinite(number)
      ? number
      : null;
  }

  function categoryIcon(category) {
    return (
      CATEGORY_ICONS[cleanText(category)] ||
      FALLBACK_ICON
    );
  }

  function getImageSources(image) {
    const original = cleanText(image);

    if (!original) {
      return [];
    }

    if (
      original.startsWith("https://") ||
      original.startsWith("http://") ||
      original.startsWith("data:")
    ) {
      return [original];
    }

    const relative =
      original
        .replace(/^\.?\//, "")
        .replace(/^\/+/, "");

    return [
      "https://abotarek963258-cmyk.github.io/abo-tarek-store/" +
      relative
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/")
    ];
  }

  function getProductImages(product) {
    const list = [];

    function add(value) {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(add);
        return;
      }

      String(value)
        .split(/\n|,/)
        .map(cleanText)
        .filter(Boolean)
        .forEach(item => {
          if (!list.includes(item)) {
            list.push(item);
          }
        });
    }

    add(product?.images);
    add(product?.image);

    return list.slice(0, 5);
  }

  function getProductPrice(product) {
    const offer = toNumber(product?.offerPrice);
    const price = toNumber(product?.price);

    if (
      isActive(product?.isOffer) &&
      offer !== null
    ) {
      return offer;
    }

    return price;
  }

  function formatPrice(value) {
    const number = toNumber(value);

    if (number === null) {
      return "";
    }

    return (
      new Intl.NumberFormat("ar-EG", {
        maximumFractionDigits: 2
      }).format(number) +
      " ج.م"
    );
  }

  function whatsappUrl(product) {
    const name = cleanText(product?.name);

    const message = name
      ? `السلام عليكم، عايز أعرف تفاصيل عن صنف: ${name}`
      : "السلام عليكم، عايز أعرف تفاصيل عن أحد الأصناف الموجودة عندكم.";

    return (
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(message)
    );
  }

  function normalizeProduct(raw, index = 0) {
    const product = {
      ...raw
    };

    product.id =
      cleanText(
        raw?.id ??
        raw?.ID ??
        raw?.Id ??
        `product-${index + 1}`
      );

    product.name =
      cleanText(
        raw?.name ??
        raw?.Name ??
        "صنف بدون اسم"
      );

    product.category =
      cleanText(
        raw?.category ??
        raw?.Category ??
        "أدوات منزلية"
      );

    product.image =
      cleanText(
        raw?.image ??
        raw?.Image ??
        ""
      );

    product.images =
      raw?.images ??
      raw?.Images ??
      "";

    product.description =
      cleanText(
        raw?.description ??
        raw?.Description ??
        ""
      );

    product.active =
      isActive(
        raw?.active ??
        raw?.Active ??
        true
      );

    product.showHome =
      isActive(
        raw?.showHome ??
        raw?.ShowHome ??
        true
      );

    product.isOffer =
      isActive(
        raw?.isOffer ??
        raw?.IsOffer ??
        false
      );

    product.sortOrder =
      toNumber(
        raw?.sortOrder ??
        raw?.SortOrder
      ) ??
      999999;

    product.price =
      raw?.price ??
      raw?.Price ??
      "";

    product.oldPrice =
      raw?.oldPrice ??
      raw?.OldPrice ??
      "";

    product.offerPrice =
      raw?.offerPrice ??
      raw?.OfferPrice ??
      "";

    return product;
  }

  function normalizeSection(raw, index = 0) {
    return {
      id: cleanText(raw?.id ?? `section-${index + 1}`),
      name: cleanText(raw?.name ?? ""),
      sortOrder:
        toNumber(raw?.sortOrder) ??
        999999,
      active:
        isActive(raw?.active ?? true)
    };
  }

  function readCache() {
    try {
      const raw =
        localStorage.getItem(CACHE_KEY);

      if (!raw) {
        return null;
      }

      const data =
        JSON.parse(raw);

      if (
        !data ||
        !Array.isArray(data.products) ||
        !data.time
      ) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  function writeCache(list) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          time: Date.now(),
          products: list
        })
      );
    } catch {}
  }

  async function fetchProducts() {
    const url =
      DATA_URL +
      (DATA_URL.includes("?") ? "&" : "?") +
      "action=list";

    const response =
      await fetch(url, {
        method: "GET",
        cache: "no-store"
      });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (data?.ok === false) {
      throw new Error(
        data?.error ||
        data?.message ||
        "تعذر تحميل الأصناف"
      );
    }

    const rawProducts =
      Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data)
          ? data
          : [];

    return rawProducts
      .map(normalizeProduct)
      .filter(item => item.active)
      .sort((a, b) => {
        const aOrder =
          Number(a.sortOrder) || 999999;

        const bOrder =
          Number(b.sortOrder) || 999999;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.name.localeCompare(
          b.name,
          "ar"
        );
      });
  }

  async function getProducts(force = false) {
    if (
      productsPromise &&
      !force
    ) {
      return productsPromise;
    }

    const cached =
      readCache();

    if (
      !force &&
      cached &&
      Date.now() - cached.time <
        CACHE_TTL
    ) {
      return cached.products;
    }

    if (!productsPromise) {
      productsPromise =
        fetchProducts()
          .then(list => {
            writeCache(list);
            return list;
          })
          .finally(() => {
            productsPromise = null;
          });
    }

    return productsPromise;
  }

  function refreshInBackground() {
    if (backgroundRefreshTimer) {
      clearTimeout(
        backgroundRefreshTimer
      );
    }

    backgroundRefreshTimer =
      setTimeout(async () => {
        try {
          const cached =
            readCache();

          if (
            !cached ||
            Date.now() - cached.time >=
              BACKGROUND_REFRESH_TIME
          ) {
            const fresh =
              await getProducts(true);

            if (
              Array.isArray(fresh) &&
              fresh.length
            ) {
              products =
                fresh;

              renderHomepageProducts();
              renderOffers();
              renderRecentlyViewed();
            }
          }
        } catch {}
      }, 800);
  }

  function createProductImage(
    product,
    eager = false
  ) {
    const wrapper =
      document.createElement("div");

    wrapper.className =
      "product-image";

    const sources =
      getImageSources(
        product.image
      );

    if (!sources.length) {
      wrapper.innerHTML = `
        <div class="product-image-placeholder">
          <span class="placeholder-icon">
            ${escapeHtml(
              categoryIcon(
                product.category
              )
            )}
          </span>
        </div>
      `;

      return wrapper;
    }

    const img =
      document.createElement("img");

    img.alt =
      product.name
        ? `صورة ${product.name}`
        : "صورة المنتج";

    img.width = 600;
    img.height = 600;
    img.decoding = "async";
    img.loading =
      eager
        ? "eager"
        : "lazy";

    if (!eager) {
      img.fetchPriority =
        "low";
    }

    img.src =
      sources[0];

    img.addEventListener(
      "error",
      () => {
        wrapper.innerHTML = `
          <div class="product-image-placeholder">
            <span class="placeholder-icon">
              ${escapeHtml(
                categoryIcon(
                  product.category
                )
              )}
            </span>
          </div>
        `;
      },
      { once: true }
    );

    wrapper.appendChild(img);

    return wrapper;
  }

  function createProductCard(
    product,
    index = 0
  ) {
    const article =
      document.createElement("article");

    article.className =
      "product";

    article.dataset.id =
      product.id;

    article.dataset.category =
      product.category;

    const image =
      createProductImage(
        product,
        index < 2
      );

    article.appendChild(image);

    if (product.isOffer) {
      const badge =
        document.createElement("div");

      badge.className =
        "offer-badge";

      badge.innerHTML =
        "🔥 عرض";

      image.appendChild(
        badge
      );
    }

    const body =
      document.createElement("div");

    body.className =
      "product-body";

    const category =
      document.createElement("span");

    category.className =
      "product-category";

    category.textContent =
      product.category;

    body.appendChild(category);

    const title =
      document.createElement("h3");

    title.textContent =
      product.name;

    body.appendChild(title);

    const description =
      document.createElement("p");

    description.className =
      "product-description-short";

    description.textContent =
      product.description ||
      "تفاصيل المنتج متاحة عند فتح الصنف.";

    body.appendChild(
      description
    );

    const details =
      document.createElement("button");

    details.type = "button";
    details.className =
      "product-details-trigger";

    details.textContent =
      "عرض التفاصيل";

    details.dataset.productModal =
      product.id;

    body.appendChild(
      details
    );

    const priceRow =
      document.createElement("div");

    priceRow.className =
      "product-price-row";

    const currentPrice =
      getProductPrice(product);

    if (currentPrice !== null) {
      const price =
        document.createElement("strong");

      price.className =
        "product-price";

      price.textContent =
        formatPrice(currentPrice);

      priceRow.appendChild(price);
    } else {
      const noPrice =
        document.createElement("span");

      noPrice.className =
        "product-price product-price-placeholder";

      noPrice.textContent =
        "اسأل عن السعر";

      priceRow.appendChild(
        noPrice
      );
    }

    const oldPrice =
      toNumber(product.oldPrice);

    if (
      product.isOffer &&
      oldPrice !== null &&
      currentPrice !== null &&
      oldPrice > currentPrice
    ) {
      const old =
        document.createElement("del");

      old.className =
        "product-old-price";

      old.textContent =
        formatPrice(oldPrice);

      priceRow.appendChild(old);
    }

    body.appendChild(
      priceRow
    );

    const actions =
      document.createElement("div");

    actions.className =
      "product-actions";

    const favorite =
      document.createElement("button");

    favorite.type = "button";
    favorite.className =
      "favorite-btn";

    favorite.dataset.wishlistId =
      product.id;

    favorite.setAttribute(
      "aria-label",
      "إضافة للمفضلة"
    );

    favorite.innerHTML =
      "♡";

    actions.appendChild(
      favorite
    );

    const cart =
      document.createElement("button");

    cart.type = "button";
    cart.className =
      "add-cart-btn";

    cart.dataset.addToCart =
      product.id;

    cart.textContent =
      "🛒 إضافة للسلة";

    actions.appendChild(
      cart
    );

    body.appendChild(
      actions
    );

    const footer =
      document.createElement("div");

    footer.className =
      "product-footer";

    footer.innerHTML = `
      <a
        class="product-whatsapp"
        href="${escapeHtml(
          whatsappUrl(product)
        )}"
        target="_blank"
        rel="noopener noreferrer"
      >
        💬 اسأل عن الصنف
      </a>
    `;

    body.appendChild(
      footer
    );

    article.appendChild(
      body
    );

    article.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "button,a"
          )
        ) {
          return;
        }

        if (
          window.ABO_TAREK_FEATURES &&
          typeof
            window.ABO_TAREK_FEATURES.openProductModal ===
              "function"
        ) {
          window.ABO_TAREK_FEATURES.openProductModal(
            product
          );
        }
      }
    );

    return article;
  }

  function getHomepageProducts() {
    return products
      .filter(
        product =>
          product.active &&
          product.showHome
      )
      .sort((a, b) => {
        const ao =
          Number(a.sortOrder) ||
          999999;

        const bo =
          Number(b.sortOrder) ||
          999999;

        if (ao !== bo) {
          return ao - bo;
        }

        return a.name.localeCompare(
          b.name,
          "ar"
        );
      });
  }

  function getFilteredHomepageProducts() {
    let list =
      getHomepageProducts();

    const normalizedSearch =
      normalizeArabic(searchTerm);

    if (activeCategory !== "الكل") {
      list =
        list.filter(
          product =>
            normalizeArabic(
              product.category
            ) ===
            normalizeArabic(
              activeCategory
            )
        );
    }

    if (normalizedSearch) {
      list =
        list.filter(
          product => {
            const haystack =
              normalizeArabic(
                [
                  product.name,
                  product.category,
                  product.description
                ].join(" ")
              );

            return haystack.includes(
              normalizedSearch
            );
          }
        );
    }

    return list;
  }

  function renderHomepageProducts() {
    const grid =
      $("#productsGrid");

    if (!grid) {
      return;
    }

    const list =
      getFilteredHomepageProducts();

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🔎</div>
          <h3>مفيش أصناف مطابقة</h3>
          <p>
            جرّب اسم صنف تاني أو اختار قسم مختلف.
          </p>
        </div>
      `;
      return;
    }

    const fragment =
      document.createDocumentFragment();

    list.forEach(
      (product, index) => {
        fragment.appendChild(
          createProductCard(
            product,
            index
          )
        );
      }
    );

    grid.replaceChildren(
      fragment
    );

    if (
      window.ABO_TAREK_FEATURES &&
      typeof
        window.ABO_TAREK_FEATURES.refreshWishlistUI ===
          "function"
    ) {
      window.ABO_TAREK_FEATURES.refreshWishlistUI();
    }
  }

  function renderCategories() {
    const grid =
      $("#categoryGrid");

    if (!grid) {
      return;
    }

    const names =
      sections
        .filter(section => section.active)
        .sort(
          (a, b) =>
            a.sortOrder -
            b.sortOrder
        )
        .map(
          section => section.name
        );

    const fallback =
      [
        ...new Set(
          products.map(
            product =>
              product.category
          )
        )
      ];

    const categories =
      names.length
        ? names
        : fallback;

    grid.innerHTML = "";

    categories.forEach(
      category => {
        if (!category) return;

        const button =
          document.createElement("button");

        button.type = "button";
        button.className =
          "category-card";

        button.dataset.category =
          category;

        button.innerHTML = `
          <span class="cat-icon">
            ${escapeHtml(
              categoryIcon(category)
            )}
          </span>
          <strong>
            ${escapeHtml(category)}
          </strong>
          <span class="cat-count">
            ${products.filter(
              p =>
                p.category ===
                category
            ).length}
            صنف
          </span>
        `;

        grid.appendChild(
          button
        );
      }
    );
  }

  function renderOffers() {
    const section =
      $("#offers");

    const grid =
      $("#offersGrid");

    if (!section || !grid) {
      return;
    }

    const offers =
      products.filter(
        product =>
          product.active &&
          product.isOffer
      );

    if (!offers.length) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    grid.innerHTML = "";

    offers
      .slice(0, 8)
      .forEach(
        (product, index) => {
          grid.appendChild(
            createProductCard(
              product,
              index
            )
          );
        }
      );

    if (
      window.ABO_TAREK_FEATURES &&
      typeof
        window.ABO_TAREK_FEATURES.refreshWishlistUI ===
          "function"
    ) {
      window.ABO_TAREK_FEATURES.refreshWishlistUI();
    }
  }

  function getRecentlyViewed() {
    try {
      return JSON.parse(
        localStorage.getItem(
          "abo_tarek_recently_viewed_v1"
        ) || "[]"
      );
    } catch {
      return [];
    }
  }

  function renderRecentlyViewed() {
    const section =
      $("#recentlyViewed");

    const grid =
      $("#recentlyViewedGrid");

    if (!section || !grid) {
      return;
    }

    const ids =
      getRecentlyViewed();

    const list =
      ids
        .map(
          id =>
            products.find(
              product =>
                product.id ===
                String(id)
            )
        )
        .filter(Boolean)
        .slice(0, 4);

    if (!list.length) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    grid.innerHTML = "";

    list.forEach(
      (product, index) => {
        grid.appendChild(
          createProductCard(
            product,
            index
          )
        );
      }
    );

    if (
      window.ABO_TAREK_FEATURES &&
      typeof
        window.ABO_TAREK_FEATURES.refreshWishlistUI ===
          "function"
    ) {
      window.ABO_TAREK_FEATURES.refreshWishlistUI();
    }
  }

  function initSearch() {
    const input =
      $("#productSearchInput");

    if (!input) {
      return;
    }

    input.addEventListener(
      "input",
      () => {
        searchTerm =
          input.value;

        renderHomepageProducts();
      }
    );

    const clear =
      $("#productSearchClear");

    if (clear) {
      clear.addEventListener(
        "click",
        () => {
          input.value = "";
          searchTerm = "";
          renderHomepageProducts();
          input.focus();
        }
      );
    }
  }

  function initCategories() {
    const grid =
      $("#categoryGrid");

    if (!grid) {
      return;
    }

    grid.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-category]"
          );

        if (!button) {
          return;
        }

        activeCategory =
          button.dataset.category ||
          "الكل";

        const input =
          $("#productSearchInput");

        if (input) {
          input.value = "";
        }

        document
          .getElementById("products")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        renderHomepageProducts();
      }
    );
  }

  function initHeaderSearch() {
    const form =
      $("#headerSearchForm");

    const input =
      $("#headerSearchInput");

    if (!form || !input) {
      return;
    }

    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const value =
          cleanText(
            input.value
          );

        if (!value) {
          return;
        }

        const productSearch =
          $("#productSearchInput");

        if (productSearch) {
          productSearch.value =
            value;
        }

        searchTerm =
          value;

        renderHomepageProducts();

        document
          .getElementById("products")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );
  }

  function initFeatureBridge() {
    document.addEventListener(
      "abo:tarek:cart",
      () => {
        if (
          window.ABO_TAREK_FEATURES &&
          typeof
            window.ABO_TAREK_FEATURES.refreshWishlistUI ===
              "function"
        ) {
          window.ABO_TAREK_FEATURES.refreshWishlistUI();
        }
      }
    );
  }

  async function loadSections() {
    try {
      const cached =
        localStorage.getItem(
          "abo_tarek_catalog_v10"
        );

      if (cached) {
        const parsed =
          JSON.parse(cached);

        if (
          Array.isArray(
            parsed.sections
          )
        ) {
          sections =
            parsed.sections
              .map(normalizeSection);
        }
      }
    } catch {}

    if (sections.length) {
      renderCategories();
    }

    try {
      const response =
        await fetch(
          DATA_URL +
          (DATA_URL.includes("?")
            ? "&"
            : "?") +
          "action=listSections",
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      if (
        data?.ok === false
      ) {
        return;
      }

      const list =
        Array.isArray(
          data?.sections
        )
          ? data.sections
          : [];

      sections =
        list.map(
          normalizeSection
        );

      renderCategories();
    } catch {}
  }

  function showError() {
    const grid =
      $("#productsGrid");

    if (!grid) return;

    grid.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>حصلت مشكلة في تحميل الأصناف</h3>
        <p>جرّب تحديث الصفحة مرة تانية.</p>
        <button
          type="button"
          class="primary-btn"
          onclick="location.reload()"
        >
          إعادة المحاولة
        </button>
      </div>
    `;
  }

  async function startApp() {
    initSearch();
    initCategories();
    initHeaderSearch();
    initFeatureBridge();

    const grid =
      $("#productsGrid");

    if (grid) {
      grid.innerHTML = `
        <div class="loading">
          جاري تحميل الأصناف...
        </div>
      `;
    }

    try {
      const cached =
        readCache();

      if (
        cached &&
        Array.isArray(
          cached.products
        ) &&
        cached.products.length
      ) {
        products =
          cached.products
            .map(normalizeProduct)
            .filter(
              product =>
                product.active
            );

        renderCategories();
        renderHomepageProducts();
        renderOffers();
        renderRecentlyViewed();

        refreshInBackground();
      } else {
        products =
          await getProducts();

        renderCategories();
        renderHomepageProducts();
        renderOffers();
        renderRecentlyViewed();
      }

      loadSections();
    } catch (error) {
      console.error(
        "Abo Tarek Store:",
        error
      );

      const fallback =
        readCache();

      if (
        fallback &&
        Array.isArray(
          fallback.products
        ) &&
        fallback.products.length
      ) {
        products =
          fallback.products
            .map(normalizeProduct)
            .filter(
              product =>
                product.active
            );

        renderCategories();
        renderHomepageProducts();
        renderOffers();
        renderRecentlyViewed();
      } else {
        showError();
      }
    }
  }

  window.ABO_TAREK_APP = {
    getProducts: () =>
      products.slice(),

    refresh: async () => {
      products =
        await getProducts(true);

      renderHomepageProducts();
      renderOffers();
      renderRecentlyViewed();
      renderCategories();

      return products;
    },

    openProduct: id => {
      const product =
        products.find(
          item =>
            item.id ===
            String(id)
        );

      if (
        product &&
        window.ABO_TAREK_FEATURES
      ) {
        window.ABO_TAREK_FEATURES.openProductModal(
          product
        );
      }
    }
  };

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startApp,
      { once: true }
    );
  } else {
    startApp();
  }
})();
