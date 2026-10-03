/* =========================================================
   ABO TAREK STORE
   APP.JS
   LUXURY E-COMMERCE EDITION
   ========================================================= */

(() => {
  "use strict";


  /* =========================================================
     SETTINGS
     ========================================================= */

  const DATA_URL =
    "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

  const WHATSAPP_NUMBER =
    "201551604163";

  const CACHE_KEY =
    "abo_tarek_products_v11";

  const CART_KEY =
    "abo_tarek_cart_v1";

  const CACHE_TIME =
    30 * 60 * 1000;

  const BACKGROUND_REFRESH_TIME =
    10 * 60 * 1000;


  /* =========================================================
     CATEGORY ICONS
     ========================================================= */

  const CATEGORY_ICONS = {
    "سفرة":"🍽️",
    "شاي وقهوة":"☕",
    "أكواب وكاسات":"🥛",
    "مطبخ":"🍳",
    "أواني طهي":"🥘",
    "ميلامين":"🟩",
    "أدوات منزلية":"🏠",
    "مستلزمات المنزل":"🏠",
    "الكل":"🛍️"
  };

  const FALLBACK_ICON = "✦";


  /* =========================================================
     HELPERS
     ========================================================= */

  function cleanText(value){
    return String(value ?? "")
      .replace(/\s+/g," ")
      .trim();
  }


  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }


  function escapeAttribute(value){
    return escapeHtml(value);
  }


  function normalizeArabic(value){
    return cleanText(value)
      .toLowerCase()
      .replace(/[أإآ]/g,"ا")
      .replace(/ة/g,"ه")
      .replace(/ى/g,"ي")
      .replace(/ؤ/g,"و")
      .replace(/ئ/g,"ي")
      .replace(/ـ/g,"")
      .replace(/[\u064B-\u065F\u0670]/g,"")
      .replace(/\s+/g," ");
  }


  function categoryIcon(category){
    return (
      CATEGORY_ICONS[
        cleanText(category)
      ] ||
      FALLBACK_ICON
    );
  }


  function isActive(value){

    if(
      value === false ||
      value === 0
    ){
      return false;
    }

    const text =
      normalizeArabic(value);

    if(
      [
        "false",
        "0",
        "no",
        "inactive",
        "غير نشط",
        "مخفي"
      ].includes(text)
    ){
      return false;
    }

    return true;
  }


  function isFlagEnabled(
    value,
    defaultValue
  ){

    if(
      value === undefined ||
      value === null ||
      value === ""
    ){
      return defaultValue;
    }

    if(
      value === true ||
      value === 1
    ){
      return true;
    }

    if(
      value === false ||
      value === 0
    ){
      return false;
    }

    const text =
      normalizeArabic(value);

    if(
      [
        "false",
        "0",
        "no",
        "off",
        "مخفي"
      ].includes(text)
    ){
      return false;
    }

    if(
      [
        "true",
        "1",
        "yes",
        "on",
        "نعم",
        "ظاهر"
      ].includes(text)
    ){
      return true;
    }

    return defaultValue;
  }


  /* =========================================================
     PRICE
     ========================================================= */

  function normalizePrice(value){

    if(
      value === null ||
      value === undefined
    ){
      return "";
    }

    return cleanText(value);
  }


  function parsePrice(value){

    const text =
      normalizePrice(value);

    if(!text){
      return 0;
    }

    const numeric =
      Number(
        text
          .replace(/,/g,"")
          .replace(/[^\d.]/g,"")
      );

    return Number.isFinite(numeric)
      ? numeric
      : 0;
  }


  function hasPrice(value){
    return Boolean(
      normalizePrice(value)
    );
  }


  function formatPrice(value){

    const price =
      normalizePrice(value);

    if(!price){
      return "";
    }

    const numeric =
      parsePrice(price);

    if(
      Number.isFinite(numeric) &&
      numeric > 0
    ){
      return (
        new Intl.NumberFormat(
          "ar-EG"
        ).format(numeric) +
        " جنيه"
      );
    }

    return price;
  }


  function renderPrice(product){

    const price =
      normalizePrice(product.price);

    const oldPrice =
      normalizePrice(product.oldPrice);

    const offerPrice =
      normalizePrice(product.offerPrice);

    if(
      !price &&
      !oldPrice &&
      !offerPrice
    ){
      return "";
    }

    const current =
      offerPrice ||
      price;

    return `
      <div class="price-box">

        ${
          oldPrice
            ? `
              <span class="old-price">
                ${escapeHtml(
                  formatPrice(oldPrice)
                )}
              </span>
            `
            : ""
        }

        ${
          current
            ? `
              <strong class="current-price">
                ${escapeHtml(
                  formatPrice(current)
                )}
              </strong>
            `
            : ""
        }

      </div>
    `;
  }


  function getProductPrice(product){

    return parsePrice(
      product.offerPrice ||
      product.price
    );
  }


  /* =========================================================
     IMAGE
     ========================================================= */

  function getImageSources(image){

    const original =
      cleanText(image);

    if(!original){
      return [];
    }

    const sources = [];

    function add(url){
      if(
        url &&
        !sources.includes(url)
      ){
        sources.push(url);
      }
    }

    if(
      original.startsWith("https://") ||
      original.startsWith("http://") ||
      original.startsWith("data:")
    ){
      add(original);
      return sources;
    }

    const relative =
      original
        .replace(/^\.?\//,"")
        .replace(/^\/+/,"");

    add(
      "https://abotarek963258-cmyk.github.io/abo-tarek-store/" +
      relative
        .split("/")
        .map(
          part =>
            encodeURIComponent(part)
        )
        .join("/")
    );

    return sources;
  }


  /* =========================================================
     WHATSAPP
     ========================================================= */

  function whatsappUrl(product){

    const name =
      cleanText(product.name);

    const message =
      name
        ? `السلام عليكم، عايز أعرف تفاصيل عن صنف: ${name}`
        : "السلام عليكم، عايز أعرف تفاصيل عن أحد الأصناف الموجودة عندكم.";

    return (
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(message)
    );
  }


  /* =========================================================
     CACHE
     ========================================================= */

  function readCache(){

    try{

      const raw =
        localStorage.getItem(
          CACHE_KEY
        );

      if(!raw){
        return null;
      }

      const data =
        JSON.parse(raw);

      if(
        !data ||
        !Array.isArray(data.products) ||
        !data.time
      ){
        return null;
      }

      return data;

    }catch(error){

      return null;
    }
  }


  function writeCache(products){

    try{

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          time:Date.now(),
          products
        })
      );

    }catch(error){}
  }


  /* =========================================================
     NORMALIZE PRODUCT
     ========================================================= */

  function normalizeProduct(
    product,
    index
  ){

    const p =
      product || {};

    const id =
      cleanText(
        p.id ??
        p.ID ??
        p.Id
      ) ||
      `product-${index + 1}`;

    const name =
      cleanText(
        p.name ??
        p.Name ??
        p.product ??
        p.title
      ) ||
      "صنف بدون اسم";

    const category =
      cleanText(
        p.category ??
        p.Category ??
        p.cat
      ) ||
      "أدوات منزلية";

    const image =
      cleanText(
        p.image ??
        p.Image ??
        p.imageUrl ??
        p.photo
      );

    const description =
      cleanText(
        p.description ??
        p.Description ??
        p.desc
      );

    const active =
      isActive(
        p.active ??
        p.Active ??
        true
      );

    const showHome =
      isFlagEnabled(
        p.showHome ??
        p.ShowHome,
        true
      );

    const isOffer =
      isFlagEnabled(
        p.isOffer ??
        p.IsOffer,
        false
      );

    const price =
      normalizePrice(
        p.price ??
        p.Price
      );

    const oldPrice =
      normalizePrice(
        p.oldPrice ??
        p.OldPrice
      );

    const offerPrice =
      normalizePrice(
        p.offerPrice ??
        p.OfferPrice
      );

    const sortOrder =
      Number(
        p.sortOrder ??
        p.SortOrder ??
        0
      ) || 0;

    return {
      id,
      name,
      category,
      image,
      description,
      active,
      showHome,
      isOffer,
      price,
      oldPrice,
      offerPrice,
      sortOrder,
      searchIndex:
        normalizeArabic(
          `${name} ${category} ${description}`
        )
    };
  }


  /* =========================================================
     FETCH PRODUCTS
     ========================================================= */

  let productsPromise = null;


  async function fetchProducts(){

    const response =
      await fetch(
        DATA_URL,
        {
          method:"GET",
          cache:"default",
          redirect:"follow"
        }
      );

    if(!response.ok){
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    let rawProducts = [];

    if(Array.isArray(data)){

      rawProducts = data;

    }else if(
      data &&
      Array.isArray(data.products)
    ){

      rawProducts = data.products;

    }else if(
      data &&
      Array.isArray(data.data)
    ){

      rawProducts = data.data;

    }else{

      throw new Error(
        "صيغة البيانات غير صحيحة"
      );
    }

    return rawProducts
      .map(normalizeProduct)
      .filter(product => product.active)
      .sort(
        (a,b) =>
          a.sortOrder -
          b.sortOrder
      );
  }


  async function getProducts(
    forceRefresh = false
  ){

    const cached =
      readCache();

    if(
      !forceRefresh &&
      cached &&
      Array.isArray(cached.products) &&
      cached.products.length &&
      Date.now() -
        cached.time <
        CACHE_TIME
    ){
      return cached.products;
    }

    if(!productsPromise){

      productsPromise =
        fetchProducts()
          .then(products => {

            writeCache(products);

            return products;

          })
          .finally(() => {

            productsPromise = null;

          });
    }

    return productsPromise;
  }


  function refreshInBackground(){

    if(productsPromise){
      return productsPromise;
    }

    const cached =
      readCache();

    if(
      cached &&
      cached.time &&
      Date.now() -
        cached.time <
        BACKGROUND_REFRESH_TIME
    ){
      return Promise.resolve(
        cached.products
      );
    }

    productsPromise =
      fetchProducts()
        .then(products => {

          writeCache(products);

          return products;

        })
        .catch(() => null)
        .finally(() => {

          productsPromise = null;

        });

    return productsPromise;
  }


  /* =========================================================
     PRODUCT IMAGE
     ========================================================= */

  function createProductImage(
    product,
    lazy = true
  ){

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "product-image";

    const sources =
      getImageSources(
        product.image
      );

    if(!sources.length){

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

    if(lazy){

      img.loading = "lazy";
      img.fetchPriority = "low";

    }else{

      img.loading = "eager";
      img.fetchPriority = "high";
    }

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
      {once:true}
    );

    wrapper.appendChild(img);

    return wrapper;
  }


  /* =========================================================
     CART
     ========================================================= */

  let cart = [];


  function readCart(){

    try{

      const raw =
        localStorage.getItem(
          CART_KEY
        );

      if(!raw){
        return [];
      }

      const data =
        JSON.parse(raw);

      if(!Array.isArray(data)){
        return [];
      }

      return data
        .filter(
          item =>
            item &&
            item.id &&
            Number(item.quantity) > 0
        )
        .map(item => ({
          id:String(item.id),
          name:cleanText(item.name),
          category:cleanText(item.category),
          image:cleanText(item.image),
          price:Number(item.price) || 0,
          quantity:
            Math.max(
              1,
              Number(item.quantity) || 1
            )
        }));

    }catch(error){

      return [];
    }
  }


  function saveCart(){

    try{

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
      );

    }catch(error){}

    updateCartUI();
  }


  function cartCount(){

    return cart.reduce(
      (sum,item) =>
        sum + item.quantity,
      0
    );
  }


  function cartTotal(){

    return cart.reduce(
      (sum,item) =>
        sum +
        item.price *
        item.quantity,
      0
    );
  }


  function addToCart(product){

    const price =
      getProductPrice(product);

    if(price <= 0){

      openProductModal(product);

      return;
    }

    const existing =
      cart.find(
        item =>
          item.id === product.id
      );

    if(existing){

      existing.quantity += 1;

    }else{

      cart.push({
        id:product.id,
        name:product.name,
        category:product.category,
        image:product.image,
        price,
        quantity:1
      });
    }

    saveCart();

    openCart();

    showAddedState(product.id);
  }


  function changeCartQuantity(
    id,
    delta
  ){

    const item =
      cart.find(
        product =>
          product.id === id
      );

    if(!item){
      return;
    }

    item.quantity += delta;

    if(item.quantity <= 0){

      cart =
        cart.filter(
          product =>
            product.id !== id
        );
    }

    saveCart();
  }


  function removeFromCart(id){

    cart =
      cart.filter(
        item =>
          item.id !== id
      );

    saveCart();
  }


  function clearCart(){

    cart = [];

    saveCart();
  }


  function showAddedState(id){

    document
      .querySelectorAll(
        `.abo-add-cart[data-cart-id="${CSS.escape(id)}"]`
      )
      .forEach(button => {

        button.classList.add("added");

        const old =
          button.innerHTML;

        button.innerHTML =
          "✓ تمت الإضافة";

        setTimeout(() => {

          button.classList.remove("added");

          button.innerHTML =
            old;

        },1400);

      });
  }


  function cartWhatsAppUrl(){

    if(!cart.length){
      return "#";
    }

    let message =
      "السلام عليكم، عايز أطلب الأصناف دي:\n\n";

    cart.forEach(
      (item,index) => {

        message +=
          `${index + 1}) ${item.name}\n`;

        message +=
          `الكمية: ${item.quantity}\n`;

        message +=
          `السعر: ${formatPrice(item.price)}\n`;

        message +=
          `الإجمالي: ${formatPrice(item.price * item.quantity)}\n\n`;
      }
    );

    message +=
      "--------------------\n";

    message +=
      `إجمالي الطلب: ${formatPrice(cartTotal())}\n\n`;

    message +=
      "من موقع أبو طارق للأدوات المنزلية.";

    return (
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(message)
    );
  }


  function ensureCart(){

    let button =
      document.getElementById(
        "aboCartButton"
      );

    if(!button){

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

    if(drawer){
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
          >
            ×
          </button>

        </div>

        <div class="abo-cart-items"></div>

        <div class="abo-cart-footer">

          <div class="abo-cart-summary">

            <span>
              إجمالي الطلب
            </span>

            <strong class="abo-cart-summary-total">
              0 جنيه
            </strong>

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
      .addEventListener(
        "click",
        closeCart
      );

    drawer.addEventListener(
      "click",
      event => {

        if(
          event.target.matches(
            "[data-close-cart]"
          )
        ){
          closeCart();
        }

        const plus =
          event.target.closest(
            "[data-cart-plus]"
          );

        if(plus){

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

        if(minus){

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

        if(remove){

          removeFromCart(
            remove.dataset.cartRemove
          );
        }
      });

    drawer
      .querySelector(".abo-cart-clear")
      .addEventListener(
        "click",
        clearCart
      );
  }


  function renderCart(){

    const drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if(!drawer){
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

    if(!items){
      return;
    }

    if(!cart.length){

      items.innerHTML = `

        <div class="abo-cart-empty">

          <div class="abo-cart-empty-icon">
            🛒
          </div>

          <strong>
            السلة لسه فاضية
          </strong>

          <span>
            اختار الأصناف اللي عايز تطلبها.
          </span>

        </div>

      `;

    }else{

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
                          alt=""
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
                      formatPrice(item.price)
                    )}
                  </div>

                  <div class="abo-cart-item-controls">

                    <button
                      type="button"
                      class="abo-cart-qty-btn"
                      data-cart-plus="${escapeAttribute(item.id)}"
                    >
                      +
                    </button>

                    <span class="abo-cart-qty">
                      ${item.quantity}
                    </span>

                    <button
                      type="button"
                      class="abo-cart-qty-btn"
                      data-cart-minus="${escapeAttribute(item.id)}"
                    >
                      −
                    </button>

                    <button
                      type="button"
                      class="abo-cart-remove"
                      data-cart-remove="${escapeAttribute(item.id)}"
                      aria-label="حذف المنتج"
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

    if(total){

      total.textContent =
        formatPrice(
          cartTotal()
        ) || "0 جنيه";
    }

    if(whatsapp){

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


  function updateCartUI(){

    ensureCart();

    const count =
      document.querySelector(
        ".abo-cart-count"
      );

    const total =
      document.querySelector(
        ".abo-cart-total"
      );

    if(count){
      count.textContent =
        cartCount();
    }

    if(total){
      total.textContent =
        formatPrice(
          cartTotal()
        ) || "0 جنيه";
    }

    renderCart();
  }


  function openCart(){

    ensureCart();

    const drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if(!drawer){
      return;
    }

    renderCart();

    drawer.classList.add("open");

    document.body.classList.add(
      "modal-open"
    );

    document.body.style.overflow =
      "hidden";
  }


  function closeCart(){

    const drawer =
      document.getElementById(
        "aboCartDrawer"
      );

    if(!drawer){
      return;
    }

    drawer.classList.remove("open");

    document.body.classList.remove(
      "modal-open"
    );

    document.body.style.overflow =
      "";
  }


  /* =========================================================
     PRODUCT CARD
     ========================================================= */

  function createProductCard(
    product,
    index
  ){

    const article =
      document.createElement("article");

    article.className =
      "product";

    article.dataset.id =
      product.id;

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

    const shortDescription =
      product.description
        ? (
            product.description.length > 115
              ? product.description
                  .slice(0,115)
                  .trimEnd() +
                "..."
              : product.description
          )
        : "";

    const hasCartPrice =
      getProductPrice(product) > 0;

    body.innerHTML = `

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
        shortDescription
          ? `
            <p class="product-description">
              ${escapeHtml(shortDescription)}
            </p>
          `
          : ""
      }

      ${
        product.description &&
        product.description.length > 115
          ? `
            <button
              type="button"
              class="product-details-trigger"
            >
              عرض المزيد من التفاصيل
              <span>←</span>
            </button>
          `
          : ""
      }

      ${renderPrice(product)}

      <div class="product-actions">

        <button
          type="button"
          class="product-details-trigger product-details-main"
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

        if(
          event.target.closest("a")
        ){
          return;
        }

        const addButton =
          event.target.closest(
            ".abo-add-cart"
          );

        if(addButton){

          event.preventDefault();

          event.stopPropagation();

          addToCart(product);

          return;
        }

        if(
          event.target.closest(
            ".product-details-trigger"
          )
        ){

          event.preventDefault();
          event.stopPropagation();

          openProductModal(product);

          return;
        }

        openProductModal(product);
      }
    );

    return article;
  }


  /* =========================================================
     HOMEPAGE
     ========================================================= */

  function initHomepage(products){

    const grid =
      document.getElementById(
        "productsGrid"
      );

    if(!grid){
      return;
    }

    const explicitlyHome =
      products.filter(
        product =>
          product.showHome
      );

    const homeProducts =
      explicitlyHome.length
        ? explicitlyHome
        : products;

    const offerProducts =
      products.filter(
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
          .map(
            product =>
              product.category
          )
          .filter(Boolean)
      )
    ];


    function renderCategories(){

      if(!categoryGrid){
        return;
      }

      if(!categories.length){

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
              products.filter(
                product =>
                  product.category === category &&
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
                    categoryIcon(category)
                  )}
                </span>

                <span class="cat-content">

                  <strong>
                    ${escapeHtml(category)}
                  </strong>

                  <small>
                    ${count}
                    ${count === 1 ? "صنف" : "أصناف"}
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


    function renderFilters(){

      if(!filters){
        return;
      }

      filters.innerHTML = `

        <button
          class="filter active"
          type="button"
          data-filter="الكل"
        >
          🛍️ الكل
        </button>

        ${categories
          .map(
            category => `

              <button
                class="filter"
                type="button"
                data-filter="${escapeAttribute(category)}"
              >
                ${escapeHtml(
                  categoryIcon(category)
                )}
                ${escapeHtml(category)}
              </button>

            `
          )
          .join("")}

      `;
    }


    function getFilteredProducts(){

      const query =
        normalizeArabic(
          searchTerm
        );

      return homeProducts.filter(
        product => {

          const categoryMatch =
            activeCategory === "الكل" ||
            product.category === activeCategory;

          const searchMatch =
            !query ||
            product.searchIndex.includes(query);

          return (
            categoryMatch &&
            searchMatch
          );
        }
      );
    }


    function renderProducts(){

      const list =
        getFilteredProducts();

      if(!list.length){

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
        (product,index) => {

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


    function renderOffers(){

      if(
        !offersGrid ||
        !offersSection
      ){
        return;
      }

      if(!offerProducts.length){

        offersGrid.innerHTML = "";

        offersSection.hidden =
          true;

        return;
      }

      const fragment =
        document.createDocumentFragment();

      offerProducts.forEach(
        (product,index) => {

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


    if(filters){

      filters.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-filter]"
            );

          if(!button){
            return;
          }

          activeCategory =
            button.dataset.filter ||
            "الكل";

          filters
            .querySelectorAll(
              ".filter"
            )
            .forEach(item => {

              item.classList.toggle(
                "active",
                item === button
              );

            });

          renderProducts();
        }
      );
    }


    if(categoryGrid){

      categoryGrid.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-category]"
            );

          if(!button){
            return;
          }

          const category =
            button.dataset.category ||
            "الكل";

          window.location.href =
            "./sections.html?category=" +
            encodeURIComponent(category);
        }
      );
    }


    function ensureSearchBox(){

      const toolbar =
        document.querySelector(
          ".products-toolbar"
        );

      if(!toolbar){
        return null;
      }

      let box =
        document.getElementById(
          "productSearchBox"
        );

      if(box){
        return box;
      }

      box =
        document.createElement("div");

      box.id =
        "productSearchBox";

      box.className =
        "product-search";

      box.innerHTML = `

        <div class="product-search-box">

          <span class="search-icon">
            🔎
          </span>

          <input
            id="productSearchInput"
            type="search"
            placeholder="دور على صنف..."
            autocomplete="off"
            aria-label="البحث عن صنف"
            aria-expanded="false"
          >

          <button
            id="productSearchClear"
            type="button"
            hidden
            aria-label="مسح البحث"
          >
            ×
          </button>

        </div>

        <div
          id="productSearchSuggestions"
          class="product-search-suggestions"
          hidden
        ></div>

      `;

      toolbar.prepend(box);

      return box;
    }


    ensureSearchBox();


    const searchInput =
      document.getElementById(
        "productSearchInput"
      );

    const searchClear =
      document.getElementById(
        "productSearchClear"
      );

    const suggestions =
      document.getElementById(
        "productSearchSuggestions"
      );


    function updateSuggestions(){

      if(
        !searchInput ||
        !suggestions
      ){
        return;
      }

      const query =
        normalizeArabic(
          searchInput.value
        );

      if(!query){

        suggestions.hidden =
          true;

        searchInput.setAttribute(
          "aria-expanded",
          "false"
        );

        return;
      }

      const matches =
        homeProducts
          .filter(
            product =>
              product.searchIndex.includes(query)
          )
          .slice(0,8);

      if(!matches.length){

        suggestions.innerHTML = `

          <div class="search-suggestion no-result">

            <span class="search-suggestion-icon">
              🔎
            </span>

            <span class="search-suggestion-content">

              <strong>
                مفيش نتائج
              </strong>

              <small>
                جرّب كلمة بحث مختلفة
              </small>

            </span>

          </div>

        `;

        suggestions.hidden =
          false;

        searchInput.setAttribute(
          "aria-expanded",
          "true"
        );

        return;
      }

      suggestions.innerHTML =
        matches
          .map(
            product => {

              const sources =
                getImageSources(
                  product.image
                );

              return `

                <button
                  type="button"
                  class="search-suggestion"
                  data-id="${escapeAttribute(product.id)}"
                >

                  <span class="search-suggestion-icon">

                    ${
                      sources.length
                        ? `
                          <img
                            src="${escapeAttribute(sources[0])}"
                            alt=""
                            loading="lazy"
                          >
                        `
                        : escapeHtml(
                            categoryIcon(
                              product.category
                            )
                          )
                    }

                  </span>

                  <span class="search-suggestion-content">

                    <strong>
                      ${escapeHtml(product.name)}
                    </strong>

                    <small>
                      ${escapeHtml(product.category)}
                    </small>

                  </span>

                </button>

              `;

            }
          )
          .join("");

      suggestions.hidden =
        false;

      searchInput.setAttribute(
        "aria-expanded",
        "true"
      );
    }


    if(searchInput){

      searchInput.addEventListener(
        "input",
        () => {

          searchTerm =
            searchInput.value;

          if(searchClear){

            searchClear.hidden =
              !searchInput.value;
          }

          updateSuggestions();

          renderProducts();
        }
      );

      searchInput.addEventListener(
        "focus",
        updateSuggestions
      );

      searchInput.addEventListener(
        "keydown",
        event => {

          if(
            event.key === "Escape"
          ){

            if(suggestions){
              suggestions.hidden = true;
            }

            searchInput.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        }
      );
    }


    if(searchClear){

      searchClear.addEventListener(
        "click",
        () => {

          if(!searchInput){
            return;
          }

          searchInput.value = "";
          searchTerm = "";

          searchClear.hidden = true;

          if(suggestions){
            suggestions.hidden = true;
          }

          renderProducts();

          searchInput.focus();
        }
      );
    }


    if(suggestions){

      suggestions.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-id]"
            );

          if(!button){
            return;
          }

          const product =
            homeProducts.find(
              item =>
                item.id ===
                button.dataset.id
            );

          if(!product){
            return;
          }

          searchInput.value =
            product.name;

          searchTerm =
            product.name;

          if(searchClear){
            searchClear.hidden = false;
          }

          suggestions.hidden = true;

          renderProducts();

          openProductModal(product);
        }
      );
    }


    document.addEventListener(
      "click",
      event => {

        if(
          !event.target.closest(
            "#productSearchBox"
          )
        ){

          if(suggestions){
            suggestions.hidden = true;
          }

          if(searchInput){

            searchInput.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        }
      }
    );


    renderCategories();
    renderFilters();
    renderProducts();
    renderOffers();
  }


  /* =========================================================
     PRODUCT MODAL
     ========================================================= */

  function ensureModal(){

    let modal =
      document.getElementById(
        "aboTarekProductModal"
      );

    if(modal){
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
        aria-label="تفاصيل المنتج"
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

    document.body.appendChild(modal);

    const closeButton =
      modal.querySelector(
        ".product-modal-close"
      );

    if(closeButton){

      closeButton.addEventListener(
        "click",
        closeProductModal
      );
    }

    modal.addEventListener(
      "click",
      event => {

        if(
          event.target.matches(
            "[data-close-modal]"
          )
        ){
          closeProductModal();
        }
      }
    );

    return modal;
  }


  function openProductModal(product){

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

    const addButton =
      document.getElementById(
        "aboModalAddCart"
      );

    const sources =
      getImageSources(
        product.image
      );

    if(image){

      if(sources.length){

        image.src =
          sources[0];

        image.style.display =
          "block";

        image.alt =
          `صورة ${product.name}`;

      }else{

        image.removeAttribute("src");

        image.style.display =
          "none";
      }
    }

    if(category){
      category.textContent =
        product.category;
    }

    if(name){
      name.textContent =
        product.name;
    }

    if(description){

      description.textContent =
        product.description ||
        "للاستفسار عن تفاصيل الصنف، تواصل معنا على واتساب.";
    }

    if(price){

      price.innerHTML =
        renderPrice(product);
    }

    if(whatsapp){

      whatsapp.href =
        whatsappUrl(product);
    }

    if(addButton){

      if(
        getProductPrice(product) > 0
      ){

        addButton.style.display =
          "flex";

        addButton.onclick =
          () => addToCart(product);

      }else{

        addButton.style.display =
          "none";
      }
    }

    modal.classList.add("show");
    modal.classList.add("open");

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


  function closeProductModal(){

    const modal =
      document.getElementById(
        "aboTarekProductModal"
      );

    if(!modal){
      return;
    }

    modal.classList.remove("show");
    modal.classList.remove("open");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "modal-open"
    );

    document.body.style.overflow =
      "";
  }


  /* =========================================================
     MOBILE NAV
     ========================================================= */

  function initMobileNav(){

    const menuButton =
      document.getElementById(
        "menuBtn"
      );

    const nav =
      document.getElementById(
        "navLinks"
      );

    if(
      !menuButton ||
      !nav
    ){
      return;
    }

    menuButton.addEventListener(
      "click",
      () => {

        const opened =
          nav.classList.toggle(
            "open"
          );

        menuButton.setAttribute(
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

            menuButton.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        );
      });

    document.addEventListener(
      "click",
      event => {

        if(
          !event.target.closest(
            ".site-header"
          )
        ){

          nav.classList.remove(
            "open"
          );

          menuButton.setAttribute(
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

  function showError(){

    const grid =
      document.getElementById(
        "productsGrid"
      );

    if(!grid){
      return;
    }

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
          حاول تحديث الصفحة مرة تانية.
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

    if(retry){

      retry.addEventListener(
        "click",
        () => {

          try{

            localStorage.removeItem(
              CACHE_KEY
            );

          }catch(error){}

          window.location.reload();
        }
      );
    }
  }


  /* =========================================================
     START
     ========================================================= */

  async function startApp(){

    initMobileNav();

    cart =
      readCart();

    ensureCart();
    updateCartUI();

    const homepage =
      document.getElementById(
        "productsGrid"
      );

    if(homepage){

      homepage.innerHTML = `

        <div class="loading">

          <span class="loading-spinner"></span>

          جاري تحميل الأصناف...

        </div>

      `;
    }

    try{

      const cached =
        readCache();

      if(
        cached &&
        Array.isArray(cached.products) &&
        cached.products.length
      ){

        initHomepage(
          cached.products
        );

        refreshInBackground();

        return;
      }

      const products =
        await getProducts(true);

      initHomepage(products);

    }catch(error){

      console.error(
        "Abo Tarek Store error:",
        error
      );

      const fallback =
        readCache();

      if(
        fallback &&
        Array.isArray(fallback.products) &&
        fallback.products.length
      ){

        initHomepage(
          fallback.products
        );

        return;
      }

      showError();
    }
  }


  /* =========================================================
     GLOBAL
     ========================================================= */

  window.openProductModal =
    openProductModal;

  window.closeProductModal =
    closeProductModal;

  window.openAboTarekCart =
    openCart;

  window.closeAboTarekCart =
    closeCart;


  /* =========================================================
     KEYBOARD
     ========================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if(
        event.key === "Escape"
      ){

        closeProductModal();
        closeCart();
      }
    }
  );


  /* =========================================================
     RUN
     ========================================================= */

  if(
    document.readyState === "loading"
  ){

    document.addEventListener(
      "DOMContentLoaded",
      startApp,
      {once:true}
    );

  }else{

    startApp();
  }

})();
