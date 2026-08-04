# MovieDB Server — Phase 1: Foundation

Express + Apollo Server (GraphQL) + MongoDB backend. This phase covers auth end to end;
movies, watchlist, favorites, ratings, and preferences resolvers are added in later phases
(see `moviedb-plan-v3.md`).

## What's here

- **Express + Apollo Server 5**, GraphQL mounted at `POST /graphql`, health check at `GET /health`
- **MongoDB connection** via Mongoose, with fail-fast env validation (Zod) at boot
- **`User` model** — `watchlist[]`, `favorites[]`, `preferences{}`, `refreshTokenVersion` for refresh-token revocation
- **Auth flow**: `register`, `login`, `refresh`, `logout` mutations + `me` query
  - Access token: short-lived JWT, returned in the mutation response (not a cookie) — the frontend keeps it in memory
  - Refresh token: JWT in an **httpOnly cookie**, scoped to `/graphql`
  - `logout` bumps `refreshTokenVersion`, invalidating outstanding refresh tokens
- **Error handling**: `ApiError` class + Apollo `formatError` reshape thrown errors into clean `{ message, extensions: { code, statusCode } }` responses instead of leaking stack traces
- **Validation**: Zod schemas for register/login, checked before any DB call

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGO_URI and generate real JWT secrets
npm run dev             # nodemon, watches src/
```

Generate secrets quickly with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Testing

```bash
npm test
```

`tests/auth.test.js` covers the Zod validation schemas directly.
`tests/app.test.js` boots the Express+Apollo app (no real DB needed) and checks:
health check, schema introspection exposes the 4 auth mutations, and invalid input
is rejected with `VALIDATION_ERROR` before any database call is attempted.

## Trying it against a real database

Once `MONGO_URI` points at a real Atlas cluster (or local `mongod`), `npm run dev` then:

```graphql
mutation {
  register(input: { name: "Ada", email: "ada@example.com", password: "supersecret123" }) {
    accessToken
    user { id name email }
  }
}
```

Apollo Server's default landing page (visit `http://localhost:4000/graphql` in a browser)
gives you an embedded Explorer to run this without a separate client. Refresh tokens are
handled automatically via cookie as long as the client sends `credentials: "include"`.

## Next: Phase 2 — Dashboard & Browse

TMDB integration (`tmdb.service.js`), the `dashboard` query aggregating new releases /
trending / upcoming / classics, `Movie` model with cache-on-read, movie detail query, and
search.
