/* =========================================================
   ABO TAREK STORE
   FEATURES ENGINE
   FINAL STABLE EDITION

   RESPONSIBILITIES:
   - Cart
   - Cart quantities
   - Wishlist
   - Product modal
   - WhatsApp checkout
   - LocalStorage
   - UI bridge

   IMPORTANT:
   This file DOES NOT call Apps Script.
   This file DOES NOT load app.js.
   This file owns cart/wishlist events only.
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const STORAGE_CART =
    "abo_tarek_cart_v1";

  const STORAGE_WISHLIST =
    "abo_tarek_wishlist_v1";

  const WHATSAPP_NUMBER =
    "201551604163";

  const MAX_QUANTITY =
    99;

  /* =========================================================
     STATE
     ========================================================= */

  let cart = [];
  let wishlist = [];

  let activeProduct = null;
  let modalQuantity = 1;

  let cartDrawer = null;
  let modal = null;

  let toastTimer = null;

  /* =========================================================
     SAFE HELPERS
     ========================================================= */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function numberValue(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const normalized =
      String(value)
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "");

    if (!normalized) {
      return null;
    }

    const number =
      Number(normalized);

    return Number.isFinite(number)
      ? number
      : null;
  }

  function formatPrice(value) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return "";
    }

    try {
      return (
        new Intl.NumberFormat("ar-EG")
          .format(number)
        + " ج.م"
      );
    } catch (_) {
      return number + " ج.م";
    }
  }

  function normalizeProduct(product) {
    if (!product) {
      return null;
    }

    const normalized = {
      id:
        String(product.id ?? ""),

      name:
        String(product.name ?? "منتج"),

      category:
        String(product.category ?? ""),

      image:
        String(product.image ?? ""),

      description:
        String(product.description ?? ""),

      price:
        numberValue(product.price),

      oldPrice:
        numberValue(product.oldPrice),

      offerPrice:
        numberValue(product.offerPrice),

      isOffer:
        product.isOffer === true ||
        product.isOffer === 1 ||
        product.isOffer === "1" ||
        String(product.isOffer ?? "")
          .toLowerCase()
          .trim() === "true",

      images: []
    };

    let images = [];

    if (Array.isArray(product.images)) {
      images = product.images;
    } else if (
      typeof product.images === "string"
    ) {
      try {
        const parsed =
          JSON.parse(product.images);

        if (Array.isArray(parsed)) {
          images = parsed;
        }
      } catch (_) {
        images =
          product.images
            .split(/\r?\n|,/)
            .map(item => item.trim())
            .filter(Boolean);
      }
    }

    if (normalized.image) {
      images.unshift(
        normalized.image
      );
    }

    normalized.images =
      [...new Set(
        images
          .map(item =>
            String(item || "").trim()
          )
          .filter(Boolean)
      )].slice(0, 5);

    if (
      !normalized.image &&
      normalized.images.length
    ) {
      normalized.image =
        normalized.images[0];
    }

    return normalized;
  }

  /* =========================================================
     STORAGE
     ========================================================= */

  function loadStorage() {
    try {
      const savedCart =
        localStorage.getItem(
          STORAGE_CART
        );

      const savedWishlist =
        localStorage.getItem(
          STORAGE_WISHLIST
        );

      cart =
        savedCart
          ? JSON.parse(savedCart)
          : [];

      wishlist =
        savedWishlist
          ? JSON.parse(savedWishlist)
          : [];

      if (!Array.isArray(cart)) {
        cart = [];
      }

      if (!Array.isArray(wishlist)) {
        wishlist = [];
      }

    } catch (_) {
      cart = [];
      wishlist = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(
        STORAGE_CART,
        JSON.stringify(cart)
      );
    } catch (_) {}
  }

  function saveWishlist() {
    try {
      localStorage.setItem(
        STORAGE_WISHLIST,
        JSON.stringify(wishlist)
      );
    } catch (_) {}
  }

  /* =========================================================
     PRICE
     ========================================================= */

  function getProductPrice(product) {
    if (!product) {
      return null;
    }

    if (
      product.isOffer &&
      product.offerPrice !== null
    ) {
      return product.offerPrice;
    }

    if (
      product.price !== null
    ) {
      return product.price;
    }

    if (
      product.offerPrice !== null
    ) {
      return product.offerPrice;
    }

    return null;
  }

  function getOldPrice(product) {
    if (!product) {
      return null;
    }

    const current =
      getProductPrice(product);

    if (
      product.oldPrice !== null &&
      current !== null &&
      product.oldPrice > current
    ) {
      return product.oldPrice;
    }

    return null;
  }

  /* =========================================================
     TOAST
     ========================================================= */

  function showToast(message) {

    let toast =
      document.getElementById(
        "aboTarekFeatureToast"
      );

    if (!toast) {

      toast =
        document.createElement(
          "div"
        );

      toast.id =
        "aboTarekFeatureToast";

      toast.className =
        "at-feature-toast";

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
      setTimeout(() => {

        toast.classList.remove(
          "show"
        );

      }, 2200);
  }

  /* =========================================================
     CART
     ========================================================= */

  function findCartItem(productId) {
    return cart.find(
      item =>
        String(item.id) ===
        String(productId)
    );
  }

  function getCartCount() {
    return cart.reduce(
      (total, item) =>
        total +
        Math.max(
          1,
          Number(item.quantity) || 1
        ),
      0
    );
  }

  function getCartTotal() {
    return cart.reduce(
      (total, item) => {

        const price =
          getProductPrice(item);

        if (price === null) {
          return total;
        }

        return (
          total +
          price *
          Math.max(
            1,
            Number(item.quantity) || 1
          )
        );

      },
      0
    );
  }

  function addToCart(
    product,
    quantity = 1
  ) {

    const normalized =
      normalizeProduct(product);

    if (
      !normalized ||
      !normalized.id
    ) {
      return;
    }

    let amount =
      Number(quantity);

    if (
      !Number.isFinite(amount)
    ) {
      amount = 1;
    }

    amount =
      Math.max(
        1,
        Math.min(
          MAX_QUANTITY,
          Math.floor(amount)
        )
      );

    const existing =
      findCartItem(
        normalized.id
      );

    if (existing) {

      existing.quantity =
        Math.min(
          MAX_QUANTITY,
          (
            Number(existing.quantity) ||
            0
          ) + amount
        );

      existing.product =
        normalized;

    } else {

      cart.push({
        ...normalized,
        quantity: amount
      });

    }

    saveCart();

    updateCartUI();

    showToast(
      existing
        ? "تم تحديث كمية المنتج في السلة ✓"
        : "تمت إضافة المنتج للسلة ✓"
    );

    emitFeatureEvent(
      "cart:add",
      {
        product: normalized,
        quantity: amount
      }
    );
  }

  function removeFromCart(
    productId
  ) {

    const before =
      cart.length;

    cart =
      cart.filter(
        item =>
          String(item.id) !==
          String(productId)
      );

    if (
      cart.length !== before
    ) {

      saveCart();

      updateCartUI();

      showToast(
        "تم حذف المنتج من السلة"
      );

      emitFeatureEvent(
        "cart:remove",
        {
          productId
        }
      );
    }
  }

  function changeCartQuantity(
    productId,
    delta
  ) {

    const item =
      findCartItem(
        productId
      );

    if (!item) {
      return;
    }

    let quantity =
      Number(item.quantity) || 1;

    quantity +=
      Number(delta) || 0;

    quantity =
      Math.max(
        1,
        Math.min(
          MAX_QUANTITY,
          Math.floor(quantity)
        )
      );

    item.quantity =
      quantity;

    saveCart();

    updateCartUI();

    emitFeatureEvent(
      "cart:quantity",
      {
        productId,
        quantity
      }
    );
  }

  function setCartQuantity(
    productId,
    quantity
  ) {

    const item =
      findCartItem(
        productId
      );

    if (!item) {
      return;
    }

    let value =
      Number(quantity);

    if (!Number.isFinite(value)) {
      value = 1;
    }

    value =
      Math.max(
        1,
        Math.min(
          MAX_QUANTITY,
          Math.floor(value)
        )
      );

    item.quantity =
      value;

    saveCart();

    updateCartUI();
  }

  function clearCart() {

    cart = [];

    saveCart();

    updateCartUI();

    showToast(
      "تم تفريغ السلة"
    );
  }

  /* =========================================================
     WISHLIST
     ========================================================= */

  function isInWishlist(
    productId
  ) {

    return wishlist.some(
      item =>
        String(
          typeof item === "object"
            ? item.id
            : item
        ) ===
        String(productId)
    );
  }

  function addToWishlist(
    product
  ) {

    const normalized =
      normalizeProduct(product);

    if (
      !normalized ||
      !normalized.id
    ) {
      return;
    }

    if (
      isInWishlist(
        normalized.id
      )
    ) {
      return;
    }

    wishlist.push(
      normalized
    );

    saveWishlist();

    updateWishlistUI();

    showToast(
      "تمت إضافة المنتج للمفضلة ♥"
    );

    emitFeatureEvent(
      "wishlist:add",
      {
        product: normalized
      }
    );
  }

  function removeFromWishlist(
    productId
  ) {

    wishlist =
      wishlist.filter(
        item =>
          String(
            typeof item === "object"
              ? item.id
              : item
          ) !==
          String(productId)
      );

    saveWishlist();

    updateWishlistUI();

    showToast(
      "تم حذف المنتج من المفضلة"
    );

    emitFeatureEvent(
      "wishlist:remove",
      {
        productId
      }
    );
  }

  function toggleWishlist(
    product
  ) {

    if (!product) {
      return;
    }

    const id =
      String(product.id ?? "");

    if (!id) {
      return;
    }

    if (
      isInWishlist(id)
    ) {

      removeFromWishlist(id);

    } else {

      addToWishlist(product);

    }

  }

  /* =========================================================
     CART HTML
     ========================================================= */

  function cartItemHTML(item) {

    const image =
      item.image ||
      "./assets/logo.png";

    const price =
      getProductPrice(item);

    const quantity =
      Math.max(
        1,
        Number(item.quantity) || 1
      );

    const lineTotal =
      price !== null
        ? price * quantity
        : null;

    return `

      <div
        class="at-cart-item"
        data-cart-item="${escapeHTML(item.id)}">

        <div class="at-cart-item-image">

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(item.name)}"
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null;this.src='./assets/logo.png';">

        </div>

        <div class="at-cart-item-info">

          <div class="at-cart-item-name">
            ${escapeHTML(item.name)}
          </div>

          <div class="at-cart-item-category">
            ${escapeHTML(item.category)}
          </div>

          ${
            price !== null
              ? `
                <div class="at-cart-item-price">
                  ${formatPrice(price)}
                </div>
              `
              : `
                <div class="at-cart-item-price">
                  السعر عند الطلب
                </div>
              `
          }

          <div class="at-cart-controls">

            <button
              type="button"
              data-cart-minus="${escapeHTML(item.id)}">
              −
            </button>

            <input
              type="number"
              min="1"
              max="${MAX_QUANTITY}"
              value="${quantity}"
              data-cart-quantity="${escapeHTML(item.id)}"
              aria-label="كمية ${escapeHTML(item.name)}">

            <button
              type="button"
              data-cart-plus="${escapeHTML(item.id)}">
              +
            </button>

          </div>

        </div>

        <div class="at-cart-item-side">

          ${
            lineTotal !== null
              ? `
                <strong>
                  ${formatPrice(lineTotal)}
                </strong>
              `
              : ""
          }

          <button
            type="button"
            class="at-cart-remove"
            data-cart-remove="${escapeHTML(item.id)}"
            aria-label="حذف المنتج">

            ×

          </button>

        </div>

      </div>

    `;
  }

  /* =========================================================
     CART DRAWER
     ========================================================= */

  function createCartDrawer() {

    if (
      document.getElementById(
        "aboTarekCartDrawer"
      )
    ) {
      return;
    }

    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "aboTarekCartDrawer";

    overlay.className =
      "at-cart-overlay";

    overlay.innerHTML = `

      <aside
        class="at-cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="سلة المشتريات">

        <div class="at-cart-header">

          <div>

            <div class="at-cart-title">
              سلة المشتريات
            </div>

            <div
              class="at-cart-count"
              id="atCartCountText">
              0 منتج
            </div>

          </div>

          <button
            type="button"
            class="at-cart-close"
            data-close-cart
            aria-label="إغلاق السلة">

            ×

          </button>

        </div>

        <div
          class="at-cart-body"
          id="atCartBody">
        </div>

        <div
          class="at-cart-footer"
          id="atCartFooter">
        </div>

      </aside>

    `;

    document.body.appendChild(
      overlay
    );

    cartDrawer =
      overlay;

    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          overlay
        ) {
          closeCart();
        }

        if (
          event.target.closest(
            "[data-close-cart]"
          )
        ) {
          closeCart();
        }

      }
    );

    const body =
      overlay.querySelector(
        "#atCartBody"
      );

    body.addEventListener(
      "click",
      event => {

        const minus =
          event.target.closest(
            "[data-cart-minus]"
          );

        if (minus) {

          changeCartQuantity(
            minus.dataset.cartMinus,
            -1
          );

          return;
        }

        const plus =
          event.target.closest(
            "[data-cart-plus]"
          );

        if (plus) {

          changeCartQuantity(
            plus.dataset.cartPlus,
            1
          );

          return;
        }

        const remove =
          event.target.closest(
            "[data-cart-remove]"
          );

        if (remove) {

          removeFromCart(
            remove.dataset.cartRemove
          );

        }

      }
    );

    body.addEventListener(
      "change",
      event => {

        const input =
          event.target.closest(
            "[data-cart-quantity]"
          );

        if (!input) {
          return;
        }

        setCartQuantity(
          input.dataset.cartQuantity,
          input.value
        );

      }
    );
  }

  function openCart() {

    createCartDrawer();

    updateCartUI();

    cartDrawer.classList.add(
      "open"
    );

    document.body.classList.add(
      "at-no-scroll"
    );
  }

  function closeCart() {

    if (!cartDrawer) {
      return;
    }

    cartDrawer.classList.remove(
      "open"
    );

    document.body.classList.remove(
      "at-no-scroll"
    );
  }

  function renderCartFooter() {

    const count =
      getCartCount();

    const total =
      getCartTotal();

    if (!cart.length) {

      return `

        <div class="at-cart-empty">

          <div class="at-cart-empty-icon">
            🛒
          </div>

          <strong>
            السلة فاضية
          </strong>

          <span>
            اختار المنتجات اللي عايزها وهتظهر هنا.
          </span>

        </div>

      `;

    }

    return `

      <div class="at-cart-summary">

        <div>
          <span>
            عدد المنتجات
          </span>

          <strong>
            ${count}
          </strong>
        </div>

        <div>
          <span>
            الإجمالي
          </span>

          <strong>
            ${
              total > 0
                ? formatPrice(total)
                : "حسب السعر"
            }
          </strong>
        </div>

      </div>

      <button
        type="button"
        class="at-cart-checkout"
        data-cart-checkout>

        💬 إتمام الطلب عبر واتساب

      </button>

      <button
        type="button"
        class="at-cart-clear"
        data-cart-clear>

        تفريغ السلة

      </button>

    `;
  }

  function updateCartUI() {

    createCartDrawer();

    const body =
      cartDrawer.querySelector(
        "#atCartBody"
      );

    const footer =
      cartDrawer.querySelector(
        "#atCartFooter"
      );

    const countText =
      cartDrawer.querySelector(
        "#atCartCountText"
      );

    const count =
      getCartCount();

    if (countText) {

      countText.textContent =
        `${count} منتج`;

    }

    if (!cart.length) {

      body.innerHTML =
        renderCartFooter();

      footer.innerHTML =
        "";

    } else {

      body.innerHTML =
        cart
          .map(cartItemHTML)
          .join("");

      footer.innerHTML =
        renderCartFooter();

    }

    const checkout =
      cartDrawer.querySelector(
        "[data-cart-checkout]"
      );

    if (checkout) {

      checkout.onclick =
        checkoutWhatsApp;

    }

    const clear =
      cartDrawer.querySelector(
        "[data-cart-clear]"
      );

    if (clear) {

      clear.onclick =
        clearCart;

    }

    updateCartButtons();
  }

  /* =========================================================
     CART BUTTONS ON PAGE
     ========================================================= */

  function updateCartButtons() {

    const count =
      getCartCount();

    document
      .querySelectorAll(
        "[data-cart-count]"
      )
      .forEach(element => {

        element.textContent =
          String(count);

      });

    document
      .querySelectorAll(
        "[data-cart-button]"
      )
      .forEach(button => {

        button.setAttribute(
          "aria-label",
          `السلة ${count} منتج`
        );

      });
  }

  /* =========================================================
     WISHLIST UI
     ========================================================= */

  function updateWishlistUI() {

    document
      .querySelectorAll(
        "[data-wishlist-id]"
      )
      .forEach(button => {

        const id =
          button.dataset.wishlistId;

        const active =
          isInWishlist(id);

        button.classList.toggle(
          "active",
          active
        );

        if (
          button.tagName ===
          "BUTTON"
        ) {

          button.setAttribute(
            "aria-pressed",
            active
              ? "true"
              : "false"
          );

          if (
            button.textContent
              .trim()
              .includes("♡") ||
            button.textContent
              .trim()
              .includes("♥")
          ) {

            button.textContent =
              active
                ? "♥"
                : "♡";

          }

        }

      });

    document
      .querySelectorAll(
        "[data-wishlist-count]"
      )
      .forEach(element => {

        element.textContent =
          String(
            wishlist.length
          );

      });
  }

  /* =========================================================
     PRODUCT MODAL
     ========================================================= */

  function createProductModal() {

    if (
      document.getElementById(
        "aboTarekProductModal"
      )
    ) {
      return;
    }

    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "aboTarekProductModal";

    overlay.className =
      "at-product-overlay";

    overlay.innerHTML = `

      <div
        class="at-product-modal"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل المنتج">

        <button
          type="button"
          class="at-product-close"
          data-close-product
          aria-label="إغلاق">

          ×

        </button>

        <div
          id="atProductModalContent">
        </div>

      </div>

    `;

    document.body.appendChild(
      overlay
    );

    modal =
      overlay;

    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          overlay
        ) {
          closeProductModal();
        }

        if (
          event.target.closest(
            "[data-close-product]"
          )
        ) {
          closeProductModal();
        }

      }
    );
  }

  function openProductModal(
    product
  ) {

    const normalized =
      normalizeProduct(product);

    if (
      !normalized
    ) {
      return;
    }

    createProductModal();

    activeProduct =
      normalized;

    modalQuantity =
      1;

    const content =
      modal.querySelector(
        "#atProductModalContent"
      );

    const image =
      normalized.image ||
      "./assets/logo.png";

    const price =
      getProductPrice(
        normalized
      );

    const oldPrice =
      getOldPrice(
        normalized
      );

    const inWishlist =
      isInWishlist(
        normalized.id
      );

    content.innerHTML = `

      <div class="at-modal-product">

        <div class="at-modal-image">

          ${
            normalized.isOffer
              ? `
                <span class="at-modal-offer">
                  عرض
                </span>
              `
              : ""
          }

          <button
            type="button"
            class="at-modal-wishlist ${
              inWishlist
                ? "active"
                : ""
            }"
            data-modal-wishlist
            aria-label="المفضلة">

            ${
              inWishlist
                ? "♥"
                : "♡"
            }

          </button>

          <img
            id="atModalMainImage"
            src="${escapeHTML(image)}"
            alt="${escapeHTML(normalized.name)}"
            loading="eager"
            decoding="async"
            onerror="this.onerror=null;this.src='./assets/logo.png';">

        </div>

        ${
          normalized.images.length > 1
            ? `
              <div
                class="at-modal-thumbnails">

                ${normalized.images
                  .map(
                    (item, index) => `
                      <button
                        type="button"
                        class="at-modal-thumb ${
                          index === 0
                            ? "active"
                            : ""
                        }"
                        data-modal-image="${escapeHTML(item)}">

                        <img
                          src="${escapeHTML(item)}"
                          alt="${escapeHTML(normalized.name)}"
                          loading="lazy"
                          decoding="async">

                      </button>
                    `
                  )
                  .join("")}

              </div>
            `
            : ""
        }

        <div class="at-modal-info">

          <div class="at-modal-category">
            ${escapeHTML(
              normalized.category ||
              "أبو طارق"
            )}
          </div>

          <h2>
            ${escapeHTML(
              normalized.name
            )}
          </h2>

          ${
            normalized.description
              ? `
                <p>
                  ${escapeHTML(
                    normalized.description
                  )}
                </p>
              `
              : ""
          }

          <div class="at-modal-price">

            ${
              price !== null
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
              oldPrice !== null
                ? `
                  <del>
                    ${formatPrice(oldPrice)}
                  </del>
                `
                : ""
            }

          </div>

          <div class="at-modal-quantity">

            <span>
              الكمية
            </span>

            <div>

              <button
                type="button"
                data-modal-minus>
                −
              </button>

              <input
                id="atModalQuantity"
                type="number"
                value="1"
                min="1"
                max="${MAX_QUANTITY}"
                inputmode="numeric">

              <button
                type="button"
                data-modal-plus>
                +
              </button>

            </div>

          </div>

          <div class="at-modal-actions">

            <button
              type="button"
              class="at-modal-add"
              data-modal-add>

              🛒 إضافة للسلة

            </button>

            <button
              type="button"
              class="at-modal-whatsapp"
              data-modal-whatsapp>

              💬 واتساب

            </button>

          </div>

        </div>

      </div>

    `;

    bindModalEvents();

    modal.classList.add(
      "open"
    );

    document.body.classList.add(
      "at-no-scroll"
    );
  }

  function closeProductModal() {

    if (!modal) {
      return;
    }

    modal.classList.remove(
      "open"
    );

    document.body.classList.remove(
      "at-no-scroll"
    );

    activeProduct =
      null;
  }

  function bindModalEvents() {

    if (!modal) {
      return;
    }

    const minus =
      modal.querySelector(
        "[data-modal-minus]"
      );

    const plus =
      modal.querySelector(
        "[data-modal-plus]"
      );

    const input =
      modal.querySelector(
        "#atModalQuantity"
      );

    const add =
      modal.querySelector(
        "[data-modal-add]"
      );

    const whatsapp =
      modal.querySelector(
        "[data-modal-whatsapp]"
      );

    const wishlistButton =
      modal.querySelector(
        "[data-modal-wishlist]"
      );

    if (minus) {

      minus.onclick =
        () => {

          modalQuantity =
            Math.max(
              1,
              modalQuantity - 1
            );

          if (input) {
            input.value =
              modalQuantity;
          }

        };

    }

    if (plus) {

      plus.onclick =
        () => {

          modalQuantity =
            Math.min(
              MAX_QUANTITY,
              modalQuantity + 1
            );

          if (input) {
            input.value =
              modalQuantity;
          }

        };

    }

    if (input) {

      input.addEventListener(
        "input",
        () => {

          let value =
            Number(
              input.value
            );

          if (
            !Number.isFinite(value)
          ) {
            value = 1;
          }

          value =
            Math.max(
              1,
              Math.min(
                MAX_QUANTITY,
                Math.floor(value)
              )
            );

          modalQuantity =
            value;

          input.value =
            value;

        }
      );

    }

    if (add) {

      add.onclick =
        () => {

          if (
            activeProduct
          ) {

            addToCart(
              activeProduct,
              modalQuantity
            );

            closeProductModal();

          }

        };

    }

    if (whatsapp) {

      whatsapp.onclick =
        () => {

          if (
            activeProduct
          ) {

            openProductWhatsApp(
              activeProduct,
              modalQuantity
            );

          }

        };

    }

    if (wishlistButton) {

      wishlistButton.onclick =
        () => {

          if (
            !activeProduct
          ) {
            return;
          }

          toggleWishlist(
            activeProduct
          );

          const active =
            isInWishlist(
              activeProduct.id
            );

          wishlistButton.classList.toggle(
            "active",
            active
          );

          wishlistButton.textContent =
            active
              ? "♥"
              : "♡";

        };

    }

    modal
      .querySelectorAll(
        "[data-modal-image]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const image =
              button.dataset
                .modalImage;

            const main =
              modal.querySelector(
                "#atModalMainImage"
              );

            if (
              main &&
              image
            ) {

              main.src =
                image;

            }

            modal
              .querySelectorAll(
                ".at-modal-thumb"
              )
              .forEach(
                item =>
                  item.classList.remove(
                    "active"
                  )
              );

            button.classList.add(
              "active"
            );

          }
        );

      });
  }

  /* =========================================================
     PRODUCT WHATSAPP
     ========================================================= */

  function openProductWhatsApp(
    product,
    quantity = 1
  ) {

    const normalized =
      normalizeProduct(product);

    if (!normalized) {
      return;
    }

    const amount =
      Math.max(
        1,
        Math.min(
          MAX_QUANTITY,
          Number(quantity) || 1
        )
      );

    const price =
      getProductPrice(
        normalized
      );

    const message =
      [
        "مرحبًا أبو طارق 👋",
        "",
        "أرغب في طلب:",
        `المنتج: ${normalized.name}`,
        `الكمية: ${amount}`,
        price !== null
          ? `السعر: ${formatPrice(price)}`
          : "",
        "",
        "من موقع أبو طارق."
      ]
        .filter(Boolean)
        .join("\n");

    const url =
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(
        message
      );

    window.open(
      url,
      "_blank",
      "noopener"
    );

    emitFeatureEvent(
      "checkout:product",
      {
        product: normalized,
        quantity: amount
      }
    );
  }

  /* =========================================================
     CART WHATSAPP
     ========================================================= */

  function checkoutWhatsApp() {

    if (!cart.length) {

      showToast(
        "السلة فاضية"
      );

      return;
    }

    const lines = [];

    lines.push(
      "مرحبًا أبو طارق 👋"
    );

    lines.push("");

    lines.push(
      "أرغب في طلب المنتجات التالية:"
    );

    lines.push("");

    cart.forEach(
      (item, index) => {

        const quantity =
          Math.max(
            1,
            Number(item.quantity) || 1
          );

        const price =
          getProductPrice(item);

        let line =
          `${index + 1}. ${item.name} × ${quantity}`;

        if (
          price !== null
        ) {

          line +=
            ` — ${formatPrice(price)}`;

        }

        lines.push(line);

      }
    );

    const total =
      getCartTotal();

    lines.push("");

    if (total > 0) {

      lines.push(
        `الإجمالي التقريبي: ${formatPrice(total)}`
      );

    }

    lines.push("");

    lines.push(
      "الطلب من موقع أبو طارق."
    );

    const url =
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(
        lines.join("\n")
      );

    window.open(
      url,
      "_blank",
      "noopener"
    );

    emitFeatureEvent(
      "checkout:cart",
      {
        cart: cart.map(
          item => ({
            id: item.id,
            quantity:
              item.quantity
          })
        ),
        total
      }
    );
  }

  /* =========================================================
     GLOBAL EVENT BRIDGE
     ========================================================= */

  function emitFeatureEvent(
    name,
    detail
  ) {

    try {

      document.dispatchEvent(
        new CustomEvent(
          "abo:tarek:" + name,
          {
            detail
          }
        )
      );

    } catch (_) {}

  }

  /* =========================================================
     GLOBAL PAGE EVENTS
     ========================================================= */

  function bindGlobalEvents() {

    /*
     * Cart buttons:
     * data-cart-button
     */

    document.addEventListener(
      "click",
      event => {

        const cartButton =
          event.target.closest(
            "[data-cart-button]"
          );

        if (
          cartButton
        ) {

          event.preventDefault();

          openCart();

          return;
        }

        /*
         * Wishlist:
         * data-wishlist-id
         */

        const wishlistButton =
          event.target.closest(
            "[data-wishlist-id]"
          );

        if (
          wishlistButton
        ) {

          event.preventDefault();

          const id =
            wishlistButton.dataset
              .wishlistId;

          const product =
            findProductFromDOM(
              id,
              wishlistButton
            );

          if (product) {

            toggleWishlist(
              product
            );

          }

          return;
        }

        /*
         * Product modal:
         * data-product-modal
         */

        const modalButton =
          event.target.closest(
            "[data-product-modal]"
          );

        if (
          modalButton
        ) {

          event.preventDefault();

          const id =
            modalButton.dataset
              .productModal;

          const product =
            findProductFromDOM(
              id,
              modalButton
            );

          if (product) {

            openProductModal(
              product
            );

          }

        }

      }
    );

    /*
     * Custom event bridge:
     * Allows catalog pages to communicate
     * without creating another cart system.
     */

    document.addEventListener(
      "abo:tarek:add-to-cart",
      event => {

        const product =
          event.detail?.product;

        const quantity =
          event.detail?.quantity ||
          1;

        if (product) {

          addToCart(
            product,
            quantity
          );

        }

      }
    );

    /*
     * ESC closes overlays.
     */

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key !==
          "Escape"
        ) {
          return;
        }

        closeCart();
        closeProductModal();

      }
    );

  }

  /* =========================================================
     DOM PRODUCT RECOVERY
     ========================================================= */

  function findProductFromDOM(
    id,
    element
  ) {

    /*
     * First try product object
     * exposed on the element.
     */

    if (
      element &&
      element._aboTarekProduct
    ) {

      return element
        ._aboTarekProduct;

    }

    /*
     * Try common global collections.
     */

    const collections = [
      window.ABO_TAREK_PRODUCTS,
      window.products,
      window.PRODUCTS
    ];

    for (
      const collection of collections
    ) {

      if (
        !Array.isArray(
          collection
        )
      ) {
        continue;
      }

      const found =
        collection.find(
          item =>
            String(
              item?.id
            ) ===
            String(id)
        );

      if (found) {
        return found;
      }

    }

    /*
     * If no product object is available,
     * build the minimum product from card DOM.
     */

    if (element) {

      const card =
        element.closest(
          "[data-product-id]"
        );

      if (card) {

        const image =
          card.querySelector(
            "img"
          );

        const title =
          card.querySelector(
            ".catalog-product-name, .product-name, h2, h3"
          );

        const category =
          card.querySelector(
            ".catalog-product-category, .product-category"
          );

        if (title) {

          return {

            id,

            name:
              title.textContent
                .trim(),

            category:
              category
                ? category.textContent.trim()
                : "",

            image:
              image
                ? image.src
                : "",

            description:
              "",

            price:
              null,

            oldPrice:
              null,

            offerPrice:
              null,

            isOffer:
              false,

            images:
              image
                ? [image.src]
                : []

          };

        }

      }

    }

    return null;
  }

  /* =========================================================
     FEATURE API
     ========================================================= */

  const API = {

    addToCart,

    removeFromCart,

    changeCartQuantity,

    setCartQuantity,

    clearCart,

    getCartCount,

    getCartTotal,

    getCart:
      () =>
        [...cart],

    openCart,

    closeCart,

    addToWishlist,

    removeFromWishlist,

    toggleWishlist,

    isInWishlist,

    getWishlist:
      () =>
        [...wishlist],

    openProduct:
      openProductModal,

    openProductModal,

    closeProductModal,

    openProductWhatsApp,

    checkoutWhatsApp,

    formatPrice,

    getProductPrice

  };

  /*
   * ONE GLOBAL OBJECT.
   * Other files communicate with this only.
   */

  window.ABO_TAREK_FEATURES =
    API;

  /* =========================================================
     CSS
     ========================================================= */

  function injectStyles() {

    if (
      document.getElementById(
        "aboTarekFeaturesCSS"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "aboTarekFeaturesCSS";

    style.textContent = `

      /* =====================================================
         FEATURE GLOBAL
         ===================================================== */

      body.at-no-scroll {
        overflow: hidden !important;
      }

      /* =====================================================
         TOAST
         ===================================================== */

      .at-feature-toast {
        position: fixed;

        right: 50%;
        bottom: 22px;

        z-index: 100000;

        transform:
          translate(50%, 18px);

        opacity: 0;

        pointer-events: none;

        padding:
          10px 16px;

        border:
          1px solid rgba(212,175,55,.35);

        border-radius: 999px;

        background:
          #071321;

        color:
          #f7f1e4;

        box-shadow:
          0 12px 35px rgba(0,0,0,.35);

        font-family:
          Cairo,
          system-ui,
          sans-serif;

        font-size: 11px;
        font-weight: 800;

        transition:
          opacity .2s ease,
          transform .2s ease;
      }

      .at-feature-toast.show {
        opacity: 1;

        transform:
          translate(50%, 0);
      }

      /* =====================================================
         CART OVERLAY
         ===================================================== */

      .at-cart-overlay,
      .at-product-overlay {

        position: fixed;

        inset: 0;

        z-index: 99990;

        display: flex;

        background:
          rgba(0,0,0,.65);

        opacity: 0;

        pointer-events: none;

        transition:
          opacity .22s ease;

      }

      .at-cart-overlay.open,
      .at-product-overlay.open {

        opacity: 1;

        pointer-events: auto;

      }

      /* =====================================================
         CART
         ===================================================== */

      .at-cart-overlay {

        justify-content:
          flex-start;

      }

      .at-cart-drawer {

        width:
          min(430px, 94vw);

        height: 100%;

        display: flex;
        flex-direction: column;

        background:
          #071321;

        border-left:
          1px solid rgba(212,175,55,.18);

        box-shadow:
          -20px 0 60px rgba(0,0,0,.35);

        transform:
          translateX(-100%);

        transition:
          transform .25s ease;

        direction: rtl;

      }

      .at-cart-overlay.open
      .at-cart-drawer {

        transform:
          translateX(0);

      }

      .at-cart-header {

        min-height: 76px;

        display: flex;

        align-items: center;

        justify-content:
          space-between;

        gap: 12px;

        padding:
          14px 17px;

        border-bottom:
          1px solid rgba(212,175,55,.13);

      }

      .at-cart-title {

        color:
          #f7f1e4;

        font-size:
          18px;

        font-weight:
          900;

      }

      .at-cart-count {

        margin-top:
          2px;

        color:
          #d4af37;

        font-size:
          10px;

        font-weight:
          700;

      }

      .at-cart-close {

        width: 39px;
        height: 39px;

        display: flex;

        align-items: center;
        justify-content: center;

        border:
          1px solid rgba(212,175,55,.18);

        border-radius: 11px;

        background:
          rgba(255,255,255,.035);

        color:
          #f7f1e4;

        cursor:
          pointer;

        font-size:
          22px;

      }

      .at-cart-body {

        flex: 1;

        overflow-y: auto;

        padding:
          13px;

      }

      .at-cart-footer {

        padding:
          12px 13px;

        border-top:
          1px solid rgba(212,175,55,.13);

      }

      /* =====================================================
         CART ITEM
         ===================================================== */

      .at-cart-item {

        display: grid;

        grid-template-columns:
          66px minmax(0,1fr) auto;

        gap: 9px;

        margin-bottom:
          9px;

        padding:
          9px;

        border:
          1px solid rgba(212,175,55,.12);

        border-radius:
          14px;

        background:
          rgba(255,255,255,.035);

      }

      .at-cart-item-image {

        width: 66px;
        height: 66px;

        display: flex;

        align-items: center;
        justify-content: center;

        overflow: hidden;

        border-radius:
          10px;

        background:
          #f7f1e4;

      }

      .at-cart-item-image img {

        width: 100%;
        height: 100%;

        object-fit:
          contain;

        padding:
          5px;

      }

      .at-cart-item-info {

        min-width:
          0;

      }

      .at-cart-item-name {

        color:
          #f7f1e4;

        font-size:
          11px;

        line-height:
          1.55;

        font-weight:
          800;

        display:
          -webkit-box;

        -webkit-line-clamp:
          2;

        -webkit-box-orient:
          vertical;

        overflow:
          hidden;

      }

      .at-cart-item-category {

        margin-top:
          2px;

        color:
          #8996a2;

        font-size:
          8px;

      }

      .at-cart-item-price {

        margin-top:
          3px;

        color:
          #d4af37;

        font-size:
          10px;

        font-weight:
          800;

      }

      .at-cart-item-side {

        display:
          flex;

        flex-direction:
          column;

        align-items:
          flex-end;

        justify-content:
          space-between;

        gap:
          5px;

      }

      .at-cart-item-side strong {

        color:
          #f7f1e4;

        font-size:
          9px;

        white-space:
          nowrap;

      }

      .at-cart-remove {

        width:
          27px;

        height:
          27px;

        border:
          1px solid rgba(255,255,255,.08);

        border-radius:
          8px;

        background:
          rgba(255,255,255,.025);

        color:
          #9ba6b0;

        cursor:
          pointer;

        font-size:
          17px;

      }

      /* =====================================================
         CART QUANTITY
         ===================================================== */

      .at-cart-controls {

        width:
          106px;

        height:
          29px;

        display:
          grid;

        grid-template-columns:
          29px 1fr 29px;

        margin-top:
          6px;

        overflow:
          hidden;

        border:
          1px solid rgba(212,175,55,.15);

        border-radius:
          8px;

      }

      .at-cart-controls button {

        border:
          0;

        background:
          rgba(212,175,55,.07);

        color:
          #d4af37;

        cursor:
          pointer;

        font-weight:
          900;

      }

      .at-cart-controls input {

        width:
          100%;

        min-width:
          0;

        border:
          0;

        outline:
          0;

        background:
          transparent;

        color:
          #f7f1e4;

        text-align:
          center;

        font-size:
          9px;

        font-weight:
          800;

      }

      /* =====================================================
         CART SUMMARY
         ===================================================== */

      .at-cart-summary {

        display:
          grid;

        gap:
          7px;

        margin-bottom:
          9px;

      }

      .at-cart-summary > div {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        color:
          #9ba6b0;

        font-size:
          10px;

      }

      .at-cart-summary strong {

        color:
          #d4af37;

        font-size:
          12px;

      }

      .at-cart-checkout {

        width:
          100%;

        min-height:
          45px;

        border:
          1px solid #d4af37;

        border-radius:
          11px;

        background:
          #d4af37;

        color:
          #071321;

        cursor:
          pointer;

        font-size:
          11px;

        font-weight:
          900;

      }

      .at-cart-clear {

        width:
          100%;

        margin-top:
          6px;

        min-height:
          35px;

        border:
          1px solid rgba(212,175,55,.13);

        border-radius:
          9px;

        background:
          transparent;

        color:
          #8996a2;

        cursor:
          pointer;

        font-size:
          9px;

        font-weight:
          700;

      }

      /* =====================================================
         EMPTY
         ===================================================== */

      .at-cart-empty {

        min-height:
          270px;

        display:
          flex;

        flex-direction:
          column;

        align-items:
          center;

        justify-content:
          center;

        text-align:
          center;

        color:
          #8996a2;

      }

      .at-cart-empty-icon {

        margin-bottom:
          9px;

        font-size:
          35px;

      }

      .at-cart-empty strong {

        color:
          #f7f1e4;

        font-size:
          14px;

      }

      .at-cart-empty span {

        margin-top:
          5px;

        font-size:
          10px;

      }

      /* =====================================================
         PRODUCT MODAL
         ===================================================== */

      .at-product-overlay {

        align-items:
          center;

        justify-content:
          center;

        padding:
          15px;

        overflow-y:
          auto;

      }

      .at-product-modal {

        position:
          relative;

        width:
          min(920px, 100%);

        max-height:
          calc(100vh - 30px);

        overflow-y:
          auto;

        border:
          1px solid rgba(212,175,55,.18);

        border-radius:
          20px;

        background:
          #f7f1e4;

        color:
          #071321;

        box-shadow:
          0 30px 90px rgba(0,0,0,.45);

        direction:
          rtl;

      }

      .at-product-close {

        position:
          absolute;

        top:
          11px;

        left:
          11px;

        z-index:
          10;

        width:
          39px;

        height:
          39px;

        display:
          flex;

        align-items:
          center;

        justify-content:
          center;

        border:
          1px solid rgba(7,19,33,.12);

        border-radius:
          50%;

        background:
          rgba(247,241,228,.93);

        color:
          #071321;

        cursor:
          pointer;

        font-size:
          22px;

      }

      .at-modal-product {

        display:
          grid;

        grid-template-columns:
          minmax(0, 1fr)
          minmax(0, 1fr);

        gap:
          0;

      }

      .at-modal-image {

        position:
          relative;

        min-height:
          430px;

        display:
          flex;

        align-items:
          center;

        justify-content:
          center;

        background:
          #f7f1e4;

        overflow:
          hidden;

        border-radius:
          20px 0 0 20px;

      }

      .at-modal-image > img {

        width:
          100%;

        height:
          100%;

        max-height:
          520px;

        padding:
          30px;

        object-fit:
          contain;

      }

      .at-modal-offer {

        position:
          absolute;

        top:
          14px;

        right:
          14px;

        z-index:
          5;

        padding:
          5px 10px;

        border-radius:
          999px;

        background:
          #d4af37;

        color:
          #071321;

        font-size:
          10px;

        font-weight:
          900;

      }

      .at-modal-wishlist {

        position:
          absolute;

        top:
          12px;

        left:
          12px;

        z-index:
          5;

        width:
          40px;

        height:
          40px;

        border:
          1px solid rgba(7,19,33,.12);

        border-radius:
          50%;

        background:
          rgba(255,255,255,.8);

        color:
          #071321;

        cursor:
          pointer;

        font-size:
          18px;

      }

      .at-modal-wishlist.active {

        color:
          #b08c1c;

      }

      .at-modal-thumbnails {

        position:
          absolute;

        left:
          15px;

        bottom:
          15px;

        z-index:
          5;

        display:
          flex;

        gap:
          6px;

        max-width:
          calc(100% - 30px);

        overflow-x:
          auto;

      }

      .at-modal-thumb {

        width:
          53px;

        height:
          53px;

        flex:
          0 0 53px;

        padding:
          3px;

        border:
          1px solid rgba(7,19,33,.12);

        border-radius:
          8px;

        background:
          #f7f1e4;

        cursor:
          pointer;

      }

      .at-modal-thumb.active {

        border-color:
          #d4af37;

      }

      .at-modal-thumb img {

        width:
          100%;

        height:
          100%;

        object-fit:
          contain;

      }

      /* =====================================================
         MODAL INFO
         ===================================================== */

      .at-modal-info {

        padding:
          34px 30px;

        background:
          #071321;

        color:
          #f7f1e4;

        border-radius:
          0 20px 20px 0;

      }

      .at-modal-category {

        color:
          #d4af37;

        font-size:
          11px;

        font-weight:
          800;

      }

      .at-modal-info h2 {

        margin:
          8px 0 0;

        color:
          #f7f1e4;

        font-size:
          clamp(22px, 4vw, 34px);

        line-height:
          1.4;

      }

      .at-modal-info p {

        margin:
          12px 0 0;

        color:
          #aeb9c4;

        font-size:
          12px;

        line-height:
          1.9;

      }

      .at-modal-price {

        display:
          flex;

        align-items:
          center;

        flex-wrap:
          wrap;

        gap:
          9px;

        margin-top:
          17px;

      }

      .at-modal-price strong {

        color:
          #d4af37;

        font-size:
          22px;

        font-weight:
          900;

      }

      .at-modal-price del {

        color:
          #84919d;

        font-size:
          11px;

      }

      /* =====================================================
         MODAL QUANTITY
         ===================================================== */

      .at-modal-quantity {

        margin-top:
          17px;

      }

      .at-modal-quantity > span {

        display:
          block;

        margin-bottom:
          7px;

        color:
          #f7f1e4;

        font-size:
          11px;

        font-weight:
          800;

      }

      .at-modal-quantity > div {

        width:
          135px;

        height:
          41px;

        display:
          grid;

        grid-template-columns:
          38px 1fr 38px;

        overflow:
          hidden;

        border:
          1px solid rgba(212,175,55,.18);

        border-radius:
          10px;

      }

      .at-modal-quantity button {

        border:
          0;

        background:
          rgba(212,175,55,.07);

        color:
          #d4af37;

        cursor:
          pointer;

        font-size:
          17px;

        font-weight:
          900;

      }

      .at-modal-quantity input {

        width:
          100%;

        border:
          0;

        outline:
          0;

        background:
          transparent;

        color:
          #f7f1e4;

        text-align:
          center;

        font-size:
          12px;

        font-weight:
          800;

      }

      /* =====================================================
         MODAL ACTIONS
         ===================================================== */

      .at-modal-actions {

        display:
          grid;

        grid-template-columns:
          1fr 1fr;

        gap:
          8px;

        margin-top:
          17px;

      }

      .at-modal-actions button {

        min-height:
          47px;

        border-radius:
          11px;

        cursor:
          pointer;

        font-size:
          11px;

        font-weight:
          900;

      }

      .at-modal-add {

        border:
          1px solid #d4af37;

        background:
          #d4af37;

        color:
          #071321;

      }

      .at-modal-whatsapp {

        border:
          1px solid rgba(212,175,55,.2);

        background:
          rgba(255,255,255,.035);

        color:
          #f7f1e4;

      }

      /* =====================================================
         MOBILE
         ===================================================== */

      @media (max-width: 700px) {

        .at-cart-drawer {

          width:
            min(430px, 96vw);

        }

        .at-product-overlay {

          padding:
            8px;

          align-items:
            flex-start;

        }

        .at-product-modal {

          max-height:
            calc(100vh - 16px);

          border-radius:
            16px;

        }

        .at-modal-product {

          grid-template-columns:
            1fr;

        }

        .at-modal-image {

          min-height:
            280px;

          height:
            70vw;

          max-height:
            390px;

          border-radius:
            16px 16px 0 0;

        }

        .at-modal-image > img {

          padding:
            18px;

        }

        .at-modal-info {

          padding:
            22px 17px;

          border-radius:
            0 0 16px 16px;

        }

        .at-modal-info h2 {

          font-size:
            23px;

        }

        .at-modal-actions {

          grid-template-columns:
            1fr;

        }

      }

      @media (max-width: 420px) {

        .at-cart-item {

          grid-template-columns:
            57px minmax(0,1fr) auto;

        }

        .at-cart-item-image {

          width:
            57px;

          height:
            57px;

        }

        .at-cart-item-name {

          font-size:
            10px;

        }

        .at-cart-controls {

          width:
            98px;

        }

      }

      @media (prefers-reduced-motion: reduce) {

        .at-feature-toast,
        .at-cart-overlay,
        .at-cart-drawer,
        .at-product-overlay {

          transition:
            none !important;

        }

      }

    `;

    document.head.appendChild(
      style
    );
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {

    loadStorage();

    injectStyles();

    createCartDrawer();

    createProductModal();

    bindGlobalEvents();

    updateCartUI();

    updateWishlistUI();

    /*
     * Make current state available
     * for analytics / other modules.
     */

    window.ABO_TAREK_CART =
      cart;

    window.ABO_TAREK_WISHLIST =
      wishlist;
  }

  /*
   * Run once only.
   */

  if (
    !window.__ABO_TAREK_FEATURES_INITIALIZED
  ) {

    window.__ABO_TAREK_FEATURES_INITIALIZED =
      true;

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

  }

})();
