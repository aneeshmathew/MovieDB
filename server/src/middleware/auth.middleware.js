const { verifyAccessToken } = require("../services/token.service");

// Called once per GraphQL request inside the Apollo context function.
// Returns { userId } if a valid access token was presented, otherwise null.
// Resolvers that require auth check context.user and throw unauthorized themselves —
// this stays a pure "who is making this request" lookup, not an enforcement point,
// since public queries (browse/search) share the same context shape.
function getUserFromRequest(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) return null;

  const payload = verifyAccessToken(token);
  if (!payload?.sub) return null;

  return { userId: payload.sub };
}

// Guard used inside resolvers that require auth.
function requireAuth(context) {
  if (!context.user) {
    const ApiError = require("../utils/ApiError");
    throw ApiError.unauthorized();
  }
  return context.user;
}

module.exports = { getUserFromRequest, requireAuth };
