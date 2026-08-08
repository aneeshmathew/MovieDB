const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { requireAuth } = require("../../middleware/auth.middleware");
const {
  updateProfileSchema,
  changeEmailSchema,
  changePasswordSchema,
  validate,
} = require("../../middleware/validate");

const resolvers = {
  Mutation: {
    updateProfile: async (_parent, { input }, context) => {
      const { userId } = requireAuth(context);
      const data = validate(updateProfileSchema, input);

      // Only $set fields actually provided — an omitted field should leave
      // the existing value untouched, not get overwritten with undefined.
      const update = {};
      if (data.name !== undefined) update.name = data.name;
      if (data.avatar !== undefined) update.avatar = data.avatar;

      return User.findByIdAndUpdate(userId, { $set: update }, { new: true });
    },

    changeEmail: async (_parent, args, context) => {
      const { userId } = requireAuth(context);
      const data = validate(changeEmailSchema, args);

      const user = await User.findById(userId).select("+passwordHash");
      if (!user) throw ApiError.unauthorized();

      const passwordMatches = await user.comparePassword(data.password);
      if (!passwordMatches) {
        throw ApiError.unauthorized("Incorrect password", "INVALID_CREDENTIALS");
      }

      const existing = await User.findOne({ email: data.newEmail });
      if (existing && existing._id.toString() !== userId) {
        throw ApiError.conflict("An account with this email already exists");
      }

      user.email = data.newEmail;
      await user.save();
      return user;
    },

    changePassword: async (_parent, args, context) => {
      const { userId } = requireAuth(context);
      const data = validate(changePasswordSchema, args);

      const user = await User.findById(userId).select("+passwordHash");
      if (!user) throw ApiError.unauthorized();

      const passwordMatches = await user.comparePassword(data.currentPassword);
      if (!passwordMatches) {
        throw ApiError.unauthorized("Current password is incorrect", "INVALID_CREDENTIALS");
      }

      user.passwordHash = await User.hashPassword(data.newPassword);
      // Invalidates outstanding refresh tokens on every device — standard
      // practice for a password change, same mechanism logout() already uses.
      user.refreshTokenVersion += 1;
      await user.save();

      return true;
    },
  },
};

module.exports = resolvers;
