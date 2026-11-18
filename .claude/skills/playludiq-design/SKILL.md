---
name: playludiq-design
description: Changes how PlayLudiq looks (colours, fonts, spacing, the home doors, the hub cards, a game's board, header, footer) through the single design system, after asking the owner what he wants one question at a time. Use when the owner wants something prettier, bigger, another colour, a different look for a game or page, or reports that something looks wrong on phone, tablet or computer.
---

# PlayLudiq: design changes

Talk to the owner by the rules in the **playludiq** skill (Romanian, one AskUserQuestion at a time, "Nu știu, explică-mi", confirm before changing). Do the engineering by the **software-engineering** skill, Build mode, plus the rules below.

## The design system (read before any change)

| File | What it owns |
|---|---|
| `site/styles/tokens.css` | EVERY colour, size, space, radius, shadow, font, speed. Light and dark values. |
| `site/styles/base.css` | the page itself: reset, text, links, layout shells, focus ring |
| `site/styles/components.css` | shared pieces: header, back link, buttons, tiles, doors, cells, playing cards, sheets, toast, footer, icons |
| `site/styles/game.css` | pieces every game shares: title block, stat chips, game buttons, mode cards, rules panel, dialogs, quiz options, feedback card |
| `site/features/<game>/<game>.styles.css` | that game's board only |
| `site/assets/icons/icons.svg` | the icon set (use `<svg class="icon"><use href="assets/icons/icons.svg#id"/></svg>`) |
| `docs/design-sheet.html` | the visual reference; open it to see everything in one page |

Rules that never bend:
1. No raw colour (`#hex`, `rgb()`) or raw size (`px`) outside `tokens.css`. A board may declare named geometry once at the top of its file (`--board-...`).
2. A change to how something looks everywhere goes in tokens.css or the shared file that owns it, never copied into pages.
3. No emoji as interface: icons come from the sprite. Emoji inside questions and puzzles are content and stay.
4. Every change checked at phone (375px) and computer width, light and dark theme.
5. Same header and footer on every page; the back link is the small text link above the title.

## Interview

1. "Ce vrei să schimbi?" Options: "Culorile" / "Mărimea textului sau a butoanelor" / "Un joc anume" / "Altceva (spune-mi)".
2. Ask for the one detail that decides the change (which colour, which page, bigger or smaller, an example screenshot if he has one). One question, then stop asking.
3. Say what you will change in one sentence and in which file (for example "Fac verdele principal puțin mai închis, în tokens.css; se schimbă pe tot site-ul."). Ask "Fac asta?".

## Do it

1. Make the change at the right level (table above).
2. Start the preview (CLAUDE.md, "Preview"), check phone and computer, light and dark, and the pages it affects. Fix what you see before showing him.
3. Give him the link and ask "Îți place?" with "Da" / "Nu, altfel". On "Nu", ask what to adjust and repeat.
4. If tokens or shared components changed, update `docs/design-sheet.html` so it shows the new look.
5. Run `node tools/check-site.mjs`; close with the Final Structure Check of the software-engineering skill (short, in Romanian for him: what changed, what was checked).
