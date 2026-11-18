# PlayLudiq: instructions for Claude

PlayLudiq (playludiq.com) is a free Romanian website with brain games and school tests. The owner is not a programmer. **Talk to him in simple Romanian, one question at a time, and always use the PlayLudiq skills.**

## Start of every session
Run the **playludiq** skill (start menu). It checks the site and asks him what to do. Skills in `.claude/skills/`:

| Skill | When |
|---|---|
| `playludiq` | start menu, any vague request |
| `playludiq-legal` | legal pages, contact e-mail, cookie bar, before ads |
| `playludiq-content` | new tests, questions, puzzles, new games |
| `playludiq-design` | how anything looks |
| `playludiq-build` | something broken, behaviour changes |
| `playludiq-publish` | putting changes online |
| `software-engineering` | the engineering standard all of the above follow |

## Talking rules (short version; full version in the playludiq skill)
- Romanian, short sentences, no jargon. One AskUserQuestion at a time, clickable options, always a "Nu știu, explică-mi" option.
- Say what you will change and wait for "Da" before changing it. Show him the result.
- Never `git push` without his "Da, publică" in the playludiq-publish skill.

## Map
```
site/                     everything that goes online (only this folder is published)
  index.html, jocuri.html, scoala.html, <game>.html   page shells (public addresses: never rename)
  confidentialitate.html, cookies.html, termeni.html  legal pages
  styles/tokens.css       ALL colours, sizes, spacing, fonts, themes (single source of truth)
  styles/base.css         page basics      styles/components.css  shared pieces
  styles/game.css         pieces every game shares      styles/legal.css  legal pages
  features/<id>/          one folder per game: <id>.game.js, <id>.styles.css, <id>.data.js
  shared/theme/           colour themes + header picker      shared/consent/  cookie bar
  shared/pwa/             offline registration      sw.js  offline cache list
  assets/                 fonts, icons (icons.svg sprite), app icons
docs/design-sheet.html    visual reference of the design system
docs/AUDIT.md, docs/OPSEC.md   what was wrong before, privacy rules
tools/check-site.mjs      run before publishing: `node tools/check-site.mjs`
.github/workflows/        publishes site/ to GitHub Pages on push to main
```

## Engineering rules (from the software-engineering skill, applied here)
1. One feature, one folder. New game = new `site/features/<id>/` + shell page + hub tile + sitemap + sw.js list.
2. Tokens only: no raw colour or px outside `styles/tokens.css` (boards may declare named geometry once at the top of their file). No inline `style=""`, no emoji as interface (icons from the sprite).
3. Game styles are scoped under `.game-root` and style the board only; shared pieces come from game.css.
4. `localStorage` only inside try/catch; any new key goes in the table in `site/cookies.html`.
5. Any file added/renamed/removed in site/: update `PRECACHE_FILES` and raise `CACHE_VERSION` in `site/sw.js`.
6. Every change checked in the preview on phone and computer, light and dark theme; `node tools/check-site.mjs` passes.
7. Never rename public pages, storage keys or the CNAME. Never add trackers, outside scripts or fonts without asking him and updating the legal pages.

## Preview
Start a local server and open it: `python3 -m http.server 8000 --directory site`, then http://localhost:8000. (In the Claude desktop app, `.claude/launch.json` has it as "playludiq".) Service workers cache files: when testing changes, reload once more, or unregister it from the browser's developer tools.

## OPSEC (privacy)
Everything in this repository is public. Never write personal names, personal e-mails, phone numbers, home addresses, computer names, local paths or passwords into files, comments or commit messages. Commits use a neutral identity. Run the scan before publishing: `node .claude/skills/software-engineering/scripts/scanOpsecLeaks.mjs .` Details in `docs/OPSEC.md`.

## Installing this kit into the existing repository (first time only)
If the repository root still has the old single-file pages (`index.html`, `integrame.html`... at the top level, `cookies.js`, `view.js`, `BRIEF.md`):
1. Explain to the owner in two lines that the old files get replaced by the new organised site, and that the addresses (playludiq.com/integrame.html etc.) stay the same. Ask "Instalez?".
2. Remove the old top-level site files and `BRIEF.md` with `git rm` (they are all inside `site/` now, rebuilt). Keep `.git`.
3. Copy the kit contents into the repository root (including the hidden `.claude/`, `.github/`, `.gitignore`, `.opsec-allow`).
4. Run `node tools/check-site.mjs` (only the `{{...}}` legal placeholders may fail) and the OPSEC scan.
5. Run the playludiq-legal skill, then playludiq-publish (which also guides the one-time GitHub Pages switch).
