# Code clarity inside a file - "organized in blocks"

The folder structure can be perfect and the code inside still unreadable. These are the rules for
what a single file and a single function look like. Apply them in Phase 5 and to every new line in Build mode.

## 1. File layout - always the same order, separated into blocks

```ts
// ─── Imports ──────────────────────────────────────────────
//   1. external packages   2. other features (via their index)   3. same feature (relative)
import { z } from 'zod';
import { sendReceiptEmail } from '@/features/email';
import { orderRepository } from './order.repository';
import type { Order, OrderLine } from './order.types';

// ─── Constants ────────────────────────────────────────────
const MAX_LINES_PER_ORDER = 50;
const VAT_RATE_ITALY = 0.22;

// ─── Public API ───────────────────────────────────────────
export async function placeOrder(input: PlaceOrderInput): Promise<Order> { ... }
export function calculateOrderTotal(lines: OrderLine[]): number { ... }

// ─── Private steps ────────────────────────────────────────
function assertOrderIsValid(lines: OrderLine[]): void { ... }
function applyVat(netAmount: number): number { ... }
```

- One file = one responsibility. Its name says that responsibility.
- Public things first (what a reader came for), private helpers below, in the order they are called.
- Block headers are short separators, not essays. Use them only in files with more than one block.
- Types live in `*.types.ts` when shared; local-only types sit right under Constants.
- React component files: imports -> types/props -> constants -> component -> sub-components used only here -> styles import. Hooks at the top of the component, then derived values, then handlers, then JSX.

## 2. Functions

- **Does one thing**, named as a verb phrase saying what: `calculateOrderTotal`, `sendPayoutApprovedEmail`, `isAccountBreached`. Booleans start with `is/has/can/should`.
- **Short**: aim for under ~30 lines; over ~50 must be split into named steps. The top-level function should read like a recipe:
  ```ts
  export async function placeOrder(input: PlaceOrderInput) {
    const lines = parseOrderLines(input);
    assertOrderIsValid(lines);
    const total = calculateOrderTotal(lines);
    const order = await orderRepository.create({ ...input, lines, total });
    await sendReceiptEmail(order);
    return order;
  }
  ```
- **Flat**: max 3 levels of nesting. Use guard clauses / early returns instead of `if` pyramids.
- **Few parameters**: more than 3-4 -> one typed object parameter (`{ accountId, amount, currency }`).
- **No hidden side effects**: a function called `getX` does not write to the DB or send emails.
- **Pure where possible**: business rules in pure functions (input -> output), I/O at the edges (repository, client, route). Pure functions are the ones tests cover first.

## 3. Names

- Full words: `customer`, not `cust` / `c`; `orderTotalCents`, not `tot`. Loop `i/j` and unused `_` are fine.
- Units in the name when not obvious: `timeoutMs`, `priceCents`, `sizeBytes`, `createdAtUtc`.
- No vague words: `data`, `info`, `item`, `obj`, `result`, `temp`, `value`, `handle`, `process`, `manager`, `helper`, `util`, `stuff`. Say what it is: `pendingPayouts`, `breachedAccount`.
- Same concept = same word everywhere (don't mix `client` / `customer` / `user` for one thing).

## 4. Values

- No magic numbers or strings: give them a named constant at the top of the file or in the feature's `*.constants.ts` (`const PAYOUT_REVIEW_DAYS = 7`).
- No hard-coded URLs, keys, IPs, emails: config/env, validated once at startup.
- Enums or union types for fixed sets (`type OrderStatus = 'pending' | 'paid' | 'refunded'`), never raw strings scattered around.

## 5. Errors and logs

- Never an empty `catch`. Either handle it (with a clear fallback) or rethrow with context.
- Errors carry context: `throw new OrderNotFoundError(orderId)` or `new Error(\`order ${orderId} not found\`)`.
- Log through the project's logger with structured fields (`logger.warn({ orderId, reason }, 'payment declined')`), not `console.log`. Never log secrets, card data or full personal data.
- Validate input at the boundary (route/form/webhook) with a schema; inside the domain trust the types.

## 6. Comments

- Code says **what**; comments say **why** (a business rule, a provider quirk, a past incident). Example: `// PSP rejects US cards on recurring - blocked since 2026-10-19`.
- No commented-out code, no comments that repeat the code, no stale TODOs without an owner/date.
- Public functions of a feature's index get a one-line doc comment if the name alone isn't enough.

## 7. Types

- No `any`; use `unknown` + narrowing at boundaries. No `@ts-ignore` without a reason comment.
- Data crossing a boundary (API, DB, webhook, queue) has an explicit type and, where external, a runtime schema.

## Clarity Table (Phase 5 output)

| # | file:line | Function / block | Problem (length / nesting / params / magic values / vague names / mixed concerns / empty catch) | Rewrite plan (named steps, constants, guard clauses) | Risk |
|---|---|---|---|---|---|

Rewrites in Phase 5 keep behaviour identical: same inputs, outputs, side effects, error messages that callers or users see, and log lines other systems parse.
