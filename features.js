/* =========================================================
   ABO TAREK STORE
   FEATURES ENGINE
   PREMIUM / STABLE EDITION
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const CFG =
    window.ABO_TAREK_CONFIG ||
    window.ABO_TAREK ||
    {};

  const STORAGE = {
    cart:
      CFG?.CACHE_KEYS?.cart ||
      "abo_tarek_cart_v1",

    wishlist:
      CFG?.CACHE_KEYS?.wishlist ||
      "abo_tarek_wishlist_v1",

    recent:
      CFG?.CACHE_KEYS?.recent ||
      "abo_tarek_recent_v1"
  };

  const MAX_QTY =
    Number(
      CFG?.PRODUCTS?.maxCartQuantity ||
      CFG?.CART?.maxQuantity ||
      99
    ) || 99;

  const WHATSAPP_NUMBER =
    typeof CFG?.getWhatsAppNumber === "function"
      ? CFG.getWhatsAppNumber()
      : String(
          CFG?.WHATSAPP_NUMBER ||
          "201551604163"
        ).replace(/\D/g, "");


  /* =========================================================
     STATE
     ========================================================= */

  const state = {
    cart: [],
    wishlist: [],
    recent: [],
    products: [],
    drawerOpen: false,
    wishlistOpen: false,
    initialized: false
  };


  /* =========================================================
     DOM HELPERS
     ========================================================= */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(
      root.querySelectorAll(selector)
    );


  /* =========================================================
     SAFE STORAGE
     ========================================================= */

  function readStorage(key, fallback = []) {

    try {

      const raw =
        localStorage.getItem(key);

      if (!raw) {
        return fallback;
      }

      const value =
        JSON.parse(raw);

      return value ?? fallback;

    } catch (_) {

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

    } catch (_) {

      return false;

    }

  }


  function loadStorage() {

    const cart =
      readStorage(
        STORAGE.cart,
        []
      );

    const wishlist =
      readStorage(
        STORAGE.wishlist,
        []
      );

    const recent =
      readStorage(
        STORAGE.recent,
        []
      );


    state.cart =
      Array.isArray(cart)
        ? cart
        : [];


    state.wishlist =
      Array.isArray(wishlist)
        ? wishlist
        : [];


    state.recent =
      Array.isArray(recent)
        ? recent
        : [];

  }


  /* =========================================================
     GENERAL HELPERS
     ========================================================= */

  function escapeHtml(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function productId(product) {

    if (!product) {
      return "";
    }

    return String(
      product.id ??
      product._id ??
      product.productId ??
      ""
    ).trim();

  }


  function normalizeProduct(product) {

    if (!product) {
      return null;
    }

    const id =
      productId(product);

    if (!id) {
      return null;
    }


    return {
      ...product,

      id,

      name:
        String(
          product.name ||
          "منتج أبو طارق"
        ).trim(),

      category:
        String(
          product.category ||
          ""
        ).trim(),

      image:
        String(
          product.image ||
          product.images?.[0] ||
          ""
        ).trim(),

      description:
        String(
          product.description ||
          ""
        ).trim(),

      price:
        Number(
          product.price ||
          0
        ) || 0,

      oldPrice:
        Number(
          product.oldPrice ||
          0
        ) || 0,

      offerPrice:
        Number(
          product.offerPrice ||
          0
        ) || 0,

      active:
        product.active !== false,

      isOffer:
        product.isOffer === true ||
        product.isOffer === "true" ||
        Number(
          product.offerPrice ||
          0
        ) > 0

    };

  }


  function normalizeQuantity(value) {

    let qty =
      Number(value);

    if (!Number.isFinite(qty)) {
      qty = 1;
    }

    qty =
      Math.round(qty);

    return Math.max(
      1,
      Math.min(
        MAX_QTY,
        qty
      )
    );

  }


  function resolveImage(image) {

    if (!image) {
      return "./assets/storefront.jpg";
    }

    try {

      if (
        typeof CFG.resolveImageUrl ===
        "function"
      ) {

        return CFG.resolveImageUrl(
          image
        );

      }

    } catch (_) {}

    return String(image);

  }


  function getPrice(product) {

    if (!product) {
      return 0;
    }


    try {

      if (
        typeof CFG.getProductPrice ===
        "function"
      ) {

        const value =
          Number(
            CFG.getProductPrice(
              product
            )
          );

        if (
          Number.isFinite(value) &&
          value > 0
        ) {
          return value;
        }

      }

    } catch (_) {}


    if (
      product.isOffer &&
      Number(product.offerPrice) > 0
    ) {

      return Number(
        product.offerPrice
      );

    }


    if (
      Number(product.price) > 0
    ) {

      return Number(
        product.price
      );

    }


    return 0;

  }


  function formatPrice(value) {

    const number =
      Number(value);

    if (
      !Number.isFinite(number) ||
      number <= 0
    ) {

      return "";

    }


    try {

      if (
        typeof CFG.formatPrice ===
        "function"
      ) {

        return CFG.formatPrice(
          number
        );

      }

    } catch (_) {}


    return (
      number.toLocaleString("ar-EG") +
      " ج.م"
    );

  }


  /* =========================================================
     CART
     ========================================================= */

  function normalizeCartItem(item) {

    if (!item) {
      return null;
    }

    const id =
      productId(item);

    if (!id) {
      return null;
    }


    return {
      id,

      name:
        String(
          item.name ||
          "منتج"
        ),

      category:
        String(
          item.category ||
          ""
        ),

      image:
        String(
          item.image ||
          ""
        ),

      price:
        Number(
          item.price ||
          0
        ) || 0,

      quantity:
        normalizeQuantity(
          item.quantity
        )
    };

  }


  function saveCart() {

    writeStorage(
      STORAGE.cart,
      state.cart
    );

    updateCartUI();

  }


  function findCartItem(id) {

    return state.cart.find(
      item =>
        String(item.id) ===
        String(id)
    );

  }


  function addToCart(
    product,
    quantity = 1
  ) {

    const normalized =
      normalizeProduct(
        product
      );

    if (!normalized) {
      return false;
    }


    const id =
      normalized.id;

    const qty =
      normalizeQuantity(
        quantity
      );


    const existing =
      findCartItem(id);


    if (existing) {

      existing.quantity =
        normalizeQuantity(
          Number(
            existing.quantity ||
            0
          ) + qty
        );

    } else {

      state.cart.push({

        id,

        name:
          normalized.name,

        category:
          normalized.category,

        image:
          normalized.image,

        price:
          getPrice(
            normalized
          ),

        quantity:
          qty

      });

    }


    saveCart();

    addRecent(
      normalized
    );

    dispatch(
      "abo-tarek:cart-updated",
      {
        cart:
          [...state.cart]
      }
    );

    toast(
      "تمت إضافة المنتج للسلة 🛒"
    );

    openCart();

    return true;

  }


  function updateCartQuantity(
    id,
    quantity
  ) {

    const item =
      findCartItem(id);

    if (!item) {
      return false;
    }


    item.quantity =
      normalizeQuantity(
        quantity
      );


    saveCart();


    dispatch(
      "abo-tarek:cart-updated",
      {
        cart:
          [...state.cart]
      }
    );


    return true;

  }


  function removeFromCart(id) {

    const before =
      state.cart.length;


    state.cart =
      state.cart.filter(
        item =>
          String(item.id) !==
          String(id)
      );


    if (
      state.cart.length ===
      before
    ) {
      return false;
    }


    saveCart();


    dispatch(
      "abo-tarek:cart-updated",
      {
        cart:
          [...state.cart]
      }
    );


    toast(
      "تم حذف المنتج من السلة"
    );


    return true;

  }


  function clearCart() {

    state.cart = [];

    saveCart();


    dispatch(
      "abo-tarek:cart-updated",
      {
        cart: []
      }
    );


    toast(
      "تم تفريغ السلة"
    );

  }


  function getCartCount() {

    return state.cart.reduce(
      (total, item) =>
        total +
        normalizeQuantity(
          item.quantity
        ),
      0
    );

  }


  function getCartTotal() {

    return state.cart.reduce(
      (total, item) => {

        const price =
          Number(
            item.price ||
            0
          );

        const qty =
          normalizeQuantity(
            item.quantity
          );

        return (
          total +
          price * qty
        );

      },
      0
    );

  }


  /* =========================================================
     WISHLIST
     ========================================================= */

  function wishlistIds() {

    return state.wishlist.map(
      item =>
        String(
          item.id ??
          item
        )
    );

  }


  function isInWishlist(product) {

    const id =
      productId(product);

    return wishlistIds().includes(
      id
    );

  }


  function saveWishlist() {

    writeStorage(
      STORAGE.wishlist,
      state.wishlist
    );

    updateWishlistUI();

  }


  function toggleWishlist(
    product
  ) {

    const normalized =
      normalizeProduct(
        product
      );

    if (!normalized) {
      return false;
    }


    const id =
      normalized.id;


    const index =
      state.wishlist.findIndex(
        item =>
          String(item.id) ===
          id
      );


    if (index >= 0) {

      state.wishlist.splice(
        index,
        1
      );

      saveWishlist();

      toast(
        "تم حذف المنتج من المفضلة"
      );

      dispatch(
        "abo-tarek:wishlist-updated",
        {
          wishlist:
            [...state.wishlist]
        }
      );

      return false;

    }


    state.wishlist.push({

      id,

      name:
        normalized.name,

      category:
        normalized.category,

      image:
        normalized.image,

      price:
        getPrice(
          normalized
        )

    });


    saveWishlist();


    toast(
      "تمت إضافة المنتج للمفضلة ♡"
    );


    dispatch(
      "abo-tarek:wishlist-updated",
      {
        wishlist:
          [...state.wishlist]
      }
    );


    return true;

  }


  function removeFromWishlist(
    id
  ) {

    state.wishlist =
      state.wishlist.filter(
        item =>
          String(item.id) !==
          String(id)
      );


    saveWishlist();

    updateWishlistUI();

  }


  /* =========================================================
     RECENT PRODUCTS
     ========================================================= */

  function saveRecent() {

    writeStorage(
      STORAGE.recent,
      state.recent
    );

  }


  function addRecent(product) {

    const normalized =
      normalizeProduct(
        product
      );

    if (!normalized) {
      return;
    }


    const id =
      normalized.id;


    state.recent =
      state.recent.filter(
        item =>
          String(item.id) !==
          id
      );


    state.recent.unshift({

      id,

      name:
        normalized.name,

      category:
        normalized.category,

      image:
        normalized.image,

      price:
        getPrice(
          normalized
        )

    });


    state.recent =
      state.recent.slice(
        0,
        10
      );


    saveRecent();

  }


  /* =========================================================
     WHATSAPP
     ========================================================= */

  function buildWhatsAppUrl() {

    if (!state.cart.length) {

      return (
        "https://wa.me/" +
        WHATSAPP_NUMBER
      );

    }


    let message =
      "مرحبًا أبو طارق، أريد طلب المنتجات التالية:%0A%0A";


    state.cart.forEach(
      (item, index) => {

        const price =
          Number(
            item.price ||
            0
          );

        const quantity =
          normalizeQuantity(
            item.quantity
          );


        message +=
          (
            index + 1
          ) +
          ". " +
          encodeURIComponent(
            item.name
          ) +
          " × " +
          quantity;


        if (price > 0) {

          message +=
            " — " +
            encodeURIComponent(
              formatPrice(price)
            );

        }


        message +=
          "%0A";

      }
    );


    const total =
      getCartTotal();


    if (total > 0) {

      message +=
        "%0Aالإجمالي التقريبي: " +
        encodeURIComponent(
          formatPrice(total)
        );

    }


    message +=
      "%0A%0Aمن فضلك أكد لي الطلب والتفاصيل.";


    return (
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      message
    );

  }


  /* =========================================================
     CART DRAWER
     ========================================================= */

  function ensureCartDrawer() {

    let drawer =
      document.getElementById(
        "aboTarekCartDrawer"
      );

    if (drawer) {
      return drawer;
    }


    drawer =
      document.createElement(
        "aside"
      );


    drawer.id =
      "aboTarekCartDrawer";


    drawer.className =
      "abo-cart-drawer";


    drawer.setAttribute(
      "aria-hidden",
      "true"
    );


    drawer.innerHTML = `

      <div
        class="abo-cart-overlay"
        data-cart-close
      ></div>

      <div class="abo-cart-panel">

        <div class="abo-cart-header">

          <div>

            <span class="abo-cart-kicker">
              أبو طارق
            </span>

            <h2>
              سلة المشتريات
            </h2>

          </div>

          <button
            type="button"
            class="abo-cart-close"
            data-cart-close
            aria-label="إغلاق السلة"
          >
            ×
          </button>

        </div>


        <div
          class="abo-cart-body"
          id="aboCartItems"
        >
        </div>


        <div class="abo-cart-footer">

          <div class="abo-cart-summary">

            <span>
              الإجمالي
            </span>

            <strong
              id="aboCartTotal"
            >
              —
            </strong>

          </div>


          <a
            class="abo-cart-whatsapp"
            id="aboCartWhatsApp"
            href="#"
            target="_blank"
            rel="noopener"
          >
            💬 إتمام الطلب عبر واتساب
          </a>


          <button
            type="button"
            class="abo-cart-clear"
            id="aboCartClear"
          >
            تفريغ السلة
          </button>

        </div>

      </div>
    `;


    document.body.appendChild(
      drawer
    );


    drawer.addEventListener(
      "click",
      event => {

        const close =
          event.target.closest(
            "[data-cart-close]"
          );

        if (close) {
          closeCart();
          return;
        }


        const minus =
          event.target.closest(
            "[data-cart-minus]"
          );

        if (minus) {

          const id =
            minus.dataset.cartMinus;

          const item =
            findCartItem(id);

          if (item) {

            updateCartQuantity(
              id,
              item.quantity - 1
            );

            renderCart();

          }

          return;

        }


        const plus =
          event.target.closest(
            "[data-cart-plus]"
          );

        if (plus) {

          const id =
            plus.dataset.cartPlus;

          const item =
            findCartItem(id);

          if (item) {

            updateCartQuantity(
              id,
              item.quantity + 1
            );

            renderCart();

          }

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

          renderCart();

          return;

        }

      }
    );


    const clearButton =
      drawer.querySelector(
        "#aboCartClear"
      );


    if (clearButton) {

      clearButton.addEventListener(
        "click",
        () => {

          if (
            !state.cart.length
          ) {
            return;
          }


          clearCart();

          renderCart();

        }
      );

    }


    const whatsapp =
      drawer.querySelector(
        "#aboCartWhatsApp"
      );


    if (whatsapp) {

      whatsapp.addEventListener(
        "click",
        () => {

          whatsapp.href =
            buildWhatsAppUrl();

        }
      );

    }


    return drawer;

  }


  function renderCart() {

    const drawer =
      ensureCartDrawer();


    const items =
      drawer.querySelector(
        "#aboCartItems"
      );


    const total =
      drawer.querySelector(
        "#aboCartTotal"
      );


    const whatsapp =
      drawer.querySelector(
        "#aboCartWhatsApp"
      );


    if (!items) {
      return;
    }


    if (!state.cart.length) {

      items.innerHTML = `

        <div class="abo-cart-empty">

          <div>
            🛒
          </div>

          <h3>
            السلة فاضية
          </h3>

          <p>
            اختار المنتجات اللي محتاجها وهتظهر هنا.
          </p>

          <a
            href="./sections.html"
            data-cart-close
          >
            تصفح كل الأصناف
          </a>

        </div>

      `;

    } else {

      items.innerHTML =
        state.cart.map(
          item =>
            renderCartItem(
              item
            )
        ).join("");

    }


    if (total) {

      const cartTotal =
        getCartTotal();


      total.textContent =
        cartTotal > 0
          ? formatPrice(
              cartTotal
            )
          : "حسب السعر";

    }


    if (whatsapp) {

      whatsapp.href =
        buildWhatsAppUrl();

      whatsapp.style.pointerEvents =
        state.cart.length
          ? "auto"
          : "none";

      whatsapp.style.opacity =
        state.cart.length
          ? "1"
          : ".45";

    }


    updateCartBadge();

  }


  function renderCartItem(item) {

    const id =
      escapeHtml(
        item.id
      );

    const image =
      escapeHtml(
        resolveImage(
          item.image
        )
      );

    const name =
      escapeHtml(
        item.name
      );

    const category =
      escapeHtml(
        item.category
      );

    const price =
      Number(
        item.price ||
        0
      );


    return `

      <article
        class="abo-cart-item"
        data-cart-id="${id}"
      >

        <a
          href="./product.html?id=${encodeURIComponent(item.id)}"
          class="abo-cart-item-image"
        >

          <img
            src="${image}"
            alt="${name}"
            loading="lazy"
            decoding="async"
            width="100"
            height="100"
          >

        </a>


        <div class="abo-cart-item-content">

          <div class="abo-cart-item-top">

            <div>

              ${
                category
                  ? `
                    <span class="abo-cart-item-category">
                      ${category}
                    </span>
                  `
                  : ""
              }

              <h3>
                ${name}
              </h3>

            </div>


            <button
              type="button"
              class="abo-cart-remove"
              data-cart-remove="${id}"
              aria-label="حذف المنتج"
            >
              ×
            </button>

          </div>


          <div class="abo-cart-item-bottom">

            <div class="abo-cart-qty">

              <button
                type="button"
                data-cart-minus="${id}"
                aria-label="تقليل الكمية"
              >
                −
              </button>

              <strong>
                ${normalizeQuantity(
                  item.quantity
                )}
              </strong>

              <button
                type="button"
                data-cart-plus="${id}"
                aria-label="زيادة الكمية"
              >
                +
              </button>

            </div>


            <div class="abo-cart-item-price">

              ${
                price > 0
                  ? escapeHtml(
                      formatPrice(price)
                    )
                  : "السعر حسب الطلب"
              }

            </div>

          </div>

        </div>

      </article>

    `;

  }


  function openCart() {

    const drawer =
      ensureCartDrawer();


    renderCart();


    drawer.classList.add(
      "is-open"
    );


    drawer.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.classList.add(
      "abo-cart-open"
    );


    state.drawerOpen =
      true;

  }


  function closeCart() {

    const drawer =
      document.getElementById(
        "aboTarekCartDrawer"
      );


    if (!drawer) {
      return;
    }


    drawer.classList.remove(
      "is-open"
    );


    drawer.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.classList.remove(
      "abo-cart-open"
    );


    state.drawerOpen =
      false;

  }


  function updateCartBadge() {

    const count =
      getCartCount();


    $$(
      "[data-cart-count], .cart-count, #cartCount"
    ).forEach(
      badge => {

        badge.textContent =
          String(count);


        badge.hidden =
          count <= 0;

      }
    );


    $$(
      "[data-open-cart], #openCart, .cart-button"
    ).forEach(
      button => {

        if (
          !button.dataset
            .cartBound
        ) {

          button.dataset
            .cartBound =
            "true";

        }

      }
    );

  }


  function updateCartUI() {

    updateCartBadge();

    if (state.drawerOpen) {
      renderCart();
    }

  }


  /* =========================================================
     WISHLIST UI
     ========================================================= */

  function updateWishlistUI() {

    const ids =
      new Set(
        wishlistIds()
      );


    $$(
      "[data-wishlist-id]"
    ).forEach(
      button => {

        const id =
          String(
            button.dataset
              .wishlistId
          );


        const active =
          ids.has(id);


        button.classList.toggle(
          "is-active",
          active
        );


        button.setAttribute(
          "aria-pressed",
          String(active)
        );


        const label =
          button.querySelector(
            "[data-wishlist-label]"
          );


        if (label) {

          label.textContent =
            active
              ? "في المفضلة"
              : "إضافة للمفضلة";

        }

      }
    );


    $$(
      "[data-wishlist-count]"
    ).forEach(
      badge => {

        badge.textContent =
          String(
            state.wishlist.length
          );

        badge.hidden =
          state.wishlist.length === 0;

      }
    );

  }


  /* =========================================================
     TOAST
     ========================================================= */

  function ensureToastContainer() {

    let container =
      document.getElementById(
        "aboTarekToastContainer"
      );


    if (container) {
      return container;
    }


    container =
      document.createElement(
        "div"
      );


    container.id =
      "aboTarekToastContainer";


    container.className =
      "abo-toast-container";


    container.setAttribute(
      "aria-live",
      "polite"
    );


    document.body.appendChild(
      container
    );


    return container;

  }


  function toast(message) {

    try {

      if (
        typeof window.ABO_TAREK_TOAST ===
        "function"
      ) {

        window.ABO_TAREK_TOAST(
          message
        );

        return;

      }

    } catch (_) {}


    const container =
      ensureToastContainer();


    const item =
      document.createElement(
        "div"
      );


    item.className =
      "abo-toast";


    item.textContent =
      String(message);


    container.appendChild(
      item
    );


    requestAnimationFrame(
      () => {

        item.classList.add(
          "is-visible"
        );

      }
    );


    setTimeout(
      () => {

        item.classList.remove(
          "is-visible"
        );


        setTimeout(
          () => {

            item.remove();

          },
          250
        );

      },
      2500
    );

  }


  /* =========================================================
     CUSTOM EVENTS
     ========================================================= */

  function dispatch(
    name,
    detail = {}
  ) {

    try {

      document.dispatchEvent(
        new CustomEvent(
          name,
          {
            detail
          }
        )
      );

    } catch (_) {}

  }


  /* =========================================================
     BUTTON EVENT HANDLING
     ========================================================= */

  function bindGlobalClicks() {

    document.addEventListener(
      "click",
      event => {

        const cartButton =
          event.target.closest(
            "[data-open-cart]"
          );


        if (cartButton) {

          event.preventDefault();

          openCart();

          return;

        }


        const wishlistButton =
          event.target.closest(
            "[data-wishlist-id]"
          );


        if (wishlistButton) {

          event.preventDefault();


          const id =
            wishlistButton.dataset
              .wishlistId;


          const product =
            findProductById(
              id
            );


          if (product) {

            toggleWishlist(
              product
            );

          }

          return;

        }


        const quickAdd =
          event.target.closest(
            "[data-add-cart-id]"
          );


        if (quickAdd) {

          event.preventDefault();


          const id =
            quickAdd.dataset
              .addCartId;


          const product =
            findProductById(
              id
            );


          if (product) {

            const quantity =
              normalizeQuantity(
                quickAdd.dataset
                  .quantity ||
                1
              );


            addToCart(
              product,
              quantity
            );

          }

          return;

        }

      }
    );

  }


  /* =========================================================
     PRODUCT DATA
     ========================================================= */

  function findProductById(id) {

    const target =
      String(id);


    const source =
      state.products;


    const product =
      source.find(
        item =>
          String(
            productId(item)
          ) === target
      );


    if (product) {
      return normalizeProduct(
        product
      );
    }


    /*
      Also try data exposed by app.js.
    */

    try {

      const app =
        window.ABO_TAREK_APP;


      if (
        app &&
        typeof app.getProducts ===
        "function"
      ) {

        const products =
          app.getProducts() ||
          [];


        const found =
          products.find(
            item =>
              String(
                productId(item)
              ) === target
          );


        if (found) {

          return normalizeProduct(
            found
          );

        }

      }

    } catch (_) {}


    return null;

  }


  function syncProducts() {

    try {

      const app =
        window.ABO_TAREK_APP;


      if (
        app &&
        typeof app.getProducts ===
        "function"
      ) {

        const products =
          app.getProducts();


        if (
          Array.isArray(products)
        ) {

          state.products =
            products
              .map(
                normalizeProduct
              )
              .filter(Boolean);

          return;

        }

      }

    } catch (_) {}


    /*
      Fallback to cached products.
    */

    try {

      const key =
        CFG?.CACHE_KEYS?.products ||
        "abo_tarek_products_v14";


      const raw =
        localStorage.getItem(
          key
        );


      if (!raw) {
        return;
      }


      const data =
        JSON.parse(raw);


      const products =
        Array.isArray(data)
          ? data
          : data?.products;


      if (
        Array.isArray(products)
      ) {

        state.products =
          products
            .map(
              normalizeProduct
            )
            .filter(Boolean);

      }

    } catch (_) {}

  }


  /* =========================================================
     RECENT PRODUCTS UI
     ========================================================= */

  function renderRecentProducts(
    container
  ) {

    if (!container) {
      return;
    }


    const recentIds =
      state.recent.map(
        item =>
          String(item.id)
      );


    const products =
      recentIds
        .map(
          id =>
            findProductById(id)
        )
        .filter(Boolean)
        .slice(0, 6);


    if (!products.length) {

      container.innerHTML =
        "";

      return;

    }


    container.innerHTML =
      products.map(
        product =>
          renderMiniProduct(
            product
          )
      ).join("");


  }


  function renderMiniProduct(
    product
  ) {

    const id =
      escapeHtml(
        product.id
      );

    const name =
      escapeHtml(
        product.name
      );

    const image =
      escapeHtml(
        resolveImage(
          product.image
        )
      );

    const price =
      getPrice(product);


    return `

      <article class="abo-mini-product">

        <a
          href="./product.html?id=${encodeURIComponent(product.id)}"
          class="abo-mini-product-image"
        >

          <img
            src="${image}"
            alt="${name}"
            loading="lazy"
            decoding="async"
            width="180"
            height="180"
          >

        </a>


        <div class="abo-mini-product-content">

          <h3>

            <a
              href="./product.html?id=${encodeURIComponent(product.id)}"
            >
              ${name}
            </a>

          </h3>


          ${
            price > 0
              ? `
                <strong>
                  ${escapeHtml(
                    formatPrice(price)
                  )}
                </strong>
              `
              : ""
          }

        </div>

      </article>

    `;

  }


  function refreshRecentSections() {

    $$(
      "[data-recent-products], #recentlyViewedGrid"
    ).forEach(
      container =>
        renderRecentProducts(
          container
        )
    );

  }


  /* =========================================================
     PRODUCT MODAL
     ========================================================= */

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
      "abo-product-modal";


    modal.setAttribute(
      "aria-hidden",
      "true"
    );


    modal.innerHTML = `

      <div
        class="abo-product-modal-overlay"
        data-product-modal-close
      ></div>

      <div
        class="abo-product-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aboProductModalTitle"
      >

        <button
          type="button"
          class="abo-product-modal-close"
          data-product-modal-close
          aria-label="إغلاق"
        >
          ×
        </button>


        <div
          id="aboProductModalContent"
        >
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
            "[data-product-modal-close]"
          )
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

    const normalized =
      normalizeProduct(
        product
      );


    if (!normalized) {
      return;
    }


    const modal =
      ensureProductModal();


    const content =
      modal.querySelector(
        "#aboProductModalContent"
      );


    if (!content) {
      return;
    }


    const image =
      escapeHtml(
        resolveImage(
          normalized.image
        )
      );

    const name =
      escapeHtml(
        normalized.name
      );

    const category =
      escapeHtml(
        normalized.category
      );

    const description =
      escapeHtml(
        normalized.description
      );

    const price =
      getPrice(
        normalized
      );


    content.innerHTML = `

      <div class="abo-product-modal-grid">

        <div class="abo-product-modal-image">

          <img
            src="${image}"
            alt="${name}"
            width="700"
            height="600"
            decoding="async"
          >

        </div>


        <div class="abo-product-modal-info">

          ${
            category
              ? `
                <span class="abo-product-modal-category">
                  ${category}
                </span>
              `
              : ""
          }


          <h2 id="aboProductModalTitle">
            ${name}
          </h2>


          ${
            description
              ? `
                <p>
                  ${description}
                </p>
              `
              : ""
          }


          ${
            price > 0
              ? `
                <div class="abo-product-modal-price">
                  ${escapeHtml(
                    formatPrice(price)
                  )}
                </div>
              `
              : `
                <div class="abo-product-modal-no-price">
                  للاستفسار عن السعر تواصل معنا.
                </div>
              `
          }


          <div class="abo-product-modal-actions">

            <button
              type="button"
              class="btn-primary"
              data-modal-add-cart
            >
              🛒 أضف للسلة
            </button>


            <a
              class="btn-whatsapp"
              href="${buildSingleProductWhatsApp(
                normalized,
                1
              )}"
              target="_blank"
              rel="noopener"
            >
              💬 واتساب
            </a>


            <a
              class="btn-outline"
              href="./product.html?id=${encodeURIComponent(normalized.id)}"
            >
              التفاصيل كاملة
            </a>

          </div>

        </div>

      </div>
    `;


    const addButton =
      content.querySelector(
        "[data-modal-add-cart]"
      );


    if (addButton) {

      addButton.addEventListener(
        "click",
        () => {

          addToCart(
            normalized,
            1
          );

        }
      );

    }


    modal.classList.add(
      "is-open"
    );


    modal.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.classList.add(
      "abo-modal-open"
    );


    addRecent(
      normalized
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
      "is-open"
    );


    modal.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.classList.remove(
      "abo-modal-open"
    );

  }


  function buildSingleProductWhatsApp(
    product,
    quantity
  ) {

    const name =
      String(
        product?.name ||
        "منتج"
      );


    let message =
      "مرحبًا أبو طارق، أريد الاستفسار عن:%0A";

    message +=
      encodeURIComponent(
        name
      );


    message +=
      "%0Aالكمية: " +
      encodeURIComponent(
        normalizeQuantity(
          quantity
        )
      );


    return (
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      message
    );

  }


  /* =========================================================
     KEYBOARD
     ========================================================= */

  function bindKeyboard() {

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Escape"
        ) {

          if (
            state.drawerOpen
          ) {

            closeCart();

          }


          closeProductModal();

        }

      }
    );

  }


  /* =========================================================
     CART LINK AUTO-CONVERSION
     ========================================================= */

  function bindExistingCartButtons() {

    $$(
      "#cartButton, .cart-button, [data-cart-button]"
    ).forEach(
      button => {

        if (
          button.dataset
            .featuresBound ===
          "true"
        ) {
          return;
        }


        button.dataset
          .featuresBound =
          "true";


        button.addEventListener(
          "click",
          event => {

            event.preventDefault();

            openCart();

          }
        );

      }
    );

  }


  /* =========================================================
     APP EVENTS
     ========================================================= */

  function bindAppEvents() {

    document.addEventListener(
      "abo-tarek:add-to-cart",
      event => {

        const product =
          event.detail?.product;


        const quantity =
          event.detail?.quantity ||
          1;


        if (product) {

          /*
            Prevent duplicate fallback
            handlers by using our single
            source of truth.
          */

          const normalized =
            normalizeProduct(
              product
            );


          if (normalized) {

            addToCart(
              normalized,
              quantity
            );

          }

        }

      }
    );


    document.addEventListener(
      "abo-tarek:toggle-wishlist",
      event => {

        const product =
          event.detail?.product;


        if (product) {

          toggleWishlist(
            product
          );

        }

      }
    );


    document.addEventListener(
      "abo-tarek:app-ready",
      () => {

        syncProducts();
        updateWishlistUI();
        updateCartUI();
        refreshRecentSections();

      }
    );


    document.addEventListener(
      "abo-tarek:render-complete",
      () => {

        syncProducts();
        bindExistingCartButtons();
        updateWishlistUI();
        updateCartUI();
        refreshRecentSections();

      }
    );

  }


  /* =========================================================
     BODY SCROLL LOCK
     ========================================================= */

  function setupScrollLock() {

    const observer =
      new MutationObserver(
        () => {

          const locked =
            document.body.classList.contains(
              "abo-cart-open"
            ) ||
            document.body.classList.contains(
              "abo-modal-open"
            );


          document.body.classList.toggle(
            "abo-features-no-scroll",
            locked
          );

        }
      );


    observer.observe(
      document.body,
      {
        attributes: true,
        attributeFilter: [
          "class"
        ]
      }
    );

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.ABO_TAREK_FEATURES = {

    /* cart */

    addToCart,

    updateCartQuantity,

    removeFromCart,

    clearCart,

    getCartCount,

    getCartTotal,

    openCart,

    closeCart,

    getCart:
      () =>
        [...state.cart],


    /* wishlist */

    toggleWishlist,

    isInWishlist,

    removeFromWishlist,

    getWishlist:
      () =>
        [...state.wishlist],


    /* recent */

    addRecent,

    getRecent:
      () =>
        [...state.recent],


    /* modal */

    openProductModal,

    closeProductModal,


    /* utility */

    toast,

    formatPrice,

    getPrice,

    buildWhatsAppUrl,

    refresh:
      () => {

        syncProducts();
        updateCartUI();
        updateWishlistUI();
        refreshRecentSections();

      }

  };


  /*
    Backward compatibility alias.
  */

  window.ABO_TAREK_CART = {

    add:
      addToCart,

    remove:
      removeFromCart,

    update:
      updateCartQuantity,

    clear:
      clearCart,

    open:
      openCart,

    close:
      closeCart,

    count:
      getCartCount,

    total:
      getCartTotal

  };


  /* =========================================================
     INIT
     ========================================================= */

  function init() {

    if (
      state.initialized
    ) {
      return;
    }


    state.initialized =
      true;


    loadStorage();

    syncProducts();

    ensureCartDrawer();

    bindGlobalClicks();

    bindKeyboard();

    bindAppEvents();

    bindExistingCartButtons();

    setupScrollLock();

    updateCartUI();

    updateWishlistUI();

    refreshRecentSections();


    /*
      Make product cards created later
      immediately compatible.
    */

    dispatch(
      "abo-tarek:features-ready",
      {
        features:
          window.ABO_TAREK_FEATURES
      }
    );

  }


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
