/* =========================================================
   ABO TAREK STORE - PWA REGISTRATION
   Banner يظهر بعد 3 ثواني على أي جهاز
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     1. Service Worker
     ========================================================= */

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { scope: "./" })
        .then(() => console.log("✅ SW registered"))
        .catch(err => console.warn("SW failed:", err));
    });
  }

  /* =========================================================
     2. Install Prompt
     ========================================================= */

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("✅ Install prompt captured");
  });

  window.addEventListener("appinstalled", () => {
    console.log("✅ App installed");
    hideBanner();
  });

  /* =========================================================
     3. Banner UI
     ========================================================= */

  function createBanner() {
    console.log("🎯 Creating banner...");

    if (document.getElementById("pwaInstallBanner")) {
      console.log("Banner already exists");
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
      padding: 16px;
      transform: translateY(100%);
      transition: transform 0.4s ease;
    `;

    banner.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: #ffffff;
        border: 2px solid #e67b20;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(10, 31, 51, 0.25);
        max-width: 640px;
        margin: 0 auto;
      ">
        <img src="./assets/logo.png" alt="أبو طارق" style="width:48px;height:48px;object-fit:contain;border-radius:8px;background:#fff5e6;padding:4px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <strong style="display:block;color:#0a1f33;font-size:14px;font-weight:900;font-family:Cairo,sans-serif">📱 ثبّت تطبيق أبو طارق</strong>
          <span style="display:block;color:#718096;font-size:12px;margin-top:2px;font-family:Cairo,sans-serif">للوصول السريع من شاشة موبايلك</span>
        </div>
        <button type="button" id="pwaInstallBtn" style="
          min-height:40px;
          padding:0 20px;
          background:#e67b20;
          color:#fff;
          border-radius:12px;
          font-size:13px;
          font-weight:900;
          cursor:pointer;
          border:none;
          flex-shrink:0;
          font-family:Cairo,sans-serif;
        ">ثبّت</button>
        <button type="button" id="pwaInstallClose" style="
          width:32px;
          height:32px;
          background:transparent;
          color:#718096;
          border:none;
          border-radius:8px;
          font-size:20px;
          cursor:pointer;
          flex-shrink:0;
        ">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      banner.style.transform = "translateY(0)";
    });

    // Install button
    document.getElementById("pwaInstallBtn").addEventListener("click", async () => {
      console.log("Install clicked, deferredPrompt:", !!deferredPrompt);

      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log("User choice:", outcome);
          deferredPrompt = null;
          hideBanner();
        } catch (err) {
          console.error("Prompt error:", err);
          showManualInstructions();
        }
      } else {
        showManualInstructions();
      }
    });

    // Close button
    document.getElementById("pwaInstallClose").addEventListener("click", hideBanner);
  }

  function hideBanner() {
    const banner = document.getElementById("pwaInstallBanner");
    if (banner) {
      banner.style.transform = "translateY(100%)";
      setTimeout(() => banner.remove(), 400);
    }
  }

  function showManualInstructions() {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    let msg = "لتثبيت التطبيق:\n\n";

    if (isIOS) {
      msg += "1. اضغط زر المشاركة (□↗) في Safari\n";
      msg += "2. اختر 'إضافة إلى الشاشة الرئيسية'\n";
      msg += "3. اضغط 'إضافة'";
    } else if (isAndroid) {
      msg += "1. اضغط على القائمة (⋮) في Chrome\n";
      msg += "2. اختر 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'\n";
      msg += "3. اضغط 'تثبيت'";
    } else {
      msg += "1. اضغط على أيقونة التثبيت في شريط العناوين\n";
      msg += "2. أو من القائمة → 'تثبيت أبو طارق'";
    }

    alert(msg);
  }

  /* =========================================================
     4. Show Banner after 3 seconds
     ========================================================= */

  function scheduleBanner() {
    console.log("⏰ Banner scheduled for 3 seconds...");
    setTimeout(createBanner, 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleBanner);
  } else {
    scheduleBanner();
  }

  /* =========================================================
     5. Force show (للاختبار)
     ========================================================= */

  window.showInstallBanner = createBanner;
  window.hideInstallBanner = hideBanner;

  console.log("✅ pwa.js loaded");

})();
