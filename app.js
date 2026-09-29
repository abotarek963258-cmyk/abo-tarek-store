/* =========================================================
   ABO TAREK STORE
   PREMIUM MASTER STYLESHEET
   ========================================================= */


/* =========================================================
   01 - ROOT / RESET
   ========================================================= */

:root{
  --navy:#14263d;
  --navy-2:#1b3048;
  --navy-3:#223b55;

  --orange:#e67b20;
  --orange-dark:#cf6915;
  --orange-soft:#fff1e5;

  --green:#148b57;
  --green-dark:#107b4d;
  --green-soft:#eaf8f1;

  --cream:#fbfaf7;
  --cream-2:#f4f1ea;
  --white:#ffffff;

  --text:#18283b;
  --text-soft:#687582;
  --text-muted:#89939c;

  --border:#e8e1d7;
  --border-soft:#eee8df;

  --shadow-sm:0 6px 20px rgba(20,38,61,.055);
  --shadow-md:0 12px 30px rgba(20,38,61,.09);
  --shadow-lg:0 22px 55px rgba(20,38,61,.14);

  --radius-sm:10px;
  --radius-md:15px;
  --radius-lg:20px;
  --radius-xl:26px;

  --container:1160px;
}


*,
*::before,
*::after{
  box-sizing:border-box;
}


html{
  scroll-behavior:smooth;
  scroll-padding-top:90px;
}


body{
  margin:0;
  min-width:320px;
  background:var(--cream);
  color:var(--text);
  font-family:"Cairo",Tahoma,Arial,sans-serif;
  line-height:1.75;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}


body,
button,
input,
textarea,
select{
  font-family:"Cairo",Tahoma,Arial,sans-serif;
}


img{
  max-width:100%;
}


button,
input,
textarea,
select{
  font:inherit;
}


button{
  cursor:pointer;
}


a{
  color:inherit;
}


a,
button{
  -webkit-tap-highlight-color:transparent;
}


::selection{
  background:rgba(230,123,32,.18);
}


.container{
  width:min(var(--container),92%);
  margin-inline:auto;
}


/* =========================================================
   02 - HEADER
   ========================================================= */

.site-header{
  position:sticky;
  top:0;
  z-index:1000;

  background:rgba(251,250,247,.94);

  border-bottom:1px solid rgba(232,225,215,.9);

  box-shadow:
    0 4px 20px rgba(20,38,61,.045);

  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
}


.nav{
  min-height:82px;

  display:flex;
  align-items:center;

  gap:24px;
}


.brand{
  display:block;
  width:150px;
  flex:0 0 auto;

  text-decoration:none;

  transition:
    transform .2s ease,
    opacity .2s ease;
}


.brand:hover{
  transform:translateY(-1px);
  opacity:.96;
}


.brand img{
  display:block;
  width:100%;
  height:auto;
}


.desktop-nav{
  display:flex;
  align-items:center;

  gap:26px;

  margin-inline-start:auto;
}


.desktop-nav a{
  position:relative;

  padding:8px 2px;

  color:#24364b;

  text-decoration:none;

  font-size:14px;
  font-weight:800;

  transition:
    color .2s ease;
}


.desktop-nav a::after{
  content:"";

  position:absolute;

  right:0;
  bottom:0;

  width:0;
  height:2px;

  border-radius:999px;

  background:var(--orange);

  transition:
    width .2s ease;
}


.desktop-nav a:hover{
  color:var(--orange-dark);
}


.desktop-nav a:hover::after{
  width:100%;
}


/* =========================================================
   03 - GENERAL BUTTONS
   ========================================================= */

.primary-btn,
.outline-btn,
.wa-btn{
  display:inline-flex;

  align-items:center;
  justify-content:center;

  gap:8px;

  min-height:46px;

  padding:11px 19px;

  border-radius:13px;

  text-decoration:none;

  font-weight:800;

  line-height:1.25;

  transition:
    transform .2s ease,
    box-shadow .2s ease,
    background .2s ease,
    border-color .2s ease;
}


.primary-btn{
  background:var(--orange);
  color:#fff;

  box-shadow:
    0 8px 22px rgba(230,123,32,.20);
}


.primary-btn:hover{
  background:var(--orange-dark);

  transform:translateY(-2px);

  box-shadow:
    0 13px 28px rgba(230,123,32,.27);
}


.outline-btn{
  color:#fff;

  border:1px solid rgba(255,255,255,.35);

  background:rgba(255,255,255,.055);
}


.outline-btn:hover{
  background:rgba(255,255,255,.12);

  transform:translateY(-2px);
}


.wa-btn{
  background:var(--green);
  color:#fff;

  box-shadow:
    0 7px 18px rgba(20,139,87,.15);
}


.wa-btn:hover{
  background:var(--green-dark);

  transform:translateY(-2px);

  box-shadow:
    0 11px 24px rgba(20,139,87,.22);
}


.header-wa{
  flex:0 0 auto;
  white-space:nowrap;
}


.wa-btn.large{
  width:100%;
  min-height:50px;
}


/* =========================================================
   04 - HERO
   ========================================================= */

.hero{
  position:relative;

  overflow:hidden;

  padding:88px 0 82px;

  color:#fff;

  background:
    radial-gradient(
      circle at 85% 18%,
      rgba(230,123,32,.15),
      transparent 27%
    ),
    linear-gradient(
      135deg,
      #12253d 0%,
      #1b3048 58%,
      #253d55 100%
    );
}


.hero::before{
  content:"";

  position:absolute;

  width:500px;
  height:500px;

  right:-220px;
  top:-230px;

  border-radius:50%;

  border:1px solid rgba(255,255,255,.06);

  pointer-events:none;
}


.hero::after{
  content:"";

  position:absolute;

  width:380px;
  height:380px;

  left:-180px;
  bottom:-210px;

  border-radius:50%;

  background:rgba(230,123,32,.08);

  pointer-events:none;
}


.hero-grid{
  position:relative;
  z-index:1;

  display:grid;

  grid-template-columns:
    minmax(0,1.12fr)
    minmax(350px,.88fr);

  align-items:center;

  gap:65px;
}


.hero-copy{
  min-width:0;
}


.eyebrow{
  display:inline-flex;

  align-items:center;

  color:#f0a15b;

  font-size:15px;
  font-weight:900;
}


.hero h1{
  margin:13px 0 18px;

  max-width:720px;

  font-size:clamp(40px,5vw,68px);

  line-height:1.16;

  letter-spacing:-1.2px;

  font-weight:900;
}


.hero h1 span{
  color:#f19a42;
}


.hero-lead,
.hero p{
  max-width:680px;

  margin:0;

  color:#dce5ed;

  font-size:18px;

  line-height:1.95;
}


.hero-actions{
  display:flex;

  align-items:center;

  gap:12px;

  flex-wrap:wrap;

  margin-top:28px;
}


.hero-main-btn{
  min-height:52px;

  padding-inline:24px;

  border-radius:16px;

  font-size:15px;
}


.hero-features{
  display:grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap:10px;

  margin-top:24px;
}


.hero-feature{
  min-height:68px;

  display:flex;

  align-items:center;

  gap:10px;

  padding:11px;

  border:1px solid rgba(255,255,255,.12);

  border-radius:14px;

  background:rgba(255,255,255,.055);

  backdrop-filter:blur(7px);
}


.hero-feature strong{
  width:38px;
  height:38px;

  flex:0 0 auto;

  display:grid;
  place-items:center;

  border-radius:11px;

  background:rgba(255,255,255,.09);

  font-size:18px;
}


.hero-feature span{
  color:rgba(255,255,255,.82);

  font-size:12px;

  font-weight:700;
}


/* HERO CARD */


.hero-card{
  position:relative;

  overflow:hidden;

  padding:18px;

  background:#fff;

  border-radius:26px;

  box-shadow:
    0 25px 65px rgba(0,0,0,.23);

  transform:rotate(-1deg);

  transition:
    transform .3s ease,
    box-shadow .3s ease;
}


.hero-card:hover{
  transform:rotate(0) translateY(-5px);

  box-shadow:
    0 30px 72px rgba(0,0,0,.27);
}


.hero-image-wrap{
  position:relative;

  overflow:hidden;

  border-radius:18px;
}


.hero-image-wrap img,
.hero-card > img{
  display:block;

  width:100%;
  height:auto;

  border-radius:18px;

  object-fit:cover;

  transition:
    transform .55s ease;
}


.hero-card:hover img{
  transform:scale(1.035);
}


.hero-image-label{
  position:absolute;

  right:14px;
  bottom:14px;

  display:flex;

  flex-direction:column;

  gap:0;

  padding:10px 14px;

  color:#fff;

  background:rgba(20,38,61,.86);

  border:1px solid rgba(255,255,255,.15);

  border-radius:12px;

  backdrop-filter:blur(8px);
}


.hero-image-label strong{
  font-size:16px;
}


.hero-image-label span{
  font-size:11px;

  color:#dce5ed;
}


.hero-card-text{
  display:flex;

  flex-direction:column;

  gap:2px;

  padding:14px 4px 2px;
}


.hero-card-text strong{
  color:var(--text);

  font-size:17px;
}


.hero-card-text span{
  color:var(--text-soft);

  font-size:13px;
}


/* =========================================================
   05 - GENERAL SECTIONS
   ========================================================= */

.section{
  padding:82px 0;
}


.section-title{
  margin-bottom:38px;

  text-align:center;
}


.section-title > span,
.section-kicker{
  color:var(--orange);

  font-size:14px;

  font-weight:900;
}


.section-title h2{
  margin:6px 0 9px;

  color:var(--navy);

  font-size:38px;

  line-height:1.25;

  letter-spacing:-.5px;
}


.section-title p{
  max-width:700px;

  margin:0 auto;

  color:var(--text-soft);

  font-size:15px;
}


/* =========================================================
   06 - QUICK INFO
   ========================================================= */

.quick-info{
  position:relative;
  z-index:2;

  padding:0;

  background:var(--cream);
}


.quick-info-grid{
  display:grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap:14px;

  transform:translateY(-30px);
}


.info-box{
  display:flex;

  align-items:center;

  gap:13px;

  min-height:88px;

  padding:16px;

  background:#fff;

  border:1px solid var(--border);

  border-radius:17px;

  box-shadow:var(--shadow-md);
}


.info-icon{
  width:46px;
  height:46px;

  flex:0 0 auto;

  display:grid;
  place-items:center;

  border-radius:13px;

  background:var(--orange-soft);

  font-size:21px;
}


.info-box strong{
  display:block;

  margin-bottom:2px;

  color:var(--navy);

  font-size:14px;
}


.info-box span{
  display:block;

  color:var(--text-soft);

  font-size:12px;
}


/* =========================================================
   07 - CATEGORIES
   ========================================================= */

.categories-section{
  background:#fff;
}


.category-grid{
  display:grid;

  grid-template-columns:
    repeat(4,minmax(0,1fr));

  gap:16px;
}


.cat{
  position:relative;

  width:100%;

  min-height:78px;

  display:flex;

  align-items:center;

  gap:11px;

  padding:14px;

  overflow:hidden;

  border:1px solid var(--border);

  border-radius:17px;

  background:#fff;

  color:var(--text);

  text-align:right;

  font-family:inherit;

  font-size:14px;

  font-weight:900;

  cursor:pointer;

  box-shadow:var(--shadow-sm);

  transition:
    transform .22s ease,
    border-color .22s ease,
    box-shadow .22s ease,
    background .22s ease;
}


.cat::before{
  content:"";

  position:absolute;

  right:0;
  top:0;

  width:4px;
  height:0;

  background:var(--orange);

  transition:
    height .25s ease;
}


.cat::after{
  content:"←";

  position:absolute;

  left:14px;

  top:50%;

  color:var(--orange);

  font-size:19px;

  transform:
    translateY(-50%)
    translateX(0);

  transition:
    transform .2s ease;
}


.cat:hover{
  transform:translateY(-4px);

  border-color:#e8d4c1;

  background:#fffaf5;

  box-shadow:var(--shadow-md);
}


.cat:hover::before{
  height:100%;
}


.cat:hover::after{
  transform:
    translateY(-50%)
    translateX(-3px);
}


.cat-icon{
  width:44px;
  height:44px;

  flex:0 0 auto;

  display:grid;
  place-items:center;

  border:1px solid #f0dfcf;

  border-radius:13px;

  background:#fff4e9;

  font-size:20px;

  transition:
    transform .2s ease,
    background .2s ease;
}


.cat:hover .cat-icon{
  transform:
    scale(1.06)
    rotate(-3deg);

  background:#ffe9d7;
}


/* =========================================================
   08 - PRODUCT SECTION
   ========================================================= */

.products-section{
  background:var(--cream-2);
}


.products-toolbar{
  display:flex;

  align-items:center;

  justify-content:space-between;

  gap:18px;

  margin-bottom:25px;
}


.products-toolbar .filters{
  flex:1;

  justify-content:flex-start;

  margin-bottom:0;
}


.filters{
  display:flex;

  align-items:center;

  justify-content:center;

  flex-wrap:wrap;

  gap:8px;
}


.filter{
  min-height:38px;

  padding:7px 14px;

  border:1px solid #ddd5c9;

  border-radius:999px;

  background:#fff;

  color:#293c50;

  font-family:inherit;

  font-size:12px;

  font-weight:800;

  cursor:pointer;

  transition:
    transform .18s ease,
    border-color .18s ease,
    background .18s ease,
    color .18s ease;
}


.filter:hover{
  transform:translateY(-1px);

  border-color:var(--navy);
}


.filter.active{
  color:#fff;

  border-color:var(--navy);

  background:var(--navy);
}


/* =========================================================
   09 - PRODUCT SEARCH
   ========================================================= */

.product-search,
.product-search-area{
  position:relative;

  width:100%;

  margin:0 0 20px;
}


.product-search-label{
  display:block;

  margin-bottom:8px;

  color:var(--navy);

  font-size:13px;

  font-weight:900;
}


.product-search-field,
.product-search-box{
  position:relative;

  display:flex;

  align-items:center;

  width:100%;

  min-height:56px;

  padding:0 46px 0 48px;

  border:1px solid #ddd5c9;

  border-radius:16px;

  background:#fff;

  box-shadow:
    0 7px 22px rgba(20,38,61,.045);

  transition:
    border-color .2s ease,
    box-shadow .2s ease;
}


.product-search-field:focus-within,
.product-search-box:focus-within{
  border-color:var(--orange);

  box-shadow:
    0 0 0 4px rgba(230,123,32,.10);
}


.product-search-icon{
  position:absolute;

  right:17px;

  top:50%;

  transform:translateY(-50%);

  font-size:17px;

  pointer-events:none;
}


.product-search-input{
  width:100%;

  min-width:0;

  border:0;

  outline:0;

  background:transparent;

  color:var(--text);

  font-size:14px;

  font-weight:600;
}


.product-search-input::placeholder{
  color:#a0a7ad;
}


.product-search-clear,
.clear-product-search{
  position:absolute;

  left:10px;

  top:50%;

  width:34px;
  height:34px;

  display:grid;
  place-items:center;

  border:0;

  border-radius:10px;

  background:#f4f1ea;

  color:#6f7982;

  font-size:20px;

  line-height:1;

  transform:translateY(-50%);
}


.product-search-clear:hover,
.clear-product-search:hover{
  background:#ece5db;

  color:var(--text);
}


.product-search-suggestions,
.search-suggestions{
  position:absolute;

  top:100%;

  right:0;
  left:0;

  z-index:100;

  max-height:360px;

  overflow:auto;

  margin-top:7px;

  border:1px solid var(--border);

  border-radius:15px;

  background:#fff;

  box-shadow:
    0 18px 42px rgba(20,38,61,.13);
}


.product-search-suggestion,
.search-suggestion{
  display:flex;

  align-items:center;

  gap:10px;

  width:100%;

  padding:12px 14px;

  border:0;

  border-bottom:1px solid #f1ece5;

  background:#fff;

  color:var(--text);

  text-align:right;

  font-family:inherit;

  cursor:pointer;
}


.product-search-suggestion:last-child,
.search-suggestion:last-child{
  border-bottom:0;
}


.product-search-suggestion:hover,
.search-suggestion:hover{
  background:#fff8f1;
}


.search-suggestion-icon{
  width:38px;
  height:38px;

  flex:0 0 auto;

  display:grid;
  place-items:center;

  border-radius:10px;

  background:var(--orange-soft);
}


.search-suggestion-content{
  min-width:0;

  display:flex;

  flex-direction:column;
}


.search-suggestion-name{
  overflow:hidden;

  color:var(--text);

  font-size:13px;

  font-weight:900;

  text-overflow:ellipsis;

  white-space:nowrap;
}


.search-suggestion-meta{
  color:var(--text-muted);

  font-size:11px;
}


.search-highlight{
  animation:
    searchHighlight 1.8s ease;
}


@keyframes searchHighlight{

  0%{
    box-shadow:
      0 0 0 0 rgba(230,123,32,.45);
  }

  35%{
    box-shadow:
      0 0 0 7px rgba(230,123,32,.14);
  }

  100%{
    box-shadow:
      0 0 0 0 rgba(230,123,32,0);
  }

}


/* =========================================================
   10 - PRODUCT GRID / CARDS
   ========================================================= */

.products-grid{
  display:grid;

  grid-template-columns:
    repeat(4,minmax(0,1fr));

  gap:19px;

  align-items:stretch;
}


.product{
  position:relative;

  min-width:0;

  display:flex;

  flex-direction:column;

  overflow:hidden;

  height:100%;

  border:1px solid var(--border);

  border-radius:18px;

  background:#fff;

  box-shadow:var(--shadow-sm);

  transition:
    transform .24s ease,
    box-shadow .24s ease,
    border-color .24s ease;
}


.product:hover{
  transform:translateY(-6px);

  border-color:#e5d8c9;

  box-shadow:var(--shadow-lg);
}


.product-image{
  position:relative;

  width:100%;

  aspect-ratio:1 / 1;

  overflow:hidden;

  background:#f2eee7;
}


.product-image img,
.product > img{
  display:block;

  width:100%;
  height:100%;

  object-fit:cover;

  background:#f2eee7;

  transition:
    transform .4s ease;
}


.product:hover .product-image img{
  transform:scale(1.045);
}


.product-image-placeholder,
.product-placeholder{
  width:100%;
  height:100%;

  display:grid;
  place-items:center;

  align-content:center;

  gap:7px;

  background:
    linear-gradient(
      135deg,
      #f5f1ea,
      #ebe6dd
    );

  color:#8a949c;
}


.placeholder-icon{
  font-size:36px;
}


.product-body{
  display:flex;

  flex-direction:column;

  flex:1;

  min-width:0;

  padding:15px;
}


.product-category{
  width:max-content;

  max-width:100%;

  overflow:hidden;

  margin-bottom:8px;

  padding:4px 9px;

  border-radius:999px;

  background:var(--orange-soft);

  color:#c76416;

  font-size:11px;

  font-weight:900;

  line-height:1.4;

  text-overflow:ellipsis;

  white-space:nowrap;
}


.product h3{
  margin:0 0 6px;

  color:var(--text);

  font-size:17px;

  line-height:1.5;

  font-weight:900;
}


.product p{
  margin:0;

  color:var(--text-soft);

  font-size:13px;

  line-height:1.8;
}


.product-footer{
  margin-top:auto;

  padding-top:14px;
}


.product-whatsapp{
  width:100%;

  min-height:42px;

  display:flex;

  align-items:center;

  justify-content:center;

  gap:7px;

  padding:9px 11px;

  border-radius:11px;

  background:var(--green);

  color:#fff;

  text-decoration:none;

  font-size:12px;

  font-weight:900;

  transition:
    transform .2s ease,
    background .2s ease,
    box-shadow .2s ease;
}


.product-whatsapp:hover{
  background:var(--green-dark);

  transform:translateY(-2px);

  box-shadow:
    0 8px 18px rgba(20,139,87,.18);
}


.empty{
  grid-column:1/-1;

  width:100%;

  padding:48px 20px;

  text-align:center;

  border:1px solid var(--border);

  border-radius:18px;

  background:#fff;

  color:var(--text-soft);

  box-shadow:var(--shadow-sm);
}


.empty-icon{
  margin-bottom:7px;

  font-size:40px;
}


.empty h3{
  margin:0 0 5px;

  color:var(--text);

  font-size:20px;
}


.empty p{
  margin:0;

  color:var(--text-soft);
}


/* =========================================================
   11 - ABOUT
   ========================================================= */

.about-section{
  background:#fff;
}


.about-grid{
  display:grid;

  grid-template-columns:
    minmax(0,.95fr)
    minmax(0,1.05fr);

  align-items:center;

  gap:70px;
}


.about-image{
  position:relative;

  min-width:0;
}


.about-image img{
  display:block;

  width:100%;

  max-height:520px;

  object-fit:cover;

  border-radius:24px;

  box-shadow:
    0 20px 50px rgba(20,38,61,.12);

  transition:
    transform .3s ease;
}


.about-image:hover img{
  transform:translateY(-4px);
}


.image-badge{
  position:absolute;

  right:18px;
  bottom:18px;

  padding:8px 15px;

  border-radius:12px;

  background:var(--orange);

  color:#fff;

  font-weight:900;

  box-shadow:
    0 8px 20px rgba(230,123,32,.22);
}


.about-copy h2{
  margin:7px 0 15px;

  color:var(--navy);

  font-size:42px;

  line-height:1.3;

  letter-spacing:-.5px;
}


.about-copy p{
  max-width:590px;

  margin:0 0 13px;

  color:var(--text-soft);

  font-size:17px;

  line-height:1.95;
}


.text-link{
  display:inline-flex;

  margin-top:7px;

  color:var(--orange-dark);

  text-decoration:none;

  font-weight:900;

  transition:
    transform .2s ease,
    color .2s ease;
}


.text-link:hover{
  color:var(--orange);

  transform:translateX(-4px);
}


/* =========================================================
   12 - BRANCHES
   ========================================================= */

.branches-section{
  background:var(--cream-2);
}


.branch-grid{
  display:grid;

  grid-template-columns:
    repeat(2,minmax(0,1fr));

  gap:20px;
}


.branch-card{
  display:flex;

  align-items:flex-start;

  gap:18px;

  padding:24px;

  overflow:hidden;

  border:1px solid var(--border);

  border-radius:20px;

  background:#fff;

  box-shadow:var(--shadow-sm);

  transition:
    transform .22s ease,
    box-shadow .22s ease,
    border-color .22s ease;
}


.branch-card:hover{
  transform:translateY(-4px);

  border-color:#e5d8c9;

  box-shadow:var(--shadow-md);
}


.branch-icon{
  width:54px;
  height:54px;

  flex:0 0 auto;

  display:grid;
  place-items:center;

  border-radius:15px;

  background:var(--navy);

  color:#fff;

  font-weight:900;
}


.branch-card h3{
  margin:0 0 5px;

  color:var(--text);

  font-size:19px;

  line-height:1.55;
}


.branch-card p{
  margin:0 0 10px;

  color:var(--text-soft);

  font-size:13px;

  line-height:1.8;
}


.branch-card a{
  color:var(--orange-dark);

  text-decoration:none;

  font-size:13px;

  font-weight:900;
}


.branch-card a:hover{
  color:var(--orange);
}


/* =========================================================
   13 - SOCIAL
   ========================================================= */

.social-section{
  background:#fff;

  padding-top:65px;
  padding-bottom:65px;
}


.social-buttons{
  display:flex;

  align-items:center;

  justify-content:center;

  flex-wrap:wrap;

  gap:11px;
}


.social-btn{
  min-width:150px;

  display:inline-flex;

  align-items:center;

  justify-content:center;

  gap:9px;

  padding:11px 20px;

  border-radius:14px;

  color:#fff;

  text-decoration:none;

  font-size:13px;

  font-weight:900;

  transition:
    transform .2s ease,
    box-shadow .2s ease,
    opacity .2s ease;
}


.social-btn:hover{
  transform:translateY(-3px);

  box-shadow:
    0 11px 25px rgba(20,38,61,.13);

  opacity:.95;
}


.social-btn span{
  width:29px;
  height:29px;

  display:grid;
  place-items:center;

  border-radius:50%;

  background:rgba(255,255,255,.18);

  font-size:17px;
}


.social-btn.facebook{
  background:#1877f2;
}


.social-btn.instagram{
  background:
    linear-gradient(
      135deg,
      #833ab4,
      #fd1d1d,
      #fcb045
    );
}


.social-btn.tiktok{
  background:#111;
}


/* =========================================================
   14 - CONTACT
   ========================================================= */

.contact-section{
  position:relative;

  overflow:hidden;

  padding:70px 0;

  color:#fff;

  background:
    radial-gradient(
      circle at 10% 90%,
      rgba(230,123,32,.12),
      transparent 30%
    ),
    var(--navy);
}


.contact-section::after{
  content:"";

  position:absolute;

  width:300px;
  height:300px;

  right:-150px;
  top:-150px;

  border-radius:50%;

  border:1px solid rgba(255,255,255,.05);

  pointer-events:none;
}


.contact-box{
  position:relative;

  z-index:1;

  display:flex;

  align-items:center;

  justify-content:space-between;

  gap:45px;
}


.contact-box h2{
  margin:7px 0 8px;

  font-size:38px;

  line-height:1.25;
}


.contact-box p{
  margin:0;

  color:#c9d5df;

  font-size:14px;
}


.contact-actions{
  width:min(400px,100%);

  flex:0 0 auto;

  display:flex;

  flex-direction:column;

  gap:12px;
}


.phone-list{
  display:grid;

  grid-template-columns:
    repeat(2,minmax(0,1fr));

  gap:8px;
}


.phone-list a{
  display:flex;

  align-items:center;

  justify-content:center;

  min-height:42px;

  padding:8px 9px;

  border:1px solid rgba(255,255,255,.12);

  border-radius:10px;

  background:rgba(255,255,255,.07);

  color:#fff;

  text-decoration:none;

  font-size:12px;

  font-weight:800;

  transition:
    background .2s ease,
    transform .2s ease;
}


.phone-list a:hover{
  background:rgba(255,255,255,.13);

  transform:translateY(-2px);
}


/* =========================================================
   15 - FOOTER
   ========================================================= */

footer{
  background:#102237;

  color:#b8c5d0;

  padding:21px 0;
}


.footer-inner{
  display:flex;

  align-items:center;

  justify-content:space-between;

  gap:20px;

  font-size:12px;
}


/* =========================================================
   16 - FLOATING WHATSAPP
   ========================================================= */

.floating-wa{
  position:fixed;

  left:18px;
  bottom:18px;

  z-index:999;

  display:inline-flex;

  align-items:center;

  justify-content:center;

  min-height:48px;

  padding:11px 17px;

  border-radius:999px;

  background:var(--green);

  color:#fff;

  text-decoration:none;

  font-size:13px;

  font-weight:900;

  box-shadow:
    0 10px 30px rgba(0,0,0,.20);

  transition:
    transform .22s ease,
    box-shadow .22s ease;
}


.floating-wa:hover{
  transform:translateY(-3px);

  box-shadow:
    0 14px 34px rgba(0,0,0,.25);
}


/* =========================================================
   17 - SECTION ACTION
   ========================================================= */

.section-action{
  display:flex;

  justify-content:center;

  margin-top:28px;
}


.sections-main-btn{
  min-height:49px;

  padding-inline:22px;

  border-radius:15px;
}


/* =========================================================
   18 - GENERIC SECTIONS PAGE SUPPORT
   ========================================================= */

/*
  القواعد التالية مقصودة للحفاظ على شكل موحد
  مع صفحة sections.html لو استخدمت هذه الكلاسات.
*/


.sections-page{
  min-height:100vh;

  background:var(--cream);
}


.sections-hero,
.store-hero{
  position:relative;

  overflow:hidden;

  padding:65px 0;

  color:#fff;

  background:
    radial-gradient(
      circle at 85% 15%,
      rgba(230,123,32,.15),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      var(--navy),
      var(--navy-2)
    );
}


.sections-hero-grid,
.store-hero-grid{
  position:relative;

  z-index:1;

  display:grid;

  grid-template-columns:
    minmax(0,1.15fr)
    minmax(280px,.85fr);

  align-items:center;

  gap:45px;
}


.sections-hero h1,
.store-hero h1{
  margin:0 0 12px;

  font-size:clamp(34px,4vw,54px);

  line-height:1.2;

  font-weight:900;
}


.sections-hero p,
.store-hero p{
  margin:0;

  max-width:700px;

  color:#d9e2ea;

  font-size:16px;

  line-height:1.9;
}


.sections-search,
.store-search,
.sections-search-panel{
  position:relative;

  margin-top:25px;
}


.sections-search input,
.store-search input,
.sections-search-panel input{
  width:100%;

  min-height:56px;

  padding:0 18px;

  border:1px solid rgba(255,255,255,.2);

  border-radius:16px;

  outline:0;

  background:rgba(255,255,255,.09);

  color:#fff;

  font-family:inherit;

  font-size:14px;

  backdrop-filter:blur(8px);
}


.sections-search input::placeholder,
.store-search input::placeholder,
.sections-search-panel input::placeholder{
  color:rgba(255,255,255,.65);
}


.sections-search input:focus,
.store-search input:focus,
.sections-search-panel input:focus{
  border-color:#f19a42;

  box-shadow:
    0 0 0 4px rgba(230,123,32,.11);
}


.sections-content,
.store-content{
  padding:65px 0;
}


.sections-category-grid,
.store-category-grid{
  display:grid;

  grid-template-columns:
    repeat(4,minmax(0,1fr));

  gap:14px;
}


.category-chip,
.sections-category,
.store-category{
  min-height:52px;

  display:flex;

  align-items:center;

  justify-content:center;

  padding:10px 14px;

  border:1px solid var(--border);

  border-radius:13px;

  background:#fff;

  color:var(--text);

  font-family:inherit;

  font-size:13px;

  font-weight:900;

  cursor:pointer;

  box-shadow:var(--shadow-sm);

  transition:
    transform .2s ease,
    border-color .2s ease,
    background .2s ease,
    color .2s ease;
}


.category-chip:hover,
.sections-category:hover,
.store-category:hover{
  transform:translateY(-3px);

  border-color:#e4d0bb;

  background:#fffaf5;
}


.category-chip.active,
.sections-category.active,
.store-category.active{
  border-color:var(--navy);

  background:var(--navy);

  color:#fff;
}


.selected-category,
.selected-category-bar{
  display:flex;

  align-items:center;

  justify-content:space-between;

  gap:12px;

  margin:28px 0 20px;

  padding:14px 17px;

  border:1px solid var(--border);

  border-radius:15px;

  background:#fff;

  box-shadow:var(--shadow-sm);
}


.selected-category strong,
.selected-category-bar strong{
  color:var(--navy);

  font-size:14px;
}


.sections-products-grid,
.store-products-grid{
  display:grid;

  grid-template-columns:
    repeat(4,minmax(0,1fr));

  gap:18px;
}


/* =========================================================
   19 - MODAL SUPPORT
   ========================================================= */

.product-modal,
.product-details-modal{
  position:fixed;

  inset:0;

  z-index:3000;

  display:none;

  align-items:center;

  justify-content:center;

  padding:20px;

  background:rgba(10,20,31,.70);

  backdrop-filter:blur(5px);
}


.product-modal.open,
.product-modal.active,
.product-details-modal.open,
.product-details-modal.active{
  display:flex;
}


.product-modal-content,
.product-details-modal-content{
  position:relative;

  width:min(920px,100%);

  max-height:90vh;

  overflow:auto;

  border-radius:22px;

  background:#fff;

  box-shadow:
    0 30px 90px rgba(0,0,0,.30);
}


.modal-close,
.product-modal-close{
  position:absolute;

  left:15px;
  top:15px;

  z-index:5;

  width:38px;
  height:38px;

  display:grid;
  place-items:center;

  border:0;

  border-radius:50%;

  background:rgba(20,38,61,.08);

  color:var(--text);

  font-size:21px;
}


.modal-close:hover,
.product-modal-close:hover{
  background:rgba(20,38,61,.14);
}


/* =========================================================
   20 - EMPTY / LOADING STATES
   ========================================================= */

.loading,
.products-loading,
.sections-loading{
  width:100%;

  padding:40px 20px;

  text-align:center;

  color:var(--text-soft);

  font-size:14px;
}


.loading::before,
.products-loading::before,
.sections-loading::before{
  content:"";

  display:inline-block;

  width:22px;
  height:22px;

  margin-left:8px;

  vertical-align:-6px;

  border:3px solid #e8dfd3;

  border-top-color:var(--orange);

  border-radius:50%;

  animation:
    loadingSpin .75s linear infinite;
}


@keyframes loadingSpin{

  to{
    transform:rotate(360deg);
  }

}


/* =========================================================
   21 - RESPONSIVE 1100
   ========================================================= */

@media(max-width:1100px){

  .products-grid,
  .sections-products-grid,
  .store-products-grid{
    grid-template-columns:
      repeat(3,minmax(0,1fr));
  }


  .category-grid,
  .sections-category-grid,
  .store-category-grid{
    grid-template-columns:
      repeat(3,minmax(0,1fr));
  }


  .hero-grid{
    gap:45px;
  }


  .desktop-nav{
    gap:18px;
  }

}


/* =========================================================
   22 - RESPONSIVE 900
   ========================================================= */

@media(max-width:900px){

  .nav{
    min-height:72px;
  }


  .desktop-nav{
    display:none;
  }


  .hero{
    padding:68px 0 65px;
  }


  .hero-grid,
  .sections-hero-grid,
  .store-hero-grid,
  .about-grid{
    grid-template-columns:1fr;
  }


  .hero-card{
    width:min(470px,100%);

    margin-inline:auto;
  }


  .about-copy{
    text-align:center;
  }


  .about-copy p{
    margin-inline:auto;
  }


  .contact-box{
    flex-direction:column;

    align-items:stretch;
  }


  .contact-actions{
    width:100%;
  }


  .products-toolbar{
    align-items:stretch;

    flex-direction:column;
  }


  .products-toolbar .primary-btn{
    width:100%;
  }


  .products-toolbar .filters{
    justify-content:center;
  }


  .sections-category-grid,
  .store-category-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }

}


/* =========================================================
   23 - RESPONSIVE 700
   ========================================================= */

@media(max-width:700px){

  .section{
    padding:66px 0;
  }


  .section-title{
    margin-bottom:27px;
  }


  .section-title h2{
    font-size:31px;
  }


  .quick-info-grid{
    grid-template-columns:1fr;

    transform:translateY(-20px);
  }


  .category-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }


  .products-grid,
  .sections-products-grid,
  .store-products-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));

    gap:12px;
  }


  .sections-category-grid,
  .store-category-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));

    gap:11px;
  }


  .branch-grid{
    grid-template-columns:1fr;
  }


  .hero-features{
    grid-template-columns:1fr;
  }


  .footer-inner{
    flex-direction:column;

    text-align:center;
  }

}


/* =========================================================
   24 - RESPONSIVE 560 MOBILE
   ========================================================= */

@media(max-width:560px){

  .container{
    width:min(92%,440px);
  }


  .nav{
    gap:10px;

    min-height:66px;
  }


  .brand{
    width:120px;
  }


  .header-wa{
    margin-inline-start:auto;

    min-height:39px;

    padding:8px 12px;

    border-radius:10px;

    font-size:12px;
  }


  .hero{
    padding:55px 0 58px;
  }


  .hero h1{
    margin-top:11px;

    font-size:36px;

    letter-spacing:-.6px;
  }


  .hero p,
  .hero-lead{
    font-size:15px;

    line-height:1.9;
  }


  .hero-actions{
    flex-direction:column;

    align-items:stretch;

    margin-top:23px;
  }


  .hero-actions a{
    width:100%;
  }


  .hero-card{
    padding:13px;

    border-radius:19px;
  }


  .hero-image-wrap{
    border-radius:14px;
  }


  .hero-image-label{
    right:9px;
    bottom:9px;

    padding:7px 10px;

    border-radius:9px;
  }


  .hero-image-label strong{
    font-size:13px;
  }


  .hero-image-label span{
    font-size:9px;
  }


  .hero-card-text{
    padding:11px 2px 1px;
  }


  .hero-card-text strong{
    font-size:15px;
  }


  .hero-card-text span{
    font-size:11px;
  }


  .section{
    padding:58px 0;
  }


  .section-title h2{
    font-size:29px;
  }


  .section-title p{
    font-size:13px;
  }


  .info-box{
    min-height:76px;

    padding:13px;
  }


  .info-icon{
    width:42px;
    height:42px;

    font-size:19px;
  }


  .category-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));

    gap:10px;
  }


  .cat{
    min-height:64px;

    padding:10px;

    gap:8px;

    border-radius:14px;

    font-size:12px;
  }


  .cat-icon{
    width:37px;
    height:37px;

    border-radius:10px;

    font-size:17px;
  }


  .cat::after{
    display:none;
  }


  .products-grid,
  .sections-products-grid,
  .store-products-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));

    gap:10px;
  }


  .product{
    border-radius:14px;
  }


  .product-body{
    padding:10px;
  }


  .product-category{
    padding:3px 7px;

    font-size:9px;
  }


  .product h3{
    font-size:13px;

    line-height:1.45;
  }


  .product p{
    font-size:11px;

    line-height:1.6;
  }


  .product-footer{
    padding-top:10px;
  }


  .product-whatsapp{
    min-height:38px;

    padding:8px 5px;

    border-radius:9px;

    font-size:10px;
  }


  .product-search-field,
  .product-search-box{
    min-height:52px;

    padding-inline:
      43px
      43px;
  }


  .product-search-input{
    font-size:13px;
  }


  .products-toolbar{
    gap:13px;

    margin-bottom:19px;
  }


  .filters{
    gap:6px;
  }


  .filter{
    min-height:35px;

    padding:6px 11px;

    font-size:10px;
  }


  .about-copy h2{
    font-size:31px;
  }


  .about-copy p{
    font-size:15px;
  }


  .about-image img{
    border-radius:19px;
  }


  .branch-card{
    padding:18px;

    gap:13px;

    border-radius:16px;
  }


  .branch-icon{
    width:46px;
    height:46px;

    border-radius:12px;

    font-size:13px;
  }


  .branch-card h3{
    font-size:16px;
  }


  .branch-card p,
  .branch-card a{
    font-size:11px;
  }


  .contact-section{
    padding:57px 0;
  }


  .contact-box h2{
    font-size:30px;
  }


  .phone-list{
    grid-template-columns:1fr;
  }


  .social-buttons{
    flex-direction:column;

    align-items:stretch;
  }


  .social-btn{
    width:100%;
  }


  .floating-wa{
    left:12px;
    bottom:12px;

    min-height:44px;

    padding:10px 14px;

    font-size:11px;
  }


  .selected-category,
  .selected-category-bar{
    align-items:flex-start;

    flex-direction:column;
  }

}


/* =========================================================
   25 - VERY SMALL SCREENS
   ========================================================= */

@media(max-width:380px){

  .brand{
    width:105px;
  }


  .header-wa{
    padding:7px 9px;

    font-size:11px;
  }


  .hero h1{
    font-size:32px;
  }


  .section-title h2{
    font-size:27px;
  }


  .category-grid{
    grid-template-columns:1fr;
  }


  .products-grid,
  .sections-products-grid,
  .store-products-grid{
    grid-template-columns:1fr;
  }


  .product h3{
    font-size:15px;
  }


  .product p{
    font-size:12px;
  }


  .product-whatsapp{
    font-size:11px;
  }

}


/* =========================================================
   26 - ACCESSIBILITY / REDUCED MOTION
   ========================================================= */

:focus-visible{
  outline:3px solid rgba(230,123,32,.35);

  outline-offset:3px;
}


@media(prefers-reduced-motion:reduce){

  html{
    scroll-behavior:auto;
  }


  *,
  *::before,
  *::after{
    animation-duration:.01ms !important;

    animation-iteration-count:1 !important;

    transition-duration:.01ms !important;
  }

}
