// مصدر البيانات: غيّر هذا الرابط بعد إنشاء Google Apps Script.
// اتركه فارغًا الآن لمشاهدة أصناف تجريبية.
const DATA_URL = "https://script.google.com/macros/s/AKfycbyw7k-K9akpV08vSjXbDmZ8khpHH9LOq2G9WLDHT2-iOJiTThN-kvEaCKI0-wKWu7hY/exec";

const demoProducts = [
  {name:"أدوات السفرة", category:"السفرة", image:"", description:"تشكيلة متنوعة للاستخدام اليومي"},
  {name:"طقم شاي وقهوة", category:"الشاي والقهوة", image:"", description:"أصناف متنوعة للشاي والقهوة"},
  {name:"أكواب وكاسات", category:"الأكواب والكاسات", image:"", description:"مقاسات وأشكال مختلفة"},
  {name:"أدوات المطبخ", category:"المطبخ", image:"", description:"مستلزمات المطبخ اليومية"},
  {name:"أواني طهي", category:"أواني الطهي", image:"", description:"أواني للاستخدام المنزلي"},
  {name:"ميلامين", category:"الميلامين", image:"", description:"أطباق وأطقم متنوعة"}
];

const categories = ["السفرة","الشاي والقهوة","الأكواب والكاسات","المطبخ","أواني الطهي","الميلامين"];
let products = [];
let current = "الكل";

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

function renderCategories(){
  const el=document.getElementById("categoryGrid");
  el.innerHTML=categories.map(c=>`<div class="cat" onclick="selectCategory('${esc(c)}')">${esc(c)}</div>`).join("");
}
function renderFilters(){
  const el=document.getElementById("filters");
  el.innerHTML=["الكل",...categories].map(c=>`<button class="filter ${current===c?"active":""}" onclick="selectCategory('${esc(c)}')">${esc(c)}</button>`).join("");
}
function renderProducts(){
  const el=document.getElementById("productsGrid");
  const list=current==="الكل"?products:products.filter(p=>p.category===current);
  if(!list.length){el.innerHTML='<div class="empty">مفيش أصناف مضافة للقسم ده حاليًا.</div>';return;}
  el.innerHTML=list.map(p=>`
    <article class="product">
      ${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:`<div style="aspect-ratio:1/1;background:#eee;display:grid;place-items:center;color:#999">صورة الصنف</div>`}
      <div class="product-body"><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p></div>
    </article>`).join("");
}
function selectCategory(c){current=c;renderFilters();renderProducts();document.getElementById("products").scrollIntoView({behavior:"smooth"});}

async function load(){
  products=demoProducts;
  if(DATA_URL){
    try{
      const r=await fetch(DATA_URL,{cache:"no-store"});
      const data=await r.json();
      if(Array.isArray(data)) products=data.filter(p=>p.active!==false);
    }catch(e){console.warn("تعذر تحميل البيانات، سيتم عرض الأصناف التجريبية.");}
  }
  renderCategories();renderFilters();renderProducts();
}
load();