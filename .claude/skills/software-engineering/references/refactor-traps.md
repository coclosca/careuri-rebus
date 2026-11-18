# Traps that break "zero behaviour change" refactors

Check this list before executing Phases 2-5.

## Moving and renaming
- **macOS is case-insensitive**: `orders.ts` -> `Orders.ts` silently fails or breaks on Linux CI/VPS. Rename in two steps (`git mv a.ts tmp.ts && git mv tmp.ts A.ts`).
- **Barrel files (`index.ts`) can create circular imports** and change module init order. After adding front doors, run the app, not just typecheck. Never re-export a module that imports the barrel itself.
- **Side-effect imports** (`import './polyfill'`, `import './register-jobs'`) look unused but aren't. Keep their order.
- **Next.js**: `'use client'` / `'use server'` / `server-only` boundaries move with the file; a server module imported into a client file leaks or breaks the build. Route folder names are URLs - never move `app/**/page.tsx`, `route.ts`, `layout.tsx`, `middleware.ts` as part of a cleanup.
- **Path config lives in many places**: `tsconfig.json` paths, jest/vitest `moduleNameMapper`/`alias`, eslint import resolver, Dockerfile `COPY`, PM2/systemd `script`, CI cache keys, `package.json` `main`/`bin`/`exports`, Tailwind `content` globs.
- **Scripts run by Node directly** (`.mjs` in `scripts/`) can't resolve extensionless re-export shims - point them at the new real path.
- **Dynamic paths**: `import(\`./locales/${lang}.json\`)`, `require(path.join(dir, name))`, glob-based registries (`import.meta.glob`, `fs.readdirSync(jobsDir)`). Moving one file out of the folder unregisters it.

## Deleting
- "Unused" exports can be used by: other repos, cron on the server, DB rows naming a handler, email templates looked up by key, feature flags in DB, Caddy/nginx rewrites, links in emails already sent, SEO-indexed URLs.
- Unused-looking CSS can be set by CMS/DB content, email HTML, third-party widgets, or `classList.add(variable)`.
- Dependencies can be used only by config files (`postcss.config`, `tailwind.config`, eslint plugins, babel presets) or CLI scripts - `depcheck` misses some.
- Tests that "fail anyway" may be the only guard of a rule - don't delete them as dead code.

## CSS
- **Cascade order**: splitting or merging CSS files changes which rule wins when specificity ties. Compare screenshots, not just built CSS size.
- Replacing `#1a1a1a` with a token whose value is `#1b1b1b` is a visual change - list it, don't do it silently.
- `@layer` order and `!important` interactions change when files move.

## Code clarity rewrites
- Extracting a function can change `this` binding, closure captures, or evaluation order of side effects.
- Turning a `forEach(async)` into `for...of await` changes concurrency (behaviour change - goes to Hardening, not Phase 5).
- Error messages and log lines may be parsed by alerts, tests or the frontend - keep the text.
- Changing `==` to `===`, `||` to `??`, or truthiness checks changes behaviour on `0`, `''`, `null`. Only in Hardening, with a test.

## Process
- Don't mix a refactor commit with a behaviour change - reviewers (and rollback) need them apart.
- Re-run the gate after **every** commit; a broken step found 10 commits later costs 10x.
- Never `git commit -a` (owner may have uncommitted work); never `--no-verify`.
