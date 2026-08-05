# MovieDB — Plan v3 (condensed)

## Stack
- Frontend: React + TypeScript + Vite
- Data: GraphQL (Apollo Server) + graphql-request + TanStack Query + GraphQL Codegen
- Client state: Zustand (auth token in memory, UI toggles only — no Redux)
- Styling: Tailwind CSS
- Virtualization: TanStack Virtual (long rows/grids)
- Backend: Node.js + Express + Apollo Server
- DB: MongoDB Atlas + Mongoose
- Auth: JWT access (short-lived) + httpOnly refresh cookie
- Validation: Zod (frontend + backend)
- Testing: Vitest + RTL (unit/component), Playwright (E2E)
- External data: TMDB API
- Optional: Cloudinary (user avatars, if added later)

## Data Models
```
User: { _id, name, email, passwordHash, avatar, createdAt,
  watchlist: [{movieId, addedAt}],
  favorites: [{movieId, addedAt}],
  preferences: { genres[], language, adultContent, autoplayTrailers } }

Movie: { _id, tmdbId, title, overview, posterPath, backdropPath,
  genres[], releaseDate, runtime, avgRating, ratingCount, isClassic, releaseYear }

Rating: { userId, movieId, score(1-5), review?, createdAt }
  - unique index (userId, movieId), upsert on write
```
Favorites and watchlist are separate arrays (different intent, may overlap), not one polymorphic list.

## GraphQL Schema (surface, not exhaustive)
```
Query {
  dashboard: DashboardSections          # newReleases, classics, trending, upcoming — one round trip
  movie(id): Movie
  searchMovies(q): [Movie]
  watchlist: [Movie]                    # auth required
  favorites: [Movie]                    # auth required
  rating(movieId): Rating
  myPreferences: Preferences
}
Mutation {
  register/login/refresh/logout
  addToWatchlist(movieId) / removeFromWatchlist(movieId)
  addToFavorites(movieId) / removeFromFavorites(movieId)
  upsertRating(movieId, score, review?) / deleteRating(movieId)
  updatePreferences(input)
}
```

## Dashboard → TMDB mapping
| Section | TMDB source |
|---|---|
| New Releases | movie/now_playing |
| Trending | trending/movie/week |
| Upcoming | movie/upcoming |
| Classics | discover/movie: primary_release_date.lte=-20y, vote_average.gte=7.5, vote_count.gte=1000 |

Personalization: reorder/boost sections by `preferences.genres` when logged in; unfiltered version is the logged-out fallback.

## Image Loading
- Poster (card): `t/p/w200/{path}`
- Poster (detail): `t/p/w500/{path}`
- Backdrop (hero): `t/p/w1280/{path}` (not `original` — too large)
- `srcset`/`sizes` for responsive selection; `loading="lazy"` + `decoding="async"` except hero + first ~6 above-fold cards (eager)
- Skeleton/solid-color placeholder while loading (no LQIP available from TMDB)

## Auth Retry (401 handling)
- Single in-flight refresh promise — concurrent 401s share one refresh call, not N
- Retry original request once with new token; no further retries
- TanStack Query `retry` excludes 401 (don't retry with known-stale token)
- Refresh itself 401s → clear auth state, redirect `/login`, no loop

## Layout Rules (Tailwind)
- Flex: horizontal scroll rows (`flex overflow-x-auto gap-4 snap-x`), navbars, button groups — one-dimensional/unbounded
- Grid: card grids (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`), detail page poster+info (`grid-cols-1 md:grid-cols-[300px_1fr]`) — two-dimensional/fixed columns
- Responsive via Tailwind breakpoint prefixes only (no separate media-query system)

## Accessibility (per component)
- Scroll rows: `role="region"` + `aria-label`; keyboard scroll support
- Favorite/watchlist buttons: `aria-pressed`, state-dependent `aria-label`
- Star rating: `role="radiogroup"` + `role="radio"` per star (or native radios styled)
- Search: `aria-label`, `aria-live="polite"` for result-count changes
- Modals: focus trap, focus return on close, `role="dialog"` + `aria-modal="true"`
- Images: descriptive `alt` (`"{title} poster"`); empty alt only for decorative backdrops
- Skip-to-content link at top of page

## Testing Split
- Vitest + RTL: components/hooks (rendering, event handlers, aria state)
- Playwright: critical E2E journeys (register→login, add/remove favorite, submit rating, search)

## Performance
- Route-based code splitting via `React.lazy` + `Suspense` (+ `react-error-boundary`)
- `TanStack Virtual` for genre rows / search grids
- `React.memo` on `MovieCard`; `useMemo`/`useCallback` for derived data
- Framer Motion for card hover/expand (paired with memoized cards to avoid stray re-renders)

## Build Phases

### Phase 1 — Foundation
- Express app setup + Apollo Server mounted as middleware
- MongoDB Atlas connection (`db.js`), env validation (`env.js`)
- `User` model: `watchlist[]`, `favorites[]`, `preferences{}`
- Auth: `register`, `login`, `refresh`, `logout` resolvers
- JWT signing/verification (`token.service.js`), auth middleware attaching `req.user`
- Zod validation schemas for auth inputs
- Error handling middleware + `ApiError` class

### Phase 2 — Dashboard & Browse
- `tmdb.service.js`: wraps TMDB calls, keeps API key server-side
- TMDB methods: `now_playing`, `trending/week`, `upcoming`, `discover` (classics query)
- `cache.service.js`: TTL cache for TMDB responses (avoid rate limits)
- `dashboard` GraphQL query aggregating all 4 sections in one round trip
- `Movie` model + cache-on-read from TMDB
- Movie detail page (GraphQL query for full fields: cast, trailers, similar movies)
- Search (`searchMovies` query, debounced input on frontend)
- Frontend: `DashboardPage` with 4 horizontal-scroll rows, `HeroBanner`, `MovieCard` - todo

### Phase 3 — Watchlist & Favorites
- `addToWatchlist` / `removeFromWatchlist` mutations (`$addToSet` / `$pull`)
- `addToFavorites` / `removeFromFavorites` mutations (mirrors watchlist pattern, separate array)
- Bookmark icon + heart icon toggles on `MovieCard` and detail page
- `WatchlistPage`, `FavoritesPage`
- Optimistic UI updates via TanStack Query mutation callbacks
- ARIA: `aria-pressed` + state-dependent `aria-label` on both toggles

### Phase 4 — Ratings & Preferences
- `upsertRating` / `deleteRating` mutations, unique `(userId, movieId)` index
- Star rating component (`role="radiogroup"`, keyboard-accessible)
- Average rating + user's own rating shown on card/detail page
- `PreferencesPage`: genre multi-select, language, adult-content toggle, autoplay toggle
- `updatePreferences` mutation
- Dashboard personalization: boost/reorder sections by `preferences.genres` for logged-in users

### Phase 5 — Share & Polish
- `ShareButton`: native Web Share API with clipboard-copy fallback
- OG meta-tag crawler middleware on `/movies/:id` for rich link previews
- Loading skeletons, error boundaries (`react-error-boundary`)
- Route-based code splitting (`React.lazy` + `Suspense`)
- `TanStack Virtual` pass on genre rows and search results grid
- `React.memo` on `MovieCard`, `useMemo`/`useCallback` audit on derived state
- Responsive design pass (Tailwind breakpoints), Framer Motion card hover effects
- Full accessibility audit (skip link, focus traps on modals, `aria-live` on search)
- Pagination/infinite scroll on browse and search pages
- Vitest + RTL component tests, Playwright E2E suite (register→login, favorite/watchlist toggle, rating, search)

## Open Decisions
- Apollo Server (default) vs. GraphQL Yoga — Yoga spike optional before Phase 1
- OG meta-tag crawler middleware confirmed as Phase 5, not launch-blocking
- Classics thresholds (20y / 7.5 rating / 1000 votes) — tunable, open to product input