# MovieDB Server — Phase 1 & 2: Foundation, Dashboard & Browse

Express + Apollo Server (GraphQL) + MongoDB backend. Auth (Phase 1) and TMDB-backed
browsing (Phase 2) are both covered here. Watchlist, favorites, ratings, and preferences
resolvers are added in later phases (see `moviedb-plan-v3.md`).

### Phase 3 — Watchlist & Favorites
- **`addToWatchlist(movieId)` / `removeFromWatchlist(movieId)`** and **`addToFavorites(movieId)` / `removeFromFavorites(movieId)`** mutations, plus **`watchlist`** / **`favorites`** queries (current user's list) — all auth-required
- Kept as **two separate resolver modules** (`watchlist.resolvers.js`, `favorites.resolvers.js`) rather than one generic "list" abstraction, per the plan's design call — they mirror each other but stay independent, so favorites-only behavior later doesn't touch watchlist code
- **Idempotent add**: `findOneAndUpdate` with a `{ "watchlist.movieId": { $ne: movieId } }` filter — adding an already-present movie is a no-op, not a duplicate or an error
- **`getOrFetchMovie(tmdbId)`** (exported from `movies.resolvers.js`) is cache-first: checks Mongo before ever calling TMDB, so referencing a movie already seen via dashboard/search/detail costs nothing extra
- `User.watchlist[]` / `User.favorites[]` now store `movieId` as `Int` (TMDB id), matching `Movie.tmdbId`

## What's here (Phase 1 & 2, unchanged)

### Phase 1 — Foundation
- **Express + Apollo Server 5**, GraphQL mounted at `POST /graphql`, health check at `GET /health`
- **MongoDB connection** via Mongoose, with fail-fast env validation (Zod) at boot
- **`User` model** — `watchlist[]`, `favorites[]`, `preferences{}`, `refreshTokenVersion` for refresh-token revocation
- **Auth flow**: `register`, `login`, `refresh`, `logout` mutations + `me` query
  - Access token: short-lived JWT, returned in the mutation response — the frontend keeps it in memory
  - Refresh token: JWT in an **httpOnly cookie**, scoped to `/graphql`
  - `logout` bumps `refreshTokenVersion`, invalidating outstanding refresh tokens
- **Error handling**: `ApiError` class + Apollo `formatError` reshape thrown errors into clean `{ message, extensions: { code, statusCode } }` responses
- **Validation**: Zod schemas for register/login, checked before any DB call

### Phase 2 — Dashboard & Browse
- **`tmdb.service.js`** — wraps all TMDB calls. Uses **TMDB v4 Bearer auth** (`Authorization: Bearer <token>` header), not the v3 `api_key` query param, so the token never appears in URLs or logs
- **`cache.service.js`** — in-memory TTL cache (`node-cache`); caches the *finished, upserted* movie array per section, not raw TMDB JSON, so a cache hit skips both the TMDB call and the Mongo upsert
- **`Movie` model** — cache-on-read from TMDB, with `isClassic`/`releaseYear` precomputed at write time; mapping logic (`Movie.mapTmdbMovie`) is a pure function, unit tested without a DB connection
- **`dashboard` query** — aggregates New Releases (`now_playing`), Trending (`trending/week`), Upcoming (`upcoming`), and Classics (`discover` with a 20yr/7.5-rating/1000-vote threshold) into one round trip
- **`movie(tmdbId)` query** + lazy `cast`/`trailerKey`/`similar` fields on `Movie` — these only trigger a TMDB detail call when actually requested, and share one cache entry regardless of whether a list view or the detail page populates it first
- **`searchMovies(query, page)` query**, short-TTL cached per query+page

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGO_URI` — your Atlas connection string (or `mongodb://localhost:27017/moviedb`)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — two different random strings:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `TMDB_ACCESS_TOKEN` — from TMDB account settings → API → **"API Read Access Token"**
  (the long JWT-looking string, **not** the shorter "API Key"). This is what goes as a
  Bearer token in the `Authorization` header.

```bash
npm run dev   # nodemon, watches src/
```

## Testing

```bash
npm test
```

- `tests/auth.test.js` — Zod validation schemas
- `tests/app.test.js` — boots the Express+Apollo app (no real DB needed): health check,
  schema introspection, validation-before-DB check
- `tests/movies.test.js` — `Movie.mapTmdbMovie` mapping logic against realistic TMDB list-item
  and detail-item fixtures (genre_ids vs. genres, runtime presence, classics threshold logic),
  plus `extractCast`/`extractTrailerKey`
- `tests/tmdb-and-cache.test.js` — cache hit/miss/invalidation semantics, and `tmdb.service`
  request-building + error handling against a mocked `fetch` (no live network call)
- `tests/watchlist.test.js` / `tests/favorites.test.js` — resolver logic with the `User`
  model's statics monkey-patched (no DB needed): idempotent add, `$pull` remove, auth guard,
  and cache-first movie resolution

TMDB itself isn't reachable in every sandboxed environment, so these tests validate the
request-building and data-mapping logic against realistic fixtures rather than hitting the
live API. Recommend a manual pass against the real API once you have a `TMDB_ACCESS_TOKEN`
in your own environment.

## Trying it against a real database + TMDB

Once `MONGO_URI` and `TMDB_ACCESS_TOKEN` are both set, `npm run dev` then visit
`http://localhost:4000/graphql` for Apollo's embedded Explorer, or run:

```graphql
mutation {
  register(input: { name: "Ada", email: "ada@example.com", password: "supersecret123" }) {
    accessToken
    user { id name email }
  }
}
```

```graphql
{
  dashboard {
    trending { title posterPath tmdbVoteAverage }
    classics { title releaseYear isClassic }
  }
}
```

```graphql
{
  movie(tmdbId: 278) {
    title
    runtime
    cast { name character }
    trailerKey
    similar { title }
  }
}
```

Watchlist/favorites mutations require an `Authorization: Bearer <accessToken>` header
(the token returned from `register`/`login`):

```graphql
mutation {
  addToWatchlist(movieId: 278) { title tmdbId }
}
```

```graphql
{
  watchlist { title posterPath }
  favorites { title posterPath }
}
```

## Next: Phase 4 — Ratings & Preferences

`upsertRating`/`deleteRating` mutations against a new `Rating` collection (unique
`(userId, movieId)` index, upsert on write), a `PreferencesPage`-facing `updatePreferences`
mutation, and dashboard personalization that boosts/reorders sections by the user's
preferred genres.

