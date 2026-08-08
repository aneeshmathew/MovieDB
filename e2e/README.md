# E2E tests (Playwright)

These are full end-to-end journeys that drive a real browser against the
real dev stack (client + server + a real MongoDB + real TMDB calls) — a
different tier from the Vitest/RTL component and resolver tests in
`server/tests/` and `client/src/**/*.test.tsx`, which mock everything
external and never touch a browser or a live TMDB.

## One-time setup

Everything else in this repo (`npm run setup`, `npm run dev`) deliberately
needs no root `npm install` — see the root `package.json` description.
Playwright is the one exception, since it's a root-level devDependency:

```bash
npm install                # root only — pulls in @playwright/test
npx playwright install --with-deps chromium
```

You also need a working local stack — same as any other dev session:

```bash
npm run setup   # if you haven't already (fills server/.env, client/.env)
```

Fill in `server/.env` with a **real** `MONGO_URI` and `TMDB_ACCESS_TOKEN`.
These tests search for and open real movies (e.g. "Inception"), so they
need real TMDB data, not the mocked fixtures the Vitest suites use.

## Running

```bash
npm run test:e2e       # headless, spins up npm run dev automatically
npm run test:e2e:ui    # interactive Playwright UI mode, useful while writing specs
```

`playwright.config.ts` starts `npm run dev` itself (same script you'd run
by hand) and waits for `http://localhost:5173`, so you don't need the dev
servers already running — though if they are, it reuses them
(`reuseExistingServer`) instead of double-starting.

## What's covered

- `auth.spec.ts` — register → land on dashboard logged in → log out → log
  back in; plus the generic-error path on wrong credentials.
- `search.spec.ts` — a real query returns results, a nonsense query shows
  the empty state, and an empty `/search` prompts rather than erroring.
- `favorites.spec.ts` — add a favorite from a movie's detail page, confirm
  it shows up on the Favorites profile tab, then remove it.
- `rating.spec.ts` — submit a star rating, confirm it survives a page
  reload (i.e. it's persisted server-side, not just local state), then
  remove it.

Each spec that needs a signed-in user registers a brand-new one via
`fixtures.ts`'s `uniqueUser()` — a fresh email per run — rather than
depending on a seeded fixture user, so repeated runs against the same dev
database never collide on "email already registered".

## Known environment limits (informational)

Real TMDB access and Playwright's browser-binary download are both blocked
in this project's sandboxed dev/CI environment (see the server-side
`STATUS.md` note under "Environment constraints hit"). These specs were
written and typechecked there but not executed end-to-end — run them
locally, where both TMDB and the Playwright CDN are reachable, to verify.
