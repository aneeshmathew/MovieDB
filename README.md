# MovieDB

MovieDB is a CineGallery-style cinematic discovery application designed for film enthusiasts. It provides an immersive interface to browse, search, rate, and curate movies into personalized custom lists, merging a rich streaming-platform user experience with a powerful external data pipeline.

Core Features

    Cinematic Browse & Search: Explore expansive media catalogs with fluid search capabilities, trending lists, and high-resolution visual previews.

    Rating & Custom Organization: Rate films, build tailored watchlists, and manage custom category lists to organize favorite titles.

    Rich Metadata Integration: Leverages comprehensive external data to deliver accurate cast information, summaries, and release metrics.

Technology Stack

    Frontend: React for building a dynamic, responsive single-page application optimized for media consumption.

    Backend: GraphQL server architecture located in server/ for precise, efficient data querying and mutation handling.

    Database & APIs: MongoDB for persistent storage of user profiles and custom lists, integrated with the TMDB 
    (The Movie Database) API for extensive movie metadata.

Engineering Highlights

    Decoupled full-stack architecture with a distinct separation between the client/ React app and the server/ GraphQL backend.

    Optimized data fetching strategies utilizing GraphQL to request only the specific movie details and metadata needed, reducing network overhead.

    Scalable schema design capable of mapping user accounts and custom lists to dynamic external database identifiers.

## Tech stack

| | |
|---|---|
| **Backend** | Node.js, Express 4, Apollo Server 5 (`@as-integrations/express4`), GraphQL, Mongoose 8 / MongoDB, Zod (validation), JWT (`jsonwebtoken`), bcrypt, node-cache |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 (CSS-native `@theme`, no config file), TanStack Query, TanStack Virtual, Zustand, React Router 7, `graphql-request` + GraphQL Codegen, `lucide-react` |
| **Data** | TMDB API v4 (Bearer token) |
| **Testing** | Vitest + React Testing Library (both sides), Playwright (E2E, see `e2e/README.md`) |
| **Deployment** | Vercel — two separate projects, one per app (see `DEPLOYMENT.md`) |

Both `server` and `client` are independent npm packages (their own `package.json`,
`node_modules`, and test suite) orchestrated by the root's `scripts/`.

## Project structure

```
moviedb/
├── scripts/
│   ├── setup.js              # install deps, write .env files, generate schema + codegen
│   └── dev.js                 # run both dev servers concurrently
├── e2e/                        # Playwright end-to-end specs (register→login, search,
│   │                           # favorites, ratings) — see e2e/README.md
│   └── playwright.config.ts    # (at repo root, alongside e2e/)
│
├── server/
│   ├── api/index.js            # Vercel serverless entry (wraps src/app.js)
│   ├── src/
│   │   ├── app.js              # Express app: middleware, Apollo mount, OG route, SPA fallback
│   │   ├── server.js           # traditional entry point (npm run dev / a VM / Render, etc.)
│   │   ├── config/              # env validation (env.js), Mongo connection (db.js)
│   │   ├── graphql/
│   │   │   ├── schema.js        # merges all typeDefs/resolvers into one executable schema
│   │   │   ├── typeDefs/        # one file per feature area (movies, auth, watchlist, ...)
│   │   │   └── resolvers/       # matching resolver files
│   │   ├── middleware/          # auth guard, Zod validation, OG-crawler detection, errors
│   │   ├── models/               # Mongoose schemas: User, Movie, Rating, List
│   │   ├── routes/               # movieOg.route.js — serves OG meta tags to bot user agents
│   │   ├── services/             # tmdb.service.js, cache.service.js, token.service.js
│   │   └── utils/
│   ├── scripts/print-schema.js  # prints the live schema to schema.graphql (feeds codegen)
│   └── tests/                    # Vitest — one file per resolver/route/service area
│
└── client/
    ├── src/
    │   ├── App.tsx                # routes, lazy-loaded pages, ProtectedRoute
    │   ├── main.tsx
    │   ├── components/            # shared UI: Navbar, ConfirmDialog, ShareButton, StarRating, ...
    │   ├── features/
    │   │   ├── auth/               # login/register pages, useAuth
    │   │   ├── dashboard/          # dashboard page, hero banner, useDashboard
    │   │   ├── movies/             # search, detail, lists, cards, rows, and their hooks
    │   │   └── profile/            # profile page (tabbed), preferences, reviews
    │   ├── store/                  # Zustand: authStore (token/user), listsStore (watchlist/fav ids)
    │   ├── graphql/
    │   │   ├── operations/         # .graphql query/mutation/fragment source files
    │   │   └── generated.ts        # Codegen output — typed SDK, do not hand-edit
    │   ├── lib/                    # graphqlClient (SDK + auth-retry), genres/languages, tmdbImage
    │   └── test/setup.ts
    └── schema.graphql              # copied from server/schema.graphql by scripts/setup.js
```

**Where things live, by concern:**
- **Server state** (anything from the API) → TanStack Query everywhere on the client. Zustand
  is only for genuinely client-only state (the current auth token/user, and watchlist/favorite
  id sets mirrored for fast lookups on cards).
- **GraphQL types** → always generated (`npm run codegen` in `client/`), never hand-written.
  The schema itself is generated too (`npm run schema:print` in `server/`) from the resolvers'
  real typeDefs, not maintained as a separate hand-written `.graphql` file.
- **Validation** → Zod schemas in `server/src/middleware/validate.js`, one per mutation that
  takes free-form input.

## Getting started

**Prerequisites:** Node.js 18.18+, a MongoDB instance (Atlas or local), and a
[TMDB](https://www.themoviedb.org/) account for an API read access token.

```bash
npm run setup   # once — installs deps in server/ and client/, writes .env files
                # (generating real JWT secrets for you), prints the schema, runs codegen
npm run dev     # every time — starts both dev servers together
```

`npm run setup` does **not** need a root `npm install` first — `scripts/setup.js` and
`scripts/dev.js` are plain Node scripts with no dependencies of their own, so this works on a
completely fresh clone. (The one exception is the Playwright E2E suite under `e2e/`, which does
need `npm install` at the root — see `e2e/README.md`.)

**Before the app does anything useful**, fill in two values in `server/.env` — setup can't
generate these for you, they're your own credentials:

- `MONGO_URI` — an Atlas connection string, or `mongodb://localhost:27017/moviedb` for local Mongo
- `TMDB_ACCESS_TOKEN` — from TMDB account settings → API → "API Read Access Token" (the v4
  Bearer token, not the v3 `api_key`)

Without these, both dev servers still start — Vite boots fine on its own, and the backend fails
fast with a clear `MongoDB connection failed` error (rather than hanging or half-working) until
`MONGO_URI` is real.

Once both are running:
- Client: http://localhost:5173
- Server: http://localhost:4000/graphql (Apollo Sandbox in development)

### Other root scripts

```bash
npm run setup       # just install+env+schema+codegen, without starting dev servers
npm run build       # production build of the client
npm test            # runs both server and client test suites (Vitest)
npm run test:e2e    # Playwright E2E — needs `npm install` at root first, see e2e/README.md
```

### Re-running codegen after a schema change

If you add or change a GraphQL type/query/mutation on the server, the client's generated types
go stale. Re-sync them:

```bash
cd server && npm run schema:print        # writes server/schema.graphql from the live typeDefs
cp schema.graphql ../client/schema.graphql  # same copy step npm run setup does automatically
cd ../client && npm run codegen             # regenerates src/graphql/generated.ts
```

## Testing

```bash
npm test              # server (Vitest) + client (Vitest + RTL)
npm run test:e2e       # Playwright, against a real running dev stack — see e2e/README.md
```

Server tests mock TMDB/Mongo at the resolver level (no real network or database needed). Client
tests mock the generated GraphQL SDK. Both suites are fast and hermetic; only the Playwright
suite talks to a real (dev) stack end-to-end.

