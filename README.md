# MovieDB Client

The frontend for **MovieDB**, a CineGallery-style cinematic discovery app. A React
single-page app for browsing/searching movies, rating them, and managing personal
watchlists and custom lists.

The backend lives in a separate repo, **[moviedb-server](../moviedb-server)** (adjust
the link once both repos are on GitHub). They're independently deployable — this repo
talks to the server purely over HTTP (GraphQL), never through the filesystem.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4 (CSS-native `@theme`, no config file),
TanStack Query, TanStack Virtual, Zustand, React Router 7, `graphql-request` + GraphQL
Codegen, `lucide-react`. Testing: Vitest + React Testing Library, Playwright (E2E, see
`e2e/README.md`).

## Project structure

```
moviedb-client/
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
├── e2e/                         # Playwright end-to-end specs — see e2e/README.md
│                                 # (needs moviedb-server running alongside this repo)
└── codegen.ts                   # introspects the schema from a running server; see below
```

**Where things live, by concern:**
- **Server state** (anything from the API) → TanStack Query everywhere. Zustand is only
  for genuinely client-only state (the current auth token/user, and watchlist/favorite
  id sets mirrored for fast lookups on cards).
- **GraphQL types** → always generated (`npm run codegen`), never hand-written.

## Getting started

**Prerequisites:** Node.js 18.18+, and the **moviedb-server** backend running somewhere
reachable (locally, or a deployed URL) — this app can't do anything useful without it.

```bash
npm install
cp .env.example .env
```

By default `VITE_API_URL` points at `http://localhost:4000`, matching moviedb-server's
default local port. Change it if your backend runs elsewhere.

With the backend already running (see moviedb-server's README):

```bash
npm run codegen   # generates src/graphql/generated.ts from the server's live schema
npm run dev
```

Client: http://localhost:5173

### Generating types (codegen)

`codegen.ts` introspects the schema directly from a running server's `/graphql`
endpoint — there's no `schema.graphql` file checked into this repo to keep in sync
manually. It reads the server URL from `VITE_API_URL` (falling back to
`http://localhost:4000`), or you can point it elsewhere for one run:

```bash
CODEGEN_SCHEMA_URL=https://moviedb-server.example.com/graphql npm run codegen
```

Re-run `npm run codegen` any time the server's schema changes and you need fresh types.

### Other scripts

```bash
npm run build       # production build
npm run lint         # oxlint
npm test             # Vitest + React Testing Library
```

## Testing

```bash
npm test            # Vitest + RTL — mocks the generated GraphQL SDK, no real backend needed
npm run test:e2e     # Playwright, against a real running moviedb-server — see e2e/README.md
```

## Deployment

Deploy this repo as its own Vercel project (or any static host that can run a Vite
build). `vercel.json` builds with `npm run build` and serves `dist/` with an SPA
rewrite.

In production, set `VITE_API_URL` (in the Vercel project's Environment Variables, not
just `.env` — it's a Vite build-time variable, so it must be set before the build runs)
to the deployed moviedb-server URL, e.g. `https://moviedb-server.vercel.app`, with no
trailing slash and without `/graphql`.
