/* =========================================================
   ABO TAREK STORE - PWA REGISTRATION
   DARK NAVY LUXURY EDITION
   Service Worker + Install Banner
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     0. CONFIG
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};
  const CFG =
    ROOT.CONFIG ||
    window.ABO_TAREK_CONFIG ||
    {};

  const COLORS = CFG.COLORS || {};

  const NAVY =
    COLORS.NAVY ||
    COLORS.navy ||
    "#071321";

  const NAVY_2 =
    COLORS.NAVY_2 ||
    COLORS.navy2 ||
    "#0D2238";

  const CREAM =
    COLORS.CREAM ||
    COLORS.cream ||
    "#F7F1E3";

  const GOLD =
    COLORS.GOLD ||
    COLORS.gold ||
    "#D4AF37";

  const GOLD_LIGHT =
    COLORS.GOLD_LIGHT ||
    COLORS.goldLight ||
    "#E8C85A";

  const TEXT =
    COLORS.TEXT ||
    COLORS.text ||
    "#172333";

  const MUTED =
    COLORS.MUTED ||
    COLORS.muted ||
    "#718096";

  const WHATSAPP =
    COLORS.WHATSAPP ||
    "#25D366";


  /* =========================================================
     1. SERVICE WORKER
     ========================================================= */

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.log("ℹ️ Service Worker غير مدعوم");
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("./sw.js", {
          scope: "./"
        })
        .then(function (registration) {
          console.log(
            "✅ Abu Tarek Service Worker registered:",
            registration.scope
          );
        })
        .catch(function (error) {
          console.warn(
            "⚠️ Abu Tarek Service Worker failed:",
            error
          );
        });
    });
  }

  registerServiceWorker();


  /* =========================================================
     2. INSTALL PROMPT
     ========================================================= */

  let deferredPrompt = null;

  window.addEventListener(
    "beforeinstallprompt",
    function (event) {
      event.preventDefault();

      deferredPrompt = event;

      console.log(
        "✅ PWA install prompt captured"
      );

      window.dispatchEvent(
        new CustomEvent("abo:tarek:pwa-ready")
      );
    }
  );


  /* =========================================================
     3. APP INSTALLED
     ========================================================= */

  window.addEventListener(
    "appinstalled",
    function () {
      console.log(
        "✅ أبو طارق تم تثبيته كتطبيق"
      );

      deferredPrompt = null;

      hideBanner();

      try {
        if (typeof window.aboTrack === "function") {
          window.aboTrack(
            "pwa_installed",
            {
              source: "install_banner"
            }
          );
        }
      } catch (error) {
        console.warn(
          "PWA analytics error:",
          error
        );
      }
    }
  );


  /* =========================================================
     4. HELPERS
     ========================================================= */

  function safeText(value, fallback) {
    const text = String(
      value == null ? "" : value
    ).trim();

    return text || fallback;
  }


  function escapeHTML(value) {
    return String(
      value == null ? "" : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function getSiteName() {
    const site =
      CFG.SITE ||
      {};

    return safeText(
      site.NAME ||
      site.name ||
      document.title ||
      "أبو طارق",
      "أبو طارق"
    );
  }


  /* =========================================================
     5. CREATE INSTALL BANNER
     ========================================================= */

  function createBanner() {
    if (!document.body) {
      return;
    }

    if (
      document.getElementById(
        "pwaInstallBanner"
      )
    ) {
      return;
    }

    /*
      لا نظهر البانر إذا كان التطبيق مفتوحاً
      بالفعل في وضع standalone.
    */

    const isStandalone =
      window.matchMedia &&
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

    const isIOSStandalone =
      window.navigator &&
      window.navigator.standalone === true;

    if (
      isStandalone ||
      isIOSStandalone
    ) {
      return;
    }


    const siteName =
      escapeHTML(
        getSiteName()
      );


    const banner =
      document.createElement("div");

    banner.id =
      "pwaInstallBanner";

    banner.setAttribute(
      "role",
      "dialog"
    );

    banner.setAttribute(
      "aria-label",
      "تثبيت تطبيق أبو طارق"
    );

    banner.style.cssText = `
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 99999;
      padding: 14px;
      pointer-events: none;
      transform: translateY(120%);
      transition:
        transform 0.45s cubic-bezier(.2,.8,.2,1);
      direction: rtl;
      font-family: Cairo, Tahoma, Arial, sans-serif;
    `;


    banner.innerHTML = `
      <div
        style="
          position:relative;
          display:flex;
          align-items:center;
          gap:14px;
          width:min(720px,100%);
          min-height:76px;
          margin:0 auto;
          padding:12px 14px;
          box-sizing:border-box;

          background:
            linear-gradient(
              135deg,
              ${NAVY} 0%,
              ${NAVY_2} 100%
            );

          border:1px solid
            rgba(212,175,55,.55);

          border-radius:20px;

          box-shadow:
            0 20px 60px
              rgba(0,0,0,.28),
            0 0 0 1px
              rgba(255,255,255,.04)
              inset;

          pointer-events:auto;
          overflow:hidden;
        "
      >

        <!-- Luxury glow -->
        <span
          aria-hidden="true"
          style="
            position:absolute;
            width:180px;
            height:180px;
            top:-100px;
            left:-40px;
            border-radius:50%;
            background:
              radial-gradient(
                circle,
                rgba(212,175,55,.18) 0%,
                rgba(212,175,55,0) 70%
              );
            pointer-events:none;
          "
        ></span>


        <!-- Logo -->
        <div
          style="
            position:relative;
            width:54px;
            height:54px;
            flex:0 0 54px;
            display:flex;
            align-items:center;
            justify-content:center;
            border-radius:15px;

            background:
              linear-gradient(
                145deg,
                ${CREAM},
                #fffaf0
              );

            border:1px solid
              rgba(212,175,55,.65);

            box-shadow:
              0 8px 24px
                rgba(0,0,0,.18);
          "
        >
          <img
            src="./assets/logo.png"
            alt="أبو طارق"
            style="
              width:44px;
              height:44px;
              object-fit:contain;
              display:block;
              border-radius:10px;
            "
            onerror="
              this.style.display='none';
              this.parentNode.innerHTML='<span style=&quot;color:${GOLD};font-size:24px;font-weight:900&quot;>أ</span>';
            "
          >
        </div>


        <!-- Text -->
        <div
          style="
            position:relative;
            flex:1;
            min-width:0;
            text-align:right;
          "
        >
          <strong
            style="
              display:block;
              color:${CREAM};
              font-size:15px;
              line-height:1.5;
              font-weight:900;
              letter-spacing:.1px;
            "
          >
            📱 ثبّت ${siteName} كتطبيق
          </strong>

          <span
            style="
              display:block;
              margin-top:2px;
              color:rgba(247,241,227,.72);
              font-size:12px;
              line-height:1.6;
              font-weight:600;
            "
          >
            وصول أسرع للموقع من شاشة موبايلك
          </span>
        </div>


        <!-- Install -->
        <button
          type="button"
          id="pwaInstallBtn"
          aria-label="تثبيت تطبيق أبو طارق"
          style="
            position:relative;
            min-width:86px;
            min-height:42px;
            padding:0 18px;

            background:
              linear-gradient(
                135deg,
                ${GOLD_LIGHT},
                ${GOLD}
              );

            color:${NAVY};

            border:1px solid
              rgba(255,255,255,.16);

            border-radius:12px;

            font-family:inherit;
            font-size:13px;
            font-weight:900;

            cursor:pointer;

            box-shadow:
              0 8px 20px
                rgba(212,175,55,.22);

            transition:
              transform .2s ease,
              box-shadow .2s ease,
              filter .2s ease;

            flex-shrink:0;
          "
        >
          ثبّت الآن
        </button>


        <!-- Close -->
        <button
          type="button"
          id="pwaInstallClose"
          aria-label="إغلاق"
          title="إغلاق"
          style="
            position:relative;
            width:34px;
            height:34px;
            flex:0 0 34px;

            display:flex;
            align-items:center;
            justify-content:center;

            background:
              rgba(255,255,255,.06);

            color:
              rgba(247,241,227,.72);

            border:
              1px solid
              rgba(255,255,255,.08);

            border-radius:10px;

            font-family:Arial,sans-serif;
            font-size:22px;
            line-height:1;

            cursor:pointer;

            transition:
              background .2s ease,
              color .2s ease;
          "
        >
          ×
        </button>

      </div>
    `;


    document.body.appendChild(
      banner
    );


    /* =======================================================
       BUTTON HOVER
       ======================================================= */

    const installButton =
      document.getElementById(
        "pwaInstallBtn"
      );

    if (installButton) {

      installButton.addEventListener(
        "mouseenter",
        function () {
          installButton.style.transform =
            "translateY(-2px)";

          installButton.style.boxShadow =
            "0 12px 26px rgba(212,175,55,.32)";
        }
      );

      installButton.addEventListener(
        "mouseleave",
        function () {
          installButton.style.transform =
            "translateY(0)";

          installButton.style.boxShadow =
            "0 8px 20px rgba(212,175,55,.22)";
        }
      );
    }


    /* =======================================================
       CLOSE HOVER
       ======================================================= */

    const closeButton =
      document.getElementById(
        "pwaInstallClose"
      );

    if (closeButton) {

      closeButton.addEventListener(
        "mouseenter",
        function () {
          closeButton.style.background =
            "rgba(255,255,255,.12)";

          closeButton.style.color =
            CREAM;
        }
      );

      closeButton.addEventListener(
        "mouseleave",
        function () {
          closeButton.style.background =
            "rgba(255,255,255,.06)";

          closeButton.style.color =
            "rgba(247,241,227,.72)";
        }
      );
    }


    /* =======================================================
       ANIMATE IN
       ======================================================= */

    requestAnimationFrame(
      function () {
        requestAnimationFrame(
          function () {
            banner.style.transform =
              "translateY(0)";
          }
        );
      }
    );


    /* =======================================================
       INSTALL BUTTON
       ======================================================= */

    if (installButton) {

      installButton.addEventListener(
        "click",
        async function () {

          console.log(
            "📲 Install clicked:",
            !!deferredPrompt
          );


          if (deferredPrompt) {

            try {

              deferredPrompt.prompt();

              const result =
                await deferredPrompt.userChoice;

              const outcome =
                result &&
                result.outcome
                  ? result.outcome
                  : "unknown";

              console.log(
                "PWA install choice:",
                outcome
              );


              try {
                if (
                  typeof window.aboTrack ===
                  "function"
                ) {
                  window.aboTrack(
                    "pwa_install_prompt",
                    {
                      outcome: outcome
                    }
                  );
                }
              } catch (_) {}


              deferredPrompt = null;

              hideBanner();

            } catch (error) {

              console.warn(
                "PWA prompt error:",
                error
              );

              showManualInstructions();
            }

          } else {

            showManualInstructions();
          }
        }
      );
    }


    /* =======================================================
       CLOSE BUTTON
       ======================================================= */

    if (closeButton) {

      closeButton.addEventListener(
        "click",
        function () {

          try {
            localStorage.setItem(
              "abo_tarek_pwa_banner_closed",
              String(Date.now())
            );
          } catch (_) {}

          hideBanner();
        }
      );
    }
  }


  /* =========================================================
     6. HIDE BANNER
     ========================================================= */

  function hideBanner() {

    const banner =
      document.getElementById(
        "pwaInstallBanner"
      );

    if (!banner) {
      return;
    }


    banner.style.transform =
      "translateY(120%)";


    window.setTimeout(
      function () {

        if (banner.parentNode) {
          banner.parentNode.removeChild(
            banner
          );
        }

      },
      450
    );
  }


  /* =========================================================
     7. MANUAL INSTALL INSTRUCTIONS
     ========================================================= */

  function showManualInstructions() {

    const ua =
      navigator.userAgent ||
      "";

    const isIOS =
      /iPhone|iPad|iPod/i.test(
        ua
      );

    const isAndroid =
      /Android/i.test(
        ua
      );

    let message =
      "لتثبيت تطبيق أبو طارق:\n\n";


    if (isIOS) {

      message +=
        "1. افتح الموقع من Safari\n";

      message +=
        "2. اضغط زر المشاركة (□↗)\n";

      message +=
        "3. اختر «إضافة إلى الشاشة الرئيسية»\n";

      message +=
        "4. اضغط «إضافة»";

    } else if (isAndroid) {

      message +=
        "1. افتح القائمة (⋮) في Chrome\n";

      message +=
        "2. اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»\n";

      message +=
        "3. اضغط «تثبيت»";

    } else {

      message +=
        "1. ابحث عن أيقونة التثبيت في شريط العنوان\n";

      message +=
        "2. أو افتح قائمة المتصفح\n";

      message +=
        "3. اختر «تثبيت أبو طارق»";
    }


    alert(message);
  }


  /* =========================================================
     8. SHOULD SHOW BANNER
     ========================================================= */

  function shouldShowBanner() {

    /*
      لا تظهر إذا كان الموقع مثبتاً بالفعل.
    */

    const isStandalone =
      window.matchMedia &&
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

    const isIOSStandalone =
      window.navigator &&
      window.navigator.standalone === true;

    if (
      isStandalone ||
      isIOSStandalone
    ) {
      return false;
    }


    /*
      إذا المستخدم أغلق البانر مؤخراً،
      لا نزعجه في نفس الجلسة.
    */

    try {

      const closedAt =
        Number(
          localStorage.getItem(
            "abo_tarek_pwa_banner_closed"
          ) || 0
        );

      if (
        closedAt &&
        Date.now() - closedAt <
          24 * 60 * 60 * 1000
      ) {
        return false;
      }

    } catch (_) {}


    return true;
  }


  /* =========================================================
     9. SHOW BANNER AFTER 3 SECONDS
     ========================================================= */

  function scheduleBanner() {

    if (!shouldShowBanner()) {
      return;
    }


    console.log(
      "⏰ PWA banner scheduled..."
    );


    window.setTimeout(
      function () {

        if (
          shouldShowBanner()
        ) {
          createBanner();
        }

      },
      3000
    );
  }


  /* =========================================================
     10. INIT
     ========================================================= */

  function init() {

    if (
      document.readyState ===
      "loading"
    ) {

      document.addEventListener(
        "DOMContentLoaded",
        scheduleBanner,
        {
          once: true
        }
      );

    } else {

      scheduleBanner();
    }
  }


  init();


  /* =========================================================
     11. PUBLIC API
     ========================================================= */

  window.showInstallBanner =
    createBanner;

  window.hideInstallBanner =
    hideBanner;

  window.ABO_TAREK_PWA = {

    createBanner:
      createBanner,

    hideBanner:
      hideBanner,

    showManualInstructions:
      showManualInstructions,

    isInstallPromptAvailable:
      function () {
        return !!deferredPrompt;
      },

    isStandalone:
      function () {

        const standalone =
          window.matchMedia &&
          window.matchMedia(
            "(display-mode: standalone)"
          ).matches;

        const ios =
          window.navigator &&
          window.navigator.standalone === true;

        return !!(
          standalone ||
          ios
        );
      }
  };


  console.log(
    "✅ pwa.js loaded - Dark Navy Luxury"
  );

})();/* =========================================================
   ABO TAREK STORE - PWA REGISTRATION
   DARK NAVY LUXURY EDITION
   Service Worker + Install Banner
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     0. CONFIG
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};
  const CFG =
    ROOT.CONFIG ||
    window.ABO_TAREK_CONFIG ||
    {};

  const COLORS = CFG.COLORS || {};

  const NAVY =
    COLORS.NAVY ||
    COLORS.navy ||
    "#071321";

  const NAVY_2 =
    COLORS.NAVY_2 ||
    COLORS.navy2 ||
    "#0D2238";

  const CREAM =
    COLORS.CREAM ||
    COLORS.cream ||
    "#F7F1E3";

  const GOLD =
    COLORS.GOLD ||
    COLORS.gold ||
    "#D4AF37";

  const GOLD_LIGHT =
    COLORS.GOLD_LIGHT ||
    COLORS.goldLight ||
    "#E8C85A";

  const TEXT =
    COLORS.TEXT ||
    COLORS.text ||
    "#172333";

  const MUTED =
    COLORS.MUTED ||
    COLORS.muted ||
    "#718096";

  const WHATSAPP =
    COLORS.WHATSAPP ||
    "#25D366";


  /* =========================================================
     1. SERVICE WORKER
     ========================================================= */

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.log("ℹ️ Service Worker غير مدعوم");
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("./sw.js", {
          scope: "./"
        })
        .then(function (registration) {
          console.log(
            "✅ Abu Tarek Service Worker registered:",
            registration.scope
          );
        })
        .catch(function (error) {
          console.warn(
            "⚠️ Abu Tarek Service Worker failed:",
            error
          );
        });
    });
  }

  registerServiceWorker();


  /* =========================================================
     2. INSTALL PROMPT
     ========================================================= */

  let deferredPrompt = null;

  window.addEventListener(
    "beforeinstallprompt",
    function (event) {
      event.preventDefault();

      deferredPrompt = event;

      console.log(
        "✅ PWA install prompt captured"
      );

      window.dispatchEvent(
        new CustomEvent("abo:tarek:pwa-ready")
      );
    }
  );


  /* =========================================================
     3. APP INSTALLED
     ========================================================= */

  window.addEventListener(
    "appinstalled",
    function () {
      console.log(
        "✅ أبو طارق تم تثبيته كتطبيق"
      );

      deferredPrompt = null;

      hideBanner();

      try {
        if (typeof window.aboTrack === "function") {
          window.aboTrack(
            "pwa_installed",
            {
              source: "install_banner"
            }
          );
        }
      } catch (error) {
        console.warn(
          "PWA analytics error:",
          error
        );
      }
    }
  );


  /* =========================================================
     4. HELPERS
     ========================================================= */

  function safeText(value, fallback) {
    const text = String(
      value == null ? "" : value
    ).trim();

    return text || fallback;
  }


  function escapeHTML(value) {
    return String(
      value == null ? "" : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function getSiteName() {
    const site =
      CFG.SITE ||
      {};

    return safeText(
      site.NAME ||
      site.name ||
      document.title ||
      "أبو طارق",
      "أبو طارق"
    );
  }


  /* =========================================================
     5. CREATE INSTALL BANNER
     ========================================================= */

  function createBanner() {
    if (!document.body) {
      return;
    }

    if (
      document.getElementById(
        "pwaInstallBanner"
      )
    ) {
      return;
    }

    /*
      لا نظهر البانر إذا كان التطبيق مفتوحاً
      بالفعل في وضع standalone.
    */

    const isStandalone =
      window.matchMedia &&
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

    const isIOSStandalone =
      window.navigator &&
      window.navigator.standalone === true;

    if (
      isStandalone ||
      isIOSStandalone
    ) {
      return;
    }


    const siteName =
      escapeHTML(
        getSiteName()
      );


    const banner =
      document.createElement("div");

    banner.id =
      "pwaInstallBanner";

    banner.setAttribute(
      "role",
      "dialog"
    );

    banner.setAttribute(
      "aria-label",
      "تثبيت تطبيق أبو طارق"
    );

    banner.style.cssText = `
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 99999;
      padding: 14px;
      pointer-events: none;
      transform: translateY(120%);
      transition:
        transform 0.45s cubic-bezier(.2,.8,.2,1);
      direction: rtl;
      font-family: Cairo, Tahoma, Arial, sans-serif;
    `;


    banner.innerHTML = `
      <div
        style="
          position:relative;
          display:flex;
          align-items:center;
          gap:14px;
          width:min(720px,100%);
          min-height:76px;
          margin:0 auto;
          padding:12px 14px;
          box-sizing:border-box;

          background:
            linear-gradient(
              135deg,
              ${NAVY} 0%,
              ${NAVY_2} 100%
            );

          border:1px solid
            rgba(212,175,55,.55);

          border-radius:20px;

          box-shadow:
            0 20px 60px
              rgba(0,0,0,.28),
            0 0 0 1px
              rgba(255,255,255,.04)
              inset;

          pointer-events:auto;
          overflow:hidden;
        "
      >

        <!-- Luxury glow -->
        <span
          aria-hidden="true"
          style="
            position:absolute;
            width:180px;
            height:180px;
            top:-100px;
            left:-40px;
            border-radius:50%;
            background:
              radial-gradient(
                circle,
                rgba(212,175,55,.18) 0%,
                rgba(212,175,55,0) 70%
              );
            pointer-events:none;
          "
        ></span>


        <!-- Logo -->
        <div
          style="
            position:relative;
            width:54px;
            height:54px;
            flex:0 0 54px;
            display:flex;
            align-items:center;
            justify-content:center;
            border-radius:15px;

            background:
              linear-gradient(
                145deg,
                ${CREAM},
                #fffaf0
              );

            border:1px solid
              rgba(212,175,55,.65);

            box-shadow:
              0 8px 24px
                rgba(0,0,0,.18);
          "
        >
          <img
            src="./assets/logo.png"
            alt="أبو طارق"
            style="
              width:44px;
              height:44px;
              object-fit:contain;
              display:block;
              border-radius:10px;
            "
            onerror="
              this.style.display='none';
              this.parentNode.innerHTML='<span style=&quot;color:${GOLD};font-size:24px;font-weight:900&quot;>أ</span>';
            "
          >
        </div>


        <!-- Text -->
        <div
          style="
            position:relative;
            flex:1;
            min-width:0;
            text-align:right;
          "
        >
          <strong
            style="
              display:block;
              color:${CREAM};
              font-size:15px;
              line-height:1.5;
              font-weight:900;
              letter-spacing:.1px;
            "
          >
            📱 ثبّت ${siteName} كتطبيق
          </strong>

          <span
            style="
              display:block;
              margin-top:2px;
              color:rgba(247,241,227,.72);
              font-size:12px;
              line-height:1.6;
              font-weight:600;
            "
          >
            وصول أسرع للموقع من شاشة موبايلك
          </span>
        </div>


        <!-- Install -->
        <button
          type="button"
          id="pwaInstallBtn"
          aria-label="تثبيت تطبيق أبو طارق"
          style="
            position:relative;
            min-width:86px;
            min-height:42px;
            padding:0 18px;

            background:
              linear-gradient(
                135deg,
                ${GOLD_LIGHT},
                ${GOLD}
              );

            color:${NAVY};

            border:1px solid
              rgba(255,255,255,.16);

            border-radius:12px;

            font-family:inherit;
            font-size:13px;
            font-weight:900;

            cursor:pointer;

            box-shadow:
              0 8px 20px
                rgba(212,175,55,.22);

            transition:
              transform .2s ease,
              box-shadow .2s ease,
              filter .2s ease;

            flex-shrink:0;
          "
        >
          ثبّت الآن
        </button>


        <!-- Close -->
        <button
          type="button"
          id="pwaInstallClose"
          aria-label="إغلاق"
          title="إغلاق"
          style="
            position:relative;
            width:34px;
            height:34px;
            flex:0 0 34px;

            display:flex;
            align-items:center;
            justify-content:center;

            background:
              rgba(255,255,255,.06);

            color:
              rgba(247,241,227,.72);

            border:
              1px solid
              rgba(255,255,255,.08);

            border-radius:10px;

            font-family:Arial,sans-serif;
            font-size:22px;
            line-height:1;

            cursor:pointer;

            transition:
              background .2s ease,
              color .2s ease;
          "
        >
          ×
        </button>

      </div>
    `;


    document.body.appendChild(
      banner
    );


    /* =======================================================
       BUTTON HOVER
       ======================================================= */

    const installButton =
      document.getElementById(
        "pwaInstallBtn"
      );

    if (installButton) {

      installButton.addEventListener(
        "mouseenter",
        function () {
          installButton.style.transform =
            "translateY(-2px)";

          installButton.style.boxShadow =
            "0 12px 26px rgba(212,175,55,.32)";
        }
      );

      installButton.addEventListener(
        "mouseleave",
        function () {
          installButton.style.transform =
            "translateY(0)";

          installButton.style.boxShadow =
            "0 8px 20px rgba(212,175,55,.22)";
        }
      );
    }


    /* =======================================================
       CLOSE HOVER
       ======================================================= */

    const closeButton =
      document.getElementById(
        "pwaInstallClose"
      );

    if (closeButton) {

      closeButton.addEventListener(
        "mouseenter",
        function () {
          closeButton.style.background =
            "rgba(255,255,255,.12)";

          closeButton.style.color =
            CREAM;
        }
      );

      closeButton.addEventListener(
        "mouseleave",
        function () {
          closeButton.style.background =
            "rgba(255,255,255,.06)";

          closeButton.style.color =
            "rgba(247,241,227,.72)";
        }
      );
    }


    /* =======================================================
       ANIMATE IN
       ======================================================= */

    requestAnimationFrame(
      function () {
        requestAnimationFrame(
          function () {
            banner.style.transform =
              "translateY(0)";
          }
        );
      }
    );


    /* =======================================================
       INSTALL BUTTON
       ======================================================= */

    if (installButton) {

      installButton.addEventListener(
        "click",
        async function () {

          console.log(
            "📲 Install clicked:",
            !!deferredPrompt
          );


          if (deferredPrompt) {

            try {

              deferredPrompt.prompt();

              const result =
                await deferredPrompt.userChoice;

              const outcome =
                result &&
                result.outcome
                  ? result.outcome
                  : "unknown";

              console.log(
                "PWA install choice:",
                outcome
              );


              try {
                if (
                  typeof window.aboTrack ===
                  "function"
                ) {
                  window.aboTrack(
                    "pwa_install_prompt",
                    {
                      outcome: outcome
                    }
                  );
                }
              } catch (_) {}


              deferredPrompt = null;

              hideBanner();

            } catch (error) {

              console.warn(
                "PWA prompt error:",
                error
              );

              showManualInstructions();
            }

          } else {

            showManualInstructions();
          }
        }
      );
    }


    /* =======================================================
       CLOSE BUTTON
       ======================================================= */

    if (closeButton) {

      closeButton.addEventListener(
        "click",
        function () {

          try {
            localStorage.setItem(
              "abo_tarek_pwa_banner_closed",
              String(Date.now())
            );
          } catch (_) {}

          hideBanner();
        }
      );
    }
  }


  /* =========================================================
     6. HIDE BANNER
     ========================================================= */

  function hideBanner() {

    const banner =
      document.getElementById(
        "pwaInstallBanner"
      );

    if (!banner) {
      return;
    }


    banner.style.transform =
      "translateY(120%)";


    window.setTimeout(
      function () {

        if (banner.parentNode) {
          banner.parentNode.removeChild(
            banner
          );
        }

      },
      450
    );
  }


  /* =========================================================
     7. MANUAL INSTALL INSTRUCTIONS
     ========================================================= */

  function showManualInstructions() {

    const ua =
      navigator.userAgent ||
      "";

    const isIOS =
      /iPhone|iPad|iPod/i.test(
        ua
      );

    const isAndroid =
      /Android/i.test(
        ua
      );

    let message =
      "لتثبيت تطبيق أبو طارق:\n\n";


    if (isIOS) {

      message +=
        "1. افتح الموقع من Safari\n";

      message +=
        "2. اضغط زر المشاركة (□↗)\n";

      message +=
        "3. اختر «إضافة إلى الشاشة الرئيسية»\n";

      message +=
        "4. اضغط «إضافة»";

    } else if (isAndroid) {

      message +=
        "1. افتح القائمة (⋮) في Chrome\n";

      message +=
        "2. اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»\n";

      message +=
        "3. اضغط «تثبيت»";

    } else {

      message +=
        "1. ابحث عن أيقونة التثبيت في شريط العنوان\n";

      message +=
        "2. أو افتح قائمة المتصفح\n";

      message +=
        "3. اختر «تثبيت أبو طارق»";
    }


    alert(message);
  }


  /* =========================================================
     8. SHOULD SHOW BANNER
     ========================================================= */

  function shouldShowBanner() {

    /*
      لا تظهر إذا كان الموقع مثبتاً بالفعل.
    */

    const isStandalone =
      window.matchMedia &&
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

    const isIOSStandalone =
      window.navigator &&
      window.navigator.standalone === true;

    if (
      isStandalone ||
      isIOSStandalone
    ) {
      return false;
    }


    /*
      إذا المستخدم أغلق البانر مؤخراً،
      لا نزعجه في نفس الجلسة.
    */

    try {

      const closedAt =
        Number(
          localStorage.getItem(
            "abo_tarek_pwa_banner_closed"
          ) || 0
        );

      if (
        closedAt &&
        Date.now() - closedAt <
          24 * 60 * 60 * 1000
      ) {
        return false;
      }

    } catch (_) {}


    return true;
  }


  /* =========================================================
     9. SHOW BANNER AFTER 3 SECONDS
     ========================================================= */

  function scheduleBanner() {

    if (!shouldShowBanner()) {
      return;
    }


    console.log(
      "⏰ PWA banner scheduled..."
    );


    window.setTimeout(
      function () {

        if (
          shouldShowBanner()
        ) {
          createBanner();
        }

      },
      3000
    );
  }


  /* =========================================================
     10. INIT
     ========================================================= */

  function init() {

    if (
      document.readyState ===
      "loading"
    ) {

      document.addEventListener(
        "DOMContentLoaded",
        scheduleBanner,
        {
          once: true
        }
      );

    } else {

      scheduleBanner();
    }
  }


  init();


  /* =========================================================
     11. PUBLIC API
     ========================================================= */

  window.showInstallBanner =
    createBanner;

  window.hideInstallBanner =
    hideBanner;

  window.ABO_TAREK_PWA = {

    createBanner:
      createBanner,

    hideBanner:
      hideBanner,

    showManualInstructions:
      showManualInstructions,

    isInstallPromptAvailable:
      function () {
        return !!deferredPrompt;
      },

    isStandalone:
      function () {

        const standalone =
          window.matchMedia &&
          window.matchMedia(
            "(display-mode: standalone)"
          ).matches;

        const ios =
          window.navigator &&
          window.navigator.standalone === true;

        return !!(
          standalone ||
          ios
        );
      }
  };


  console.log(
    "✅ pwa.js loaded - Dark Navy Luxury"
  );

})();
