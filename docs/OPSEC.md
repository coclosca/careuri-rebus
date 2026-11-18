# OPSEC: keeping private things private

Everything in this repository is public, forever: files, comments, commit messages, commit author names and e-mails, and their full history. GitHub Pages also publishes the site. Deleting something later does not remove it from git history, forks or caches.

## Found in the old repository (before this kit)

| What | Where | Risk | What to do (owner's decision) |
|---|---|---|---|
| A personal e-mail address as commit author | git history | public, harvestable by spammers | Use a neutral identity from now on (below). Removing it from old history needs a history rewrite and force-push: possible, but only if you decide to. |
| First name and home town | the old `BRIEF.md` and the old site footer | links the site to a private person | Removed from the new site; `BRIEF.md` is deleted by the install. Still in old history (same note as above). |
| A private Claude session link and AI "Co-Authored-By" lines | old `BRIEF.md`, commit messages | reveals private tooling and session links | Not used any more. |
| An unused ad script with a placeholder ID loading on the home page | old `index.html` | loaded Google code before any consent | Removed. |
| Fonts loaded from Google | every old page | sends every visitor's IP to Google without consent | Fonts are now self-hosted in `site/assets/fonts/`. |

## Rules from now on

- No personal names, personal e-mails, phone numbers, addresses, computer names, local paths (`/Users/...`), passwords or keys in any file, comment or commit message.
- The contact e-mail on the site is a separate address made for the site.
- Commits use a neutral identity, set once for this repository:
  `git config user.name "PlayLudiq"` and `git config user.email "<your-github-username>@users.noreply.github.com"` (GitHub → Settings → Emails → "Keep my email addresses private" shows the exact noreply address).
- Only `site/` is published (see `.github/workflows/deploy-pages.yml`). Notes, skills and tools never go online as pages.
- Before every publish: `node .claude/skills/software-engineering/scripts/scanOpsecLeaks.mjs .` (HIGH findings block publishing) and `node tools/check-site.mjs`.
- Public brand facts that may appear (PlayLudiq, playludiq.com, the public analytics token) are listed in `.opsec-allow`. Personal words to watch for go in `~/.config/opsec/denylist.txt` on your own computer, never in the repository.

## Optional, your decision

- **Private repository:** GitHub Pages from a private repository needs a paid GitHub plan; Cloudflare Pages can publish a private repository for free. The site itself stays public either way.
- **Cleaning old history:** `git filter-repo` can rewrite the old author e-mail and remove old files from history, followed by a force-push. It changes every commit; do it once, deliberately, with a backup.
