/* ==========================================================================
   PlayLudiq colour themes - one choice for the whole site.
   Loaded in <head> WITHOUT defer, so the saved theme is applied before the
   page paints (no flash). Then it adds the theme button to the header.
   Themes are defined in styles/tokens.css (:root[data-skin="..."]).
   ========================================================================== */
(function setUpThemes() {
  "use strict";

  const STORAGE_KEY = "pl_theme";
  const LEGACY_KEY = "ic_skin"; // the old Integrame-only choice, carried over once
  const THEMES = [
    { id: "", name: "Hârtie (automat)", mode: "" },
    { id: "clasic", name: "Clasic", mode: "light" },
    { id: "noapte", name: "Noapte", mode: "dark" },
    { id: "azur", name: "Azur", mode: "light" },
    { id: "sepia", name: "Sepia", mode: "light" },
  ];
  const ICON_PALETTE = '<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#palette"/></svg>';

  const root = document.documentElement;
  applyTheme(readTheme());
  document.addEventListener("DOMContentLoaded", buildPicker);

  // --- State ----------------------------------------------------------------
  function readTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) return saved;
      return localStorage.getItem(LEGACY_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function saveTheme(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (error) {
      console.warn("[theme] choice not saved", error);
    }
  }

  /** A theme sets data-skin (its colours) and data-theme (light or dark base). */
  function applyTheme(id) {
    const theme = THEMES.find((candidate) => candidate.id === id) || THEMES[0];
    if (theme.id) root.dataset.skin = theme.id;
    else delete root.dataset.skin;
    if (theme.mode) root.dataset.theme = theme.mode;
    else delete root.dataset.theme;
    return theme.id;
  }

  // --- Header picker --------------------------------------------------------
  function buildPicker() {
    const bar = document.querySelector(".top-bar");
    if (!bar) return;
    const picker = document.createElement("div");
    picker.className = "theme-picker";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-picker__toggle";
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = ICON_PALETTE + '<span class="visually-hidden">Culori</span>';

    const menu = document.createElement("div");
    menu.className = "theme-picker__menu";
    menu.setAttribute("role", "radiogroup");
    menu.setAttribute("aria-label", "Culorile site-ului");
    menu.hidden = true;
    THEMES.forEach((theme) => menu.append(createSwatch(theme)));

    picker.append(toggle, menu);
    bar.append(picker);
    markCurrent(menu);

    toggle.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));
    document.addEventListener("click", (event) => { if (!picker.contains(event.target)) closeMenu(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });

    function openMenu() {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }
    function createSwatch(theme) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "theme-picker__swatch";
      swatch.dataset.preview = theme.id || "hartie";
      swatch.setAttribute("role", "radio");
      swatch.setAttribute("aria-label", theme.name);
      swatch.title = theme.name;
      swatch.addEventListener("click", () => {
        saveTheme(applyTheme(theme.id));
        markCurrent(menu);
        closeMenu();
      });
      return swatch;
    }
  }

  function markCurrent(menu) {
    const current = root.dataset.skin || "hartie";
    menu.querySelectorAll(".theme-picker__swatch").forEach((swatch) => {
      swatch.setAttribute("aria-checked", String(swatch.dataset.preview === current));
    });
  }
})();
