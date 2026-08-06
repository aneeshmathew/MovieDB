const User = require("../../models/User");
const { requireAuth } = require("../../middleware/auth.middleware");
// Referenced as a namespace (not destructured) so tests can monkey-patch
// moviesResolvers.getOrFetchMovie at call time.
const moviesResolvers = require("./movies.resolvers");

// Maps a user's watchlist items ({movieId, addedAt}) to full Movie docs.
// Cache-first per getOrFetchMovie — only reaches TMDB for a tmdbId that's
// never been seen by this server before.
async function resolveMovieList(items) {
  return Promise.all(items.map((item) => moviesResolvers.getOrFetchMovie(item.movieId)));
}

const resolvers = {
  Query: {
    watchlist: async (_parent, _args, context) => {
      const { userId } = requireAuth(context);
      const user = await User.findById(userId);
      return resolveMovieList(user.watchlist);
    },
  },

  Mutation: {
    addToWatchlist: async (_parent, { movieId }, context) => {
      const { userId } = requireAuth(context);

      // Make sure the movie is cached locally before referencing it, so
      // the returned list always resolves even if this tmdbId was never
      // fetched through dashboard/search/detail first.
      await moviesResolvers.getOrFetchMovie(movieId);

      // Atomic, idempotent add: the filter only matches (and only pushes)
      // when movieId isn't already present, so re-adding is a no-op rather
      // than a duplicate entry.
      let user = await User.findOneAndUpdate(
        { _id: userId, "watchlist.movieId": { $ne: movieId } },
        { $push: { watchlist: { movieId, addedAt: new Date() } } },
        { new: true }
      );

      // Filter matched nothing because the movie was already in the list —
      // that's success, not an error; just re-fetch the current state.
      if (!user) {
        user = await User.findById(userId);
      }

      return resolveMovieList(user.watchlist);
    },

    removeFromWatchlist: async (_parent, { movieId }, context) => {
      const { userId } = requireAuth(context);

      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { watchlist: { movieId } } },
        { new: true }
      );

      return resolveMovieList(user.watchlist);
    },
  },
};

module.exports = resolvers;
