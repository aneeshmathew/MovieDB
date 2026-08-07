const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express4");
const { unwrapResolverError } = require("@apollo/server/errors");

const env = require("./config/env");
const { typeDefs, resolvers } = require("./graphql/schema");
const { getUserFromRequest } = require("./middleware/auth.middleware");
const { errorHandler } = require("./middleware/errorHandler");
const movieOgRoute = require("./routes/movieOg.route");
const ApiError = require("./utils/ApiError");

async function createApp() {
  const app = express();

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(cookieParser());

  // Health check — plain REST, useful for Render/Railway uptime checks.
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Serves an Open Graph HTML shell to link-preview crawlers (Slack,
  // Twitter, iMessage, etc.) hitting /movies/:tmdbId; calls next() for
  // everyone else. IMPORTANT: this only intercepts crawler traffic that
  // actually reaches THIS server. If the frontend and backend are deployed
  // on separate origins (e.g. Vercel + Render, per the original stack
  // table), a crawler hitting the Vercel domain never reaches this route —
  // you'd need either (a) a platform-level rewrite forwarding bot user
  // agents to this backend, or (b) serve the built SPA from this same
  // Express app instead of a separate static host, which is what the
  // CLIENT_DIST_PATH block below this file does. See README §Phase 5.
  app.use(movieOgRoute);

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    // Reshapes thrown ApiErrors into GraphQL error extensions (code, statusCode)
    // instead of leaking stack traces or generic "Internal server error" text.
    formatError: (formattedError, error) => {
      const original = unwrapResolverError(error);

      if (original instanceof ApiError) {
        return {
          message: original.message,
          extensions: {
            code: original.code,
            statusCode: original.statusCode,
            ...(original.details ? { details: original.details } : {}),
          },
        };
      }

      if (formattedError.extensions?.code === "GRAPHQL_PARSE_FAILED") {
        return formattedError;
      }

      console.error("Unhandled resolver error:", original);
      return {
        message: "Internal server error",
        extensions: { code: "INTERNAL_ERROR", statusCode: 500 },
      };
    },
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => {
        const user = getUserFromRequest(req); // { userId } | null
        return { req, res, user };
      },
    })
  );

  // Serves the built frontend (real, non-crawler traffic) from this same
  // Express app — the same-origin fix flagged in the OG-preview comment
  // above. CLIENT_DIST_PATH is configurable because the client and server
  // repos are delivered/deployed separately; it defaults to a sibling
  // "client/dist" next to this server's own parent directory, which only
  // resolves correctly if you've placed them that way. Guarded by
  // fs.existsSync so an API-only deployment (or the test suite, where no
  // client build exists) doesn't crash trying to serve a missing folder —
  // it just skips this block and unmatched routes 404 as before.
  const clientDistPath = env.CLIENT_DIST_PATH
    ? path.resolve(env.CLIENT_DIST_PATH)
    : path.join(__dirname, "../../client/dist");

  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    // History-fallback: any request that isn't a static asset and wasn't
    // already handled above (/health, /movies/:id crawler check, /graphql)
    // gets index.html, so React Router can handle the route client-side.
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  } else {
    console.log(
      `ℹ️  No client build found at ${clientDistPath} — running API-only. ` +
        "Set CLIENT_DIST_PATH or build the client to this path to serve the SPA from this server."
    );
  }

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
