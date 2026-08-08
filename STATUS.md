# MovieDB — Status (as of this session)

Monorepo at root `moviedb/`: `server/` (Express+Apollo+Mongo) + `client/` (React+Vite+TS) +
`scripts/` (setup.js, dev.js). Full plan: `server/moviedb-plan-v3.md`. Phase-by-phase detail:
`server/README.md`, `client/README.md`.

## Run commands
```bash
npm run setup   # once: installs both, .env files (generates JWT secrets), schema+codegen
npm run dev     # every time: starts both dev servers, NO install (fails fast if setup not run)
npm test        # both test suites
npm run build   # client production build
```
Fill `server/.env` manually: `MONGO_URI`, `TMDB_ACCESS_TOKEN` (v4 Bearer token, not v3 key).

## Stack (final, deviates from early plan in places — see notes)
- Backend: Express + **Apollo Server 5** (not 4, was EOL) + `@as-integrations/express4` + Mongoose + Zod + JWT
- Frontend: React 19 + TS + Vite + **Tailwind v4** (CSS-native `@theme`, no `tailwind.config.js`/PostCSS) + TanStack Query + TanStack Virtual + Zustand + react-router-dom + graphql-request + GraphQL Codegen
- Auth: TMDB **v4 Bearer token** (`Authorization` header), not v3 `api_key` query param
- Testing: Vitest+RTL both sides. **149 tests passing** (113 server / 36 client). Playwright E2E suite added (NEW) — see `e2e/README.md`; not executable in this sandbox (TMDB + Playwright's browser CDN both blocked here), run locally.

| Search pagination (NEW) | `typeDefs/movies.typeDefs.js`, `resolvers/movies.resolvers.js` | `searchMovies` returns `SearchResults {movies, page, totalPages, totalResults}` (was a bare `[Movie!]!`) — passes through TMDB's own pagination metadata rather than inferring "last page" from a short results array, which can legitimately happen mid-list too. Same per-`query:page` cache key as before. |

## Backend — DONE (all Phases 1-5 + profile)
| Area | File(s) | Notes |
|---|---|---|
| Auth | `graphql/resolvers/auth.resolvers.js` | register/login/refresh/logout/me. Access token in response body, refresh token httpOnly cookie scoped to `/graphql`. `refreshTokenVersion` on User invalidates refresh tokens on logout/password change. |
| Movies/TMDB | `services/tmdb.service.js`, `models/Movie.js`, `resolvers/movies.resolvers.js` | `getOrFetchMovie(tmdbId)` cache-first helper (Mongo before TMDB), exported for reuse by watchlist/favorites/ratings/OG-route. `Movie.mapTmdbMovie` pure function (list vs detail shape). Classics = 20yr+7.5rating+1000votes threshold. |
| Dashboard | `movies.resolvers.js` `Query.dashboard` | 4 sections cached independently (TTL via `cache.service.js`, node-cache). Personalizes by `preferences.genres` via `personalizeByGenres` (stable partition) in `movieMappers.js`. |
| Watchlist/Favorites | `watchlist.resolvers.js`, `favorites.resolvers.js` | Deliberately separate modules (mirror each other, not shared abstraction). Idempotent add via `findOneAndUpdate` with `$ne` filter. |
| Ratings | `ratings.resolvers.js`, `models/Rating.js` | Unique `(userId,movieId)` index. `avgRating`/`ratingCount` on Movie **recomputed via aggregate** after every write (not incremented in place). `myRatings` query + `Rating.movie` lazy field resolver added this session. |
| Preferences | `preferences.resolvers.js` | Partial `$set` via dot-notation, never clobbers other fields. |
| Profile (NEW) | `profile.resolvers.js`, `profile.typeDefs.js` | `updateProfile`, `changeEmail` (password-confirmed), `changePassword` (bumps `refreshTokenVersion`). |
| OG crawler | `routes/movieOg.route.js`, `middleware/ogCrawler.middleware.js` | `GET /movies/:tmdbId` serves OG HTML to bot UAs, falls through otherwise. HTML-escapes all TMDB text. |
| SPA serving | `app.js` (after `/graphql`) | `express.static` + history-fallback from `CLIENT_DIST_PATH` (default sibling `../../client/dist`), guarded by `fs.existsSync`. **Only works same-origin** — if frontend/backend deploy on separate origins (Vercel+Render), need a platform rewrite instead for OG previews to work. |
| Schema pipeline | `scripts/print-schema.js`, `npm run schema:print` | Prints real schema AST → `schema.graphql`, copied into client, feeds Codegen. Not hand-written. |

**GraphQL surface (current):** Query: `me, dashboard, movie, searchMovies, watchlist, favorites, myLists, list, rating, myRatings, myPreferences`. Mutation: `register, login, refresh, logout, addToWatchlist, removeFromWatchlist, addToFavorites, removeFromFavorites, createList, renameList, deleteList, addToList, removeFromList, upsertRating, deleteRating, updatePreferences, updateProfile, changeEmail, changePassword`. **`searchMovies` now returns `SearchResults!` (`{movies, page, totalPages, totalResults}`), not a bare `[Movie!]!`** — breaking change, made for pagination (see below).

| My Lists (NEW) | `models/List.js`, `typeDefs/lists.typeDefs.js`, `resolvers/lists.resolvers.js` | `List` doc: `{owner, name, movieIds: [Int]}`, unique `(owner,name)` index. Exposed as GraphQL type `MovieList` (named to avoid clashing with GraphQL's own `[Type]` list syntax). `movieIds` returned raw for cheap membership checks; `movies` is a lazy field resolver (only hits `getOrFetchMovie` per id when selected). `addToList` is idempotent (same `$ne`-filter pattern as watchlist/favorites) — on no-op it re-fetches scoped to `{_id, owner}` to distinguish "already in list" from "not found/not yours". All queries/mutations scope directly on `{_id, owner: userId}` rather than fetch-then-check, so another user's list just doesn't match (same shape as nonexistent). Malformed `id` (Mongoose `CastError`) treated as not-found, not a 500.

## Frontend — DONE
| Feature | File(s) | Notes |
|---|---|---|
| Design system | `src/index.css` | Film-stock theme: void black `#0b0b0d`, amber `#e8a33d`, crimson `#c1272d`. Oswald/Inter/IBM Plex Mono via `@fontsource`. Signature element: `SprocketDivider` (CSS radial-gradient sprocket holes). |
| Auth client | `lib/graphqlClient.ts` | Real 401-retry: single in-flight refresh shared across concurrent requests, retry-once. Uses codegen's `withWrapper` hook. |
| Stores | `store/authStore.ts` (token in-memory only, never localStorage), `store/listsStore.ts` (watchlist/favorite id Sets, separate from auth) | |
| Dashboard | `features/dashboard/` | Hero + 4 `MovieRow`s (TanStack Virtual, horizontal) separated by `SprocketDivider`. |
| Movie detail | `features/movies/MovieDetailPage.tsx` (route `/movies/:tmdbId`) | Backdrop, cast, YouTube trailer embed, `StarRating` widget, watchlist/favorite toggles, **Share button (NEW)**, similar-movies row. |
| Search | `features/movies/SearchPage.tsx` (route `/search?q=`) | **Now infinite-scroll (NEW)**: `useInfiniteQuery` over the paginated `searchMovies`, `IntersectionObserver` sentinel triggers `fetchNextPage()`, stops once `page >= totalPages` (from TMDB, not inferred). Results still sorted by `releaseYear` **descending, client-side**, re-applied across the full accumulated set as more pages load (a deliberate trade-off — occasionally reorders visually as new pages arrive, but keeps the original sort-by-year product decision intact). |
| Preferences (NEW) | `features/profile/PreferencesForm.tsx` (tab on `/profile`), `usePreferences.ts`, `lib/genres.ts`, `lib/languages.ts` | Genre picker uses a static hardcoded list of TMDB's 19 official movie genres (`lib/genres.ts`) rather than an extra backend round trip — that list is public and essentially never changes. Language is a curated `<select>` of common ISO codes, not exhaustive. Adult-content/autoplay are custom toggle switches (styled checkboxes, not a UI-library import). One combined "Save preferences" submit, not per-field auto-save — matches `ProfileInfoForm`'s pattern. On success, invalidates `["dashboard"]` too, since dashboard personalization reads `preferences.genres` server-side. |
| Profile | `features/profile/` (route `/profile`, protected) | Tabs: Profile (edit name) / Reviews & Ratings (`myRatings`) / Favorites / Watchlist. Email/password change forms show **generic error messages only** — same reasoning as login. |
| Login | `features/auth/LoginPage.tsx` | Fixed generic error message regardless of actual server response (avoid email-enumeration leak). |
| Share button (NEW) | `components/ShareButton.tsx`, used in `MovieDetailPage.tsx` | `navigator.share` (native OS share sheet) when available, falls back to `navigator.clipboard.writeText` + "Copied!" feedback for 2s otherwise. `AbortError` (person just closed the share sheet) is swallowed, not shown as an error. Always visible regardless of login state — unlike watchlist/favorite, sharing isn't an authed action — so it now sits in a row that always renders, with watchlist/favorite buttons conditionally alongside it. |
| My Lists (NEW) | `features/movies/useMovieLists.ts`, `AddToListMenu.tsx`, `ListsPage.tsx` (route `/lists`), `ListDetailPage.tsx` (route `/lists/:id`) | Lists live entirely in TanStack Query (`["myLists"]`, `["list", id]`) — NOT mirrored into Zustand like watchlist/favorites, since nothing outside a query context needs to read list membership. `AddToListMenu` is the 3rd icon button on `MovieCard` (next to watchlist/favorite): click opens a small popover (plain positioned `div` + click-outside handler, no portal lib) listing the user's lists as checkboxes plus an inline "create new list" input. `useToggleListMembership(listId, movieId)` follows the same explicit-action-at-mutate()-time pattern as `useToggleWatchlist`/`useToggleFavorite`, with optimistic `setQueryData` + rollback on error. `ListsPage` supports inline rename/delete per list (delete behind `window.confirm`). |
| Routing | `App.tsx` | All pages `React.lazy` code-split. `ProtectedRoute` waits for `hasCheckedSession` before redirecting (avoids bouncing a logged-in user on refresh). |

## Known bugs already found+fixed (don't rediscover)
1. **Codegen duplicate-identifier collision**: `typescript` + `typescript-operations` plugins together in one output file → `typescript-operations` re-emits its own copies of every input type. Fix: dropped `typescript` plugin entirely from `codegen.ts` (nothing needs it directly).
2. **Toggle mutation race condition**: `useToggleWatchlist`/`useToggleFavorite` used to take `isInWatchlist` as a hook arg and branch on it inside `mutationFn` — but the optimistic `onMutate` flips that same value before the async fn runs, and `useMutation` uses the latest render's closure, so it fired the opposite action. Fix: action (`"add"|"remove"`) passed explicitly into `mutate(action)` at click-time.
3. **MovieCard + Link**: wrapping cards in `<Link>` requires Router context in tests — use `MemoryRouter` in test wrapper, and `preventDefault`/`stopPropagation` on nested watchlist/favorite buttons so they don't also navigate.
4. Zustand/model methods get monkey-patched in tests by mutating the **module namespace object**, not a destructured import (destructuring breaks the patch since it copies the reference at import time). Applies to `moviesResolvers.getOrFetchMovie` pattern throughout backend tests.
5. Sandbox `mkdir -p /path/{a,b,c}` brace expansion silently fails under `sh` (creates a literal `{a,b,c}`-named dir) — use `bash -c "mkdir -p ..."` explicitly.
6. **MovieDetailPage poster stretch**: flex row (`flex sm:flex-row`) with no `items-start` defaults to `align-items: stretch`, which stretches the poster `<img>` to match the height of the taller text-content sibling. Combined with no `object-fit` set, the image content itself distorted/stretched non-uniformly. Fix: added `sm:items-start` on the row, `aspect-[2/3] object-cover` on the poster (forces correct ratio regardless of container height), and moved the "overlap the backdrop" negative margin from the shared row onto the poster only (`-mt-16 sm:-mt-24`), giving the text column its own small positive `pt-2 sm:pt-4` so title/buttons never overlap the backdrop gradient either.
7. **UI must never show raw error messages / file paths**: fixed 3 places (`App.tsx` global `ErrorFallback`, `DashboardPage.tsx`, `RegisterPage.tsx`) that rendered `error.message` directly. The dangerous one: React lazy-load chunk failures produce messages like `Failed to fetch dynamically imported module: /src/features/...` — a literal source file path shown to the end user. **Rule going forward: never interpolate `error.message`/`error instanceof Error` into user-facing JSX. Always use a static, generic string per error boundary/empty-state; real errors stay in the console only.**

## Environment constraints hit (informational, not bugs)
- Sandbox egress blocks `api.themoviedb.org` and Playwright's browser-binary CDN (`host_not_allowed`) — can't hit live TMDB or take real screenshots from within a Claude session. Verify visually via `npm run dev` yourself.

## TODO / Backlog — ALL ITEMS DONE
Original backlog (My Lists, Share button, Playwright E2E, search pagination, Preferences UI page) is complete as of this session. See sections above for what was built and where. Nothing outstanding from the original list; next steps would come from a new round of planning.
-- Get the Repo ready for vercel deployment. Both client and server has to build and deployed. 
