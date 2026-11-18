/* ==========================================================================
   PlayLudiq consent - cookie bar + preferences panel + script gate.

   How it works
   - Any third-party script that needs consent is written in the page as
       <script type="text/plain" data-consent="statistics" data-src="https://..."></script>
     It does not run until the visitor allows that category.
   - The visitor's choice is stored in localStorage under STORAGE_KEY.
   - Any element with [data-consent-open] (the footer "Setări cookies" button)
     reopens the preferences panel.
   - Raising CONSENT_VERSION asks everyone again (do it when categories change).

   Google AdSense is NOT handled here: in the EU Google requires its own
   certified consent tool ("Privacy & messaging" in the AdSense account).
   ========================================================================== */
(function setUpConsent() {
  "use strict";

  // --- Configuration (the playludiq-legal skill edits this block) --------
  const STORAGE_KEY = "pl_consent";
  const CONSENT_VERSION = 1;
  const POLICY_URL = "cookies.html";
  const CATEGORIES = [
    {
      id: "statistics",
      title: "Statistici de vizitare",
      description: "Numărăm vizitele (Cloudflare Web Analytics, fără cookies), ca să știm ce jocuri plac.",
      requiresConsent: true,
    },
  ];
  const TEXT = {
    barMessage: "Folosim memoria telefonului doar ca jocurile să funcționeze. Cu acordul tău, numărăm și vizitele.",
    policyLink: "Detalii",
    acceptAll: "Accept",
    rejectAll: "Refuz",
    choose: "Aleg eu",
    panelTitle: "Setări cookies",
    panelIntro: "Alege ce ne permiți. Poți schimba oricând din linkul „Setări cookies” din subsolul paginii.",
    necessaryTitle: "Necesare",
    necessaryDescription: "Salvează progresul în jocuri și alegerea de aici. Rămân doar pe dispozitivul tău.",
    alwaysOn: "Mereu active",
    save: "Salvează",
  };

  // --- Public flow --------------------------------------------------------
  const storedDecision = readDecision();
  if (storedDecision) {
    runAllowedScripts(storedDecision.choices);
  } else if (needsAnyConsent()) {
    showBar();
  } else {
    runAllowedScripts(defaultChoices(true));
  }
  bindReopenLinks();

  // --- Storage ------------------------------------------------------------
  function readDecision() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const decision = JSON.parse(raw);
      if (decision.version !== CONSENT_VERSION || typeof decision.choices !== "object") return null;
      return decision;
    } catch (error) {
      reportProblem("could not read consent", error);
      return null;
    }
  }

  function saveDecision(choices) {
    const decision = { version: CONSENT_VERSION, decidedAt: new Date().toISOString(), choices };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decision));
    } catch (error) {
      reportProblem("could not save consent", error);
    }
    return decision;
  }

  // --- Rules --------------------------------------------------------------
  function needsAnyConsent() {
    return CATEGORIES.some((category) => category.requiresConsent);
  }

  /** Categories that do not need consent are always on; the rest take `value`. */
  function defaultChoices(value) {
    return Object.fromEntries(
      CATEGORIES.map((category) => [category.id, category.requiresConsent ? value : true])
    );
  }

  function decide(choices) {
    const decision = saveDecision(choices);
    closeAll();
    runAllowedScripts(decision.choices);
  }

  // --- Script gate --------------------------------------------------------
  function runAllowedScripts(choices) {
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach((placeholder) => {
      if (!choices[placeholder.dataset.consent]) return;
      const script = document.createElement("script");
      Array.from(placeholder.attributes).forEach(({ name, value }) => {
        if (name === "type" || name === "data-consent" || name === "data-src") return;
        script.setAttribute(name, value);
      });
      script.src = placeholder.dataset.src;
      script.defer = true;
      placeholder.replaceWith(script);
    });
  }

  // --- Bar ----------------------------------------------------------------
  function showBar() {
    const bar = createElement("section", "consent-bar", { "aria-label": TEXT.panelTitle });
    const message = createElement("p", "consent-bar__message");
    message.append(TEXT.barMessage + " ");
    message.append(createLink(TEXT.policyLink, POLICY_URL));
    const actions = createElement("div", "consent-bar__actions");
    actions.append(
      createButton(TEXT.rejectAll, "button button--secondary", () => decide(defaultChoices(false))),
      createButton(TEXT.acceptAll, "button button--secondary", () => decide(defaultChoices(true))),
      createButton(TEXT.choose, "button button--quiet", showPanel)
    );
    bar.append(message, actions);
    document.body.append(bar);
  }

  // --- Preferences panel --------------------------------------------------
  function showPanel() {
    closeAll();
    const current = (readDecision() || { choices: defaultChoices(false) }).choices;
    const backdrop = createElement("div", "sheet-backdrop consent-panel");
    const sheet = createElement("div", "sheet stack", { role: "dialog", "aria-modal": "true", "aria-labelledby": "consentTitle" });
    const title = createElement("h2", "", { id: "consentTitle" });
    title.textContent = TEXT.panelTitle;
    const intro = createElement("p", "consent-panel__intro");
    intro.textContent = TEXT.panelIntro;
    sheet.append(title, intro, createNecessaryRow());

    const toggles = CATEGORIES.map((category) => createCategoryRow(category, current[category.id]));
    toggles.forEach(({ row }) => sheet.append(row));

    const save = createButton(TEXT.save, "button button--primary button--block", () => {
      const choices = Object.fromEntries(toggles.map(({ id, input }) => [id, input.checked]));
      decide(choices);
    });
    sheet.append(save);
    backdrop.append(sheet);
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeAll(); });
    document.addEventListener("keydown", closeOnEscape);
    document.body.append(backdrop);
    save.focus();
  }

  function createNecessaryRow() {
    const row = createElement("div", "consent-row");
    const text = createElement("div");
    const name = createElement("strong");
    name.textContent = TEXT.necessaryTitle;
    const description = createElement("p", "consent-row__text");
    description.textContent = TEXT.necessaryDescription;
    text.append(name, description);
    const state = createElement("span", "consent-row__state");
    state.textContent = TEXT.alwaysOn;
    row.append(text, state);
    return row;
  }

  function createCategoryRow(category, checked) {
    const row = createElement("label", "consent-row");
    const text = createElement("div");
    const name = createElement("strong");
    name.textContent = category.title;
    const description = createElement("p", "consent-row__text");
    description.textContent = category.description;
    text.append(name, description);
    const input = createElement("input", "consent-row__switch", { type: "checkbox", role: "switch" });
    input.checked = Boolean(checked) || !category.requiresConsent;
    input.disabled = !category.requiresConsent;
    row.append(text, input);
    return { id: category.id, input, row };
  }

  function bindReopenLinks() {
    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-consent-open]");
      if (!opener) return;
      event.preventDefault();
      showPanel();
    });
  }

  function closeOnEscape(event) {
    if (event.key === "Escape") closeAll();
  }

  function closeAll() {
    document.querySelectorAll(".consent-bar, .consent-panel").forEach((element) => element.remove());
    document.removeEventListener("keydown", closeOnEscape);
  }

  // --- Small DOM builders -------------------------------------------------
  function createElement(tag, className, attributes) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    Object.entries(attributes || {}).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  }

  function createButton(label, className, onClick) {
    const button = createElement("button", className, { type: "button" });
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function createLink(label, href) {
    const link = createElement("a", "", { href });
    link.textContent = label;
    return link;
  }

  /** Storage can be blocked (private mode); the site keeps working, we only note it. */
  function reportProblem(message, error) {
    if (window.console && console.warn) console.warn("[consent] " + message, error);
  }
})();
