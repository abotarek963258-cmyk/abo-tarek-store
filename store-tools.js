
/* =========================================================
   ABO TAREK — SHARED CART & WISHLIST UI
   Dark Navy Luxury | Safe add-on for features.js
   ========================================================= */

(() => {
  "use strict";

  if (window.__ABO_TAREK_STORE_TOOLS__) return;
  window.__ABO_TAREK_STORE_TOOLS__ = true;

  const CART_KEY = "abo_tarek_cart_v1";
  const WISHLIST_KEY = "abo_tarek_wishlist_v1";
  const LOGO = "./assets/logo.png";

  let refreshTimer = null;

  const api = () => window.ABO_TAREK_FEATURES;

  function readStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getWishlist() {
    const current = api();
    if (current && typeof current.getWishlist === "function") {
      return current.getWishlist().map(item =>
        typeof item === "object"
          ? item
          : { id: String(item), name: "منتج" }
      );
    }
    return readStorage(WISHLIST_KEY);
  }

  function getCartCount() {
    const current = api();
    if (current && typeof current.getCartCount === "function") {
      return current.getCartCount();
    }

    return readStorage(CART_KEY).reduce(
      (sum, item) => sum + Math.max(1, Number(item.quantity) || 1),
      0
    );
  }

  function formatPrice(product) {
    const current = api();
    if (current && typeof current.getProductPrice === "function") {
      const price = current.getProductPrice(product);
      if (price !== null && price !== undefined) {
        return current.formatPrice(price);
      }
    }

    const raw = product.offerPrice ?? product.price;
    if (raw === null || raw === undefined || raw === "") {
      return "السعر عند الطلب";
    }

    const price = Number(String(raw).replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(price)) return "السعر عند الطلب";

    return new Intl.NumberFormat("ar-EG").format(price) + " ج.م";
  }

  function injectStyles() {
    if (document.getElementById("atSharedToolsStyles")) return;

    const style = document.createElement("style");
    style.id = "atSharedToolsStyles";

    style.textContent = `
      .at-tools-dock {
        position: fixed;
        left: 16px;
        bottom: 18px;
        z-index: 99970;
        display: flex;
        gap: 9px;
        direction: rtl;
        font-family: Cairo, system-ui, sans-serif;
      }

      .at-tools-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 47px;
        padding: 0 15px;
        border: 1px solid rgba(212,175,55,.45);
        border-radius: 15px;
        background: #071321;
        color: #f7f1e4;
        box-shadow: 0 8px 28px rgba(0,0,0,.28);
        font: inherit;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        transition: transform .18s ease, background .18s ease;
      }

      .at-tools-button:hover {
        transform: translateY(-2px);
        background: #10253a;
      }

      .at-tools-button .at-tools-icon {
        color: #d4af37;
        font-size: 19px;
        line-height: 1;
      }

      .at-tools-badge {
        display: inline-grid;
        min-width: 19px;
        height: 19px;
        padding: 0 4px;
        place-items: center;
        border-radius: 99px;
        background: #d4af37;
        color: #071321;
        font-size: 10px;
        font-weight: 900;
      }

      .at-wishlist-overlay {
        position: fixed;
        inset: 0;
        z-index: 100010;
        display: flex;
        justify-content: flex-start;
        background: rgba(0,0,0,.65);
        opacity: 0;
        pointer-events: none;
        transition: opacity .22s ease;
      }

      .at-wishlist-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }

      .at-wishlist-panel {
        display: flex;
        flex-direction: column;
        width: min(440px, 95vw);
        height: 100%;
        background: #071321;
        color: #f7f1e4;
        border-left: 1px solid rgba(212,175,55,.25);
        box-shadow: -20px 0 60px rgba(0,0,0,.35);
        transform: translateX(-100%);
        transition: transform .25s ease;
        direction: rtl;
        font-family: Cairo, system-ui, sans-serif;
      }

      .at-wishlist-overlay.open .at-wishlist-panel {
        transform: translateX(0);
      }

      .at-wishlist-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 18px;
        border-bottom: 1px solid rgba(212,175,55,.16);
      }

      .at-wishlist-heading {
        margin: 0;
        color: #f7f1e4;
        font-size: 18px;
        font-weight: 900;
      }

      .at-wishlist-subtitle {
        margin-top: 4px;
        color: #d4af37;
        font-size: 11px;
      }

      .at-wishlist-close {
        width: 39px;
        height: 39px;
        border: 1px solid rgba(212,175,55,.2);
        border-radius: 11px;
        background: rgba(255,255,255,.04);
        color: #f7f1e4;
        font-size: 23px;
        cursor: pointer;
      }

      .at-wishlist-list {
        flex: 1;
        overflow-y: auto;
        padding: 13px;
      }

      .at-wishlist-item {
        display: grid;
        grid-template-columns: 70px minmax(0,1fr);
        gap: 12px;
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid rgba(212,175,55,.14);
        border-radius: 14px;
        background: rgba(255,255,255,.035);
      }

      .at-wishlist-image {
        width: 70px;
        height: 78px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 10px;
        background: #f7f1e4;
      }

      .at-wishlist-image img {
        width: 100%;
        height: 100%;
        padding: 4px;
        object-fit: contain;
      }

      .at-wishlist-info {
        min-width: 0;
      }

      .at-wishlist-name {
        margin: 0;
        color: #f7f1e4;
        font-size: 12px;
        line-height: 1.7;
        font-weight: 900;
        overflow-wrap: anywhere;
      }

      .at-wishlist-category {
        margin-top: 2px;
        color: #96a3af;
        font-size: 10px;
      }

      .at-wishlist-price {
        margin-top: 5px;
        color: #d4af37;
        font-size: 11px;
        font-weight: 900;
      }

      .at-wishlist-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 9px;
      }

      .at-wishlist-actions button {
        min-height: 31px;
        padding: 0 9px;
        border-radius: 8px;
        font-family: inherit;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
      }

      .at-wishlist-add {
        border: 1px solid #d4af37;
        background: #d4af37;
        color: #071321;
      }

      .at-wishlist-remove {
        border: 1px solid rgba(255,255,255,.13);
        background: transparent;
        color: #aab3bc;
      }

      .at-wishlist-empty {
        min-height: 280px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #96a3af;
        text-align: center;
        font-size: 12px;
      }

      .at-wishlist-empty-icon {
        color: #d4af37;
        font-size: 42px;
      }

      .at-wishlist-empty strong {
        color: #f7f1e4;
        font-size: 15px;
      }

      @media (max-width: 520px) {
        .at-tools-dock {
          left: 10px;
          bottom: 12px;
          gap: 7px;
        }

        .at-tools-button {
          min-height: 43px;
          gap: 5px;
          padding: 0 11px;
          border-radius: 13px;
          font-size: 11px;
        }

        .at-tools-button .at-tools-icon {
          font-size: 17px;
        }

        .at-wishlist-item {
          grid-template-columns: 62px minmax(0,1fr);
          gap: 9px;
        }

        .at-wishlist-image {
          width: 62px;
          height: 70px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .at-tools-button,
        .at-wishlist-overlay,
        .at-wishlist-panel {
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createDock() {
    if (document.getElementById("atSharedToolsDock")) return;

    const dock = document.createElement("div");
    dock.id = "atSharedToolsDock";
    dock.className = "at-tools-dock";
    dock.innerHTML = `
      <button type="button" class="at-tools-button"
        data-cart-button aria-label="فتح سلة المشتريات">
        <span class="at-tools-icon" aria-hidden="true">🛒</span>
        <span>السلة</span>
        <span class="at-tools-badge" data-cart-count>0</span>
      </button>

      <button type="button" class="at-tools-button"
        data-open-wishlist aria-label="فتح المفضلة">
        <span class="at-tools-icon" aria-hidden="true">♥</span>
        <span>المفضلة</span>
        <span class="at-tools-badge" data-wishlist-count>0</span>
      </button>
    `;

    document.body.appendChild(dock);
  }

  function createWishlistDrawer() {
    if (document.getElementById("atWishlistOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "atWishlistOverlay";
    overlay.className = "at-wishlist-overlay";

    overlay.innerHTML = `
      <aside class="at-wishlist-panel" role="dialog"
        aria-modal="true" aria-label="المفضلة">
        <header class="at-wishlist-header">
          <div>
            <h2 class="at-wishlist-heading">♥ المنتجات المفضلة</h2>
            <div class="at-wishlist-subtitle" data-wishlist-subtitle>
              منتجات اخترتها بعناية
            </div>
          </div>
          <button type="button" class="at-wishlist-close"
            data-close-wishlist aria-label="إغلاق المفضلة">×</button>
        </header>
        <div class="at-wishlist-list" data-wishlist-list></div>
      </aside>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", event => {
      if (
        event.target === overlay ||
        event.target.closest("[data-close-wishlist]")
      ) {
        closeWishlist();
      }
    });

    overlay.querySelector("[data-wishlist-list]")
      .addEventListener("click", event => {
        const removeButton = event.target.closest("[data-remove-wishlist]");
        const addButton = event.target.closest("[data-add-wishlist-cart]");

        if (removeButton) {
          const current = api();
          if (current) {
            current.removeFromWishlist(removeButton.dataset.removeWishlist);
          }
          renderWishlist();
          refreshCounts();
          return;
        }

        if (addButton) {
          const id = addButton.dataset.addWishlistCart;
          const product = getWishlist().find(
            item => String(item.id) === String(id)
          );

          if (!product) return;

          const current = api();
          if (current && typeof current.addToCart === "function") {
            current.addToCart(product, 1);
            openCartAfterAdd();
          }
        }
      });
  }

  function openCartAfterAdd() {
    const current = api();
    if (current && typeof current.openCart === "function") {
      closeWishlist();
      current.openCart();
    }
  }

  function openWishlist() {
    createWishlistDrawer();
    renderWishlist();

    document.getElementById("atWishlistOverlay")
      .classList.add("open");

    document.body.classList.add("at-no-scroll");
  }

  function closeWishlist() {
    const overlay = document.getElementById("atWishlistOverlay");
    if (overlay) overlay.classList.remove("open");

    const cartOverlay = document.getElementById("aboTarekCartDrawer");
    const productOverlay = document.getElementById("aboTarekProductModal");

    if (
      (!cartOverlay || !cartOverlay.classList.contains("open")) &&
      (!productOverlay || !productOverlay.classList.contains("open"))
    ) {
      document.body.classList.remove("at-no-scroll");
    }
  }

  function renderWishlist() {
    const overlay = document.getElementById("atWishlistOverlay");
    if (!overlay) return;

    const list = overlay.querySelector("[data-wishlist-list]");
    const subtitle = overlay.querySelector("[data-wishlist-subtitle]");
    const items = getWishlist();

    subtitle.textContent = `${items.length} منتج في المفضلة`;

    if (!items.length) {
      list.innerHTML = `
        <div class="at-wishlist-empty">
          <div class="at-wishlist-empty-icon">♡</div>
          <strong>لسه مفيش منتجات في المفضلة</strong>
          <span>اضغط على علامة القلب عند أي منتج عشان تحفظه هنا.</span>
        </div>
      `;
      return;
    }

    list.innerHTML = items.map(item => {
      const id = String(item.id ?? "");
      const name = item.name || "منتج";
      const image = item.image || LOGO;

      return `
        <article class="at-wishlist-item">
          <div class="at-wishlist-image">
            <img src="${escapeHTML(image)}"
              alt="${escapeHTML(name)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='${LOGO}'">
          </div>
          <div class="at-wishlist-info">
            <h3 class="at-wishlist-name">${escapeHTML(name)}</h3>
            <div class="at-wishlist-category">
              ${escapeHTML(item.category || "أبو طارق للأدوات المنزلية")}
            </div>
            <div class="at-wishlist-price">${escapeHTML(formatPrice(item))}</div>
            <div class="at-wishlist-actions">
              <button type="button" class="at-wishlist-add"
                data-add-wishlist-cart="${escapeHTML(id)}">
                🛒 أضف للسلة
              </button>
              <button type="button" class="at-wishlist-remove"
                data-remove-wishlist="${escapeHTML(id)}">
                حذف من المفضلة
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function refreshCounts() {
    const cartCount = getCartCount();
    const wishlistCount = getWishlist().length;

    document.querySelectorAll("[data-cart-count]").forEach(element => {
      element.textContent = String(cartCount);
    });

    document.querySelectorAll("[data-wishlist-count]").forEach(element => {
      element.textContent = String(wishlistCount);
    });
  }

  function refreshAll() {
    refreshCounts();
    renderWishlist();
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshAll, 50);
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const openButton = event.target.closest("[data-open-wishlist]");
      if (openButton) {
        event.preventDefault();
        openWishlist();
        return;
      }

      if (
        event.target.closest("[data-wishlist-id]") ||
        event.target.closest("[data-cart-button]") ||
        event.target.closest("[data-cart-plus]") ||
        event.target.closest("[data-cart-minus]") ||
        event.target.closest("[data-cart-remove]") ||
        event.target.closest("[data-modal-add]")
      ) {
        scheduleRefresh();
      }
    });

    document.addEventListener("change", event => {
      if (event.target.closest("[data-cart-quantity]")) {
        scheduleRefresh();
      }
    });

    [
      "abo:tarek:wishlist:add",
      "abo:tarek:wishlist:remove",
      "abo:tarek:cart:add",
      "abo:tarek:cart:remove",
      "abo:tarek:cart:quantity"
    ].forEach(eventName => {
      document.addEventListener(eventName, scheduleRefresh);
    });

    window.addEventListener("storage", event => {
      if (!event.key || event.key === CART_KEY || event.key === WISHLIST_KEY) {
        scheduleRefresh();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeWishlist();
    });
  }

  function init() {
    if (!document.body) return;

    injectStyles();
    createDock();
    createWishlistDrawer();
    bindEvents();
    refreshAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
