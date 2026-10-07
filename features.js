/* =========================================================
   ABO TAREK STORE - FEATURES.JS
   PREMIUM FEATURES MASTER
   Cart UI + Wishlist + Recently Viewed
   Compatible with config.js + app.js
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     SAFE CONFIG / UTILS
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};

  const CFG =
    ROOT.CONFIG ||
    window.ABO_TAREK_CONFIG ||
    {};

  const U =
    ROOT.UTILS ||
    {};

  const CACHE_KEYS = CFG.CACHE_KEYS || {
    CART: "abo_tarek_cart_v4",
    WISHLIST: "abo_tarek_wishlist_v3",
    RECENT: "abo_tarek_recent_v3"
  };

  const WHATSAPP_NUMBER =
    CFG.WHATSAPP_NUMBER ||
    CFG.CONTACT?.WHATSAPP ||
    "201551604163";


  /* =========================================================
     SAFE HELPERS
     ========================================================= */

  function cleanText(value) {
    if (typeof U.cleanText === "function") {
      return U.cleanText(value);
    }

    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    if (typeof U.escapeHtml === "function") {
      return U.escapeHtml(value);
    }

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    if (typeof U.escapeAttribute === "function") {
      return U.escapeAttribute(value);
    }

    return escapeHtml(value);
  }

  function parsePrice(value) {
    if (typeof U.parsePrice === "function") {
      return U.parsePrice(value);
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const normalized = String(value ?? "")
      .replace(/[^\d.,-]/g, "")
      .replace(/,/g, "");

    const number = Number(normalized);

    return Number.isFinite(number) ? number : 0;
  }

  function formatPrice(value) {
    if (typeof U.formatPrice === "function") {
      return U.formatPrice(value);
    }

    const number = parsePrice(value);

    if (!number) {
      return "0 جنيه";
    }

    return `${new Intl.NumberFormat("ar-EG").format(number)} جنيه`;
  }

  function categoryIcon(category) {
    if (typeof U.categoryIcon === "function") {
      return U.categoryIcon(category);
    }

    return "🛍️";
  }

  function getImageSources(image) {
    if (typeof U.getImageSources === "function") {
      return U.getImageSources(image);
    }

    if (Array.isArray(image)) {
      return image
        .map(item => cleanText(item))
        .filter(Boolean);
    }

    const value = cleanText(image);

    if (!value) {
      return [];
    }

    return value
      .split(/\s*,\s*|\n+/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function normalizeId(value) {
    return String(value ?? "").trim();
  }


  /* =========================================================
     PRODUCT NORMALIZATION
     ========================================================= */

  function normalizeFeatureProduct(product) {
    if (!product || !product.id) {
      return null;
    }

    return {
      id: normalizeId(product.id),
      name: cleanText(product.name),
      category: cleanText(product.category),
      image: cleanText(product.image),
      images: Array.isArray(product.images)
        ? product.images.map(item => cleanText(item)).filter(Boolean)
        : [],
      description: cleanText(product.description),
      price: parsePrice(product.price),
      oldPrice: parsePrice(product.oldPrice),
      offerPrice: parsePrice(product.offerPrice)
    };
  }


  /* =========================================================
     CART
     ========================================================= */

  function readCart() {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.CART);

      if (!raw) {
        return [];
      }

      const data = JSON.parse(raw);

      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .filter(item => item && item.id && Number(item.quantity) > 0)
        .map(item => ({
          id: normalizeId(item.id),
          name: cleanText(item.name),
          category: cleanText(item.category),
          image: cleanText(item.image),
          images: Array.isArray(item.images)
            ? item.images.map(x => cleanText(x)).filter(Boolean)
            : [],
          price: parsePrice(item.price),
          oldPrice: parsePrice(item.oldPrice),
          offerPrice: parsePrice(item.offerPrice),
          quantity: Math.max(
            1,
            Math.floor(Number(item.quantity) || 1)
          )
        }));

    } catch (error) {
      return [];
    }
  }


  function saveCart(cart) {
    try {
      localStorage.setItem(
        CACHE_KEYS.CART,
        JSON.stringify(Array.isArray(cart) ? cart : [])
      );
    } catch (error) {
      /* Ignore storage errors */
    }

    updateCartUI();

    window.dispatchEvent(
      new CustomEvent("aboTarekCartUpdated", {
        detail: {
          cart: readCart()
        }
      })
    );
  }


  function getProductPrice(product) {
    if (!product) {
      return 0;
    }

    if (typeof product.offerPrice !== "undefined") {
      const offer = parsePrice(product.offerPrice);

      if (offer > 0) {
        return offer;
      }
    }

    return parsePrice(product.price);
  }


  function cartCount() {
    return readCart().reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }


  function cartTotal() {
    return readCart().reduce(
      (sum, item) =>
        sum +
        parsePrice(item.price) *
        Number(item.quantity || 0),
      0
    );
  }


  function addToCart(product) {
    if (!product) {
      return;
    }

    const normalized = normalizeFeatureProduct(product);

    if (!normalized) {
      return;
    }

    const price = getProductPrice(normalized);

    /*
      لو المنتج بدون سعر، نفتح صفحة/مودال المنتج
      بدل ما نضيفه للسلة بسعر صفر.
    */
    if (price <= 0) {
      if (typeof window.openProductModal === "function") {
        window.openProductModal(product);
      } else if (typeof window.ABO_TAREK_APP?.openProductPage === "function") {
        window.ABO_TAREK_APP.openProductPage(product);
      }

      return;
    }

    /*
      لو app.js الحالي عنده نظام سلة رسمي،
      نستخدمه بدل إنشاء نظام ثاني.
    */
    const appAdd =
      window.ABO_TAREK_APP &&
      typeof window.ABO_TAREK_APP.addToCart === "function"
        ? window.ABO_TAREK_APP.addToCart
        : null;

    if (appAdd && appAdd !== addToCart) {
      appAdd(product);
      return;
    }

    const cart = readCart();

    const existing = cart.find(
      item => normalizeId(item.id) === normalizeId(normalized.id)
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: normalized.id,
        name: normalized.name,
        category: normalized.category,
        image: normalized.image,
        images: normalized.images,
        price: price,
        oldPrice: normalized.oldPrice,
        offerPrice: normalized.offerPrice,
        quantity: 1
      });
    }

    saveCart(cart);

    openCart();

    flashCartButtons(normalized.id);

    track("add_to_cart", {
      content_ids: [normalized.id],
      content_name: normalized.name,
      content_category: normalized.category,
      value: price,
      currency: "EGP"
    });
  }


  function flashCartButtons(productId) {
    const safeId = normalizeId(productId);

    document
      .querySelectorAll(".abo-add-cart")
      .forEach(button => {
        if (
          normalizeId(button.dataset.cartId) !== safeId
        ) {
          return;
        }

        button.classList.add("added");

        const oldHTML = button.innerHTML;

        button.innerHTML = "✓ تمت الإضافة";

        window.setTimeout(() => {
          button.classList.remove("added");
          button.innerHTML = oldHTML;
        }, 1400);
      });
  }


  function changeCartQuantity(id, delta) {
    const targetId = normalizeId(id);

    if (!targetId) {
      return;
    }

    const cart = readCart();

    const item = cart.find(
      product =>
        normalizeId(product.id) === targetId
    );

    if (!item) {
      return;
    }

    item.quantity += Number(delta || 0);

    const updated =
      item.quantity <= 0
        ? cart.filter(
            product =>
              normalizeId(product.id) !== targetId
          )
        : cart;

    saveCart(updated);
  }


  function removeFromCart(id) {
    const targetId = normalizeId(id);

    saveCart(
      readCart().filter(
        item =>
          normalizeId(item.id) !== targetId
      )
    );
  }


  function clearCart() {
    saveCart([]);
  }


  /* =========================================================
     CART BUTTON
     ========================================================= */

  function ensureCartButton() {
    let button =
      document.getElementById("aboCartButton");

    if (button) {
      return button;
    }

    if (!document.body) {
      return null;
    }

    button = document.createElement("button");

    button.id = "aboCartButton";
    button.className = "abo-cart-button";
    button.type = "button";
    button.setAttribute(
      "aria-label",
      "سلة المشتريات"
    );

    button.innerHTML = `
      🛒
      <span class="abo-cart-count">0</span>
      <span class="abo-cart-total">0</span>
    `;

    document.body.appendChild(button);

    button.addEventListener(
      "click",
      openCart
    );

    return button;
  }


  /* =========================================================
     CART DRAWER
     ========================================================= */

  function ensureCartDrawer() {
    let drawer =
      document.getElementById("aboCartDrawer");

    if (drawer) {
      return drawer;
    }

    if (!document.body) {
      return null;
    }

    drawer = document.createElement("div");

    drawer.id = "aboCartDrawer";
    drawer.className = "abo-cart-drawer";

    drawer.innerHTML = `
      <div
        class="abo-cart-backdrop"
        data-close-cart
      ></div>

      <aside
        class="abo-cart-panel"
        aria-label="سلة المشتريات"
      >
        <div class="abo-cart-header">
          <div>
            <strong>سلة مشترياتك 🛒</strong>
            <span>راجع طلبك قبل الإرسال</span>
          </div>

          <button
            type="button"
            class="abo-cart-close"
            aria-label="إغلاق السلة"
          >×</button>
        </div>

        <div class="abo-cart-items"></div>

        <div class="abo-cart-footer">

          <div class="abo-cart-summary">
            <span>إجمالي الطلب</span>
            <strong class="abo-cart-summary-total">
              0 جنيه
            </strong>
          </div>

          <a
            class="abo-cart-whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            href="#"
          >
            💬 إرسال الطلب على واتساب
          </a>

          <button
            type="button"
            class="abo-cart-clear"
          >
            مسح السلة
          </button>

        </div>
      </aside>
    `;

    document.body.appendChild(drawer);

    const closeButton =
      drawer.querySelector(".abo-cart-close");

    const clearButton =
      drawer.querySelector(".abo-cart-clear");

    const whatsapp =
      drawer.querySelector(".abo-cart-whatsapp");

    if (closeButton) {
      closeButton.addEventListener(
        "click",
        closeCart
      );
    }

    if (clearButton) {
      clearButton.addEventListener(
        "click",
        clearCart
      );
    }

    if (whatsapp) {
      whatsapp.addEventListener(
        "click",
        () => {
          const cart = readCart();

          if (!cart.length) {
            return;
          }

          track("begin_checkout", {
            value: cartTotal(),
            currency: "EGP",
            num_items: cartCount()
          });
        }
      );
    }

    drawer.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "[data-close-cart]"
          )
        ) {
          closeCart();
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

    return drawer;
  }


  /* =========================================================
     WHATSAPP
     ========================================================= */

  function getWhatsAppNumber() {
    return String(WHATSAPP_NUMBER)
      .replace(/\D/g, "");
  }


  function cartWhatsAppUrl() {
    const cart = readCart();

    if (!cart.length) {
      return "#";
    }

    let message =
      "السلام عليكم، عايز أطلب الأصناف دي:\n\n";

    cart.forEach((item, index) => {
      message +=
        `${index + 1}) ${item.name}\n`;

      message +=
        `الكمية: ${item.quantity}\n`;

      message +=
        `السعر: ${formatPrice(item.price)}\n`;

      message +=
        `الإجمالي: ${formatPrice(
          item.price * item.quantity
        )}\n\n`;
    });

    message +=
      "--------------------\n";

    message +=
      `إجمالي الطلب: ${formatPrice(
        cartTotal()
      )}\n\n`;

    message +=
      "من موقع أبو طارق للأدوات المنزلية.";

    const number =
      getWhatsAppNumber();

    return (
      "https://wa.me/" +
      number +
      "?text=" +
      encodeURIComponent(message)
    );
  }


  /* =========================================================
     RENDER CART
     ========================================================= */

  function renderCart() {
    const drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if (!drawer) {
      return;
    }

    const items =
      drawer.querySelector(
        ".abo-cart-items"
      );

    const whatsapp =
      drawer.querySelector(
        ".abo-cart-whatsapp"
      );

    const total =
      drawer.querySelector(
        ".abo-cart-summary-total"
      );

    const cart =
      readCart();

    if (!items) {
      return;
    }

    if (!cart.length) {
      items.innerHTML = `
        <div class="abo-cart-empty">
          <div class="abo-cart-empty-icon">🛒</div>
          <strong>السلة لسه فاضية</strong>
          <span>
            اختار الأصناف اللي عايز تطلبها.
          </span>
        </div>
      `;
    } else {
      items.innerHTML =
        cart
          .map(item => {
            const sources =
              getImageSources(
                item.images?.length
                  ? item.images
                  : item.image
              );

            return `
              <div
                class="abo-cart-item"
                data-cart-item="${escapeAttribute(
                  item.id
                )}"
              >

                <div class="abo-cart-item-image">
                  ${
                    sources.length
                      ? `
                        <img
                          src="${escapeAttribute(
                            sources[0]
                          )}"
                          alt="${escapeAttribute(
                            item.name
                          )}"
                          loading="lazy"
                        >
                      `
                      : categoryIcon(
                          item.category
                        )
                  }
                </div>

                <div class="abo-cart-item-info">

                  <h4 class="abo-cart-item-name">
                    ${escapeHtml(item.name)}
                  </h4>

                  <div class="abo-cart-item-price">
                    ${escapeHtml(
                      formatPrice(
                        item.price
                      )
                    )}
                  </div>

                  <div class="abo-cart-item-controls">

                    <button
                      type="button"
                      class="abo-cart-qty-btn"
                      data-cart-plus="${escapeAttribute(
                        item.id
                      )}"
                      aria-label="زيادة الكمية"
                    >+</button>

                    <span class="abo-cart-qty">
                      ${item.quantity}
                    </span>

                    <button
                      type="button"
                      class="abo-cart-qty-btn"
                      data-cart-minus="${escapeAttribute(
                        item.id
                      )}"
                      aria-label="تقليل الكمية"
                    >−</button>

                    <button
                      type="button"
                      class="abo-cart-remove"
                      data-cart-remove="${escapeAttribute(
                        item.id
                      )}"
                      aria-label="حذف المنتج"
                    >🗑</button>

                  </div>
                </div>
              </div>
            `;
          })
          .join("");
    }

    if (total) {
      total.textContent =
        formatPrice(cartTotal()) ||
        "0 جنيه";
    }

    if (whatsapp) {
      whatsapp.href =
        cartWhatsAppUrl();

      whatsapp.style.pointerEvents =
        cart.length
          ? "auto"
          : "none";

      whatsapp.style.opacity =
        cart.length
          ? "1"
          : ".45";
    }
  }


  function updateCartUI() {
    ensureCartButton();

    const count =
      document.querySelector(
        ".abo-cart-count"
      );

    const total =
      document.querySelector(
        ".abo-cart-total"
      );

    if (count) {
      count.textContent =
        cartCount();
    }

    if (total) {
      total.textContent =
        formatPrice(cartTotal()) ||
        "0";
    }

    renderCart();
  }


  function openCart() {
    const drawer =
      ensureCartDrawer();

    if (!drawer) {
      return;
    }

    renderCart();

    drawer.classList.add("open");

    document.body.style.overflow =
      "hidden";

    track("view_cart", {
      value: cartTotal(),
      currency: "EGP",
      num_items: cartCount()
    });
  }


  function closeCart() {
    const drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if (!drawer) {
      return;
    }

    drawer.classList.remove("open");

    document.body.style.overflow =
      "";
  }


  /* =========================================================
     WISHLIST
     ========================================================= */

  function readWishlist() {
    try {
      const raw =
        localStorage.getItem(
          CACHE_KEYS.WISHLIST
        );

      if (!raw) {
        return [];
      }

      const data =
        JSON.parse(raw);

      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .filter(item => item && item.id)
        .map(item => ({
          id: normalizeId(item.id),
          name: cleanText(item.name),
          category: cleanText(item.category),
          image: cleanText(item.image),
          images: Array.isArray(item.images)
            ? item.images
                .map(x => cleanText(x))
                .filter(Boolean)
            : [],
          price: parsePrice(item.price),
          oldPrice: parsePrice(item.oldPrice),
          offerPrice: parsePrice(item.offerPrice)
        }));

    } catch (error) {
      return [];
    }
  }


  function saveWishlist(list) {
    try {
      localStorage.setItem(
        CACHE_KEYS.WISHLIST,
        JSON.stringify(
          Array.isArray(list)
            ? list
            : []
        )
      );
    } catch (error) {
      /* Ignore storage errors */
    }

    updateWishlistUI();

    window.dispatchEvent(
      new CustomEvent(
        "aboTarekWishlistUpdated",
        {
          detail: {
            wishlist:
              readWishlist()
          }
        }
      )
    );
  }


  function isInWishlist(id) {
    const targetId =
      normalizeId(id);

    return readWishlist().some(
      item =>
        normalizeId(item.id) ===
        targetId
    );
  }


  function toggleWishlist(product) {
    if (!product || !product.id) {
      return false;
    }

    const normalized =
      normalizeFeatureProduct(
        product
      );

    if (!normalized) {
      return false;
    }

    const list =
      readWishlist();

    const existingIndex =
      list.findIndex(
        item =>
          normalizeId(item.id) ===
          normalized.id
      );

    if (existingIndex >= 0) {
      list.splice(
        existingIndex,
        1
      );

      saveWishlist(list);

      updateWishlistButtons(
        normalized.id,
        false
      );

      track("remove_from_wishlist", {
        content_ids: [
          normalized.id
        ],
        content_name:
          normalized.name
      });

      return false;
    }

    list.push({
      id: normalized.id,
      name: normalized.name,
      category: normalized.category,
      image: normalized.image,
      images: normalized.images,
      price: normalized.price,
      offerPrice:
        normalized.offerPrice,
      oldPrice:
        normalized.oldPrice
    });

    saveWishlist(list);

    updateWishlistButtons(
      normalized.id,
      true
    );

    track("add_to_wishlist", {
      content_ids: [
        normalized.id
      ],
      content_name:
        normalized.name,
      value:
        getProductPrice(
          normalized
        ),
      currency: "EGP"
    });

    return true;
  }


  function wishlistCount() {
    return readWishlist().length;
  }


  function updateWishlistButtons(
    productId,
    active
  ) {
    const targetId =
      normalizeId(productId);

    document
      .querySelectorAll(
        "[data-wishlist-id]"
      )
      .forEach(button => {
        if (
          normalizeId(
            button.dataset.wishlistId
          ) !== targetId
        ) {
          return;
        }

        button.classList.toggle(
          "active",
          active
        );

        button.classList.toggle(
          "is-active",
          active
        );

        button.setAttribute(
          "aria-pressed",
          active
            ? "true"
            : "false"
        );
      });
  }


  /* =========================================================
     WISHLIST BUTTON
     ========================================================= */

  function ensureWishlistButton() {
    let button =
      document.getElementById(
        "aboWishlistButton"
      );

    if (button) {
      return button;
    }

    if (!document.body) {
      return null;
    }

    button =
      document.createElement(
        "button"
      );

    button.id =
      "aboWishlistButton";

    button.className =
      "abo-wishlist-button";

    button.type =
      "button";

    button.setAttribute(
      "aria-label",
      "المفضلة"
    );

    button.innerHTML = `
      ❤️
      <span class="abo-wishlist-count">
        0
      </span>
    `;

    document.body.appendChild(
      button
    );

    button.addEventListener(
      "click",
      openWishlistDrawer
    );

    return button;
  }


  /* =========================================================
     WISHLIST DRAWER
     ========================================================= */

  function ensureWishlistDrawer() {
    let drawer =
      document.getElementById(
        "aboWishlistDrawer"
      );

    if (drawer) {
      return drawer;
    }

    if (!document.body) {
      return null;
    }

    drawer =
      document.createElement(
        "div"
      );

    drawer.id =
      "aboWishlistDrawer";

    drawer.className =
      "abo-wishlist-drawer";

    drawer.innerHTML = `
      <div
        class="abo-wishlist-backdrop"
        data-close-wishlist
      ></div>

      <aside
        class="abo-wishlist-panel"
        aria-label="المفضلة"
      >

        <div class="abo-wishlist-header">
          <div>
            <strong>
              ❤️ المفضلة
            </strong>

            <span>
              المنتجات اللي عجبتك
            </span>
          </div>

          <button
            type="button"
            class="abo-wishlist-close"
            aria-label="إغلاق"
          >×</button>
        </div>

        <div class="abo-wishlist-items"></div>

      </aside>
    `;

    document.body.appendChild(
      drawer
    );

    const closeButton =
      drawer.querySelector(
        ".abo-wishlist-close"
      );

    if (closeButton) {
      closeButton.addEventListener(
        "click",
        closeWishlistDrawer
      );
    }

    drawer.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "[data-close-wishlist]"
          )
        ) {
          closeWishlistDrawer();
          return;
        }

        const remove =
          event.target.closest(
            "[data-wishlist-remove]"
          );

        if (remove) {
          const id =
            remove.dataset
              .wishlistRemove;

          saveWishlist(
            readWishlist().filter(
              item =>
                normalizeId(
                  item.id
                ) !==
                normalizeId(id)
            )
          );

          return;
        }

        const addButton =
          event.target.closest(
            "[data-wishlist-add-cart]"
          );

        if (addButton) {
          const id =
            addButton.dataset
              .wishlistAddCart;

          const item =
            readWishlist().find(
              product =>
                normalizeId(
                  product.id
                ) ===
                normalizeId(id)
            );

          if (item) {
            addToCart(item);
          }
        }
      }
    );

    return drawer;
  }


  function renderWishlist() {
    const drawer =
      ensureWishlistDrawer();

    if (!drawer) {
      return;
    }

    const items =
      drawer.querySelector(
        ".abo-wishlist-items"
      );

    if (!items) {
      return;
    }

    const list =
      readWishlist();

    if (!list.length) {
      items.innerHTML = `
        <div class="abo-wishlist-empty">

          <div class="abo-wishlist-empty-icon">
            ❤️
          </div>

          <strong>
            المفضلة فاضية
          </strong>

          <span>
            اضغط على القلب في أي منتج
            لحفظه هنا.
          </span>

        </div>
      `;

      return;
    }

    items.innerHTML =
      list
        .map(item => {
          const sources =
            getImageSources(
              item.images?.length
                ? item.images
                : item.image
            );

          const price =
            item.offerPrice ||
            item.price ||
            "";

          return `
            <div
              class="abo-wishlist-item"
            >

              <div
                class="abo-wishlist-item-image"
              >
                ${
                  sources.length
                    ? `
                      <img
                        src="${escapeAttribute(
                          sources[0]
                        )}"
                        alt="${escapeAttribute(
                          item.name
                        )}"
                        loading="lazy"
                      >
                    `
                    : categoryIcon(
                        item.category
                      )
                }
              </div>

              <div
                class="abo-wishlist-item-info"
              >

                <h4>
                  ${escapeHtml(
                    item.name
                  )}
                </h4>

                <div
                  class="abo-wishlist-item-price"
                >
                  ${escapeHtml(
                    formatPrice(
                      price
                    )
                  )}
                </div>

                <div
                  class="abo-wishlist-item-actions"
                >

                  <button
                    type="button"
                    class="abo-wishlist-add-cart"
                    data-wishlist-add-cart="${escapeAttribute(
                      item.id
                    )}"
                  >
                    🛒 أضف للسلة
                  </button>

                  <button
                    type="button"
                    class="abo-wishlist-remove"
                    data-wishlist-remove="${escapeAttribute(
                      item.id
                    )}"
                    aria-label="حذف"
                  >
                    🗑
                  </button>

                </div>

              </div>

            </div>
          `;
        })
        .join("");
  }


  function updateWishlistUI() {
    ensureWishlistButton();

    const count =
      document.querySelector(
        ".abo-wishlist-count"
      );

    if (count) {
      count.textContent =
        wishlistCount();
    }

    renderWishlist();

    /*
      تحديث أي قلوب موجودة بالفعل
      داخل بطاقات المنتجات.
    */
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

        button.classList.toggle(
          "is-active",
          active
        );

        button.setAttribute(
          "aria-pressed",
          active
            ? "true"
            : "false"
        );
      });
  }


  function openWishlistDrawer() {
    const drawer =
      ensureWishlistDrawer();

    if (!drawer) {
      return;
    }

    renderWishlist();

    drawer.classList.add(
      "open"
    );

    document.body.style.overflow =
      "hidden";
  }


  function closeWishlistDrawer() {
    const drawer =
      document.getElementById(
        "aboWishlistDrawer"
      );

    if (!drawer) {
      return;
    }

    drawer.classList.remove(
      "open"
    );

    document.body.style.overflow =
      "";
  }


  /* =========================================================
     RECENTLY VIEWED
     ========================================================= */

  function readRecent() {
    try {
      const raw =
        localStorage.getItem(
          CACHE_KEYS.RECENT
        );

      if (!raw) {
        return [];
      }

      const data =
        JSON.parse(raw);

      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .filter(item => item && item.id)
        .map(item => ({
          id: normalizeId(item.id),
          name: cleanText(item.name),
          category: cleanText(item.category),
          image: cleanText(item.image),
          images: Array.isArray(item.images)
            ? item.images
                .map(x => cleanText(x))
                .filter(Boolean)
            : [],
          price: parsePrice(item.price),
          oldPrice: parsePrice(item.oldPrice),
          offerPrice: parsePrice(item.offerPrice)
        }));

    } catch (error) {
      return [];
    }
  }


  function saveRecent(list) {
    try {
      localStorage.setItem(
        CACHE_KEYS.RECENT,
        JSON.stringify(
          Array.isArray(list)
            ? list
            : []
        )
      );
    } catch (error) {
      /* Ignore storage errors */
    }
  }


  function addToRecent(product) {
    if (!product || !product.id) {
      return;
    }

    const normalized =
      normalizeFeatureProduct(
        product
      );

    if (!normalized) {
      return;
    }

    let list =
      readRecent();

    list =
      list.filter(
        item =>
          normalizeId(item.id) !==
          normalized.id
      );

    list.unshift({
      id: normalized.id,
      name: normalized.name,
      category: normalized.category,
      image: normalized.image,
      images: normalized.images,
      price: normalized.price,
      offerPrice:
        normalized.offerPrice,
      oldPrice:
        normalized.oldPrice
    });

    list =
      list.slice(0, 8);

    saveRecent(list);

    window.dispatchEvent(
      new CustomEvent(
        "aboTarekRecentUpdated",
        {
          detail: {
            recent:
              list
          }
        }
      )
    );
  }


  function renderRecentlyViewed() {
    const section =
      document.getElementById(
        "recentlyViewed"
      );

    const grid =
      document.getElementById(
        "recentlyViewedGrid"
      );

    if (!section || !grid) {
      return;
    }

    const recent =
      readRecent();

    if (!recent.length) {
      section.hidden =
        true;

      return;
    }

    section.hidden =
      false;

    grid.innerHTML =
      recent
        .slice(0, 4)
        .map(product => {
          const sources =
            getImageSources(
              product.images?.length
                ? product.images
                : product.image
            );

          const price =
            product.offerPrice ||
            product.price ||
            "";

          const productUrl =
            "./product.html?id=" +
            encodeURIComponent(
              product.id
            );

          return `
            <article
              class="product"
              data-recent-product="${escapeAttribute(
                product.id
              )}"
              onclick="location.href='${escapeAttribute(
                productUrl
              )}'"
              style="cursor:pointer"
            >

              <div class="product-image">

                ${
                  sources.length
                    ? `
                      <img
                        src="${escapeAttribute(
                          sources[0]
                        )}"
                        alt="${escapeAttribute(
                          product.name
                        )}"
                        loading="lazy"
                        onerror="
                          this.style.display='none';
                          this.parentElement.innerHTML='<div class=&quot;product-image-placeholder&quot;><span class=&quot;placeholder-icon&quot;>🛍️</span></div>';
                        "
                      >
                    `
                    : `
                      <div
                        class="product-image-placeholder"
                      >
                        <span
                          class="placeholder-icon"
                        >
                          🛍️
                        </span>
                      </div>
                    `
                }

              </div>

              <div class="product-body">

                <div class="product-meta">

                  <span
                    class="product-category"
                  >
                    ${categoryIcon(
                      product.category
                    )}
                    ${escapeHtml(
                      product.category
                    )}
                  </span>

                </div>

                <h3 class="product-name">
                  ${escapeHtml(
                    product.name
                  )}
                </h3>

                ${
                  price
                    ? `
                      <div class="price-box">
                        <span
                          class="current-price"
                        >
                          ${escapeHtml(
                            formatPrice(
                              price
                            )
                          )}
                        </span>
                      </div>
                    `
                    : ""
                }

              </div>

            </article>
          `;
        })
        .join("");
  }


  /* =========================================================
     ANALYTICS SAFE WRAPPER
     ========================================================= */

  function track(eventName, payload) {
    try {
      if (
        typeof window.aboTrack ===
        "function"
      ) {
        window.aboTrack(
          eventName,
          payload || {}
        );
      }
    } catch (error) {
      /* Analytics must never break site */
    }
  }


  /* =========================================================
     GLOBAL API
     ========================================================= */

  window.ABO_TAREK =
    window.ABO_TAREK || {};

  /*
    نحافظ على أي CONFIG / UTILS
    موجودين بالفعل.
  */

  window.ABO_TAREK.addToCart =
    addToCart;

  window.ABO_TAREK.readCart =
    readCart;

  window.ABO_TAREK.openCart =
    openCart;

  window.ABO_TAREK.closeCart =
    closeCart;

  window.ABO_TAREK.changeCartQuantity =
    changeCartQuantity;

  window.ABO_TAREK.removeFromCart =
    removeFromCart;

  window.ABO_TAREK.clearCart =
    clearCart;

  window.ABO_TAREK.getCartCount =
    cartCount;

  window.ABO_TAREK.getCartTotal =
    cartTotal;

  /*
    Wishlist API
  */

  window.ABO_TAREK.Wishlist = {
    read:
      readWishlist,

    toggle:
      toggleWishlist,

    isIn:
      isInWishlist,

    count:
      wishlistCount,

    open:
      openWishlistDrawer,

    close:
      closeWishlistDrawer
  };

  /*
    Recently viewed API
  */

  window.ABO_TAREK.Recent = {
    read:
      readRecent,

    add:
      addToRecent,

    render:
      renderRecentlyViewed
  };


  /* =========================================================
     LEGACY GLOBALS
     ========================================================= */

  window.addToCart =
    addToCart;

  window.openAboTarekCart =
    openCart;

  window.closeAboTarekCart =
    closeCart;

  window.openWishlist =
    openWishlistDrawer;

  window.closeWishlist =
    closeWishlistDrawer;

  window.toggleWishlist =
    toggleWishlist;


  /* =========================================================
     CUSTOM EVENTS
     ========================================================= */

  window.addEventListener(
    "aboTarekRecentUpdated",
    renderRecentlyViewed
  );

  window.addEventListener(
    "aboTarekWishlistUpdated",
    updateWishlistUI
  );

  window.addEventListener(
    "aboTarekCartUpdated",
    updateCartUI
  );


  /*
    app.js قد يكون محمّل قبل features.js
    أو بعده؛ لذلك نسمح بتحديث الواجهة
    بعد اكتمال تحميل بيانات المنتجات.
  */

  window.addEventListener(
    "abo:tarek:ready",
    () => {
      updateCartUI();
      updateWishlistUI();
      renderRecentlyViewed();
    }
  );


  /* =========================================================
     KEYBOARD
     ========================================================= */

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
      closeWishlistDrawer();
    }
  );


  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    ensureCartButton();
    ensureCartDrawer();

    ensureWishlistButton();
    ensureWishlistDrawer();

    updateCartUI();
    updateWishlistUI();
    renderRecentlyViewed();
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


  /* =========================================================
     DEBUG / READY
     ========================================================= */

  window.ABO_TAREK_FEATURES = {
    readCart,
    saveCart,
    cartCount,
    cartTotal,
    addToCart,
    changeCartQuantity,
    removeFromCart,
    clearCart,

    readWishlist,
    toggleWishlist,
    wishlistCount,

    readRecent,
    addToRecent,
    renderRecentlyViewed,

    updateCartUI,
    updateWishlistUI
  };


  console.log(
    "✅ features.js loaded — Cart + Wishlist + Recently Viewed"
  );

})();
