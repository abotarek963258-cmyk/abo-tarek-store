/* =========================================================
   ABO TAREK STORE
   APP.JS
   PERFORMANCE OPTIMIZED
   Compatible with current Google Apps Script
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     SETTINGS
     ========================================================= */

  const DATA_URL =
    "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

  const WHATSAPP_NUMBER = "201551604163";

  const CACHE_KEY = "abo_tarek_products_v10";

  const CACHE_TIME = 30 * 60 * 1000;

  const BACKGROUND_REFRESH_TIME = 10 * 60 * 1000;

  const CATEGORY_ICONS = {
    "سفرة": "🍽️",
    "شاي وقهوة": "☕",
    "أكواب وكاسات": "🥛",
    "مطبخ": "🍳",
    "أواني طهي": "🥘",
    "ميلامين": "🟩",
    "أدوات منزلية": "🏠",
    "مستلزمات المنزل": "🏠",
    "الكل": "🛍️"
  };

  const FALLBACK_ICON = "🏠";


  /* =========================================================
     HELPERS
     ========================================================= */

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


  function categoryIcon(category) {
    return (
      CATEGORY_ICONS[cleanText(category)] ||
      FALLBACK_ICON
    );
  }


  function isActive(value) {
    if (
      value === false ||
      value === 0
    ) {
      return false;
    }

    const text =
      normalizeArabic(value);

    if (
      text === "false" ||
      text === "0" ||
      text === "no" ||
      text === "inactive" ||
      text === "غير نشط"
    ) {
      return false;
    }

    return true;
  }


  function isFlagEnabled(value, defaultValue) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return defaultValue;
    }

    if (
      value === true ||
      value === 1
    ) {
      return true;
    }

    if (
      value === false ||
      value === 0
    ) {
      return false;
    }

    const text =
      normalizeArabic(value);

    if (
      [
        "false",
        "0",
        "no",
        "off",
        "مخفي"
      ].includes(text)
    ) {
      return false;
    }

    if (
      [
        "true",
        "1",
        "yes",
        "on",
        "نعم",
        "ظاهر"
      ].includes(text)
    ) {
      return true;
    }

    return defaultValue;
  }


  /* =========================================================
     IMAGE URL
     ========================================================= */

  function getImageSources(image) {

    const original =
      cleanText(image);

    if (!original) {
      return [];
    }

    const sources = [];

    function add(url) {
      if (
        url &&
        !sources.includes(url)
      ) {
        sources.push(url);
      }
    }

    if (
      original.startsWith("https://") ||
      original.startsWith("http://") ||
      original.startsWith("data:")
    ) {
      add(original);
      return sources;
    }

    const relative =
      original
        .replace(/^\.?\//, "")
        .replace(/^\/+/, "");

    add(
      "https://abotarek963258-cmyk.github.io/abo-tarek-store/" +
      relative
        .split("/")
        .map(part =>
          encodeURIComponent(part)
        )
        .join("/")
    );

    return sources;
  }


  function whatsappUrl(product) {

    const name =
      cleanText(product.name);

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


  /* =========================================================
     CACHE
     ========================================================= */

  function readCache() {

    try {

      const raw =
        localStorage.getItem(
          CACHE_KEY
        );

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

    } catch (error) {

      return null;
    }
  }


  function writeCache(products) {

    try {

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          time: Date.now(),
          products
        })
      );

    } catch (error) {

      /* تجاهل مشكلة التخزين */
    }
  }


  /* =========================================================
     NORMALIZE PRODUCT
     ========================================================= */

  function normalizeProduct(
    product,
    index
  ) {

    const p =
      product || {};

    const id =
      cleanText(
        p.id ??
        p.ID ??
        p.Id
      ) ||
      `product-${index + 1}`;

    const name =
      cleanText(
        p.name ??
        p.Name ??
        p.product ??
        p.title
      ) ||
      "صنف بدون اسم";

    const category =
      cleanText(
        p.category ??
        p.Category ??
        p.cat
      ) ||
      "أدوات منزلية";

    const image =
      cleanText(
        p.image ??
        p.Image ??
        p.imageUrl ??
        p.photo
      );

    const description =
      cleanText(
        p.description ??
        p.Description ??
        p.desc
      );

    const active =
      isActive(
        p.active ??
        p.Active ??
        true
      );

    const showHome =
      isFlagEnabled(
        p.showHome ??
        p.ShowHome,
        true
      );

    const isOffer =
      isFlagEnabled(
        p.isOffer ??
        p.IsOffer,
        false
      );

    const price =
      cleanText(
        p.price ??
        p.Price ??
        ""
      );

    const oldPrice =
      cleanText(
        p.oldPrice ??
        p.OldPrice ??
        ""
      );

    const offerPrice =
      cleanText(
        p.offerPrice ??
        p.OfferPrice ??
        ""
      );

    return {
      id,
      name,
      category,
      image,
      description,
      active,
      showHome,
      isOffer,
      price,
      oldPrice,
      offerPrice,
      searchIndex:
        normalizeArabic(
          `${name} ${category} ${description}`
        )
    };
  }


  /* =========================================================
     FETCH PRODUCTS
     ========================================================= */

  let productsPromise = null;


  async function fetchProducts() {

    const response =
      await fetch(
        DATA_URL,
        {
          method: "GET",
          cache: "default",
          redirect: "follow"
        }
      );

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    let rawProducts = [];

    if (
      Array.isArray(data)
    ) {

      rawProducts =
        data;

    } else if (
      data &&
      Array.isArray(
        data.products
      )
    ) {

      rawProducts =
        data.products;

    } else if (
      data &&
      Array.isArray(
        data.data
      )
    ) {

      rawProducts =
        data.data;

    } else {

      throw new Error(
        "صيغة البيانات غير صحيحة"
      );
    }

    return rawProducts
      .map(
        normalizeProduct
      )
      .filter(
        product =>
          product.active
      );
  }


  /* =========================================================
     GET PRODUCTS
     ========================================================= */

  async function getProducts(
    forceRefresh = false
  ) {

    const cached =
      readCache();

    if (
      !forceRefresh &&
      cached &&
      Array.isArray(
        cached.products
      ) &&
      cached.products.length &&
      Date.now() -
        cached.time <
        CACHE_TIME
    ) {

      return cached.products;
    }

    if (!productsPromise) {

      productsPromise =
        fetchProducts()
          .then(products => {

            writeCache(
              products
            );

            return products;

          })
          .finally(() => {

            productsPromise =
              null;

          });
    }

    return productsPromise;
  }


  /* =========================================================
     BACKGROUND REFRESH
     ========================================================= */

  function refreshInBackground() {

    if (productsPromise) {
      return productsPromise;
    }

    const cached =
      readCache();

    if (
      cached &&
      cached.time &&
      Date.now() -
        cached.time <
        BACKGROUND_REFRESH_TIME
    ) {

      return Promise.resolve(
        cached.products
      );
    }

    if (!productsPromise) {

      productsPromise =
        fetchProducts()
          .then(
            freshProducts => {

              writeCache(
                freshProducts
              );

              return freshProducts;
            }
          )
          .catch(
            () => null
          )
          .finally(() => {

            productsPromise =
              null;

          });
    }

    return productsPromise;
  }


  /* =========================================================
     PRICE HTML
     ========================================================= */

  function getPriceHtml(product) {

    const price =
      cleanText(
        product.price
      );

    const oldPrice =
      cleanText(
        product.oldPrice
      );

    const offerPrice =
      cleanText(
        product.offerPrice
      );

    const current =
      offerPrice ||
      price;

    if (!current) {
      return "";
    }

    return `
      <div class="price-box">

        ${
          oldPrice
            ? `
              <span class="old-price">
                ${escapeHtml(oldPrice)} ج.م
              </span>
            `
            : ""
        }

        <span class="current-price">
          ${escapeHtml(current)}
          <small>ج.م</small>
        </span>

      </div>
    `;
  }


  /* =========================================================
     SHORT DESCRIPTION
     ========================================================= */

  function shortDescription(
    description,
    limit = 90
  ) {

    const text =
      cleanText(description);

    if (!text) {
      return "";
    }

    if (
      text.length <= limit
    ) {
      return escapeHtml(text);
    }

    return (
      escapeHtml(
        text.slice(0, limit)
      ) +
      "..."
    );
  }


  /* =========================================================
     HOMEPAGE
     ========================================================= */

  function initHomepage(
    products
  ) {

    const productsGrid =
      document.getElementById(
        "productsGrid"
      );

    const categoryGrid =
      document.getElementById(
        "categoryGrid"
      );

    const filters =
      document.getElementById(
        "filters"
      );

    const offersGrid =
      document.getElementById(
        "offersGrid"
      );

    const offersSection =
      document.getElementById(
        "offers"
      );

    if (
      !productsGrid &&
      !categoryGrid
    ) {
      return;
    }

    const homeProducts =
      products.filter(
        product =>
          product.showHome
      );

    const offerProducts =
      products.filter(
        product =>
          product.isOffer
      );

    const categories =
      Array.from(
        new Set(
          products
            .map(
              product =>
                cleanText(
                  product.category
                )
            )
            .filter(Boolean)
        )
      );

    let selectedCategory =
      "الكل";

    let searchTerm = "";


    /* =======================================================
       CATEGORY RENDER
       ======================================================= */

    function renderCategories() {

      if (!categoryGrid) {
        return;
      }

      const categoryItems = [
        "الكل",
        ...categories
      ];

      categoryGrid.innerHTML =
        categoryItems
          .map(
            category => {

              const count =
                category === "الكل"
                  ? products.length
                  : products.filter(
                      product =>
                        product.category ===
                        category
                    ).length;

              const active =
                selectedCategory ===
                category;

              return `
                <button
                  type="button"
                  class="category-card ${
                    active
                      ? "active"
                      : ""
                  }"
                  data-category="${escapeHtml(category)}"
                >

                  <span class="category-icon">
                    ${categoryIcon(category)}
                  </span>

                  <span class="category-name">
                    ${escapeHtml(category)}
                  </span>

                  <span class="category-count">
                    ${count} صنف
                  </span>

                </button>
              `;
            }
          )
          .join("");

      categoryGrid
        .querySelectorAll(
          "[data-category]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                selectedCategory =
                  button.dataset.category ||
                  "الكل";

                renderCategories();
                renderFilters();
                renderProducts();

                const productsSection =
                  document.getElementById(
                    "products"
                  );

                if (
                  productsSection
                ) {

                  productsSection.scrollIntoView(
                    {
                      behavior: "smooth",
                      block: "start"
                    }
                  );
                }
              }
            );

          }
        );
    }


    /* =======================================================
       FILTERS
       ======================================================= */

    function renderFilters() {

      if (!filters) {
        return;
      }

      filters.innerHTML =
        `
          <button
            type="button"
            class="filter-btn ${
              selectedCategory === "الكل"
                ? "active"
                : ""
            }"
            data-filter-category="الكل"
          >
            الكل
          </button>
        ` +
        categories
          .map(
            category => `
              <button
                type="button"
                class="filter-btn ${
                  selectedCategory === category
                    ? "active"
                    : ""
                }"
                data-filter-category="${escapeHtml(category)}"
              >
                ${categoryIcon(category)}
                ${escapeHtml(category)}
              </button>
            `
          )
          .join("");

      filters
        .querySelectorAll(
          "[data-filter-category]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                selectedCategory =
                  button.dataset.filterCategory ||
                  "الكل";

                renderFilters();
                renderCategories();
                renderProducts();
              }
            );

          }
        );
    }


    /* =======================================================
       PRODUCT FILTER
       ======================================================= */

    function getFilteredProducts() {

      let list =
        homeProducts.slice();

      if (
        selectedCategory !==
        "الكل"
      ) {

        list =
          list.filter(
            product =>
              product.category ===
              selectedCategory
          );
      }

      if (
        searchTerm
      ) {

        const normalizedSearch =
          normalizeArabic(
            searchTerm
          );

        list =
          list.filter(
            product =>
              product.searchIndex.includes(
                normalizedSearch
              )
          );
      }

      return list;
    }


    /* =======================================================
       PRODUCT CARD
       ======================================================= */

    function productCard(
      product
    ) {

      const sources =
        getImageSources(
          product.image
        );

      const image =
        sources.length
          ? sources[0]
          : "";

      const hasDescription =
        Boolean(
          cleanText(
            product.description
          )
        );

      return `
        <article
          class="product"
          data-product-id="${escapeHtml(product.id)}"
        >

          <div class="product-image-wrap">

            ${
              image
                ? `
                  <img
                    class="product-image"
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(product.name)}"
                    loading="lazy"
                    decoding="async"
                    width="500"
                    height="500"
                  >
                `
                : `
                  <div class="product-image product-image-placeholder">
                    ${categoryIcon(product.category)}
                  </div>
                `
            }

            ${
              product.isOffer
                ? `
                  <span class="offer-badge">
                    🔥 عرض
                  </span>
                `
                : ""
            }

          </div>

          <div class="product-body">

            <span class="product-category">
              ${escapeHtml(product.category)}
            </span>

            <h3 class="product-name">
              ${escapeHtml(product.name)}
            </h3>

            ${
              hasDescription
                ? `
                  <p class="product-description">
                    ${shortDescription(
                      product.description
                    )}
                  </p>

                  <button
                    type="button"
                    class="product-details-btn"
                    data-details-id="${escapeHtml(product.id)}"
                  >
                    عرض المزيد من التفاصيل
                  </button>
                `
                : ""
            }

            ${getPriceHtml(product)}

            <div class="product-actions">

              <button
                type="button"
                class="product-details"
                data-details-id="${escapeHtml(product.id)}"
              >
                👁️ التفاصيل
              </button>

              <a
                class="product-whatsapp"
                href="${escapeHtml(
                  whatsappUrl(product)
                )}"
                target="_blank"
                rel="noopener"
              >
                💬 واتساب
              </a>

            </div>

          </div>

        </article>
      `;
    }


    /* =======================================================
       PRODUCTS RENDER
       ======================================================= */

    function renderProducts() {

      if (!productsGrid) {
        return;
      }

      const list =
        getFilteredProducts();

      if (!list.length) {

        productsGrid.innerHTML = `
          <div class="empty">

            <div class="empty-icon">
              🔎
            </div>

            <h3>
              مفيش أصناف مطابقة
            </h3>

            <p>
              جرّب كلمة بحث مختلفة أو اختار قسم تاني.
            </p>

            <a
              href="./sections.html"
              class="primary-btn"
              style="margin-top:16px;display:inline-flex"
            >
              🛍️ تصفح كل الأصناف
            </a>

          </div>
        `;

        return;
      }

      productsGrid.innerHTML =
        list
          .map(
            productCard
          )
          .join("");

      productsGrid
        .querySelectorAll(
          "[data-details-id]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                const product =
                  products.find(
                    item =>
                      item.id ===
                      button.dataset.detailsId
                  );

                if (
                  product
                ) {
                  openProductModal(
                    product
                  );
                }
              }
            );

          }
        );

      productsGrid
        .querySelectorAll(
          ".product-image"
        )
        .forEach(
          image => {

            image.addEventListener(
              "error",
              () => {

                image.style.display =
                  "none";
              },
              {
                once: true
              }
            );

          }
        );
    }


    /* =======================================================
       OFFERS
       ======================================================= */

    function renderOffers() {

      if (
        !offersGrid ||
        !offersSection
      ) {
        return;
      }

      if (
        !offerProducts.length
      ) {

        offersSection.hidden =
          true;

        offersSection.style.display =
          "none";

        return;
      }

      offersSection.hidden =
        false;

      offersSection.style.display =
        "";

      offersGrid.innerHTML =
        offerProducts
          .map(
            productCard
          )
          .join("");

      offersGrid
        .querySelectorAll(
          "[data-details-id]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                const product =
                  products.find(
                    item =>
                      item.id ===
                      button.dataset.detailsId
                  );

                if (
                  product
                ) {
                  openProductModal(
                    product
                  );
                }
              }
            );

          }
        );
    }


    /* =======================================================
       SEARCH
       ======================================================= */

    const searchInput =
      document.getElementById(
        "productSearch"
      ) ||
      document.querySelector(
        "#productSearchBox input"
      );

    const suggestions =
      document.getElementById(
        "searchSuggestions"
      );

    const searchClear =
      document.getElementById(
        "searchClear"
      );

    function renderSuggestions() {

      if (
        !suggestions ||
        !searchInput
      ) {
        return;
      }

      const term =
        normalizeArabic(
          searchInput.value
        );

      if (!term) {

        suggestions.hidden =
          true;

        searchInput.setAttribute(
          "aria-expanded",
          "false"
        );

        return;
      }

      const matches =
        products
          .filter(
            product =>
              product.searchIndex.includes(
                term
              )
          )
          .slice(0, 8);

      if (!matches.length) {

        suggestions.innerHTML = `
          <div class="suggestion-empty">
            لا توجد نتائج مطابقة
          </div>
        `;

        suggestions.hidden =
          false;

        searchInput.setAttribute(
          "aria-expanded",
          "true"
        );

        return;
      }

      suggestions.innerHTML =
        matches
          .map(
            product => `
              <button
                type="button"
                class="search-suggestion"
                data-suggestion-id="${escapeHtml(product.id)}"
              >

                <span class="suggestion-icon">
                  ${categoryIcon(product.category)}
                </span>

                <span class="suggestion-text">

                  <strong>
                    ${escapeHtml(product.name)}
                  </strong>

                  <small>
                    ${escapeHtml(product.category)}
                  </small>

                </span>

              </button>
            `
          )
          .join("");

      suggestions.hidden =
        false;

      searchInput.setAttribute(
        "aria-expanded",
        "true"
      );
    }


    if (searchInput) {

      searchInput.addEventListener(
        "input",
        () => {

          searchTerm =
            searchInput.value;

          if (searchClear) {

            searchClear.hidden =
              !searchInput.value;
          }

          renderSuggestions();
          renderProducts();
        }
      );

      searchInput.addEventListener(
        "focus",
        () => {

          if (
            searchInput.value
          ) {
            renderSuggestions();
          }
        }
      );
    }


    if (searchClear) {

      searchClear.addEventListener(
        "click",
        () => {

          if (searchInput) {

            searchInput.value =
              "";

            searchInput.focus();
          }

          searchTerm =
            "";

          searchClear.hidden =
            true;

          if (suggestions) {

            suggestions.hidden =
              true;
          }

          renderProducts();
        }
      );
    }


    if (suggestions) {

      suggestions.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-suggestion-id]"
            );

          if (!button) {
            return;
          }

          const product =
            products.find(
              item =>
                item.id ===
                button.dataset.suggestionId
            );

          if (!product) {
            return;
          }

          searchInput.value =
            product.name;

          searchTerm =
            product.name;

          if (searchClear) {

            searchClear.hidden =
              false;
          }

          suggestions.hidden =
            true;

          searchInput.setAttribute(
            "aria-expanded",
            "false"
          );

          renderProducts();
        }
      );
    }


    document.addEventListener(
      "click",
      event => {

        if (
          !event.target.closest(
            "#productSearchBox"
          )
        ) {

          if (suggestions) {

            suggestions.hidden =
              true;
          }

          if (searchInput) {

            searchInput.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        }
      }
    );


    renderCategories();
    renderFilters();
    renderProducts();
    renderOffers();
  }


  /* =========================================================
     PRODUCT MODAL
     ========================================================= */

  function ensureModal() {

    let modal =
      document.getElementById(
        "aboTarekProductModal"
      );

    if (modal) {
      return modal;
    }

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "aboTarekProductModal";

    modal.className =
      "product-modal";

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    modal.innerHTML = `
      <div
        class="product-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل المنتج"
      >

        <button
          type="button"
          class="modal-close"
          aria-label="إغلاق"
        >
          ×
        </button>

        <div class="abo-product-details-modal">

          <div class="modal-product-image">

            <img
              id="aboModalImage"
              alt=""
              width="700"
              height="700"
              decoding="async"
            >

          </div>

          <div class="modal-product-info">

            <span
              id="aboModalCategory"
              class="product-category"
            ></span>

            <h2
              id="aboModalName"
            ></h2>

            <p
              id="aboModalDescription"
            ></p>

            <div
              id="aboModalPrice"
              class="price-box modal-price-box"
            ></div>

            <a
              id="aboModalWhatsApp"
              class="product-whatsapp"
              target="_blank"
              rel="noopener"
            >
              💬 اسأل عن الصنف على واتساب
            </a>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelector(
        ".modal-close"
      )
      .addEventListener(
        "click",
        closeProductModal
      );

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          modal
        ) {
          closeProductModal();
        }

      }
    );

    return modal;
  }


  function openProductModal(
    product
  ) {

    const modal =
      ensureModal();

    const image =
      document.getElementById(
        "aboModalImage"
      );

    const category =
      document.getElementById(
        "aboModalCategory"
      );

    const name =
      document.getElementById(
        "aboModalName"
      );

    const description =
      document.getElementById(
        "aboModalDescription"
      );

    const whatsapp =
      document.getElementById(
        "aboModalWhatsApp"
      );

    const sources =
      getImageSources(
        product.image
      );

    if (image) {

      if (
        sources.length
      ) {

        image.src =
          sources[0];

        image.style.display =
          "block";

        image.alt =
          `صورة ${product.name}`;

        image.loading =
          "eager";

        image.fetchPriority =
          "high";

      } else {

        image.removeAttribute(
          "src"
        );

        image.style.display =
          "none";
      }
    }

    if (category) {

      category.textContent =
        product.category;
    }

    if (name) {

      name.textContent =
        product.name;
    }

    if (description) {

      description.textContent =
        product.description ||
        "للاستفسار عن تفاصيل الصنف، تواصل معنا على واتساب.";
    }

    const modalPrice =
      document.getElementById(
        "aboModalPrice"
      );

    if (modalPrice) {

      modalPrice.innerHTML =
        (
          product.price ||
          product.offerPrice
        )
          ? `
              ${
                product.oldPrice
                  ? `
                    <span class="old-price">
                      ${escapeHtml(
                        product.oldPrice
                      )} ج.م
                    </span>
                  `
                  : ""
              }

              <span class="current-price">
                ${escapeHtml(
                  product.offerPrice ||
                  product.price
                )}

                <small>
                  ج.م
                </small>
              </span>
            `
          : "";

      modalPrice.hidden =
        !(
          product.price ||
          product.offerPrice
        );
    }

    if (whatsapp) {

      whatsapp.href =
        whatsappUrl(
          product
        );
    }

    modal.classList.add(
      "show"
    );

    modal.classList.add(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";
  }


  function closeProductModal() {

    const modal =
      document.getElementById(
        "aboTarekProductModal"
      );

    if (!modal) {
      return;
    }

    modal.classList.remove(
      "show"
    );

    modal.classList.remove(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow =
      "";
  }


  /* =========================================================
     MOBILE NAV
     ========================================================= */

  function initMobileNav() {

    const menuButton =
      document.getElementById(
        "menuBtn"
      );

    const nav =
      document.getElementById(
        "navLinks"
      );

    if (
      !menuButton ||
      !nav
    ) {
      return;
    }

    menuButton.addEventListener(
      "click",
      () => {

        nav.classList.toggle(
          "open"
        );

      }
    );

    nav
      .querySelectorAll(
        "a"
      )
      .forEach(
        link => {

          link.addEventListener(
            "click",
            () => {

              nav.classList.remove(
                "open"
              );

            }
          );

        }
      );
  }


  /* =========================================================
     ERROR
     ========================================================= */

  function showError() {

    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (!grid) {
      return;
    }

    grid.innerHTML = `
      <div class="empty">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          تعذر تحميل الأصناف
        </h3>

        <p>
          حصلت مشكلة أثناء الاتصال بالبيانات.
          حاول تحديث الصفحة مرة تانية.
        </p>

        <button
          type="button"
          id="retryProducts"
          class="primary-btn"
          style="margin-top:16px"
        >
          🔄 إعادة المحاولة
        </button>

      </div>
    `;

    const retry =
      document.getElementById(
        "retryProducts"
      );

    if (retry) {

      retry.addEventListener(
        "click",
        () => {

          localStorage.removeItem(
            CACHE_KEY
          );

          window.location.reload();

        }
      );
    }
  }


  /* =========================================================
     START
     ========================================================= */

  async function startApp() {

    initMobileNav();

    const homepage =
      document.getElementById(
        "productsGrid"
      );

    if (homepage) {

      homepage.innerHTML = `
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

        initHomepage(
          cached.products
        );

        refreshInBackground();

        return;
      }


      const products =
        await getProducts(
          true
        );

      initHomepage(
        products
      );

    } catch (error) {

      console.error(
        "Abo Tarek Store error:",
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

        initHomepage(
          fallback.products
        );

        return;
      }

      showError();
    }
  }


  /* =========================================================
     ESCAPE
     ========================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeProductModal();

      }

    }
  );


  /* =========================================================
     RUN
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startApp,
      {
        once: true
      }
    );

  } else {

    startApp();

  }

})();
