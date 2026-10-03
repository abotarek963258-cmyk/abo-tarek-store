/* =========================================================
   ABO TAREK STORE
   PREMIUM LUXURY MASTER APP
   PRODUCTS + SEARCH + PRICES + DISCOUNTS + CART
   ========================================================= */


/* =========================================================
   01 — CONFIG
   ========================================================= */

const DATA_URL =
  "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

const WHATSAPP_NUMBER = "201551604163";

const CACHE_KEY = "abo_tarek_products_v11";
const SECTIONS_CACHE_KEY = "abo_tarek_sections_v11";
const CART_KEY = "abo_tarek_cart_v1";

const CACHE_TIME = 30 * 60 * 1000;
const BACKGROUND_REFRESH_TIME = 10 * 60 * 1000;

let products = [];
let sections = [];
let cart = [];

let selectedCategory = "all";
let currentSearch = "";

let productModal = null;
let cartDrawer = null;
let cartOverlay = null;


/* =========================================================
   02 — HELPERS
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let text = String(value)
    .replace(/٬/g, "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");

  const number = Number(text);

  return Number.isFinite(number) ? number : 0;
}

function formatPrice(value) {
  const number = safeNumber(value);

  if (!number) return "";

  return new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 2
  }).format(number) + " جنيه";
}

function normalizeArabic(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ");
}

function productIsActive(product) {
  const value = product.active;

  if (
    value === false ||
    value === 0 ||
    String(value).toLowerCase() === "false" ||
    String(value).toLowerCase() === "no" ||
    String(value).toLowerCase() === "inactive"
  ) {
    return false;
  }

  return true;
}

function productShowHome(product) {
  if (
    product.showHome === false ||
    product.showHome === 0 ||
    String(product.showHome).toLowerCase() === "false"
  ) {
    return false;
  }

  return true;
}

function productIsOffer(product) {
  if (
    product.isOffer === true ||
    product.isOffer === 1 ||
    String(product.isOffer).toLowerCase() === "true"
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   03 — PRODUCT NORMALIZATION
   ========================================================= */

function normalizeProduct(raw) {
  const product = raw || {};

  const name =
    product.name ??
    product.Name ??
    product.product ??
    product.title ??
    "";

  const category =
    product.category ??
    product.Category ??
    product.cat ??
    "";

  const image =
    product.image ??
    product.Image ??
    product.imageUrl ??
    product.photo ??
    "";

  const description =
    product.description ??
    product.Description ??
    product.desc ??
    "";

  const price =
    product.price ??
    product.Price ??
    product.productPrice ??
    product.sellingPrice ??
    "";

  const oldPrice =
    product.oldPrice ??
    product.OldPrice ??
    product.old_price ??
    product.originalPrice ??
    product.beforePrice ??
    "";

  const offerPrice =
    product.offerPrice ??
    product.offer_price ??
    product.discountPrice ??
    product.newPrice ??
    "";

  const discount =
    product.discount ??
    product.Discount ??
    product.discountPercent ??
    product.offer ??
    "";

  const id =
    product.id ??
    product.ID ??
    product.productId ??
    cryptoRandomId();

  const normalized = {
    ...product,

    id: String(id),
    name: String(name),
    category: String(category),
    image: String(image),
    description: String(description),

    price: price,
    oldPrice: oldPrice,
    offerPrice: offerPrice,
    discount: discount,

    active: product.active !== undefined
      ? product.active
      : true,

    showHome:
      product.showHome !== undefined
        ? product.showHome
        : true,

    isOffer:
      product.isOffer !== undefined
        ? product.isOffer
        : false
  };

  normalized.searchIndex = normalizeArabic(
    [
      normalized.name,
      normalized.category,
      normalized.description,
      normalized.id
    ].join(" ")
  );

  return normalized;
}

function cryptoRandomId() {
  return (
    "product_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}


/* =========================================================
   04 — PRICE LOGIC
   ========================================================= */

function getProductPricing(product) {

  const regularPrice = safeNumber(product.price);
  const oldPrice = safeNumber(product.oldPrice);
  const offerPrice = safeNumber(product.offerPrice);

  let finalPrice = regularPrice;
  let beforePrice = oldPrice;

  if (offerPrice > 0) {
    finalPrice = offerPrice;

    if (!beforePrice && regularPrice > offerPrice) {
      beforePrice = regularPrice;
    }
  }

  let discountPercent = safeNumber(product.discount);

  if (
    !discountPercent &&
    beforePrice > finalPrice &&
    finalPrice > 0
  ) {
    discountPercent = Math.round(
      ((beforePrice - finalPrice) / beforePrice) * 100
    );
  }

  const hasDiscount =
    finalPrice > 0 &&
    beforePrice > finalPrice;

  return {
    finalPrice,
    beforePrice,
    discountPercent,
    hasDiscount
  };
}


/* =========================================================
   05 — CACHE
   ========================================================= */

function saveCache(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data
      })
    );
  } catch (error) {
    console.warn("Cache save failed:", error);
  }
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || !parsed.timestamp) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Cache read failed:", error);
    return null;
  }
}


/* =========================================================
   06 — LOAD PRODUCTS
   ========================================================= */

async function fetchProductsFromServer() {

  const response = await fetch(
    DATA_URL + "?t=" + Date.now(),
    {
      method: "GET",
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error("Products request failed");
  }

  const data = await response.json();

  let list = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.products)) {
    list = data.products;
  } else if (Array.isArray(data.data)) {
    list = data.data;
  }

  return list
    .map(normalizeProduct)
    .filter(productIsActive);
}

async function loadProducts() {

  const cached = readCache(CACHE_KEY);

  if (cached && Array.isArray(cached.data)) {

    products = cached.data
      .map(normalizeProduct)
      .filter(productIsActive);

    renderEverything();

    if (
      Date.now() - cached.timestamp >
      BACKGROUND_REFRESH_TIME
    ) {
      refreshProductsInBackground();
    }

    return;
  }

  showProductsLoading();

  try {

    products = await fetchProductsFromServer();

    saveCache(CACHE_KEY, products);

    renderEverything();

  } catch (error) {

    console.error("Products loading error:", error);

    products = [];

    showProductsError();
  }
}

async function refreshProductsInBackground() {

  try {

    const freshProducts =
      await fetchProductsFromServer();

    if (!Array.isArray(freshProducts)) {
      return;
    }

    products = freshProducts;

    saveCache(CACHE_KEY, products);

    renderEverything();

  } catch (error) {

    console.warn(
      "Background product refresh failed:",
      error
    );
  }
}


/* =========================================================
   07 — LOAD SECTIONS
   ========================================================= */

async function fetchSectionsFromServer() {

  const response = await fetch(
    DATA_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "listSections"
      })
    }
  );

  if (!response.ok) {
    throw new Error("Sections request failed");
  }

  const data = await response.json();

  let list = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.sections)) {
    list = data.sections;
  } else if (Array.isArray(data.data)) {
    list = data.data;
  }

  return list.filter(section => {

    if (
      section.active === false ||
      section.active === 0 ||
      String(section.active).toLowerCase() === "false"
    ) {
      return false;
    }

    return true;
  });
}

async function loadSections() {

  const cached = readCache(SECTIONS_CACHE_KEY);

  if (cached && Array.isArray(cached.data)) {

    sections = cached.data;

    renderCategories();

    if (
      Date.now() - cached.timestamp >
      BACKGROUND_REFRESH_TIME
    ) {
      refreshSectionsInBackground();
    }

    return;
  }

  try {

    sections = await fetchSectionsFromServer();

    saveCache(SECTIONS_CACHE_KEY, sections);

    renderCategories();

  } catch (error) {

    console.warn(
      "Sections loading failed:",
      error
    );

    buildCategoriesFromProducts();
  }
}

async function refreshSectionsInBackground() {

  try {

    const fresh =
      await fetchSectionsFromServer();

    sections = fresh;

    saveCache(
      SECTIONS_CACHE_KEY,
      sections
    );

    renderCategories();

  } catch (error) {

    console.warn(
      "Background sections refresh failed:",
      error
    );
  }
}


/* =========================================================
   08 — CATEGORY FALLBACK
   ========================================================= */

function buildCategoriesFromProducts() {

  const map = new Map();

  products.forEach(product => {

    const name =
      String(product.category || "").trim();

    if (!name) return;

    if (!map.has(name)) {
      map.set(name, {
        id: name,
        name,
        sortOrder: map.size + 1,
        active: true
      });
    }
  });

  sections = Array.from(map.values());

  renderCategories();
}


/* =========================================================
   09 — CATEGORY RENDER
   ========================================================= */

function renderCategories() {

  const grid =
    $("#categoryGrid") ||
    $("#categoriesGrid") ||
    $(".category-grid") ||
    $(".categories-grid");

  if (!grid) return;

  if (!sections.length) {
    buildCategoriesFromProducts();

    if (!sections.length) {
      grid.innerHTML = "";
      return;
    }
  }

  const sorted = [...sections].sort(
    (a, b) =>
      safeNumber(a.sortOrder) -
      safeNumber(b.sortOrder)
  );

  grid.innerHTML = sorted.map((section, index) => {

    const categoryName =
      section.name ??
      section.title ??
      "";

    const count = products.filter(
      product =>
        normalizeArabic(product.category) ===
        normalizeArabic(categoryName)
    ).length;

    return `
      <button
        type="button"
        class="category-card"
        data-category="${escapeHTML(categoryName)}"
      >

        <span class="category-icon">
          ${getCategoryIcon(index)}
        </span>

        <h3>${escapeHTML(categoryName)}</h3>

        <p>
          ${count} ${count === 1 ? "صنف" : "أصناف"}
        </p>

      </button>
    `;
  }).join("");

  $all(".category-card").forEach(card => {

    card.addEventListener(
      "click",
      () => {

        const category =
          card.dataset.category || "all";

        selectedCategory = category;

        renderProducts();

        document
          .querySelector("#productsSection")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );
  });
}

function getCategoryIcon(index) {

  const icons = [
    "⌂",
    "✦",
    "◇",
    "♢",
    "✧",
    "◈",
    "◆",
    "▣"
  ];

  return icons[index % icons.length];
}


/* =========================================================
   10 — PRODUCT FILTER
   ========================================================= */

function getVisibleProducts() {

  let list = products.filter(productIsActive);

  if (selectedCategory !== "all") {

    const normalizedCategory =
      normalizeArabic(selectedCategory);

    list = list.filter(product =>
      normalizeArabic(product.category) ===
      normalizedCategory
    );
  }

  if (currentSearch) {

    const query =
      normalizeArabic(currentSearch);

    list = list.filter(product =>
      product.searchIndex.includes(query)
    );
  }

  return list;
}


/* =========================================================
   11 — PRODUCT CARD
   ========================================================= */

function renderProductCard(product) {

  const pricing =
    getProductPricing(product);

  const image =
    product.image ||
    "assets/storefront.jpg";

  const hasImage =
    String(image).trim() !== "";

  let priceHTML = "";

  if (pricing.finalPrice > 0) {

    if (pricing.hasDiscount) {

      priceHTML = `
        <div class="product-price">

          <strong class="new-price">
            ${formatPrice(pricing.finalPrice)}
          </strong>

          <del class="old-price">
            ${formatPrice(pricing.beforePrice)}
          </del>

        </div>
      `;

    } else {

      priceHTML = `
        <div class="product-price">

          <strong>
            ${formatPrice(pricing.finalPrice)}
          </strong>

        </div>
      `;
    }

  } else {

    priceHTML = `
      <div class="product-price">
        <strong style="font-size:13px;">
          اتصل لمعرفة السعر
        </strong>
      </div>
    `;
  }

  const discountHTML =
    pricing.hasDiscount
      ? `
        <span class="discount-badge">
          خصم ${pricing.discountPercent}%
        </span>
      `
      : "";

  const offerHTML =
    productIsOffer(product) && !pricing.hasDiscount
      ? `
        <span class="product-badge">
          عرض
        </span>
      `
      : "";

  return `
    <article
      class="product-card"
      data-product-id="${escapeHTML(product.id)}"
    >

      <div class="product-image">

        ${discountHTML}
        ${offerHTML}

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='assets/storefront.jpg';"
        >

      </div>

      <div class="product-content">

        <div class="product-category">
          ${escapeHTML(product.category)}
        </div>

        <h3 class="product-title">
          ${escapeHTML(product.name)}
        </h3>

        <p class="product-description">
          ${escapeHTML(product.description || "منتج من أبو طارق للأدوات المنزلية")}
        </p>

        <div class="product-footer">

          ${priceHTML}

          <div class="product-actions">

            <button
              type="button"
              class="product-btn product-details-btn"
              data-action="details"
              data-id="${escapeHTML(product.id)}"
              title="التفاصيل"
              aria-label="عرض التفاصيل"
            >
              ⓘ
            </button>

            <button
              type="button"
              class="product-btn product-cart-btn"
              data-action="cart"
              data-id="${escapeHTML(product.id)}"
              title="أضف للسلة"
              aria-label="أضف للسلة"
            >
              🛒
            </button>

          </div>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   12 — PRODUCT RENDER
   ========================================================= */

function renderProducts() {

  const grid =
    $("#productsGrid") ||
    $(".products-grid");

  if (!grid) return;

  const visible =
    getVisibleProducts();

  if (!visible.length) {

    grid.innerHTML = `
      <div
        class="empty-state"
        style="grid-column:1/-1;"
      >
        لا توجد منتجات مطابقة للبحث.
      </div>
    `;

    return;
  }

  grid.innerHTML =
    visible
      .map(renderProductCard)
      .join("");
}


/* =========================================================
   13 — EVERYTHING
   ========================================================= */

function renderEverything() {

  if (!sections.length) {
    buildCategoriesFromProducts();
  }

  renderCategories();
  renderProducts();
  updateCartUI();
}


/* =========================================================
   14 — SEARCH
   ========================================================= */

function setupSearch() {

  const input =
    $("#productSearchInput") ||
    $("#productSearch") ||
    $("input[type='search']");

  if (!input) return;

  input.addEventListener(
    "input",
    function () {

      currentSearch =
        this.value.trim();

      selectedCategory = "all";

      renderProducts();

      renderSearchSuggestions(
        currentSearch
      );
    }
  );

  input.addEventListener(
    "focus",
    function () {

      if (this.value.trim()) {
        renderSearchSuggestions(
          this.value.trim()
        );
      }
    }
  );

  document.addEventListener(
    "click",
    event => {

      const suggestions =
        document.querySelector(
          "#productSearchSuggestions"
        );

      if (
        suggestions &&
        !event.target.closest(
          ".search-wrap"
        )
      ) {
        suggestions.innerHTML = "";
      }
    }
  );
}


/* =========================================================
   15 — SEARCH SUGGESTIONS
   ========================================================= */

function renderSearchSuggestions(query) {

  const box =
    $("#productSearchSuggestions");

  if (!box) return;

  const normalized =
    normalizeArabic(query);

  if (!normalized) {
    box.innerHTML = "";
    return;
  }

  const matches =
    products
      .filter(productIsActive)
      .filter(product =>
        product.searchIndex.includes(
          normalized
        )
      )
      .slice(0, 8);

  if (!matches.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML =
    matches.map(product => {

      const pricing =
        getProductPricing(product);

      const price =
        pricing.finalPrice > 0
          ? formatPrice(pricing.finalPrice)
          : "";

      return `
        <button
          type="button"
          class="search-suggestion"
          data-id="${escapeHTML(product.id)}"
          style="
            width:100%;
            display:flex;
            align-items:center;
            gap:12px;
            padding:11px 13px;
            border:0;
            border-bottom:1px solid rgba(255,255,255,.06);
            background:transparent;
            color:#fff;
            text-align:right;
          "
        >

          <img
            src="${escapeHTML(
              product.image ||
              "assets/storefront.jpg"
            )}"
            alt=""
            style="
              width:42px;
              height:42px;
              object-fit:cover;
              border-radius:9px;
            "
          >

          <span style="flex:1;">
            <strong style="display:block;font-size:13px;">
              ${escapeHTML(product.name)}
            </strong>

            <small style="color:#d6ad55;">
              ${escapeHTML(price)}
            </small>
          </span>

        </button>
      `;
    }).join("");

  $all(".search-suggestion")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          const product =
            products.find(
              item =>
                String(item.id) ===
                String(id)
            );

          if (!product) return;

          openProductModal(product);

          box.innerHTML = "";
        }
      );
    });
}


/* =========================================================
   16 — PRODUCT MODAL
   ========================================================= */

function createProductModal() {

  if ($("#productModal")) {
    productModal =
      $("#productModal");

    return;
  }

  const modal =
    document.createElement("div");

  modal.id = "productModal";

  modal.innerHTML = `
    <div
      class="modal-overlay"
      data-close-modal
      style="
        position:fixed;
        inset:0;
        z-index:4000;
        background:rgba(0,0,0,.72);
        backdrop-filter:blur(7px);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
      "
    >

      <div
        class="modal-box"
        style="
          width:min(620px,100%);
          max-height:90vh;
          overflow-y:auto;
          background:#091625;
          border:1px solid rgba(214,173,85,.25);
          border-radius:24px;
          box-shadow:0 30px 90px rgba(0,0,0,.5);
          position:relative;
        "
      >

        <button
          type="button"
          data-close-modal
          style="
            position:absolute;
            top:15px;
            left:15px;
            z-index:5;
            width:40px;
            height:40px;
            border-radius:11px;
            border:1px solid rgba(255,255,255,.1);
            background:rgba(0,0,0,.45);
            color:#fff;
            font-size:20px;
          "
        >
          ×
        </button>

        <div id="productModalContent"></div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  productModal = modal;

  modal.style.display = "none";

  modal.addEventListener(
    "click",
    event => {

      if (
        event.target.matches(
          "[data-close-modal]"
        )
      ) {
        closeProductModal();
      }
    }
  );
}

function openProductModal(product) {

  createProductModal();

  const content =
    $("#productModalContent");

  if (!content) return;

  const pricing =
    getProductPricing(product);

  let priceHTML = "";

  if (pricing.finalPrice > 0) {

    priceHTML = pricing.hasDiscount
      ? `
        <div style="margin-top:15px;">

          <strong
            style="
              color:#f1d487;
              font-size:26px;
            "
          >
            ${formatPrice(pricing.finalPrice)}
          </strong>

          <del
            style="
              display:block;
              color:#7e8a99;
              font-size:13px;
            "
          >
            ${formatPrice(pricing.beforePrice)}
          </del>

        </div>
      `
      : `
        <div style="margin-top:15px;">
          <strong
            style="
              color:#f1d487;
              font-size:26px;
            "
          >
            ${formatPrice(pricing.finalPrice)}
          </strong>
        </div>
      `;

  } else {

    priceHTML = `
      <div style="margin-top:15px;">
        <strong
          style="
            color:#f1d487;
            font-size:17px;
          "
        >
          اتصل لمعرفة السعر
        </strong>
      </div>
    `;
  }

  content.innerHTML = `

    <img
      src="${escapeHTML(
        product.image ||
        "assets/storefront.jpg"
      )}"
      alt="${escapeHTML(product.name)}"
      style="
        width:100%;
        aspect-ratio:1/1;
        object-fit:cover;
        border-radius:23px 23px 0 0;
      "
      onerror="
        this.onerror=null;
        this.src='assets/storefront.jpg';
      "
    >

    <div style="padding:25px;">

      <div
        style="
          color:#d6ad55;
          font-size:12px;
          font-weight:800;
          margin-bottom:7px;
        "
      >
        ${escapeHTML(product.category)}
      </div>

      <h2
        style="
          color:#fff;
          font-size:25px;
          margin-bottom:10px;
        "
      >
        ${escapeHTML(product.name)}
      </h2>

      <p
        style="
          color:#aeb8c5;
          line-height:2;
          font-size:14px;
        "
      >
        ${escapeHTML(
          product.description ||
          "لا يوجد وصف إضافي لهذا المنتج."
        )}
      </p>

      ${priceHTML}

      <div
        style="
          display:flex;
          gap:10px;
          margin-top:25px;
        "
      >

        <button
          type="button"
          class="btn btn-primary"
          data-modal-cart="${escapeHTML(product.id)}"
          style="flex:1;"
        >
          🛒 أضف للسلة
        </button>

        <a
          class="btn btn-secondary"
          href="${buildWhatsAppLink(product)}"
          target="_blank"
          rel="noopener"
          style="flex:1;"
        >
          واتساب
        </a>

      </div>

    </div>
  `;

  const cartButton =
    content.querySelector(
      "[data-modal-cart]"
    );

  if (cartButton) {

    cartButton.addEventListener(
      "click",
      () => {

        addToCart(product.id);

        closeProductModal();

      }
    );
  }

  productModal.style.display = "block";

  document.body.style.overflow = "hidden";
}

function closeProductModal() {

  if (!productModal) return;

  productModal.style.display = "none";

  document.body.style.overflow = "";
}


/* =========================================================
   17 — CART LOAD / SAVE
   ========================================================= */

function loadCart() {

  try {

    const raw =
      localStorage.getItem(CART_KEY);

    if (!raw) {
      cart = [];
      return;
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      cart = [];
      return;
    }

    cart = parsed;

  } catch (error) {

    console.warn(
      "Cart loading failed:",
      error
    );

    cart = [];
  }
}

function saveCart() {

  try {

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    );

  } catch (error) {

    console.warn(
      "Cart save failed:",
      error
    );
  }
}


/* =========================================================
   18 — CART ACTIONS
   ========================================================= */

function addToCart(productId) {

  const product =
    products.find(
      item =>
        String(item.id) ===
        String(productId)
    );

  if (!product) return;

  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );

  if (existing) {

    existing.quantity =
      safeNumber(existing.quantity) + 1;

  } else {

    const pricing =
      getProductPricing(product);

    cart.push({
      id: String(product.id),
      name: product.name,
      image: product.image,
      category: product.category,
      price: pricing.finalPrice,
      quantity: 1
    });
  }

  saveCart();

  updateCartUI();

  showCartToast(
    "تمت إضافة المنتج للسلة 🛒"
  );
}

function decreaseCart(productId) {

  const item =
    cart.find(
      cartItem =>
        String(cartItem.id) ===
        String(productId)
    );

  if (!item) return;

  item.quantity =
    safeNumber(item.quantity) - 1;

  if (item.quantity <= 0) {

    cart =
      cart.filter(
        cartItem =>
          String(cartItem.id) !==
          String(productId)
      );
  }

  saveCart();

  updateCartUI();
}

function increaseCart(productId) {

  const item =
    cart.find(
      cartItem =>
        String(cartItem.id) ===
        String(productId)
    );

  if (!item) return;

  item.quantity =
    safeNumber(item.quantity) + 1;

  saveCart();

  updateCartUI();
}

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        String(item.id) !==
        String(productId)
    );

  saveCart();

  updateCartUI();
}

function clearCart() {

  cart = [];

  saveCart();

  updateCartUI();
}


/* =========================================================
   19 — CART TOTAL
   ========================================================= */

function getCartCount() {

  return cart.reduce(
    (total, item) =>
      total + safeNumber(item.quantity),
    0
  );
}

function getCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      safeNumber(item.price) *
      safeNumber(item.quantity),
    0
  );
}


/* =========================================================
   20 — CART UI
   ========================================================= */

function createCartUI() {

  if ($("#cartDrawer")) {

    cartDrawer =
      $("#cartDrawer");

    cartOverlay =
      $("#cartOverlay");

    return;
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "cartOverlay";

  overlay.className =
    "cart-overlay";

  const drawer =
    document.createElement("aside");

  drawer.id =
    "cartDrawer";

  drawer.className =
    "cart-drawer";

  drawer.innerHTML = `

    <div class="cart-header">

      <h3>
        سلة المشتريات
      </h3>

      <button
        type="button"
        class="cart-close"
        id="cartClose"
      >
        ×
      </button>

    </div>

    <div
      id="cartItems"
      class="cart-items"
    ></div>

    <div
      id="cartEmpty"
      class="empty-state"
      style="display:none;"
    >
      السلة فارغة حاليًا
    </div>

    <div
      id="cartSummary"
      style="display:none;"
    >

      <div class="cart-total">

        <span>
          الإجمالي
        </span>

        <strong id="cartTotal">
          0 جنيه
        </strong>

      </div>

      <button
        type="button"
        id="cartWhatsApp"
        class="btn btn-primary cart-checkout"
      >
        إتمام الطلب عبر واتساب
      </button>

      <button
        type="button"
        id="cartClear"
        style="
          width:100%;
          margin-top:10px;
          min-height:42px;
          border:1px solid rgba(255,255,255,.08);
          border-radius:12px;
          color:#9ba7b5;
          background:rgba(255,255,255,.025);
        "
      >
        تفريغ السلة
      </button>

    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  cartDrawer = drawer;
  cartOverlay = overlay;

  $("#cartClose")
    ?.addEventListener(
      "click",
      closeCart
    );

  overlay.addEventListener(
    "click",
    closeCart
  );

  $("#cartClear")
    ?.addEventListener(
      "click",
      clearCart
    );

  $("#cartWhatsApp")
    ?.addEventListener(
      "click",
      checkoutWhatsApp
    );
}

function openCart() {

  createCartUI();

  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");

  document.body.style.overflow = "hidden";

  updateCartUI();
}

function closeCart() {

  if (!cartDrawer) return;

  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");

  document.body.style.overflow = "";
}


/* =========================================================
   21 — CART RENDER
   ========================================================= */

function updateCartUI() {

  createCartUI();

  const count =
    getCartCount();

  $all(".cart-count")
    .forEach(element => {

      element.textContent =
        count;

      element.style.display =
        count > 0
          ? "grid"
          : "none";
    });

  const itemsBox =
    $("#cartItems");

  const emptyBox =
    $("#cartEmpty");

  const summary =
    $("#cartSummary");

  const totalBox =
    $("#cartTotal");

  if (!itemsBox) return;

  if (!cart.length) {

    itemsBox.innerHTML = "";

    if (emptyBox) {
      emptyBox.style.display =
        "block";
    }

    if (summary) {
      summary.style.display =
        "none";
    }

    return;
  }

  if (emptyBox) {
    emptyBox.style.display =
      "none";
  }

  if (summary) {
    summary.style.display =
      "block";
  }

  itemsBox.innerHTML =
    cart.map(item => `

      <div
        class="cart-item"
        data-cart-id="${escapeHTML(item.id)}"
      >

        <img
          src="${escapeHTML(
            item.image ||
            "assets/storefront.jpg"
          )}"
          alt="${escapeHTML(item.name)}"
          onerror="
            this.onerror=null;
            this.src='assets/storefront.jpg';
          "
        >

        <div>

          <h4>
            ${escapeHTML(item.name)}
          </h4>

          <div class="cart-item-price">
            ${formatPrice(item.price)}
          </div>

          <div class="cart-quantity">

            <button
              type="button"
              data-cart-action="decrease"
              data-id="${escapeHTML(item.id)}"
            >
              −
            </button>

            <span>
              ${safeNumber(item.quantity)}
            </span>

            <button
              type="button"
              data-cart-action="increase"
              data-id="${escapeHTML(item.id)}"
            >
              +
            </button>

          </div>

        </div>

        <button
          type="button"
          class="cart-remove"
          data-cart-action="remove"
          data-id="${escapeHTML(item.id)}"
          title="حذف"
        >
          ×
        </button>

      </div>

    `).join("");

  if (totalBox) {

    totalBox.textContent =
      formatPrice(
        getCartTotal()
      );
  }
}


/* =========================================================
   22 — CART EVENTS
   ========================================================= */

function setupCartEvents() {

  document.addEventListener(
    "click",
    event => {

      const cartButton =
        event.target.closest(
          "[data-action='cart']"
        );

      if (cartButton) {

        event.preventDefault();

        addToCart(
          cartButton.dataset.id
        );

        return;
      }

      const detailsButton =
        event.target.closest(
          "[data-action='details']"
        );

      if (detailsButton) {

        event.preventDefault();

        const product =
          products.find(
            item =>
              String(item.id) ===
              String(
                detailsButton.dataset.id
              )
          );

        if (product) {
          openProductModal(product);
        }

        return;
      }

      const cartAction =
        event.target.closest(
          "[data-cart-action]"
        );

      if (cartAction) {

        const action =
          cartAction.dataset.cartAction;

        const id =
          cartAction.dataset.id;

        if (action === "increase") {
          increaseCart(id);
        }

        if (action === "decrease") {
          decreaseCart(id);
        }

        if (action === "remove") {
          removeFromCart(id);
        }

        return;
      }

      const cartOpenButton =
        event.target.closest(
          "[data-cart-open]"
        );

      if (cartOpenButton) {

        event.preventDefault();

        openCart();
      }
    }
  );
}


/* =========================================================
   23 — CART BUTTON AUTO-DETECTION
   ========================================================= */

function setupCartButton() {

  const possibleButtons = [
    "#cartButton",
    "#cartBtn",
    ".cart-button",
    ".cart-btn",
    "[data-open-cart]"
  ];

  possibleButtons.forEach(selector => {

    $all(selector)
      .forEach(button => {

        button.dataset.cartOpen = "true";

      });
  });

  const existingButtons =
    $all(
      "[data-cart-open]"
    );

  existingButtons.forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openCart();

      }
    );
  });
}


/* =========================================================
   24 — CART TOAST
   ========================================================= */

function showCartToast(message) {

  let toast =
    $("#aboCartToast");

  if (!toast) {

    toast =
      document.createElement("div");

    toast.id =
      "aboCartToast";

    toast.style.cssText = `
      position:fixed;
      right:20px;
      bottom:20px;
      z-index:5000;
      padding:13px 18px;
      border:1px solid rgba(214,173,85,.3);
      border-radius:13px;
      color:#fff;
      background:#0c1b2d;
      box-shadow:0 15px 40px rgba(0,0,0,.35);
      font-size:13px;
      font-weight:700;
      transform:translateY(20px);
      opacity:0;
      transition:.3s ease;
    `;

    document.body.appendChild(toast);
  }

  toast.textContent =
    message;

  requestAnimationFrame(() => {

    toast.style.opacity = "1";
    toast.style.transform =
      "translateY(0)";
  });

  clearTimeout(
    toast._timeout
  );

  toast._timeout =
    setTimeout(() => {

      toast.style.opacity = "0";
      toast.style.transform =
        "translateY(20px)";

    }, 2200);
}


/* =========================================================
   25 — WHATSAPP
   ========================================================= */

function buildWhatsAppLink(product) {

  const pricing =
    getProductPricing(product);

  let message =
    "السلام عليكم، أريد الاستفسار عن المنتج:%0A%0A";

  message +=
    "المنتج: " +
    encodeURIComponent(
      product.name
    );

  if (product.category) {

    message +=
      "%0Aالقسم: " +
      encodeURIComponent(
        product.category
      );
  }

  if (pricing.finalPrice > 0) {

    message +=
      "%0Aالسعر: " +
      encodeURIComponent(
        formatPrice(
          pricing.finalPrice
        )
      );
  }

  message +=
    "%0A%0Aمن موقع أبو طارق للأدوات المنزلية.";

  return (
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    message
  );
}

function checkoutWhatsApp() {

  if (!cart.length) return;

  let message =
    "السلام عليكم، أريد عمل طلب من أبو طارق للأدوات المنزلية.%0A%0A";

  cart.forEach((item, index) => {

    message +=
      (index + 1) +
      "- " +
      encodeURIComponent(
        item.name
      ) +
      "%0A";

    message +=
      "الكمية: " +
      safeNumber(item.quantity) +
      "%0A";

    message +=
      "السعر: " +
      encodeURIComponent(
        formatPrice(item.price)
      ) +
      "%0A";

    message += "%0A";
  });

  message +=
    "الإجمالي: " +
    encodeURIComponent(
      formatPrice(
        getCartTotal()
      )
    ) +
    "%0A%0A";

  message +=
    "أرغب في تأكيد الطلب ومعرفة التفاصيل.";

  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    message;

  window.open(
    url,
    "_blank",
    "noopener"
  );
}


/* =========================================================
   26 — LOADING / ERROR
   ========================================================= */

function showProductsLoading() {

  const grid =
    $("#productsGrid") ||
    $(".products-grid");

  if (!grid) return;

  grid.innerHTML = `
    <div
      class="loading"
      style="grid-column:1/-1;"
    >
      جاري تحميل المنتجات...
    </div>
  `;
}

function showProductsError() {

  const grid =
    $("#productsGrid") ||
    $(".products-grid");

  if (!grid) return;

  grid.innerHTML = `
    <div
      class="error-state"
      style="grid-column:1/-1;"
    >
      تعذر تحميل المنتجات حاليًا.
      <br>
      حاول تحديث الصفحة مرة أخرى.
    </div>
  `;
}


/* =========================================================
   27 — KEYBOARD
   ========================================================= */

function setupKeyboard() {

  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeProductModal();
        closeCart();

      }
    }
  );
}


/* =========================================================
   28 — INIT
   ========================================================= */

async function initApp() {

  loadCart();

  createCartUI();

  createProductModal();

  setupSearch();

  setupCartEvents();

  setupCartButton();

  setupKeyboard();

  await Promise.all([
    loadProducts(),
    loadSections()
  ]);

  updateCartUI();
}


/* =========================================================
   29 — START
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initApp
  );

} else {

  initApp();

}
