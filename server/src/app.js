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
const ApiError = require("./utils/ApiError");

async function createApp() {
  const app = express();

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(cookieParser());

  // Health check — plain REST, useful for Render/Railway uptime checks.
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

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
