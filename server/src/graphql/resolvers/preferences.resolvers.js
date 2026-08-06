const User = require("../../models/User");
const { requireAuth } = require("../../middleware/auth.middleware");
const { preferencesSchema, validate } = require("../../middleware/validate");

const resolvers = {
  Query: {
    myPreferences: async (_parent, _args, context) => {
      const { userId } = requireAuth(context);
      const user = await User.findById(userId);
      return user.preferences;
    },
  },

  Mutation: {
    updatePreferences: async (_parent, { input }, context) => {
      const { userId } = requireAuth(context);
      const data = validate(preferencesSchema, input);

      // Only $set the fields the client actually sent, so a partial update
      // (e.g. just toggling adultContent) doesn't clobber genres/language
      // with defaults.
      const update = {};
      for (const [key, value] of Object.entries(data)) {
        update[`preferences.${key}`] = value;
      }

      const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
      return user.preferences;
    },
  },
};

module.exports = resolvers;
