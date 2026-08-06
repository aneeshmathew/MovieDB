const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
  // Express app instead of a separate static host. See README §Phase 5.
  app.use(movieOgRoute);

  // Once the frontend is built, real (non-crawler) requests to /movies/:tmdbId
  // and other client routes fall through to here — serve the SPA's static
  // build with a history-fallback for client-side routing, e.g.:
  //
  //   app.use(express.static(path.join(__dirname, "../../client/dist")));
  //   app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../../client/dist/index.html")));
  //
  // Left commented out until the client/ build actually exists.

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

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
