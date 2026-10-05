/* =========================================================
   ABO TAREK STORE - FEATURES.JS
   Cart UI + Wishlist + Recently Viewed
   ========================================================= */

(function () {
  "use strict";

  const CFG = window.ABO_TAREK.CONFIG;
  const U = window.ABO_TAREK.UTILS;

  /* =========================================================
     CART - LOGIC
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
    updateCartUI();
  }

  function getProductPrice(product) {
    return U.parsePrice(product.offerPrice || product.price);
  }

  function cartCount() {
    return readCart().reduce((sum, i) => sum + i.quantity, 0);
  }

  function cartTotal() {
    return readCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
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
    openCart();

    document.querySelectorAll(`.abo-add-cart[data-cart-id="${CSS.escape(product.id)}"]`).forEach(btn => {
      btn.classList.add("added");
      const old = btn.innerHTML;
      btn.innerHTML = "✓ تمت الإضافة";
      setTimeout(() => { btn.classList.remove("added"); btn.innerHTML = old; }, 1400);
    });

    if (window.aboTrack) {
      window.aboTrack("add_to_cart", {
        content_ids: [product.id],
        content_name: product.name,
        content_category: product.category,
        value: price,
        currency: "EGP"
      });
    }
  }

  function changeCartQuantity(id, delta) {
    const cart = readCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    const filtered = item.quantity <= 0 ? cart.filter(i => i.id !== id) : cart;
    saveCart(filtered);
  }

  function removeFromCart(id) {
    saveCart(readCart().filter(i => i.id !== id));
  }

  function clearCart() {
    saveCart([]);
  }

  /* =========================================================
     CART - UI
     ========================================================= */

  function ensureCartButton() {
    let btn = document.getElementById("aboCartButton");
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = "aboCartButton";
    btn.className = "abo-cart-button";
    btn.type = "button";
    btn.setAttribute("aria-label", "سلة المشتريات");
    btn.innerHTML = `🛒 <span class="abo-cart-count">0</span> <span class="abo-cart-total">0</span>`;
    document.body.appendChild(btn);
    btn.addEventListener("click", openCart);
    return btn;
  }

  function ensureCartDrawer() {
    let drawer = document.getElementById("aboCartDrawer");
    if (drawer) return drawer;

    drawer = document.createElement("div");
    drawer.id = "aboCartDrawer";
    drawer.className = "abo-cart-drawer";
    drawer.innerHTML = `
      <div class="abo-cart-backdrop" data-close-cart></div>
      <aside class="abo-cart-panel" aria-label="سلة المشتريات">
        <div class="abo-cart-header">
          <div>
            <strong>سلة مشترياتك 🛒</strong>
            <span>راجع طلبك قبل الإرسال</span>
          </div>
          <button type="button" class="abo-cart-close" aria-label="إغلاق السلة">×</button>
        </div>
        <div class="abo-cart-items"></div>
        <div class="abo-cart-footer">
          <div class="abo-cart-summary">
            <span>إجمالي الطلب</span>
            <strong class="abo-cart-summary-total">0 جنيه</strong>
          </div>
          <a class="abo-cart-whatsapp" target="_blank" rel="noopener">💬 إرسال الطلب على واتساب</a>
          <button type="button" class="abo-cart-clear">مسح السلة</button>
        </div>
      </aside>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector(".abo-cart-close").addEventListener("click", closeCart);
    drawer.querySelector(".abo-cart-clear").addEventListener("click", clearCart);

    drawer.querySelector(".abo-cart-whatsapp").addEventListener("click", () => {
      if (window.aboTrack) {
        window.aboTrack("begin_checkout", {
          value: cartTotal(),
          currency: "EGP",
          num_items: cartCount()
        });
      }
    });

    drawer.addEventListener("click", event => {
      if (event.target.matches("[data-close-cart]")) { closeCart(); return; }

      const plus = event.target.closest("[data-cart-plus]");
      if (plus) { changeCartQuantity(plus.dataset.cartPlus, 1); return; }

      const minus = event.target.closest("[data-cart-minus]");
      if (minus) { changeCartQuantity(minus.dataset.cartMinus, -1); return; }

      const remove = event.target.closest("[data-cart-remove]");
      if (remove) { removeFromCart(remove.dataset.cartRemove); }
    });

    return drawer;
  }

  function cartWhatsAppUrl() {
    const cart = readCart();
    if (!cart.length) return "#";

    let msg = "السلام عليكم، عايز أطلب الأصناف دي:\n\n";
    cart.forEach((item, i) => {
      msg += `${i + 1}) ${item.name}\n`;
      msg += `الكمية: ${item.quantity}\n`;
      msg += `السعر: ${U.formatPrice(item.price)}\n`;
      msg += `الإجمالي: ${U.formatPrice(item.price * item.quantity)}\n\n`;
    });
    msg += "--------------------\n";
    msg += `إجمالي الطلب: ${U.formatPrice(cartTotal())}\n\n`;
    msg += "من موقع أبو طارق للأدوات المنزلية.";

    const waNumber = (window.ABO_TAREK?.CONFIG?.WHATSAPP_NUMBER) || "201551604163";
    return "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(msg);
  }

  function renderCart() {
    const drawer = document.getElementById("aboCartDrawer");
    if (!drawer) return;

    const items = drawer.querySelector(".abo-cart-items");
    const whatsapp = drawer.querySelector(".abo-cart-whatsapp");
    const total = drawer.querySelector(".abo-cart-summary-total");
    const cart = readCart();

    if (!items) return;

    if (!cart.length) {
      items.innerHTML = `
        <div class="abo-cart-empty">
          <div class="abo-cart-empty-icon">🛒</div>
          <strong>السلة لسه فاضية</strong>
          <span>اختار الأصناف اللي عايز تطلبها.</span>
        </div>
      `;
    } else {
      items.innerHTML = cart.map(item => {
        const sources = U.getImageSources(item.image);
        return `
          <div class="abo-cart-item">
            <div class="abo-cart-item-image">
              ${sources.length
                ? `<img src="${U.escapeAttribute(sources[0])}" alt="" loading="lazy">`
                : U.categoryIcon(item.category)}
            </div>
            <div class="abo-cart-item-info">
              <h4 class="abo-cart-item-name">${U.escapeHtml(item.name)}</h4>
              <div class="abo-cart-item-price">${U.escapeHtml(U.formatPrice(item.price))}</div>
              <div class="abo-cart-item-controls">
                <button type="button" class="abo-cart-qty-btn" data-cart-plus="${U.escapeAttribute(item.id)}">+</button>
                <span class="abo-cart-qty">${item.quantity}</span>
                <button type="button" class="abo-cart-qty-btn" data-cart-minus="${U.escapeAttribute(item.id)}">−</button>
                <button type="button" class="abo-cart-remove" data-cart-remove="${U.escapeAttribute(item.id)}" aria-label="حذف">🗑</button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    if (total) total.textContent = U.formatPrice(cartTotal()) || "0 جنيه";

    if (whatsapp) {
      whatsapp.href = cartWhatsAppUrl();
      whatsapp.style.pointerEvents = cart.length ? "auto" : "none";
      whatsapp.style.opacity = cart.length ? "1" : ".45";
    }
  }

  function updateCartUI() {
    ensureCartButton();
    const count = document.querySelector(".abo-cart-count");
    const total = document.querySelector(".abo-cart-total");
    if (count) count.textContent = cartCount();
    if (total) total.textContent = U.formatPrice(cartTotal()) || "0";
    renderCart();
  }

  function openCart() {
    ensureCartDrawer();
    renderCart();
    const drawer = document.getElementById("aboCartDrawer");
    if (!drawer) return;
    drawer.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    const drawer = document.getElementById("aboCartDrawer");
    if (!drawer) return;
    drawer.classList.remove("open");
    document.body.style.overflow = "";
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
    window.dispatchEvent(new CustomEvent("aboTarekRecentUpdated"));
  }

  function renderRecentlyViewed() {
    const section = document.getElementById("recentlyViewed");
    const grid = document.getElementById("recentlyViewedGrid");
    if (!section || !grid) return;

    const recent = readRecent();

    if (!recent.length) {
      section.hidden = true;
      return;
    }

    section.hidden = false;

    grid.innerHTML = recent.slice(0, 4).map(product => {
      const sources = U.getImageSources(product.image);
      const price = product.offerPrice || product.price || "";
      return `
        <article class="product" onclick="location.href='./product.html?id=${encodeURIComponent(product.id)}'" style="cursor:pointer">
          <div class="product-image">
            ${sources.length
              ? `<img src="${U.escapeAttribute(sources[0])}" alt="${U.escapeAttribute(product.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'product-image-placeholder\\'><span class=\\'placeholder-icon\\'>🛍️</span></div>'">`
              : `<div class="product-image-placeholder"><span class="placeholder-icon">🛍️</span></div>`
            }
          </div>
          <div class="product-body">
            <div class="product-meta">
              <span class="product-category">${U.categoryIcon(product.category)} ${U.escapeHtml(product.category)}</span>
            </div>
            <h3 class="product-name">${U.escapeHtml(product.name)}</h3>
            ${price ? `<div class="price-box"><span class="current-price">${U.escapeHtml(U.formatPrice(price))}</span></div>` : ""}
          </div>
        </article>
      `;
    }).join("");
  }

  /* =========================================================
     GLOBAL API
     ========================================================= */

  window.ABO_TAREK = window.ABO_TAREK || {};
  window.ABO_TAREK.addToCart = addToCart;
  window.ABO_TAREK.readCart = readCart;
  window.ABO_TAREK.openCart = openCart;
  window.ABO_TAREK.closeCart = closeCart;
  window.ABO_TAREK.Wishlist = {
    read: readWishlist, toggle: toggleWishlist, isIn: isInWishlist,
    count: wishlistCount, open: openWishlistDrawer, close: closeWishlistDrawer
  };
  window.ABO_TAREK.Recent = { read: readRecent, add: addToRecent };

  window.addToCart = addToCart;
  window.openAboTarekCart = openCart;
  window.closeAboTarekCart = closeCart;

  /* =========================================================
     KEYBOARD
     ========================================================= */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeCart();
      closeWishlistDrawer();
    }
  });

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    ensureCartButton();
    ensureCartDrawer();
    updateCartUI();
    updateWishlistUI();
    renderRecentlyViewed();
  }

  window.addEventListener("aboTarekRecentUpdated", renderRecentlyViewed);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("✅ features.js loaded (Cart + Wishlist + Recent)");

})();
