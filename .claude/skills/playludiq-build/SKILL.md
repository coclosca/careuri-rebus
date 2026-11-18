---
name: playludiq-build
description: Fixes or changes how PlayLudiq works (a game that misbehaves, a button that does nothing, a page that does not load, offline mode, something broken after a change), the right way, with the software-engineering kit, while keeping the owner informed in simple Romanian. Use when the owner says something does not work, "nu merge", "s-a stricat", "repară", or asks for a behaviour change that is not just looks (playludiq-design) or new content (playludiq-content).
---

# PlayLudiq: fixing and changing behaviour

Talk by the rules in the **playludiq** skill. Engineering strictly by the **software-engineering** skill (Build mode for changes; never "try things until it works").

## Interview (one question at a time)

1. "Unde se întâmplă?" (which page or game; offer the likely ones as options).
2. "Ce faci și ce se întâmplă?" (free text) and, if useful, "Pe telefon sau pe calculator?".
3. If he has a screenshot, ask him to paste it.

## Work

1. Reproduce it yourself in the preview first. If you cannot reproduce it, tell him what you tried and ask one more question.
2. Find the cause by reading the code (each game lives in `site/features/<game>/`; the page shell is `site/<game>.html`). Explain the cause to him in one or two plain sentences.
3. Say the fix in one sentence and ask "Repar așa?".
4. Fix at the right place, smallest correct change. Keep ids and classes the code relies on; do not reformat unrelated code.
5. Check: the broken thing now works, the rest of that game still works (start, play, win, restart), phone and computer, no errors in the browser console. Run `node tools/check-site.mjs`.
6. Tell him what was wrong and what you changed, in two lines. Offer to publish.

## Structure to respect

- Pages stay at their addresses (`site/integrame.html` and so on): those are public links people saved. Never rename or move them.
- One feature, one folder: `site/features/<id>/` with `<id>.game.js`, `<id>.styles.css`, `<id>.data.js`.
- Shared code: `site/shared/` (consent, offline). Shared looks: `site/styles/`.
- New or renamed files: update `PRECACHE_FILES` and raise `CACHE_VERSION` in `site/sw.js`.
- Browser storage (`localStorage`) only inside try/catch; new storage keys must be added to the table in `site/cookies.html`.
- No new outside scripts, fonts or trackers without asking him and updating the legal pages (playludiq-legal).
