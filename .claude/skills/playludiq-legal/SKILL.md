---
name: playludiq-legal
description: Fills in and updates PlayLudiq's legal pages (Politica de confidențialitate, Politica de cookies, Termeni și condiții) and the cookie bar, by interviewing the owner one question at a time. Use when the owner wants to complete or change the legal pages, contact email, company details, statistics consent, the error-report form, or before turning on ads (Google AdSense). Also use when check-site reports {{...}} placeholders.
---

# PlayLudiq: legal pages and cookie bar

Files you edit:
- `site/confidentialitate.html`, `site/cookies.html`, `site/termeni.html` (placeholders like `{{OPERATOR_NUME}}`, and blocks marked with HTML comments `<!-- STATISTICI -->`, `<!-- FORMULAR -->`, `<!-- RECLAME -->`);
- `site/shared/consent/consent.js` (only the "Configuration" block at the top).

Follow the talking rules in the **playludiq** skill: Romanian, one AskUserQuestion at a time, "Nu știu, explică-mi" always available, confirm before writing.

These pages are good templates written for a free Romanian site with no accounts. Say once, at the start: "Sunt șabloane făcute pentru un site ca al tău. Dacă vrei siguranță totală, le poți arăta și unui avocat." Do not repeat it.

## Interview (in this order; skip a question if the answer is already in the pages and he does not want to change it)

1. **Cine răspunde de site?** Options: "Eu, ca persoană fizică" / "O firmă (SRL, PFA)" / "Nu știu, explică-mi".
   - Persoană fizică: ask the name to show (free text). Explain: this name will be public on the site. Offer the brand instead: "PlayLudiq" alone is not enough legally; a name is needed, but it can be just first and last name, without address.
   - Firmă: ask the company name, CUI, and registered office town (three separate questions).
2. **Adresa de e-mail pentru contact** (free text). Before he types, advise in two lines: use a separate address only for the site (for example contact@playludiq.com or a new Gmail), not his personal one, because it will be public and will get spam. Check it looks like an e-mail.
3. **Statistici de vizitare** (Cloudflare Web Analytics, fără cookies). Options:
   - "Le pornesc doar cu acordul vizitatorului (recomandat)": the cookie bar appears; fewer visits counted, safest for a site used by children.
   - "Le las pornite, fără bară de cookies": no cookie bar at all; based on legitimate interest, because nothing is stored on the device.
   - "Nu vreau statistici": remove them.
4. **Formularul „Raportează o greșeală”** (Google Forms, in Integrame). Options: "Îl păstrez" / "Îl scot".
5. **Reclame**. Options: "Nu am reclame (recomandat acum)" / "Vreau să pun reclame Google AdSense".
   - If AdSense: stop the interview after recording the answer and explain the steps in short lines: in the AdSense account turn on "Privacy & messaging" (Google's own approved consent window, required in the EU); mark the school pages for non-personalised ads only; then come back and you will update the pages. Do not add AdSense code yourself in this skill.

## Fill-in table (what each placeholder becomes)

| Placeholder | Value |
|---|---|
| `{{OPERATOR_NUME}}` | the name from question 1 |
| `{{OPERATOR_DETALII}}` | empty for a person; `, CUI <cui>, cu sediul în <oraș>` for a company |
| `{{EMAIL_CONTACT}}` | the e-mail from question 2 (all occurrences, including `mailto:`) |
| `{{GAZDUIRE_NUME}}` | `GitHub, Inc. (GitHub Pages)` unless he says the site moved |
| `{{DATA_ACTUALIZARII}}` | today, written like `18 noiembrie 2026` |
| `{{AN}}` | the current year |
| `{{STATISTICI_TEMEI}}` | consent: `Consimțământul tău (art. 6 alin. 1 lit. a GDPR), dat din fereastra de cookies`; no bar: `Interes legitim (art. 6 alin. 1 lit. f GDPR): numărăm vizite fără cookies și fără să identificăm pe nimeni` |
| `{{STATISTICI_STARE}}` | consent: `doar cu acordul tău`; no bar: `fără cookies` |
| `{{STATISTICI_EXPLICATIE}}` | consent: `Pornesc doar dacă apeși „Accept” sau le activezi din „Setări cookies”.`; no bar: `Nu salvează nimic pe dispozitivul tău.` |
| `{{RECLAME_TEXT}}` | no ads: `Momentan PlayLudiq nu afișează reclame. Dacă vom afișa, actualizăm această pagină și îți cerem acordul înainte.` |

Blocks:
- "Nu vreau statistici": delete every block and row marked `STATISTICI`, delete the `data-consent="statistics"` script line from every page in site/, and empty the `CATEGORIES` list in consent.js.
- Statistics without a bar: in consent.js set `requiresConsent: false` for `statistics`.
- Statistics with consent: keep `requiresConsent: true`.
- "Îl scot" for the form: delete the rows marked `FORMULAR`, and tell him the Integrame button must go too (that is a playludiq-build change; offer to do it next).
- When anything in consent.js categories changes, raise `CONSENT_VERSION` by 1 so visitors are asked again.

## Confirm, write, show

1. Show him a short summary in Romanian (name, e-mail, statistics choice, form, ads) and ask "Scriu asta în pagini?" with "Da, scrie" / "Vreau să schimb ceva".
2. Edit the files. Then run `node tools/check-site.mjs`: no `{{` may remain.
3. Start the preview and give him the links to the three pages and the home page (to see the cookie bar). Ask "Arată bine?".
4. Tell him the change is saved on the computer, not yet on the internet, and offer the playludiq-publish skill.

## Later changes

If he only wants to change one thing (new e-mail, new company), ask only that question, update every place it appears, set `{{DATA_ACTUALIZARII}}`'s replacement (the "Ultima actualizare" line) to today, and show the result.
