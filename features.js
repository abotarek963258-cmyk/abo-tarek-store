/* =========================================================
   ABO TAREK STORE - FEATURES.JS
   Wishlist + Recently Viewed + Cart + Global API
   ========================================================= */

(function () {
  "use strict";

  const CFG = window.ABO_TAREK.CONFIG;
  const U = window.ABO_TAREK.UTILS;

  /* =========================================================
     CART (Global)
     ========================================================= */

  function readCart() {
    try {
      const raw = localStorage.getItem(CFG.CACHE_KEYS.CART);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(i => i && i.id && Number(i.quantity) > 0).map(i => ({
        id: String(i.id), name: U.cleanText(i.name), category: U.cleanText(i.category),
        image: U.cleanText(i.image), price: Number(i.price) || 0,
        quantity: Math.max(1, Number(i.quantity) || 1)
      }));
    } catch (err) { return []; }
  }

  function saveCart(cart) {
    try { localStorage.setItem(CFG.CACHE_KEYS.CART, JSON.stringify(cart)); } catch (err) {}
    window.dispatchEvent(new CustomEvent("aboTarekCartUpdated"));
  }

  function getProductPrice(product) {
    return U.parsePrice(product.offerPrice || product.price);
  }

  function addToCart(product) {
    if (!product) return;
    const price = getProductPrice(product);
    if (price <= 0) {
      if (window.openProductModal) window.openProductModal(product);
      return;
    }

    const cart = readCart();
    const existing = cart.find(i => i.id === product.id);

    if (existing) existing.quantity += 1;
    else cart.push({
      id: product.id, name: product.name, category: product.category,
      image: product.image, price, quantity: 1
    });

    saveCart(cart);

    if (window.openAboTarekCart) window.openAboTarekCart();

    document.querySelectorAll(`.abo-add-cart[data-cart-id="${CSS.escape(product.id)}"]`).forEach(btn => {
      btn.classList.add("added");
      const old = btn.innerHTML;
      btn.innerHTML = "✓ تمت الإضافة";
      setTimeout(() => { btn.classList.remove("added"); btn.innerHTML = old; }, 1400);
    });
  }

  /* =========================================================
     WISHLIST
     ========================================================= */

  function readWishlist() {
    try {
      const raw = localStorage.getItem(CFG.CACHE_KEYS.WISHLIST);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) { return []; }
  }

  function saveWishlist(list) {
    try { localStorage.setItem(CFG.CACHE_KEYS.WISHLIST, JSON.stringify(list)); } catch (err) {}
    updateWishlistUI();
    window.dispatchEvent(new CustomEvent("aboTarekWishlistUpdated"));
  }

  function isInWishlist(id) {
    return readWishlist().some(item => String(item.id) === String(id));
  }

  function toggleWishlist(product) {
    if (!product || !product.id) return false;
    const list = readWishlist();
    const existingIndex = list.findIndex(i => String(i.id) === String(product.id));

    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
      saveWishlist(list);
      return false;
    } else {
      list.push({
        id: product.id, name: product.name, category: product.category,
        image: product.image, price: product.price,
        offerPrice: product.offerPrice, oldPrice: product.oldPrice
      });
      saveWishlist(list);
      return true;
    }
  }

  function wishlistCount() { return readWishlist().length; }

  /* =========================================================
     WISHLIST UI
     ========================================================= */

  function ensureWishlistButton() {
    let btn = document.getElementById("aboWishlistButton");
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = "aboWishlistButton";
    btn.className = "abo-wishlist-button";
    btn.type = "button";
    btn.setAttribute("aria-label", "المفضلة");
    btn.innerHTML = `❤️ <span class="abo-wishlist-count">0</span>`;
    document.body.appendChild(btn);
    btn.addEventListener("click", openWishlistDrawer);
    return btn;
  }

  function ensureWishlistDrawer() {
    let drawer = document.getElementById("aboWishlistDrawer");
    if (drawer) return drawer;

    drawer = document.createElement("div");
    drawer.id = "aboWishlistDrawer";
    drawer.className = "abo-wishlist-drawer";
    drawer.innerHTML = `
      <div class="abo-wishlist-backdrop" data-close-wishlist></div>
      <aside class="abo-wishlist-panel">
        <div class="abo-wishlist-header">
          <div>
            <strong>❤️ المفضلة</strong>
            <span>المنتجات اللي عجبتك</span>
          </div>
          <button type="button" class="abo-wishlist-close" aria-label="إغلاق">×</button>
        </div>
        <div class="abo-wishlist-items"></div>
      </aside>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector(".abo-wishlist-close").addEventListener("click", closeWishlistDrawer);
    drawer.addEventListener("click", event => {
      if (event.target.matches("[data-close-wishlist]")) closeWishlistDrawer();

      const remove = event.target.closest("[data-wishlist-remove]");
      if (remove) {
        const id = remove.dataset.wishlistRemove;
        saveWishlist(readWishlist().filter(i => String(i.id) !== String(id)));
      }

      const addBtn = event.target.closest("[data-wishlist-add-cart]");
      if (addBtn) {
        const id = addBtn.dataset.wishlistAddCart;
        const item = readWishlist().find(i => String(i.id) === String(id));
        if (item) addToCart(item);
      }
    });

    return drawer;
  }

  function renderWishlist() {
    const drawer = ensureWishlistDrawer();
    const items = drawer.querySelector(".abo-wishlist-items");
    const list = readWishlist();

    if (!list.length) {
      items.innerHTML = `
        <div class="abo-wishlist-empty">
          <div class="abo-wishlist-empty-icon">❤️</div>
          <strong>المفضلة فاضية</strong>
          <span>اضغط على القلب في أي منتج لحفظه هنا.</span>
        </div>
      `;
      return;
    }

    items.innerHTML = list.map(item => {
      const sources = U.getImageSources(item.image);
      const price = item.offerPrice || item.price || "";
      return `
        <div class="abo-wishlist-item">
          <div class="abo-wishlist-item-image">
            ${sources.length
              ? `<img src="${U.escapeAttribute(sources[0])}" alt="" loading="lazy">`
              : U.categoryIcon(item.category)}
          </div>
          <div class="abo-wishlist-item-info">
            <h4>${U.escapeHtml(item.name)}</h4>
            <div class="abo-wishlist-item-price">${U.escapeHtml(U.formatPrice(price))}</div>
            <div class="abo-wishlist-item-actions">
              <button type="button" class="abo-wishlist-add-cart" data-wishlist-add-cart="${U.escapeAttribute(item.id)}">🛒 أضف للسلة</button>
              <button type="button" class="abo-wishlist-remove" data-wishlist-remove="${U.escapeAttribute(item.id)}" aria-label="حذف">🗑</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function updateWishlistUI() {
    ensureWishlistButton();
    const count = document.querySelector(".abo-wishlist-count");
    if (count) count.textContent = wishlistCount();
    renderWishlist();
  }

  function openWishlistDrawer() {
    ensureWishlistDrawer();
    renderWishlist();
    document.getElementById("aboWishlistDrawer").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeWishlistDrawer() {
    const drawer = document.getElementById("aboWishlistDrawer");
    if (!drawer) return;
    drawer.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* =========================================================
     RECENTLY VIEWED
     ========================================================= */

  function readRecent() {
    try {
      const raw = localStorage.getItem(CFG.CACHE_KEYS.RECENT);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) { return []; }
  }

  function saveRecent(list) {
    try { localStorage.setItem(CFG.CACHE_KEYS.RECENT, JSON.stringify(list)); } catch (err) {}
  }

  function addToRecent(product) {
    if (!product || !product.id) return;
    let list = readRecent();
    list = list.filter(item => String(item.id) !== String(product.id));
    list.unshift({
      id: product.id, name: product.name, category: product.category,
      image: product.image, price: product.price,
      offerPrice: product.offerPrice, oldPrice: product.oldPrice
    });
    list = list.slice(0, 8);
    saveRecent(list);
  }

  /* =========================================================
     GLOBAL API
     ========================================================= */

  window.ABO_TAREK = window.ABO_TAREK || {};
  window.ABO_TAREK.addToCart = addToCart;
  window.ABO_TAREK.readCart = readCart;
  window.ABO_TAREK.Wishlist = {
    read: readWishlist, toggle: toggleWishlist, isIn: isInWishlist,
    count: wishlistCount, open: openWishlistDrawer, close: closeWishlistDrawer
  };
  window.ABO_TAREK.Recent = { read: readRecent, add: addToRecent };

  // Also expose globally for backwards compat
  window.addToCart = addToCart;

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    updateWishlistUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("✅ features.js loaded");

})();
