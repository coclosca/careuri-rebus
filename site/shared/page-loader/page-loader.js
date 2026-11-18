/* ==========================================================================
   PlayLudiq page loader - shows that the next page is on its way.
   Clicking a link to another PlayLudiq page starts a coloured bar under the
   top edge; if the page is slow, four bouncing tiles appear in the middle.
   The page that arrives finishes the bar and fades it out.
   Looks and timing live in styles/components.css (section "Page loader").
   Nothing is stored; nothing runs for links that open elsewhere.
   ========================================================================== */
(function setUpPageLoader() {
  "use strict";

  const STATE_ATTRIBUTE = "data-page-loader";
  const LOADER_MARKUP =
    '<div class="page-loader__bar"></div>' +
    '<div class="page-loader__tiles"><span></span><span></span><span></span><span></span></div>';

  const loader = createLoader();
  if (cameFromAnotherPlayLudiqPage()) showArriving();
  document.addEventListener("click", startLeavingOnInternalLink);
  window.addEventListener("pageshow", resetWhenRestoredFromHistory);

  // --- Steps ------------------------------------------------------------------
  function createLoader() {
    const element = document.createElement("div");
    element.className = "page-loader";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = LOADER_MARKUP;
    document.body.append(element);
    return element;
  }

  function showArriving() {
    loader.setAttribute(STATE_ATTRIBUTE, "arriving");
    loader.addEventListener("animationend", clearState, { once: true });
  }

  function startLeavingOnInternalLink(event) {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link || !isPageChange(event, link)) return;
    loader.setAttribute(STATE_ATTRIBUTE, "leaving");
  }

  // Back/forward can restore this page from memory with the bar still running.
  function resetWhenRestoredFromHistory(event) {
    if (event.persisted) clearState();
  }

  function clearState() {
    loader.removeAttribute(STATE_ATTRIBUTE);
  }

  // --- Rules ------------------------------------------------------------------
  function isPageChange(event, link) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin) return false;
    const samePage = destination.pathname === location.pathname && destination.search === location.search;
    return !samePage;
  }

  function cameFromAnotherPlayLudiqPage() {
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation && navigation.type === "reload") return false;
    if (!document.referrer) return false;
    try {
      return new URL(document.referrer).origin === location.origin;
    } catch (error) {
      return false;
    }
  }
})();
