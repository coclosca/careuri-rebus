# OPSEC - nothing personal or internal ships

Everything that leaves this machine (git commits, files rsynced to a VPS, build output, logs,
error messages shown to users) is treated as **public and permanent**: git history, caches
and server backups keep it even after a "fix" commit.

## Never in code, comments, docs, commit messages, logs, build output or file names
- **Personal identity**: real names of the owner, staff, family or clients; personal emails and phone numbers; usernames; birthdays; addresses.
- **Device identity**: computer names ("Anna's MacBook Air", `Marcos-MacBook-Pro.local`, `DESKTOP-XXXX`), local hostnames, `.local` addresses, device serials.
- **Local paths**: `/Users/<name>/...`, `/home/<name>/...`, `C:\Users\<name>\...`, Desktop/Downloads paths. Use repo-relative paths or env vars.
- **Infrastructure layout**: server IPs, `user@ip`, personal SSH aliases (`ssh myserver`), internal hostnames, panel URLs, VPS provider account names, ports of admin tools. These go in env vars / deploy config kept outside the repo.
- **Secrets**: keys, tokens, passwords, cookies, `.env` files, private keys, certificates - also not in tests (use obviously fake values like `sk_test_FAKE`), not in error messages, not in logs.
- **Cross-business links**: an email, name or domain of one business inside another business's code or public pages (e.g. a holding company's address hard-coded as the admin of a product). Use a role address per product (`admin@<product-domain>`) from env.
- **Internal notes**: "ask X", "my laptop", "temporary hack for Y", owner decisions with names and dates of people, customer names in comments or test fixtures. Write the *why* without the *who*.
- **Junk files**: `.DS_Store`, `*.bak`, `*.orig`, `*.log`, `*.swp`, DB dumps, local SQLite files, editor folders, screenshots of the desktop, scratch scripts.

## Allowed
- Public brand identity on purpose: company name, public support email, public domain, legal entity details the site must show. List them in `.opsec-allow` at the repo root (committed) so scans stay quiet on them.
- Example data in tests that is clearly fake (`user@example.com`, `203.0.113.x`, `sk_test_FAKE...`).

## Git identity
- Commits are signed with a neutral identity (role/company name + role email), never a personal name or personal email. Check `git config user.name` / `user.email` per repo before the first commit.
- No personal machine names in commit messages, branch names or tags.
- A personal leak already in history is **not fixed by a new commit**. Tell the owner: options are history rewrite (`git filter-repo`) + force-push, and rotating anything secret. That is the owner's decision.

## VPS
- Ship build output and needed files only: deploy from an explicit allow-list (`rsync --files-from` / Docker `COPY` of named paths), never the whole working folder. `.dockerignore` mirrors `.gitignore`.
- No `.git`, `.env` (except the server's own), source maps of private code, test fixtures, scripts with local paths, or `README` notes about personal machines on the server.
- Server-side logs must not print secrets, full card data, full personal data or internal paths in user-facing errors.
- Response headers and error pages reveal no framework versions, server names or stack traces in production.

## Gate
`node <skill-dir>/scripts/scanOpsecLeaks.mjs <repo>` (files git would push) and `--all-files` on any folder about to go to a VPS; `--history` once per repo to review authors and commit messages.
- **HIGH = blocks** the push/deploy until fixed or explicitly allowed by the owner.
- MEDIUM = reviewed; brand items go to `.opsec-allow`.
- Personal words only the owner knows (nicknames, family, client names) go in `~/.config/opsec/denylist.txt` on this machine - never in a repo.
- The owner's global git hook (gitleaks) still runs; never bypass it (`--no-verify`).
