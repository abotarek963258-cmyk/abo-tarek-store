var DATA_URL = "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHTHTN-kvEaCKI0-wKWu7hY/exec";

var WHATSAPP_NUMBER = "201551604163";

var products = [];
var categories = [];
var currentCategory = "الكل";
var searchQuery = "";

var PRODUCTS_CACHE_KEY = "abo_tarek_products_cache_v1";
var SECTIONS_CACHE_KEY = "abo_tarek_sections_cache_v1";

var CACHE_TIME = 5 * 60 * 1000;

var productsLoaded = false;
var sectionsLoaded = false;
var modalReady = false;
var searchReady = false;


/* =========================
   HELPERS
========================= */

function esc(value) {
  return String(value == null ? "" : value).replace(
    /[&<>"']/g,
    function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    }
  );
}


function isActive(value) {
  return String(value).toLowerCase() !== "false";
}


/* =========================
   SEARCH NORMALIZATION
========================= */

function normalizeSearchText(value) {
  return String(value == null ? "" : value)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}


function productMatchesSearch(product, query) {

  var search =
    normalizeSearchText(query);

  if (!search) {
    return true;
  }

  var name =
    normalizeSearchText(product.name);

  var category =
    normalizeSearchText(product.category);

  var description =
    normalizeSearchText(product.description);

  return (
    name.indexOf(search) !== -1 ||
    category.indexOf(search) !== -1 ||
    description.indexOf(search) !== -1
  );
}


/* =========================
   WHATSAPP
========================= */

function getWhatsAppLink(product) {

  var productName =
    String(
      product.name ||
      "الصنف"
    ).trim();

  var message =
    "السلام عليكم،\n" +
    "أرغب في الاستفسار عن:\n" +
    "🛍️ " +
    productName +
    "\n" +
    "هل الصنف متاح؟";

  return (
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message)
  );
}


/* =========================
   CACHE
========================= */

function getCache(key) {

  try {

    var raw =
      localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    var data =
      JSON.parse(raw);

    if (
      !data ||
      !data.time ||
      !Array.isArray(data.value)
    ) {
      return null;
    }

    if (
      Date.now() - data.time >
      CACHE_TIME
    ) {
      return null;
    }

    return data.value;

  } catch (error) {

    console.warn(
      "تعذر قراءة الكاش:",
      error
    );

    return null;
  }
}


function getStaleCache(key) {

  try {

    var raw =
      localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    var data =
      JSON.parse(raw);

    if (
      !data ||
      !Array.isArray(data.value)
    ) {
      return null;
    }

    return data.value;

  } catch (error) {

    return null;
  }
}


function setCache(key, value) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify({
        time: Date.now(),
        value: value
      })
    );

  } catch (error) {

    console.warn(
      "تعذر حفظ الكاش:",
      error
    );
  }
}


/* =========================
   RENDER ONCE
========================= */

function renderStoreUI() {

  renderCategories();
  renderFilters();
  renderProducts();

  setupProductSearch();
}


function addProductCategoriesToList() {

  var productCategories = [];

  products.forEach(
    function (product) {

      var category =
        String(
          product.category ||
          ""
        ).trim();

      if (
        category &&
        productCategories.indexOf(
          category
        ) === -1
      ) {

        productCategories.push(
          category
        );
      }
    }
  );


  productCategories.forEach(
    function (category) {

      if (
        categories.indexOf(
          category
        ) === -1
      ) {

        categories.push(
          category
        );
      }
    }
  );
}


/* =========================
   LOAD PRODUCTS
========================= */

function loadProducts() {

  var cachedProducts =
    getCache(
      PRODUCTS_CACHE_KEY
    );


  if (cachedProducts) {

    products =
      cachedProducts.filter(
        function (product) {
          return isActive(
            product.active
          );
        }
      );

    productsLoaded =
      true;


    console.log(
      "⚡ المنتجات ظهرت من الكاش:",
      products.length
    );


    renderProducts();
    setupProductSearch();


    fetchProductsFromServer(
      true
    );


    return Promise.resolve(true);
  }


  return fetchProductsFromServer(
    false
  );
}


function fetchProductsFromServer(
  hasCachedData
) {

  return fetch(
    DATA_URL,
    {
      method: "GET",
      cache: "default"
    }
  )

    .then(
      function (response) {

        if (!response.ok) {

          throw new Error(
            "HTTP " +
            response.status
          );
        }

        return response.json();
      }
    )

    .then(
      function (data) {

        if (
          !data ||
          data.ok !== true ||
          !Array.isArray(
            data.products
          )
        ) {

          throw new Error(
            "استجابة المنتجات غير صحيحة"
          );
        }


        setCache(
          PRODUCTS_CACHE_KEY,
          data.products
        );


        products =
          data.products.filter(
            function (product) {

              return isActive(
                product.active
              );
            }
          );


        productsLoaded =
          true;


        console.log(
          "✅ تم تحديث المنتجات من السيرفر:",
          products.length
        );


        /*
         * نرسم مرة واحدة فقط بعد وصول
         * النسخة الجديدة.
         */

        addProductCategoriesToList();

        renderStoreUI();


        return true;
      }
    )

    .catch(
      function (error) {

        console.warn(
          "تعذر تحديث المنتجات من السيرفر:",
          error
        );


        /*
         * لو عندنا كاش قديم جدًا
         * نستخدمه بدل إظهار الصفحة فارغة.
         */

        if (
          !hasCachedData &&
          !products.length
        ) {

          var oldCache =
            getStaleCache(
              PRODUCTS_CACHE_KEY
            );


          if (oldCache) {

            products =
              oldCache.filter(
                function (product) {

                  return isActive(
                    product.active
                  );
                }
              );


            productsLoaded =
              true;


            addProductCategoriesToList();

            renderStoreUI();


            console.log(
              "تم استخدام نسخة المنتجات المحفوظة."
            );


            return true;
          }
        }


        return products.length > 0;
      }
    );
}


/* =========================
   LOAD SECTIONS
========================= */

function loadSections() {

  var cachedSections =
    getCache(
      SECTIONS_CACHE_KEY
    );


  if (cachedSections) {

    categories =
      prepareCategories(
        cachedSections
      );


    sectionsLoaded =
      true;


    console.log(
      "⚡ الأقسام ظهرت من الكاش."
    );


    renderCategories();
    renderFilters();


    fetchSectionsFromServer(
      true
    );


    return Promise.resolve(true);
  }


  return fetchSectionsFromServer(
    false
  );
}


function prepareCategories(
  sectionList
) {

  if (
    !Array.isArray(
      sectionList
    )
  ) {

    return [];
  }


  return sectionList

    .filter(
      function (section) {

        return (
          isActive(
            section.active
          ) &&
          String(
            section.name ||
            ""
          ).trim()
        );
      }
    )

    .sort(
      function (a, b) {

        var orderA =
          Number(
            a.sortOrder
          ) || 999999;

        var orderB =
          Number(
            b.sortOrder
          ) || 999999;

        return (
          orderA -
          orderB
        );
      }
    )

    .map(
      function (section) {

        return String(
          section.name
        ).trim();
      }
    );
}


function fetchSectionsFromServer(
  hasCachedData
) {

  return fetch(
    DATA_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body: JSON.stringify({
        key: "123456",
        action: "listSections"
      }),

      cache: "default"
    }
  )

    .then(
      function (response) {

        if (!response.ok) {

          throw new Error(
            "HTTP " +
            response.status
          );
        }

        return response.json();
      }
    )

    .then(
      function (data) {

        if (
          !data ||
          data.ok !== true ||
          !Array.isArray(
            data.sections
          )
        ) {

          throw new Error(
            "استجابة الأقسام غير صحيحة"
          );
        }


        setCache(
          SECTIONS_CACHE_KEY,
          data.sections
        );


        categories =
          prepareCategories(
            data.sections
          );


        sectionsLoaded =
          true;


        addProductCategoriesToList();

        renderCategories();
        renderFilters();


        console.log(
          "✅ تم تحديث الأقسام."
        );


        return true;
      }
    )

    .catch(
      function (error) {

        console.warn(
          "تعذر تحديث الأقسام:",
          error
        );


        if (
          !hasCachedData &&
          !categories.length
        ) {

          var oldSections =
            getStaleCache(
              SECTIONS_CACHE_KEY
            );


          if (oldSections) {

            categories =
              prepareCategories(
                oldSections
              );


            sectionsLoaded =
              true;


            addProductCategoriesToList();

            renderCategories();
            renderFilters();


            return true;
          }
        }


        return categories.length > 0;
      }
    );
}


/* =========================
   FALLBACK CATEGORIES
========================= */

function buildCategoriesFallback() {

  var list = [];


  products.forEach(
    function (product) {

      var category =
        String(
          product.category ||
          ""
        ).trim();


      if (
        category &&
        list.indexOf(
          category
        ) === -1
      ) {

        list.push(
          category
        );
      }
    }
  );


  categories =
    list;
}


/* =========================
   CATEGORIES
========================= */

function renderCategories() {

  var element =
    document.getElementById(
      "categoryGrid"
    );


  if (!element) {
    return;
  }


  if (!categories.length) {

    element.innerHTML =
      '<div class="empty">' +
      '<div class="empty-icon">🛍️</div>' +
      '<h3>مفيش أقسام متاحة حاليًا</h3>' +
      '<p>هنضيف الأقسام قريبًا.</p>' +
      "</div>";

    return;
  }


  var html = "";


  categories.forEach(
    function (category) {

      html +=
        '<button type="button" ' +
        'class="cat" ' +
        'data-category="' +
        esc(category) +
        '">' +

        '<span class="cat-icon">🛍️</span>' +

        "<span>" +
        esc(category) +
        "</span>" +

        "</button>";
    }
  );


  element.innerHTML =
    html;


  var buttons =
    element.querySelectorAll(
      ".cat"
    );


  for (
    var i = 0;
    i < buttons.length;
    i++
  ) {

    buttons[i].addEventListener(
      "click",
      function () {

        selectCategory(
          this.getAttribute(
            "data-category"
          )
        );
      }
    );
  }
}


/* =========================
   FILTERS
========================= */

function renderFilters() {

  var element =
    document.getElementById(
      "filters"
    );


  if (!element) {
    return;
  }


  var filters =
    ["الكل"];


  for (
    var i = 0;
    i < categories.length;
    i++
  ) {

    if (
      filters.indexOf(
        categories[i]
      ) === -1
    ) {

      filters.push(
        categories[i]
      );
    }
  }


  var html = "";


  filters.forEach(
    function (category) {

      var active =
        currentCategory ===
        category
          ? "active"
          : "";


      html +=
        '<button type="button" ' +
        'class="filter ' +
        active +
        '" ' +
        'data-category="' +
        esc(category) +
        '">' +

        esc(category) +

        "</button>";
    }
  );


  element.innerHTML =
    html;


  var buttons =
    element.querySelectorAll(
      ".filter"
    );


  for (
    var j = 0;
    j < buttons.length;
    j++
  ) {

    buttons[j].addEventListener(
      "click",
      function () {

        selectCategory(
          this.getAttribute(
            "data-category"
          ),
          false
        );
      }
    );
  }
}


/* =========================
   FILTER PRODUCTS
========================= */

function getFilteredProducts() {

  var list =
    products.slice();


  if (
    currentCategory !==
    "الكل"
  ) {

    list =
      list.filter(
        function (product) {

          return (
            String(
              product.category ||
              ""
            ).trim() ===
            currentCategory
          );
        }
      );
  }


  if (searchQuery) {

    list =
      list.filter(
        function (product) {

          return productMatchesSearch(
            product,
            searchQuery
          );
        }
      );
  }


  return list;
}


/* =========================
   SEARCH SUGGESTIONS
========================= */

function getSearchSuggestions() {

  var query =
    normalizeSearchText(
      searchQuery
    );


  if (!query) {
    return [];
  }


  var matches =
    products.filter(
      function (product) {

        return productMatchesSearch(
          product,
          query
        );
      }
    );


  return matches.slice(
    0,
    8
  );
}


function hideSearchSuggestions() {

  var element =
    document.getElementById(
      "searchSuggestions"
    );


  if (!element) {
    return;
  }


  element.innerHTML =
    "";


  element.hidden =
    true;
}


function showSearchSuggestions() {

  var element =
    document.getElementById(
      "searchSuggestions"
    );


  if (!element) {
    return;
  }


  var suggestions =
    getSearchSuggestions();


  if (
    !searchQuery ||
    !suggestions.length
  ) {

    hideSearchSuggestions();

    return;
  }


  var html = "";


  suggestions.forEach(
    function (product) {

      var index =
        products.indexOf(
          product
        );


      var name =
        String(
          product.name ||
          "صنف بدون اسم"
        ).trim();


      var category =
        String(
          product.category ||
          ""
        ).trim();


      html +=

        '<button type="button" ' +
        'class="search-suggestion" ' +
        'data-product-index="' +
        index +
        '">' +

        '<span class="search-suggestion-icon">🛍️</span>' +

        '<span class="search-suggestion-content">' +

        '<strong>' +
        esc(name) +
        "</strong>" +

        (
          category
            ? '<small>' +
              esc(category) +
              "</small>"
            : ""
        ) +

        "</span>" +

        '<span class="search-suggestion-arrow">←</span>' +

        "</button>";
    }
  );


  element.innerHTML =
    html;


  element.hidden =
    false;


  var buttons =
    element.querySelectorAll(
      ".search-suggestion"
    );


  for (
    var i = 0;
    i < buttons.length;
    i++
  ) {

    buttons[i].addEventListener(
      "click",
      function () {

        var index =
          Number(
            this.getAttribute(
              "data-product-index"
            )
          );


        chooseSearchProduct(
          index
        );
      }
    );
  }
}


/* =========================
   CHOOSE SEARCH PRODUCT
========================= */

function chooseSearchProduct(
  productIndex
) {

  var product =
    products[
      productIndex
    ];


  if (!product) {
    return;
  }


  var input =
    document.getElementById(
      "productSearch"
    );


  if (input) {

    input.value =
      String(
        product.name ||
        ""
      ).trim();
  }


  searchQuery =
    String(
      product.name ||
      ""
    ).trim();


  hideSearchSuggestions();


  renderProducts();


  setTimeout(
    function () {

      var card =
        document.querySelector(
          '.product[data-product-index="' +
          productIndex +
          '"]'
        );


      if (!card) {
        return;
      }


      card.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });


      card.classList.remove(
        "search-highlight"
      );


      void card.offsetWidth;


      card.classList.add(
        "search-highlight"
      );

    },
    30
  );
}


/* =========================
   SETUP SEARCH
========================= */

function setupProductSearch() {

  if (searchReady) {
    return;
  }


  var input =
    document.getElementById(
      "productSearch"
    );


  var clearButton =
    document.getElementById(
      "clearProductSearch"
    );


  if (!input) {
    return;
  }


  searchReady =
    true;


  input.setAttribute(
    "data-search-ready",
    "true"
  );


  input.addEventListener(
    "input",
    function () {

      searchQuery =
        this.value.trim();


      renderProducts();

      showSearchSuggestions();

      updateSearchClearButton();
    }
  );


  input.addEventListener(
    "focus",
    function () {

      if (searchQuery) {

        showSearchSuggestions();
      }
    }
  );


  input.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Enter"
      ) {

        var suggestions =
          getSearchSuggestions();


        if (
          suggestions.length
        ) {

          var index =
            products.indexOf(
              suggestions[0]
            );


          chooseSearchProduct(
            index
          );


          event.preventDefault();
        }
      }


      if (
        event.key ===
        "Escape"
      ) {

        hideSearchSuggestions();

        this.blur();
      }
    }
  );


  if (clearButton) {

    clearButton.addEventListener(
      "click",
      function () {

        input.value =
          "";

        searchQuery =
          "";

        hideSearchSuggestions();

        renderProducts();

        updateSearchClearButton();

        input.focus();
      }
    );
  }


  updateSearchClearButton();
}


function updateSearchClearButton() {

  var input =
    document.getElementById(
      "productSearch"
    );


  var button =
    document.getElementById(
      "clearProductSearch"
    );


  if (
    !input ||
    !button
  ) {
    return;
  }


  button.hidden =
    !input.value.trim();
}


/* =========================
   PRODUCT MODAL
========================= */

function ensureProductModal() {

  if (modalReady) {
    return;
  }


  if (
    document.getElementById(
      "productDetailsModal"
    )
  ) {

    modalReady =
      true;

    return;
  }


  var modalHTML =

    '<div id="productDetailsModal" ' +
    'class="product-details-modal" ' +
    'hidden>' +

      '<div class="product-details-backdrop" ' +
      'data-close-product-modal>' +
      "</div>" +

      '<div class="product-details-dialog" ' +
      'role="dialog" ' +
      'aria-modal="true" ' +
      'aria-labelledby="productDetailsTitle">' +

        '<button type="button" ' +
        'class="product-details-close" ' +
        'aria-label="إغلاق" ' +
        'data-close-product-modal>' +
        "×" +
        "</button>" +

        '<div id="productDetailsContent">' +
        "</div>" +

      "</div>" +

    "</div>";


  document.body.insertAdjacentHTML(
    "beforeend",
    modalHTML
  );


  var closeButtons =
    document.querySelectorAll(
      "[data-close-product-modal]"
    );


  for (
    var i = 0;
    i < closeButtons.length;
    i++
  ) {

    closeButtons[i].addEventListener(
      "click",
      closeProductModal
    );
  }


  document.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Escape"
      ) {

        closeProductModal();
      }
    }
  );


  injectProductModalStyles();


  modalReady =
    true;
}


function injectProductModalStyles() {

  if (
    document.getElementById(
      "productModalRuntimeStyles"
    )
  ) {
    return;
  }


  var style =
    document.createElement(
      "style"
    );


  style.id =
    "productModalRuntimeStyles";


  style.textContent = `

    .product-details-modal{
      position:fixed;
      inset:0;
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
    }

    .product-details-modal[hidden]{
      display:none;
    }

    .product-details-backdrop{
      position:absolute;
      inset:0;
      background:rgba(7,15,27,.72);
      backdrop-filter:blur(8px);
    }

    .product-details-dialog{
      position:relative;
      z-index:2;
      width:min(920px,100%);
      max-height:92vh;
      overflow:auto;
      border-radius:24px;
      background:#fff;
      box-shadow:0 30px 100px rgba(0,0,0,.35);
      animation:aboProductModalIn .22s ease;
    }

    .product-details-close{
      position:absolute;
      top:14px;
      left:14px;
      z-index:10;
      width:42px;
      height:42px;
      border:0;
      border-radius:50%;
      background:rgba(20,38,61,.9);
      color:#fff;
      font-size:27px;
      line-height:1;
      cursor:pointer;
      display:grid;
      place-items:center;
    }

    .product-details-content{
      display:grid;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr);
      min-height:430px;
    }

    .product-details-image{
      min-height:430px;
      background:#f3f5f7;
      overflow:hidden;
    }

    .product-details-image img{
      width:100%;
      height:100%;
      min-height:430px;
      object-fit:cover;
      display:block;
    }

    .product-details-info{
      padding:42px 34px 34px;
      display:flex;
      flex-direction:column;
      justify-content:center;
    }

    .product-details-category{
      display:inline-flex;
      align-self:flex-start;
      margin-bottom:13px;
      padding:6px 11px;
      border-radius:999px;
      background:#edf2f7;
      color:#14263d;
      font-size:11px;
      font-weight:800;
    }

    .product-details-info h2{
      margin:0 0 14px;
      color:#14263d;
      font-size:28px;
      line-height:1.35;
    }

    .product-details-info p{
      margin:0;
      color:#667085;
      font-size:14px;
      line-height:2;
    }

    .product-details-actions{
      display:flex;
      gap:10px;
      margin-top:25px;
      flex-wrap:wrap;
    }

    .product-details-wa{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      min-height:48px;
      padding:0 18px;
      border-radius:13px;
      background:#14263d;
      color:#fff !important;
      text-decoration:none !important;
      font-size:13px;
      font-weight:800;
      flex:1;
    }

    .product-details-close-bottom{
      min-height:48px;
      padding:0 18px;
      border:1px solid #e1e5ea;
      border-radius:13px;
      background:#fff;
      color:#14263d;
      font-family:inherit;
      font-size:13px;
      font-weight:800;
      cursor:pointer;
    }

    .product-card-enhanced{
      position:relative;
      overflow:hidden;
    }

    .product-card-enhanced .product-image{
      position:relative;
    }

    .product-card-enhanced .product-category-badge{
      position:absolute;
      top:12px;
      right:12px;
      z-index:2;
      max-width:75%;
      padding:6px 9px;
      border-radius:999px;
      background:rgba(20,38,61,.9);
      color:#fff;
      font-size:10px;
      font-weight:800;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .product-card-enhanced .product-image img{
      transition:transform .35s ease;
    }

    .product-card-enhanced:hover .product-image img{
      transform:scale(1.045);
    }

    .product-card-enhanced .product-description{
      display:-webkit-box;
      -webkit-line-clamp:3;
      -webkit-box-orient:vertical;
      overflow:hidden;
    }

    .product-actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
      margin-top:14px;
    }

    .product-details-btn,
    .product-whatsapp-btn{
      min-height:43px;
      border-radius:11px;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      border:0;
      cursor:pointer;
      font-family:inherit;
      font-size:11px;
      font-weight:800;
      text-decoration:none;
      transition:transform .18s ease,opacity .18s ease;
    }

    .product-details-btn{
      background:#edf2f7;
      color:#14263d;
    }

    .product-whatsapp-btn{
      background:#14263d;
      color:#fff !important;
    }

    .product-details-btn:hover,
    .product-whatsapp-btn:hover{
      transform:translateY(-2px);
      opacity:.92;
    }

    @keyframes aboProductModalIn{
      from{
        opacity:0;
        transform:translateY(15px) scale(.98);
      }
      to{
        opacity:1;
        transform:translateY(0) scale(1);
      }
    }

    @media(max-width:700px){

      .product-details-modal{
        padding:10px;
      }

      .product-details-dialog{
        max-height:94vh;
        border-radius:19px;
      }

      .product-details-content{
        grid-template-columns:1fr;
      }

      .product-details-image{
        min-height:260px;
        max-height:320px;
      }

      .product-details-image img{
        min-height:260px;
        max-height:320px;
      }

      .product-details-info{
        padding:28px 20px 22px;
      }

      .product-details-info h2{
        font-size:22px;
      }

      .product-actions{
        grid-template-columns:1fr;
      }
    }
  `;


  document.head.appendChild(
    style
  );
}


function openProductModal(
  product
) {

  ensureProductModal();


  var modal =
    document.getElementById(
      "productDetailsModal"
    );


  var content =
    document.getElementById(
      "productDetailsContent"
    );


  if (
    !modal ||
    !content ||
    !product
  ) {
    return;
  }


  var name =
    String(
      product.name ||
      "صنف بدون اسم"
    ).trim();


  var category =
    String(
      product.category ||
      "عام"
    ).trim();


  var description =
    String(
      product.description ||
      "تشكيلة مميزة من منتجات أبو طارق للأدوات المنزلية."
    ).trim();


  var image =
    String(
      product.image ||
      ""
    ).trim();


  var whatsapp =
    getWhatsAppLink(
      product
    );


  var imageHTML;


  if (image) {

    imageHTML =
      '<img src="' +
      esc(image) +
      '" ' +
      'alt="' +
      esc(name) +
      '" ' +
      'loading="eager" ' +
      'decoding="async" ' +
      'onerror="' +
      "this.style.display='none';" +
      "this.parentElement.innerHTML='<div style=&quot;height:100%;min-height:430px;display:grid;place-items:center;font-size:50px;&quot;>🛍️</div>';" +
      '">';

  } else {

    imageHTML =
      '<div style="' +
      'height:100%;' +
      'min-height:430px;' +
      'display:grid;' +
      'place-items:center;' +
      'font-size:50px;' +
      '">' +
      "🛍️" +
      "</div>";
  }


  content.innerHTML =

    '<div class="product-details-content">' +

      '<div class="product-details-image">' +
        imageHTML +
      "</div>" +

      '<div class="product-details-info">' +

        '<span class="product-details-category">' +
          esc(category) +
        "</span>" +

        '<h2 id="productDetailsTitle">' +
          esc(name) +
        "</h2>" +

        "<p>" +
          esc(description) +
        "</p>" +

        '<div class="product-details-actions">' +

          '<a class="product-details-wa" ' +
            'href="' +
            whatsapp +
            '" ' +
            'target="_blank" ' +
            'rel="noopener noreferrer">' +

            "💬 اسأل عن الصنف" +

          "</a>" +

          '<button type="button" ' +
            'class="product-details-close-bottom">' +

            "إغلاق" +

          "</button>" +

        "</div>" +

      "</div>" +

    "</div>";


  var bottomClose =
    content.querySelector(
      ".product-details-close-bottom"
    );


  if (bottomClose) {

    bottomClose.addEventListener(
      "click",
      closeProductModal
    );
  }


  modal.hidden =
    false;


  document.body.style.overflow =
    "hidden";
}


function closeProductModal() {

  var modal =
    document.getElementById(
      "productDetailsModal"
    );


  if (!modal) {
    return;
  }


  modal.hidden =
    true;


  document.body.style.overflow =
    "";
}


/* =========================
   PRODUCTS
========================= */

function renderProducts() {

  var element =
    document.getElementById(
      "productsGrid"
    );


  if (!element) {
    return;
  }


  var list =
    getFilteredProducts();


  if (!list.length) {

    element.innerHTML =
      '<div class="empty">' +
      '<div class="empty-icon">🛍️</div>' +
      '<h3>مفيش أصناف مطابقة</h3>' +
      '<p>جرب كلمة بحث مختلفة أو اختار قسم تاني.</p>' +
      "</div>";

    return;
  }


  var html =
    new Array(
      list.length + 1
    ).join("");


  list.forEach(
    function (product) {

      var originalIndex =
        products.indexOf(
          product
        );


      var name =
        String(
          product.name ||
          "صنف بدون اسم"
        ).trim();


      var category =
        String(
          product.category ||
          "عام"
        ).trim();


      var description =
        String(
          product.description ||
          "تشكيلة مميزة من منتجات أبو طارق"
        ).trim();


      var image =
        String(
          product.image ||
          ""
        ).trim();


      var whatsappLink =
        getWhatsAppLink(
          product
        );


      var imageHTML;


      if (image) {

        imageHTML =

          '<div class="product-image">' +

            '<span class="product-category-badge">' +
              esc(category) +
            "</span>" +

            '<img src="' +
              esc(image) +
              '" ' +
              'alt="' +
              esc(name) +
              '" ' +
              'loading="lazy" ' +
              'decoding="async" ' +
              'fetchpriority="low" ' +

              'onerror="' +
                "this.style.display='none';" +
                "this.nextElementSibling.style.display='grid';" +
              '">' +

            '<div class="product-placeholder" ' +
              'style="display:none;">' +

              '<span class="placeholder-icon">🛍️</span>' +

              "<span>صورة الصنف</span>" +

            "</div>" +

          "</div>";

      } else {

        imageHTML =

          '<div class="product-image">' +

            '<span class="product-category-badge">' +
              esc(category) +
            "</span>" +

            '<div class="product-placeholder">' +

              '<span class="placeholder-icon">🛍️</span>' +

              "<span>صورة الصنف</span>" +

            "</div>" +

          "</div>";
      }


      html +=

        '<article class="product product-card-enhanced" ' +
          'data-product-index="' +
          originalIndex +
          '">' +

          imageHTML +

          '<div class="product-body">' +

            '<div class="product-category">' +
              esc(category) +
            "</div>" +

            "<h3>" +
              esc(name) +
            "</h3>" +

            '<p class="product-description">' +
              esc(description) +
            "</p>" +

            '<div class="product-actions">' +

              '<button type="button" ' +
                'class="product-details-btn" ' +
                'data-product-details="' +
                originalIndex +
                '">' +

                "👀 عرض التفاصيل" +

              "</button>" +

              '<a class="product-whatsapp-btn" ' +
                'href="' +
                whatsappLink +
                '" ' +
                'target="_blank" ' +
                'rel="noopener noreferrer">' +

                "💬 واتساب" +

              "</a>" +

            "</div>" +

          "</div>" +

        "</article>";
    }
  );


  element.innerHTML =
    html;


  setupProductCardButtons();
}


function setupProductCardButtons() {

  var buttons =
    document.querySelectorAll(
      "[data-product-details]"
    );


  for (
    var i = 0;
    i < buttons.length;
    i++
  ) {

    buttons[i].addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        event.stopPropagation();


        var index =
          Number(
            this.getAttribute(
              "data-product-details"
            )
          );


        var product =
          products[index];


        if (product) {

          openProductModal(
            product
          );
        }
      }
    );
  }
}


/* =========================
   CATEGORY SELECT
========================= */

function selectCategory(
  category,
  shouldScroll
) {

  if (
    typeof shouldScroll ===
    "undefined"
  ) {

    shouldScroll =
      true;
  }


  currentCategory =
    category;


  renderFilters();
  renderProducts();


  if (shouldScroll) {

    var productsSection =
      document.getElementById(
        "products"
      );


    if (productsSection) {

      productsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }
}


/* =========================
   CLOSE SEARCH OUTSIDE
========================= */

document.addEventListener(
  "click",
  function (event) {

    var searchArea =
      document.getElementById(
        "productSearchArea"
      );


    if (
      searchArea &&
      !searchArea.contains(
        event.target
      )
    ) {

      hideSearchSuggestions();
    }
  }
);


/* =========================
   START STORE
========================= */

function loadStore() {

  console.log(
    "⚡ app.js بدأ تشغيل المتجر"
  );


  /*
   * تجهيز المودال بدون انتظار البيانات.
   */

  ensureProductModal();


  /*
   * تشغيل تحميل المنتجات والأقسام
   * بالتوازي.
   */

  var productsPromise =
    loadProducts();


  var sectionsPromise =
    loadSections();


  Promise.all([
    productsPromise,
    sectionsPromise
  ])

    .then(
      function (results) {

        var productsOK =
          results[0];

        var sectionsOK =
          results[1];


        if (
          !sectionsOK ||
          !categories.length
        ) {

          buildCategoriesFallback();
        }


        addProductCategoriesToList();


        /*
         * رسم نهائي واحد.
         */

        renderCategories();
        renderFilters();
        renderProducts();
        setupProductSearch();


        console.log(
          "🚀 المتجر جاهز - المنتجات:",
          products.length
        );


        if (!productsOK) {

          console.warn(
            "لم يتم تحميل المنتجات."
          );
        }
      }
    )

    .catch(
      function (error) {

        console.error(
          "خطأ عام في تحميل المتجر:",
          error
        );


        if (
          !categories.length
        ) {

          buildCategoriesFallback();
        }


        addProductCategoriesToList();


        renderCategories();
        renderFilters();
        renderProducts();
        setupProductSearch();
      }
    );
}


/* =========================
   DOM READY
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "app.js تم تشغيله بنجاح"
    );


    loadStore();
  }
);
