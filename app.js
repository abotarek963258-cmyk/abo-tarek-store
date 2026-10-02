/* =========================================================
   ABO TAREK STORE
   PREMIUM LIVE CATALOG ENGINE
   FINAL EDITION
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     SETTINGS
     ======================================================= */

  const DATA_URL =
    "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

  const WHATSAPP_NUMBER =
    "201551604163";

  const CACHE_KEY =
    "abo_tarek_products_v10";

  const CACHE_TIME =
    30 * 60 * 1000;

  const BACKGROUND_REFRESH_TIME =
    10 * 60 * 1000;


  /* =======================================================
     CATEGORY ICONS
     ======================================================= */

  const CATEGORY_ICONS = {
    "مطبخ": "🍳",
    "ادوات مطبخ": "🍳",
    "أدوات مطبخ": "🍳",

    "سفرة": "🍽️",
    "أدوات سفرة": "🍽️",

    "أكواب": "🥤",
    "كاسات": "🥛",

    "شاي": "☕",
    "قهوة": "☕",
    "شاي وقهوة": "☕",

    "طهي": "🍲",
    "أواني طهي": "🍲",

    "ميلامين": "🍽️",

    "صيني": "🍽️",

    "منزل": "🏠",
    "أدوات منزلية": "🏠",

    "تنظيف": "🧹",

    "بلاستيك": "🧺",

    "تخزين": "🗃️",

    "حمام": "🛁",

    "أطفال": "🧸"
  };

  const FALLBACK_ICON =
    "🏠";


  /* =======================================================
     BASIC HELPERS
     ======================================================= */

  function cleanText(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value).trim();
  }


  function escapeHtml(value) {

    return cleanText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function escapeJs(value) {

    return cleanText(value)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n");
  }


  function normalizeArabic(value) {

    return cleanText(value)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/ـ/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  }


  function categoryIcon(category) {

    const key =
      cleanText(category);

    if (CATEGORY_ICONS[key]) {
      return CATEGORY_ICONS[key];
    }

    const normalized =
      normalizeArabic(key);

    for (const name in CATEGORY_ICONS) {

      if (
        normalizeArabic(name) ===
        normalized
      ) {
        return CATEGORY_ICONS[name];
      }
    }

    return FALLBACK_ICON;
  }


  function isActive(value) {

    if (
      value === true ||
      value === 1 ||
      value === "1"
    ) {
      return true;
    }

    const text =
      normalizeArabic(value);

    return (
      text === "true" ||
      text === "yes" ||
      text === "active" ||
      text === "نعم" ||
      text === "فعال" ||
      text === "مفعل"
    );
  }


  function isFlagEnabled(value) {

    if (
      value === true ||
      value === 1 ||
      value === "1"
    ) {
      return true;
    }

    const text =
      normalizeArabic(value);

    return (
      text === "true" ||
      text === "yes" ||
      text === "on" ||
      text === "نعم" ||
      text === "مفعل"
    );
  }


  /* =======================================================
     IMAGE HELPERS
     ======================================================= */

  function getImageSources(product) {

    const sources = [];

    const image =
      cleanText(product.image);

    if (image) {

      sources.push(image);

      if (
        image.includes(
          "github.com"
        ) &&
        image.includes("/blob/")
      ) {

        sources.push(
          image
            .replace(
              "github.com",
              "raw.githubusercontent.com"
            )
            .replace(
              "/blob/",
              "/"
            )
        );
      }

      if (
        image.includes(
          "raw.githubusercontent.com"
        )
      ) {
        sources.push(image);
      }
    }

    return [
      ...new Set(
        sources.filter(Boolean)
      )
    ];
  }


  function whatsappUrl(product) {

    const name =
      cleanText(product.name);

    const category =
      cleanText(product.category);

    let message =
      `السلام عليكم، عايز أعرف تفاصيل عن ${name}`;

    if (category) {
      message += ` - قسم ${category}`;
    }

    return (
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(message)
    );
  }


  /* =======================================================
     PRICE HELPERS
     ======================================================= */

  function normalizePrice(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .trim()
      .replace(/,/g, "");
  }


  function formatPrice(value) {

    const raw =
      normalizePrice(value);

    if (!raw) {
      return "";
    }

    const number =
      Number(raw);

    if (!Number.isFinite(number)) {
      return escapeHtml(raw);
    }

    return new Intl.NumberFormat(
      "ar-EG"
    ).format(number);
  }


  function hasPrice(product) {

    return Boolean(
      normalizePrice(product.price)
    );
  }


  function renderPrice(product) {

    const price =
      normalizePrice(product.price);

    const oldPrice =
      normalizePrice(product.oldPrice);

    const offerPrice =
      normalizePrice(product.offerPrice);

    if (
      !price &&
      !oldPrice &&
      !offerPrice
    ) {
      return "";
    }

    let html =
      `<div class="price-box">`;

    if (oldPrice) {

      html += `
        <span class="old-price">
          ${formatPrice(oldPrice)} جنيه
        </span>
      `;
    }

    if (offerPrice) {

      html += `
        <span class="current-price">
          ${formatPrice(offerPrice)} جنيه
        </span>
      `;

    } else if (price) {

      html += `
        <span class="current-price">
          ${formatPrice(price)} جنيه
        </span>
      `;
    }

    html += `
      </div>
    `;

    return html;
  }


  /* =======================================================
     PRODUCT NORMALIZATION
     ======================================================= */

  function normalizeProduct(raw, index) {

    if (!raw) {
      return null;
    }

    const product = {

      id:
        cleanText(raw.id) ||
        `product-${index + 1}`,

      name:
        cleanText(raw.name),

      category:
        cleanText(raw.category),

      image:
        cleanText(raw.image),

      description:
        cleanText(raw.description),

      active:
        isActive(raw.active),

      showHome:
        isFlagEnabled(
          raw.showHome
        ),

      isOffer:
        isFlagEnabled(
          raw.isOffer
        ),

      sortOrder:
        Number(raw.sortOrder) || 0,

      price:
        normalizePrice(
          raw.price
        ),

      oldPrice:
        normalizePrice(
          raw.oldPrice
        ),

      offerPrice:
        normalizePrice(
          raw.offerPrice
        )
    };


    product.searchIndex =
      normalizeArabic(
        [
          product.name,
          product.category,
          product.description
        ].join(" ")
      );


    return product;
  }


  /* =======================================================
     CACHE
     ======================================================= */

  function readCache() {

    try {

      const raw =
        localStorage.getItem(
          CACHE_KEY
        );

      if (!raw) {
        return null;
      }

      const cache =
        JSON.parse(raw);

      if (
        !cache ||
        !Array.isArray(
          cache.products
        )
      ) {
        return null;
      }

      return cache;

    } catch (error) {

      console.warn(
        "Cache read failed:",
        error
      );

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

      console.warn(
        "Cache write failed:",
        error
      );
    }
  }


  /* =======================================================
     API FETCH
     ======================================================= */

  async function fetchProducts() {

    const response =
      await fetch(
        DATA_URL,
        {
          method: "GET",
          cache: "no-store"
        }
      );

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();


    let rows = [];

    if (Array.isArray(data)) {

      rows = data;

    } else if (
      data &&
      Array.isArray(
        data.products
      )
    ) {

      rows = data.products;

    } else if (
      data &&
      Array.isArray(
        data.data
      )
    ) {

      rows = data.data;
    }


    return rows
      .map(normalizeProduct)
      .filter(Boolean)
      .filter(
        product =>
          product.active
      )
      .sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder
      );
  }


  /* =======================================================
     GLOBAL LOADING
     ======================================================= */

  function showLoading() {

    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (grid) {

      grid.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <strong>
            جاري تحميل الأصناف...
          </strong>
          <span>
            لحظات ونجهز لك المنتجات
          </span>
        </div>
      `;
    }


    const categoryGrid =
      document.getElementById(
        "categoryGrid"
      );

    if (categoryGrid) {

      categoryGrid.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <strong>
            جاري تحميل الأقسام...
          </strong>
        </div>
      `;
    }
  }


  function showError() {

    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (grid) {

      grid.innerHTML = `
        <div class="empty error-state">
          <div class="empty-icon">
            ⚠️
          </div>

          <h3>
            حصلت مشكلة في تحميل الأصناف
          </h3>

          <p>
            حاول تحديث الصفحة مرة تانية.
          </p>

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
  }


  /* =======================================================
     HOMEPAGE
     ======================================================= */

  function initHomepage(products) {

    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (!grid) {
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


    const offersSection =
      document.getElementById(
        "offers"
      );

    const offersGrid =
      document.getElementById(
        "offersGrid"
      );

    const filters =
      document.getElementById(
        "filters"
      );

    const categoryGrid =
      document.getElementById(
        "categoryGrid"
      );


    let activeCategory =
      "الكل";

    let searchTerm =
      "";


    const categories = [
      ...new Set(
        homeProducts
          .map(
            product =>
              product.category
          )
          .filter(Boolean)
      )
    ];


    /* =====================================================
       CATEGORIES
       ===================================================== */

    function renderCategories() {

      if (!categoryGrid) {
        return;
      }


      if (!categories.length) {

        categoryGrid.innerHTML = `
          <div class="empty">
            <div class="empty-icon">
              🏠
            </div>

            <h3>
              الأقسام هتظهر هنا
            </h3>

            <p>
              أضف منتجات من لوحة التحكم
              لتظهر الأقسام تلقائيًا.
            </p>
          </div>
        `;

        return;
      }


      categoryGrid.innerHTML =
        categories
          .map(category => {

            const count =
              homeProducts.filter(
                product =>
                  product.category ===
                  category
              ).length;


            return `
              <button
                class="cat"
                type="button"
                data-category="${escapeHtml(category)}"
                aria-label="عرض ${escapeHtml(category)}"
              >

                <span
                  class="cat-icon"
                  aria-hidden="true"
                >
                  ${escapeHtml(
                    categoryIcon(category)
                  )}
                </span>

                <span class="cat-content">

                  <strong>
                    ${escapeHtml(category)}
                  </strong>

                  <small>
                    ${count} صنف
                  </small>

                </span>

                <span class="cat-arrow">
                  ←
                </span>

              </button>
            `;

          })
          .join("");
    }


    /* =====================================================
       FILTERS
       ===================================================== */

    function renderFilters() {

      if (!filters) {
        return;
      }


      filters.innerHTML = `

        <button
          class="filter active"
          type="button"
          data-filter="الكل"
        >
          🛍️ الكل
        </button>

        ${categories
          .map(
            category => `
              <button
                class="filter"
                type="button"
                data-filter="${escapeHtml(category)}"
              >
                ${escapeHtml(
                  categoryIcon(category)
                )}

                ${escapeHtml(category)}
              </button>
            `
          )
          .join("")}
      `;
    }


    /* =====================================================
       FILTER PRODUCTS
       ===================================================== */

    function getFilteredProducts() {

      const query =
        normalizeArabic(
          searchTerm
        );


      return homeProducts.filter(
        product => {

          const categoryMatch =
            activeCategory ===
              "الكل" ||
            product.category ===
              activeCategory;


          const searchMatch =
            !query ||
            product.searchIndex.includes(
              query
            );


          return (
            categoryMatch &&
            searchMatch
          );
        }
      );
    }


    /* =====================================================
       PRODUCT IMAGE
       ===================================================== */

    function createProductImage(product) {

      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        "product-image";


      const sources =
        getImageSources(
          product
        );


      if (!sources.length) {

        wrapper.innerHTML = `
          <div class="product-image-placeholder">

            <span
              class="placeholder-icon"
              aria-hidden="true"
            >
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
        document.createElement(
          "img"
        );


      let current =
        0;


      img.src =
        sources[current];

      img.alt =
        product.name ||
        "منتج من أبو طارق";

      img.loading =
        "lazy";

      img.decoding =
        "async";


      img.addEventListener(
        "error",
        () => {

          current++;

          if (
            current <
            sources.length
          ) {

            img.src =
              sources[current];

            return;
          }


          wrapper.innerHTML = `
            <div class="product-image-placeholder">

              <span
                class="placeholder-icon"
                aria-hidden="true"
              >
                ${escapeHtml(
                  categoryIcon(
                    product.category
                  )
                )}
              </span>

            </div>
          `;

        },
        {
          once: false
        }
      );


      wrapper.appendChild(img);

      return wrapper;
    }


    /* =====================================================
       PRODUCT CARD
       ===================================================== */

    function createProductCard(
      product,
      index
    ) {

      const article =
        document.createElement(
          "article"
        );

      article.className =
        "product";

      article.dataset.id =
        product.id;


      const image =
        createProductImage(
          product
        );


      const body =
        document.createElement(
          "div"
        );

      body.className =
        "product-body";


      let description =
        cleanText(
          product.description
        );


      const shortDescription =
        description.length > 95
          ? description.slice(0, 95) + "..."
          : description;


      const offerBadge =
        product.isOffer
          ? `
            <span class="offer-badge">
              🔥 عرض
            </span>
          `
          : "";


      body.innerHTML = `

        <div class="product-meta">

          <span class="product-category">
            ${escapeHtml(
              product.category
            )}
          </span>

          ${offerBadge}

        </div>


        <h3 class="product-name">
          ${escapeHtml(
            product.name
          )}
        </h3>


        ${
          shortDescription
            ? `
              <p class="product-description">
                ${escapeHtml(
                  shortDescription
                )}
              </p>
            `
            : ""
        }


        ${renderPrice(product)}


        <div class="product-actions">

          ${
            description
              ? `
                <button
                  type="button"
                  class="product-details-trigger"
                >
                  عرض المزيد من التفاصيل
                </button>
              `
              : ""
          }


          <a
            class="product-whatsapp"
            href="${whatsappUrl(product)}"
            target="_blank"
            rel="noopener"
          >
            💬 واتساب
          </a>

        </div>

      `;


      article.appendChild(
        image
      );

      article.appendChild(
        body
      );


      article.addEventListener(
        "click",
        event => {

          if (
            event.target.closest(
              "a"
            )
          ) {
            return;
          }


          const detailsButton =
            event.target.closest(
              ".product-details-trigger"
            );


          if (detailsButton) {

            event.preventDefault();

            event.stopPropagation();

            openProductModal(
              product
            );

            return;
          }


          openProductModal(
            product
          );
        }
      );


      return article;
    }


    /* =====================================================
       RENDER PRODUCTS
       ===================================================== */

    function renderProducts() {

      const list =
        getFilteredProducts();


      if (!list.length) {

        grid.innerHTML = `
          <div class="empty">

            <div class="empty-icon">
              🔎
            </div>

            <h3>
              مفيش أصناف مطابقة
            </h3>

            <p>
              جرّب اسم صنف تاني أو اختار قسم مختلف.
            </p>

            <a
              href="./sections.html"
              class="primary-btn"
            >
              🛍️ افتح كل الأصناف
            </a>

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
    }


    /* =====================================================
       OFFERS
       ===================================================== */

    function renderOffers() {

      if (
        !offersGrid ||
        !offersSection
      ) {
        return;
      }


      if (!offerProducts.length) {

        offersGrid.innerHTML =
          "";

        offersSection.hidden =
          true;

        return;
      }


      const fragment =
        document.createDocumentFragment();


      offerProducts.forEach(
        (product, index) => {

          fragment.appendChild(
            createProductCard(
              product,
              index
            )
          );

        }
      );


      offersGrid.replaceChildren(
        fragment
      );


      offersSection.hidden =
        false;
    }


    /* =====================================================
       FILTER EVENTS
       ===================================================== */

    if (filters) {

      filters.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-filter]"
            );


          if (!button) {
            return;
          }


          activeCategory =
            button.dataset.filter ||
            "الكل";


          filters
            .querySelectorAll(
              ".filter"
            )
            .forEach(
              item => {

                item.classList.toggle(
                  "active",
                  item === button
                );

              }
            );


          renderProducts();
        }
      );
    }


    /* =====================================================
       CATEGORY EVENTS
       ===================================================== */

    if (categoryGrid) {

      categoryGrid.addEventListener(
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


          if (filters) {

            filters
              .querySelectorAll(
                ".filter"
              )
              .forEach(
                item => {

                  item.classList.toggle(
                    "active",
                    item.dataset.filter ===
                      activeCategory
                  );

                }
              );
          }


          renderProducts();


          const section =
            document.getElementById(
              "products"
            );


          if (section) {

            setTimeout(
              () => {

                section.scrollIntoView({
                  behavior:
                    "smooth",
                  block:
                    "start"
                });

              },
              30
            );
          }

        }
      );
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    function createSearchUI() {

      const toolbar =
        document.querySelector(
          ".products-toolbar"
        );


      if (!toolbar) {
        return null;
      }


      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        "product-search";


      wrapper.innerHTML = `

        <div class="product-search-box">

          <span
            class="search-icon"
            aria-hidden="true"
          >
            🔎
          </span>

          <input
            id="productSearchInput"
            type="search"
            placeholder="ابحث عن صنف..."
            autocomplete="off"
            aria-label="البحث عن منتج"
          >

          <button
            id="productSearchClear"
            type="button"
            aria-label="مسح البحث"
            hidden
          >
            ×
          </button>

        </div>


        <div
          id="productSearchSuggestions"
          class="product-search-suggestions"
          hidden
        >
        </div>

      `;


      toolbar.prepend(
        wrapper
      );


      return {
        input:
          document.getElementById(
            "productSearchInput"
          ),

        clear:
          document.getElementById(
            "productSearchClear"
          ),

        suggestions:
          document.getElementById(
            "productSearchSuggestions"
          )
      };
    }


    const search =
      createSearchUI();


    function updateSuggestions() {

      if (
        !search ||
        !search.input ||
        !search.suggestions
      ) {
        return;
      }


      const query =
        normalizeArabic(
          search.input.value
        );


      if (!query) {

        search.suggestions.hidden =
          true;

        search.suggestions.innerHTML =
          "";

        return;
      }


      const matches =
        homeProducts
          .filter(
            product =>
              product.searchIndex.includes(
                query
              )
          )
          .slice(0, 8);


      if (!matches.length) {

        search.suggestions.hidden =
          true;

        search.suggestions.innerHTML =
          "";

        return;
      }


      search.suggestions.innerHTML =
        matches
          .map(
            product => `
              <button
                type="button"
                class="search-suggestion"
                data-product-id="${escapeHtml(product.id)}"
              >

                <span>
                  ${escapeHtml(
                    categoryIcon(
                      product.category
                    )
                  )}
                </span>

                <span>

                  <strong>
                    ${escapeHtml(
                      product.name
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      product.category
                    )}
                  </small>

                </span>

              </button>
            `
          )
          .join("");


      search.suggestions.hidden =
        false;
    }


    if (
      search &&
      search.input
    ) {

      search.input.addEventListener(
        "input",
        () => {

          searchTerm =
            search.input.value;

          if (search.clear) {

            search.clear.hidden =
              !searchTerm;
          }


          updateSuggestions();

          renderProducts();

        }
      );


      search.input.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Escape"
          ) {

            search.input.value =
              "";

            searchTerm =
              "";

            if (search.clear) {
              search.clear.hidden =
                true;
            }

            if (search.suggestions) {
              search.suggestions.hidden =
                true;
            }

            renderProducts();
          }
        }
      );
    }


    if (
      search &&
      search.clear
    ) {

      search.clear.addEventListener(
        "click",
        () => {

          search.input.value =
            "";

          searchTerm =
            "";

          search.clear.hidden =
            true;

          search.suggestions.hidden =
            true;

          renderProducts();

          search.input.focus();
        }
      );
    }


    if (
      search &&
      search.suggestions
    ) {

      search.suggestions.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-product-id]"
            );


          if (!button) {
            return;
          }


          const product =
            products.find(
              item =>
                item.id ===
                button.dataset.productId
            );


          if (!product) {
            return;
          }


          search.suggestions.hidden =
            true;


          openProductModal(
            product
          );
        }
      );
    }


    document.addEventListener(
      "click",
      event => {

        if (
          search &&
          !event.target.closest(
            ".product-search"
          )
        ) {

          if (search.suggestions) {

            search.suggestions.hidden =
              true;
          }
        }
      }
    );


    /* =====================================================
       INITIAL RENDER
       ===================================================== */

    renderCategories();

    renderFilters();

    renderProducts();

    renderOffers();
  }


  /* =======================================================
     PRODUCT MODAL
     ======================================================= */

  function ensureProductModal() {

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

    modal.innerHTML = `

      <div
        class="product-modal-backdrop"
        data-close-modal
      ></div>


      <div
        class="product-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aboModalTitle"
      >

        <button
          type="button"
          class="product-modal-close"
          data-close-modal
          aria-label="إغلاق"
        >
          ×
        </button>


        <div
          id="aboModalImage"
          class="product-modal-image"
        >
        </div>


        <div class="product-modal-content">

          <span
            id="aboModalCategory"
            class="product-modal-category"
          >
          </span>


          <h2 id="aboModalTitle">
          </h2>


          <div
            id="aboModalDescription"
            class="product-modal-description"
          >
          </div>


          <div
            id="aboModalPrice"
            class="modal-price-box"
          >
          </div>


          <a
            id="aboModalWhatsapp"
            class="wa-btn large"
            href="#"
            target="_blank"
            rel="noopener"
          >
            💬 اسأل عن المنتج على واتساب
          </a>

        </div>

      </div>

    `;


    document.body.appendChild(
      modal
    );


    modal.addEventListener(
      "click",
      event => {

        if (
          event.target.closest(
            "[data-close-modal]"
          )
        ) {

          closeProductModal();
        }
      }
    );


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


    return modal;
  }


  function openProductModal(
    product
  ) {

    const modal =
      ensureProductModal();


    const imageBox =
      document.getElementById(
        "aboModalImage"
      );

    const title =
      document.getElementById(
        "aboModalTitle"
      );

    const category =
      document.getElementById(
        "aboModalCategory"
      );

    const description =
      document.getElementById(
        "aboModalDescription"
      );

    const price =
      document.getElementById(
        "aboModalPrice"
      );

    const whatsapp =
      document.getElementById(
        "aboModalWhatsapp"
      );


    title.textContent =
      product.name ||
      "منتج";


    category.textContent =
      product.category ||
      "";


    description.textContent =
      product.description ||
      "لا يوجد وصف إضافي لهذا المنتج.";


    price.innerHTML =
      renderPrice(
        product
      );


    whatsapp.href =
      whatsappUrl(
        product
      );


    const sources =
      getImageSources(
        product
      );


    if (sources.length) {

      imageBox.innerHTML = `
        <img
          src="${escapeHtml(sources[0])}"
          alt="${escapeHtml(product.name)}"
        >
      `;

    } else {

      imageBox.innerHTML = `
        <div class="product-image-placeholder">

          <span
            class="placeholder-icon"
            aria-hidden="true"
          >
            ${escapeHtml(
              categoryIcon(
                product.category
              )
            )}
          </span>

        </div>
      `;
    }


    modal.classList.add(
      "open"
    );


    document.body.classList.add(
      "modal-open"
    );


    setTimeout(
      () => {

        const close =
          modal.querySelector(
            ".product-modal-close"
          );

        if (close) {
          close.focus();
        }

      },
      50
    );
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
      "open"
    );


    document.body.classList.remove(
      "modal-open"
    );
  }


  /* =======================================================
     MOBILE NAV
     ======================================================= */

  function initMobileNav() {

    const menuBtn =
      document.getElementById(
        "menuBtn"
      );

    const nav =
      document.getElementById(
        "navLinks"
      );


    if (
      !menuBtn ||
      !nav
    ) {
      return;
    }


    menuBtn.addEventListener(
      "click",
      () => {

        const opened =
          nav.classList.toggle(
            "open"
          );


        menuBtn.setAttribute(
          "aria-expanded",
          opened
            ? "true"
            : "false"
        );
      }
    );


    nav
      .querySelectorAll("a")
      .forEach(
        link => {

          link.addEventListener(
            "click",
            () => {

              nav.classList.remove(
                "open"
              );

              menuBtn.setAttribute(
                "aria-expanded",
                "false"
              );

            }
          );

        }
      );
  }


  /* =======================================================
     START
     ======================================================= */

  async function start() {

    initMobileNav();

    showLoading();


    const cached =
      readCache();


    if (
      cached &&
      Array.isArray(
        cached.products
      )
    ) {

      const normalized =
        cached.products
          .map(
            normalizeProduct
          )
          .filter(Boolean)
          .filter(
            product =>
              product.active
          );


      initHomepage(
        normalized
      );


      const cacheAge =
        Date.now() -
        Number(
          cached.time || 0
        );


      if (
        cacheAge <
        BACKGROUND_REFRESH_TIME
      ) {
        return;
      }
    }


    try {

      const products =
        await fetchProducts();


      writeCache(
        products
      );


      initHomepage(
        products
      );

    } catch (error) {

      console.error(
        "Abo Tarek catalog error:",
        error
      );


      if (
        !cached ||
        !Array.isArray(
          cached.products
        )
      ) {

        showError();
      }
    }
  }


  /* =======================================================
     GLOBAL EXPORTS
     ======================================================= */

  window.openProductModal =
    openProductModal;

  window.closeProductModal =
    closeProductModal;


  /* =======================================================
     BOOT
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true
      }
    );

  } else {

    start();
  }

})();
