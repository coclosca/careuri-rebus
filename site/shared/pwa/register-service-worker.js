/* PlayLudiq · registers the offline cache (sw.js).
   Pages work without it; a failed registration is only noted in the console. */
(function registerServiceWorker() {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("[pwa] offline cache not registered", error);
    });
  });
})();
