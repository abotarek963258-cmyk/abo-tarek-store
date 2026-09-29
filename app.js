/* =========================================================
   ABO TAREK STORE
   APP.JS
   Homepage + Sections + Products
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     01 - SETTINGS
     ========================================================= */

  const DATA_URL =
    "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY";

  const WHATSAPP_NUMBER = "201551604163";

  const CACHE_KEY = "abo_tarek_products_v7";
  const CACHE_TIME = 5 * 60 * 1000;

  const IMAGE_BASE_RAW =
    "https://raw.githubusercontent.com/abotarek963258-cmyk/abo-tarek-store/main/";

  const IMAGE_BASE_PAGES =
    "https://abotarek963258-cmyk.github.io/abo-tarek-store/";

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
     02 - HELPERS
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


  function isActive(value) {
    if (value === false || value === 0) return false;

    const text = normalizeArabic(value);

    if (
      text === "false" ||
      text === "0" ||
      text === "no" ||
      text === "inactive" ||
      text === "غير نشط" ||
      text === "غير متاح"
    ) {
      return false;
    }

    return true;
  }


  function categoryIcon(category) {
    const key = cleanText(category);
    return CATEGORY_ICONS[key] || FALLBACK_ICON;
  }


  function getImageSources(image) {
    const original = cleanText(image);

    if (!original) {
      return [];
    }

    const sources = [];

    function add(url) {
      if (url && !sources.includes(url)) {
        sources.push(url);
      }
    }

    if (
      original.startsWith(IMAGE_BASE_RAW)
    ) {
      const relative = original.slice(IMAGE_BASE_RAW.length);

      add(
        IMAGE_BASE_PAGES +
        relative
          .split("/")
          .map(part => encodeURIComponent(part))
          .join("/")
      );

      add(original);

      return sources;
    }

    if (
      original.startsWith("https://raw.githubusercontent.com/")
    ) {
      add(original);

      try {
        const url = new URL(original);
        const parts = url.pathname.split("/").filter(Boolean);

        if (
          parts.length >= 5 &&
          parts[0] === "abotarek963258-cmyk" &&
          parts[1] === "abo-tarek-store"
        ) {
          const mainIndex = parts.indexOf("main");

          if (mainIndex !== -1) {
            const relativeParts = parts.slice(mainIndex + 1);

            add(
              IMAGE_BASE_PAGES +
              relativeParts
                .map(part => encodeURIComponent(part))
                .join("/")
            );
          }
        }
      } catch (error) {
        /* ignore invalid URL */
      }

      return sources;
    }

    if (
      original.startsWith("http://") ||
      original.startsWith("https://") ||
      original.startsWith("data:")
    ) {
      add(original);
      return sources;
    }

    const relative = original
      .replace(/^\.?\//, "")
      .replace(/^\/+/, "");

    add(
      IMAGE_BASE_PAGES +
      relative
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/")
    );

    return sources;
  }


  function imageUrl(image) {
    const sources = getImageSources(image);
    return sources[0] || "";
  }


  function whatsappUrl(product) {
    const name = cleanText(product.name);

    const message =
      name
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
     03 - CACHE
     ========================================================= */

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);

      if (!raw) {
        return null;
      }

      const data = JSON.parse(raw);

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
      /* localStorage may be unavailable */
    }
  }


  /* =========================================================
     04 - NORMALIZE PRODUCTS
     ========================================================= */

  function normalizeProduct(product, index) {
    const p = product || {};

    const id =
      cleanText(
        p.id ??
        p.ID ??
        p.Id
      ) || `product-${index + 1}`;

    const name =
      cleanText(
        p.name ??
        p.Name ??
        p.product ??
        p.title
      ) || "صنف بدون اسم";

    const category =
      cleanText(
        p.category ??
        p.Category ??
        p.cat
      ) || "أدوات منزلية";

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

    const sortOrderRaw =
      p.sortOrder ??
      p.SortOrder ??
      p.order ??
      p.Order ??
      "";

    const sortOrder =
      Number.isFinite(Number(sortOrderRaw))
        ? Number(sortOrderRaw)
        : 999999;

    return {
      id,
      name,
      category,
      image,
      description,
      active,
      sortOrder,
      searchIndex: normalizeArabic(
        `${name} ${category} ${description}`
      )
    };
  }


  /* =========================================================
     05 - FETCH DATA
     ========================================================= */

  let productsPromise = null;

  async function fetchProducts() {
    const response = await fetch(
      DATA_URL + "?t=" + Date.now(),
      {
        method: "GET",
        cache: "no-store",
        redirect: "follow"
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (!data || data.ok !== true || !Array.isArray(data.products)) {
      throw new Error(
        data && data.error
          ? data.error
          : "صيغة البيانات غير صحيحة"
      );
    }

    return data.products
      .map(normalizeProduct)
      .filter(product => product.active)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }

        return a.name.localeCompare(
          b.name,
          "ar"
        );
      });
  }


  async function getProducts(options = {}) {
    const forceRefresh = options.forceRefresh === true;

    if (!forceRefresh) {
      const cached = readCache();

      if (
        cached &&
        Array.isArray(cached.products) &&
        Date.now() - cached.time < CACHE_TIME
      ) {
        return cached.products;
      }
    }

    if (!productsPromise) {
      productsPromise = fetchProducts()
        .then(products => {
          writeCache(products);
          return products;
        })
        .finally(() => {
          productsPromise = null;
        });
    }

    return productsPromise;
  }


  /* =========================================================
     06 - GENERIC IMAGE LOADING
     ========================================================= */

  function createProductImage(product, options = {}) {
    const wrapper = document.createElement("div");

    wrapper.className =
      options.wrapperClass ||
      "product-image";

    const sources = getImageSources(
      product.image
    );

    if (!sources.length) {
      wrapper.innerHTML = `
        <div class="product-image-placeholder">
          <span class="placeholder-icon">
            ${escapeHtml(categoryIcon(product.category))}
          </span>
          <span>الصورة غير متاحة</span>
        </div>
      `;

      return wrapper;
    }

    const img = document.createElement("img");

    img.alt =
      product.name
        ? `صورة ${product.name}`
        : "صورة المنتج";

    img.width = 600;
    img.height = 600;

    img.decoding = "async";

    if (options.lazy !== false) {
      img.loading = "lazy";
    } else {
      img.loading = "eager";
    }

    if (options.fetchPriority) {
      img.fetchPriority =
        options.fetchPriority;
    }

    let sourceIndex = 0;

    function loadSource() {
      if (sourceIndex >= sources.length) {
        wrapper.innerHTML = `
          <div class="product-image-placeholder">
            <span class="placeholder-icon">
              ${escapeHtml(categoryIcon(product.category))}
            </span>
            <span>تعذر تحميل الصورة</span>
          </div>
        `;

        return;
      }

      img.src = sources[sourceIndex++];
    }

    img.addEventListener(
      "error",
      loadSource,
      { once: false }
    );

    wrapper.appendChild(img);

    loadSource();

    return wrapper;
  }


  /* =========================================================
     07 - HOMEPAGE
     ========================================================= */

  function initHomepage(products) {
    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (!grid) {
      return;
    }

    const filters =
      document.getElementById(
        "filters"
      );

    const searchInput =
      document.getElementById(
        "productSearchInput"
      );

    const searchClear =
      document.getElementById(
        "productSearchClear"
      );

    const suggestions =
      document.getElementById(
        "productSearchSuggestions"
      );

    const categoryGrid =
      document.getElementById(
        "categoryGrid"
      );

    let activeCategory = "الكل";
    let searchTerm = "";

    const categories = [
      ...new Set(
        products
          .map(p => p.category)
          .filter(Boolean)
      )
    ];


    /* -----------------------------------------
       COUNTS
       ----------------------------------------- */

    const heroProductCount =
      document.getElementById(
        "heroProductCount"
      );

    const heroCategoryCount =
      document.getElementById(
        "heroCategoryCount"
      );

    if (heroProductCount) {
      heroProductCount.textContent =
        products.length;
    }

    if (heroCategoryCount) {
      heroCategoryCount.textContent =
        categories.length;
    }


    /* -----------------------------------------
       CATEGORIES
       ----------------------------------------- */

    function renderCategories() {
      if (!categoryGrid) {
        return;
      }

      categoryGrid.innerHTML = categories
        .map(category => {
          const count =
            products.filter(
              p => p.category === category
            ).length;

          return `
            <button
              class="cat"
              type="button"
              data-category="${escapeHtml(category)}"
            >
              <span class="cat-icon" aria-hidden="true">
                ${escapeHtml(categoryIcon(category))}
              </span>

              <span>
                ${escapeHtml(category)}
                <small style="
                  display:block;
                  margin-top:2px;
                  color:#89939c;
                  font-size:10px;
                  font-weight:700;
                ">
                  ${count} صنف
                </small>
              </span>
            </button>
          `;
        })
        .join("");
    }


    /* -----------------------------------------
       FILTER BUTTONS
       ----------------------------------------- */

    function renderFilters() {
      if (!filters) {
        return;
      }

      filters.innerHTML = [
        `
          <button
            class="filter active"
            type="button"
            data-filter="الكل"
          >
            🛍️ الكل
          </button>
        `,
        ...categories.map(category => `
          <button
            class="filter"
            type="button"
            data-filter="${escapeHtml(category)}"
          >
            ${escapeHtml(categoryIcon(category))}
            ${escapeHtml(category)}
          </button>
        `)
      ].join("");
    }


    /* -----------------------------------------
       FILTER PRODUCTS
       ----------------------------------------- */

    function getFilteredProducts() {
      const q =
        normalizeArabic(searchTerm);

      return products.filter(product => {
        const categoryMatch =
          activeCategory === "الكل" ||
          product.category === activeCategory;

        const searchMatch =
          !q ||
          product.searchIndex.includes(q);

        return categoryMatch && searchMatch;
      });
    }


    /* -----------------------------------------
       PRODUCT CARD
       ----------------------------------------- */

    function productCard(product, index) {
      const article =
        document.createElement("article");

      article.className = "product";

      article.dataset.id =
        product.id;

      const image =
        createProductImage(
          product,
          {
            lazy: index > 1,
            fetchPriority:
              index < 2
                ? "high"
                : "auto"
          }
        );

      article.appendChild(image);

      const body =
        document.createElement("div");

      body.className =
        "product-body";

      body.innerHTML = `
        <span class="product-category">
          ${escapeHtml(product.category)}
        </span>

        <h3>
          ${escapeHtml(product.name)}
        </h3>

        ${
          product.description
            ? `
              <p>
                ${escapeHtml(product.description)}
              </p>
            `
            : ""
        }

        <div class="product-footer">
          <a
            class="product-whatsapp"
            href="${escapeHtml(whatsappUrl(product))}"
            target="_blank"
            rel="noopener"
          >
            💬 اسأل عن الصنف
          </a>
        </div>
      `;

      article.appendChild(body);

      article.addEventListener(
        "click",
        event => {
          if (
            event.target.closest(
              ".product-whatsapp"
            )
          ) {
            return;
          }

          openProductModal(product);
        }
      );

      return article;
    }


    /* -----------------------------------------
       RENDER PRODUCTS
       ----------------------------------------- */

    function renderProducts() {
      if (!grid) {
        return;
      }

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
          </div>
        `;

        return;
      }

      const fragment =
        document.createDocumentFragment();

      list.forEach(
        (product, index) => {
          fragment.appendChild(
            productCard(
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


    /* -----------------------------------------
       SEARCH SUGGESTIONS
       ----------------------------------------- */

    function renderSuggestions() {
      if (!suggestions || !searchInput) {
        return;
      }

      const q =
        normalizeArabic(
          searchInput.value
        );

      if (!q) {
        suggestions.hidden = true;
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
              product.searchIndex.includes(q)
          )
          .slice(0, 8);

      if (!matches.length) {
        suggestions.innerHTML = `
          <div
            class="search-suggestion"
            style="cursor:default"
          >
            <span class="search-suggestion-icon">
              🔎
            </span>

            <span class="search-suggestion-content">
              <span class="search-suggestion-name">
                مفيش نتائج
              </span>

              <span class="search-suggestion-meta">
                جرّب كلمة بحث مختلفة
              </span>
            </span>
          </div>
        `;

        suggestions.hidden = false;

        searchInput.setAttribute(
          "aria-expanded",
          "true"
        );

        return;
      }

      suggestions.innerHTML =
        matches
          .map(product => `
            <button
              type="button"
              class="product-search-suggestion search-suggestion"
              data-id="${escapeHtml(product.id)}"
              role="option"
            >
              <span class="search-suggestion-icon">
                ${escapeHtml(categoryIcon(product.category))}
              </span>

              <span class="search-suggestion-content">
                <span class="search-suggestion-name">
                  ${escapeHtml(product.name)}
                </span>

                <span class="search-suggestion-meta">
                  ${escapeHtml(product.category)}
                </span>
              </span>
            </button>
          `)
          .join("");

      suggestions.hidden = false;

      searchInput.setAttribute(
        "aria-expanded",
        "true"
      );
    }


    /* -----------------------------------------
       EVENTS
       ----------------------------------------- */

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
            cleanText(
              button.dataset.filter
            ) || "الكل";

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
            cleanText(
              button.dataset.category
            );

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

          const productSection =
            document.getElementById(
              "products"
            );

          if (productSection) {
            productSection.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        }
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
          renderSuggestions();
        }
      );

      searchInput.addEventListener(
        "keydown",
        event => {
          if (event.key === "Escape") {
            if (suggestions) {
              suggestions.hidden =
                true;
            }

            searchInput.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        }
      );
    }


    if (searchClear) {
      searchClear.addEventListener(
        "click",
        () => {
          searchInput.value = "";
          searchTerm = "";

          searchClear.hidden = true;

          if (suggestions) {
            suggestions.hidden =
              true;
          }

          searchInput.setAttribute(
            "aria-expanded",
            "false"
          );

          renderProducts();
          searchInput.focus();
        }
      );
    }


    if (suggestions) {
      suggestions.addEventListener(
        "click",
        event => {
          const button =
            event.target.closest(
              "[data-id]"
            );

          if (!button) {
            return;
          }

          const product =
            products.find(
              item =>
                item.id ===
                button.dataset.id
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

          suggestions.hidden = true;

          searchInput.setAttribute(
            "aria-expanded",
            "false"
          );

          renderProducts();

          requestAnimationFrame(
            () => {
              const card =
                grid.querySelector(
                  `[data-id="${CSS.escape(product.id)}"]`
                );

              if (card) {
                card.scrollIntoView({
                  behavior: "smooth",
                  block: "center"
                });

                card.classList.add(
                  "search-highlight"
                );

                setTimeout(
                  () =>
                    card.classList.remove(
                      "search-highlight"
                    ),
                  1800
                );
              }
            }
          );
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
            suggestions.hidden = true;
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
  }


  /* =========================================================
     08 - SECTIONS PAGE
     ========================================================= */

  function initSectionsPage(products) {
    const categoriesContainer =
      document.getElementById(
        "categories"
      );

    const productsContainer =
      document.getElementById(
        "products"
      );

    if (
      !categoriesContainer ||
      !productsContainer
    ) {
      return;
    }

    const searchInput =
      document.getElementById(
        "searchInput"
      );

    const clearSearch =
      document.getElementById(
        "clearSearch"
      );

    const searchInfo =
      document.getElementById(
        "searchResultInfo"
      );

    const selectedCategory =
      document.getElementById(
        "selectedCategory"
      );

    const selectedCategoryName =
      document.getElementById(
        "selectedCategoryName"
      );

    const selectedCategoryCount =
      document.getElementById(
        "selectedCategoryCount"
      );

    const clearCategory =
      document.getElementById(
        "clearCategory"
      );

    let activeCategory = "الكل";
    let searchTerm = "";


    const categories = [
      ...new Set(
        products
          .map(p => p.category)
          .filter(Boolean)
      )
    ];


    /* -----------------------------------------
       CATEGORY RENDER
       ----------------------------------------- */

    function renderCategories() {
      categoriesContainer.innerHTML = `
        <button
          class="category-chip sections-category active"
          type="button"
          data-category="الكل"
        >
          ${escapeHtml(categoryIcon("الكل"))}
          كل الأصناف
        </button>

        ${categories.map(category => `
          <button
            class="category-chip sections-category"
            type="button"
            data-category="${escapeHtml(category)}"
          >
            ${escapeHtml(categoryIcon(category))}
            ${escapeHtml(category)}
          </button>
        `).join("")}
      `;
    }


    /* -----------------------------------------
       FILTER
       ----------------------------------------- */

    function getFilteredProducts() {
      const q =
        normalizeArabic(searchTerm);

      return products.filter(product => {
        const categoryMatch =
          activeCategory === "الكل" ||
          product.category === activeCategory;

        const searchMatch =
          !q ||
          product.searchIndex.includes(q);

        return categoryMatch && searchMatch;
      });
    }


    /* -----------------------------------------
       UPDATE SELECTED CATEGORY
       ----------------------------------------- */

    function updateSelectedCategory() {
      if (!selectedCategory) {
        return;
      }

      if (activeCategory === "الكل") {
        selectedCategory.hidden = true;
        return;
      }

      selectedCategory.hidden = false;

      if (selectedCategoryName) {
        selectedCategoryName.textContent =
          activeCategory;
      }

      if (selectedCategoryCount) {
        const count =
          products.filter(
            product =>
              product.category ===
              activeCategory
          ).length;

        selectedCategoryCount.textContent =
          `${count} صنف`;
      }
    }


    /* -----------------------------------------
       PRODUCT CARD
       ----------------------------------------- */

    function renderProduct(product, index) {
      const card =
        document.createElement("article");

      card.className =
        "product sections-product";

      card.dataset.id =
        product.id;

      const image =
        createProductImage(
          product,
          {
            lazy: index > 1,
            fetchPriority:
              index < 2
                ? "high"
                : "auto"
          }
        );

      card.appendChild(image);

      const body =
        document.createElement("div");

      body.className =
        "product-body";

      body.innerHTML = `
        <span class="product-category">
          ${escapeHtml(product.category)}
        </span>

        <h3>
          ${escapeHtml(product.name)}
        </h3>

        ${
          product.description
            ? `
              <p>
                ${escapeHtml(product.description)}
              </p>
            `
            : ""
        }

        <div class="product-footer">
          <a
            class="product-whatsapp"
            href="${escapeHtml(whatsappUrl(product))}"
            target="_blank"
            rel="noopener"
          >
            💬 اسأل عن الصنف
          </a>
        </div>
      `;

      card.appendChild(body);

      card.addEventListener(
        "click",
        event => {
          if (
            event.target.closest(
              ".product-whatsapp"
            )
          ) {
            return;
          }

          openProductModal(product);
        }
      );

      return card;
    }


    /* -----------------------------------------
       RENDER
       ----------------------------------------- */

    function renderProducts() {
      const list =
        getFilteredProducts();

      if (searchInfo) {
        if (searchTerm) {
          searchInfo.textContent =
            `تم العثور على ${list.length} صنف`;
        } else {
          searchInfo.textContent =
            `${list.length} صنف متاح`;
        }
      }

      if (!list.length) {
        productsContainer.innerHTML = `
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
          </div>
        `;

        return;
      }

      const fragment =
        document.createDocumentFragment();

      list.forEach(
        (product, index) => {
          fragment.appendChild(
            renderProduct(
              product,
              index
            )
          );
        }
      );

      productsContainer.replaceChildren(
        fragment
      );
    }


    /* -----------------------------------------
       CATEGORY EVENTS
       ----------------------------------------- */

    categoriesContainer.addEventListener(
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
          cleanText(
            button.dataset.category
          ) || "الكل";

        categoriesContainer
          .querySelectorAll(
            "[data-category]"
          )
          .forEach(
            item => {
              item.classList.toggle(
                "active",
                item === button
              );
            }
          );

        updateSelectedCategory();
        renderProducts();
      }
    );


    /* -----------------------------------------
       SEARCH
       ----------------------------------------- */

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        () => {
          searchTerm =
            searchInput.value;

          if (clearSearch) {
            clearSearch.hidden =
              !searchInput.value;
          }

          renderProducts();
        }
      );
    }


    if (clearSearch) {
      clearSearch.addEventListener(
        "click",
        () => {
          if (searchInput) {
            searchInput.value = "";
            searchTerm = "";
            searchInput.focus();
          }

          clearSearch.hidden = true;

          renderProducts();
        }
      );
    }


    if (clearCategory) {
      clearCategory.addEventListener(
        "click",
        () => {
          activeCategory = "الكل";

          categoriesContainer
            .querySelectorAll(
              "[data-category]"
            )
            .forEach(
              item => {
                item.classList.toggle(
                  "active",
                  item.dataset.category ===
                  "الكل"
                );
              }
            );

          updateSelectedCategory();
          renderProducts();
        }
      );
    }


    renderCategories();
    updateSelectedCategory();
    renderProducts();
  }


  /* =========================================================
     09 - PRODUCT MODAL
     ========================================================= */

  function getModalElements() {
    return {
      modal:
        document.getElementById(
          "productModal"
        ),

      close:
        document.getElementById(
          "modalClose"
        ),

      image:
        document.getElementById(
          "modalImage"
        ),

      category:
        document.getElementById(
          "modalCategory"
        ),

      name:
        document.getElementById(
          "modalProductName"
        ),

      description:
        document.getElementById(
          "modalDescription"
        ),

      whatsapp:
        document.getElementById(
          "modalWhatsApp"
        )
    };
  }


  function openProductModal(product) {
    const elements =
      getModalElements();

    if (!elements.modal) {
      return;
    }

    if (elements.category) {
      elements.category.textContent =
        product.category;
    }

    if (elements.name) {
      elements.name.textContent =
        product.name;
    }

    if (elements.description) {
      elements.description.textContent =
        product.description ||
        "للاستفسار عن تفاصيل الصنف، تواصل معنا على واتساب.";
    }

    if (elements.whatsapp) {
      elements.whatsapp.href =
        whatsappUrl(product);
    }

    if (elements.image) {
      const sources =
        getImageSources(
          product.image
        );

      if (sources.length) {
        elements.image.src =
          sources[0];

        elements.image.alt =
          `صورة ${product.name}`;

        elements.image.style.display =
          "block";

        elements.image.onerror =
          function () {
            const current =
              this.dataset.sourceIndex
                ? Number(
                    this.dataset.sourceIndex
                  )
                : 0;

            if (
              current + 1 <
              sources.length
            ) {
              this.dataset.sourceIndex =
                String(current + 1);

              this.src =
                sources[current + 1];
            } else {
              this.style.display =
                "none";
            }
          };
      } else {
        elements.image.removeAttribute(
          "src"
        );

        elements.image.alt =
          "الصورة غير متاحة";
      }
    }

    elements.modal.classList.add(
      "open"
    );

    elements.modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";
  }


  function closeProductModal() {
    const elements =
      getModalElements();

    if (!elements.modal) {
      return;
    }

    elements.modal.classList.remove(
      "open"
    );

    elements.modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow =
      "";
  }


  function initModal() {
    const elements =
      getModalElements();

    if (!elements.modal) {
      return;
    }

    if (elements.close) {
      elements.close.addEventListener(
        "click",
        closeProductModal
      );
    }

    elements.modal.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          elements.modal
        ) {
          closeProductModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape"
        ) {
          closeProductModal();
        }
      }
    );
  }


  /* =========================================================
     10 - LOADING / ERROR
     ========================================================= */

  function showHomepageLoading() {
    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (!grid) {
      return;
    }

    grid.innerHTML = `
      <div class="loading">
        جاري تحميل الأصناف...
      </div>
    `;
  }


  function showSectionsLoading() {
    const products =
      document.getElementById(
        "products"
      );

    if (!products) {
      return;
    }

    products.innerHTML = `
      <div class="sections-loading">
        جاري تحميل الأصناف...
      </div>
    `;
  }


  function showError() {
    const homepageGrid =
      document.getElementById(
        "productsGrid"
      );

    const sectionsGrid =
      document.getElementById(
        "products"
      );

    const message = `
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

    if (homepageGrid) {
      homepageGrid.innerHTML =
        message;
    }

    if (sectionsGrid) {
      sectionsGrid.innerHTML =
        message;
    }

    const retry =
      document.getElementById(
        "retryProducts"
      );

    if (retry) {
      retry.addEventListener(
        "click",
        () => {
          window.location.reload();
        }
      );
    }
  }


  /* =========================================================
     11 - YEAR
     ========================================================= */

  function setYear() {
    const year =
      document.getElementById(
        "year"
      );

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }
  }


  /* =========================================================
     12 - CLOSE MOBILE / ESC
     ========================================================= */

  function initGlobalEvents() {
    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape"
        ) {
          closeProductModal();
        }
      }
    );
  }


  /* =========================================================
     13 - APP START
     ========================================================= */

  async function startApp() {
    setYear();
    initModal();
    initGlobalEvents();

    const homepage =
      document.getElementById(
        "productsGrid"
      );

    const sectionsPage =
      document.getElementById(
        "categories"
      ) &&
      document.getElementById(
        "products"
      );

    if (homepage) {
      showHomepageLoading();
    }

    if (sectionsPage) {
      showSectionsLoading();
    }

    try {
      /*
        أولاً نحاول استخدام الكاش.
        ده بيخلي الصفحة تظهر أسرع جداً
        في الزيارات المتكررة.
      */

      const cached =
        readCache();

      if (
        cached &&
        Array.isArray(cached.products) &&
        cached.products.length
      ) {
        if (homepage) {
          initHomepage(
            cached.products
          );
        }

        if (sectionsPage) {
          initSectionsPage(
            cached.products
          );
        }

        /*
          تحديث البيانات في الخلفية
          بدون تعطيل الصفحة.
        */

        fetchProducts()
          .then(freshProducts => {
            writeCache(
              freshProducts
            );
          })
          .catch(() => {
            /* الكاش يظل مستخدماً */
          });

        return;
      }

      /*
        مفيش كاش:
        نحمل البيانات لأول مرة.
      */

      const products =
        await getProducts({
          forceRefresh: true
        });

      if (homepage) {
        initHomepage(products);
      }

      if (sectionsPage) {
        initSectionsPage(products);
      }

    } catch (error) {
      console.error(
        "Abo Tarek Store:",
        error
      );

      showError();
    }
  }


  /* =========================================================
     14 - START AFTER DOM
     ========================================================= */

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
