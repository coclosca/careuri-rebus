# Advanced engineering standards

Apply in Build mode to every new line, and in Audit mode as findings (Phase 5 for clarity-only fixes,
Phase 6 Hardening for anything that changes behaviour).

## 1. Contracts & strict type safety
- **Zero loose types**: no `any`, no implicit `any` (`strict: true`, `noImplicitAny`), no `as unknown as X` casts to silence errors. Use `unknown` + narrowing at the edge.
- **No implicit coercion**: `===` / `!==` only; no `+value` / `!!value` tricks where intent is unclear - use `Number(value)`, `Boolean(value)`, explicit `value !== undefined`. `??` for "missing", `||` only when `0`/`''` should also fall back (and say so).
- **Every signature typed**: parameters, return types of exported functions, payloads, events, DB rows, API responses.
- **Runtime validation at boundaries**: anything entering from outside (HTTP body/query, webhooks, third-party API responses, env vars, queue messages, localStorage, files) is parsed with a schema (Zod / Valibot / Pydantic). Inside the domain, trust the inferred types (`z.infer<typeof schema>`). Validate outgoing payloads to third parties when a wrong shape costs money or data.
- **Discriminated unions** for states and results (`{ status: 'paid', paidAt } | { status: 'failed', reason }`) instead of optional fields that may or may not be set.
- Python: type hints everywhere, `mypy --strict` / pyright, Pydantic at boundaries.

## 2. Immutability & state discipline
- **Pure business logic**: rules are functions of their inputs, no hidden I/O, no reading globals/time/random inside - pass `now` or a clock in. Pure functions are the first thing tests cover.
- **Immutable updates**: return new objects/arrays (`{ ...order, status: 'paid' }`, `map/filter/reduce`, `toSorted`), never mutate parameters. `readonly` / `as const` on types and constant tables.
- **State isolation**:
  - transient UI state (modal open, hover, input draft, tab) stays local in the component;
  - server/domain state (orders, accounts, balances) lives in the data layer (query cache / store / server) with one owner;
  - derived values are computed, not stored (no `total` state next to `items` state).
- One source of truth per piece of state; no copying server data into local state and letting it drift.
- Side effects (fetch, write, email, log) happen at the edges: route handlers, jobs, effects, repositories - not inside rules or render.

## 3. Performance & memory hygiene
- **Explicit cleanup** for everything that keeps running:
  - `addEventListener` -> `removeEventListener` (or `AbortController` signal);
  - `setInterval` / `setTimeout` -> `clearInterval` / `clearTimeout`;
  - `new WebSocket` / `EventSource` / DB pool / stream -> `.close()` / `.end()`;
  - `subscribe` -> `unsubscribe`; `fetch` in effects -> `AbortController.abort()`;
  - React: every `useEffect` that starts one of these returns a cleanup function;
  - Node: long-lived services handle `SIGTERM` and close servers, pools, intervals.
- **No unbounded growth**: caches and maps have a size limit or TTL; arrays of logs/events are capped.
- **Tree-shaking**: named exports, no giant `export *` barrels that pull a whole feature into every page (front-door `index.ts` re-exports only the public API by name), no side effects at module top level, import specific functions from libraries (`import debounce from 'lodash/debounce'`).
- **Lazy loading**: heavy feature modules, charts, editors, admin-only screens, rarely used dialogs -> `dynamic()` / `React.lazy` / `import()` on demand. Server-only code never in the client bundle.
- **Measure, don't guess**: bundle analyzer, Lighthouse, slow-query log, `EXPLAIN`, profiler - numbers before and after any performance change.

## 4. Safety & atomic refactoring
- **Tests before and after**: the suite runs and is recorded (baseline) before the first change; after every step it shows no new failures. Missing tests on a module about to change -> characterization tests first.
- **Non-destructive**: inputs, outputs, side effects, URLs, user-visible text, log lines other systems parse - 100% identical.
- **Atomic steps, fixed order**, each its own commit with the gate run after it:
  1. purge dead code
  2. rename (files, symbols) in place
  3. move modules into feature folders (with temporary re-export shims)
  4. split monoliths
  5. CSS/tokens
  6. clarity rewrites inside files
  7. remove shims
  Never two kinds of change in one commit; never a behaviour change inside a refactor commit.
- Every step reversible: a commit can be reverted alone without breaking the ones before it.
