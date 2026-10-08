/* =========================================================
   ABO TAREK STORE
   features.js
   FINAL — CART + WISHLIST + PRODUCT MODAL
   ========================================================= */

(() => {
  "use strict";

  const CFG =
    window.ABO_TAREK_CONFIG ||
    window.CFG ||
    {};

  const WHATSAPP_NUMBER =
    window.WHATSAPP_NUMBER ||
    "201551604163";

  const CART_KEY =
    "abo_tarek_cart_v1";

  const WISHLIST_KEY =
    "abo_tarek_wishlist_v1";

  const RECENT_KEY =
    "abo_tarek_recently_viewed_v1";

  const MAX_QTY = 99;

  let cart = [];
  let wishlist = [];
  let currentProduct = null;
  let currentProductImages = [];
  let currentProductImageIndex = 0;

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

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

  function toNumber(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number =
      Number(
        String(value)
          .replace(/,/g, "")
          .replace(/[^\d.-]/g, "")
      );

    return Number.isFinite(number)
      ? number
      : null;
  }

  function formatPrice(value) {
    const number =
      toNumber(value);

    if (number === null) {
      return "";
    }

    return (
      new Intl.NumberFormat("ar-EG", {
        maximumFractionDigits: 2
      }).format(number) +
      " ج.م"
    );
  }

  function isOffer(product) {
    return (
      product?.isOffer === true ||
      product?.isOffer === 1 ||
      String(
        product?.isOffer
      ).toLowerCase() ===
        "true" ||
      String(
        product?.isOffer
      ) === "1"
    );
  }

  function getProductPrice(product) {
    const offer =
      toNumber(
        product?.offerPrice
      );

    const price =
      toNumber(
        product?.price
      );

    if (
      isOffer(product) &&
      offer !== null
    ) {
      return offer;
    }

    return price;
  }

  function getImages(product) {
    const list = [];

    function add(value) {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(add);
        return;
      }

      String(value)
        .split(/\n|,/)
        .map(cleanText)
        .filter(Boolean)
        .forEach(item => {
          if (!list.includes(item)) {
            list.push(item);
          }
        });
    }

    add(product?.images);
    add(product?.image);

    return list.slice(0, 5);
  }

  function imageUrl(value) {
    const original =
      cleanText(value);

    if (!original) {
      return "";
    }

    if (
      original.startsWith("http://") ||
      original.startsWith("https://") ||
      original.startsWith("data:")
    ) {
      return original;
    }

    const relative =
      original
        .replace(/^\.?\//, "")
        .replace(/^\/+/, "");

    return (
      "https://abotarek963258-cmyk.github.io/abo-tarek-store/" +
      relative
        .split("/")
        .map(
          part =>
            encodeURIComponent(part)
        )
        .join("/")
    );
  }

  function normalizeProduct(product) {
    return {
      ...product,
      id:
        cleanText(product?.id) ||
        cleanText(product?.ID),
      name:
        cleanText(product?.name) ||
        "صنف",
      category:
        cleanText(
          product?.category
        ),
      image:
        cleanText(
          product?.image
        ),
      images:
        product?.images || "",
      description:
        cleanText(
          product?.description
        ),
      price:
        product?.price ?? "",
      oldPrice:
        product?.oldPrice ?? "",
      offerPrice:
        product?.offerPrice ?? "",
      isOffer:
        isOffer(product)
    };
  }

  function readStorage(
    key,
    fallback
  ) {
    try {
      const raw =
        localStorage.getItem(key);

      if (!raw) {
        return fallback;
      }

      const parsed =
        JSON.parse(raw);

      return parsed;
    } catch {
      return fallback;
    }
  }

  function writeStorage(
    key,
    value
  ) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch {}
  }

  function loadState() {
    const savedCart =
      readStorage(
        CART_KEY,
        []
      );

    const savedWishlist =
      readStorage(
        WISHLIST_KEY,
        []
      );

    cart =
      Array.isArray(savedCart)
        ? savedCart
            .map(item => ({
              ...normalizeProduct(
                item.product ||
                item
              ),
              quantity:
                Math.max(
                  1,
                  Math.min(
                    MAX_QTY,
                    Number(
                      item.quantity
                    ) || 1
                  )
                )
            }))
            .filter(
              item => item.id
            )
        : [];

    wishlist =
      Array.isArray(
        savedWishlist
      )
        ? savedWishlist
            .map(normalizeProduct)
            .filter(
              item => item.id
            )
        : [];
  }

  function saveCart() {
    writeStorage(
      CART_KEY,
      cart
    );

    updateCartUI();

    document.dispatchEvent(
      new CustomEvent(
        "abo:tarek:cart",
        {
          detail: {
            cart:
              getCart()
          }
        }
      )
    );

    try {
      window.dispatchEvent(
        new CustomEvent(
          "abo:tarek:cart",
          {
            detail: {
              cart:
                getCart()
            }
          }
        )
      );
    } catch {}
  }

  function saveWishlist() {
    writeStorage(
      WISHLIST_KEY,
      wishlist
    );

    refreshWishlistUI();

    document.dispatchEvent(
      new CustomEvent(
        "abo:tarek:wishlist",
        {
          detail: {
            wishlist:
              getWishlist()
          }
        }
      )
    );

    try {
      window.dispatchEvent(
        new CustomEvent(
          "abo:tarek:wishlist",
          {
            detail: {
              wishlist:
                getWishlist()
            }
          }
        )
      );
    } catch {}
  }

  function getCart() {
    return cart.map(
      item => ({
        ...item,
        product:
          normalizeProduct(
            item.product ||
            item
          )
      })
    );
  }

  function getWishlist() {
    return wishlist.map(
      normalizeProduct
    );
  }

  function getCartCount() {
    return cart.reduce(
      (total, item) =>
        total +
        (Number(
          item.quantity
        ) || 0),
      0
    );
  }

  function getCartTotal() {
    return cart.reduce(
      (total, item) => {
        const price =
          getProductPrice(
            item.product ||
            item
          );

        if (price === null) {
          return total;
        }

        return (
          total +
          price *
            (Number(
              item.quantity
            ) || 0)
        );
      },
      0
    );
  }

  function showToast(
    message
  ) {
    let toast =
      $("#aboTarekToast");

    if (!toast) {
      toast =
        document.createElement(
          "div"
        );

      toast.id =
        "aboTarekToast";

      toast.className =
        "abo-tarek-toast";

      document.body.appendChild(
        toast
      );
    }

    toast.textContent =
      message;

    toast.classList.add(
      "is-visible"
    );

    clearTimeout(
      toast._timer
    );

    toast._timer =
      setTimeout(() => {
        toast.classList.remove(
          "is-visible"
        );
      }, 2200);
  }

  function addToCart(
    product,
    quantity = 1
  ) {
    product =
      normalizeProduct(
        product
      );

    if (!product.id) {
      return false;
    }

    quantity =
      Math.max(
        1,
        Math.min(
          MAX_QTY,
          Number(quantity) || 1
        )
      );

    const existing =
      cart.find(
        item =>
          item.product.id ===
          product.id
      );

    if (existing) {
      existing.quantity =
        Math.min(
          MAX_QTY,
          existing.quantity +
            quantity
        );
    } else {
      cart.push({
        product,
        quantity
      });
    }

    saveCart();

    showToast(
      "تمت إضافة الصنف للسلة 🛒"
    );

    return true;
  }

  function removeFromCart(id) {
    cart =
      cart.filter(
        item =>
          item.product.id !==
          String(id)
      );

    saveCart();
  }

  function changeCartQuantity(
    id,
    delta
  ) {
    const item =
      cart.find(
        entry =>
          entry.product.id ===
          String(id)
      );

    if (!item) return;

    item.quantity =
      Math.max(
        1,
        Math.min(
          MAX_QTY,
          item.quantity +
            Number(delta || 0)
        )
      );

    saveCart();
  }

  function setCartQuantity(
    id,
    quantity
  ) {
    const item =
      cart.find(
        entry =>
          entry.product.id ===
          String(id)
      );

    if (!item) return;

    item.quantity =
      Math.max(
        1,
        Math.min(
          MAX_QTY,
          Number(quantity) || 1
        )
      );

    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
  }

  function isInWishlist(id) {
    return wishlist.some(
      product =>
        product.id ===
        String(id)
    );
  }

  function addToWishlist(
    product
  ) {
    product =
      normalizeProduct(
        product
      );

    if (!product.id) {
      return false;
    }

    if (
      isInWishlist(
        product.id
      )
    ) {
      return false;
    }

    wishlist.push(
      product
    );

    saveWishlist();

    showToast(
      "تمت إضافة الصنف للمفضلة ♡"
    );

    return true;
  }

  function removeFromWishlist(
    id
  ) {
    wishlist =
      wishlist.filter(
        product =>
          product.id !==
          String(id)
      );

    saveWishlist();

    showToast(
      "تم حذف الصنف من المفضلة"
    );
  }

  function toggleWishlist(
    product
  ) {
    product =
      normalizeProduct(
        product
      );

    if (
      isInWishlist(
        product.id
      )
    ) {
      removeFromWishlist(
        product.id
      );
      return false;
    }

    addToWishlist(
      product
    );

    return true;
  }

  function updateCartUI() {
    const count =
      getCartCount();

    $$(
      "[data-cart-count], #cartCount, #mobileMenuCartCount"
    ).forEach(
      element => {
        element.textContent =
          String(count);

        element.hidden =
          count <= 0;
      }
    );
  }

  function refreshWishlistUI() {
    const ids =
      new Set(
        wishlist.map(
          product =>
            String(product.id)
        )
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
          active
            ? "true"
            : "false"
        );

        button.setAttribute(
          "aria-label",
          active
            ? "حذف من المفضلة"
            : "إضافة للمفضلة"
        );

        button.innerHTML =
          active
            ? "♥"
            : "♡";
      }
    );

    const count =
      wishlist.length;

    $$(
      "[data-wishlist-count], #wishlistCount, #mobileMenuWishlistCount"
    ).forEach(
      element => {
        element.textContent =
          String(count);

        element.hidden =
          count <= 0;
      }
    );

    const badge =
      $("#wishlistHeaderCount");

    if (badge) {
      badge.textContent =
        String(count);

      badge.hidden =
        count <= 0;
    }

    renderWishlistItems();
  }

  function ensureFavoriteHeaderButton() {
    if (
      $("#aboTarekWishlistButton")
    ) {
      return;
    }

    const headerActions =
      $(".header-actions");

    if (headerActions) {
      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.id =
        "aboTarekWishlistButton";

      button.className =
        "wishlist-header-btn";

      button.setAttribute(
        "aria-label",
        "المفضلة"
      );

      button.innerHTML = `
        <span class="wishlist-header-icon">
          ♡
        </span>
        <span class="wishlist-header-text">
          المفضلة
        </span>
        <span
          class="wishlist-header-count"
          id="wishlistHeaderCount"
          hidden
        >0</span>
      `;

      headerActions.insertBefore(
        button,
        headerActions.firstChild
      );

      button.addEventListener(
        "click",
        openWishlist
      );
    }

    const mobilePanel =
      $(".mobile-menu-panel");

    if (
      mobilePanel &&
      !$("#mobileWishlistButton")
    ) {
      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.id =
        "mobileWishlistButton";

      button.className =
        "mobile-menu-link mobile-wishlist-link";

      button.innerHTML = `
        <span>♡</span>
        <strong>المفضلة</strong>
        <b
          id="mobileMenuWishlistCount"
          hidden
        >0</b>
      `;

      const cartButton =
        mobilePanel.querySelector(
          "[data-cart-button]"
        );

      if (
        cartButton &&
        cartButton.parentElement
      ) {
        cartButton.parentElement.after(
          button
        );
      } else {
        mobilePanel.appendChild(
          button
        );
      }

      button.addEventListener(
        "click",
        () => {
          closeWishlist();
          openWishlist();
        }
      );
    }
  }

  function ensureWishlistDrawer() {
    let drawer =
      $("#aboTarekWishlistDrawer");

    if (drawer) {
      return drawer;
    }

    drawer =
      document.createElement(
        "aside"
      );

    drawer.id =
      "aboTarekWishlistDrawer";

    drawer.className =
      "wishlist-drawer";

    drawer.setAttribute(
      "aria-hidden",
      "true"
    );

    drawer.innerHTML = `
      <div
        class="wishlist-backdrop"
        data-wishlist-close
      ></div>

      <div
        class="wishlist-panel"
        role="dialog"
        aria-modal="true"
        aria-label="المفضلة"
      >
        <header class="wishlist-header">
          <div>
            <span class="wishlist-eyebrow">
              ABO TAREK
            </span>
            <h2>
              المفضلة
              <small
                id="wishlistDrawerCount"
              >0</small>
            </h2>
          </div>

          <button
            type="button"
            class="wishlist-close"
            data-wishlist-close
            aria-label="إغلاق"
          >
            ×
          </button>
        </header>

        <div
          class="wishlist-items"
          id="wishlistItems"
        ></div>

        <div
          class="wishlist-empty"
          id="wishlistEmpty"
          hidden
        >
          <div>♡</div>
          <h3>المفضلة فاضية</h3>
          <p>
            اضغط على علامة ♡ بجانب أي صنف علشان ترجعه هنا.
          </p>
          <button
            type="button"
            class="primary-btn"
            data-wishlist-close
          >
            تصفح الأصناف
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(
      drawer
    );

    $$(
      "[data-wishlist-close]",
      drawer
    ).forEach(
      element => {
        element.addEventListener(
          "click",
          closeWishlist
        );
      }
    );

    return drawer;
  }

  function renderWishlistItems() {
    const drawer =
      $("#aboTarekWishlistDrawer");

    if (!drawer) {
      return;
    }

    const items =
      $("#wishlistItems");

    const empty =
      $("#wishlistEmpty");

    const count =
      $("#wishlistDrawerCount");

    if (!items || !empty) {
      return;
    }

    if (count) {
      count.textContent =
        String(wishlist.length);
    }

    if (!wishlist.length) {
      items.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;

    items.innerHTML =
      wishlist
        .map(
          product => {
            const price =
              getProductPrice(
                product
              );

            const image =
              getImages(
                product
              )[0];

            return `
              <article
                class="wishlist-item"
                data-wishlist-item="${escapeHtml(
                  product.id
                )}"
              >
                <button
                  type="button"
                  class="wishlist-item-image"
                  data-wishlist-open="${escapeHtml(
                    product.id
                  )}"
                  aria-label="فتح المنتج"
                >
                  ${
                    image
                      ? `
                        <img
                          src="${escapeHtml(
                            imageUrl(
                              image
                            )
                          )}"
                          alt="${escapeHtml(
                            product.name
                          )}"
                          loading="lazy"
                          decoding="async"
                        >
                      `
                      : `
                        <span>🏠</span>
                      `
                  }
                </button>

                <div class="wishlist-item-info">
                  <span>
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
                    price !== null
                      ? `
                        <strong>
                          ${escapeHtml(
                            formatPrice(
                              price
                            )
                          )}
                        </strong>
                      `
                      : `
                        <strong>
                          اسأل عن السعر
                        </strong>
                      `
                  }

                  <div class="wishlist-item-actions">
                    <button
                      type="button"
                      class="wishlist-cart-btn"
                      data-wishlist-cart="${escapeHtml(
                        product.id
                      )}"
                    >
                      🛒 للسلة
                    </button>

                    <button
                      type="button"
                      class="wishlist-remove-btn"
                      data-wishlist-remove="${escapeHtml(
                        product.id
                      )}"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            `;
          }
        )
        .join("");
  }

  function openWishlist() {
    const drawer =
      ensureWishlistDrawer();

    renderWishlistItems();

    drawer.classList.add(
      "is-open"
    );

    drawer.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "wishlist-open"
    );
  }

  function closeWishlist() {
    const drawer =
      $("#aboTarekWishlistDrawer");

    if (!drawer) return;

    drawer.classList.remove(
      "is-open"
    );

    drawer.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "wishlist-open"
    );
  }

  function ensureCartDrawer() {
    let drawer =
      $("#aboTarekCartDrawer");

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
      "cart-drawer";

    drawer.setAttribute(
      "aria-hidden",
      "true"
    );

    drawer.innerHTML = `
      <div
        class="cart-backdrop"
        data-cart-close
      ></div>

      <div
        class="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-label="سلة المشتريات"
      >
        <header class="cart-header">
          <div>
            <span class="cart-eyebrow">
              ABO TAREK
            </span>
            <h2>
              سلة المشتريات
            </h2>
          </div>

          <button
            type="button"
            class="cart-close"
            data-cart-close
          >
            ×
          </button>
        </header>

        <div
          class="cart-items"
          id="cartItems"
        ></div>

        <div
          class="cart-empty"
          id="cartEmpty"
          hidden
        >
          <div>🛒</div>
          <h3>السلة فاضية</h3>
          <p>
            أضف الأصناف اللي عايز تطلبها.
          </p>
        </div>

        <footer
          class="cart-summary"
          id="cartSummary"
        >
          <div>
            <span>عدد القطع</span>
            <strong id="cartSummaryCount">
              0
            </strong>
          </div>

          <div>
            <span>الإجمالي</span>
            <strong id="cartSummaryTotal">
              0 ج.م
            </strong>
          </div>

          <button
            type="button"
            class="checkout-whatsapp-btn"
            id="cartCheckoutWhatsApp"
          >
            💬 إتمام الطلب على واتساب
          </button>

          <button
            type="button"
            class="cart-clear-btn"
            id="cartClearButton"
          >
            تفريغ السلة
          </button>
        </footer>
      </div>
    `;

    document.body.appendChild(
      drawer
    );

    $$(
      "[data-cart-close]",
      drawer
    ).forEach(
      button =>
        button.addEventListener(
          "click",
          closeCart
        )
    );

    $("#cartClearButton", drawer)
      ?.addEventListener(
        "click",
        () => {
          if (!cart.length) return;

          clearCart();
          renderCartItems();
          showToast(
            "تم تفريغ السلة"
          );
        }
      );

    $("#cartCheckoutWhatsApp", drawer)
      ?.addEventListener(
        "click",
        checkoutWhatsApp
      );

    return drawer;
  }

  function renderCartItems() {
    const drawer =
      $("#aboTarekCartDrawer");

    if (!drawer) {
      return;
    }

    const items =
      $("#cartItems", drawer);

    const empty =
      $("#cartEmpty", drawer);

    const summary =
      $("#cartSummary", drawer);

    if (!items || !empty) {
      return;
    }

    if (!cart.length) {
      items.innerHTML = "";
      empty.hidden = false;

      if (summary) {
        summary.hidden = true;
      }

      return;
    }

    empty.hidden = true;

    if (summary) {
      summary.hidden = false;
    }

    items.innerHTML =
      cart
        .map(
          item => {
            const product =
              normalizeProduct(
                item.product ||
                item
              );

            const image =
              getImages(
                product
              )[0];

            const price =
              getProductPrice(
                product
              );

            return `
              <article
                class="cart-item"
                data-cart-item="${escapeHtml(
                  product.id
                )}"
              >
                <div class="cart-item-image">
                  ${
                    image
                      ? `
                        <img
                          src="${escapeHtml(
                            imageUrl(
                              image
                            )
                          )}"
                          alt="${escapeHtml(
                            product.name
                          )}"
                          loading="lazy"
                        >
                      `
                      : "🏠"
                  }
                </div>

                <div class="cart-item-info">
                  <span>
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
                    price !== null
                      ? `
                        <strong>
                          ${escapeHtml(
                            formatPrice(
                              price
                            )
                          )}
                        </strong>
                      `
                      : `
                        <strong>
                          اسأل عن السعر
                        </strong>
                      `
                  }

                  <div class="cart-quantity">
                    <button
                      type="button"
                      data-cart-minus="${escapeHtml(
                        product.id
                      )}"
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="1"
                      max="${MAX_QTY}"
                      value="${Number(
                        item.quantity
                      ) || 1}"
                      data-cart-quantity="${escapeHtml(
                        product.id
                      )}"
                    >

                    <button
                      type="button"
                      data-cart-plus="${escapeHtml(
                        product.id
                      )}"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  class="cart-remove"
                  data-cart-remove="${escapeHtml(
                    product.id
                  )}"
                  aria-label="حذف"
                >
                  ×
                </button>
              </article>
            `;
          }
        )
        .join("");

    const summaryCount =
      $("#cartSummaryCount");

    const summaryTotal =
      $("#cartSummaryTotal");

    if (summaryCount) {
      summaryCount.textContent =
        String(
          getCartCount()
        );
    }

    if (summaryTotal) {
      summaryTotal.textContent =
        formatPrice(
          getCartTotal()
        ) ||
        "السعر حسب الأصناف";
    }
  }

  function openCart() {
    const drawer =
      ensureCartDrawer();

    renderCartItems();

    drawer.classList.add(
      "is-open"
    );

    drawer.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "cart-open"
    );
  }

  function closeCart() {
    const drawer =
      $("#aboTarekCartDrawer");

    if (!drawer) return;

    drawer.classList.remove(
      "is-open"
    );

    drawer.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "cart-open"
    );
  }

  function checkoutWhatsApp() {
    if (!cart.length) {
      showToast(
        "السلة فاضية"
      );
      return;
    }

    const lines = cart.map(
      item => {
        const product =
          normalizeProduct(
            item.product ||
            item
          );

        return (
          `• ${product.name} × ${item.quantity}`
        );
      }
    );

    const total =
      getCartTotal();

    let message =
      "السلام عليكم، عايز أطلب الأصناف دي:\n\n" +
      lines.join("\n") +
      "\n\n";

    if (total > 0) {
      message +=
        `الإجمالي التقريبي: ${formatPrice(
          total
        )}`;
    } else {
      message +=
        "عايز أعرف الأسعار والتفاصيل.";
    }

    window.open(
      "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(
          message
        ),
      "_blank",
      "noopener"
    );
  }

  function addRecentlyViewed(
    product
  ) {
    if (!product?.id) {
      return;
    }

    let list =
      readStorage(
        RECENT_KEY,
        []
      );

    if (!Array.isArray(list)) {
      list = [];
    }

    list =
      list.filter(
        id =>
          String(id) !==
          String(product.id)
      );

    list.unshift(
      String(product.id)
    );

    writeStorage(
      RECENT_KEY,
      list.slice(0, 8)
    );
  }

  function ensureProductModal() {
    let modal =
      $("#aboTarekProductModal");

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
          id="productModalClose"
          aria-label="إغلاق"
        >
          ×
        </button>

        <div class="abo-product-details-modal">
          <div class="modal-product-image">
            <button
              type="button"
              class="modal-gallery-prev"
              id="modalGalleryPrev"
              aria-label="الصورة السابقة"
            >
              ‹
            </button>

            <img
              id="aboModalImage"
              alt=""
              width="700"
              height="700"
              decoding="async"
            >

            <button
              type="button"
              class="modal-gallery-next"
              id="modalGalleryNext"
              aria-label="الصورة التالية"
            >
              ›
            </button>
          </div>

          <div
            class="modal-thumbnails"
            id="modalThumbnails"
          ></div>

          <div class="modal-product-info">
            <span
              class="modal-category"
              id="aboModalCategory"
            ></span>

            <h2
              id="aboModalTitle"
            ></h2>

            <p
              id="aboModalDescription"
            ></p>

            <div
              class="modal-price-row"
              id="aboModalPrice"
            ></div>

            <div class="modal-quantity-row">
              <span>الكمية</span>

              <div class="modal-quantity">
                <button
                  type="button"
                  id="modalQtyMinus"
                >
                  −
                </button>

                <input
                  type="number"
                  id="modalQty"
                  min="1"
                  max="${MAX_QTY}"
                  value="1"
                >

                <button
                  type="button"
                  id="modalQtyPlus"
                >
                  +
                </button>
              </div>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="modal-add-cart"
                id="modalAddCart"
              >
                🛒 إضافة للسلة
              </button>

              <button
                type="button"
                class="modal-wishlist"
                id="modalWishlist"
              >
                ♡ المفضلة
              </button>

              <a
                class="modal-whatsapp"
                id="modalWhatsApp"
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 اسأل على واتساب
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(
      modal
    );

    $("#productModalClose")
      ?.addEventListener(
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

    $("#modalQtyMinus")
      ?.addEventListener(
        "click",
        () => {
          setModalQuantity(
            getModalQuantity() - 1
          );
        }
      );

    $("#modalQtyPlus")
      ?.addEventListener(
        "click",
        () => {
          setModalQuantity(
            getModalQuantity() + 1
          );
        }
      );

    $("#modalQty")
      ?.addEventListener(
        "change",
        event => {
          setModalQuantity(
            event.target.value
          );
        }
      );

    $("#modalGalleryPrev")
      ?.addEventListener(
        "click",
        () =>
          changeModalImage(-1)
      );

    $("#modalGalleryNext")
      ?.addEventListener(
        "click",
        () =>
          changeModalImage(1)
      );

    $("#modalAddCart")
      ?.addEventListener(
        "click",
        () => {
          if (!currentProduct) {
            return;
          }

          addToCart(
            currentProduct,
            getModalQuantity()
          );

          closeProductModal();
          openCart();
        }
      );

    $("#modalWishlist")
      ?.addEventListener(
        "click",
        () => {
          if (!currentProduct) {
            return;
          }

          toggleWishlist(
            currentProduct
          );

          updateModalWishlistButton();
        }
      );

    return modal;
  }

  function getModalQuantity() {
    const input =
      $("#modalQty");

    return Math.max(
      1,
      Math.min(
        MAX_QTY,
        Number(
          input?.value
        ) || 1
      )
    );
  }

  function setModalQuantity(
    value
  ) {
    const input =
      $("#modalQty");

    if (!input) return;

    input.value =
      String(
        Math.max(
          1,
          Math.min(
            MAX_QTY,
            Number(value) || 1
          )
        )
      );
  }

  function updateModalWishlistButton() {
    const button =
      $("#modalWishlist");

    if (!button || !currentProduct) {
      return;
    }

    const active =
      isInWishlist(
        currentProduct.id
      );

    button.classList.toggle(
      "is-active",
      active
    );

    button.textContent =
      active
        ? "♥ في المفضلة"
        : "♡ المفضلة";
  }

  function renderModalImages() {
    const image =
      $("#aboModalImage");

    const thumbnails =
      $("#modalThumbnails");

    if (!image) {
      return;
    }

    if (!currentProductImages.length) {
      image.removeAttribute(
        "src"
      );

      image.alt =
        currentProduct?.name ||
        "المنتج";

      if (thumbnails) {
        thumbnails.innerHTML =
          "";
      }

      return;
    }

    const current =
      currentProductImages[
        currentProductImageIndex
      ];

    image.src =
      imageUrl(current);

    image.alt =
      currentProduct?.name ||
      "صورة المنتج";

    if (thumbnails) {
      thumbnails.innerHTML =
        currentProductImages
          .map(
            (src, index) => `
              <button
                type="button"
                class="modal-thumbnail ${
                  index ===
                  currentProductImageIndex
                    ? "is-active"
                    : ""
                }"
                data-modal-image="${index}"
              >
                <img
                  src="${escapeHtml(
                    imageUrl(src)
                  )}"
                  alt=""
                  loading="lazy"
                >
              </button>
            `
          )
          .join("");
    }
  }

  function changeModalImage(
    direction
  ) {
    if (
      currentProductImages.length <
      2
    ) {
      return;
    }

    currentProductImageIndex =
      (
        currentProductImageIndex +
        direction +
        currentProductImages.length
      ) %
      currentProductImages.length;

    renderModalImages();
  }

  function openProductModal(
    product
  ) {
    if (!product) {
      return;
    }

    currentProduct =
      normalizeProduct(
        product
      );

    currentProductImages =
      getImages(
        currentProduct
      );

    currentProductImageIndex =
      0;

    addRecentlyViewed(
      currentProduct
    );

    const modal =
      ensureProductModal();

    const category =
      $("#aboModalCategory");

    const title =
      $("#aboModalTitle");

    const description =
      $("#aboModalDescription");

    const price =
      $("#aboModalPrice");

    const whatsapp =
      $("#modalWhatsApp");

    if (category) {
      category.textContent =
        currentProduct.category;
    }

    if (title) {
      title.textContent =
        currentProduct.name;
    }

    if (description) {
      description.textContent =
        currentProduct.description ||
        "لم يتم إضافة وصف لهذا الصنف بعد.";
    }

    if (price) {
      const current =
        getProductPrice(
          currentProduct
        );

      const old =
        toNumber(
          currentProduct.oldPrice
        );

      price.innerHTML =
        current !== null
          ? `
            <strong>
              ${escapeHtml(
                formatPrice(
                  current
                )
              )}
            </strong>
            ${
              currentProduct.isOffer &&
              old !== null &&
              old > current
                ? `
                  <del>
                    ${escapeHtml(
                      formatPrice(
                        old
                      )
                    )}
                  </del>
                `
                : ""
            }
          `
          : `
            <strong>
              اسأل عن السعر
            </strong>
          `;
    }

    const whatsappUrl =
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(
        `السلام عليكم، عايز أعرف تفاصيل عن صنف: ${currentProduct.name}`
      );

    if (whatsapp) {
      whatsapp.href =
        whatsappUrl;
    }

    setModalQuantity(1);
    renderModalImages();
    updateModalWishlistButton();

    modal.classList.add(
      "is-open"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "product-modal-open"
    );

    try {
      history.replaceState(
        null,
        "",
        location.href
      );
    } catch {}
  }

  function closeProductModal() {
    const modal =
      $("#aboTarekProductModal");

    if (!modal) return;

    modal.classList.remove(
      "is-open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "product-modal-open"
    );

    currentProduct = null;
    currentProductImages = [];
  }

  function openProductWhatsApp(
    product
  ) {
    const normalized =
      normalizeProduct(
        product
      );

    const url =
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(
        `السلام عليكم، عايز أعرف تفاصيل عن صنف: ${normalized.name}`
      );

    window.open(
      url,
      "_blank",
      "noopener"
    );
  }

  function bindGlobalEvents() {
    document.addEventListener(
      "click",
      event => {
        const favorite =
          event.target.closest(
            "[data-wishlist-id]"
          );

        if (favorite) {
          event.preventDefault();
          event.stopPropagation();

          const id =
            String(
              favorite.dataset
                .wishlistId
            );

          const product =
            findProduct(
              id
            );

          if (product) {
            toggleWishlist(
              product
            );
          }

          return;
        }

        const cartButton =
          event.target.closest(
            "[data-add-to-cart]"
          );

        if (cartButton) {
          event.preventDefault();
          event.stopPropagation();

          const product =
            findProduct(
              cartButton.dataset
                .addToCart
            );

          if (product) {
            addToCart(
              product,
              1
            );
          }

          return;
        }

        const genericCart =
          event.target.closest(
            "[data-cart-button]"
          );

        if (
          genericCart &&
          !event.target.closest(
            "#aboTarekCartDrawer"
          )
        ) {
          event.preventDefault();
          openCart();
          return;
        }

        const modalTrigger =
          event.target.closest(
            "[data-product-modal]"
          );

        if (modalTrigger) {
          event.preventDefault();

          const product =
            findProduct(
              modalTrigger.dataset
                .productModal
            );

          if (product) {
            openProductModal(
              product
            );
          }

          return;
        }

        const wishlistOpen =
          event.target.closest(
            "[data-wishlist-open]"
          );

        if (wishlistOpen) {
          event.preventDefault();

          const product =
            findWishlistProduct(
              wishlistOpen.dataset
                .wishlistOpen
            );

          if (product) {
            closeWishlist();
            openProductModal(
              product
            );
          }

          return;
        }

        const wishlistRemove =
          event.target.closest(
            "[data-wishlist-remove]"
          );

        if (wishlistRemove) {
          event.preventDefault();

          removeFromWishlist(
            wishlistRemove.dataset
              .wishlistRemove
          );

          return;
        }

        const wishlistCart =
          event.target.closest(
            "[data-wishlist-cart]"
          );

        if (wishlistCart) {
          event.preventDefault();

          const product =
            findWishlistProduct(
              wishlistCart.dataset
                .wishlistCart
            );

          if (product) {
            addToCart(
              product,
              1
            );
          }

          return;
        }

        const cartRemove =
          event.target.closest(
            "[data-cart-remove]"
          );

        if (cartRemove) {
          event.preventDefault();

          removeFromCart(
            cartRemove.dataset
              .cartRemove
          );

          renderCartItems();

          return;
        }

        const cartMinus =
          event.target.closest(
            "[data-cart-minus]"
          );

        if (cartMinus) {
          event.preventDefault();

          changeCartQuantity(
            cartMinus.dataset
              .cartMinus,
            -1
          );

          renderCartItems();

          return;
        }

        const cartPlus =
          event.target.closest(
            "[data-cart-plus]"
          );

        if (cartPlus) {
          event.preventDefault();

          changeCartQuantity(
            cartPlus.dataset
              .cartPlus,
            1
          );

          renderCartItems();

          return;
        }

        const thumbnail =
          event.target.closest(
            "[data-modal-image]"
          );

        if (thumbnail) {
          currentProductImageIndex =
            Number(
              thumbnail.dataset
                .modalImage
            ) || 0;

          renderModalImages();

          return;
        }
      }
    );

    document.addEventListener(
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
          input.dataset
            .cartQuantity,
          input.value
        );

        renderCartItems();
      }
    );

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key !==
          "Escape"
        ) {
          return;
        }

        closeWishlist();
        closeCart();
        closeProductModal();
      }
    );
  }

  function findProduct(id) {
    const target =
      String(id);

    const fromApp =
      window.ABO_TAREK_APP;

    if (
      fromApp &&
      typeof fromApp.getProducts ===
        "function"
    ) {
      const list =
        fromApp.getProducts();

      const found =
        list.find(
          product =>
            String(
              product.id
            ) === target
        );

      if (found) {
        return normalizeProduct(
          found
        );
      }
    }

    const element =
      document.querySelector(
        `[data-id="${CSS.escape(
          target
        )}"]`
      );

    if (element) {
      const name =
        element.querySelector(
          "h3"
        )?.textContent || "";

      return {
        id: target,
        name
      };
    }

    const saved =
      wishlist.find(
        product =>
          String(
            product.id
          ) === target
      );

    return saved ||
      null;
  }

  function findWishlistProduct(
    id
  ) {
    return (
      wishlist.find(
        product =>
          String(
            product.id
          ) ===
          String(id)
      ) ||
      findProduct(id)
    );
  }

  function exposeAPI() {
    const API = {
      addToCart,
      removeFromCart,
      changeCartQuantity,
      setCartQuantity,
      clearCart,
      getCartCount,
      getCartTotal,
      getCart,
      openCart,
      closeCart,

      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      getWishlist,
      openWishlist,
      closeWishlist,
      refreshWishlistUI,

      openProduct:
        openProductModal,

      openProductModal,
        openProductModal,

      closeProductModal,
      openProductWhatsApp,
      checkoutWhatsApp,

      formatPrice,
      getProductPrice,

      getCart
    };

    window.ABO_TAREK_FEATURES =
      API;

    window.ABO_TAREK_CART =
      API;

    window.ABO_TAREK_WISHLIST =
      API;
  }

  function init() {
    loadState();
    exposeAPI();
    ensureFavoriteHeaderButton();
    ensureWishlistDrawer();
    ensureCartDrawer();
    bindGlobalEvents();
    updateCartUI();
    refreshWishlistUI();

    window.setTimeout(
      () => {
        ensureFavoriteHeaderButton();
        refreshWishlistUI();
        updateCartUI();
      },
      400
    );

    window.setTimeout(
      () => {
        refreshWishlistUI();
        updateCartUI();
      },
      1200
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
