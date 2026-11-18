# The 8 engineering pillars - checklist and scoring

Used for the Engineering Health Report (Phase 1) and the Hardening phase (Phase 6), and as the
definition of done in Build mode. Score each pillar 0-3:
**0 missing · 1 weak · 2 decent · 3 solid**, always with evidence (file paths, counts, script output).

| Pillar | 3 = solid looks like | Evidence source |
|---|---|---|
| **1. SOLID architecture** | Clear layers (UI / service / repository / transport), feature folders, one way data flows, decisions written down; SOLID applied (see below) | `inventory.mjs`, reading entry points |
| **2. Clean code** | Short focused functions, clear names, no magic values, no dead or duplicated code, no `any` | `findComplexFunctions.mjs`, `inventory.mjs`, knip/jscpd |
| **3. Test coverage** | Business rules covered by fast unit tests, critical flows (checkout, payments, auth, payouts) by integration/e2e, tests run in one command and pass | test count, `baselineGate.mjs`, untested large files |
| **4. Modular design** | Each feature has an `index.ts` front door, no deep cross-feature imports, `shared/` small | `checkFeatureBoundaries.mjs` |
| **5. Security** | No secrets in code, input validated at every boundary, parameterized SQL, auth checked server-side on every route, no raw HTML from users, dependencies without known critical CVEs, webhooks signature-checked | `engineeringHealthCheck.mjs`, `npm audit --omit=dev`, gitleaks |
| **6. Scalability** | Bounded queries (pagination/LIMIT), indexes for hot queries, no N+1, no heavy sync work in request path, long jobs in queues/cron, caching where reads dominate | `engineeringHealthCheck.mjs`, slow-query log, EXPLAIN |
| **7. Documentation** | Root README (run, test, deploy, env vars), short README per feature (what it does, its front door, its data), decision log for non-obvious choices, `.env.example` complete | file presence, reading |
| **8. Monitoring & logs** | One structured logger, no swallowed errors, error tracking (e.g. Sentry) or at least error logs with context, health endpoint, env validated at startup, alerts on critical failures (payments, webhooks, jobs) | `engineeringHealthCheck.mjs`, reading startup code |

## SOLID in practice (pillar 1)

- **S - Single responsibility**: a module/function has one reason to change. A file that formats emails *and* queries the DB is two files.
- **O - Open/closed**: add new variants (a new payment provider, a new account type) by adding a module that plugs into a registry/strategy map, not by adding another `if` branch in 6 places.
- **L - Liskov substitution**: every implementation of an interface (e.g. `PaymentProvider`) honours the same contract - same errors, same return shape - so callers never check which one they got.
- **I - Interface segregation**: small focused types/interfaces; a component gets the 3 props it needs, not the whole `account` object.
- **D - Dependency inversion**: domain services depend on interfaces (`OrderRepository`, `EmailSender`), concrete DB/API clients are injected at the edge. This is what makes services testable without a DB.

Apply pragmatically: no interface with a single implementation "just in case", no factory for a thing created once. SOLID serves clarity; when it adds layers nobody needs, it is over-engineering - also a debt.

## Report format (Phase 1)

| Pillar | Score 0-3 | Evidence | Biggest gap | Proposed fix (phase) |
|---|---|---|---|---|

Then a one-line verdict per pillar the owner can read without opening code.

## What each pillar needs in Hardening (Phase 6)

These change behaviour or add things, so each item is listed, risk-rated and approved one by one:

- **Tests**: characterization tests first (pin current behaviour, even if odd), then unit tests for pure business rules, then the 3-5 critical flows. Never "fix" a test to match a bug without flagging it.
- **Security**: move secrets to env (and tell the owner which ones to rotate - rotating is the owner's call), parameterize SQL, add schema validation at boundaries, add missing auth checks, verify webhook signatures. Real security holes are reported to the owner immediately, not left for the end of the phase.
- **Scalability**: add LIMIT/pagination, batch N+1 loops, add indexes via a migration (with rollback), move slow work to jobs. Measure before and after.
- **Documentation**: root README, feature READMEs, `.env.example`, `docs/decisions.md` (date, decision, why).
- **Monitoring**: one logger module, replace `console.log`, fill empty catches with logging, env validation at startup, health endpoint. Alert channels are the owner's choice.
