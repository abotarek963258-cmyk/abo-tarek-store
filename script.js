/* =========================================================
   ABO TAREK STORE
   SCRIPT.JS
   FINAL COMPATIBILITY LAYER
   ========================================================= */

(() => {
  "use strict";

  /*
    ========================================================
    ملاحظات مهمة
    ========================================================

    1) app.js هو المسؤول الأساسي عن:
       - المنتجات
       - البحث
       - الاقتراحات
       - المودال
       - واتساب
       - الكاش
       - المينيو في الصفحة الرئيسية

    2) sections.html يمكنه استخدام هذا الملف بدون
       التأثير على نظام الكتالوج.

    3) لا يوجد هنا أي تحميل بيانات تجريبية.

    4) لا يوجد هنا أي API مستقل.

    5) الملف موجود للحفاظ على التوافق مع أي نسخة
       قديمة من الموقع.
  */

  const initLegacyMenu = () => {

    const menuBtn =
      document.getElementById("menuBtn");

    const nav =
      document.getElementById("navLinks");

    if (!menuBtn || !nav) {
      return;
    }

    /*
      لو app.js قام بالفعل بتشغيل المينيو،
      لا نضيف Listener آخر حتى لا يحدث Double Toggle.
    */

    if (
      menuBtn.dataset
        .aboTarekMenuReady === "true"
    ) {
      return;
    }

    menuBtn.dataset
      .aboTarekMenuReady = "true";

    menuBtn.addEventListener(
      "click",
      () => {

        nav.classList.toggle(
          "open"
        );

        const isOpen =
          nav.classList.contains(
            "open"
          );

        menuBtn.setAttribute(
          "aria-expanded",
          String(isOpen)
        );
      }
    );

    nav
      .querySelectorAll("a")
      .forEach((link) => {

        link.addEventListener(
          "click",
          () => {

            nav.classList.remove(
              "open"
            );

            menuBtn.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        );
      });
  };


  /*
    ========================================================
    CLOSE MENU WHEN CLICKING OUTSIDE
    ========================================================
  */

  const initOutsideClick = () => {

    const menuBtn =
      document.getElementById(
        "menuBtn"
      );

    const nav =
      document.getElementById(
        "navLinks"
      );

    if (!menuBtn || !nav) {
      return;
    }

    if (
      document.body.dataset
        .aboTarekOutsideClickReady === "true"
    ) {
      return;
    }

    document.body.dataset
      .aboTarekOutsideClickReady = "true";

    document.addEventListener(
      "click",
      (event) => {

        if (
          !nav.classList.contains(
            "open"
          )
        ) {
          return;
        }

        const clickedInsideNav =
          nav.contains(
            event.target
          );

        const clickedMenu =
          menuBtn.contains(
            event.target
          );

        if (
          !clickedInsideNav &&
          !clickedMenu
        ) {

          nav.classList.remove(
            "open"
          );

          menuBtn.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );
  };


  /*
    ========================================================
    ESCAPE KEY
    ========================================================
  */

  const initEscapeKey = () => {

    if (
      document.body.dataset
        .aboTarekEscapeReady === "true"
    ) {
      return;
    }

    document.body.dataset
      .aboTarekEscapeReady = "true";

    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key !== "Escape"
        ) {
          return;
        }

        const nav =
          document.getElementById(
            "navLinks"
          );

        const menuBtn =
          document.getElementById(
            "menuBtn"
          );

        if (nav) {
          nav.classList.remove(
            "open"
          );
        }

        if (menuBtn) {
          menuBtn.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );
  };


  /*
    ========================================================
    INITIALIZE
    ========================================================
  */

  const init = () => {

    initLegacyMenu();

    initOutsideClick();

    initEscapeKey();
  };


  /*
    لو DOM لسه بيتبني، نستنى.
    ولو جاهز، نشغل فورًا.
  */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  } else {

    init();
  }


  /*
    ========================================================
    GLOBAL COMPATIBILITY OBJECT
    ========================================================

    موجود فقط لو أي كود قديم بالموقع
    حاول يستدعي namespace قديم.
  */

  window.AboTarek =
    window.AboTarek || {};

  window.AboTarek.version =
    "2026.10-final";

})();
