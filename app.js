var DATA_URL = "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

var WHATSAPP_NUMBER = "201551604163";

var products = [];
var categories = [];
var currentCategory = "الكل";
var searchQuery = "";

var PRODUCTS_CACHE_KEY = "abo_tarek_products_cache_v1";
var SECTIONS_CACHE_KEY = "abo_tarek_sections_cache_v1";

var CACHE_TIME = 5 * 60 * 1000;


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
  var search = normalizeSearchText(query);

  if (!search) {
    return true;
  }

  var name = normalizeSearchText(product.name);
  var category = normalizeSearchText(product.category);
  var description = normalizeSearchText(product.description);

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
  var productName = String(product.name || "الصنف").trim();

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
    var raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    var data = JSON.parse(raw);

    if (
      !data ||
      !data.time ||
      !Array.isArray(data.value)
    ) {
      return null;
    }

    if (Date.now() - data.time > CACHE_TIME) {
      return null;
    }

    return data.value;

  } catch (error) {
    console.warn("تعذر قراءة الكاش:", error);
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
    console.warn("تعذر حفظ الكاش:", error);
  }
}


/* =========================
   LOAD PRODUCTS
========================= */

function loadProducts() {
  var cachedProducts = getCache(PRODUCTS_CACHE_KEY);

  if (cachedProducts) {

    products = cachedProducts.filter(function (product) {
      return isActive(product.active);
    });

    console.log(
      "تم تحميل المنتجات من الكاش:",
      products.length
    );

    fetchProductsFromServer();

    return Promise.resolve(true);
  }

  return fetchProductsFromServer();
}


function fetchProductsFromServer() {
  return fetch(DATA_URL, {
    method: "GET",
    cache: "default"
  })

    .then(function (response) {

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      return response.json();
    })

    .then(function (data) {

      console.log(
        "بيانات المنتجات من السيرفر:",
        data
      );

      if (
        !data ||
        data.ok !== true ||
        !Array.isArray(data.products)
      ) {
        throw new Error(
          "استجابة المنتجات غير صحيحة"
        );
      }

      setCache(
        PRODUCTS_CACHE_KEY,
        data.products
      );

      products = data.products.filter(
        function (product) {
          return isActive(product.active);
        }
      );

      renderCategories();
      renderFilters();
      renderProducts();
      setupProductSearch();

      console.log(
        "تم تحديث المنتجات من السيرفر:",
        products.length
      );

      return true;
    })

    .catch(function (error) {

      console.error(
        "تعذر تحميل المنتجات:",
        error
      );

      var oldCache = null;

      try {

        var raw =
          localStorage.getItem(
            PRODUCTS_CACHE_KEY
          );

        if (raw) {

          var parsed =
            JSON.parse(raw);

          if (
            parsed &&
            Array.isArray(parsed.value)
          ) {
            oldCache = parsed.value;
          }
        }

      } catch (e) {}

      if (oldCache) {

        products =
          oldCache.filter(
            function (product) {
              return isActive(product.active);
            }
          );

        console.log(
          "تم استخدام نسخة المنتجات المحفوظة."
        );

        renderCategories();
        renderFilters();
        renderProducts();
        setupProductSearch();

        return true;
      }

      products = [];

      return false;
    });
}


/* =========================
   LOAD SECTIONS
========================= */

function loadSections() {

  var cachedSections =
    getCache(SECTIONS_CACHE_KEY);

  if (cachedSections) {

    categories =
      cachedSections

        .filter(function (section) {

          return (
            isActive(section.active) &&
            String(section.name || "").trim()
          );
        })

        .sort(function (a, b) {

          var orderA =
            Number(a.sortOrder) || 999999;

          var orderB =
            Number(b.sortOrder) || 999999;

          return orderA - orderB;
        })

        .map(function (section) {

          return String(
            section.name
          ).trim();
        });

    console.log(
      "تم تحميل الأقسام من الكاش."
    );

    fetchSectionsFromServer();

    return Promise.resolve(true);
  }

  return fetchSectionsFromServer();
}


function fetchSectionsFromServer() {

  return fetch(DATA_URL, {

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
  })

    .then(function (response) {

      if (!response.ok) {
        throw new Error(
          "HTTP " + response.status
        );
      }

      return response.json();
    })

    .then(function (data) {

      console.log(
        "بيانات الأقسام:",
        data
      );

      if (
        data &&
        data.ok === true &&
        Array.isArray(data.sections)
      ) {

        setCache(
          SECTIONS_CACHE_KEY,
          data.sections
        );

        categories =
          data.sections

            .filter(function (section) {

              return (
                isActive(section.active) &&
                String(
                  section.name || ""
                ).trim()
              );
            })

            .sort(function (a, b) {

              var orderA =
                Number(a.sortOrder) ||
                999999;

              var orderB =
                Number(b.sortOrder) ||
                999999;

              return orderA - orderB;
            })

            .map(function (section) {

              return String(
                section.name
              ).trim();
            });

        renderCategories();
        renderFilters();

        return true;
      }

      return false;
    })

    .catch(function (error) {

      console.warn(
        "تعذر تحميل الأقسام:",
        error
      );

      return false;
    });
}


/* =========================
   FALLBACK CATEGORIES
========================= */

function buildCategoriesFallback() {

  var list = [];

  products.forEach(function (product) {

    var category =
      String(
        product.category || ""
      ).trim();

    if (
      category &&
      list.indexOf(category) === -1
    ) {
      list.push(category);
    }
  });

  categories = list;
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

  categories.forEach(function (category) {

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
  });

  element.innerHTML = html;

  var buttons =
    element.querySelectorAll(".cat");

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

  var filters = ["الكل"];

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
        currentCategory === category
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

  element.innerHTML = html;

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
              product.category || ""
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

  return matches.slice(0, 8);
}


function hideSearchSuggestions() {

  var element =
    document.getElementById(
      "searchSuggestions"
    );

  if (!element) {
    return;
  }

  element.innerHTML = "";
  element.hidden = true;
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
        products.indexOf(product);

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

  element.innerHTML = html;
  element.hidden = false;

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
    products[productIndex];

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
        product.name || ""
      ).trim();
  }

  searchQuery =
    String(
      product.name || ""
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
    50
  );
}


/* =========================
   SETUP SEARCH
========================= */

function setupProductSearch() {

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

  if (
    input.getAttribute(
      "data-search-ready"
    ) === "true"
  ) {
    return;
  }

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
        event.key === "Enter"
      ) {

        var suggestions =
          getSearchSuggestions();

        if (suggestions.length) {

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
        event.key === "Escape"
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

        input.value = "";
        searchQuery = "";

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

  var html = "";

  list.forEach(
    function (product) {

      var originalIndex =
        products.indexOf(product);

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

      var imageHTML = "";


      if (image) {

        imageHTML =
          '<div class="product-image">' +

          '<img src="' +
          esc(image) +
          '" ' +
          'alt="' +
          esc(name) +
          '" ' +
          'loading="lazy" ' +
          'decoding="async" ' +

          'onerror="' +
          "this.style.display='none';" +
          "this.nextElementSibling.style.display='grid';" +
          '">' +

          '<div class="product-placeholder" style="display:none;">' +

          '<span class="placeholder-icon">🛍️</span>' +

          "<span>صورة الصنف</span>" +

          "</div>" +

          "</div>";

      } else {

        imageHTML =
          '<div class="product-image">' +

          '<div class="product-placeholder">' +

          '<span class="placeholder-icon">🛍️</span>' +

          "<span>صورة الصنف</span>" +

          "</div>" +

          "</div>";
      }


      html +=

        '<article class="product" ' +
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

        "<p>" +
        esc(description) +
        "</p>" +

        '<div class="product-footer">' +

        '<a class="product-whatsapp" ' +
        'href="' +
        whatsappLink +
        '" ' +
        'target="_blank" ' +
        'rel="noopener noreferrer">' +

        "<span>💬</span>" +
        "<span>اسأل على واتساب</span>" +

        "</a>" +

        "</div>" +

        "</div>" +

        "</article>";
    }
  );

  element.innerHTML = html;
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
    shouldScroll = true;
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
   LOAD STORE
========================= */

function loadStore() {

  console.log(
    "app.js اشتغل - بدء تحميل المتجر"
  );

  var productsPromise =
    loadProducts();

  var sectionsPromise =
    loadSections();


  Promise.all([
    productsPromise,
    sectionsPromise
  ])

    .then(function (results) {

      var productsLoaded =
        results[0];

      var sectionsLoaded =
        results[1];


      if (
        !sectionsLoaded ||
        !categories.length
      ) {

        buildCategoriesFallback();
      }


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


      renderCategories();
      renderFilters();
      renderProducts();
      setupProductSearch();


      console.log(
        "عدد المنتجات:",
        products.length
      );


      if (!productsLoaded) {

        console.warn(
          "فشل تحميل المنتجات."
        );
      }

    })

    .catch(function (error) {

      console.error(
        "خطأ عام في تحميل المتجر:",
        error
      );

      renderCategories();
      renderFilters();
      renderProducts();
      setupProductSearch();
    });
}


/* =========================
   CLOSE SUGGESTIONS OUTSIDE
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
   START
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
