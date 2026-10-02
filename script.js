/* =========================================================
   ABO TAREK STORE
   LEGACY COMPATIBILITY LAYER
   FINAL EDITION
   =========================================================

   ملاحظة:
   - الكتالوج الحقيقي يتم تشغيله من app.js
   - الأقسام والمنتجات يتم تحميلها من Google Apps Script
   - لا توجد أي منتجات تجريبية هنا
   - الملف موجود فقط للحفاظ على التوافق مع أي كود قديم
   ========================================================= */

(() => {
  "use strict";

  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("navLinks");

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      nav.classList.toggle("open");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
      });
    });
  }
})();
