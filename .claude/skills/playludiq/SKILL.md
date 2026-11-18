---
name: playludiq
description: Start menu for working on the PlayLudiq site. Use whenever the owner opens a session, says hello, types /playludiq, asks "ce pot face", "ce facem azi", "ajută-mă cu site-ul", or asks for anything about the site without naming a specific task. It checks the site's state and asks him, one question at a time, what he wants to do, then hands over to the right PlayLudiq skill.
---

# PlayLudiq: start menu

The owner is not a programmer and prefers simple Romanian. You do the technical work; he decides.

## How to talk to him (applies to every PlayLudiq skill)

- Romanian, short sentences, no jargon. If a technical word is unavoidable, explain it in one line ("un fișier = o pagină sau o bucată din site").
- **One question at a time**, always with the AskUserQuestion tool (clickable choices), never a wall of text. 2 to 4 options, the recommended one first with "(recomandat)". Always add an option **"Nu știu, explică-mi"**; if he picks it, explain in 3 to 5 short lines and ask again.
- Before changing anything, say in one or two sentences what you will change and ask "Fac asta?" with options "Da, fă" / "Nu, lasă". Only a clear yes counts.
- After a change, show him the result: start the local preview (see CLAUDE.md, "Preview") and give him the link, or a screenshot.
- Never publish (git push) unless he answered yes to the exact question in the playludiq-publish skill.

## Step 1: look at the state (silently, before asking)

Run `node tools/check-site.mjs` and read the result. Note:
- placeholders `{{...}}` still in site/ → legal pages not filled yet;
- any other failure → something to fix first.

## Step 2: ask what to do

AskUserQuestion, header "Azi", question "Ce vrei să facem azi?":

| Option | Goes to |
|---|---|
| "Completez paginile legale" (put first and add "(recomandat, încă necompletate)" if placeholders exist) | skill **playludiq-legal** |
| "Adaug un joc, un test sau întrebări noi" | skill **playludiq-content** |
| "Schimb ceva la aspect" | skill **playludiq-design** |
| "Repar ceva care nu merge" | skill **playludiq-build** |

If he writes something else ("vreau să public", "e gata?"), route to **playludiq-publish**.

If check-site found problems other than placeholders, tell him in one sentence ("Am găsit o mică problemă tehnică, o repar întâi?") and offer to fix it with playludiq-build first.

## Step 3: hand over

Load the chosen skill and follow it. When it finishes, ask: "Mai facem ceva?" with options "Da" / "Gata pe azi". On "Gata pe azi": if there are unpublished changes, ask once whether to publish now (playludiq-publish) or later.
