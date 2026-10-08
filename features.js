/* =========================================================
   ABO TAREK STORE
   FEATURES ENGINE
   FINAL STABLE EDITION
   Cart • Wishlist • Recently Viewed • Product Modal • WhatsApp
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     GLOBAL CONFIG
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};
  const CFG = window.ABO_TAREK_CONFIG || ROOT.CONFIG || {};

  const STORAGE = {
    cart:
      (CFG.CACHE_KEYS && CFG.CACHE_KEYS.cart) ||
      "abo_tarek_cart_v1",

    wishlist:
      (CFG.CACHE_KEYS && CFG.CACHE_KEYS.wishlist) ||
      "abo_tarek_wishlist_v1",

    recent:
      (CFG.CACHE_KEYS && CFG.CACHE_KEYS.recent) ||
      "abo_tarek_recent_v1"
  };

  const LIMITS = {
    maxQuantity:
      Number(
        CFG.CART &&
        CFG.CART.MAX_QUANTITY
      ) || 99,

    maxRecent:
      Number(
        CFG.RECENTLY_VIEWED &&
        CFG.RECENTLY_VIEWED.MAX_ITEMS
      ) || 8
  };

  /* =========================================================
     STATE
     ========================================================= */

  let cart = [];
  let wishlist = [];
  let recentProducts = [];

  let initialized = false;
  let modalProduct = null;
  let modalQuantity = 1;

  let cartDrawer = null;
  let modal = null;
  let toastContainer = null;

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

  function getProductId(product) {
    if (!product) return "";

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

    if (!id) return null;

    const normalized = {
      id,
      name: cleanText(product.name || product.title || "منتج"),
      category: cleanText(product.category),
      image: cleanText(product.image || product.imageUrl),
      images: Array.isArray(product.images)
        ? product.images.filter(Boolean)
        : [],
      description: cleanText(product.description),
      active:
        product.active === false ||
        String(product.active).toLowerCase() === "false"
          ? false
          : true,
      showHome:
        product.showHome === true ||
        String(product.showHome).toLowerCase() === "true",
      isOffer:
        product.isOffer === true ||
        String(product.isOffer).toLowerCase() === "true",
      sortOrder: safeNumber(product.sortOrder, 0),
      price: safeNumber(product.price, 0),
      oldPrice: safeNumber(product.oldPrice, 0),
      offerPrice: safeNumber(product.offerPrice, 0)
    };

    return normalized;
  }

  function getProductPrice(product) {
    if (!product) return 0;

    if (product.offerPrice > 0) {
      return product.offerPrice;
    }

    if (product.price > 0) {
      return product.price;
    }

    return 0;
  }

  function formatPrice(value) {
    const amount = safeNumber(value, 0);

    if (amount <= 0) {
      return "";
    }

    try {
      return new Intl.NumberFormat("ar-EG").format(amount) + " جنيه";
    } catch (error) {
      return amount.toLocaleString("en-US") + " جنيه";
    }
  }

  function resolveImage(product) {
    if (!product) {
      return "";
    }

    const image =
      product.image ||
      (Array.isArray(product.images) && product.images[0]) ||
      "";

    if (!image) {
      return "";
    }

    try {
      if (
        typeof CFG.resolveImageUrl === "function"
      ) {
        return CFG.resolveImageUrl(image);
      }

      if (
        typeof ROOT.resolveImageUrl === "function"
      ) {
        return ROOT.resolveImageUrl(image);
      }
    } catch (error) {}

    return image;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function dispatch(name, detail) {
    try {
      document.dispatchEvent(
        new CustomEvent(name, {
          detail: detail || {}
        })
      );
    } catch (error) {}
  }

  /* =========================================================
     STORAGE
     ========================================================= */

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return fallback;
      }

      const parsed = JSON.parse(raw);

      return parsed == null ? fallback : parsed;
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

  function loadState() {
    const savedCart = readStorage(
      STORAGE.cart,
      []
    );

    const savedWishlist = readStorage(
      STORAGE.wishlist,
      []
    );

    const savedRecent = readStorage(
      STORAGE.recent,
      []
    );

    cart = Array.isArray(savedCart)
      ? savedCart
          .map(item => {
            if (!item || typeof item !== "object") {
              return null;
            }

            const product = normalizeProduct(
              item.product || item
            );

            if (!product) {
              return null;
            }

            return {
              product,
              quantity: Math.max(
                1,
                Math.min(
                  LIMITS.maxQuantity,
                  safeNumber(item.quantity, 1)
                )
              )
            };
          })
          .filter(Boolean)
      : [];

    wishlist = Array.isArray(savedWishlist)
      ? savedWishlist
          .map(item => {
            if (typeof item === "string") {
              return item;
            }

            return getProductId(item);
          })
          .filter(Boolean)
      : [];

    wishlist = [...new Set(wishlist)];

    recentProducts = Array.isArray(savedRecent)
      ? savedRecent
          .map(normalizeProduct)
          .filter(Boolean)
      : [];

    saveCart();
    saveWishlist();
    saveRecent();
  }

  function saveCart() {
    writeStorage(STORAGE.cart, cart);
  }

  function saveWishlist() {
    writeStorage(
      STORAGE.wishlist,
      wishlist
    );
  }

  function saveRecent() {
    writeStorage(
      STORAGE.recent,
      recentProducts
    );
  }

  /* =========================================================
     CART
     ========================================================= */

  function getCart() {
    return cart.slice();
  }

  function getCartCount() {
    return cart.reduce(
      (total, item) =>
        total + safeNumber(item.quantity, 0),
      0
    );
  }

  function getCartTotal() {
    return cart.reduce(
      (total, item) =>
        total +
        getProductPrice(item.product) *
          safeNumber(item.quantity, 0),
      0
    );
  }

  function findCartItem(productId) {
    return cart.find(
      item =>
        getProductId(item.product) ===
        productId
    );
  }

  function addToCart(product, quantity = 1) {
    const normalized = normalizeProduct(product);

    if (!normalized) {
      showToast(
        "تعذر إضافة المنتج",
        "error"
      );

      return false;
    }

    const id = getProductId(normalized);

    let amount = Math.max(
      1,
      Math.min(
        LIMITS.maxQuantity,
        safeNumber(quantity, 1)
      )
    );

    const existing = findCartItem(id);

    if (existing) {
      existing.quantity = Math.min(
        LIMITS.maxQuantity,
        existing.quantity + amount
      );
    } else {
      cart.push({
        product: normalized,
        quantity: amount
      });
    }

    saveCart();
    updateCartUI();

    dispatch(
      "abo-tarek:cart-updated",
      {
        cart: getCart(),
        count: getCartCount(),
        total: getCartTotal(),
        product: normalized,
        quantity: amount
      }
    );

    showToast(
      existing
        ? "تم تحديث الكمية في السلة"
        : "تمت إضافة المنتج للسلة",
      "success"
    );

    return true;
  }

  function setCartQuantity(productId, quantity) {
    const item = findCartItem(
      cleanText(productId)
    );

    if (!item) {
      return false;
    }

    const amount = Math.max(
      0,
      Math.min(
        LIMITS.maxQuantity,
        safeNumber(quantity, 1)
      )
    );

    if (amount <= 0) {
      removeFromCart(productId);
      return true;
    }

    item.quantity = amount;

    saveCart();
    updateCartUI();

    dispatch(
      "abo-tarek:cart-updated",
      {
        cart: getCart(),
        count: getCartCount(),
        total: getCartTotal()
      }
    );

    return true;
  }

  function updateCartQuantity(productId, delta) {
    const item = findCartItem(
      cleanText(productId)
    );

    if (!item) {
      return false;
    }

    return setCartQuantity(
      productId,
      item.quantity + safeNumber(delta, 0)
    );
  }

  function removeFromCart(productId) {
    const id = cleanText(productId);

    const oldLength = cart.length;

    cart = cart.filter(
      item =>
        getProductId(item.product) !== id
    );

    if (cart.length === oldLength) {
      return false;
    }

    saveCart();
    updateCartUI();

    dispatch(
      "abo-tarek:cart-updated",
      {
        cart: getCart(),
        count: getCartCount(),
        total: getCartTotal()
      }
    );

    showToast(
      "تم حذف المنتج من السلة",
      "success"
    );

    return true;
  }

  function clearCart() {
    if (!cart.length) {
      return;
    }

    cart = [];

    saveCart();
    updateCartUI();

    dispatch(
      "abo-tarek:cart-updated",
      {
        cart: [],
        count: 0,
        total: 0
      }
    );

    showToast(
      "تم تفريغ السلة",
      "success"
    );
  }

  /* =========================================================
     WISHLIST
     ========================================================= */

  function getWishlist() {
    return wishlist.slice();
  }

  function isInWishlist(productOrId) {
    const id =
      typeof productOrId === "object"
        ? getProductId(productOrId)
        : cleanText(productOrId);

    return !!id && wishlist.includes(id);
  }

  function toggleWishlist(product) {
    const normalized = normalizeProduct(product);

    if (!normalized) {
      return false;
    }

    const id = getProductId(normalized);

    if (wishlist.includes(id)) {
      wishlist = wishlist.filter(
        item => item !== id
      );

      saveWishlist();
      updateWishlistUI();

      dispatch(
        "abo-tarek:wishlist-updated",
        {
          wishlist: getWishlist(),
          product: normalized,
          active: false
        }
      );

      showToast(
        "تم حذف المنتج من المفضلة",
        "success"
      );

      return false;
    }

    wishlist.push(id);

    saveWishlist();
    updateWishlistUI();

    dispatch(
      "abo-tarek:wishlist-updated",
      {
        wishlist: getWishlist(),
        product: normalized,
        active: true
      }
    );

    showToast(
      "تمت إضافة المنتج للمفضلة",
      "success"
    );

    return true;
  }

  /* =========================================================
     RECENTLY VIEWED
     ========================================================= */

  function addRecentlyViewed(product) {
    const normalized = normalizeProduct(product);

    if (!normalized) {
      return;
    }

    const id = getProductId(normalized);

    recentProducts = recentProducts.filter(
      item => getProductId(item) !== id
    );

    recentProducts.unshift(normalized);

    recentProducts = recentProducts.slice(
      0,
      LIMITS.maxRecent
    );

    saveRecent();

    dispatch(
      "abo-tarek:recently-viewed-updated",
      {
        products: recentProducts.slice()
      }
    );
  }

  function getRecentlyViewed() {
    return recentProducts.slice();
  }

  /* =========================================================
     TOAST
     ========================================================= */

  function ensureToastContainer() {
    if (toastContainer) {
      return toastContainer;
    }

    toastContainer =
      document.querySelector(
        ".abo-toast-container"
      );

    if (!toastContainer) {
      toastContainer =
        document.createElement("div");

      toastContainer.className =
        "abo-toast-container";

      toastContainer.setAttribute(
        "aria-live",
        "polite"
      );

      document.body.appendChild(
        toastContainer
      );
    }

    return toastContainer;
  }

  function showToast(message, type = "info") {
    if (!document.body) {
      return;
    }

    const container =
      ensureToastContainer();

    const toast =
      document.createElement("div");

    toast.className =
      "abo-toast abo-toast-" +
      cleanText(type || "info");

    toast.setAttribute(
      "role",
      "status"
    );

    toast.innerHTML =
      '<span class="abo-toast-message">' +
      escapeHtml(message) +
      "</span>";

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    window.setTimeout(() => {
      toast.classList.remove(
        "is-visible"
      );

      window.setTimeout(() => {
        toast.remove();
      }, 250);
    }, 2600);
  }

  /* =========================================================
     CART COUNT UI
     ========================================================= */

  function updateCartCountElements() {
    const count = getCartCount();

    document
      .querySelectorAll(
        "#cartCount," +
        ".cart-count," +
        "[data-cart-count]"
      )
      .forEach(element => {
        element.textContent = String(count);

        element.hidden = count <= 0;

        element.classList.toggle(
          "is-empty",
          count <= 0
        );
      });
  }

  function updateWishlistUI() {
    document
      .querySelectorAll(
        "[data-wishlist-id]," +
        ".wishlist-btn[data-product-id]," +
        ".product-wishlist[data-product-id]"
      )
      .forEach(button => {
        const id =
          button.getAttribute(
            "data-wishlist-id"
          ) ||
          button.getAttribute(
            "data-product-id"
          );

        const active =
          isInWishlist(id);

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
          active ? "true" : "false"
        );

        const icon =
          button.querySelector(
            "[data-wishlist-icon]"
          );

        if (icon) {
          icon.textContent =
            active ? "♥" : "♡";
        }
      });
  }

  /* =========================================================
     CART DRAWER
     ========================================================= */

  function ensureCartDrawer() {
    if (cartDrawer) {
      return cartDrawer;
    }

    cartDrawer =
      document.querySelector(
        ".abo-cart-drawer"
      );

    if (cartDrawer) {
      return cartDrawer;
    }

    const overlay =
      document.createElement("div");

    overlay.className =
      "abo-cart-overlay";

    overlay.hidden = true;

    const drawer =
      document.createElement("aside");

    drawer.className =
      "abo-cart-drawer";

    drawer.setAttribute(
      "aria-label",
      "سلة المشتريات"
    );

    drawer.innerHTML = `
      <div class="abo-cart-header">
        <div>
          <span class="abo-cart-kicker">طلبك</span>
          <h2>سلة المشتريات</h2>
        </div>

        <button
          type="button"
          class="abo-cart-close"
          data-cart-close
          aria-label="إغلاق السلة"
        >×</button>
      </div>

      <div
        class="abo-cart-body"
        data-cart-body
      ></div>

      <div
        class="abo-cart-footer"
        data-cart-footer
      ></div>
    `;

    document.body.appendChild(
      overlay
    );

    document.body.appendChild(
      drawer
    );

    overlay.addEventListener(
      "click",
      closeCart
    );

    drawer.addEventListener(
      "click",
      handleCartClick
    );

    cartDrawer = drawer;

    return cartDrawer;
  }

  function renderCartDrawer() {
    const drawer =
      ensureCartDrawer();

    const body =
      drawer.querySelector(
        "[data-cart-body]"
      );

    const footer =
      drawer.querySelector(
        "[data-cart-footer]"
      );

    if (!body || !footer) {
      return;
    }

    if (!cart.length) {
      body.innerHTML = `
        <div class="abo-cart-empty">
          <div class="abo-cart-empty-icon">🛒</div>
          <h3>السلة فاضية</h3>
          <p>اختار المنتجات اللي عايز تطلبها وهتظهر هنا.</p>

          <button
            type="button"
            class="abo-feature-btn abo-feature-btn-primary"
            data-cart-close
          >
            تصفح المنتجات
          </button>
        </div>
      `;

      footer.innerHTML = "";
      return;
    }

    body.innerHTML = cart
      .map(item => {
        const product = item.product;
        const quantity =
          safeNumber(item.quantity, 1);

        const price =
          getProductPrice(product);

        const image =
          resolveImage(product);

        return `
          <article
            class="abo-cart-item"
            data-cart-item-id="${escapeHtml(
              product.id
            )}"
          >
            <div class="abo-cart-item-media">
              ${
                image
                  ? `
                    <img
                      src="${escapeHtml(image)}"
                      alt="${escapeHtml(product.name)}"
                      loading="lazy"
                    >
                  `
                  : `
                    <div class="abo-cart-item-placeholder">
                      🛍️
                    </div>
                  `
              }
            </div>

            <div class="abo-cart-item-info">
              <h3>
                ${escapeHtml(product.name)}
              </h3>

              ${
                product.category
                  ? `
                    <span class="abo-cart-item-category">
                      ${escapeHtml(product.category)}
                    </span>
                  `
                  : ""
              }

              ${
                price > 0
                  ? `
                    <strong class="abo-cart-item-price">
                      ${formatPrice(price)}
                    </strong>
                  `
                  : `
                    <span class="abo-cart-item-price">
                      السعر عند الطلب
                    </span>
                  `
              }

              <div class="abo-cart-item-controls">
                <button
                  type="button"
                  data-cart-action="decrease"
                  data-product-id="${escapeHtml(
                    product.id
                  )}"
                  aria-label="تقليل الكمية"
                >−</button>

                <span>
                  ${quantity}
                </span>

                <button
                  type="button"
                  data-cart-action="increase"
                  data-product-id="${escapeHtml(
                    product.id
                  )}"
                  aria-label="زيادة الكمية"
                >+</button>

                <button
                  type="button"
                  class="abo-cart-remove"
                  data-cart-action="remove"
                  data-product-id="${escapeHtml(
                    product.id
                  )}"
                >
                  حذف
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    const total =
      getCartTotal();

    footer.innerHTML = `
      <div class="abo-cart-total">
        <span>الإجمالي</span>
        <strong>
          ${
            total > 0
              ? formatPrice(total)
              : "السعر عند الطلب"
          }
        </strong>
      </div>

      <div class="abo-cart-actions">
        <button
          type="button"
          class="abo-feature-btn abo-feature-btn-primary"
          data-cart-whatsapp
        >
          طلب عبر واتساب
        </button>

        <button
          type="button"
          class="abo-feature-btn abo-feature-btn-secondary"
          data-cart-clear
        >
          تفريغ السلة
        </button>
      </div>
    `;
  }

  function openCart() {
    const drawer =
      ensureCartDrawer();

    renderCartDrawer();

    const overlay =
      document.querySelector(
        ".abo-cart-overlay"
      );

    drawer.classList.add(
      "is-open"
    );

    if (overlay) {
      overlay.hidden = false;

      requestAnimationFrame(() => {
        overlay.classList.add(
          "is-visible"
        );
      });
    }

    document.body.classList.add(
      "abo-cart-open"
    );

    document.body.classList.add(
      "abo-scroll-locked"
    );
  }

  function closeCart() {
    const drawer =
      cartDrawer ||
      document.querySelector(
        ".abo-cart-drawer"
      );

    const overlay =
      document.querySelector(
        ".abo-cart-overlay"
      );

    if (drawer) {
      drawer.classList.remove(
        "is-open"
      );
    }

    if (overlay) {
      overlay.classList.remove(
        "is-visible"
      );

      window.setTimeout(() => {
        overlay.hidden = true;
      }, 200);
    }

    document.body.classList.remove(
      "abo-cart-open"
    );

    document.body.classList.remove(
      "abo-scroll-locked"
    );
  }

  function handleCartClick(event) {
    const close =
      event.target.closest(
        "[data-cart-close]"
      );

    if (close) {
      closeCart();
      return;
    }

    const actionButton =
      event.target.closest(
        "[data-cart-action]"
      );

    if (actionButton) {
      const action =
        actionButton.getAttribute(
          "data-cart-action"
        );

      const productId =
        actionButton.getAttribute(
          "data-product-id"
        );

      if (action === "increase") {
        updateCartQuantity(
          productId,
          1
        );
      }

      if (action === "decrease") {
        updateCartQuantity(
          productId,
          -1
        );
      }

      if (action === "remove") {
        removeFromCart(productId);
      }

      renderCartDrawer();
      return;
    }

    if (
      event.target.closest(
        "[data-cart-clear]"
      )
    ) {
      clearCart();
      renderCartDrawer();
      return;
    }

    if (
      event.target.closest(
        "[data-cart-whatsapp]"
      )
    ) {
      openWhatsAppOrder();
    }
  }

  function updateCartUI() {
    updateCartCountElements();

    if (cartDrawer) {
      renderCartDrawer();
    }
  }

  /* =========================================================
     WHATSAPP
     ========================================================= */

  function getWhatsAppNumber() {
    const value =
      CFG.WHATSAPP_NUMBER ||
      CFG.CONTACT?.whatsappNumber ||
      CFG.DEFAULTS?.whatsappNumber ||
      "201551604163";

    const normalized =
      String(value)
        .replace(/\D/g, "")
        .replace(/^00/, "");

    if (
      normalized.startsWith("01") &&
      normalized.length === 11
    ) {
      return "20" + normalized;
    }

    if (
      normalized.startsWith("1") &&
      normalized.length === 10
    ) {
      return "20" + normalized;
    }

    return normalized;
  }

  function buildWhatsAppUrl(message) {
    const number =
      getWhatsAppNumber();

    return (
      "https://wa.me/" +
      number +
      "?text=" +
      encodeURIComponent(message)
    );
  }

  function buildCartMessage() {
    const lines = [
      "السلام عليكم، عايز أعمل طلب من أبو طارق للأدوات المنزلية.",
      "",
      "🛒 المنتجات:"
    ];

    cart.forEach((item, index) => {
      const product =
        item.product;

      const quantity =
        safeNumber(
          item.quantity,
          1
        );

      const price =
        getProductPrice(product);

      let line =
        `${index + 1}) ${product.name} × ${quantity}`;

      if (price > 0) {
        line +=
          ` — ${formatPrice(
            price * quantity
          )}`;
      }

      lines.push(line);
    });

    lines.push("");

    const total =
      getCartTotal();

    if (total > 0) {
      lines.push(
        `💰 الإجمالي التقريبي: ${formatPrice(total)}`
      );
    }

    lines.push("");
    lines.push(
      "من فضلك أكدلي الطلب والتفاصيل."
    );

    return lines.join("\n");
  }

  function openWhatsAppOrder() {
    if (!cart.length) {
      showToast(
        "السلة فاضية",
        "info"
      );

      return;
    }

    const url =
      buildWhatsAppUrl(
        buildCartMessage()
      );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    dispatch(
      "abo-tarek:checkout",
      {
        cart: getCart(),
        count: getCartCount(),
        total: getCartTotal()
      }
    );
  }

  function openProductWhatsApp(
    product,
    quantity = 1
  ) {
    const normalized =
      normalizeProduct(product);

    if (!normalized) {
      return;
    }

    const price =
      getProductPrice(normalized);

    let message =
      "السلام عليكم، عايز أستفسر عن المنتج ده من أبو طارق للأدوات المنزلية.\n\n";

    message +=
      "🛍️ المنتج: " +
      normalized.name;

    if (normalized.category) {
      message +=
        "\n📂 القسم: " +
        normalized.category;
    }

    message +=
      "\n🔢 الكمية: " +
      Math.max(
        1,
        safeNumber(quantity, 1)
      );

    if (price > 0) {
      message +=
        "\n💰 السعر: " +
        formatPrice(price);
    }

    const url =
      buildWhatsAppUrl(message);

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =========================================================
     PRODUCT MODAL
     ========================================================= */

  function ensureProductModal() {
    if (modal) {
      return modal;
    }

    modal =
      document.querySelector(
        ".abo-product-modal"
      );

    if (modal) {
      return modal;
    }

    const overlay =
      document.createElement("div");

    overlay.className =
      "abo-product-modal";

    overlay.innerHTML = `
      <div class="abo-product-modal-backdrop"></div>

      <div
        class="abo-product-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل المنتج"
      >
        <button
          type="button"
          class="abo-product-modal-close"
          data-modal-close
          aria-label="إغلاق"
        >×</button>

        <div
          class="abo-product-modal-media"
          data-modal-media
        ></div>

        <div
          class="abo-product-modal-content"
          data-modal-content
        ></div>
      </div>
    `;

    document.body.appendChild(
      overlay
    );

    overlay.addEventListener(
      "click",
      handleModalClick
    );

    modal = overlay;

    return modal;
  }

  function renderProductModal(product) {
    const normalized =
      normalizeProduct(product);

    if (!normalized) {
      return;
    }

    const element =
      ensureProductModal();

    modalProduct =
      normalized;

    modalQuantity = 1;

    const media =
      element.querySelector(
        "[data-modal-media]"
      );

    const content =
      element.querySelector(
        "[data-modal-content]"
      );

    const image =
      resolveImage(normalized);

    const price =
      getProductPrice(normalized);

    const hasOldPrice =
      normalized.oldPrice > 0 &&
      price > 0 &&
      normalized.oldPrice > price;

    const favorite =
      isInWishlist(normalized);

    if (media) {
      media.innerHTML = image
        ? `
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(
              normalized.name
            )}"
          >
        `
        : `
          <div class="abo-product-modal-placeholder">
            🛍️
          </div>
        `;
    }

    if (content) {
      content.innerHTML = `
        <div class="abo-product-modal-top">
          ${
            normalized.isOffer
              ? `
                <span class="abo-product-modal-badge">
                  عرض خاص
                </span>
              `
              : ""
          }

          ${
            normalized.category
              ? `
                <span class="abo-product-modal-category">
                  ${escapeHtml(
                    normalized.category
                  )}
                </span>
              `
              : ""
          }
        </div>

        <h2>
          ${escapeHtml(
            normalized.name
          )}
        </h2>

        ${
          normalized.description
            ? `
              <p class="abo-product-modal-description">
                ${escapeHtml(
                  normalized.description
                )}
              </p>
            `
            : ""
        }

        <div class="abo-product-modal-price">
          ${
            price > 0
              ? `
                <strong>
                  ${formatPrice(price)}
                </strong>
              `
              : `
                <strong>
                  السعر عند الطلب
                </strong>
              `
          }

          ${
            hasOldPrice
              ? `
                <del>
                  ${formatPrice(
                    normalized.oldPrice
                  )}
                </del>
              `
              : ""
          }
        </div>

        <div class="abo-product-modal-quantity">
          <span>الكمية</span>

          <div class="abo-inline-quantity">
            <button
              type="button"
              data-modal-quantity="-1"
              aria-label="تقليل"
            >−</button>

            <strong data-modal-qty>
              1
            </strong>

            <button
              type="button"
              data-modal-quantity="1"
              aria-label="زيادة"
            >+</button>
          </div>
        </div>

        <div class="abo-product-modal-actions">
          <button
            type="button"
            class="abo-feature-btn abo-feature-btn-primary"
            data-modal-add
          >
            🛒 أضف للسلة
          </button>

          <button
            type="button"
            class="abo-feature-btn abo-feature-btn-secondary"
            data-modal-whatsapp
          >
            واتساب
          </button>

          <button
            type="button"
            class="abo-feature-btn abo-feature-btn-ghost ${
              favorite ? "is-active" : ""
            }"
            data-modal-wishlist
            aria-pressed="${
              favorite ? "true" : "false"
            }"
          >
            ${
              favorite
                ? "♥ في المفضلة"
                : "♡ أضف للمفضلة"
            }
          </button>
        </div>

        <a
          class="abo-product-modal-details"
          href="product.html?id=${encodeURIComponent(
            normalized.id
          )}"
        >
          عرض صفحة المنتج كاملة
        </a>
      `;
    }
  }

  function updateModalQuantityUI() {
    if (!modal) {
      return;
    }

    const element =
      modal.querySelector(
        "[data-modal-qty]"
      );

    if (element) {
      element.textContent =
        String(modalQuantity);
    }
  }

  function handleModalClick(event) {
    if (
      event.target.closest(
        ".abo-product-modal-backdrop"
      ) ||
      event.target.closest(
        "[data-modal-close]"
      )
    ) {
      closeProductModal();
      return;
    }

    const quantityButton =
      event.target.closest(
        "[data-modal-quantity]"
      );

    if (quantityButton) {
      const delta =
        safeNumber(
          quantityButton.getAttribute(
            "data-modal-quantity"
          ),
          0
        );

      modalQuantity = Math.max(
        1,
        Math.min(
          LIMITS.maxQuantity,
          modalQuantity + delta
        )
      );

      updateModalQuantityUI();
      return;
    }

    if (
      event.target.closest(
        "[data-modal-add]"
      )
    ) {
      if (modalProduct) {
        addToCart(
          modalProduct,
          modalQuantity
        );
      }

      return;
    }

    if (
      event.target.closest(
        "[data-modal-whatsapp]"
      )
    ) {
      if (modalProduct) {
        openProductWhatsApp(
          modalProduct,
          modalQuantity
        );
      }

      return;
    }

    if (
      event.target.closest(
        "[data-modal-wishlist]"
      )
    ) {
      if (modalProduct) {
        toggleWishlist(
          modalProduct
        );

        renderProductModal(
          modalProduct
        );
      }
    }
  }

  function openProductModal(product) {
    const normalized =
      normalizeProduct(product);

    if (!normalized) {
      return;
    }

    renderProductModal(
      normalized
    );

    const element =
      ensureProductModal();

    element.classList.add(
      "is-open"
    );

    document.body.classList.add(
      "abo-modal-open"
    );

    document.body.classList.add(
      "abo-scroll-locked"
    );

    addRecentlyViewed(
      normalized
    );
  }

  function closeProductModal() {
    if (!modal) {
      return;
    }

    modal.classList.remove(
      "is-open"
    );

    document.body.classList.remove(
      "abo-modal-open"
    );

    if (
      !document.querySelector(
        ".abo-cart-drawer.is-open"
      )
    ) {
      document.body.classList.remove(
        "abo-scroll-locked"
      );
    }

    modalProduct = null;
  }

  /* =========================================================
     GLOBAL UI HANDLERS
     
     IMPORTANT:
     We intentionally DO NOT delegate product-card
     add-to-cart or wishlist clicks here.

     app.js and sections.html call the public API directly.
     This prevents double additions.
     ========================================================= */

  function handleGlobalClick(event) {
    const cartTrigger =
      event.target.closest(
        "[data-cart-trigger]," +
        "#cartTrigger," +
        ".cart-trigger," +
        ".open-cart"
      );

    if (cartTrigger) {
      event.preventDefault();
      openCart();
      return;
    }

    const closeTrigger =
      event.target.closest(
        "[data-cart-close]"
      );

    if (
      closeTrigger &&
      !event.target.closest(
        ".abo-cart-drawer"
      )
    ) {
      closeCart();
      return;
    }

    const modalTrigger =
      event.target.closest(
        "[data-product-modal]"
      );

    if (modalTrigger) {
      event.preventDefault();

      let product = null;

      try {
        const raw =
          modalTrigger.getAttribute(
            "data-product-modal"
          );

        if (raw) {
          product =
            JSON.parse(
              raw
            );
        }
      } catch (error) {}

      if (!product) {
        const id =
          modalTrigger.getAttribute(
            "data-product-id"
          );

        product =
          findProductAnywhere(id);
      }

      if (product) {
        openProductModal(
          product
        );
      }
    }
  }

  /* =========================================================
     PRODUCT LOOKUP
     ========================================================= */

  function findProductAnywhere(id) {
    const cleanId =
      cleanText(id);

    if (!cleanId) {
      return null;
    }

    try {
      const app =
        window.ABO_TAREK_APP;

      if (
        app &&
        typeof app.getProductById ===
          "function"
      ) {
        const found =
          app.getProductById(
            cleanId
          );

        if (found) {
          return normalizeProduct(
            found
          );
        }
      }

      if (
        app &&
        Array.isArray(
          app.products
        )
      ) {
        const found =
          app.products.find(
            item =>
              getProductId(item) ===
              cleanId
          );

        if (found) {
          return normalizeProduct(
            found
          );
        }
      }
    } catch (error) {}

    try {
      const cacheKeys = [
        CFG.CACHE_KEYS?.products,
        "abo_tarek_products_v14",
        "abo_tarek_products_v13",
        "abo_tarek_products_v12",
        "abo_tarek_products_v11"
      ].filter(Boolean);

      for (const key of cacheKeys) {
        const data =
          readStorage(
            key,
            []
          );

        if (
          Array.isArray(data)
        ) {
          const found =
            data.find(
              item =>
                getProductId(item) ===
                cleanId
            );

          if (found) {
            return normalizeProduct(
              found
            );
          }
        }
      }
    } catch (error) {}

    return null;
  }

  /* =========================================================
     CART / WISHLIST BUTTON STATE
     ========================================================= */

  function refreshFeatureButtons() {
    updateCartCountElements();
    updateWishlistUI();
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {
    if (initialized) {
      return;
    }

    initialized = true;

    loadState();

    document.addEventListener(
      "click",
      handleGlobalClick
    );

    updateCartUI();
    refreshFeatureButtons();

    dispatch(
      "abo-tarek:features-ready",
      {
        cart: getCart(),
        wishlist: getWishlist(),
        recent: getRecentlyViewed()
      }
    );
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  const API = {
    version: "final-stable-1.0.0",

    /* Cart */
    getCart,
    getCartCount,
    getCartTotal,
    addToCart,
    setCartQuantity,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    openCart,
    closeCart,

    /* Wishlist */
    getWishlist,
    isInWishlist,
    toggleWishlist,

    /* Recently viewed */
    addRecentlyViewed,
    getRecentlyViewed,

    /* Product */
    openProductModal,
    closeProductModal,

    /* WhatsApp */
    openWhatsAppOrder,
    openProductWhatsApp,
    buildWhatsAppUrl,
    buildCartMessage,

    /* UI */
    showToast,
    updateCartUI,
    refreshFeatureButtons,

    /* Utilities */
    normalizeProduct,
    getProductPrice,
    formatPrice,
    resolveImage
  };

  window.ABO_TAREK_FEATURES =
    API;

  /* Compatibility alias */
  window.ABO_TAREK_CART =
    API;

  /* =========================================================
     DOM READY
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

  /* =========================================================
     KEEP UI IN SYNC WHEN OTHER FILES UPDATE STATE
     ========================================================= */

  document.addEventListener(
    "abo-tarek:cart-updated",
    () => {
      updateCartCountElements();

      if (cartDrawer) {
        renderCartDrawer();
      }
    }
  );

  document.addEventListener(
    "abo-tarek:wishlist-updated",
    () => {
      updateWishlistUI();
    }
  );

  window.addEventListener(
    "storage",
    event => {
      if (
        event.key ===
        STORAGE.cart
      ) {
        loadState();
        updateCartUI();
      }

      if (
        event.key ===
        STORAGE.wishlist
      ) {
        loadState();
        updateWishlistUI();
      }

      if (
        event.key ===
        STORAGE.recent
      ) {
        loadState();
      }
    }
  );

})();
