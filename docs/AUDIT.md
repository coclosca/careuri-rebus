# Audit of the old site and what this rebuild changed

The old site worked and had good content (16 games, ~600 school questions). The problems were in how it was built, how it looked, and privacy/legal basics.

## Structure
| Before | After |
|---|---|
| 19 pages, each one file with its own CSS, game code and data inside (up to 360 KB per file) | each game in `site/features/<id>/`: logic, board styles and data in separate files; the page is a small shell |
| colours and sizes copied into every page, each slightly different (quiz purple, cards green...) | one design system: `styles/tokens.css` + shared components + a shared game layer; one width, one header, one footer |
| no shared header/footer; back links went to different places | same header (logo + colour themes) and footer everywhere; a small back link above every title |
| offline cache served old files until the app was closed | offline cache is network-first: online visitors always get the newest version |
| "Mobil / Desktop" zoom button | responsive layout, no zoom needed |
| no checks | `tools/check-site.mjs` (links, offline list, tokens, sitemap, placeholders, script syntax) runs before every publish |

## Design
- Emoji used as buttons and icons → one drawn icon set (`assets/icons/icons.svg`).
- The 3D doors on the home page kept and rebuilt: they stand on the floor, open toward the visitor with light and shadow, and show what is inside.
- Game families have their own colours (words, quiz, solitaire, Romanian card games, school).
- Light and dark mode everywhere, plus five colour themes for the whole site (before: only inside Integrame).
- Text contrast checked for both themes; tap targets at least 44 px; keyboard focus visible; motion off for people who ask for reduced motion.

## Legal and privacy
| Before | After |
|---|---|
| privacy page only, with a missing contact e-mail | privacy policy, cookie policy and terms, filled in by the playludiq-legal skill |
| cookie banner whose choice changed nothing | consent module that really blocks statistics until accepted (or no banner, if the owner chooses statistics without consent) |
| Google ad script loading before consent | removed; ads only later through Google's certified consent tool |
| Google Fonts on every page | self-hosted fonts |
| personal details in public files and history | see `docs/OPSEC.md` |

## Left for the owner
- Fill in the legal pages (playludiq-legal skill): publishing is blocked until then.
- Decide about cleaning old git history (docs/OPSEC.md).
- Known small issue inherited from the old code: the Piramida pyramid sits slightly left of centre on wide screens.
