const User = require("../../models/User");
const { requireAuth } = require("../../middleware/auth.middleware");
const moviesResolvers = require("./movies.resolvers");

async function resolveMovieList(items) {
  return Promise.all(items.map((item) => moviesResolvers.getOrFetchMovie(item.movieId)));
}

const resolvers = {
  Query: {
    favorites: async (_parent, _args, context) => {
      const { userId } = requireAuth(context);
      const user = await User.findById(userId);
      return resolveMovieList(user.favorites);
    },
  },

  Mutation: {
    addToFavorites: async (_parent, { movieId }, context) => {
      const { userId } = requireAuth(context);

      await moviesResolvers.getOrFetchMovie(movieId);

      let user = await User.findOneAndUpdate(
        { _id: userId, "favorites.movieId": { $ne: movieId } },
        { $push: { favorites: { movieId, addedAt: new Date() } } },
        { new: true }
      );

      if (!user) {
        user = await User.findById(userId);
      }

      return resolveMovieList(user.favorites);
    },

    removeFromFavorites: async (_parent, { movieId }, context) => {
      const { userId } = requireAuth(context);

      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { favorites: { movieId } } },
        { new: true }
      );

      return resolveMovieList(user.favorites);
    },
  },
};

module.exports = resolvers;
