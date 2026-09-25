```javascript
const DATA_URL = "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

const demoProducts = [
  {name:"أدوات السفرة",category:"السفرة",image:"",description:"تشكيلة متنوعة للاستخدام اليومي"},
  {name:"طقم شاي وقهوة",category:"الشاي والقهوة",image:"",description:"أصناف متنوعة للشاي والقهوة"},
  {name:"أكواب وكاسات",category:"الأكواب والكاسات",image:"",description:"مقاسات وأشكال مختلفة"},
  {name:"أدوات المطبخ",category:"المطبخ",image:"",description:"مستلزمات المطبخ اليومية"},
  {name:"أواني طهي",category:"أواني الطهي",image:"",description:"أواني للاستخدام المنزلي"},
  {name:"ميلامين",category:"الميلامين",image:"",description:"أطباق وأطقم متنوعة"}
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


function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[m])
  );
}


function buildCategories() {

  const fromProducts = products
    .map(p => String(p.category || "").trim())
    .filter(Boolean);

  categories = [...new Set([
    ...defaultCategories,
    ...fromProducts
  ])];
}


function renderCategories() {

  document.getElementById("categoryGrid").innerHTML =
    categories.map(c => `
      <div class="cat" onclick="selectCategory('${esc(c)}')">
        ${esc(c)}
      </div>
    `).join("");
}


function renderFilters() {

  document.getElementById("filters").innerHTML =
    ["الكل", ...categories].map(c => `
      <button
        class="filter ${current === c ? "active" : ""}"
        onclick="selectCategory('${esc(c)}')">
        ${esc(c)}
      </button>
    `).join("");
}


function renderProducts() {

  const el = document.getElementById("productsGrid");

  const list =
    current === "الكل"
      ? products
      : products.filter(p => String(p.category || "") === current);


  if (!list.length) {

    el.innerHTML =
      '<div class="empty">مفيش أصناف مضافة للقسم ده حاليًا.</div>';

    return;
  }


  el.innerHTML = list.map(p => `

    <article class="product">

      ${
        p.image
          ? `<img
              src="${esc(p.image)}"
              alt="${esc(p.name)}"
              loading="lazy"
            >`
          : `<div class="product-placeholder">صورة الصنف</div>`
      }

      <div class="product-body">

        <h3>${esc(p.name)}</h3>

        <p>${esc(p.description || "")}</p>

      </div>

    </article>

  `).join("");
}


function selectCategory(c) {

  current = c;

  renderFilters();
  renderProducts();

  document
    .getElementById("products")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}


async function load() {

  // نبدأ بالأصناف التجريبية مؤقتًا
  products = demoProducts;

  try {

    const r = await fetch(DATA_URL, {
      cache: "no-store"
    });
```
