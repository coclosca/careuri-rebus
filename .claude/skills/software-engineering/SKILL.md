---
name: software-engineering
description: Anti-vibe-coding software engineering standard for every code task - audits, cleans, restructures and writes code on 8 pillars (SOLID architecture, clean code, test coverage, modular design, security, scalability, documentation, monitoring & logs). Audit mode runs a gated, table-first protocol (Health Report, Purge Table, Mapping Table, Style Table, Clarity Table, Hardening) with owner approval before each step; Build mode plans, designs, tests, reviews and documents new features to production quality. Use when the user asks to clean up, remove dead code, reorganize, restructure, compartmentalize, modularize, split monoliths, unify CSS/tokens, make code clearer/readable/organized in blocks, audit code quality, make it production-ready, "super organized", "pulizia del codice", "codice morto", "riorganizza", "compartimentalizza", "scritto bene", "vibe coding vs software engineering", or pastes a Principal Engineer / Systems Architect prompt; also when building a new feature where quality matters.
argument-hint: "[path | audit <path> | build <feature> | check | phase <n>]"
---

# Software Engineering Standard (anti-vibe-coding)

Role: Elite Principal Systems Architect - zero technical debt, compartmentalized, enterprise-grade, surgical precision, absolute respect for working functionality.

## Start - what to do when invoked as `/software-engineering`

Read the arguments (`$ARGUMENTS`) and route without asking:

| Invoked as | Do |
|---|---|
| `/software-engineering` (no args) | If there is a pending task or diff in this conversation: run **Build mode review + Final Structure Check** on it. Otherwise: **Audit mode** on the current working directory (or the project the conversation is about) - Phase 0 + Phase 1 straight away, then stop with the Health Report. |
| `/software-engineering <path>` or `audit <path>` | **Audit mode** on that repo: Phase 0 + Phase 1, then stop. |
| `/software-engineering build <what>` | **Build mode** for that feature/change. |
| `/software-engineering check` | **Final Structure Check** + `engineeringHealthCheck.mjs` on the files changed in this session only; report, fix what's in scope, list the rest. |
| `/software-engineering phase <n>` | Continue Audit mode at that phase, re-reading `REFACTOR_PLAN.md` in the repo for where things stand. |
| "ok" / "vai" / "procedi" after a table | Execute exactly what was approved, then present the next phase's table. |

On every start: first check `REFACTOR_PLAN.md` in the repo - if a run is in progress, resume it instead of starting over. Then load the references needed for the phase (below). Respond to the owner in their language; tables and code in English.

**Vibe coding** = looks good, breaks easily: no plan, no tests, copy-paste, hard-coded values, no docs, hidden debt.
**Software engineering** = built right, scales: every line rests on something verifiable.

Two modes:
- **Audit mode** - an existing codebase gets cleaned and restructured. Gated phases, tables first, zero behaviour change (except the approved Hardening phase).
- **Build mode** - new code or a feature. Plan -> design -> build -> test -> review -> document -> monitor.

Always on, both modes:
1. **No guessing.** Read the code, run the tools, then decide. No trial-and-error edits, no copy-paste from elsewhere in the repo (reuse or extract instead).
2. **The 8 pillars** in [references/engineering-pillars.md](references/engineering-pillars.md): SOLID architecture, clean code, test coverage, modular design, security, scalability, documentation, monitoring & logs.
3. **Code written in blocks** per [references/code-clarity.md](references/code-clarity.md): fixed file layout, short single-purpose functions, guard clauses, named constants, intent-revealing names, no swallowed errors, comments that say *why*.
4. **Before touching a complex module, check its tests.** No tests -> write characterization tests first (or say clearly why not and ask).
5. **Respect what works.** Already clean = keep. Untouchables are never renamed or moved: framework-mandated files, public URLs, API/webhook paths, DB tables/columns, env var names, keys stored in DB, paths named in server configs.
6. **Delivery is the owner's call.** Never push or deploy. Stage files by name (never `git commit -a`), never `--no-verify`.
7. **Close every task with the Final Structure Check** (bottom of this file).
8. **Advanced standards** in [references/advanced-standards.md](references/advanced-standards.md): zero loose types and no implicit coercion, runtime schemas at every boundary, pure functions and immutable updates, UI state never mixed with domain state, explicit cleanup of listeners/timers/sockets/subscriptions, tree-shakeable imports and lazy loading of heavy modules, atomic steps in fixed order.
9. Before executing Phases 2-5, read [references/refactor-traps.md](references/refactor-traps.md).
10. **OPSEC, maniacally** per [references/opsec.md](references/opsec.md): no personal names, emails, usernames, device/computer names, local paths, server IPs, SSH aliases, secrets, cross-business links or internal notes in anything that can reach a VPS - code, comments, docs, tests, commit messages, logs, build output, file names. Neutral git identity. Deploy from an allow-list of files. `scanOpsecLeaks.mjs` HIGH findings block every commit, push and deploy. Never write identity markers into the skill, the repo or a memory file - the scanner reads them from the machine at runtime.

Scripts (Node, no dependencies) live in `scripts/` next to this file. Run them with `node <skill-dir>/scripts/<name>.mjs <repoDir> ...`. They give evidence, not verdicts - confirm every hit by reading the code.

| Script | Gives |
|---|---|
| `inventory.mjs` | sizes, biggest files, many-export files, vague names, type folders, style debt, commented-out code, stack |
| `engineeringHealthCheck.mjs --features src/features` | facts per pillar: secrets, SQL concat, eval, raw HTML, empty catch, console.log, unbounded SELECT, N+1, loose equality, double casts, unvalidated JSON/body, schema library, missing cleanup (listeners/timers/sockets/subscriptions), whole-library imports, heavy static imports, untested big files, READMEs, logger, env validation |
| `findUnusedCss.mjs` | unused classes, unused tokens/custom properties, classes that may be built dynamically |
| `findComplexFunctions.mjs` | long / deeply nested / many-param / magic-number / vague-named functions |
| `checkFeatureBoundaries.mjs --roots src/features --alias @/=src/` | deep cross-feature imports; exit 1 on violation (use as a test/CI step) |
| `baselineGate.mjs snapshot|compare` | typecheck/lint/test/build results saved, then "no new failures vs baseline" check |
| `scanOpsecLeaks.mjs [--all-files] [--history]` | personal names, usernames, computer/device names, home paths, server IPs, SSH aliases, emails, keys, `.env`/dumps/backups/junk files, `.gitignore` gaps, git identity, history authors/messages; exit 1 on HIGH. Allow brand terms in `.opsec-allow`; personal deny-words in `~/.config/opsec/denylist.txt` |

Plus standard tools when available: `npx knip`, `npx depcheck`, `npx jscpd`, `npm audit --omit=dev`, `tsc --noEmit`; Python: `vulture`, `ruff`, `pytest`.

---

# Audit mode

Phases run strictly in order. Each ends with a table and a **STOP**: wait for an explicit "ok" / "vai" / "procedi". Approval of one phase is not approval of the next; partial approval ("only Low") = do only that. **No code file changes until both the Phase 2 Purge Table and the Phase 3 Mapping Table are approved** (the Mapping Table is drawn as if the approved purges are already done). Then execute atomically in this order, one kind of change per commit, gate after each: purge -> rename -> move -> split -> (Phase 4) CSS/tokens -> (Phase 5) clarity -> remove shims. Big tables go into `REFACTOR_PLAN.md` in the repo (with a short summary in chat) so they're readable and another session can continue.

## Phase 0 - Safety net (no code changes)
1. **Existing refactor in progress?** Look for `REFACTOR_PLAN.md`, a `refactor/*` branch, `scripts/refactor-guards/`, `.baseline/README.md`, and the project's memory notes. If found: **continue that plan and use its gates** (its phase numbering, its baseline, its pass criteria). This skill's rules apply on top; never restart or re-baseline a running refactor without the owner's OK.
2. Branch or worktree `refactor/<topic>`; never the live/deploy branch. No git -> local git copy, commit current state.
3. Tag `refactor-baseline-<date>`.
4. `baselineGate.mjs snapshot <repo>` (writes only to `.baseline/gate/`) unless the repo's own gates already cover it; add page screenshots / HTML snapshots and built CSS hash if UI is in scope. Pre-existing failures are recorded, not fixed silently.
5. Read [references/refactor-traps.md](references/refactor-traps.md).

### Code that runs on a VPS / server
- **Never refactor on the server.** All work happens on a local git copy; the server is only read.
- First pull the live code down and **check drift** (server files vs repo, e.g. `rsync -anic server:/path/ ./`). Refactor only code that matches what is live; drift is reported to the owner first.
- Batch SSH into few connections (fail2ban / rate limits). Read-only commands only; never restart services, edit configs, or touch the DB.
- Running processes, cron, systemd/PM2 units, Caddy/nginx configs and webhooks on the server are **Untouchables** evidence: read them in Phase 1 to know what calls what.
- Delivery to the server is a separate step the owner starts, with a rollback plan; this skill never deploys.

## Phase 1 - Audit, Preservation & Health Report
Run `inventory.mjs`, `engineeringHealthCheck.mjs`, `checkFeatureBoundaries.mjs` (if feature folders exist), read the entry points. Output:
- **Engineering Health Report**: the 8 pillars scored 0-3 with evidence, biggest gap and proposed phase (format in engineering-pillars.md). Real security holes are told to the owner right away.
- **OPSEC Report**: `scanOpsecLeaks.mjs <repo> --history` (+ `--all-files` on what is deployed to the VPS). Table: finding, where, severity, fix (move to env / neutral wording / delete file / `.opsec-allow` if it is public brand info / history rewrite = owner's call). Leaks already on the server are told to the owner right away.
- **Preservation List**: what is already clean and stays as-is.
- **Untouchables**.
- **Problem areas** with sizes.
- Baseline results.

STOP.

## Phase 2 - Purge (cut first)
Tools: knip/depcheck/jscpd/tsc, `findUnusedCss.mjs`, grep for commented-out code, `if (false)`, always-off flags. Before calling anything unused, check indirect use: dynamic `import()`/`require(var)`, framework-routed files, job/cron registries, scripts, string-keyed registries, templates by name, DB rows/config, server configs, other repos/VPS, public URLs, links in sent emails.

**Purge Table**:
| # | Element path | Type (File / Function / Export / Var / CSS / Token / Dep / Flag / Commented / Duplicate) | Reason (evidence) | Indirect-use check | Risk (Low / Med / High) |
|---|---|---|---|---|---|

Low = no reference anywhere, tool + grep agree. Med = used only by dead code / a dep used by a script. High = reachable dynamically, by config, URL or another system -> **flagged, not removed** unless the owner says so. Also: "Found but keeping" and "Owner decisions" (anything that would change behaviour).

STOP. On approval, do not delete yet: go to Phase 3. Execution (after Phase 3 approval): one commit per group, `baselineGate.mjs compare` after each, revert a commit that regresses.

## Phase 3 - Compartmentalization & naming (Modular design + SOLID)
- **Feature-first**: each feature/domain is a self-contained folder (pages, components, hooks, service, repository, types, constants, styles, copy, tests, README). `shared/` only for code used by 2+ features. No dumping-ground type folders.
- **Layers**: UI presents state only; business rules in `*.service.ts` (pure, testable); data access in `*.repository.ts`; external APIs in `*.client.ts`; transport typed in `*.types.ts` (+ runtime schema in `*.schema.ts` at external boundaries). Transient UI state stays in components; domain state has one owner in the data layer.
- **Front door**: each feature exposes `index.ts`; others import only from it. Wire `checkFeatureBoundaries.mjs` as a test/CI step so it stays that way.
- **Zero monoliths**: split by responsibility when a file has more than one reason to change (signal: > ~400 lines or many unrelated exports).
- **Naming**: intent-revealing (`calculateInvoiceTax.ts`, `UserRepository.ts`). Banned: `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, `data`, `handler`, single letters (loop `i/j`, `_` ok).
- **Role suffixes** where the framework doesn't impose a name: `.component.tsx`, `.page.tsx`, `.hook.ts`, `.service.ts`, `.repository.ts`, `.client.ts`, `.routes.ts`, `.job.ts`, `.types.ts`, `.constants.ts`, `.schema.ts`, `.styles.css`, `.test.ts`. Follow an existing consistent convention if there is one.
- **Scalable shape**: adding a new feature = adding a folder, not editing ten files.

**Mapping Table** + strategy (target tree, feature list, boundary rule, execution order, verification per step):
| # | Current path | Action (Keep / Move / Rename / Split / Merge) | Target path(s) | Architectural rationale | Risk |
|---|---|---|---|---|---|

STOP. On approval, execute the approved purges first, then renames, then moves, then splits: `git mv`, one feature per commit, temporary re-export shim at each old path (`export * from './new/path'`), update imports/aliases/test paths/scripts/configs/Dockerfiles/CI, gate after each commit, remove all shims in one final commit.

## Phase 4 - Unified CSS & design tokens
- One tokens file (colors, spacing, radius, font sizes/weights, shadows, z-index, breakpoints). Extend the existing one; never create a second.
- Layout CSS separate from component variants; feature styles inside the feature folder; no scattered global CSS.
- Raw hex/rgb, magic px, inline `style={}` values -> tokens, **only if visually identical**; near-misses are listed as design decisions.
- Remove unapplied classes (cross-check Phase 2).

**Style Table**:
| # | File / selector / inline location | Current value | Action (Tokenize / Move / Merge / Remove / Keep) | Token / target | Visual change? (none / tiny / yes) |
|---|---|---|---|---|---|

STOP. Execute per area; compare built CSS and screenshots to baseline - any visual diff must be approved.

## Phase 5 - Code clarity inside files (Clean code)
Run `findComplexFunctions.mjs`, read the hits, apply [references/code-clarity.md](references/code-clarity.md): file layout in blocks, functions that read like a recipe of named steps, guard clauses instead of pyramids, object params instead of long lists, named constants for magic values, intent-revealing names, structured errors, *why*-comments only.

**Clarity Table**:
| # | file:line | Function / block | Problem | Rewrite plan | Risk |
|---|---|---|---|---|---|

STOP. Execute: the module's tests must exist first (characterization tests if needed); one file or feature per commit; same inputs, outputs, side effects, user-visible messages and parsed log lines; gate after each commit.

## Phase 6 - Hardening (Tests, Security, Scalability, Documentation, Monitoring)
These **add or change behaviour**, so they are separate from the refactor, each item listed, risk-rated and approved one by one (details per pillar in engineering-pillars.md):

**Hardening Table**:
| # | Pillar | Gap (evidence) | Fix | Behaviour impact | Risk | Effort |
|---|---|---|---|---|---|---|

Typical items: characterization + unit tests for business rules, tests for the 3-5 critical flows; secrets to env (owner rotates), parameterized SQL, schema validation at boundaries, server-side auth checks, webhook signatures; LIMIT/pagination, N+1 batching, indexes via migration with rollback; root + feature READMEs, `.env.example`, `docs/decisions.md`; one structured logger, no empty catch, env validation at startup, health endpoint.

STOP before each group. Own commits, never mixed with refactor commits.

## Reporting
After each phase: counts removed/moved/tokenized/rewritten, lines of code before -> after, gate result vs baseline, pillar scores before -> after, what was flagged and left, open owner decisions.

---

# Build mode (new feature or significant change)

1. **Plan** - restate the goal, list what exists to reuse (search first), the affected features, data, and risks. Ask only real decisions.
2. **Design** - where it lives (feature folder), its files with role suffixes, its front door, its types/schemas, how it fails, what it logs. Show it briefly before writing if it touches more than one feature or the DB schema.
3. **Build** - in blocks per code-clarity.md and advanced-standards.md: strict types (no `any`, no coercion), schema at every boundary, business rules pure and immutable, I/O at the edges, UI state separate from domain state, every listener/timer/socket/subscription cleaned up, heavy modules lazy-loaded, tokens for every style value, no hard-coded config.
4. **Test** - unit tests for the rules, one test for the main flow, the failure path covered; run the project's tests + typecheck; no new failures vs before.
5. **Review** - re-read the diff as a reviewer: pillars checklist, dead code left behind, duplicates, security, naming. Fix before showing.
6. **Document** - feature README updated (what, front door, data, env vars), *why*-comments where logic isn't obvious, decision noted if non-obvious.
7. **Monitor** - errors logged with context through the project logger, nothing swallowed, critical failures visible.

---

# Final Structure Check (before closing ANY task, both modes)

- [ ] Every new/changed file sits in the right feature folder, with a role suffix and an intent-revealing name.
- [ ] No orphan files: nothing new is unused; anything my change made unused is removed.
- [ ] No scattered CSS: styles in the feature's styles file or tokens; no new raw colors, magic px, inline style values.
- [ ] No logic in the wrong place: no business rules in UI or routes, no DB calls outside repositories, no cross-feature deep imports (`checkFeatureBoundaries.mjs` passes where set up).
- [ ] Functions short and flat, constants named, errors handled and logged, inputs validated.
- [ ] Strict types (no `any`, no `as unknown as`, `===` only); schemas at boundaries; no mutated parameters; UI state not mixed with domain state.
- [ ] Every listener, timer, socket, subscription and abortable fetch I added has its cleanup; heavy imports lazy; no whole-library imports.
- [ ] Tests exist for what I changed and pass; typecheck/lint/build show no new failures vs before.
- [ ] Docs/README/comments updated where behaviour or usage changed.
- [ ] OPSEC: `scanOpsecLeaks.mjs` shows no HIGH in what I added or changed - no personal names, device names, local paths, IPs, SSH aliases, secrets or internal notes in code, comments, tests, commit messages or files to deploy; git identity neutral.
- [ ] Nothing pushed or deployed; untouchables untouched.

Report the check result in one short block at the end of the task (what passed, what is knowingly left and why).
