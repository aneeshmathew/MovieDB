const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { registerSchema, loginSchema, validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth.middleware");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../services/token.service");

const REFRESH_COOKIE_NAME = "moviedb_refresh";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/graphql", // scoped to the API endpoint, not the whole domain
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — keep in sync with JWT_REFRESH_EXPIRES
};

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_OPTIONS.path });
}

async function issueAuthPayload(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setRefreshCookie(res, refreshToken);
  return { accessToken, user };
}

const resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      const { userId } = requireAuth(context);
      return User.findById(userId);
    },
  },

  Mutation: {
    register: async (_parent, { input }, context) => {
      const data = validate(registerSchema, input);

      const existing = await User.findOne({ email: data.email });
      if (existing) throw ApiError.conflict("An account with this email already exists");

      const passwordHash = await User.hashPassword(data.password);
      const user = await User.create({
        name: data.name,
        email: data.email,
        passwordHash,
      });

      return issueAuthPayload(user, context.res);
    },

    login: async (_parent, { input }, context) => {
      const data = validate(loginSchema, input);

      const user = await User.findOne({ email: data.email }).select("+passwordHash");
      if (!user) throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");

      const passwordMatches = await user.comparePassword(data.password);
      if (!passwordMatches) {
        throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
      }

      return issueAuthPayload(user, context.res);
    },

    refresh: async (_parent, _args, context) => {
      const token = context.req.cookies?.[REFRESH_COOKIE_NAME];
      if (!token) throw ApiError.unauthorized("No refresh token", "NO_REFRESH_TOKEN");

      const payload = verifyRefreshToken(token);
      if (!payload?.sub) throw ApiError.unauthorized("Invalid refresh token", "INVALID_REFRESH_TOKEN");

      const user = await User.findById(payload.sub);
      if (!user) throw ApiError.unauthorized("Invalid refresh token", "INVALID_REFRESH_TOKEN");

      // tokenVersion mismatch means this refresh token was issued before a
      // logout/logout-all — reject even though the JWT signature is valid.
      if (payload.tokenVersion !== user.refreshTokenVersion) {
        throw ApiError.unauthorized("Refresh token has been revoked", "REFRESH_TOKEN_REVOKED");
      }

      return issueAuthPayload(user, context.res);
    },

    logout: async (_parent, _args, context) => {
      // Bump tokenVersion so any outstanding refresh token (this device or
      // others) is invalidated, then clear this device's cookie.
      if (context.user) {
        await User.findByIdAndUpdate(context.user.userId, { $inc: { refreshTokenVersion: 1 } });
      }
      clearRefreshCookie(context.res);
      return true;
    },
  },

  User: {
    id: (user) => user._id.toString(),
    createdAt: (user) => user.createdAt.toISOString(),
  },

  WatchlistItem: {
    addedAt: (item) => item.addedAt.toISOString(),
  },

  FavoriteItem: {
    addedAt: (item) => item.addedAt.toISOString(),
  },
};

module.exports = resolvers;
