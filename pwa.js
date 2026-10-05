/* =========================================================
   ABO TAREK STORE - PWA REGISTRATION
   Banner دايماً يظهر (Android + iOS)
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     1. تسجيل Service Worker
     ========================================================= */

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { scope: "./" })
        .then(() => console.log("✅ SW registered"))
        .catch(err => console.warn("SW failed:", err));
    });
  }

  /* =========================================================
     2. Install Banner
     ========================================================= */

  const BANNER_SHOWN_KEY = "abo_tarek_banner_shown_v1";
  let deferredPrompt = null;

  // مراقبة Chrome install prompt
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("✅ Install prompt available");
  });

  // لما يتثبت
  window.addEventListener("appinstalled", () => {
    console.log("✅ App installed");
    hideBanner();
    try { localStorage.setItem(BANNER_SHOWN_KEY, "1"); } catch (err) {}
  });

  /* =========================================================
     BANNER UI
     ========================================================= */

  function createBanner() {
    if (document.getElementById("pwaInstallBanner")) return;

    const banner = document.createElement("div");
    banner.id = "pwaInstallBanner";
    banner.className = "pwa-install-banner";
    banner.innerHTML = `
      <div class="pwa-install-content">
        <img src="./assets/logo.png" alt="أبو طارق" class="pwa-install-logo">
        <div class="pwa-install-text">
          <strong>📱 ثبّت تطبيق أبو طارق</strong>
          <span>للوصول السريع من شاشة موبايلك</span>
        </div>
        <button type="button" class="pwa-install-btn" id="pwaInstallBtn">ثبّت</button>
        <button type="button" class="pwa-install-close" id="pwaInstallClose" aria-label="إغلاق">×</button>
      </div>
    `;
    document.body.appendChild(banner);

    // أظهر البانر بعد 100ms
    setTimeout(() => banner.classList.add("show"), 100);

    // زر التثبيت
    document.getElementById("pwaInstallBtn").addEventListener("click", async () => {
      if (deferredPrompt) {
        // Chrome / Android
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("User choice:", outcome);
        deferredPrompt = null;
        hideBanner();
      } else {
        // iOS أو متصفح مش بيدعم
        showIOSInstructions();
      }
    });

    // زر الإغلاق
    document.getElementById("pwaInstallClose").addEventListener("click", () => {
      hideBanner();
      try { localStorage.setItem(BANNER_SHOWN_KEY, "1"); } catch (err) {}
    });
  }

  function hideBanner() {
    const banner = document.getElementById("pwaInstallBanner");
    if (banner) banner.classList.remove("show");
  }

  function showIOSInstructions() {
    alert("لتثبيت التطبيق على الآيفون:\n\n1. اضغط زر المشاركة (□↗) في الأسفل\n2. اختر 'إضافة إلى الشاشة الرئيسية'\n3. اضغط 'إضافة'");
  }

  /* =========================================================
     3. اكتشاف نوع الجهاز
     ========================================================= */

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;
  }

  /* =========================================================
     4. Show Banner Logic
     ========================================================= */

  function maybeShowBanner() {
    // ميعرضوش لو التطبيق مثبت خلاص
    if (isStandalone()) return;

    // ميعرضوش على الكمبيوتر (بانر مخصص للموبايل بس)
    if (!isMobile()) return;

    // ميعرضوش لو المستخدم رفض قبل كده
    try {
      if (localStorage.getItem(BANNER_SHOWN_KEY) === "1") return;
    } catch (err) {}

    // استنى 8 ثواني الأول
    setTimeout(createBanner, 8000);
  }

  /* =========================================================
     RUN
     ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeShowBanner);
  } else {
    maybeShowBanner();
  }

  console.log("✅ pwa.js loaded");

})();
