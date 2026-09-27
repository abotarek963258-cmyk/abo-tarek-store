const DATA_URL = "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

const WHATSAPP_NUMBER = "201551604163";

let products = [];
let categories = [];
let currentCategory = "الكل";


/* =========================
   حماية النصوص
========================= */

function esc(value) {
  return String(value ?? "").replace(
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
   التحقق من حالة المنتج
========================= */

function isActive(value) {
  return String(value).toLowerCase() !== "false";
}


/* =========================
   رابط واتساب للمنتج
========================= */

function getWhatsAppLink(product) {

  const productName =
    String(product.name || "الصنف").trim();

  const message =
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
   تحميل الأقسام
========================= */

async function loadSections() {

  try {

    const response = await fetch(DATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        key: "123456",
        action: "listSections"
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        "HTTP " + response.status
      );
    }

    const data = await response.json();

    if (
      data &&
      data.ok === true &&
      Array.isArray(data.sections)
    ) {

      categories = data.sections
        .filter(function (section) {
          return (
            isActive(section.active) &&
            String(section.name || "").trim()
          );
        })
        .sort(function (a, b) {

          const orderA =
            Number(a.sortOrder) || 999999;

          const orderB =
            Number(b.sortOrder) || 999999;

          return orderA - orderB;
        })
        .map(function (section) {
          return String(section.name).trim();
        });

      return true;
    }

  } catch (error) {

    console.warn(
      "تعذر تحميل الأقسام:",
      error
    );
  }

  return false;
}


/* =========================
   تحميل المنتجات
========================= */

async function loadProducts() {

  try {

    const response = await fetch(DATA_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        "HTTP " + response.status
      );
    }

    const data = await response.json();

    /*
      doGet الحالي يرجع:
      {
        ok: true,
        products: [...]
      }
    */

    if (
      data &&
      data.ok === true &&
      Array.isArray(data.products)
    ) {

      products = data.products.filter(
        function (product) {
          return isActive(product.active);
        }
      );

      return true;
    }

    throw new Error(
      "استجابة غير صحيحة من السيرفر"
    );

  } catch (error) {

    console.error(
      "تعذر تحميل المنتجات:",
      error
    );

    products = [];

    return false;
  }
}


/* =========================
   التأكد من الأقسام
========================= */

function buildCategoriesFallback() {

  const fromProducts = products
    .map(function (product) {
      return String(
        product.category || ""
      ).trim();
    })
    .filter(Boolean);

  categories = [
    ...new Set(fromProducts)
  ];
}


/* =========================
   عرض الأقسام
========================= */

function renderCategories() {

  const element =
    document.getElementById("categoryGrid");

  if (!element) {
    return;
  }

  if (!categories.length) {

    element.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🛍️</div>
        <h3>مفيش أقسام متاحة حاليًا</h3>
        <p>هنضيف الأقسام قريبًا.</p>
      </div>
    `;

    return;
  }

  element.innerHTML = categories
    .map(function (category) {

      return `
        <button
          type="button"
          class="cat"
          data-category="${esc(category)}"
        >
          <span class="cat-icon">🛍️</span>
          <span>${esc(category)}</span>
        </button>
      `;

    })
    .join("");

  element
    .querySelectorAll(".cat")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          selectCategory(
            button.dataset.category
          );

        }
      );

    });
}


/* =========================
   فلاتر المنتجات
========================= */

function renderFilters() {

  const element =
    document.getElementById("filters");

  if (!element) {
    return;
  }

  const filters = [
    "الكل",
    ...categories
  ];

  element.innerHTML = filters
    .map(function (category) {

      return `
        <button
          type="button"
          class="filter ${
            currentCategory === category
              ? "active"
              : ""
          }"
          data-category="${esc(category)}"
        >
          ${esc(category)}
        </button>
      `;

    })
    .join("");

  element
    .querySelectorAll(".filter")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          selectCategory(
            button.dataset.category,
            false
          );

        }
      );

    });
}


/* =========================
   عرض المنتجات
========================= */

function renderProducts() {

  const element =
    document.getElementById("productsGrid");

  if (!element) {
    return;
  }

  let list = products;

  if (currentCategory !== "الكل") {

    list = products.filter(
      function (product) {

        return (
          String(
            product.category || ""
          ).trim() === currentCategory
        );

      }
    );
  }

  if (!list.length) {

    element.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🛍️</div>
        <h3>مفيش أصناف هنا حاليًا</h3>
        <p>
          جرّب قسم تاني أو تابعنا لمعرفة الأصناف الجديدة.
        </p>
      </div>
    `;

    return;
  }


  element.innerHTML = list
    .map(function (product) {

      const name =
        String(
          product.name ||
          "صنف بدون اسم"
        ).trim();

      const category =
        String(
          product.category ||
          "عام"
        ).trim();

      const description =
        String(
          product.description ||
          "تشكيلة مميزة من منتجات أبو طارق"
        ).trim();

      const image =
        String(
          product.image || ""
        ).trim();

      const whatsappLink =
        getWhatsAppLink(product);


      let imageHTML;


      if (image) {

        imageHTML = `
          <div class="product-image">

            <img
              src="${esc(image)}"
              alt="${esc(name)}"
              loading="lazy"
              onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"
            >

            <div
              class="product-placeholder"
              style="display:none;"
            >
              <span class="placeholder-icon">
                🛍️
              </span>

              <span>
                صورة الصنف
              </span>
            </div>

          </div>
        `;

      } else {

        imageHTML = `
          <div class="product-image">

            <div class="product-placeholder">

              <span class="placeholder-icon">
                🛍️
              </span>

              <span>
                صورة الصنف
              </span>

            </div>

          </div>
        `;
      }


      return `
        <article class="product">

          ${imageHTML}

          <div class="product-body">

            <div class="product-category">
              ${esc(category)}
            </div>

            <h3>
              ${esc(name)}
            </h3>

            <p>
              ${esc(description)}
            </p>

            <div class="product-footer">

              <a
                class="product-whatsapp"
                href="${whatsappLink}"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>💬</span>
                <span>اسأل على واتساب</span>
              </a>

            </div>

          </div>

        </article>
      `;

    })
    .join("");
}


/* =========================
   اختيار القسم
========================= */

function selectCategory(
  category,
  shouldScroll = true
) {

  currentCategory = category;

  renderFilters();
  renderProducts();


  if (shouldScroll) {

    const productsSection =
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
   تحميل كل البيانات
========================= */

async function loadStore() {

  const productsLoaded =
    await loadProducts();

  const sectionsLoaded =
    await loadSections();


  /*
    لو الأقسام فشلت لأي سبب،
    نستخرجها من المنتجات.
  */

  if (
    !sectionsLoaded ||
    !categories.length
  ) {

    buildCategoriesFallback();
  }


  /*
    لو المنتجات اتحملت بنجاح
    لكن فيها قسم مش موجود في
    Sections، نضيفه مؤقتًا للعرض.
  */

  const productCategories =
    products
      .map(function (product) {
        return String(
          product.category || ""
        ).trim();
      })
      .filter(Boolean);


  categories = [
    ...new Set([
      ...categories,
      ...productCategories
    ])
  ];


  renderCategories();
  renderFilters();
  renderProducts();


  if (!productsLoaded) {

    console.warn(
      "الموقع لم يتمكن من تحميل المنتجات من Google Apps Script."
    );
  }
}


/* =========================
   بداية الموقع
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    loadStore();

  }
);
