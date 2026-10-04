/* =========================================================
   ABO TAREK STORE
   APP.JS - PREMIUM EDITION
   ========================================================= */

(() => {
  "use strict";

  const CFG = window.ABO_TAREK.CONFIG;
  const U = window.ABO_TAREK.UTILS;

  /* =========================================================
     STATE
     ========================================================= */

  let allProducts = [];
  let cart = [];
  let settings = { ...CFG.DEFAULT_SETTINGS };
  let productsPromise = null;

  /* =========================================================
     CACHE
     ========================================================= */

  function readCache(key, maxAge) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.time) return null;
      if (maxAge && Date.now() - data.time > maxAge) return null;
      return data;
    } catch (err) { return null; }
  }

  function writeCache(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify({ time: Date.now(), value }));
    } catch (err) {}
  }

  /* =========================================================
     API
     ========================================================= */

  async function fetchAll() {
    const response = await fetch(CFG.DATA_URL, { method: "GET", cache: "no-store", redirect: "follow" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    if (data && data.ok === false) throw new Error(data.error || "api_error");

    let rawProducts = [];
    if (Array.isArray(data)) rawProducts = data;
    else if (data && Array.isArray(data.products)) rawProducts = data.products;
    else if (data && Array.isArray(data.data)) rawProducts = data.data;

    const products = rawProducts
      .map(normalizeProduct)
      .filter(p => p.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    let settingsObj = { ...CFG.DEFAULT_SETTINGS };
    if (data && data.settings && typeof data.settings === "object") {
      settingsObj = { ...settingsObj, ...data.settings };
    }

    return { products, settings: settingsObj };
  }

  function normalizeProduct(raw, index) {
    const p = raw || {};
    return {
      id: U.cleanText(p.id ?? p.ID) || `product-${index + 1}`,
      name: U.cleanText(p.name ?? p.Name ?? p.title) || "صنف بدون اسم",
      category: U.cleanText(p.category ?? p.Category ?? p.cat) || "أدوات منزلية",
      image: U.cleanText(p.image ?? p.Image ?? p.imageUrl ?? p.photo),
      description: U.cleanText(p.description ?? p.Description ?? p.desc),
      active: U.isActive(p.active ?? p.Active ?? true),
      showHome: U.isFlagEnabled(p.showHome ?? p.ShowHome, false),
      isOffer: U.isFlagEnabled(p.isOffer ?? p.IsOffer, false),
      price: U.cleanText(p.price ?? p.Price),
      oldPrice: U.cleanText(p.oldPrice ?? p.OldPrice),
      offerPrice: U.cleanText(p.offerPrice ?? p.OfferPrice),
      sortOrder: Number(p.sortOrder ?? p.SortOrder ?? 0) || 0,
      searchIndex: U.normalizeArabic(`${p.name || ""} ${p.category || ""} ${p.description || ""}`)
    };
  }

  async function getAll() {
    const cachedProducts = readCache(CFG.CACHE_KEYS.PRODUCTS, CFG.CACHE_TIME);
    const cachedSettings = readCache(CFG.CACHE_KEYS.SETTINGS, CFG.SETTINGS_CACHE_TIME);

    if (cachedProducts && cachedSettings) {
      allProducts = cachedProducts.value || [];
      settings = { ...CFG.DEFAULT_SETTINGS, ...(cachedSettings.value || {}) };
      refreshInBackground();
      return;
    }

    if (!productsPromise) {
      productsPromise = fetchAll()
        .then(result => {
          allProducts = result.products;
          settings = result.settings;
          writeCache(CFG.CACHE_KEYS.PRODUCTS, allProducts);
          writeCache(CFG.CACHE_KEYS.SETTINGS, settings);
          return result;
        })
        .finally(() => { productsPromise = null; });
    }

    await productsPromise;
  }

  function refreshInBackground() {
    if (productsPromise) return;
    const cached = readCache(CFG.CACHE_KEYS.PRODUCTS);
    if (cached && Date.now() - cached.time < CFG.BACKGROUND_REFRESH_TIME) return;

    productsPromise = fetchAll()
      .then(result => {
        allProducts = result.products;
        settings = result.settings;
        writeCache(CFG.CACHE_KEYS.PRODUCTS, allProducts);
        writeCache(CFG.CACHE_KEYS.SETTINGS, settings);
      })
      .catch(() => null)
      .finally(() => { productsPromise = null; });
  }

  /* =========================================================
     SETTINGS APPLY
     ========================================================= */

  function applySettings() {
    const s = settings;

    // Site Name
    document.querySelectorAll("[data-setting='siteName']").forEach(el => el.textContent = s.siteName);
    document.querySelectorAll("[data-setting='siteTagline']").forEach(el => el.textContent = s.siteTagline);
    document.querySelectorAll("[data-setting='heroTitle']").forEach(el => el.textContent = s.heroTitle);
    document.querySelectorAll("[data-setting='heroSubtitle']").forEach(el => el.textContent = s.heroSubtitle);
    document.querySelectorAll("[data-setting='topStripText']").forEach(el => el.textContent = s.topStripText);
    document.querySelectorAll("[data-setting='address1']").forEach(el => el.textContent = s.address1);
    document.querySelectorAll("[data-setting='address2']").forEach(el => el.textContent = s.address2);

    // Images
    document.querySelectorAll("[data-setting='heroImage']").forEach(el => {
      if (el.tagName === "IMG") el.src = s.heroImage;
    });
    document.querySelectorAll("[data-setting='logoImage']").forEach(el => {
      if (el.tagName === "IMG") el.src = s.logoImage;
    });

    // WhatsApp Links
    const waUrl = "https://wa.me/" + s.whatsappNumber;
    document.querySelectorAll("[data-setting='whatsapp']").forEach(el => {
      el.href = waUrl;
    });

    // Phones
    const phones = [s.phone1, s.phone2, s.phone3, s.phone4].filter(Boolean);
    document.querySelectorAll("[data-setting='phones']").forEach(el => {
      el.innerHTML = phones.map(p =>
        `<a href="tel:${U.escapeAttribute(p)}"><span>📞</span>${U.escapeHtml(p)}</a>`
      ).join("");
    });

    // Social
    document.querySelectorAll("[data-setting='facebook']").forEach(el => el.href = s.facebookUrl);
    document.querySelectorAll("[data-setting='instagram']").forEach(el => el.href = s.instagramUrl);
    document.querySelectorAll("[data-setting='tiktok']").forEach(el => el.href = s.tiktokUrl);

    // Color
    if (s.primaryColor) {
      document.documentElement.style.setProperty("--gold-primary", s.primaryColor);
    }
  }

  /* =========================================================
     PRICE RENDER
     ========================================================= */

  function renderPrice(product) {
    const price = U.cleanText(product.price);
    const oldPrice = U.cleanText(product.oldPrice);
    const offerPrice = U.cleanText(product.offerPrice);

    if (!price && !oldPrice && !offerPrice) return "";

    const current = offerPrice || price;

    return `
      <div class="price-box">
        ${current ? `<strong class="current-price">${U.escapeHtml(U.formatPrice(current))}</strong>` : ""}
        ${oldPrice ? `<span class="old-price">${U.escapeHtml(U.formatPrice(oldPrice))}</span>` : ""}
      </div>
    `;
  }

  function getProductPrice(product) {
    return U.parsePrice(product.offerPrice || product.price);
  }

  /* =========================================================
     WHATSAPP
     ========================================================= */

  function whatsappUrl(product) {
    const name = U.cleanText(product.name);
    const baseUrl = window.location.origin + window.location.pathname;
    const productUrl = `${baseUrl}?product=${encodeURIComponent(product.id)}`;
    const message = name
      ? `السلام عليكم، عايز أعرف تفاصيل عن صنف: ${name}\n${productUrl}`
      : `السلام عليكم، عايز أعرف تفاصيل عن أحد الأصناف.\n${productUrl}`;
    return "https://wa.me/" + (settings.whatsappNumber || CFG.WHATSAPP_NUMBER) + "?text=" + encodeURIComponent(message);
  }

  /* =========================================================
     CART
     ========================================================= */

  function readCart() {
    try {
      const raw = localStorage.getItem(CFG.CACHE_KEYS.CART);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(i => i && i.id && Number(i.quantity) > 0)
        .map(i => ({
          id: String(i.id),
          name: U.cleanText(i.name),
          category: U.cleanText(i.category),
          image: U.cleanText(i.image),
          price: Number(i.price) || 0,
          quantity: Math.max(1, Number(i.quantity) || 1)
        }));
    } catch (err) { return []; }
  }

  function saveCart() {
    try {
      localStorage.setItem(CFG.CACHE_KEYS.CART, JSON.stringify(cart));
    } catch (err) {}
    updateCartUI();
  }

  function cartCount() {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }

  function cartTotal() {
    return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  function addToCart(product) {
    const price = getProductPrice(product);
    if (price <= 0) { openProductModal(product); return; }

    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({
      id: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      price,
      quantity: 1
    });

    saveCart();
    openCart();
    showAddedState(product.id);
  }

  function changeCartQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    saveCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
  }

  function showAddedState(id) {
    document.querySelectorAll(`.abo-add-cart[data-cart-id="${CSS.escape(id)}"]`).forEach(btn => {
      btn.classList.add("added");
      const old = btn.innerHTML;
      btn.innerHTML = "✓ تمت الإضافة";
      setTimeout(() => {
        btn.classList.remove("added");
        btn.innerHTML = old;
      }, 1400);
    });
  }

  function cartWhatsAppUrl() {
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
    return "https://wa.me/" + (settings.whatsappNumber || CFG.WHATSAPP_NUMBER) + "?text=" + encodeURIComponent(msg);
  }

  function ensureCart() {
    let btn = document.getElementById("aboCartButton");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "aboCartButton";
      btn.className = "abo-cart-button";
      btn.type = "button";
      btn.innerHTML = `🛒 <span class="abo-cart-count">0</span> <span class="abo-cart-total">0 جنيه</span>`;
      document.body.appendChild(btn);
      btn.addEventListener("click", openCart);
    }

    let drawer = document.getElementById("aboCartDrawer");
    if (drawer) return;

    drawer = document.createElement("div");
    drawer.id = "aboCartDrawer";
    drawer.className = "abo-cart-drawer";
    drawer.innerHTML = `
      <div class="abo-cart-backdrop" data-close-cart></div>
      <aside class="abo-cart-panel">
        <div class="abo-cart-header">
          <div>
            <strong>سلة مشترياتك 🛒</strong>
            <span>راجع طلبك قبل الإرسال</span>
          </div>
          <button type="button" class="abo-cart-close" aria-label="إغلاق">×</button>
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

    drawer.addEventListener("click", event => {
      if (event.target.matches("[data-close-cart]")) { closeCart(); return; }

      const plus = event.target.closest("[data-cart-plus]");
      if (plus) { changeCartQuantity(plus.dataset.cartPlus, 1); return; }

      const minus = event.target.closest("[data-cart-minus]");
      if (minus) { changeCartQuantity(minus.dataset.cartMinus, -1); return; }

      const remove = event.target.closest("[data-cart-remove]");
      if (remove) { removeFromCart(remove.dataset.cartRemove); }
    });
  }

  function renderCart() {
    const drawer = document.getElementById("aboCartDrawer");
    if (!drawer) return;

    const items = drawer.querySelector(".abo-cart-items");
    const whatsapp = drawer.querySelector(".abo-cart-whatsapp");
    const total = drawer.querySelector(".abo-cart-summary-total");
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
          <div class="abo-cart-item" data-cart-item="${U.escapeAttribute(item.id)}">
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
    ensureCart();
    const count = document.querySelector(".abo-cart-count");
    const total = document.querySelector(".abo-cart-total");
    if (count) count.textContent = cartCount();
    if (total) total.textContent = U.formatPrice(cartTotal()) || "0 جنيه";
    renderCart();
  }

  function openCart() {
    ensureCart();
    const drawer = document.getElementById("aboCartDrawer");
    if (!drawer) return;
    renderCart();
    drawer.classList.add("open");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    const drawer = document.getElementById("aboCartDrawer");
    if (!drawer) return;
    drawer.classList.remove("open");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
  }

  /* =========================================================
     PRODUCT CARD
     ========================================================= */

  function createProductImage(product, lazy = true) {
    const wrapper = document.createElement("div");
    wrapper.className = "product-image";
    const sources = U.getImageSources(product.image);

    if (!sources.length) {
      wrapper.innerHTML = `<div class="product-image-placeholder"><span class="placeholder-icon">${U.escapeHtml(U.categoryIcon(product.category))}</span></div>`;
      return wrapper;
    }

    const img = document.createElement("img");
    img.alt = product.name ? `صورة ${product.name}` : "صورة المنتج";
    img.width = 700;
    img.height = 700;
    img.decoding = "async";
    img.loading = lazy ? "lazy" : "eager";
    img.fetchPriority = lazy ? "low" : "high";
    img.src = sources[0];

    img.addEventListener("error", () => {
      wrapper.innerHTML = `<div class="product-image-placeholder"><span class="placeholder-icon">${U.escapeHtml(U.categoryIcon(product.category))}</span></div>`;
    }, { once: true });

    wrapper.appendChild(img);
    return wrapper;
  }

  function createProductCard(product, index) {
    const article = document.createElement("article");
    article.className = "product";
    article.dataset.id = product.id;
    article.appendChild(createProductImage(product, index > 1));

    const body = document.createElement("div");
    body.className = "product-body";

    const shortDesc = product.description
      ? (product.description.length > 115 ? product.description.slice(0, 115).trimEnd() + "..." : product.description)
      : "";

    const hasCartPrice = getProductPrice(product) > 0;

    body.innerHTML = `
      <div class="product-meta">
        <span class="product-category">${U.escapeHtml(product.category)}</span>
        ${product.isOffer ? `<span class="offer-badge">🔥 عرض</span>` : ""}
      </div>
      <h3 class="product-name">${U.escapeHtml(product.name)}</h3>
      ${shortDesc ? `<p class="product-description">${U.escapeHtml(shortDesc)}</p>` : ""}
      ${renderPrice(product)}
      <div class="product-actions">
        <button type="button" class="product-details-trigger product-details-main">تفاصيل الصنف <span>←</span></button>
        <a class="product-whatsapp" href="${U.escapeAttribute(whatsappUrl(product))}" target="_blank" rel="noopener">💬 واتساب</a>
      </div>
      ${hasCartPrice ? `<button type="button" class="abo-add-cart" data-cart-id="${U.escapeAttribute(product.id)}">🛒 أضف للسلة</button>` : ""}
    `;

    article.appendChild(body);

    article.addEventListener("click", event => {
      if (event.target.closest("a")) return;

      const addBtn = event.target.closest(".abo-add-cart");
      if (addBtn) {
        event.preventDefault();
        event.stopPropagation();
        addToCart(product);
        return;
      }

      if (event.target.closest(".product-details-trigger")) {
        event.preventDefault();
        event.stopPropagation();
        openProductModal(product);
        return;
      }

      openProductModal(product);
    });

    return article;
  }

  /* =========================================================
     HOMEPAGE
     ========================================================= */

  function initHomepage() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const explicitlyHome = allProducts.filter(p => p.showHome);
    const homeProducts = explicitlyHome.length ? explicitlyHome : allProducts;
    const offerProducts = allProducts.filter(p => p.isOffer);

    const offersSection = document.getElementById("offers");
    const offersGrid = document.getElementById("offersGrid");
    const filters = document.getElementById("filters");
    const categoryGrid = document.getElementById("categoryGrid");

    let activeCategory = "الكل";
    let searchTerm = "";

    const categories = [...new Set(homeProducts.map(p => p.category).filter(Boolean))];

    function renderCategories() {
      if (!categoryGrid) return;
      if (!categories.length) {
        categoryGrid.innerHTML = `<div class="empty">لا توجد أقسام متاحة حاليًا.</div>`;
        return;
      }
      categoryGrid.innerHTML = categories.map(category => {
        const count = allProducts.filter(p => p.category === category && p.active).length;
        return `
          <button class="cat" type="button" data-category="${U.escapeAttribute(category)}">
            <span class="cat-icon">${U.escapeHtml(U.categoryIcon(category))}</span>
            <span class="cat-content">
              <strong>${U.escapeHtml(category)}</strong>
              <small>${count} ${count === 1 ? "صنف" : "أصناف"}</small>
            </span>
            <span class="cat-arrow">←</span>
          </button>
        `;
      }).join("");
    }

    function renderFilters() {
      if (!filters) return;
      filters.innerHTML = `
        <button class="filter active" type="button" data-filter="الكل">🛍️ الكل</button>
        ${categories.map(c => `
          <button class="filter" type="button" data-filter="${U.escapeAttribute(c)}">
            ${U.escapeHtml(U.categoryIcon(c))} ${U.escapeHtml(c)}
          </button>
        `).join("")}
      `;
    }

    function getFiltered() {
      const query = U.normalizeArabic(searchTerm);
      return homeProducts.filter(p => {
        const catMatch = activeCategory === "الكل" || p.category === activeCategory;
        const searchMatch = !query || p.searchIndex.includes(query);
        return catMatch && searchMatch;
      });
    }

    function renderProducts() {
      const list = getFiltered();
      if (!list.length) {
        grid.innerHTML = `
          <div class="empty">
            <div class="empty-icon">🔎</div>
            <h3>مفيش أصناف مطابقة</h3>
            <p>جرّب اسم صنف تاني أو اختار قسم مختلف.</p>
          </div>
        `;
        return;
      }
      const frag = document.createDocumentFragment();
      list.forEach((p, i) => frag.appendChild(createProductCard(p, i)));
      grid.replaceChildren(frag);
    }

    function renderOffers() {
      if (!offersGrid || !offersSection) return;
      if (!offerProducts.length) {
        offersGrid.innerHTML = "";
        offersSection.hidden = true;
        return;
      }
      const frag = document.createDocumentFragment();
      offerProducts.forEach((p, i) => frag.appendChild(createProductCard(p, i)));
      offersGrid.replaceChildren(frag);
      offersSection.hidden = false;
    }

    if (filters) {
      filters.addEventListener("click", event => {
        const btn = event.target.closest("[data-filter]");
        if (!btn) return;
        activeCategory = btn.dataset.filter || "الكل";
        filters.querySelectorAll(".filter").forEach(f => f.classList.toggle("active", f === btn));
        renderProducts();
      });
    }

    if (categoryGrid) {
      categoryGrid.addEventListener("click", event => {
        const btn = event.target.closest("[data-category]");
        if (!btn) return;
        const category = btn.dataset.category || "الكل";
        window.location.href = "./sections.html?category=" + encodeURIComponent(category);
      });
    }

    renderCategories();
    renderFilters();
    renderProducts();
    renderOffers();
  }

  /* =========================================================
     PRODUCT MODAL
     ========================================================= */

  function ensureModal() {
    let modal = document.getElementById("aboTarekProductModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "aboTarekProductModal";
    modal.className = "product-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="product-modal-backdrop" data-close-modal></div>
      <div class="product-modal-dialog" role="dialog" aria-modal="true">
        <button type="button" class="product-modal-close" aria-label="إغلاق">×</button>
        <div class="product-modal-image-wrap">
          <img id="aboModalImage" class="product-modal-image" alt="" width="700" height="700" decoding="async">
        </div>
        <div class="product-modal-content">
          <span id="aboModalCategory" class="product-modal-category"></span>
          <h2 id="aboModalName"></h2>
          <p id="aboModalDescription" class="product-modal-description"></p>
          <div id="aboModalPrice" class="modal-price-box"></div>
          <button type="button" id="aboModalAddCart" class="abo-add-cart">🛒 أضف للسلة</button>
          <a id="aboModalWhatsApp" class="product-whatsapp modal-whatsapp" target="_blank" rel="noopener">💬 اسأل عن الصنف على واتساب</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".product-modal-close").addEventListener("click", closeProductModal);
    modal.addEventListener("click", event => {
      if (event.target.matches("[data-close-modal]")) closeProductModal();
    });

    return modal;
  }

  function openProductModal(product) {
    const modal = ensureModal();

    const image = document.getElementById("aboModalImage");
    const category = document.getElementById("aboModalCategory");
    const name = document.getElementById("aboModalName");
    const description = document.getElementById("aboModalDescription");
    const price = document.getElementById("aboModalPrice");
    const whatsapp = document.getElementById("aboModalWhatsApp");
    const addBtn = document.getElementById("aboModalAddCart");

    const sources = U.getImageSources(product.image);

    if (image) {
      if (sources.length) {
        image.src = sources[0];
        image.style.display = "block";
        image.alt = `صورة ${product.name}`;
      } else {
        image.removeAttribute("src");
        image.style.display = "none";
      }
    }

    if (category) category.textContent = product.category;
    if (name) name.textContent = product.name;
    if (description) description.textContent = product.description || "للاستفسار عن تفاصيل الصنف، تواصل معنا على واتساب.";
    if (price) price.innerHTML = renderPrice(product);
    if (whatsapp) whatsapp.href = whatsappUrl(product);

    if (addBtn) {
      if (getProductPrice(product) > 0) {
        addBtn.style.display = "flex";
        addBtn.onclick = () => addToCart(product);
      } else {
        addBtn.style.display = "none";
      }
    }

    modal.classList.add("show", "open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
  }

  function closeProductModal() {
    const modal = document.getElementById("aboTarekProductModal");
    if (!modal) return;
    modal.classList.remove("show", "open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
  }

  /* =========================================================
     MOBILE NAV
     ========================================================= */

  function initMobileNav() {
    const menuBtn = document.getElementById("menuBtn");
    const nav = document.getElementById("navLinks");
    if (!menuBtn || !nav) return;

    menuBtn.addEventListener("click", event => {
      event.stopPropagation();
      const opened = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", opened ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", event => {
      if (!event.target.closest(".site-header")) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* =========================================================
     ERROR STATE
     ========================================================= */

  function showError() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    grid.innerHTML = `
      <div class="empty error-state">
        <div class="empty-icon">⚠️</div>
        <h3>تعذر تحميل الأصناف</h3>
        <p>حصلت مشكلة أثناء الاتصال بالبيانات. حاول تحديث الصفحة.</p>
        <button type="button" id="retryProducts" class="primary-btn">🔄 إعادة المحاولة</button>
      </div>
    `;
    const retry = document.getElementById("retryProducts");
    if (retry) {
      retry.addEventListener("click", () => {
        try {
          localStorage.removeItem(CFG.CACHE_KEYS.PRODUCTS);
          localStorage.removeItem(CFG.CACHE_KEYS.SETTINGS);
        } catch (err) {}
        window.location.reload();
      });
    }
  }

  /* =========================================================
     START
     ========================================================= */

  async function startApp() {
    initMobileNav();
    cart = readCart();
    ensureCart();
    updateCartUI();

    const grid = document.getElementById("productsGrid");
    if (grid) {
      grid.innerHTML = `<div class="loading"><span class="loading-spinner"></span> جاري تحميل الأصناف...</div>`;
    }

    try {
      await getAll();
      applySettings();
      initHomepage();
    } catch (err) {
      console.error("Abo Tarek error:", err);
      const cached = readCache(CFG.CACHE_KEYS.PRODUCTS, CFG.CACHE_TIME);
      if (cached && cached.value && cached.value.length) {
        allProducts = cached.value;
        const cachedSettings = readCache(CFG.CACHE_KEYS.SETTINGS, CFG.SETTINGS_CACHE_TIME);
        if (cachedSettings) settings = { ...CFG.DEFAULT_SETTINGS, ...cachedSettings.value };
        applySettings();
        initHomepage();
        return;
      }
      showError();
    }
  }

  /* =========================================================
     GLOBAL
     ========================================================= */

  window.openProductModal = openProductModal;
  window.closeProductModal = closeProductModal;
  window.openAboTarekCart = openCart;
  window.closeAboTarekCart = closeCart;

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeProductModal();
      closeCart();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }

})();
