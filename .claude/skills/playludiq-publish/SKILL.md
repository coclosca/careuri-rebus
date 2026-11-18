---
name: playludiq-publish
description: Publishes PlayLudiq changes to the live site (playludiq.com) safely - runs the site check and the OPSEC privacy scan, explains in plain Romanian what will go live, and pushes only after the owner's explicit yes. Also guides the one-time switch to deploying only the site/ folder. Use when the owner says "publică", "pune pe site", "e gata?", "să apară pe internet", or at the end of a session with unpublished changes.
---

# PlayLudiq: publish

Talk by the rules in the **playludiq** skill. Never push without his explicit "Da, publică" to the question in step 4.

## 1. Checks (silently)

1. `node tools/check-site.mjs` must pass (no `{{` placeholders, every file in the offline list, links OK, tokens only).
2. OPSEC scan: `node .claude/skills/software-engineering/scripts/scanOpsecLeaks.mjs .` . HIGH findings block publishing. Explain any finding in plain words and fix it (with his yes) before going on.
3. `git status` and `git diff --stat`: understand what changed.
4. Git identity: `git config user.name` and `user.email` must be neutral (for example "PlayLudiq" and the GitHub "noreply" address), never his personal name or e-mail. If not, explain why and ask before setting them for this repository only.

If a check fails: tell him in one sentence what is wrong and offer to fix it (playludiq-build). Do not publish.

## 2. One-time setup (only if `.github/workflows/deploy-pages.yml` is not active yet)

The site is now in `site/`; only that folder must go online (the rest is instructions and tools). Guide him step by step, one step per message, waiting for "gata" after each:
1. On github.com open the repository → Settings → Pages.
2. At "Build and deployment" → Source, choose **GitHub Actions**.
3. Check that the custom domain is still playludiq.com (the file `site/CNAME` keeps it).
After the first publish, open the Actions tab with him and confirm the green check.

## 3. Commit

Make one commit with a short message that says what changed (for example "Integrame: 20 careuri noi"). Stage files by name, never everything blindly, and never `--no-verify`. No personal names, e-mails, paths or machine names in the message.

## 4. Ask, then push

Say in Romanian, in at most 4 short lines, what will appear on the live site. Then AskUserQuestion "Publicăm acum pe playludiq.com?" with "Da, publică" / "Nu încă". Only on "Da, publică": `git push`.

## 5. After

Wait for the deploy (Actions tab), open playludiq.com and the changed pages, and confirm to him they are live. Remind him: visitors get the new version automatically on their next visit (no need to reinstall the app).
