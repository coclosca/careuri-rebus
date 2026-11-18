---
name: playludiq-content
description: Adds content to PlayLudiq by interviewing the owner one question at a time: a new school subject or class with tests, more questions, new puzzles for an existing game (integrame, criptograme, proverbe, potriviri, quiz, trivia), or a completely new game. Use when the owner says "adaug", "vreau un test nou", "materie nouă", "mai multe întrebări", "un joc nou", or similar.
---

# PlayLudiq: new content

Talk by the rules in the **playludiq** skill. Engineering by the **software-engineering** skill, Build mode.

## Step 1: what kind

AskUserQuestion "Ce adăugăm?": "Teste pentru o materie / clasă" / "Mai multe puzzle-uri sau întrebări la un joc" / "Un joc complet nou" / "Nu știu, explică-mi".

## A. School tests (site/features/scoala/scoala.data.js, the `COURSES` list)

Ask, one at a time: the class (a V-a ... a VIII-a or primary), the subject, the textbook he follows (publisher and year, or "nu știu").

Then, before writing any question:
1. Look up the official national curriculum (programa școlară) for that subject and class on the Ministry's site and the school-year module structure. Tell him in 3 lines what you found (main competences and chapters) and ask "E bine așa?".
2. Format already used on the site: 5 modules × 2 tests + 2 combined tests, about 120 questions; each question has 3 answers, the correct one, the competence from the curriculum, a short explanation, and sometimes "Știați că…?". Read an existing course in `scoala.data.js` and copy its exact structure.
3. Write ONE module first (24 questions) and show him 5 of them in the chat. Ask "Sunt bune? Continui așa?". Only then write the rest.
4. Facts must be correct and age-appropriate. When unsure of a fact, leave the question out. Never copy text from textbooks; write original questions.

## B. More puzzles or questions for an existing game

Find where the game keeps its content: `site/features/<game>/<game>.data.js` (or the top of `<game>.game.js` for small lists such as proverbs or potriviri puzzles). Read the existing format, ask how many he wants and on what theme, write them in the same format, show 3 examples first, then add the rest. For quotes: only public-domain authors or proverbs, with the author's name.

## C. A new game

1. Ask what game (name, rules in his words), for whom (adults, children), alone or against the computer, and whether it goes in "Jocuri" (which section) or "Școală".
2. Repeat the rules back in 4 to 6 short lines and ask "Așa se joacă?".
3. Build it like the others:
   - `site/<id>.html`: copy the shell of a similar game (header, back link, `.game-root data-family`, footer, the same `<head>` links), change title, description, canonical, scripts.
   - `site/features/<id>/<id>.game.js` (logic, no inline handlers in new code, every listener and timer cleaned up), `<id>.styles.css` (board only, tokens only, every selector under `.game-root`), `<id>.data.js` if it has content.
   - shared pieces from game.css for title, chips, buttons, mode cards, rules, dialogs, feedback card.
4. Register it: a tile in `site/jocuri.html` (right section, right `data-family`, an icon from the sprite), a line in `site/sitemap.xml`, its files in `PRECACHE_FILES` in `site/sw.js` and `CACHE_VERSION` raised.
5. Test it yourself in the preview on phone and computer: start, win, lose, restart, dark theme. Then show him and ask "Merge cum voiai?".

## Always at the end

`node tools/check-site.mjs` must pass. Tell him in two lines what was added, and offer to publish (playludiq-publish).
