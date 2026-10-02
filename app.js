/* =========================================================
   ABO TAREK STORE - APP.JS (PRIME FULL INTEGRATED)
   ========================================================= */

(() => {
  "use strict";

  const DATA_URL = "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";
  const WHATSAPP_NUMBER = "201551604163";

  let allProducts = [];
  let currentCategory = "ALL";
  let searchQuery = "";
  let cart = [];

  /* --- إدارة السلة العائمة (Floating Cart Logic) --- */
  window.addToCart = function(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
    openCartDrawer();
  };

  window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
  };

  function updateCartUI() {
    const cartBody = document.getElementById("cartDrawerBody");
    const cartCount = document.getElementById("cartCountBadge");
    const cartTrigger = document.getElementById("cartTriggerBtn");
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

    if (cartCount) cartCount.textContent = totalCount;
    if (cartTrigger) cartTrigger.style.display = totalCount > 0 ? "flex" : "none";

    if (!cartBody) return;

    if (cart.length === 0) {
      cartBody.innerHTML = `<div style="text-align:center; padding: 25px; color: #888;">🛒 السلة فارغة حالياً</div>`;
      return;
    }

    cartBody.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${escapeHtml(item.name)}</strong>
          <span>العدد: ${item.qty}</span>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">×</button>
      </div>
    `).join("");
  }

  window.openCartDrawer = function() {
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.add("open");
  };

  window.closeCartDrawer = function() {
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.remove("open");
  };

  window.sendCartToWhatsApp = function() {
    if (cart.length === 0) return;

    let message = "السلام عليكم، حابب أطلب الأغراض دي من المحل:\n\n";
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}* (العدد: ${item.qty})\n`;
    });
    message += "\nبرجاء التأكيد وتوضيح التفاصيل.";

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  /* --- أدوات تنظيف البيانات والنصوص --- */
  function cleanText(v) { return String(v ?? "").replace(/\s+/g, " ").trim(); }
  function escapeHtml(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeProduct(p, index) {
    return {
      id: cleanText(p.id ?? p.ID) || `product-${index + 1}`,
      name: cleanText(p.name ?? p.Name) || "صنف بدون اسم",
      category: cleanText(p.category ?? p.Category) || "أدوات منزلية",
      image: cleanText(p.image ?? p.Image),
      description: cleanText(p.description ?? p.Description),
      active: p.active !== false && p.active !== "false" && p.active !== "0",
      showHome: p.showHome !== false && p.showHome !== "false" && p.showHome !== "0",
      isOffer: p.isOffer === true || p.isOffer === "true"
    };
  }

  /* --- جلب المنتجات من قاعدة البيانات --- */
  async function fetchProducts() {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("HTTP error");
    const data = await res.json();
    const raw = Array.isArray(data) ? data : (data.products || []);
    return raw.map(normalizeProduct).filter(p => p.active);
  }

  /* --- رسم كروت المنتجات وتفعيل الأزرار --- */
  function createProductCard(product) {
    const article = document.createElement("article");
    article.className = "product";

    article.innerHTML = `
      <div class="product-image">
        ${product.image 
          ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">`
          : `<div class="product-image-placeholder">🏠</div>`
        }
      </div>
      <div class="product-body">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        ${product.description ? `<p>${escapeHtml(product.description)}</p>` : ""}
        <div class="card-actions-grid">
          <button type="button" class="add-to-cart-btn" id="add-btn-${product.id}">
            🛒 أضف للسلة
          </button>
          <a class="product-whatsapp" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('السلام عليكم، محتاج استفسر عن: ' + product.name)}" target="_blank" rel="noopener">
            💬 سؤال
          </a>
        </div>
      </div>
    `;

    article.querySelector(`#add-btn-${product.id}`).addEventListener("click", () => {
      window.addToCart(product);
    });

    return article;
  }

  /* --- الفلترة والبحث المتقدم --- */
  function renderFilteredProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    let filtered = allProducts;

    if (currentCategory !== "ALL") {
      filtered = filtered.filter(p => p.category === currentCategory);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    grid.innerHTML = "";

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">لا توجد أصناف تطابق البحث.</div>`;
      return;
    }

    filtered.forEach(p => {
      grid.appendChild(createProductCard(p));
    });
  }

  /* --- بناء أزرار الأقسام والبحث --- */
  function setupCategoriesAndSearch() {
    const filtersContainer = document.getElementById("filters");
    const searchInput = document.getElementById("searchInput");

    if (filtersContainer) {
      const categories = ["ALL", ...new Set(allProducts.map(p => p.category))];
      filtersContainer.innerHTML = categories.map(cat => `
        <button class="filter ${cat === currentCategory ? 'active' : ''}" data-cat="${cat}">
          ${cat === "ALL" ? "الكل" : cat}
        </button>
      `).join("");

      filtersContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("filter")) {
          document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
          e.target.classList.add("active");
          currentCategory = e.target.getAttribute("data-cat");
          renderFilteredProducts();
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderFilteredProducts();
      });
    }
  }

  /* --- تشغيل التطبيق --- */
  async function startApp() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    try {
      allProducts = await fetchProducts();
      setupCategoriesAndSearch();
      renderFilteredProducts();
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: red;">تعذر تحميل المنتجات، يرجى إعادة المحاولة.</div>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
})();
