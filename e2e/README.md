# E2E tests (Playwright)

These are full end-to-end journeys that drive a real browser against the
real dev stack (this client + the **moviedb-server** backend + a real
MongoDB + real TMDB calls) — a different tier from the Vitest/RTL
component tests in `src/**/*.test.tsx`, which mock the generated GraphQL
SDK and never touch a browser or a live TMDB.

The backend lives in a separate repo, **moviedb-server** — clone it as a
sibling of this repo and keep it running for the duration of this suite.

## One-time setup

```bash
npm install                # pulls in @playwright/test along with everything else
npx playwright install --with-deps chromium
```

You also need a working local stack:

```bash
# in this repo (moviedb-client)
cp .env.example .env
npm install
npm run codegen             # introspects the schema from a running server, see codegen.ts

# in a sibling clone of moviedb-server
cp .env.example .env        # fill in a real MONGO_URI and TMDB_ACCESS_TOKEN
npm install
npm run dev                  # leave this running — http://localhost:4000
```

These tests search for and open real movies (e.g. "Inception"), so the
server needs real TMDB data, not the mocked fixtures the Vitest suites use.

## Running

With `moviedb-server`'s dev server already running in another terminal:

```bash
npm run test:e2e       # headless, spins up this repo's `npm run dev` (Vite) automatically
npm run test:e2e:ui    # interactive Playwright UI mode, useful while writing specs
```

`playwright.config.ts` starts this repo's `npm run dev` (Vite only) and
waits for `http://localhost:5173`, so you don't need the frontend dev
server already running — though if it is, it's reused
(`reuseExistingServer`) instead of double-started. The backend is **not**
started by this config — start `moviedb-server` yourself first.

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

Real TMDB access and Playwright's browser-binary download may be blocked
in sandboxed dev/CI environments. If these specs are written or edited
somewhere without that access, run them locally, where both TMDB and the
Playwright CDN are reachable, to verify.
