/* =========================================================
   ABO TAREK STORE - PWA REGISTRATION
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     تسجيل Service Worker
     ========================================================= */

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", {
        scope: "./"
      })
      .then(reg => {
        console.log("✅ Service Worker registered");
      })
      .catch(err => {
        console.warn("Service Worker registration failed:", err);
      });
    });
  }

  /* =========================================================
     Install Prompt - "ثبت التطبيق" banner
     ========================================================= */

  let deferredPrompt = null;
  const INSTALL_DISMISSED_KEY = "abo_tarek_install_dismissed";

  function createInstallBanner() {
    if (document.getElementById("pwaInstallBanner")) return;

    const banner = document.createElement("div");
    banner.id = "pwaInstallBanner";
    banner.className = "pwa-install-banner";
    banner.innerHTML = `
      <div class="pwa-install-content">
        <img src="./assets/logo.png" alt="أبو طارق" class="pwa-install-logo">
        <div class="pwa-install-text">
          <strong>ثبّت تطبيق أبو طارق</strong>
          <span>للوصول السريع من شاشة موبايلك</span>
        </div>
        <button type="button" class="pwa-install-btn" id="pwaInstallBtn">ثبّت</button>
        <button type="button" class="pwa-install-close" id="pwaInstallClose" aria-label="إغلاق">×</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById("pwaInstallBtn").addEventListener("click", async () => {
      banner.classList.remove("show");
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("Install outcome:", outcome);
        deferredPrompt = null;
      }
    });

    document.getElementById("pwaInstallClose").addEventListener("click", () => {
      banner.classList.remove("show");
      try {
        localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
      } catch (err) {}
    });

    // Show animation
    setTimeout(() => banner.classList.add("show"), 100);
  }

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;

    // لو المستخدم رفض قبل كده، متعرضش تاني
    try {
      if (localStorage.getItem(INSTALL_DISMISSED_KEY) === "1") return;
    } catch (err) {}

    createInstallBanner();
  });

  window.addEventListener("appinstalled", () => {
    console.log("✅ App installed");
    const banner = document.getElementById("pwaInstallBanner");
    if (banner) banner.classList.remove("show");
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    } catch (err) {}
  });

  console.log("✅ pwa.js loaded");

})();
