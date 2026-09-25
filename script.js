const products = [
 {name:"طقم عشاء",cat:"سفرة",icon:"🍽️",desc:"طقم سفرة مناسب للاستخدام المنزلي والتقديم."},
 {name:"طقم شاي وقهوة",cat:"شاي وقهوة",icon:"☕",desc:"تشكيلة من أطقم الشاي والقهوة."},
 {name:"أكواب قهوة",cat:"أكواب وكاسات",icon:"☕",desc:"أكواب مناسبة للمشروبات الساخنة."},
 {name:"كاسات جيلي",cat:"أكواب وكاسات",icon:"🥛",desc:"كاسات جيلي بتصميمات متنوعة."},
 {name:"طقم جيلي بالأندلس",cat:"أكواب وكاسات",icon:"🍹",desc:"طقم جيلي بالأندلس."},
 {name:"طقم Lamaya",cat:"شاي وقهوة",icon:"🫖",desc:"تشكيلة من أطقم Lamaya."},
 {name:"طقم AKY",cat:"سفرة",icon:"🍽️",desc:"تشكيلة من أطقم AKY."},
 {name:"طقم 62 قطعة",cat:"ميلامين",icon:"🟩",desc:"طقم سفرة 62 قطعة."},
 {name:"منتجات Arcopal",cat:"سفرة",icon:"🍽️",desc:"اختيارات من منتجات Arcopal."},
 {name:"أدوات مطبخ",cat:"مطبخ",icon:"🍳",desc:"أدوات متنوعة للاستخدام اليومي في المطبخ."},
 {name:"أواني طهي",cat:"أواني طهي",icon:"🥘",desc:"أواني وأدوات للطهي والاستخدام المنزلي."},
 {name:"مستلزمات المنزل",cat:"مطبخ",icon:"🏠",desc:"منتجات متنوعة من مستلزمات البيت."}
];

const grid=document.getElementById("productGrid"), empty=document.getElementById("empty"), search=document.getElementById("search");
let active="الكل";

function render(){
  const q=search.value.trim().toLowerCase();
  const list=products.filter(p=>(active==="الكل"||p.cat===active)&&(!q||(p.name+" "+p.cat+" "+p.desc).toLowerCase().includes(q)));
  grid.innerHTML=list.map((p,i)=>`
    <article class="product-card" data-index="${products.indexOf(p)}">
      <div class="product-image">${p.icon}</div>
      <div class="product-body"><span class="tag">${p.cat}</span><h3>${p.name}</h3><p>${p.desc}</p></div>
    </article>`).join("");
  empty.style.display=list.length?"none":"block";
}
render();

document.getElementById("filters").addEventListener("click",e=>{
 const b=e.target.closest("button"); if(!b)return;
 active=b.dataset.filter;
 document.querySelectorAll("#filters button").forEach(x=>x.classList.toggle("active",x===b));
 render();
});
document.querySelectorAll(".category-card").forEach(b=>b.addEventListener("click",()=>{
 active=b.dataset.filter;
 document.querySelectorAll("#filters button").forEach(x=>x.classList.toggle("active",x.dataset.filter===active));
 document.getElementById("products").scrollIntoView({behavior:"smooth"});
 render();
}));
search.addEventListener("input",render);

const modal=document.getElementById("modal");
function openModal(p){
 document.getElementById("modalIcon").textContent=p.icon;
 document.getElementById("modalCategory").textContent=p.cat;
 document.getElementById("modalTitle").textContent=p.name;
 document.getElementById("modalDesc").textContent=p.desc;
 modal.classList.add("show"); modal.setAttribute("aria-hidden","false");
}
grid.addEventListener("click",e=>{const card=e.target.closest(".product-card");if(card)openModal(products[+card.dataset.index]);});
function closeModal(){modal.classList.remove("show");modal.setAttribute("aria-hidden","true")}
document.getElementById("modalClose").addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
document.getElementById("modalContact").addEventListener("click",closeModal);

const menuBtn=document.getElementById("menuBtn"), nav=document.getElementById("navLinks");
menuBtn.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
