# MovieDB Client — Phase 5 (frontend): Foundation, Dashboard, Auth, Watchlist & Favorites

React + TypeScript + Vite frontend, wired to the MovieDB GraphQL backend (Phases 1-5). This
covers the foundation and the highest-priority screens; movie detail, search, ratings/preferences
UI, and the share button are the natural next slice (see "Not yet built" below).

## Stack (as decided in `moviedb-plan-v3.md`)

- **React 19 + TypeScript + Vite**
- **GraphQL Codegen** — generates fully-typed operations + an SDK **from the real backend
  schema** (see "The schema pipeline" below), not hand-written types
- **TanStack Query** + `graphql-request` — server-state caching, with the actual 401-retry
  logic described in the plan (not just "TanStack Query handles it")
- **Zustand** — two small stores: `authStore` (in-memory access token, current user) and
  `listsStore` (watchlist/favorite movie-id membership) — deliberately separate, since the
  latter changes far more often
- **Tailwind CSS v4** — note: v4 dropped `tailwind.config.js`/PostCSS in favor of a Vite
  plugin + CSS-native `@theme` tokens (see `src/index.css`); the plan's v1-era assumption of a
  JS config file is out of date as of this Tailwind version
- **TanStack Virtual** — horizontal virtualization on genre rows
- **React Router** with `React.lazy` route-based code splitting
- **react-error-boundary** — one boundary wrapping the router
- **Vitest + React Testing Library** — 18 tests, all passing (see "Testing" below)

## Design system

Netflix-style already implies dark + poster-driven, so the differentiation is in the details
rather than the overall shape — grounded in film as a physical medium rather than a generic
dark theme:

- **Palette**: warm-tinted void black (`#0b0b0d`, not pure `#000`), warm paper-white ink,
  film-leader amber accent, marquee crimson (sparing use)
- **Type**: Oswald (condensed, marquee-poster display face) for titles, Inter for UI/body,
  IBM Plex Mono for metadata (years, ratings) — a timecode/ticket-stub feel
- **Signature element**: `SprocketDivider` — a row of evenly-spaced perforations between
  dashboard sections, referencing actual 35mm film sprocket holes (pure CSS background
  pattern, no per-hole DOM nodes)
- **Hero**: backdrop image with a marquee-style title treatment, "Now Screening" eyebrow label

## The schema pipeline (real, not hand-written)

`schema.graphql` in this repo is a **snapshot printed directly from the backend's live
typeDefs** — not manually written. From the server repo:

```bash
npm run schema:print   # writes server/schema.graphql from src/graphql/schema.js
```

Copy that file into this client repo whenever the backend schema changes, then:

```bash
npm run codegen
```

This regenerates `src/graphql/generated.ts` — typed `*Query`/`*Mutation`/`*Fragment` types
plus a `getSdk(client, wrapper)` factory, all matching the actual schema.

**A real bug we hit and fixed, worth knowing about:** including the `typescript` plugin
alongside `typescript-operations` in the same output file causes a genuine duplicate-identifier
collision — `typescript-operations` emits its own self-contained copies of every input type
referenced by a variable (`LoginInput`, `RegisterInput`, `PreferencesInput`), independent of
the schema-wide versions `typescript` emits. Since nothing here imports the schema-wide types
directly, `codegen.ts` deliberately omits the `typescript` plugin. See the comment in
`codegen.ts` if this surprises you when extending the operations.

## Setup

```bash
npm install
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:4000
npm run dev
```

Requires the backend running (see the server repo's README) with a real `MONGO_URI` and
`TMDB_ACCESS_TOKEN` for the dashboard to actually return data.

## Auth flow, concretely

- **Access token**: returned from `login`/`register`, kept in **Zustand state only** — never
  localStorage — per the plan's XSS rationale. This means a hard page refresh always needs a
  fresh token.
- **Session bootstrap** (`useSessionBootstrap`, runs once in `App`): fires a `refresh` mutation
  on mount using the httpOnly refresh cookie. A failure here is the normal, silent state for a
  logged-out visitor — not an error.
- **401 retry** (`src/lib/graphqlClient.ts`): a single in-flight refresh shared across
  concurrent requests (not one refresh call per failed request), retries the original request
  exactly once with the new token, and surfaces the original error if refresh itself fails.
  This is the actual mechanism described in the plan, not a placeholder.
- **`ProtectedRoute`** waits for `hasCheckedSession` before redirecting, so a logged-in user
  refreshing the page isn't bounced to `/login` for a frame while the silent refresh resolves.

## A real bug caught during testing (worth understanding)

`useToggleWatchlist`/`useToggleFavorite` originally took `isInWatchlist`/`isFavorited` as a
hook argument and branched on it inside `mutationFn`. This looked correct but had a race: the
optimistic `onMutate` flips that same boolean in `listsStore` *before* the async `mutationFn`
actually runs, which re-renders `MovieCard` with the flipped value — and `useMutation` always
uses the **latest render's** closures, not the ones from the click. So `mutationFn` would see
the already-flipped value and call the opposite of the intended mutation.

**Fix**: the action (`"add" | "remove"`) is now passed explicitly as the `mutate(action)`
argument, captured at the exact moment of the click, rather than read from a closure that
shifts mid-flight. This is caught by `MovieCard.test.tsx`'s click tests — they were the ones
that surfaced it.

## Testing

```bash
npm test
```

- `src/store/authStore.test.ts`, `src/store/listsStore.test.ts` — store logic in isolation
- `src/components/SprocketDivider.test.tsx` — confirms the decorative divider is
  `aria-hidden`
- `src/features/movies/MovieCard.test.tsx` — poster/title/year rendering, Classic badge,
  toggle buttons hidden when logged out, correct `aria-pressed`/label per membership state,
  and (the important ones) that clicking actually calls the right mutation with the right
  `movieId` — these are what caught the race condition above

## Build

```bash
npm run build   # tsc -b && vite build
```

Verified: type-checks clean, builds successfully, and produces separate chunks per lazy route
(`DashboardPage`, `LoginPage`, `WatchlistPage`, etc. — confirmed in the actual build output,
not assumed).

## Honest limitations of this pass

- **No real screenshot of the running app.** This sandbox's egress rules block both the TMDB
  API and downloading a headless-browser binary (Playwright), so I couldn't verify the visual
  result beyond code review and the production build succeeding. Run `npm run dev` yourself to
  see the real thing — recommend doing that before treating the design as final.
- **Not yet built**: the share button, custom "My Lists," and Playwright E2E coverage. Movie
  detail, search, ratings, and profile management (below) are done as of this update.
- **MovieRow's virtualizer** uses one constant card width for its size estimate, exact at the
  `sm:` breakpoint and up (176px) but slightly approximate below it (cards are 160px on
  mobile) — a minor, acceptable simplification, not a bug, but worth knowing if you're tuning
  spacing.

## Next up

This update added: the movie detail page (cast, trailer embed, `StarRating` widget,
watchlist/favorite toggles, similar-movies row), search (`/search?q=`, sorted by release year
descending client-side), the profile page (tabbed: info/reviews/favorites/watchlist, with
name/email/password management wired to the new backend mutations), and a generic
"login failed" message that no longer leaks the server's specific error reason.

Still open: the share button, "My Lists" (custom user-created lists — see root README's
backlog section), and Playwright E2E coverage.
