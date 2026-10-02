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

    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;

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
     PRICE HELPERS
     ========================================================= */

  function cleanPrice(value) {
    const text = cleanText(value);

    if (!text) {
      return "";
    }

    return text;
  }


  function getOfferPrice(product) {
    return cleanPrice(
      product.offerPrice ??
      product.OfferPrice ??
      product.offer_price
    );
  }


  function getOldPrice(product) {
    return cleanPrice(
      product.oldPrice ??
      product.OldPrice ??
      product.old_price
    );
  }


  function getRegularPrice(product) {
    return cleanPrice(
      product.price ??
      product.Price
    );
  }


  function hasOfferPricing(product) {
    return Boolean(
      getOfferPrice(product) ||
      getOldPrice(product)
    );
  }


  function renderProductPricing(product) {
    if (!product.isOffer) {
      return "";
    }

    const offerPrice =
      getOfferPrice(product);

    const oldPrice =
      getOldPrice(product);

    const regularPrice =
      getRegularPrice(product);

    if (
      !offerPrice &&
      !oldPrice
    ) {
      return "";
    }

    return `
      <div class="product-offer-pricing">

        ${
          oldPrice
            ? `
              <span class="product-old-price">
                ${escapeHtml(oldPrice)}
              </span>
            `
            : regularPrice
              ? `
                <span class="product-old-price">
                  ${escapeHtml(regularPrice)}
                </span>
              `
              : ""
        }

        ${
          offerPrice
            ? `
              <span class="product-offer-price">
                ${escapeHtml(offerPrice)}
              </span>
            `
            : ""
        }

      </div>
    `;
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
      cleanPrice(
        p.price ??
        p.Price
      );

    const oldPrice =
      cleanPrice(
        p.oldPrice ??
        p.OldPrice ??
        p.old_price
      );

    const offerPrice =
      cleanPrice(
        p.offerPrice ??
        p.OfferPrice ??
        p.offer_price
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
      rawProducts = data;

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

              /*
                تحديث الصفحة بصريًا بعد وصول
                البيانات الجديدة، حتى تظهر
                تغييرات العروض بدون Reload.
              */
              if (
                document.getElementById(
                  "productsGrid"
                )
              ) {
                initHomepage(
                  freshProducts
                );
              }

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
     IMAGE ELEMENT
     ========================================================= */

  function createProductImage(
    product,
    lazy = true
  ) {

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "product-image";

    /*
      لو المنتج عرض:
      نضيف طبقة العرض فوق الصورة.
    */
    if (product.isOffer) {

      const offerBadge =
        document.createElement(
          "span"
        );

      offerBadge.className =
        "product-offer-badge";

      offerBadge.innerHTML =
        "🔥 عرض مميز";

      wrapper.appendChild(
        offerBadge
      );
    }

    const sources =
      getImageSources(
        product.image
      );

    if (!sources.length) {

      const placeholder =
        document.createElement(
          "div"
        );

      placeholder.className =
        "product-image-placeholder";

      placeholder.innerHTML = `
        <span class="placeholder-icon">
          ${escapeHtml(
            categoryIcon(
              product.category
            )
          )}
        </span>
      `;

      wrapper.appendChild(
        placeholder
      );

      return wrapper;
    }

    const img =
      document.createElement(
        "img"
      );

    img.alt =
      product.name
        ? `صورة ${product.name}`
        : "صورة المنتج";

    img.width = 600;
    img.height = 600;

    img.decoding =
      "async";

    if (lazy) {

      img.loading =
        "lazy";

      img.fetchPriority =
        "low";

    } else {

      img.loading =
        "eager";

      img.fetchPriority =
        "high";
    }

    img.src =
      sources[0];

    img.addEventListener(
      "error",
      () => {

        const placeholder =
          document.createElement(
            "div"
          );

        placeholder.className =
          "product-image-placeholder";

        placeholder.innerHTML = `
          <span class="placeholder-icon">
            ${escapeHtml(
              categoryIcon(
                product.category
              )
            )}
          </span>
        `;

        wrapper
          .querySelectorAll("img")
          .forEach(imgEl =>
            imgEl.remove()
          );

        wrapper.appendChild(
          placeholder
        );

      },
      {
        once: true
      }
    );

    wrapper.appendChild(
      img
    );

    return wrapper;
  }


  /* =========================================================
     HOMEPAGE
     ========================================================= */

  function initHomepage(
    products
  ) {

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


    /* -----------------------------------------
       CATEGORIES
       ----------------------------------------- */

    function renderCategories() {

      if (!categoryGrid) {
        return;
      }

      if (!categories.length) {
        categoryGrid.innerHTML =
          "";

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
              >
                <span
                  class="cat-icon"
                  aria-hidden="true"
                >
                  ${escapeHtml(
                    categoryIcon(
                      category
                    )
                  )}
                </span>

                <span>
                  ${escapeHtml(
                    category
                  )}

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
       FILTERS
       ----------------------------------------- */

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
                  categoryIcon(
                    category
                  )
                )}
                ${escapeHtml(
                  category
                )}
              </button>
            `
          )
          .join("")}
      `;
    }


    /* -----------------------------------------
       FILTER PRODUCTS
       ----------------------------------------- */

    function getFilteredProducts() {

      const q =
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
            !q ||
            product.searchIndex.includes(
              q
            );

          return (
            categoryMatch &&
            searchMatch
          );
        }
      );
    }


    /* -----------------------------------------
       PRODUCT CARD
       ----------------------------------------- */

    function createProductCard(
      product,
      index
    ) {

      const article =
        document.createElement(
          "article"
        );

      /*
        إضافة class إضافية للعروض.
        الـCSS سيستخدمها لتمييز الكارت.
      */
      article.className =
        product.isOffer
          ? "product product-offer"
          : "product";

      article.dataset.id =
        product.id;

      article.dataset.offer =
        product.isOffer
          ? "true"
          : "false";

      article.appendChild(
        createProductImage(
          product,
          index > 1
        )
      );

      const body =
        document.createElement(
          "div"
        );

      body.className =
        "product-body";

      body.innerHTML = `

        ${
          product.isOffer
            ? `
              <div class="product-offer-label">
                <span>🔥</span>
                <strong>عرض مميز</strong>
              </div>
            `
            : ""
        }

        <span class="product-category">
          ${escapeHtml(
            product.category
          )}
        </span>

        <h3>
          ${escapeHtml(
            product.name
          )}
        </h3>

        ${
          product.description
            ? `
              <p class="product-description-short">
                ${escapeHtml(
                  product.description.length > 120
                    ? product.description
                        .slice(0, 120)
                        .trimEnd() + "..."
                    : product.description
                )}
              </p>

              ${
                product.description.length > 120
                  ? `
                    <button
                      type="button"
                      class="product-details-trigger"
                      aria-label="عرض المزيد من التفاصيل عن ${escapeHtml(product.name)}"
                    >
                      عرض المزيد من التفاصيل
                    </button>
                  `
                  : ""
              }
            `
            : ""
        }

        ${renderProductPricing(product)}

        <div class="product-footer">
          <a
            class="product-whatsapp"
            href="${escapeHtml(
              whatsappUrl(
                product
              )
            )}"
            target="_blank"
            rel="noopener"
          >
            💬 اسأل عن الصنف
          </a>
        </div>
      `;

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


    /* -----------------------------------------
       RENDER PRODUCTS
       ----------------------------------------- */

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


    /* -----------------------------------------
       OFFERS
       ----------------------------------------- */

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


    /* -----------------------------------------
       FILTER EVENTS
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


    /* -----------------------------------------
       CATEGORY EVENTS
       ----------------------------------------- */

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
              "homeProducts"
            );

          if (section) {

            section.scrollIntoView({
              behavior:
                "smooth",
              block:
                "start"
            });
          }
        }
      );
    }


    /* -----------------------------------------
       SEARCH
       ----------------------------------------- */

    function updateSuggestions() {

      if (
        !suggestions ||
        !searchInput
      ) {
        return;
      }

      const q =
        normalizeArabic(
          searchInput.value
        );

      if (!q) {

        suggestions.hidden =
          true;

        searchInput.setAttribute(
          "aria-expanded",
          "false"
        );

        return;
      }

      const matches =
        homeProducts
          .filter(
            product =>
              product.searchIndex.includes(
                q
              )
          )
          .slice(
            0,
            8
          );

      if (!matches.length) {

        suggestions.innerHTML = `
          <div class="search-suggestion">

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
                class="product-search-suggestion search-suggestion"
                data-id="${escapeHtml(product.id)}"
              >

                <span class="search-suggestion-icon">
                  ${escapeHtml(
                    categoryIcon(
                      product.category
                    )
                  )}
                </span>

                <span class="search-suggestion-content">

                  <span class="search-suggestion-name">
                    ${escapeHtml(
                      product.name
                    )}
                  </span>

                  <span class="search-suggestion-meta">
                    ${escapeHtml(
                      product.category
                    )}
                  </span>

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

          updateSuggestions();
          renderProducts();
        }
      );

      searchInput.addEventListener(
        "focus",
        updateSuggestions
      );

      searchInput.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Escape"
          ) {

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

          searchInput.value =
            "";

          searchTerm =
            "";

          searchClear.hidden =
            true;

          if (suggestions) {
            suggestions.hidden =
              true;
          }

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
            homeProducts.find(
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

          suggestions.hidden =
            true;

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
              id="aboModalOffer"
              class="product-modal-offer"
              hidden
            >
              🔥 عرض مميز
            </span>

            <span
              id="aboModalCategory"
              class="product-category"
            ></span>

            <h2
              id="aboModalName"
            ></h2>

            <div
              id="aboModalPricing"
              class="product-modal-pricing"
              hidden
            ></div>

            <p
              id="aboModalDescription"
            ></p>

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

    const offer =
      document.getElementById(
        "aboModalOffer"
      );

    const category =
      document.getElementById(
        "aboModalCategory"
      );

    const name =
      document.getElementById(
        "aboModalName"
      );

    const pricing =
      document.getElementById(
        "aboModalPricing"
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

      if (sources.length) {

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


    if (offer) {

      offer.hidden =
        !product.isOffer;
    }


    if (category) {
      category.textContent =
        product.category;
    }


    if (name) {
      name.textContent =
        product.name;
    }


    if (pricing) {

      const pricingHtml =
        renderProductPricing(
          product
        );

      if (pricingHtml) {

        pricing.innerHTML =
          pricingHtml;

        pricing.hidden =
          false;

      } else {

        pricing.innerHTML =
          "";

        pricing.hidden =
          true;
      }
    }


    if (description) {

      description.textContent =
        product.description ||
        "للاستفسار عن تفاصيل الصنف، تواصل معنا على واتساب.";
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

      /*
        ======================================================
        1) نقرأ الكاش أولاً
        ======================================================
      */

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


      /*
        ======================================================
        2) لا يوجد كاش
        ======================================================
      */

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
