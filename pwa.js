/* =========================================================
   ABO TAREK STORE
   PWA.JS
   Progressive Web App Controller
   DARK NAVY LUXURY
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const ROOT = window.ABO_TAREK || {};
  const CFG =
    ROOT.CONFIG ||
    window.ABO_TAREK_CONFIG ||
    {};

  const PWA_CONFIG = {
    enabled:
      CFG?.PWA?.ENABLED !== false,

    serviceWorker:
      String(
        CFG?.PWA?.SERVICE_WORKER ||
        "./sw.js"
      ).trim(),

    scope:
      String(
        CFG?.PWA?.SCOPE ||
        "./"
      ).trim()
  };


  /* =========================================================
     STATE
     ========================================================= */

  const state = {
    initialized: false,
    registration: null,
    installPrompt: null,
    installed: false
  };


  /* =========================================================
     HELPERS
     ========================================================= */

  function isStandalone() {
    return (
      window.matchMedia &&
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches
    ) ||
    window.navigator.standalone === true;
  }


  function dispatch(name, detail = {}) {
    try {
      window.dispatchEvent(
        new CustomEvent(
          name,
          { detail }
        )
      );
    } catch (error) {
      /* Silent by design */
    }
  }


  function showInstallButton() {

    const buttons =
      document.querySelectorAll(
        "#installAppBtn, [data-install-app]"
      );

    buttons.forEach(
      function (button) {

        button.hidden = false;

        button.style.removeProperty(
          "display"
        );

        button.removeAttribute(
          "aria-hidden"
        );
      }
    );
  }


  function hideInstallButton() {

    const buttons =
      document.querySelectorAll(
        "#installAppBtn, [data-install-app]"
      );

    buttons.forEach(
      function (button) {

        button.hidden = true;

        button.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    );
  }


  /* =========================================================
     INSTALL PROMPT
     ========================================================= */

  async function promptInstall() {

    if (
      !state.installPrompt
    ) {
      return {
        accepted: false,
        available: false
      };
    }

    const promptEvent =
      state.installPrompt;

    state.installPrompt =
      null;

    hideInstallButton();


    try {

      await promptEvent.prompt();

      const choice =
        await promptEvent.userChoice;

      dispatch(
        "abo-tarek:pwa-install-result",
        {
          outcome:
            choice?.outcome ||
            "unknown"
        }
      );

      return {
        accepted:
          choice?.outcome ===
          "accepted",

        available: true,

        outcome:
          choice?.outcome ||
          "unknown"
      };

    } catch (error) {

      return {
        accepted: false,
        available: false
      };
    }
  }


  /* =========================================================
     SERVICE WORKER UPDATE
     ========================================================= */

  function watchRegistration(
    registration
  ) {

    if (!registration) {
      return;
    }


    if (
      registration.waiting
    ) {

      dispatch(
        "abo-tarek:pwa-update-ready",
        {
          registration
        }
      );
    }


    registration.addEventListener(
      "updatefound",
      function () {

        const worker =
          registration.installing;

        if (!worker) {
          return;
        }


        worker.addEventListener(
          "statechange",
          function () {

            if (
              worker.state ===
                "installed" &&
              navigator.serviceWorker
            ) {

              if (
                navigator.serviceWorker
                  .controller
              ) {

                dispatch(
                  "abo-tarek:pwa-update-ready",
                  {
                    registration
                  }
                );

              } else {

                dispatch(
                  "abo-tarek:pwa-ready",
                  {
                    registration
                  }
                );
              }
            }
          }
        );
      }
    );
  }


  /* =========================================================
     SERVICE WORKER REGISTRATION
     ========================================================= */

  async function registerServiceWorker() {

    if (
      !PWA_CONFIG.enabled
    ) {
      return null;
    }


    if (
      !("serviceWorker" in navigator)
    ) {
      return null;
    }


    /*
      Service workers require HTTPS
      except for localhost.
    */

    const secure =
      window.location.protocol ===
        "https:" ||
      window.location.hostname ===
        "localhost" ||
      window.location.hostname ===
        "127.0.0.1";

    if (!secure) {
      return null;
    }


    try {

      const registration =
        await navigator.serviceWorker.register(
          PWA_CONFIG.serviceWorker,
          {
            scope:
              PWA_CONFIG.scope
          }
        );

      state.registration =
        registration;


      watchRegistration(
        registration
      );


      dispatch(
        "abo-tarek:pwa-registered",
        {
          registration
        }
      );


      return registration;

    } catch (error) {

      console.warn(
        "ABO TAREK PWA registration failed:",
        error
      );

      dispatch(
        "abo-tarek:pwa-error",
        {
          error
        }
      );

      return null;
    }
  }


  /* =========================================================
     SERVICE WORKER MESSAGE HANDLER
     ========================================================= */

  function bindServiceWorkerMessages() {

    if (
      !("serviceWorker" in navigator)
    ) {
      return;
    }


    navigator.serviceWorker.addEventListener(
      "message",
      function (event) {

        const data =
          event.data || {};


        if (
          data.type ===
          "ABO_TAREK_SW_READY"
        ) {

          dispatch(
            "abo-tarek:pwa-ready",
            data
          );
        }


        if (
          data.type ===
          "ABO_TAREK_SW_UPDATED"
        ) {

          dispatch(
            "abo-tarek:pwa-updated",
            data
          );
        }
      }
    );
  }


  /* =========================================================
     INSTALL EVENT
     ========================================================= */

  function bindInstallEvents() {

    window.addEventListener(
      "beforeinstallprompt",
      function (event) {

        event.preventDefault();

        state.installPrompt =
          event;


        if (!isStandalone()) {
          showInstallButton();
        }


        dispatch(
          "abo-tarek:pwa-install-available"
        );
      }
    );


    window.addEventListener(
      "appinstalled",
      function () {

        state.installed =
          true;

        state.installPrompt =
          null;

        hideInstallButton();


        dispatch(
          "abo-tarek:pwa-installed"
        );
      }
    );


    document.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            "#installAppBtn, [data-install-app]"
          );

        if (!button) {
          return;
        }

        event.preventDefault();

        promptInstall();
      }
    );
  }


  /* =========================================================
     VISIBILITY / UPDATE CHECK
     ========================================================= */

  function bindVisibility() {

    document.addEventListener(
      "visibilitychange",
      function () {

        if (
          document.visibilityState !==
          "visible"
        ) {
          return;
        }


        if (
          state.registration &&
          typeof state.registration
            .update ===
            "function"
        ) {

          state.registration
            .update()
            .catch(
              function () {
                /* Silent */
              }
            );
        }
      }
    );
  }


  /* =========================================================
     INIT
     ========================================================= */

  async function init() {

    if (
      state.initialized
    ) {
      return;
    }

    state.initialized =
      true;

    state.installed =
      isStandalone();


    if (state.installed) {
      hideInstallButton();
    }


    bindInstallEvents();
    bindServiceWorkerMessages();
    bindVisibility();


    /*
      Register after the page has loaded
      so PWA never blocks the first render.
    */

    if (
      document.readyState ===
      "complete"
    ) {

      registerServiceWorker();

    } else {

      window.addEventListener(
        "load",
        function () {
          registerServiceWorker();
        },
        {
          once: true
        }
      );
    }


    dispatch(
      "abo-tarek:pwa-initialized",
      {
        enabled:
          PWA_CONFIG.enabled,

        installed:
          state.installed
      }
    );
  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.ABO_TAREK_PWA = {

    init,

    register:
      registerServiceWorker,

    install:
      promptInstall,

    isInstalled:
      isStandalone,

    getRegistration:
      function () {
        return state.registration;
      },

    isInstallAvailable:
      function () {
        return !!state.installPrompt;
      },

    status:
      function () {

        return {
          initialized:
            state.initialized,

          enabled:
            PWA_CONFIG.enabled,

          installed:
            isStandalone(),

          installAvailable:
            !!state.installPrompt,

          serviceWorkerSupported:
            "serviceWorker" in
            navigator,

          registration:
            !!state.registration
        };
      }
  };


  /* =========================================================
     START
     ========================================================= */

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

})();
