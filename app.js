/* =========================================================
   ABO TAREK STORE
   APP.JS - PREMIUM MASTER EDITION
   Wishlist + Cart + Analytics + Product Page Navigation
   Compatible with CONFIG / UTILS
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};
  const CFG = ROOT.CONFIG || window.ABO_TAREK_CONFIG || {};
  const U = ROOT.UTILS || {};

  if (!CFG || !U) {
    console.error("Abo Tarek: CONFIG / UTILS not found.");
    return;
  }

  /* =========================================================
     STATE
     ========================================================= */

  let allProducts = [];
  let cart = [];
  let settings = { ...(CFG.DEFAULT_SETTINGS || {}) };
  let productsPromise = null;
  let appStarted = false;

  /* =========================================================
     SAFE HELPERS
     ========================================================= */

  function cleanText(value) {
    if (typeof U.cleanText === "function") {
      return U.cleanText(value);
    }

    if (value === null || value === undefined) return "";
    return String(value).trim();
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

  function normalizeArabic(value) {
    if (typeof U.normalizeArabic === "function") {
      return U.normalizeArabic(value);
    }

    return cleanText(value)
      .toLowerCase()
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي");
  }

  function isActive(value) {
    if (typeof U.isActive === "function") {
      return U.isActive(value);
    }

    if (value === false || value === 0) return false;

    const text = String(value ?? "").trim().toLowerCase();

    if (
      text === "false" ||
      text === "0" ||
      text === "no" ||
      text === "inactive" ||
      text === "غير فعال"
    ) {
      return false;
    }

    return true;
  }

  function isFlagEnabled(value, fallback = false) {
    if (typeof U.isFlagEnabled === "function") {
      return U.isFlagEnabled(value, fallback);
    }

    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;

    const text = String(value ?? "").trim().toLowerCase();

    if (
      text === "true" ||
      text === "1" ||
      text === "yes" ||
      text === "on" ||
      text === "نعم"
    ) {
      return true;
    }

    if (
      text === "false" ||
      text === "0" ||
      text === "no" ||
      text === "off" ||
      text === "لا"
    ) {
      return false;
    }

    return fallback;
  }

  function parsePrice(value) {
    if (typeof U.parsePrice === "function") {
      return U.parsePrice(value);
    }

    if (value === null || value === undefined || value === "") return 0;

    const normalized = String(value)
      .replace(/[٬،]/g, ",")
      .replace(/٫/g, ".")
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

    if (!number) return "0 جنيه";

    return (
      new Intl.NumberFormat("ar-EG", {
        maximumFractionDigits: 2
      }).format(number) + " جنيه"
    );
  }

  function categoryIcon(category) {
    if (typeof U.categoryIcon === "function") {
      return U.categoryIcon(category);
    }

    return "🏠";
  }

  function getImageSources(image) {
    if (typeof U.getImageSources === "function") {
      return U.getImageSources(image);
    }

    if (!image) return [];

    if (Array.isArray(image)) {
      return image
        .map(cleanText)
        .filter(Boolean);
    }

    const text = String(image).trim();

    if (!text) return [];

    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed
          .map(cleanText)
          .filter(Boolean);
      }
    } catch (err) {}

    return text
      .split(/\n|,/)
      .map(x => x.trim())
      .filter(Boolean);
  }

  function getProductPageUrl(productId) {
    return "./product.html?id=" + encodeURIComponent(productId);
  }

  /* =========================================================
     CACHE
     ========================================================= */

  function readCache(key, maxAge) {
    try {
      if (!key) return null;

      const raw = localStorage.getItem(key);

      if (!raw) return null;

      const data = JSON.parse(raw);

      if (!data || typeof data !== "object") return null;
      if (!data.time) return null;

      if (
        maxAge &&
        Date.now() - Number(data.time) > Number(maxAge)
      ) {
        return null;
      }

      return data;
    } catch (err) {
      return null;
    }
  }

  function writeCache(key, value) {
    try {
      if (!key) return;

      localStorage.setItem(
        key,
        JSON.stringify({
          time: Date.now(),
          value
        })
      );
    } catch (err) {}
  }

  function removeCache(key) {
    try {
      if (key) {
        localStorage.removeItem(key);
      }
    } catch (err) {}
  }

  /* =========================================================
     ANALYTICS
     ========================================================= */

  function track(eventName, data) {
    try {
      if (typeof window.aboTrack === "function") {
        window.aboTrack(eventName, data || {});
      }
    } catch (err) {}
  }

  /* =========================================================
     API
     ========================================================= */

  async function fetchAll() {
    const url = cleanText(CFG.DATA_URL);

    if (!url) {
      throw new Error("DATA_URL is missing");
    }

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    if (data && data.ok === false) {
      throw new Error(data.error || "api_error");
    }

    let rawProducts = [];

    if (Array.isArray(data)) {
      rawProducts = data;
    } else if (
      data &&
      Array.isArray(data.products)
    ) {
      rawProducts = data.products;
    } else if (
      data &&
      Array.isArray(data.data)
    ) {
      rawProducts = data.data;
    }

    const products = rawProducts
      .map(normalizeProduct)
      .filter(product => product.active)
      .sort((a, b) => {
        const orderA = Number(a.sortOrder) || 0;
        const orderB = Number(b.sortOrder) || 0;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return String(a.name).localeCompare(
          String(b.name),
          "ar"
        );
      });

    let settingsObj = {
      ...(CFG.DEFAULT_SETTINGS || {})
    };

    if (
      data &&
      data.settings &&
      typeof data.settings === "object"
    ) {
      settingsObj = {
        ...settingsObj,
        ...data.settings
      };
    }

    return {
      products,
      settings: settingsObj
    };
  }

  /* =========================================================
     PRODUCT NORMALIZATION
     ========================================================= */

  function normalizeProduct(raw, index = 0) {
    const p = raw || {};

    const id =
      cleanText(
        p.id ??
        p.ID ??
        p.productId ??
        p.ProductID
      ) ||
      `product-${index + 1}`;

    const name =
      cleanText(
        p.name ??
        p.Name ??
        p.title ??
        p.Title
      ) ||
      "صنف بدون اسم";

    const category =
      cleanText(
        p.category ??
        p.Category ??
        p.cat
      ) ||
      "أدوات منزلية";

    const image = cleanText(
      p.image ??
      p.Image ??
      p.imageUrl ??
      p.ImageUrl ??
      p.photo ??
      p.Photo
    );

    const images =
      p.images ??
      p.Images ??
      p.imageList ??
      p.ImageList ??
      "";

    const description = cleanText(
      p.description ??
      p.Description ??
      p.desc
    );

    const price = cleanText(
      p.price ??
      p.Price
    );

    const oldPrice = cleanText(
      p.oldPrice ??
      p.OldPrice
    );

    const offerPrice = cleanText(
      p.offerPrice ??
      p.OfferPrice
    );

    const active = isActive(
      p.active ??
      p.Active ??
      true
    );

    const showHome = isFlagEnabled(
      p.showHome ??
      p.ShowHome,
      false
    );

    const isOffer = isFlagEnabled(
      p.isOffer ??
      p.IsOffer,
      false
    );

    const sortOrder =
      Number(
        p.sortOrder ??
        p.SortOrder ??
        0
      ) || 0;

    const combinedImages = [];

    getImageSources(image).forEach(src => {
      if (src && !combinedImages.includes(src)) {
        combinedImages.push(src);
      }
    });

    getImageSources(images).forEach(src => {
      if (src && !combinedImages.includes(src)) {
        combinedImages.push(src);
      }
    });

    return {
      id,
      name,
      category,
      image: image || combinedImages[0] || "",
      images: combinedImages,
      description,
      active,
      showHome,
      isOffer,
      price,
      oldPrice,
      offerPrice,
      sortOrder,

      searchIndex: normalizeArabic(
        [
          name,
          category,
          description
        ].join(" ")
      )
    };
  }

  /* =========================================================
     LOAD ALL
     ========================================================= */

  async function getAll() {
    const productCacheKey =
      CFG.CACHE_KEYS &&
      CFG.CACHE_KEYS.PRODUCTS;

    const settingsCacheKey =
      CFG.CACHE_KEYS &&
      CFG.CACHE_KEYS.SETTINGS;

    const cacheTime =
      Number(CFG.CACHE_TIME) || 1800000;

    const settingsCacheTime =
      Number(CFG.SETTINGS_CACHE_TIME) ||
      3600000;

    const cachedProducts = readCache(
      productCacheKey,
      cacheTime
    );

    const cachedSettings = readCache(
      settingsCacheKey,
      settingsCacheTime
    );

    if (
      cachedProducts &&
      Array.isArray(cachedProducts.value) &&
      cachedSettings
    ) {
      allProducts = cachedProducts.value
        .map(normalizeProduct)
        .filter(p => p.active);

      settings = {
        ...(CFG.DEFAULT_SETTINGS || {}),
        ...(cachedSettings.value || {})
      };

      refreshInBackground();

      return;
    }

    if (!productsPromise) {
      productsPromise = fetchAll()
        .then(result => {
          allProducts = result.products;
          settings = result.settings;

          writeCache(
            productCacheKey,
            allProducts
          );

          writeCache(
            settingsCacheKey,
            settings
          );

          return result;
        })
        .finally(() => {
          productsPromise = null;
        });
    }

    await productsPromise;
  }

  /* =========================================================
     BACKGROUND REFRESH
     ========================================================= */

  function refreshInBackground() {
    if (productsPromise) return;

    const productCacheKey =
      CFG.CACHE_KEYS &&
      CFG.CACHE_KEYS.PRODUCTS;

    const cached = readCache(productCacheKey);

    const refreshTime =
      Number(CFG.BACKGROUND_REFRESH_TIME) ||
      300000;

    if (
      cached &&
      Date.now() - Number(cached.time) <
        refreshTime
    ) {
      return;
    }

    productsPromise = fetchAll()
      .then(result => {
        allProducts = result.products;
        settings = result.settings;

        writeCache(
          productCacheKey,
          allProducts
        );

        writeCache(
          CFG.CACHE_KEYS.SETTINGS,
          settings
        );
      })
      .catch(() => null)
      .finally(() => {
        productsPromise = null;
      });
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function getSetting(key, fallback = "") {
    const value = settings
      ? settings[key]
      : undefined;

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      if (
        CFG.DEFAULT_SETTINGS &&
        CFG.DEFAULT_SETTINGS[key] !== undefined
      ) {
        return CFG.DEFAULT_SETTINGS[key];
      }

      return fallback;
    }

    return value;
  }

  function applySettings() {
    const s = {
      ...(CFG.DEFAULT_SETTINGS || {}),
      ...(settings || {})
    };

    document
      .querySelectorAll("[data-setting='siteName']")
      .forEach(el => {
        el.textContent = getSetting(
          "siteName",
          el.textContent
        );
      });

    document
      .querySelectorAll("[data-setting='siteTagline']")
      .forEach(el => {
        el.textContent = getSetting(
          "siteTagline",
          el.textContent
        );
      });

    document
      .querySelectorAll("[data-setting='heroTitle']")
      .forEach(el => {
        el.textContent = getSetting(
          "heroTitle",
          el.textContent
        );
      });

    document
      .querySelectorAll("[data-setting='heroSubtitle']")
      .forEach(el => {
        el.textContent = getSetting(
          "heroSubtitle",
          el.textContent
        );
      });

    document
      .querySelectorAll("[data-setting='topStripText']")
      .forEach(el => {
        el.textContent = getSetting(
          "topStripText",
          el.textContent
        );
      });

    document
      .querySelectorAll("[data-setting='address1']")
      .forEach(el => {
        el.textContent = getSetting(
          "address1",
          el.textContent
        );
      });

    document
      .querySelectorAll("[data-setting='address2']")
      .forEach(el => {
        el.textContent = getSetting(
          "address2",
          el.textContent
        );
      });

    const heroImage =
      cleanText(getSetting("heroImage"));

    const logoImage =
      cleanText(getSetting("logoImage"));

    document
      .querySelectorAll("[data-setting='heroImage']")
      .forEach(el => {
        if (
          el.tagName === "IMG" &&
          heroImage
        ) {
          el.src = heroImage;
        }
      });

    document
      .querySelectorAll("[data-setting='logoImage']")
      .forEach(el => {
        if (
          el.tagName === "IMG" &&
          logoImage
        ) {
          el.src = logoImage;
        }
      });

    const whatsappNumber =
      cleanText(
        getSetting(
          "whatsappNumber",
          CFG.WHATSAPP_NUMBER || ""
        )
      ).replace(/\D/g, "");

    const waUrl = whatsappNumber
      ? "https://wa.me/" + whatsappNumber
      : "#";

    document
      .querySelectorAll("[data-setting='whatsapp']")
      .forEach(el => {
        el.href = waUrl;
      });

    const phones = [
      getSetting("phone1"),
      getSetting("phone2"),
      getSetting("phone3"),
      getSetting("phone4")
    ]
      .map(cleanText)
      .filter(Boolean);

    document
      .querySelectorAll("[data-setting='phones']")
      .forEach(el => {
        el.innerHTML = phones
          .map(phone => {
            const tel = phone.replace(/[^\d+]/g, "");

            return `
              <a href="tel:${escapeAttribute(tel)}">
                <span>📞</span>
                ${escapeHtml(phone)}
              </a>
            `;
          })
          .join("");
      });

    const facebook =
      cleanText(getSetting("facebookUrl"));

    const instagram =
      cleanText(getSetting("instagramUrl"));

    const tiktok =
      cleanText(getSetting("tiktokUrl"));

    document
      .querySelectorAll("[data-setting='facebook']")
      .forEach(el => {
        if (facebook) {
          el.href = facebook;
        }
      });

    document
      .querySelectorAll("[data-setting='instagram']")
      .forEach(el => {
        if (instagram) {
          el.href = instagram;
        }
      });

    document
      .querySelectorAll("[data-setting='tiktok']")
      .forEach(el => {
        if (tiktok) {
          el.href = tiktok;
        }
      });

    const primaryColor =
      cleanText(
        getSetting("primaryColor")
      );

    if (primaryColor) {
      document.documentElement.style.setProperty(
        "--gold-primary",
        primaryColor
      );
    }

    const secondaryColor =
      cleanText(
        getSetting("secondaryColor")
      );

    if (secondaryColor) {
      document.documentElement.style.setProperty(
        "--gold-secondary",
        secondaryColor
      );
    }
  }

  /* =========================================================
     PRICE
     ========================================================= */

  function getProductPrice(product) {
    if (!product) return 0;

    const offer =
      parsePrice(product.offerPrice);

    if (offer > 0) {
      return offer;
    }

    return parsePrice(product.price);
  }

  function renderPrice(product) {
    if (!product) return "";

    const price =
      cleanText(product.price);

    const oldPrice =
      cleanText(product.oldPrice);

    const offerPrice =
      cleanText(product.offerPrice);

    if (
      !price &&
      !oldPrice &&
      !offerPrice
    ) {
      return "";
    }

    const current =
      offerPrice || price;

    const currentNumber =
      parsePrice(current);

    const oldNumber =
      parsePrice(oldPrice);

    let oldMarkup = "";

    if (
      oldPrice &&
      oldNumber > 0 &&
      oldNumber > currentNumber
    ) {
      oldMarkup = `
        <span class="old-price">
          ${escapeHtml(formatPrice(oldNumber))}
        </span>
      `;
    }

    return `
      <div class="price-box">
        ${
          currentNumber > 0
            ? `
              <strong class="current-price">
                ${escapeHtml(formatPrice(currentNumber))}
              </strong>
            `
            : ""
        }
        ${oldMarkup}
      </div>
    `;
  }

  /* =========================================================
     WHATSAPP PRODUCT
     ========================================================= */

  function whatsappUrl(product) {
    if (!product) return "#";

    const name =
      cleanText(product.name);

    const productUrl =
      window.location.origin +
      window.location.pathname
        .replace(/\/[^/]*$/, "/") +
      getProductPageUrl(product.id).replace(
        "./",
        ""
      );

    const message = name
      ? `السلام عليكم، عايز أعرف تفاصيل عن صنف: ${name}\n${productUrl}`
      : `السلام عليكم، عايز أعرف تفاصيل عن أحد الأصناف.\n${productUrl}`;

    const number =
      cleanText(
        getSetting(
          "whatsappNumber",
          CFG.WHATSAPP_NUMBER || ""
        )
      ).replace(/\D/g, "");

    return (
      "https://wa.me/" +
      number +
      "?text=" +
      encodeURIComponent(message)
    );
  }

  /* =========================================================
     WISHLIST
     ========================================================= */

  function isInWishlist(productId) {
    try {
      if (
        !window.ABO_TAREK ||
        !window.ABO_TAREK.Wishlist
      ) {
        return false;
      }

      if (
        typeof window.ABO_TAREK.Wishlist.isIn !==
        "function"
      ) {
        return false;
      }

      return Boolean(
        window.ABO_TAREK.Wishlist.isIn(productId)
      );
    } catch (err) {
      return false;
    }
  }

  function toggleWishlist(product) {
    try {
      if (
        !window.ABO_TAREK ||
        !window.ABO_TAREK.Wishlist
      ) {
        return false;
      }

      if (
        typeof window.ABO_TAREK.Wishlist.toggle !==
        "function"
      ) {
        return false;
      }

      return Boolean(
        window.ABO_TAREK.Wishlist.toggle(product)
      );
    } catch (err) {
      return false;
    }
  }

  /* =========================================================
     RECENTLY VIEWED
     ========================================================= */

  function addToRecent(product) {
    try {
      if (
        !window.ABO_TAREK ||
        !window.ABO_TAREK.Recent
      ) {
        return;
      }

      if (
        typeof window.ABO_TAREK.Recent.add !==
        "function"
      ) {
        return;
      }

      window.ABO_TAREK.Recent.add(product);
    } catch (err) {}
  }

  /* =========================================================
     CART
     ========================================================= */

  function readCart() {
    try {
      const key =
        CFG.CACHE_KEYS &&
        CFG.CACHE_KEYS.CART;

      if (!key) return [];

      const raw =
        localStorage.getItem(key);

      if (!raw) return [];

      const data =
        JSON.parse(raw);

      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .filter(item => {
          return (
            item &&
            item.id &&
            Number(item.quantity) > 0
          );
        })
        .map(item => ({
          id: String(item.id),
          name: cleanText(item.name),
          category: cleanText(item.category),
          image: cleanText(item.image),
          price: parsePrice(item.price),
          quantity: Math.max(
            1,
            Number(item.quantity) || 1
          )
        }));
    } catch (err) {
      return [];
    }
  }

  function saveCart() {
    try {
      const key =
        CFG.CACHE_KEYS &&
        CFG.CACHE_KEYS.CART;

      if (key) {
        localStorage.setItem(
          key,
          JSON.stringify(cart)
        );
      }
    } catch (err) {}

    updateCartUI();
  }

  function cartCount() {
    return cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
  }

  function cartTotal() {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );
  }

  function addToCart(product) {
    if (!product) return;

    const price =
      getProductPrice(product);

    if (price <= 0) {
      openProductPage(product);
      return;
    }

    const existing =
      cart.find(item =>
        String(item.id) ===
        String(product.id)
      );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        price,
        quantity: 1
      });
    }

    saveCart();

    openCart();

    showAddedState(product.id);

    track("add_to_cart", {
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      value: price,
      currency: "EGP"
    });
  }

  function changeCartQuantity(id, delta) {
    const item =
      cart.find(
        entry =>
          String(entry.id) ===
          String(id)
      );

    if (!item) return;

    item.quantity += Number(delta) || 0;

    if (item.quantity <= 0) {
      cart = cart.filter(
        entry =>
          String(entry.id) !==
          String(id)
      );
    }

    saveCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(
      item =>
        String(item.id) !==
        String(id)
    );

    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
  }

  function showAddedState(id) {
    const selector =
      `.abo-add-cart[data-cart-id="${CSS.escape(String(id))}"]`;

    document
      .querySelectorAll(selector)
      .forEach(button => {
        button.classList.add("added");

        const original =
          button.innerHTML;

        button.innerHTML =
          "✓ تمت الإضافة";

        setTimeout(() => {
          button.classList.remove("added");
          button.innerHTML = original;
        }, 1400);
      });
  }

  /* =========================================================
     CART WHATSAPP
     ========================================================= */

  function cartWhatsAppUrl() {
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
      cleanText(
        getSetting(
          "whatsappNumber",
          CFG.WHATSAPP_NUMBER || ""
        )
      ).replace(/\D/g, "");

    return (
      "https://wa.me/" +
      number +
      "?text=" +
      encodeURIComponent(message)
    );
  }

  /* =========================================================
     CART UI
     ========================================================= */

  function ensureCart() {
    let button =
      document.getElementById(
        "aboCartButton"
      );

    if (!button) {
      button =
        document.createElement("button");

      button.id =
        "aboCartButton";

      button.className =
        "abo-cart-button";

      button.type =
        "button";

      button.innerHTML = `
        🛒
        <span class="abo-cart-count">0</span>
        <span class="abo-cart-total">0 جنيه</span>
      `;

      document.body.appendChild(button);

      button.addEventListener(
        "click",
        openCart
      );
    }

    let drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if (drawer) {
      return;
    }

    drawer =
      document.createElement("div");

    drawer.id =
      "aboCartDrawer";

    drawer.className =
      "abo-cart-drawer";

    drawer.innerHTML = `
      <div
        class="abo-cart-backdrop"
        data-close-cart
      ></div>

      <aside class="abo-cart-panel">
        <div class="abo-cart-header">
          <div>
            <strong>سلة مشترياتك 🛒</strong>
            <span>راجع طلبك قبل الإرسال</span>
          </div>

          <button
            type="button"
            class="abo-cart-close"
            aria-label="إغلاق"
          >×</button>
        </div>

        <div class="abo-cart-items"></div>

        <div class="abo-cart-footer">
          <div class="abo-cart-summary">
            <span>إجمالي الطلب</span>
            <strong
              class="abo-cart-summary-total"
            >0 جنيه</strong>
          </div>

          <a
            class="abo-cart-whatsapp"
            target="_blank"
            rel="noopener"
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

    drawer
      .querySelector(".abo-cart-close")
      ?.addEventListener(
        "click",
        closeCart
      );

    drawer
      .querySelector(".abo-cart-clear")
      ?.addEventListener(
        "click",
        clearCart
      );

    drawer
      .querySelector(".abo-cart-whatsapp")
      ?.addEventListener(
        "click",
        () => {
          if (!cart.length) return;

          track(
            "begin_checkout",
            {
              value: cartTotal(),
              currency: "EGP",
              num_items: cartCount()
            }
          );
        }
      );

    drawer.addEventListener(
      "click",
      event => {
        const closeTarget =
          event.target.closest(
            "[data-close-cart]"
          );

        if (closeTarget) {
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
  }

  function renderCart() {
    const drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if (!drawer) return;

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

    if (!items) return;

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
                item.image
              );

            return `
              <div
                class="abo-cart-item"
                data-cart-item="${escapeAttribute(item.id)}"
              >
                <div class="abo-cart-item-image">
                  ${
                    sources.length
                      ? `
                        <img
                          src="${escapeAttribute(sources[0])}"
                          alt="${escapeAttribute(item.name)}"
                          loading="lazy"
                          decoding="async"
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
                      formatPrice(item.price)
                    )}
                  </div>

                  <div class="abo-cart-item-controls">
                    <button
                      type="button"
                      class="abo-cart-qty-btn"
                      data-cart-plus="${escapeAttribute(item.id)}"
                      aria-label="زيادة الكمية"
                    >+</button>

                    <span class="abo-cart-qty">
                      ${item.quantity}
                    </span>

                    <button
                      type="button"
                      class="abo-cart-qty-btn"
                      data-cart-minus="${escapeAttribute(item.id)}"
                      aria-label="تقليل الكمية"
                    >−</button>

                    <button
                      type="button"
                      class="abo-cart-remove"
                      data-cart-remove="${escapeAttribute(item.id)}"
                      aria-label="حذف"
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
    ensureCart();

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
        "0 جنيه";
    }

    renderCart();
  }

  function openCart() {
    ensureCart();

    const drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if (!drawer) return;

    renderCart();

    drawer.classList.add("open");

    document.body.classList.add(
      "modal-open"
    );

    document.body.style.overflow =
      "hidden";
  }

  function closeCart() {
    const drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if (!drawer) return;

    drawer.classList.remove(
      "open"
    );

    document.body.classList.remove(
      "modal-open"
    );

    document.body.style.overflow =
      "";
  }

  /* =========================================================
     PRODUCT NAVIGATION
     ========================================================= */

  function openProductPage(product) {
    if (!product || !product.id) {
      return;
    }

    track("view_product", {
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      value: getProductPrice(product),
      currency: "EGP"
    });

    addToRecent(product);

    window.location.href =
      getProductPageUrl(product.id);
  }

  /* =========================================================
     PRODUCT IMAGE
     ========================================================= */

  function createProductImage(
    product,
    lazy = true
  ) {
    const wrapper =
      document.createElement("div");

    wrapper.className =
      "product-image";

    const sources =
      getImageSources(
        product.images?.length
          ? product.images
          : product.image
      );

    if (!sources.length) {
      wrapper.innerHTML = `
        <div class="product-image-placeholder">
          <span class="placeholder-icon">
            ${escapeHtml(
              categoryIcon(
                product.category
              )
            )}
          </span>
        </div>
      `;

      return wrapper;
    }

    const img =
      document.createElement("img");

    img.alt =
      product.name
        ? `صورة ${product.name}`
        : "صورة المنتج";

    img.width = 700;
    img.height = 700;
    img.decoding = "async";

    img.loading =
      lazy
        ? "lazy"
        : "eager";

    img.fetchPriority =
      lazy
        ? "low"
        : "high";

    img.src =
      sources[0];

    img.addEventListener(
      "error",
      () => {
        wrapper.innerHTML = `
          <div class="product-image-placeholder">
            <span class="placeholder-icon">
              ${escapeHtml(
                categoryIcon(
                  product.category
                )
              )}
            </span>
          </div>
        `;
      },
      { once: true }
    );

    wrapper.appendChild(img);

    return wrapper;
  }

  /* =========================================================
     PRODUCT CARD
     ========================================================= */

  function createProductCard(
    product,
    index = 0
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "product";

    article.dataset.id =
      product.id;

    article.style.cursor =
      "pointer";

    article.appendChild(
      createProductImage(
        product,
        index > 1
      )
    );

    const body =
      document.createElement("div");

    body.className =
      "product-body";

    const description =
      cleanText(
        product.description
      );

    const shortDesc =
      description
        ? (
            description.length > 115
              ? description
                  .slice(0, 115)
                  .trimEnd() + "..."
              : description
          )
        : "";

    const hasCartPrice =
      getProductPrice(product) > 0;

    const inWishlist =
      isInWishlist(product.id);

    body.innerHTML = `
      <button
        type="button"
        class="product-wishlist-btn ${
          inWishlist
            ? "active"
            : ""
        }"
        data-wishlist-id="${escapeAttribute(product.id)}"
        aria-label="${
          inWishlist
            ? "إزالة من المفضلة"
            : "إضافة للمفضلة"
        }"
      >${
        inWishlist
          ? "❤️"
          : "🤍"
      }</button>

      <div class="product-meta">
        <span class="product-category">
          ${escapeHtml(product.category)}
        </span>

        ${
          product.isOffer
            ? `
              <span class="offer-badge">
                🔥 عرض
              </span>
            `
            : ""
        }
      </div>

      <h3 class="product-name">
        ${escapeHtml(product.name)}
      </h3>

      ${
        shortDesc
          ? `
            <p class="product-description">
              ${escapeHtml(shortDesc)}
            </p>
          `
          : ""
      }

      ${renderPrice(product)}

      <div class="product-actions">
        <button
          type="button"
          class="product-details-trigger product-details-main"
          data-details-id="${escapeAttribute(product.id)}"
        >
          تفاصيل الصنف
          <span>←</span>
        </button>

        <a
          class="product-whatsapp"
          href="${escapeAttribute(
            whatsappUrl(product)
          )}"
          target="_blank"
          rel="noopener"
        >
          💬 واتساب
        </a>
      </div>

      ${
        hasCartPrice
          ? `
            <button
              type="button"
              class="abo-add-cart"
              data-cart-id="${escapeAttribute(product.id)}"
            >
              🛒 أضف للسلة
            </button>
          `
          : ""
      }
    `;

    article.appendChild(body);

    article.addEventListener(
      "click",
      event => {

        /* -----------------------------------------------------
           WISHLIST
           ----------------------------------------------------- */

        const wishBtn =
          event.target.closest(
            "[data-wishlist-id]"
          );

        if (wishBtn) {
          event.preventDefault();
          event.stopPropagation();

          const added =
            toggleWishlist(
              product
            );

          if (added) {
            wishBtn.classList.add(
              "active"
            );

            wishBtn.innerHTML =
              "❤️";

            wishBtn.setAttribute(
              "aria-label",
              "إزالة من المفضلة"
            );
          } else {
            wishBtn.classList.remove(
              "active"
            );

            wishBtn.innerHTML =
              "🤍";

            wishBtn.setAttribute(
              "aria-label",
              "إضافة للمفضلة"
            );
          }

          return;
        }

        /* -----------------------------------------------------
           LINKS
           ----------------------------------------------------- */

        if (
          event.target.closest("a")
        ) {
          return;
        }

        /* -----------------------------------------------------
           CART
           ----------------------------------------------------- */

        const addBtn =
          event.target.closest(
            ".abo-add-cart"
          );

        if (addBtn) {
          event.preventDefault();
          event.stopPropagation();

          addToCart(product);

          return;
        }

        /* -----------------------------------------------------
           PRODUCT PAGE
           ----------------------------------------------------- */

        event.preventDefault();
        event.stopPropagation();

        openProductPage(product);
      }
    );

    return article;
  }

  /* =========================================================
     HOMEPAGE
     ========================================================= */

  function initHomepage() {
    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (!grid) return;

    const explicitlyHome =
      allProducts.filter(
        product =>
          product.showHome
      );

    const homeProducts =
      explicitlyHome.length
        ? explicitlyHome
        : allProducts;

    const offerProducts =
      allProducts.filter(
        product =>
          product.isOffer
      );

    const offersSection =
      document.getElementById(
        "offers"
      );

    const offersGrid =
      document.getElementById(
        "offersGrid"
      );

    const filters =
      document.getElementById(
        "filters"
      );

    const categoryGrid =
      document.getElementById(
        "categoryGrid"
      );

    let activeCategory =
      "الكل";

    let searchTerm =
      "";

    const categories = [
      ...new Set(
        homeProducts
          .map(product =>
            cleanText(
              product.category
            )
          )
          .filter(Boolean)
      )
    ];

    /* ---------------------------------------------------------
       CATEGORIES
       --------------------------------------------------------- */

    function renderCategories() {
      if (!categoryGrid) return;

      if (!categories.length) {
        categoryGrid.innerHTML = `
          <div class="empty">
            لا توجد أقسام متاحة حاليًا.
          </div>
        `;

        return;
      }

      categoryGrid.innerHTML =
        categories
          .map(category => {
            const count =
              allProducts.filter(
                product =>
                  product.category ===
                    category &&
                  product.active
              ).length;

            return `
              <button
                class="cat"
                type="button"
                data-category="${escapeAttribute(category)}"
              >
                <span class="cat-icon">
                  ${escapeHtml(
                    categoryIcon(
                      category
                    )
                  )}
                </span>

                <span class="cat-content">
                  <strong>
                    ${escapeHtml(
                      category
                    )}
                  </strong>

                  <small>
                    ${count}
                    ${
                      count === 1
                        ? "صنف"
                        : "أصناف"
                    }
                  </small>
                </span>

                <span class="cat-arrow">
                  ←
                </span>
              </button>
            `;
          })
          .join("");
    }

    /* ---------------------------------------------------------
       FILTERS
       --------------------------------------------------------- */

    function renderFilters() {
      if (!filters) return;

      filters.innerHTML = `
        <button
          class="filter active"
          type="button"
          data-filter="الكل"
        >
          🛍️ الكل
        </button>

        ${categories
          .map(category => `
            <button
              class="filter"
              type="button"
              data-filter="${escapeAttribute(category)}"
            >
              ${escapeHtml(
                categoryIcon(
                  category
                )
              )}
              ${escapeHtml(category)}
            </button>
          `)
          .join("")}
      `;
    }

    /* ---------------------------------------------------------
       SEARCH / FILTER
       --------------------------------------------------------- */

    function getFiltered() {
      const query =
        normalizeArabic(
          searchTerm
        );

      return homeProducts.filter(
        product => {
          const categoryMatch =
            activeCategory ===
              "الكل" ||
            product.category ===
              activeCategory;

          const searchMatch =
            !query ||
            product.searchIndex.includes(
              query
            );

          return (
            categoryMatch &&
            searchMatch
          );
        }
      );
    }

    /* ---------------------------------------------------------
       PRODUCTS
       --------------------------------------------------------- */

    function renderProducts() {
      const list =
        getFiltered();

      if (!list.length) {
        grid.innerHTML = `
          <div class="empty">
            <div class="empty-icon">
              🔎
            </div>

            <h3>
              مفيش أصناف مطابقة
            </h3>

            <p>
              جرّب اسم صنف تاني أو اختار قسم مختلف.
            </p>
          </div>
        `;

        return;
      }

      const fragment =
        document.createDocumentFragment();

      list.forEach(
        (product, index) => {
          fragment.appendChild(
            createProductCard(
              product,
              index
            )
          );
        }
      );

      grid.replaceChildren(
        fragment
      );
    }

    /* ---------------------------------------------------------
       OFFERS
       --------------------------------------------------------- */

    function renderOffers() {
      if (
        !offersGrid ||
        !offersSection
      ) {
        return;
      }

      if (!offerProducts.length) {
        offersGrid.innerHTML = "";
        offersSection.hidden = true;
        return;
      }

      const fragment =
        document.createDocumentFragment();

      offerProducts.forEach(
        (product, index) => {
          fragment.appendChild(
            createProductCard(
              product,
              index
            )
          );
        }
      );

      offersGrid.replaceChildren(
        fragment
      );

      offersSection.hidden =
        false;
    }

    /* ---------------------------------------------------------
       FILTER CLICK
       --------------------------------------------------------- */

    if (filters) {
      filters.addEventListener(
        "click",
        event => {
          const button =
            event.target.closest(
              "[data-filter]"
            );

          if (!button) return;

          activeCategory =
            button.dataset.filter ||
            "الكل";

          filters
            .querySelectorAll(
              ".filter"
            )
            .forEach(filter => {
              filter.classList.toggle(
                "active",
                filter === button
              );
            });

          renderProducts();
        }
      );
    }

    /* ---------------------------------------------------------
       CATEGORY CLICK
       --------------------------------------------------------- */

    if (categoryGrid) {
      categoryGrid.addEventListener(
        "click",
        event => {
          const button =
            event.target.closest(
              "[data-category]"
            );

          if (!button) return;

          const category =
            button.dataset.category ||
            "الكل";

          window.location.href =
            "./sections.html?category=" +
            encodeURIComponent(
              category
            );
        }
      );
    }

    renderCategories();
    renderFilters();
    renderProducts();
    renderOffers();
  }

  /* =========================================================
     LEGACY PRODUCT MODAL
     ========================================================= */

  function ensureModal() {
    let modal =
      document.getElementById(
        "aboTarekProductModal"
      );

    if (modal) {
      return modal;
    }

    modal =
      document.createElement("div");

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
        class="product-modal-backdrop"
        data-close-modal
      ></div>

      <div
        class="product-modal-dialog"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="product-modal-close"
          aria-label="إغلاق"
        >
          ×
        </button>

        <div class="product-modal-image-wrap">
          <img
            id="aboModalImage"
            class="product-modal-image"
            alt=""
            width="700"
            height="700"
            decoding="async"
          >
        </div>

        <div class="product-modal-content">
          <span
            id="aboModalCategory"
            class="product-modal-category"
          ></span>

          <h2 id="aboModalName"></h2>

          <p
            id="aboModalDescription"
            class="product-modal-description"
          ></p>

          <div
            id="aboModalPrice"
            class="modal-price-box"
          ></div>

          <button
            type="button"
            id="aboModalAddCart"
            class="abo-add-cart"
          >
            🛒 أضف للسلة
          </button>

          <a
            id="aboModalWhatsApp"
            class="product-whatsapp modal-whatsapp"
            target="_blank"
            rel="noopener"
          >
            💬 اسأل عن الصنف على واتساب
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelector(
        ".product-modal-close"
      )
      ?.addEventListener(
        "click",
        closeProductModal
      );

    modal.addEventListener(
      "click",
      event => {
        if (
          event.target.matches(
            "[data-close-modal]"
          )
        ) {
          closeProductModal();
        }
      }
    );

    return modal;
  }

  function openProductModal(product) {
    if (!product) return;

    /*
      الصفحة الأساسية الآن تستخدم product.html.
      المودال القديم يظل متاحًا فقط إذا تم استدعاؤه
      من كود خارجي صراحةً.
    */

    addToRecent(product);

    track("view_product", {
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      value: getProductPrice(product),
      currency: "EGP"
    });

    const modal =
      ensureModal();

    const image =
      document.getElementById(
        "aboModalImage"
      );

    const category =
      document.getElementById(
        "aboModalCategory"
      );

    const name =
      document.getElementById(
        "aboModalName"
      );

    const description =
      document.getElementById(
        "aboModalDescription"
      );

    const price =
      document.getElementById(
        "aboModalPrice"
      );

    const whatsapp =
      document.getElementById(
        "aboModalWhatsApp"
      );

    const addBtn =
      document.getElementById(
        "aboModalAddCart"
      );

    const sources =
      getImageSources(
        product.images?.length
          ? product.images
          : product.image
      );

    if (image) {
      if (sources.length) {
        image.src =
          sources[0];

        image.style.display =
          "block";

        image.alt =
          `صورة ${product.name}`;
      } else {
        image.removeAttribute(
          "src"
        );

        image.style.display =
          "none";
      }
    }

    if (category) {
      category.textContent =
        product.category;
    }

    if (name) {
      name.textContent =
        product.name;
    }

    if (description) {
      description.textContent =
        product.description ||
        "للاستفسار عن تفاصيل الصنف، تواصل معنا على واتساب.";
    }

    if (price) {
      price.innerHTML =
        renderPrice(product);
    }

    if (whatsapp) {
      whatsapp.href =
        whatsappUrl(product);

      whatsapp.onclick =
        () => {
          track("contact", {
            content_ids: [
              product.id
            ],
            content_name:
              product.name
          });
        };
    }

    if (addBtn) {
      if (
        getProductPrice(product) >
        0
      ) {
        addBtn.style.display =
          "flex";

        addBtn.onclick =
          () => {
            addToCart(product);
          };
      } else {
        addBtn.style.display =
          "none";
      }
    }

    modal.classList.add(
      "show",
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "modal-open"
    );

    document.body.style.overflow =
      "hidden";
  }

  function closeProductModal() {
    const modal =
      document.getElementById(
        "aboTarekProductModal"
      );

    if (!modal) return;

    modal.classList.remove(
      "show",
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "modal-open"
    );

    /*
      لا نكسر سلة المشتريات إذا كان
      المودال هو الوحيد المفتوح.
    */
    if (
      !document
        .getElementById(
          "aboCartDrawer"
        )
        ?.classList.contains(
          "open"
        )
    ) {
      document.body.style.overflow =
        "";
    }
  }

  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  function initMobileNav() {
    const menuBtn =
      document.getElementById(
        "menuBtn"
      );

    const nav =
      document.getElementById(
        "navLinks"
      );

    if (!menuBtn || !nav) {
      return;
    }

    if (
      menuBtn.dataset.aboInitialized ===
      "true"
    ) {
      return;
    }

    menuBtn.dataset.aboInitialized =
      "true";

    menuBtn.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        const opened =
          nav.classList.toggle(
            "open"
          );

        menuBtn.setAttribute(
          "aria-expanded",
          opened
            ? "true"
            : "false"
        );
      }
    );

    nav
      .querySelectorAll("a")
      .forEach(link => {
        link.addEventListener(
          "click",
          () => {
            nav.classList.remove(
              "open"
            );

            menuBtn.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        );
      });

    document.addEventListener(
      "click",
      event => {
        if (
          !event.target.closest(
            ".site-header"
          )
        ) {
          nav.classList.remove(
            "open"
          );

          menuBtn.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  function showError() {
    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (!grid) return;

    grid.innerHTML = `
      <div class="empty error-state">
        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          تعذر تحميل الأصناف
        </h3>

        <p>
          حصلت مشكلة أثناء الاتصال بالبيانات.
          حاول تحديث الصفحة.
        </p>

        <button
          type="button"
          id="retryProducts"
          class="primary-btn"
        >
          🔄 إعادة المحاولة
        </button>
      </div>
    `;

    const retry =
      document.getElementById(
        "retryProducts"
      );

    if (retry) {
      retry.addEventListener(
        "click",
        () => {
          removeCache(
            CFG.CACHE_KEYS.PRODUCTS
          );

          removeCache(
            CFG.CACHE_KEYS.SETTINGS
          );

          window.location.reload();
        }
      );
    }
  }

  /* =========================================================
     KEYBOARD
     ========================================================= */

  function initKeyboard() {
    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape"
        ) {
          closeProductModal();
          closeCart();
        }
      }
    );
  }

  /* =========================================================
     START
     ========================================================= */

  async function startApp() {
    if (appStarted) {
      return;
    }

    appStarted = true;

    initMobileNav();
    initKeyboard();

    cart = readCart();

    ensureCart();
    updateCartUI();

    const grid =
      document.getElementById(
        "productsGrid"
      );

    if (grid) {
      grid.innerHTML = `
        <div class="loading">
          <span class="loading-spinner"></span>
          جاري تحميل الأصناف...
        </div>
      `;
    }

    try {
      await getAll();

      applySettings();

      initHomepage();

      /*
        بعض الصفحات قد تعتمد على الإعدادات
        بعد تحميل DOM بالكامل.
      */
      window.dispatchEvent(
        new CustomEvent(
          "abo:tarek:ready",
          {
            detail: {
              products:
                allProducts,
              settings:
                settings
            }
          }
        )
      );

    } catch (error) {
      console.error(
        "Abo Tarek error:",
        error
      );

      /*
        محاولة أخيرة من الكاش
        حتى لو انتهت مدة الكاش.
      */

      const cached =
        readCache(
          CFG.CACHE_KEYS.PRODUCTS
        );

      if (
        cached &&
        Array.isArray(
          cached.value
        ) &&
        cached.value.length
      ) {
        allProducts =
          cached.value
            .map(
              normalizeProduct
            )
            .filter(
              product =>
                product.active
            );

        const cachedSettings =
          readCache(
            CFG.CACHE_KEYS.SETTINGS
          );

        if (
          cachedSettings &&
          cachedSettings.value
        ) {
          settings = {
            ...(CFG.DEFAULT_SETTINGS || {}),
            ...cachedSettings.value
          };
        }

        applySettings();

        initHomepage();

        return;
      }

      showError();
    }
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.openProductModal =
    openProductModal;

  window.closeProductModal =
    closeProductModal;

  window.openAboTarekCart =
    openCart;

  window.closeAboTarekCart =
    closeCart;

  window.ABO_TAREK_APP = {
    getProducts: () =>
      allProducts.slice(),

    getSettings: () =>
      ({ ...settings }),

    getCart: () =>
      cart.map(item => ({
        ...item
      })),

    getCartCount:
      cartCount,

    getCartTotal:
      cartTotal,

    addToCart,

    removeFromCart,

    changeCartQuantity,

    clearCart,

    openCart,

    closeCart,

    openProductPage,

    openProductModal,

    closeProductModal,

    refresh: async () => {
      removeCache(
        CFG.CACHE_KEYS.PRODUCTS
      );

      removeCache(
        CFG.CACHE_KEYS.SETTINGS
      );

      await getAll();

      applySettings();

      initHomepage();

      updateCartUI();
    }
  };

  /* =========================================================
     INIT
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startApp,
      { once: true }
    );
  } else {
    startApp();
  }

})();
