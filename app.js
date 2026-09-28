```javascript
var DATA_URL = "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHTHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

var WHATSAPP_NUMBER = "201551604163";

var products = [];
var categories = [];
var currentCategory = "الكل";
var searchText = "";


/* =========================
   حماية النصوص
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


/* =========================
   حالة المنتج
========================= */

function isActive(value) {
  return String(value).toLowerCase() !== "false";
}


/* =========================
   واتساب
========================= */

function getWhatsAppLink(product) {

  var productName =
    String(product.name || "الصنف").trim();

  var message =
    "السلام عليكم،\n" +
    "أرغب في الاستفسار عن:\n" +
    "🛍️ " + productName + "\n" +
    "هل الصنف متاح؟";

  return (
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message)
  );
}


/* =========================
   تحميل المنتجات
========================= */

function loadProducts() {

  return fetch(
    DATA_URL + "?t=" + new Date().getTime(),
    {
      method: "GET",
      cache: "no-store"
    }
  )
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
        "بيانات المنتجات:",
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

      products = data.products.filter(
        function (product) {
          return isActive(product.active);
        }
      );

      return true;
    })

    .catch(function (error) {

      console.error(
        "تعذر تحميل المنتجات:",
        error
      );

      products = [];

      return false;
    });
}


/* =========================
   تحميل الأقسام
========================= */

function loadSections() {

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
      cache: "no-store"
    }
  )

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

        categories = data.sections

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
   أقسام من المنتجات
========================= */

function buildCategoriesFallback() {

  var list = [];

  products.forEach(
    function (product) {

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

    }
  );

  categories = list;
}


/* =========================
   عرض الأقسام
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
      '</div>';

    return;
  }

  var html = "";

  categories.forEach(
    function (category) {

      html +=
        '<button ' +
          'type="button" ' +
          'class="cat" ' +
          'data-category="' +
            esc(category) +
          '">' +

          '<span class="cat-icon">🛍️</span>' +
          '<span>' +
            esc(category) +
          '</span>' +

        '</button>';
    }
  );

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
   فلاتر المنتجات
========================= */

function renderFilters() {

  var element =
    document.getElementById(
      "filters"
    );

  if (!element) {
    return;
  }

  var filters = [
    "الكل"
  ];

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
        '<button ' +
          'type="button" ' +
          'class="filter ' +
            active +
          '" ' +
          'data-category="' +
            esc(category) +
          '">' +

          esc(category) +

        '</button>';
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
   البحث
========================= */

function setupSearch() {

  var searchInput =
    document.getElementById(
      "productSearch"
    );

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener(
    "input",
    function () {

      searchText =
        String(
          searchInput.value || ""
        )
        .trim()
        .toLowerCase();

      renderProducts();
    }
  );
}


/* =========================
   فلترة المنتجات
========================= */

function getFilteredProducts() {

  var list = products.slice();

  if (
    currentCategory !== "الكل"
  ) {

    list = list.filter(
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

  if (searchText) {

    list = list.filter(
      function (product) {

        var text =
          String(
            product.name || ""
          ) + " " +

          String(
            product.category || ""
          ) + " " +

          String(
            product.description || ""
          );

        return text
          .toLowerCase()
          .indexOf(searchText) !== -1;
      }
    );
  }

  return list;
}


/* =========================
   عرض المنتجات
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
        '<div class="empty-icon">🔎</div>' +
        '<h3>مفيش أصناف مطابقة</h3>' +
        '<p>' +
          'جرّب كلمة بحث تانية أو اختار قسم مختلف.' +
        '</p>' +
      '</div>';

    return;
  }

  var html = "";

  list.forEach(
    function (product) {

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
          product.image || ""
        ).trim();

      var whatsappLink =
        getWhatsAppLink(product);

      var imageHTML = "";

      if (image) {

        imageHTML =
          '<div class="product-image">' +

            '<img ' +
              'src="' +
                esc(image) +
              '" ' +
              'alt="' +
                esc(name) +
              '" ' +
              'loading="lazy" ' +
              'onerror="' +
                "this.style.display='none';" +
                "this.nextElementSibling.style.display='grid';" +
              '">' +

            '<div ' +
              'class="product-placeholder" ' +
              'style="display:none;">' +

              '<span class="placeholder-icon">' +
                '🛍️' +
              '</span>' +

              '<span>' +
                'صورة الصنف' +
              '</span>' +

            '</div>' +

          '</div>';

      } else {

        imageHTML =
          '<div class="product-image">' +

            '<div class="product-placeholder">' +

              '<span class="placeholder-icon">' +
                '🛍️' +
              '</span>' +

              '<span>' +
                'صورة الصنف' +
              '</span>' +

            '</div>' +

          '</div>';
      }

      html +=

        '<article class="product">' +

          imageHTML +

          '<div class="product-body">' +

            '<div class="product-category">' +
              esc(category) +
            '</div>' +

            '<h3>' +
              esc(name) +
            '</h3>' +

            '<p>' +
              esc(description) +
            '</p>' +

            '<div class="product-footer">' +

              '<a ' +
                'class="product-whatsapp" ' +
                'href="' +
                  whatsappLink +
                '" ' +
                'target="_blank" ' +
                'rel="noopener noreferrer">' +

                '<span>💬</span>' +
                '<span>اسأل على واتساب</span>' +

              '</a>' +

            '</div>' +

          '</div>' +

        '</article>';
    }
  );

  element.innerHTML = html;
}


/* =========================
   اختيار القسم
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
   تحميل المتجر
========================= */

function loadStore() {

  console.log(
    "app.js اشتغل - بدء تحميل المتجر"
  );

  loadProducts()

    .then(function (productsLoaded) {

      return loadSections()
        .then(function (sectionsLoaded) {

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
                  product.category || ""
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

          console.log(
            "عدد المنتجات:",
            products.length
          );

          if (!productsLoaded) {

            console.warn(
              "فشل تحميل المنتجات."
            );
          }

        });

    })

    .catch(function (error) {

      console.error(
        "خطأ عام في تحميل المتجر:",
        error
      );

      renderCategories();
      renderFilters();
      renderProducts();
    });
}


/* =========================
   بداية الموقع
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "app.js تم تشغيله بنجاح"
    );

    setupSearch();
    loadStore();

  }
);
```
