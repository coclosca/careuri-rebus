# PlayLudiq — brief de proiect (pentru continuare în conversații noi)

> **Cum se folosește:** într-o conversație nouă, spune-i lui Claude:
> „Clonează repo-ul GitHub **coclosca/careuri-rebus** și citește **BRIEF.md**." Apoi continuați de aici.

## Ce este
**PlayLudiq** — aplicație web (site static) cu **jocuri de minte + teste școlare**, în limba română.
- Live: **https://playludiq.com** (găzduit pe **GitHub Pages**)
- Repo: **coclosca/careuri-rebus** (branch `main`)
- Autor: Corneliu (Constanța). Versiune **beta**.

## Stack & deploy
- Fiecare pagină = **un singur fișier HTML** autonom (CSS + JS inline, date JSON înăuntru).
- **PWA**: `manifest.json` + `sw.js` (service worker, cache-first, versionat `jocuri-vN`).
- **Deploy = `git push`** pe `main`. La ORICE modificare de fișiere, **incrementează versiunea cache** în `sw.js` (ex. `jocuri-v29` → `v30`) și adaugă fișierele noi în lista CORE.
- Pe telefon, userul trebuie să **închidă complet aplicația și s-o redeschidă** ca să treacă de cache.
- Proxy-ul blochează `curl` către site-uri non-GitHub; `git clone`/`push` pe GitHub merg.
- Commit attribution (în mesajul de commit):
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` și
  `Claude-Session: https://claude.ai/code/session_01JXosZn3nQm3729VDdJevQa`

## Convenții tehnice
- Culori prin tokeni `:root`; dark mode via `@media (prefers-color-scheme:dark)` + `:root:not([data-theme="light"])`.
- **La jocurile de cărți**: cărțile folosesc tokenul `--face` (rămâne deschis la culoare și pe dark); `--card` e suprafață (închisă pe dark) pentru butoane/UI. Altfel butoanele devin invizibile pe dark.
- Toate paginile încarcă `view.js` (buton Mobil/Desktop) + `cookies.js` (consimțământ) + beacon Cloudflare Web Analytics, și au footer cu „versiune beta" + link Confidențialitate.
- `localStorage` doar cu try/catch.
- Testare: Playwright + Chromium headless (preinstalat). Google Fonts pică pe proxy în headless → fallback DejaVu (normal). La click pe elemente animate, folosește `{force:true}` sau injectează `*{animation:none!important}`.
- Fără ghilimele drepte `"` în interiorul string-urilor JS/Python cu text românesc (închid string-ul) — folosește ghilimele curbe „ ".

## Structura paginilor
- `index.html` — meniu principal: 2 „uși": 🎮 Joacă-te (→`jocuri.html`) și 📚 Teste școlare (→`scoala.html`). Buton „Invită prieteni", modal offline.
- `jocuri.html` — hub jocuri (fără teste).
- `scoala.html` — hub teste: navigare **Clasă → Materie → Modul → Test**. Datele în `const COURSES=[...]` (array de cursuri; fiecare = {subject, clasa, manual, modules, combined}).
- `confidentialitate.html` — politica de confidențialitate (are loc gol pentru email de contact de pus).

## Inventar JOCURI (toate funcționale)
- **integrame.html** — integrame/rebus (careuri)
- **cuvantul.html** — „Cuvântul zilei" (Wordle RO, un cuvânt/zi + arhivă zile trecute)
- **criptograma.html** — criptograme (cifru de substituție pe proverbe/maxime, domeniu public)
- **roata.html** — „Roata Cuvintelor" (ghicești proverbul; 3 vocale + 4 consoane)
- **potriviri.html** — stil „Connections" (16 cuvinte → 4 categorii, 4 vieți, 6 puzzle-uri)
- **quiz.html** — quiz pe definiții, niveluri Începător/Mediu/Avansat/**Expert**
- **trivia.html** — trivia rapidă cu cronometru + curiozități
- Pasiențe: **piramida.html**, **napoleon.html**, **ceasul.html**, **klondike.html** (Solitaire clasic, cu auto-complete „La casă")
- Nostalgia (jocuri românești de cărți, toate cu **bot + pass&play** + perdea care ascunde cărțile):
  **septica.html**, **popa.html** (Popa Prostul), **macao.html** (7=+2, Valet schimbă culoarea, As sare adversarul)

## Inventar TESTE (`scoala.html`, în `COURSES`)
Format per materie: **5 module** (după structura anului școlar) **× 2 teste + 2 combinate = 120 întrebări**.
Fiecare întrebare: 3 opțiuni, răspuns corect, **competența** marcată (programa națională), **explicație**, unele cu „**Știați că…?**".
- **Educație Muzicală** — clasa a V-a și a VI-a
- **Matematică** — clasa a V-a
Modulele anului școlar 2026-2027 (identice pt toate materiile): M1 7 sep–23 oct · M2 2 nov–22 dec · M3 11 ian–19 feb · M4 1 mar–23 apr · M5 5 mai–18 iun.
Workflow materie nouă: **caută întâi programa oficială** (competențe + conținuturi) și structura pe module, abia apoi generează întrebările (script Python → injectează în `COURSES`).

## Promovare & conturi (doar nume, fără parole)
- **Instagram @playludiq** (cont Business, link în bio = playludiq.com) — **cel mai bun canal** (12 din 18 vizite veneau de pe IG).
- **Facebook**: Pagina PlayLudiq + postări. Grupuri = ROI mic (max 1 grup/zi, variază textul). Grup pe temă găsit: „Integrame online - Integramix".
- **TikTok @playludiq** — tocmai creat. Există un clip promo 15s vertical (generat din capturi reale ale jocurilor; fără muzică, userul adaugă sunet trending în TikTok).
- **Cloudflare Web Analytics** (cookieless) activ pe toate paginile. Ziua 1: 44 vizite/136 views; ziua 2: 18/88.
- Afișe promo (pătrate + vertical) + logo există ca atașamente în conversația veche.

## Monetizare (plan)
- **Ko-fi** „Susține proiectul" (0% comision) — buton discret pe site când userul dă linkul. **De făcut.**
- **Google AdSense** — merită pe la **~500–1.000 vizite/zi** (sub atât, bani neglijabili). Reclame **ne-personalizate** pe paginile pt copii.
- **Android (TWA) + AdMob / rewarded ads** — mai târziu.

## De făcut (backlog)
- [ ] **Ko-fi**: buton pe site (userul face cont, dă linkul).
- [ ] TikTok: postat primul clip + link în bio; eventual clipuri scurte per joc.
- [ ] Materii noi spre oferta pentru părinți + Evaluarea Națională: **Matematică a VI-a**, **Limba română a V-a**, apoi istorie/geografie/biologie, clasele V–VIII.
- [ ] Pune email de contact (brand) în `confidentialitate.html`.
- [ ] Posibil joc nou: **Tarnib** (joc cu atu, 4 jucători + licitație — complex, proiect dedicat).
- [ ] La cerere: bot mai greu/ușor, mai multe puzzle-uri la Potriviri, mai multe proverbe la Criptograma/Roata.
