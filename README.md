# MovieDB

Netflix-style MERN movie database — GraphQL backend (`server/`) + React frontend (`client/`).
See `server/moviedb-plan-v3.md` for the full build plan; `server/README.md` and
`client/README.md` for phase-by-phase detail on each side.

## Quick start

```bash
npm run setup   # once — installs deps, creates .env files, generates schema + codegen
npm run dev     # every time — starts both dev servers, no reinstall
```

**`npm run setup`** (run once, or again after pulling dependency changes):
1. **Installs dependencies** in both `server/` and `client/` (`npm install` in each)
2. **Sets up environment files** — copies `.env.example` → `.env` in both, and for the
   server, generates real random `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` values so it boots
   without you needing to generate them by hand. Existing `.env` files are left untouched.
3. **Generates the GraphQL schema + typed client SDK** — prints the schema from the server's
   live typeDefs, copies it into `client/`, and runs GraphQL Codegen

**`npm run dev`** (run every time you want to start working): starts both dev servers
concurrently with labeled, color-coded output (`[server]`/`[client]`), and shuts both down
cleanly on Ctrl+C or if either one crashes. It does **not** reinstall anything — if you haven't
run `npm run setup` yet, it fails immediately with a clear message telling you to, rather than
letting `vite`/`nodemon` fail confusingly deep inside `server/` or `client/`.

No root `npm install` is required to run either script — `scripts/setup.js` and
`scripts/dev.js` use only Node's built-in modules, specifically so this works on a completely
fresh clone.

**Before the app does anything useful**, fill in two values in `server/.env` (setup can't
generate these for you — they're your own credentials):
- `MONGO_URI` — an Atlas connection string, or `mongodb://localhost:27017/moviedb` for local Mongo
- `TMDB_ACCESS_TOKEN` — from TMDB account settings → API → "API Read Access Token"

Without these, both dev servers still start — the client's Vite server boots fine on its own,
and the backend fails fast with a clear `MongoDB connection failed` error (rather than hanging
or silently half-working) until you provide a real `MONGO_URI`.

## Other root scripts

```bash
npm run setup   # just the install+env+schema+codegen steps, without starting dev servers
npm run build   # production build of the client
npm test        # runs both server and client test suites
```

## Repo layout

```
moviedb/
├── server/    Express + Apollo Server (GraphQL) + MongoDB — see server/README.md
├── client/    React + TypeScript + Vite — see client/README.md
└── scripts/   setup.js (install/env/schema/codegen) + dev.js (concurrent dev servers)
```

This layout is also what the server's `CLIENT_DIST_PATH` default (`../../client/dist`)
assumes, if you later serve the built frontend from the same Express server for the OG-preview
crawler route to work same-origin — see `server/README.md`'s Phase 5 section.
