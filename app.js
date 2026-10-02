/* =========================================================
   ABO TAREK STORE - APP.JS (PRIME EDITION)
   ========================================================= */

(() => {
  "use strict";

  const DATA_URL =
    "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

  const WHATSAPP_NUMBER = "201551604163";
  const CACHE_KEY = "abo_tarek_products_v10";
  const CACHE_TIME = 30 * 60 * 1000;

  let cart = [];

  /* --- إدارة السلة العائمة --- */
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
          <strong>${item.name}</strong>
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
    message += "\nبرجاء التأكيد وتوضيح الإجمالي والتفاصيل.";

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  /* --- معالجة البيانات والصور --- */
  function cleanText(v) { return String(v ?? "").replace(/\s+/g, " ").trim(); }

  function normalizeProduct(p, index) {
    return {
      id: cleanText(p.id ?? p.ID) || `product-${index + 1}`,
      name: cleanText(p.name ?? p.Name) || "صنف بدون اسم",
      category: cleanText(p.category ?? p.Category) || "أدوات منزلية",
      image: cleanText(p.image ?? p.Image),
      description: cleanText(p.description ?? p.Description),
      active: p.active !== false && p.active !== "false",
      showHome: p.showHome !== false && p.showHome !== "false",
      isOffer: p.isOffer === true || p.isOffer === "true"
    };
  }

  async function fetchProducts() {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("HTTP error");
    const data = await res.json();
    const raw = Array.isArray(data) ? data : (data.products || []);
    return raw.map(normalizeProduct).filter(p => p.active);
  }

  /* --- بناء واجهة الصفحة --- */
  function createProductCard(product) {
    const article = document.createElement("article");
    article.className = "product";
    
    article.innerHTML = `
      <div class="product-image">
        ${product.image 
          ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
          : `<div class="product-image-placeholder">🏠</div>`
        }
      </div>
      <div class="product-body">
        <span class="product-category">${product.category}</span>
        <h3>${product.name}</h3>
        ${product.description ? `<p>${product.description.slice(0, 90)}...</p>` : ""}
        <div class="card-actions-grid">
          <button type="button" class="add-to-cart-btn">
            🛒 أضف للسلة
          </button>
          <a class="product-whatsapp" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('السلام عليكم، عايز استفسر عن: ' + product.name)}" target="_blank" rel="noopener">
            💬 سؤال
          </a>
        </div>
      </div>
    `;

    article.querySelector(".add-to-cart-btn").addEventListener("click", () => {
      window.addToCart(product);
    });

    return article;
  }

  async function startApp() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    try {
      const products = await fetchProducts();
      grid.innerHTML = "";
      
      const homeProducts = products.filter(p => p.showHome);
      homeProducts.forEach(p => {
        grid.appendChild(createProductCard(p));
      });

    } catch (err) {
      console.error(err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
})();
