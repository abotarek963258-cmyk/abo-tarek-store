/* =========================================================
   ABO TAREK STORE
   PREMIUM E-COMMERCE APP
   PRODUCTS + SEARCH + PRICES + CART + WHATSAPP
   ========================================================= */

(() => {
  "use strict";


  /* =========================================================
     01 — SETTINGS
     ========================================================= */

  const DATA_URL =
    "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

  const WHATSAPP_NUMBER = "201551604163";

  const CACHE_KEY = "abo_tarek_products_v11";

  const CART_KEY = "abo_tarek_cart_v1";

  const CACHE_TIME = 30 * 60 * 1000;

  const BACKGROUND_REFRESH_TIME = 10 * 60 * 1000;


  /* =========================================================
     02 — STATE
     ========================================================= */

  let productsStore = [];

  let activeCategory = "الكل";

  let currentSearch = "";

  let cart = [];

  let productPromise = null;

  let toastTimer = null;


  /* =========================================================
     03 — CATEGORY ICONS
     ========================================================= */

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


  /* =========================================================
     04 — HELPERS
     ========================================================= */

  function cleanText(value) {
    return String(value ?? "").trim();
  }


  function escapeHtml(value) {
    return cleanText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function escapeAttribute(value) {
    return escapeHtml(value);
  }


  function normalizeArabic(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[إأآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ـ/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }


  function categoryIcon(category) {
    const normalized = cleanText(category);

    return CATEGORY_ICONS[normalized] || "✦";
  }


  function isActive(value) {
    if (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true" ||
      value === "TRUE" ||
      value === "نعم" ||
      value === "فعال" ||
      value === "active"
    ) {
      return true;
    }

    if (
      value === false ||
      value === 0 ||
      value === "0" ||
      value === "false" ||
      value === "FALSE" ||
      value === "لا" ||
      value === "غير فعال" ||
      value === "inactive"
    ) {
      return false;
    }

    return true;
  }


  function isFlagEnabled(value, defaultValue = false) {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    return isActive(value);
  }


  /* =========================================================
     05 — PRICE HELPERS
     ========================================================= */

  function normalizePrice(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    let text = String(value)
      .replace(/٬/g, "")
      .replace(/,/g, "")
      .replace(/[^\d.٫]/g, "")
      .replace(/٫/g, ".");

    if (!text) {
      return null;
    }

    const number = Number(text);

    if (!Number.isFinite(number)) {
      return null;
    }

    return number;
  }


  function hasPrice(product) {
    return normalizePrice(
      product?.offerPrice ??
      product?.price
    ) !== null;
  }


  function getProductPrice(product) {
    if (!product) {
      return null;
    }

    const offer = normalizePrice(product.offerPrice);

    if (offer !== null) {
      return offer;
    }

    return normalizePrice(product.price);
  }


  function getOldPrice(product) {
    const oldPrice = normalizePrice(product?.oldPrice);

    if (oldPrice === null) {
      return null;
    }

    const current = getProductPrice(product);

    if (current !== null && oldPrice <= current) {
      return null;
    }

    return oldPrice;
  }


  function formatPrice(value) {
    const number = normalizePrice(value);

    if (number === null) {
      return "";
    }

    return new Intl.NumberFormat("ar-EG", {
      maximumFractionDigits: 2
    }).format(number);
  }


  function renderPrice(product) {
    const current = getProductPrice(product);

    if (current === null) {
      return `
        <div class="product-price">
          <span class="product-price-empty">
            السعر عند الطلب
          </span>
        </div>
      `;
    }

    const oldPrice = getOldPrice(product);

    return `
      <div class="product-price">
        <span class="product-price-current">
          ${escapeHtml(formatPrice(current))} ج.م
        </span>

        ${
          oldPrice !== null
            ? `
              <span class="product-price-old">
                ${escapeHtml(formatPrice(oldPrice))} ج.م
              </span>
            `
            : ""
        }
      </div>
    `;
  }


  /* =========================================================
     06 — IMAGE HELPERS
     ========================================================= */

  function getImageSource(product) {
    const image = cleanText(product?.image);

    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("data:")
    ) {
      return image;
    }

    const base =
      "https://abotarek963258-cmyk.github.io/abo-tarek-store/";

    return (
      base +
      image
        .replace(/^\.?\//, "")
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/")
    );
  }


  function createProductImage(product, lazy = true) {
    const src = getImageSource(product);

    const icon = categoryIcon(product.category);

    if (!src) {
      return `
        <div class="product-image-wrap">
          <div
            class="product-image"
            style="
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:45px;
              color:#d6b36a;
              background:
                radial-gradient(
                  circle,
                  rgba(214,179,106,.12),
                  transparent 65%
                ),
                #07111d;
            "
            aria-label="${escapeAttribute(product.name)}"
          >
            ${icon}
          </div>
        </div>
      `;
    }

    return `
      <div class="product-image-wrap">
        <img
          class="product-image"
          src="${escapeAttribute(src)}"
          alt="${escapeAttribute(product.name)}"
          width="700"
          height="700"
          ${lazy ? 'loading="lazy"' : 'loading="eager"'}
          decoding="async"
          onerror="this.style.display='none';"
        >
      </div>
    `;
  }


  /* =========================================================
     07 — NORMALIZE PRODUCT
     ========================================================= */

  function normalizeProduct(raw, index = 0) {
    const product = raw || {};

    const name =
      cleanText(
        product.name ??
        product.productName ??
        product.title
      ) || `منتج ${index + 1}`;


    const category =
      cleanText(
        product.category ??
        product.section ??
        product.sectionName
      ) || "أدوات منزلية";


    const id =
      cleanText(
        product.id ??
        product.productId
      ) ||
      normalizeArabic(name)
        .replace(/\s+/g, "-")
        .slice(0, 100) ||
      `product-${index + 1}`;


    const description =
      cleanText(
        product.description ??
        product.desc ??
        product.details
      );


    const image =
      cleanText(
        product.image ??
        product.imageUrl ??
        product.photo
      );


    const price =
      normalizePrice(product.price);


    const oldPrice =
      normalizePrice(product.oldPrice);


    const offerPrice =
      normalizePrice(
        product.offerPrice ??
        product.salePrice
      );


    const sortOrder =
      Number(product.sortOrder) ||
      Number(product.order) ||
      index;


    const showHome =
      isFlagEnabled(
        product.showHome ??
        product.home ??
        product.show_home,
        true
      );


    const isOffer =
      isFlagEnabled(
        product.isOffer ??
        product.offer ??
        product.specialOffer,
        false
      );


    return {
      id,
      name,
      category,
      image,
      description,

      active: isActive(product.active),

      showHome,

      isOffer,

      price,
      oldPrice,
      offerPrice,

      sortOrder,

      searchIndex:
        normalizeArabic(
          [
            name,
            category,
            description
          ].join(" ")
        )
    };
  }


  /* =========================================================
     08 — CACHE
     ========================================================= */

  function readCache() {
    try {
      const raw =
        localStorage.getItem(CACHE_KEY);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      if (
        !parsed ||
        !Array.isArray(parsed.products)
      ) {
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }


  function writeCache(products) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          products
        })
      );
    } catch (error) {
      // Cache failure should never break the website.
    }
  }


  /* =========================================================
     09 — FETCH PRODUCTS
     ========================================================= */

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


    let rawProducts = [];


    if (Array.isArray(data)) {
      rawProducts = data;
    }

    else if (
      data &&
      Array.isArray(data.products)
    ) {
      rawProducts = data.products;
    }

    else if (
      data &&
      Array.isArray(data.data)
    ) {
      rawProducts = data.data;
    }


    const products =
      rawProducts
        .map(normalizeProduct)
        .filter(product => product.active)
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder
        );


    writeCache(products);

    return products;
  }


  async function getProducts(
    forceRefresh = false
  ) {
    const cached =
      readCache();


    const cacheIsFresh =
      cached &&
      Array.isArray(cached.products) &&
      Date.now() -
        Number(cached.timestamp || 0) <
        CACHE_TIME;


    if (
      cached &&
      !forceRefresh &&
      cacheIsFresh
    ) {
      return cached.products;
    }


    if (!productPromise) {
      productPromise =
        fetchProducts()
          .finally(() => {
            productPromise = null;
          });
    }


    return productPromise;
  }


  async function refreshInBackground() {
    const cached =
      readCache();


    if (
      cached &&
      Date.now() -
        Number(cached.timestamp || 0) <
        BACKGROUND_REFRESH_TIME
    ) {
      return;
    }


    try {
      const products =
        await fetchProducts();

      productsStore =
        products;

      refreshVisibleProducts();
    } catch (error) {
      // Background refresh is intentionally silent.
    }
  }


  /* =========================================================
     10 — WHATSAPP
     ========================================================= */

  function whatsappUrl(product) {
    const message =
      [
        "السلام عليكم،",
        "",
        "عايز استفسر عن المنتج ده من موقع أبو طارق:",
        "",
        `المنتج: ${product.name}`,
        `القسم: ${product.category}`,
        "",
        "ممكن أعرف التفاصيل والتوفر؟"
      ].join("\n");


    return (
      `https://wa.me/${WHATSAPP_NUMBER}` +
      `?text=${encodeURIComponent(message)}`
    );
  }


  /* =========================================================
     11 — PRODUCT CARD
     ========================================================= */

  function createProductCard(
    product,
    index = 0
  ) {
    const offerBadge =
      product.isOffer
        ? `<span class="offer-badge">🔥 عرض</span>`
        : "";


    const shortDescription =
      product.description.length > 115
        ? product.description.slice(0, 115) + "…"
        : product.description;


    return `
      <article
        class="product"
        data-id="${escapeAttribute(product.id)}"
      >

        <div class="product-image-wrap">

          ${
            getImageSource(product)
              ? `
                <img
                  class="product-image"
                  src="${escapeAttribute(getImageSource(product))}"
                  alt="${escapeAttribute(product.name)}"
                  width="700"
                  height="700"
                  loading="${index < 4 ? "eager" : "lazy"}"
                  decoding="async"
                  onerror="this.style.display='none';"
                >
              `
              : `
                <div
                  class="product-image"
                  style="
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    height:100%;
                    font-size:46px;
                    background:
                      radial-gradient(
                        circle,
                        rgba(214,179,106,.12),
                        transparent 65%
                      ),
                      #07111d;
                  "
                >
                  ${categoryIcon(product.category)}
                </div>
              `
          }

          ${offerBadge}

        </div>


        <div class="product-body">

          <div class="product-category">
            ${escapeHtml(product.category)}
          </div>


          <h3 class="product-name">
            ${escapeHtml(product.name)}
          </h3>


          ${
            shortDescription
              ? `
                <p class="product-description">
                  ${escapeHtml(shortDescription)}
                </p>
              `
              : ""
          }


          ${renderPrice(product)}


          <div class="product-actions">

            <button
              type="button"
              class="product-details-main"
              data-action="details"
              data-product-id="${escapeAttribute(product.id)}"
            >
              ✦ التفاصيل
            </button>


            <button
              type="button"
              class="product-add-cart"
              data-action="add-cart"
              data-product-id="${escapeAttribute(product.id)}"
            >
              🛒 أضف للسلة
            </button>


            <a
              class="product-whatsapp"
              href="${escapeAttribute(whatsappUrl(product))}"
              target="_blank"
              rel="noopener"
            >
              💬 استفسار واتساب
            </a>

          </div>

        </div>

      </article>
    `;
  }


  /* =========================================================
     12 — HOMEPAGE
     ========================================================= */

  function initHomepage(products) {
    productsStore =
      Array.isArray(products)
        ? products
        : [];


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


    const offersSection =
      document.getElementById(
        "offers"
      );


    const offersGrid =
      document.getElementById(
        "offersGrid"
      );


    const homeProducts =
      productsStore.filter(
        product => product.showHome
      );


    const categorySource =
      homeProducts.length
        ? homeProducts
        : productsStore;


    const categories =
      [
        "الكل",
        ...new Set(
          categorySource
            .map(product => product.category)
            .filter(Boolean)
        )
      ];


    if (categoryGrid) {
      categoryGrid.innerHTML =
        categories
          .filter(category => category !== "الكل")
          .map(category => {

            const count =
              categorySource.filter(
                product =>
                  product.category === category
              ).length;


            return `
              <button
                type="button"
                class="cat"
                data-category="${escapeAttribute(category)}"
              >

                <span class="cat-icon">
                  ${categoryIcon(category)}
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


    if (filters) {
      filters.innerHTML =
        categories
          .map(
            category => `
              <button
                type="button"
                class="filter ${
                  category === activeCategory
                    ? "active"
                    : ""
                }"
                data-category="${escapeAttribute(category)}"
              >
                ${escapeHtml(category)}
              </button>
            `
          )
          .join("");
    }


    if (productsGrid) {
      productsGrid.innerHTML =
        renderProductList(
          homeProducts.length
            ? homeProducts
            : productsStore
        );
    }


    const offers =
      productsStore.filter(
        product =>
          product.isOffer &&
          product.showHome
      );


    if (
      offersSection &&
      offersGrid
    ) {

      if (offers.length) {
        offersSection.hidden = false;

        offersGrid.innerHTML =
          renderProductList(offers);
      }

      else {
        offersSection.hidden = true;

        offersGrid.innerHTML = "";
      }
    }


    initProductSearch();

    initCategoryEvents();

    initFilterEvents();

    initCart();

    refreshVisibleProducts();
  }


  function renderProductList(products) {
    if (!products.length) {
      return `
        <div class="empty-state">
          لا توجد منتجات مطابقة حاليًا.
        </div>
      `;
    }


    return products
      .map(
        (product, index) =>
          createProductCard(
            product,
            index
          )
      )
      .join("");
  }


  /* =========================================================
     13 — FILTERING
     ========================================================= */

  function getVisibleProducts() {
    let list =
      productsStore.filter(
        product => product.showHome
      );


    if (!list.length) {
      list = [...productsStore];
    }


    if (
      activeCategory &&
      activeCategory !== "الكل"
    ) {
      list =
        list.filter(
          product =>
            product.category ===
            activeCategory
        );
    }


    if (currentSearch) {
      const query =
        normalizeArabic(
          currentSearch
        );


      list =
        list.filter(
          product =>
            product.searchIndex.includes(
              query
            )
        );
    }


    return list;
  }


  function refreshVisibleProducts() {
    const grid =
      document.getElementById(
        "productsGrid"
      );


    if (!grid) {
      return;
    }


    grid.innerHTML =
      renderProductList(
        getVisibleProducts()
      );


    updateFilterButtons();

    updateSearchSuggestions();
  }


  function updateFilterButtons() {
    document
      .querySelectorAll(
        "#filters .filter"
      )
      .forEach(button => {

        const category =
          button.dataset.category || "";


        button.classList.toggle(
          "active",
          category === activeCategory
        );

      });
  }


  /* =========================================================
     14 — CATEGORY EVENTS
     ========================================================= */

  function initCategoryEvents() {
    const categoryGrid =
      document.getElementById(
        "categoryGrid"
      );


    if (!categoryGrid) {
      return;
    }


    categoryGrid.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".cat"
          );


        if (!button) {
          return;
        }


        const category =
          button.dataset.category;


        if (!category) {
          return;
        }


        window.location.href =
          `./sections.html?category=${encodeURIComponent(category)}`;
      }
    );
  }


  /* =========================================================
     15 — FILTER EVENTS
     ========================================================= */

  function initFilterEvents() {
    const filters =
      document.getElementById(
        "filters"
      );


    if (!filters) {
      return;
    }


    filters.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".filter"
          );


        if (!button) {
          return;
        }


        activeCategory =
          button.dataset.category ||
          "الكل";


        refreshVisibleProducts();

        document
          .getElementById(
            "products"
          )
          ?.scrollIntoView({
            behavior:"smooth",
            block:"start"
          });
      }
    );
  }


  /* =========================================================
     16 — SEARCH
     ========================================================= */

  function initProductSearch() {
    const toolbar =
      document.querySelector(
        ".products-toolbar"
      );


    if (!toolbar) {
      return;
    }


    let searchBox =
      document.getElementById(
        "productSearchBox"
      );


    if (!searchBox) {

      searchBox =
        document.createElement(
          "div"
        );


      searchBox.id =
        "productSearchBox";


      searchBox.className =
        "product-search";


      searchBox.innerHTML = `
        <input
          id="productSearchInput"
          type="search"
          autocomplete="off"
          placeholder="ابحث عن منتج..."
          aria-label="البحث عن منتج"
        >

        <button
          id="productSearchClear"
          type="button"
          aria-label="مسح البحث"
        >
          ×
        </button>

        <div
          id="productSearchSuggestions"
          hidden
        ></div>
      `;


      toolbar.appendChild(
        searchBox
      );
    }


    const input =
      document.getElementById(
        "productSearchInput"
      );


    const clear =
      document.getElementById(
        "productSearchClear"
      );


    if (input && !input.dataset.bound) {

      input.dataset.bound = "1";


      input.addEventListener(
        "input",
        () => {

          currentSearch =
            input.value.trim();


          refreshVisibleProducts();
        }
      );


      input.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Escape"
          ) {

            input.value = "";

            currentSearch = "";

            refreshVisibleProducts();

            input.blur();
          }
        }
      );
    }


    if (clear && !clear.dataset.bound) {

      clear.dataset.bound = "1";


      clear.addEventListener(
        "click",
        () => {

          if (input) {
            input.value = "";
            input.focus();
          }


          currentSearch = "";

          refreshVisibleProducts();
        }
      );
    }
  }


  function updateSearchSuggestions() {
    const box =
      document.getElementById(
        "productSearchSuggestions"
      );


    const input =
      document.getElementById(
        "productSearchInput"
      );


    if (!box || !input) {
      return;
    }


    const query =
      normalizeArabic(
        input.value
      );


    if (!query) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }


    const matches =
      productsStore
        .filter(
          product =>
            product.showHome &&
            product.searchIndex.includes(
              query
            )
        )
        .slice(0, 8);


    if (!matches.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }


    box.innerHTML =
      matches
        .map(
          product => `
            <button
              type="button"
              class="search-suggestion"
              data-product-id="${escapeAttribute(product.id)}"
            >

              ${
                getImageSource(product)
                  ? `
                    <img
                      src="${escapeAttribute(getImageSource(product))}"
                      alt=""
                      width="40"
                      height="40"
                      loading="lazy"
                    >
                  `
                  : `
                    <span
                      style="
                        width:40px;
                        height:40px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        border-radius:9px;
                        background:#102030;
                      "
                    >
                      ${categoryIcon(product.category)}
                    </span>
                  `
              }

              <span>
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


    box.hidden = false;
  }


  /* =========================================================
     17 — PRODUCT MODAL
     ========================================================= */

  function ensureModal() {
    if (
      document.getElementById(
        "aboTarekProductModal"
      )
    ) {
      return;
    }


    const modal =
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
        data-modal-close
      ></div>

      <div
        class="product-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="productModalTitle"
      >

        <button
          type="button"
          class="product-modal-close"
          data-modal-close
          aria-label="إغلاق"
        >
          ×
        </button>

        <img
          class="product-modal-image"
          id="productModalImage"
          src=""
          alt=""
        >

        <div class="product-modal-content">

          <div
            class="product-modal-category"
            id="productModalCategory"
          ></div>

          <h2
            class="product-modal-title"
            id="productModalTitle"
          ></h2>

          <div
            class="product-modal-description"
            id="productModalDescription"
          ></div>

          <div
            class="product-modal-price"
            id="productModalPrice"
          ></div>

          <div class="product-modal-actions">

            <button
              type="button"
              class="product-details-main"
              id="productModalCart"
            >
              🛒 أضف للسلة
            </button>

            <a
              class="btn-whatsapp"
              id="productModalWhatsapp"
              href="#"
              target="_blank"
              rel="noopener"
            >
              💬 واتساب
            </a>

          </div>

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
          event.target.matches(
            "[data-modal-close]"
          )
        ) {
          closeProductModal();
        }
      }
    );


    const cartButton =
      document.getElementById(
        "productModalCart"
      );


    if (cartButton) {

      cartButton.addEventListener(
        "click",
        () => {

          const id =
            modal.dataset.productId;


          const product =
            findProduct(id);


          if (product) {
            addToCart(product);
            closeProductModal();
          }
        }
      );
    }
  }


  function openProductModal(product) {
    ensureModal();


    const modal =
      document.getElementById(
        "aboTarekProductModal"
      );


    const image =
      document.getElementById(
        "productModalImage"
      );


    const category =
      document.getElementById(
        "productModalCategory"
      );


    const title =
      document.getElementById(
        "productModalTitle"
      );


    const description =
      document.getElementById(
        "productModalDescription"
      );


    const price =
      document.getElementById(
        "productModalPrice"
      );


    const whatsapp =
      document.getElementById(
        "productModalWhatsapp"
      );


    modal.dataset.productId =
      product.id;


    category.textContent =
      product.category;


    title.textContent =
      product.name;


    description.textContent =
      product.description ||
      "لا يوجد وصف إضافي لهذا المنتج حاليًا.";


    const current =
      getProductPrice(product);


    const old =
      getOldPrice(product);


    if (current !== null) {

      price.innerHTML = `
        <span class="current">
          ${escapeHtml(formatPrice(current))} ج.م
        </span>

        ${
          old !== null
            ? `
              <span class="old">
                ${escapeHtml(formatPrice(old))} ج.م
              </span>
            `
            : ""
        }
      `;
    }

    else {

      price.innerHTML = `
        <span
          class="current"
          style="font-size:13px;"
        >
          السعر عند الطلب
        </span>
      `;
    }


    const src =
      getImageSource(product);


    if (src) {

      image.src = src;

      image.alt =
        product.name;

      image.style.display =
        "block";
    }

    else {

      image.removeAttribute(
        "src"
      );

      image.alt =
        product.name;

      image.style.display =
        "none";
    }


    whatsapp.href =
      whatsappUrl(product);


    modal.classList.add(
      "open"
    );


    document.body.classList.add(
      "modal-open"
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


  /* =========================================================
     18 — FIND PRODUCT
     ========================================================= */

  function findProduct(id) {
    return productsStore.find(
      product =>
        String(product.id) ===
        String(id)
    );
  }


  /* =========================================================
     19 — CART STORAGE
     ========================================================= */

  function readCart() {
    try {

      const raw =
        localStorage.getItem(
          CART_KEY
        );


      if (!raw) {
        return [];
      }


      const parsed =
        JSON.parse(raw);


      if (!Array.isArray(parsed)) {
        return [];
      }


      return parsed
        .map(item => ({
          id: cleanText(item.id),
          name: cleanText(item.name),
          category: cleanText(item.category),
          image: cleanText(item.image),
          unitPrice:
            normalizePrice(
              item.unitPrice
            ),
          quantity:
            Math.max(
              1,
              Number(item.quantity) || 1
            )
        }))
        .filter(item => item.id);
    }

    catch (error) {
      return [];
    }
  }


  function saveCart() {
    try {
      localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      // Ignore storage errors.
    }
  }


  /* =========================================================
     20 — CART INIT
     ========================================================= */

  function initCart() {
    cart = readCart();

    ensureCartUI();

    syncCartWithProducts();

    renderCart();

    updateCartCount();
  }


  function syncCartWithProducts() {
    if (!Array.isArray(productsStore)) {
      return;
    }


    cart =
      cart.map(item => {

        const product =
          findProduct(item.id);


        if (!product) {
          return item;
        }


        return {
          ...item,

          name:
            product.name,

          category:
            product.category,

          image:
            product.image,

          unitPrice:
            getProductPrice(product)
        };
      });


    saveCart();
  }


  /* =========================================================
     21 — CART UI
     ========================================================= */

  function ensureCartUI() {

    if (
      document.getElementById(
        "aboTarekCartOverlay"
      )
    ) {
      return;
    }


    const floating =
      document.createElement(
        "button"
      );


    floating.id =
      "aboTarekCartButton";


    floating.type =
      "button";


    floating.className =
      "cart-floating-btn";


    floating.setAttribute(
      "aria-label",
      "فتح سلة الطلب"
    );


    floating.innerHTML = `
      🛒
      <span
        class="cart-count"
        id="cartCount"
      >
        0
      </span>
    `;


    document.body.appendChild(
      floating
    );


    const overlay =
      document.createElement(
        "div"
      );


    overlay.id =
      "aboTarekCartOverlay";


    overlay.className =
      "cart-overlay";


    document.body.appendChild(
      overlay
    );


    const drawer =
      document.createElement(
        "aside"
      );


    drawer.id =
      "aboTarekCartDrawer";


    drawer.className =
      "cart-drawer";


    drawer.setAttribute(
      "aria-label",
      "سلة الطلب"
    );


    drawer.innerHTML = `
      <div class="cart-header">

        <div class="cart-header-title">

          <strong>
            سلة الطلب
          </strong>

          <span>
            منتجاتك المختارة
          </span>

        </div>

        <button
          type="button"
          class="cart-close"
          id="cartClose"
          aria-label="إغلاق السلة"
        >
          ×
        </button>

      </div>


      <div
        class="cart-items"
        id="cartItems"
      ></div>


      <div class="cart-summary">

        <div class="cart-summary-row">
          <span>
            إجمالي الطلب
          </span>

          <strong
            id="cartTotal"
          >
            0 ج.م
          </strong>
        </div>


        <p
          class="cart-summary-note"
          id="cartSummaryNote"
        ></p>


        <div class="cart-summary-actions">

          <button
            type="button"
            class="cart-clear-btn"
            id="cartClear"
            title="إفراغ السلة"
            aria-label="إفراغ السلة"
          >
            🗑️
          </button>

          <button
            type="button"
            class="cart-whatsapp-btn"
            id="cartWhatsapp"
          >
            💬 إرسال الطلب على واتساب
          </button>

        </div>

      </div>
    `;


    document.body.appendChild(
      drawer
    );


    floating.addEventListener(
      "click",
      openCart
    );


    overlay.addEventListener(
      "click",
      closeCart
    );


    document
      .getElementById(
        "cartClose"
      )
      ?.addEventListener(
        "click",
        closeCart
      );


    document
      .getElementById(
        "cartClear"
      )
      ?.addEventListener(
        "click",
        clearCart
      );


    document
      .getElementById(
        "cartWhatsapp"
      )
      ?.addEventListener(
        "click",
        sendCartToWhatsApp
      );


    const cartItems =
      document.getElementById(
        "cartItems"
      );


    if (cartItems) {

      cartItems.addEventListener(
        "click",
        handleCartItemClick
      );
    }
  }


  function openCart() {

    const overlay =
      document.getElementById(
        "aboTarekCartOverlay"
      );


    const drawer =
      document.getElementById(
        "aboTarekCartDrawer"
      );


    if (!overlay || !drawer) {
      return;
    }


    overlay.classList.add(
      "open"
    );


    drawer.classList.add(
      "open"
    );


    document.body.classList.add(
      "cart-open"
    );
  }


  function closeCart() {

    const overlay =
      document.getElementById(
        "aboTarekCartOverlay"
      );


    const drawer =
      document.getElementById(
        "aboTarekCartDrawer"
      );


    overlay?.classList.remove(
      "open"
    );


    drawer?.classList.remove(
      "open"
    );


    document.body.classList.remove(
      "cart-open"
    );
  }


  /* =========================================================
     22 — ADD TO CART
     ========================================================= */

  function addToCart(product) {

    if (!product) {
      return;
    }


    const existing =
      cart.find(
        item =>
          String(item.id) ===
          String(product.id)
      );


    if (existing) {

      existing.quantity += 1;

    }

    else {

      cart.push({
        id:
          product.id,

        name:
          product.name,

        category:
          product.category,

        image:
          product.image,

        unitPrice:
          getProductPrice(product),

        quantity:1
      });
    }


    saveCart();

    renderCart();

    updateCartCount();

    showToast(
      `تمت إضافة «${product.name}» للسلة 🛒`
    );
  }


  window.addToCart =
    addToCart;


  /* =========================================================
     23 — CART QUANTITY
     ========================================================= */

  function changeCartQuantity(
    id,
    amount
  ) {

    const item =
      cart.find(
        cartItem =>
          String(cartItem.id) ===
          String(id)
      );


    if (!item) {
      return;
    }


    item.quantity += amount;


    if (item.quantity <= 0) {

      cart =
        cart.filter(
          cartItem =>
            String(cartItem.id) !==
            String(id)
        );
    }


    saveCart();

    renderCart();

    updateCartCount();
  }


  function removeCartItem(id) {

    cart =
      cart.filter(
        item =>
          String(item.id) !==
          String(id)
      );


    saveCart();

    renderCart();

    updateCartCount();

    showToast(
      "تم حذف المنتج من السلة"
    );
  }


  function clearCart() {

    if (!cart.length) {
      return;
    }


    cart = [];

    saveCart();

    renderCart();

    updateCartCount();

    showToast(
      "تم إفراغ السلة"
    );
  }


  function handleCartItemClick(
    event
  ) {

    const plus =
      event.target.closest(
        "[data-cart-plus]"
      );


    const minus =
      event.target.closest(
        "[data-cart-minus]"
      );


    const remove =
      event.target.closest(
        "[data-cart-remove]"
      );


    if (plus) {

      changeCartQuantity(
        plus.dataset.cartPlus,
        1
      );

      return;
    }


    if (minus) {

      changeCartQuantity(
        minus.dataset.cartMinus,
        -1
      );

      return;
    }


    if (remove) {

      removeCartItem(
        remove.dataset.cartRemove
      );
    }
  }


  /* =========================================================
     24 — RENDER CART
     ========================================================= */

  function renderCart() {

    const itemsContainer =
      document.getElementById(
        "cartItems"
      );


    const totalElement =
      document.getElementById(
        "cartTotal"
      );


    const noteElement =
      document.getElementById(
        "cartSummaryNote"
      );


    if (
      !itemsContainer ||
      !totalElement
    ) {
      return;
    }


    if (!cart.length) {

      itemsContainer.innerHTML = `
        <div class="cart-empty">

          <div class="icon">
            🛒
          </div>

          <strong>
            السلة فاضية
          </strong>

          <span>
            اختار المنتجات اللي عايز تطلبها
          </span>

        </div>
      `;


      totalElement.textContent =
        "0 ج.م";


      if (noteElement) {
        noteElement.textContent =
          "";
      }


      return;
    }


    let total = 0;

    let hasUnknownPrice = false;


    itemsContainer.innerHTML =
      cart
        .map(item => {

          const product =
            findProduct(item.id);


          const currentPrice =
            product
              ? getProductPrice(product)
              : item.unitPrice;


          item.unitPrice =
            currentPrice;


          const lineTotal =
            currentPrice !== null
              ? currentPrice *
                item.quantity
              : null;


          if (lineTotal !== null) {
            total += lineTotal;
          }

          else {
            hasUnknownPrice = true;
          }


          const image =
            product
              ? getImageSource(product)
              : "";


          return `
            <div
              class="cart-item"
              data-cart-item="${escapeAttribute(item.id)}"
            >

              ${
                image
                  ? `
                    <img
                      class="cart-item-image"
                      src="${escapeAttribute(image)}"
                      alt="${escapeAttribute(item.name)}"
                      width="62"
                      height="62"
                      loading="lazy"
                    >
                  `
                  : `
                    <div
                      class="cart-item-image"
                      style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:25px;
                      "
                    >
                      ${categoryIcon(item.category)}
                    </div>
                  `
              }


              <div class="cart-item-main">

                <p class="cart-item-name">
                  ${escapeHtml(item.name)}
                </p>

                <div class="cart-item-category">
                  ${escapeHtml(item.category)}
                </div>

                <div class="cart-item-price">
                  ${
                    currentPrice !== null
                      ? `
                        ${escapeHtml(formatPrice(currentPrice))}
                        ج.م × ${item.quantity}
                      `
                      : `
                        السعر عند الطلب
                      `
                  }
                </div>


                <div class="cart-item-controls">

                  <button
                    type="button"
                    class="cart-qty-btn"
                    data-cart-plus="${escapeAttribute(item.id)}"
                    aria-label="زيادة الكمية"
                  >
                    +
                  </button>

                  <span class="cart-qty">
                    ${item.quantity}
                  </span>

                  <button
                    type="button"
                    class="cart-qty-btn"
                    data-cart-minus="${escapeAttribute(item.id)}"
                    aria-label="تقليل الكمية"
                  >
                    −
                  </button>

                </div>

              </div>


              <button
                type="button"
                class="cart-item-remove"
                data-cart-remove="${escapeAttribute(item.id)}"
                aria-label="حذف المنتج"
              >
                🗑️
              </button>

            </div>
          `;
        })
        .join("");


    totalElement.textContent =
      hasUnknownPrice
        ? `${formatPrice(total)} ج.م + منتجات بسعر عند الطلب`
        : `${formatPrice(total)} ج.م`;


    if (noteElement) {

      noteElement.textContent =
        hasUnknownPrice
          ? "بعض المنتجات ليس لها سعر مسجل حاليًا، وسيتم تحديد سعرها عند تأكيد الطلب."
          : "راجع الكميات ثم أرسل الطلب بالكامل على واتساب.";
    }


    saveCart();
  }


  function updateCartCount() {

    const countElement =
      document.getElementById(
        "cartCount"
      );


    if (!countElement) {
      return;
    }


    const count =
      cart.reduce(
        (total, item) =>
          total +
          Math.max(
            1,
            Number(item.quantity) || 1
          ),
        0
      );


    countElement.textContent =
      count > 99
        ? "99+"
        : String(count);


    countElement.style.display =
      count
        ? "flex"
        : "none";
  }


  /* =========================================================
     25 — SEND CART TO WHATSAPP
     ========================================================= */

  function sendCartToWhatsApp() {

    if (!cart.length) {

      showToast(
        "السلة فاضية، اختار منتجات الأول"
      );

      return;
    }


    let total = 0;

    let hasUnknownPrice = false;


    const lines = [];


    cart.forEach(
      (item, index) => {

        const product =
          findProduct(item.id);


        const currentPrice =
          product
            ? getProductPrice(product)
            : item.unitPrice;


        const quantity =
          Math.max(
            1,
            Number(item.quantity) || 1
          );


        let line =
          `${index + 1}) ${item.name}`;


        line +=
          ` — الكمية: ${quantity}`;


        if (
          currentPrice !== null
        ) {

          const subtotal =
            currentPrice *
            quantity;


          total += subtotal;


          line +=
            ` — السعر: ${formatPrice(currentPrice)} ج.م`;


          line +=
            ` — الإجمالي: ${formatPrice(subtotal)} ج.م`;
        }

        else {

          hasUnknownPrice = true;

          line +=
            " — السعر: عند الطلب";
        }


        lines.push(line);
      }
    );


    const message =
      [
        "السلام عليكم 👋",
        "",
        "عايز أعمل الطلب ده من موقع أبو طارق للأدوات المنزلية:",
        "",
        ...lines,
        "",
        "--------------------",
        hasUnknownPrice
          ? `الإجمالي المعروف: ${formatPrice(total)} ج.م`
          : `إجمالي الطلب: ${formatPrice(total)} ج.م`,
        "",
        hasUnknownPrice
          ? "ملحوظة: يوجد منتج أو أكثر بسعر عند الطلب."
          : "",
        "ممكن تأكيد الطلب والتفاصيل؟"
      ]
        .filter(Boolean)
        .join("\n");


    const url =
      `https://wa.me/${WHATSAPP_NUMBER}` +
      `?text=${encodeURIComponent(message)}`;


    window.open(
      url,
      "_blank",
      "noopener"
    );
  }


  /* =========================================================
     26 — TOAST
     ========================================================= */

  function showToast(message) {

    let toast =
      document.getElementById(
        "aboTarekToast"
      );


    if (!toast) {

      toast =
        document.createElement(
          "div"
        );


      toast.id =
        "aboTarekToast";


      toast.className =
        "abo-toast";


      document.body.appendChild(
        toast
      );
    }


    toast.textContent =
      message;


    toast.classList.add(
      "show"
    );


    clearTimeout(
      toastTimer
    );


    toastTimer =
      setTimeout(
        () => {
          toast.classList.remove(
            "show"
          );
        },
        2600
      );
  }


  /* =========================================================
     27 — GLOBAL CLICK EVENTS
     ========================================================= */

  function initGlobalEvents() {

    document.addEventListener(
      "click",
      event => {

        const details =
          event.target.closest(
            "[data-action='details']"
          );


        const addCart =
          event.target.closest(
            "[data-action='add-cart']"
          );


        const suggestion =
          event.target.closest(
            ".search-suggestion"
          );


        if (addCart) {

          event.preventDefault();

          event.stopPropagation();


          const product =
            findProduct(
              addCart.dataset.productId
            );


          if (product) {
            addToCart(product);
          }


          return;
        }


        if (details) {

          event.preventDefault();

          event.stopPropagation();


          const product =
            findProduct(
              details.dataset.productId
            );


          if (product) {
            openProductModal(product);
          }


          return;
        }


        if (suggestion) {

          event.preventDefault();


          const product =
            findProduct(
              suggestion.dataset.productId
            );


          if (product) {

            const input =
              document.getElementById(
                "productSearchInput"
              );


            if (input) {
              input.value =
                product.name;
            }


            currentSearch =
              product.name;


            const box =
              document.getElementById(
                "productSearchSuggestions"
              );


            if (box) {
              box.hidden = true;
            }


            openProductModal(
              product
            );
          }


          return;
        }


        const productCard =
          event.target.closest(
            ".product"
          );


        if (
          productCard &&
          !event.target.closest(
            "a,button"
          )
        ) {

          const product =
            findProduct(
              productCard.dataset.id
            );


          if (product) {
            openProductModal(
              product
            );
          }
        }


        const searchBox =
          document.getElementById(
            "productSearchBox"
          );


        const suggestions =
          document.getElementById(
            "productSearchSuggestions"
          );


        if (
          searchBox &&
          suggestions &&
          !searchBox.contains(
            event.target
          )
        ) {
          suggestions.hidden =
            true;
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

          closeCart();
        }
      }
    );
  }


  /* =========================================================
     28 — MOBILE NAV
     ========================================================= */

  function initMobileNav() {

    const button =
      document.querySelector(
        ".mobile-menu-btn"
      );


    const nav =
      document.querySelector(
        ".main-nav"
      );


    if (!button || !nav) {
      return;
    }


    button.addEventListener(
      "click",
      () => {

        const open =
          nav.classList.toggle(
            "open"
          );


        document.body.classList.toggle(
          "menu-open",
          open
        );
      }
    );


    nav.addEventListener(
      "click",
      event => {

        if (
          event.target.closest("a")
        ) {

          nav.classList.remove(
            "open"
          );


          document.body.classList.remove(
            "menu-open"
          );
        }
      }
    );
  }


  /* =========================================================
     29 — ERROR
     ========================================================= */

  function showError(message) {

    const grids = [
      document.getElementById(
        "productsGrid"
      ),
      document.getElementById(
        "offersGrid"
      )
    ];


    grids.forEach(grid => {

      if (!grid) {
        return;
      }


      grid.innerHTML = `
        <div class="error-state">
          ${escapeHtml(message)}
        </div>
      `;
    });
  }


  /* =========================================================
     30 — START APP
     ========================================================= */

  async function startApp() {

    initMobileNav();

    initGlobalEvents();


    const productsGrid =
      document.getElementById(
        "productsGrid"
      );


    if (productsGrid) {

      productsGrid.innerHTML = `
        <div class="loading">
          جاري تحميل الأصناف...
        </div>
      `;
    }


    const cached =
      readCache();


    if (
      cached &&
      Array.isArray(cached.products) &&
      cached.products.length
    ) {

      initHomepage(
        cached.products
      );


      refreshInBackground();


      return;
    }


    try {

      const products =
        await getProducts(
          false
        );


      initHomepage(
        products
      );

    }

    catch (error) {

      console.error(
        "Abu Tarek products error:",
        error
      );


      showError(
        "تعذر تحميل المنتجات حاليًا. حاول تحديث الصفحة."
      );
    }
  }


  /* =========================================================
     31 — DOM READY
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startApp
    );

  }

  else {

    startApp();
  }


  /* =========================================================
     32 — PUBLIC ACCESS
     ========================================================= */

  window.aboTarekStore = {
    getProducts,
    addToCart,
    openCart,
    closeCart,
    openProductModal,
    closeProductModal
  };

})();
