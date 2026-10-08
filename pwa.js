/* =========================================================
   ABO TAREK STORE - PWA REGISTRATION
   DARK NAVY LUXURY EDITION
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     SERVICE WORKER
     ========================================================= */

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("./sw.js", { scope: "./" })
        .then(function () {
          console.log("✅ ABO TAREK SW registered");
        })
        .catch(function (err) {
          console.warn("⚠️ SW registration failed:", err);
        });
    });
  }

  /* =========================================================
     INSTALL PROMPT
     ========================================================= */

  let deferredPrompt = null;

  const INSTALL_DISMISSED_KEY = "abo_tarek_pwa_dismissed";
  const INSTALL_DISMISSED_TTL = 24 * 60 * 60 * 1000;

  /* =========================================================
     HELPERS
     ========================================================= */

  function isStandalone() {
    return (
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches
    ) || window.navigator.standalone === true;
  }

  function wasRecentlyDismissed() {
    try {
      const value = localStorage.getItem(INSTALL_DISMISSED_KEY);

      if (!value) {
        return false;
      }

      const timestamp = Number(value);

      if (!Number.isFinite(timestamp)) {
        localStorage.removeItem(INSTALL_DISMISSED_KEY);
        return false;
      }

      if (Date.now() - timestamp < INSTALL_DISMISSED_TTL) {
        return true;
      }

      localStorage.removeItem(INSTALL_DISMISSED_KEY);
      return false;

    } catch (error) {
      return false;
    }
  }

  function rememberDismissal() {
    try {
      localStorage.setItem(
        INSTALL_DISMISSED_KEY,
        String(Date.now())
      );
    } catch (error) {
      /* localStorage may be unavailable */
    }
  }

  function canShowBanner() {
    if (isStandalone()) {
      return false;
    }

    if (document.getElementById("pwaInstallBanner")) {
      return false;
    }

    return true;
  }

  /* =========================================================
     BEFORE INSTALL PROMPT
     ========================================================= */

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();

    deferredPrompt = event;

    console.log("✅ PWA install prompt captured");

    /*
      لو البانر اتعمل قبل وصول الحدث،
      بنسيبه ظاهر عادي.
    */
  });

  /* =========================================================
     APP INSTALLED
     ========================================================= */

  window.addEventListener("appinstalled", function () {
    console.log("✅ أبو طارق تم تثبيته كتطبيق");

    deferredPrompt = null;

    hideBanner();

    try {
      localStorage.removeItem(INSTALL_DISMISSED_KEY);
    } catch (error) {
      /* ignore */
    }
  });

  /* =========================================================
     CREATE INSTALL BANNER
     ========================================================= */

  function createBanner() {
    console.log("🎯 Creating Abu Tarek PWA banner...");

    if (!canShowBanner()) {
      return;
    }

    /*
      لو المستخدم قفل البانر قريب، ما نزعجوش تاني
      لمدة 24 ساعة.
    */
    if (wasRecentlyDismissed()) {
      console.log("ℹ️ PWA banner recently dismissed");
      return;
    }

    const banner = document.createElement("div");

    banner.id = "pwaInstallBanner";

    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      left: 0;
      z-index: 99999;
      padding: 14px;
      pointer-events: none;
      font-family: Cairo, Arial, sans-serif;
      transform: translateY(120%);
      transition:
        transform 0.45s cubic-bezier(.22,1,.36,1),
        opacity 0.3s ease;
      opacity: 0;
    `;

    banner.innerHTML = `
      <div
        style="
          pointer-events:auto;
          display:flex;
          align-items:center;
          gap:14px;
          padding:14px 16px;
          max-width:720px;
          margin:0 auto;

          background:
            linear-gradient(
              145deg,
              #071321 0%,
              #0b1d30 55%,
              #12304a 100%
            );

          border:1px solid rgba(212,175,55,.65);
          border-radius:18px;

          box-shadow:
            0 18px 55px rgba(0,0,0,.32),
            0 0 0 1px rgba(255,255,255,.03) inset;

          color:#f6f0e2;
        "
      >

        <!-- LOGO -->

        <div
          style="
            width:52px;
            height:52px;
            flex:0 0 52px;

            display:flex;
            align-items:center;
            justify-content:center;

            border-radius:14px;

            background:
              linear-gradient(
                145deg,
                #f6f0e2,
                #ebe3d3
              );

            border:1px solid rgba(212,175,55,.75);

            box-shadow:
              0 5px 18px rgba(0,0,0,.22);
          "
        >
          <img
            src="./assets/logo.png"
            alt="أبو طارق"
            style="
              width:43px;
              height:43px;
              object-fit:contain;
              display:block;
            "
          >
        </div>

        <!-- TEXT -->

        <div
          style="
            flex:1;
            min-width:0;
            text-align:right;
          "
        >
          <strong
            style="
              display:block;
              color:#f2d98b;
              font-size:14px;
              line-height:1.6;
              font-weight:900;
            "
          >
            📱 ثبّت تطبيق أبو طارق
          </strong>

          <span
            style="
              display:block;
              margin-top:2px;
              color:rgba(246,240,226,.78);
              font-size:11px;
              line-height:1.6;
              font-weight:600;
            "
          >
            وصول أسرع للموقع من شاشة موبايلك
          </span>
        </div>

        <!-- INSTALL -->

        <button
          type="button"
          id="pwaInstallBtn"
          style="
            min-height:42px;
            padding:0 20px;

            background:
              linear-gradient(
                135deg,
                #d4af37,
                #e4c35a
              );

            color:#071321;

            border:1px solid rgba(242,217,139,.8);
            border-radius:12px;

            font-family:Cairo, Arial, sans-serif;
            font-size:12px;
            font-weight:900;

            cursor:pointer;
            flex:0 0 auto;

            box-shadow:
              0 6px 18px rgba(212,175,55,.22);

            transition:
              transform .2s ease,
              box-shadow .2s ease;
          "
        >
          ثبّت التطبيق
        </button>

        <!-- CLOSE -->

        <button
          type="button"
          id="pwaInstallClose"
          aria-label="إغلاق"
          style="
            width:34px;
            height:34px;
            flex:0 0 34px;

            display:flex;
            align-items:center;
            justify-content:center;

            background:rgba(255,255,255,.05);
            color:#f6f0e2;

            border:1px solid rgba(255,255,255,.08);
            border-radius:10px;

            font-family:Arial,sans-serif;
            font-size:22px;
            line-height:1;

            cursor:pointer;
          "
        >
          ×
        </button>

      </div>
    `;

    document.body.appendChild(banner);

    /* =======================================================
       BUTTON HOVER
       ======================================================= */

    const installBtn = document.getElementById("pwaInstallBtn");

    if (installBtn) {
      installBtn.addEventListener("mouseenter", function () {
        installBtn.style.transform = "translateY(-1px)";
        installBtn.style.boxShadow =
          "0 9px 24px rgba(212,175,55,.32)";
      });

      installBtn.addEventListener("mouseleave", function () {
        installBtn.style.transform = "translateY(0)";
        installBtn.style.boxShadow =
          "0 6px 18px rgba(212,175,55,.22)";
      });
    }

    /* =======================================================
       SHOW ANIMATION
       ======================================================= */

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.style.transform = "translateY(0)";
        banner.style.opacity = "1";
      });
    });

    /* =======================================================
       INSTALL BUTTON
       ======================================================= */

    if (installBtn) {
      installBtn.addEventListener("click", async function () {
        console.log(
          "📲 Install clicked:",
          !!deferredPrompt
        );

        if (deferredPrompt) {
          try {
            deferredPrompt.prompt();

            const result =
              await deferredPrompt.userChoice;

            console.log(
              "PWA user choice:",
              result && result.outcome
            );

            deferredPrompt = null;

            hideBanner();

          } catch (error) {
            console.error(
              "❌ PWA prompt error:",
              error
            );

            showManualInstructions();
          }

          return;
        }

        /*
          بعض الأجهزة والمتصفحات لا توفر
          beforeinstallprompt.
        */
        showManualInstructions();
      });
    }

    /* =======================================================
       CLOSE BUTTON
       ======================================================= */

    const closeBtn =
      document.getElementById("pwaInstallClose");

    if (closeBtn) {
      closeBtn.addEventListener(
        "click",
        function () {
          rememberDismissal();
          hideBanner();
        }
      );
    }
  }

  /* =========================================================
     HIDE BANNER
     ========================================================= */

  function hideBanner() {
    const banner =
      document.getElementById("pwaInstallBanner");

    if (!banner) {
      return;
    }

    banner.style.transform =
      "translateY(120%)";

    banner.style.opacity = "0";

    setTimeout(function () {
      if (banner && banner.parentNode) {
        banner.remove();
      }
    }, 450);
  }

  /* =========================================================
     MANUAL INSTALL INSTRUCTIONS
     ========================================================= */

  function showManualInstructions() {
    const userAgent =
      navigator.userAgent || "";

    const isIOS =
      /iPhone|iPad|iPod/i.test(userAgent);

    const isAndroid =
      /Android/i.test(userAgent);

    let message =
      "لتثبيت تطبيق أبو طارق:\n\n";

    if (isIOS) {

      message +=
        "1. افتح الموقع من Safari\n" +
        "2. اضغط زر المشاركة\n" +
        "3. اختر «إضافة إلى الشاشة الرئيسية»\n" +
        "4. اضغط «إضافة»";

    } else if (isAndroid) {

      message +=
        "1. افتح قائمة Chrome (⋮)\n" +
        "2. اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»\n" +
        "3. اضغط «تثبيت»";

    } else {

      message +=
        "1. افتح قائمة المتصفح\n" +
        "2. اختر «تثبيت أبو طارق» أو «Install App»\n" +
        "3. أكد التثبيت";
    }

    alert(message);
  }

  /* =========================================================
     SCHEDULE
     ========================================================= */

  function scheduleBanner() {
    /*
      لا تظهر نافذة التثبيت داخل التطبيق المثبت.
    */
    if (isStandalone()) {
      console.log(
        "ℹ️ Standalone mode detected - PWA banner skipped"
      );
      return;
    }

    console.log(
      "⏰ Abu Tarek PWA banner scheduled"
    );

    setTimeout(function () {
      createBanner();
    }, 3000);
  }

  /* =========================================================
     INITIALIZE
     ========================================================= */

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      scheduleBanner
    );

  } else {

    scheduleBanner();
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.showInstallBanner = createBanner;
  window.hideInstallBanner = hideBanner;

  window.ABO_TAREK_PWA = {
    show: createBanner,
    hide: hideBanner,
    isStandalone: isStandalone,
    isInstallPromptAvailable: function () {
      return !!deferredPrompt;
    }
  };

  console.log(
    "✅ ABO TAREK pwa.js loaded - Dark Navy Luxury"
  );

})();
