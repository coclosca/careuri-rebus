/* PlayLudiq · home page: "Invită prieteni" share button and the
   "Joacă și fără internet" install sheet. */
(function setUpHome() {
  "use strict";

  const SHARE_DATA = {
    title: "PlayLudiq",
    text: "Joacă integrame, jocuri de cărți și teste școlare pe PlayLudiq.",
    url: "https://playludiq.com/",
  };
  const COPIED_MESSAGE = "Link copiat";
  const TOAST_DURATION_MS = 1800;

  const offlineSheet = document.getElementById("offlineSheet");
  bindShareButtons();
  bindOfflineSheet();

  // --- Share --------------------------------------------------------------
  function bindShareButtons() {
    document.querySelectorAll("[data-share]").forEach((button) => {
      button.addEventListener("click", shareSite);
    });
  }

  async function shareSite() {
    if (navigator.share) {
      try {
        await navigator.share(SHARE_DATA);
      } catch (error) {
        if (error.name !== "AbortError") console.warn("[home] share failed", error);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(SHARE_DATA.url);
      showToast(COPIED_MESSAGE);
    } catch (error) {
      console.warn("[home] copy failed", error);
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.append(toast);
    setTimeout(() => toast.remove(), TOAST_DURATION_MS);
  }

  // --- Offline install sheet ----------------------------------------------
  function bindOfflineSheet() {
    if (!offlineSheet) return;
    document.querySelectorAll("[data-offline-open]").forEach((button) => button.addEventListener("click", openSheet));
    offlineSheet.querySelectorAll("[data-offline-close]").forEach((button) => button.addEventListener("click", closeSheet));
    offlineSheet.addEventListener("click", (event) => { if (event.target === offlineSheet) closeSheet(); });
  }

  function openSheet() {
    offlineSheet.hidden = false;
    document.addEventListener("keydown", closeOnEscape);
    offlineSheet.querySelector("[data-offline-close]").focus();
  }

  function closeSheet() {
    offlineSheet.hidden = true;
    document.removeEventListener("keydown", closeOnEscape);
  }

  function closeOnEscape(event) {
    if (event.key === "Escape") closeSheet();
  }
})();
