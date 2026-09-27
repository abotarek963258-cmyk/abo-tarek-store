const DATA_URL = "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

const WHATSAPP_NUMBER = "201551604163";

const demoProducts = [
  {
    name: "أدوات السفرة",
    category: "السفرة",
    image: "",
    description: "تشكيلة متنوعة للاستخدام اليومي"
  },
  {
    name: "طقم شاي وقهوة",
    category: "الشاي والقهوة",
    image: "",
    description: "أصناف متنوعة للشاي والقهوة"
  },
  {
    name: "أكواب وكاسات",
    category: "الأكواب والكاسات",
    image: "",
    description: "مقاسات وأشكال مختلفة"
  },
  {
    name: "أدوات المطبخ",
    category: "المطبخ",
    image: "",
    description: "مستلزمات المطبخ اليومية"
  },
  {
    name: "أواني طهي",
    category: "أواني الطهي",
    image: "",
    description: "أواني للاستخدام المنزلي"
  },
  {
    name: "ميلامين",
    category: "الميلامين",
    image: "",
    description: "أطباق وأطقم متنوعة"
  }
];

const defaultCategories = [
  "السفرة",
  "الشاي والقهوة",
  "الأكواب والكاسات",
  "المطبخ",
  "أواني الطهي",
  "الميلامين"
];

let products = [];
let categories = [];
let current = "الكل";


/* =========================
   حماية النصوص
========================= */

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}


/* =========================
   رابط واتساب للمنتج
========================= */

function getWhatsAppLink(product) {

  const productName = String(product.name || "الصنف").trim();

  const message =
    `السلام عليكم،\n` +
    `أرغب في الاستفسار عن:\n` +
    `🛍️ ${productName}\n` +
    `هل الصنف متاح؟`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}


/* =========================
   الأقسام
========================= */

function buildCategories() {

  const fromProducts = products
    .map(p => String(p.category || "").trim())
    .filter(Boolean);

  categories = [
    ...new Set([
      ...defaultCategories,
      ...fromProducts
    ])
  ];
}


function renderCategories() {

  const el = document.getElementById("categoryGrid");

  if (!el) return;

  el.innerHTML = categories.map(c => `
    <button
      type="button"
      class="cat"
      onclick="selectCategory('${esc(c)}')"
    >
      <span class="cat-icon">🛍️</span>
      <span>${esc(c)}</span>
    </button>
  `).join("");
}


function renderFilters() {

  const el = document.getElementById("filters");

  if (!el) return;

  el.innerHTML =
    ["الكل", ...categories].map(c => `
      <button
        type="button"
        class="filter ${current === c ? "active" : ""}"
        onclick="selectCategory('${esc(c)}')"
      >
        ${esc(c)}
      </button>
    `).join("");
}


/* =========================
   كروت المنتجات
========================= */

function renderProducts() {

  const el = document.getElementById("productsGrid");

  if (!el) return;

  const list =
    current === "الكل"
      ? products
      : products.filter(
          p => String(p.category || "") === current
        );

  if (!list.length) {

    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🛍️</div>
        <h3>مفيش أصناف هنا حاليًا</h3>
        <p>هنضيف أصناف جديدة قريبًا.</p>
      </div>
    `;

    return;
  }


  el.innerHTML = list.map(p => {

    const name = String(p.name || "صنف بدون اسم");
    const category = String(p.category || "عام");
    const description = String(
      p.description || "تشكيلة مميزة من منتجات أبو طارق"
    );

    const whatsappLink = getWhatsAppLink(p);


    const imageHTML = p.image
      ? `
        <div class="product-image">
          <img
            src="${esc(p.image)}"
            alt="${esc(name)}"
            loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=&quot;product-placeholder&quot;>🛍️<span>صورة الصنف</span></div>'"
          >
        </div>
      `
      : `
        <div class="product-image">
          <div class="product-placeholder">
            <span class="placeholder-icon">🛍️</span>
            <span>صورة الصنف</span>
          </div>
        </div>
      `;


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
              <span>اطلب على واتساب</span>
            </a>

          </div>

        </div>

      </article>
    `;

  }).join("");
}


/* =========================
   اختيار القسم
========================= */

function selectCategory(c) {

  current = c;

  renderFilters();
  renderProducts();

  const productsSection = document.getElementById("products");

  if (productsSection) {

    productsSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
}


/* =========================
   تحميل البيانات
========================= */

async function load() {

  // نبدأ بالأصناف التجريبية مؤقتًا
  products = demoProducts;

  try {

    const r = await fetch(DATA_URL, {
      cache: "no-store"
    });

    if (!r.ok) {
      throw new Error("HTTP " + r.status);
    }

    const data = await r.json();

    if (Array.isArray(data)) {

      products = data.filter(
        p => p.active !== false
      );

    } else {

      throw new Error("Invalid data");

    }

  } catch (e) {

    console.warn(
      "تعذر تحميل البيانات، سيتم عرض الأصناف التجريبية.",
      e
    );

  }

  buildCategories();
  renderCategories();
  renderFilters();
  renderProducts();
}


/* =========================
   تشغيل الموقع
========================= */

load();
