const List = require("../../models/List");
const ApiError = require("../../utils/ApiError");
const { requireAuth } = require("../../middleware/auth.middleware");
const { listNameSchema, validate } = require("../../middleware/validate");
// Referenced as a namespace (not destructured) so tests can monkey-patch
// moviesResolvers.getOrFetchMovie at call time — same reasoning as
// watchlist/favorites/ratings resolvers.
const moviesResolvers = require("./movies.resolvers");

// A malformed `id` (not a valid ObjectId) makes Mongoose throw a CastError
// before any query filter is even evaluated. Treated the same as "no
// matching document" everywhere below, rather than surfacing a 500.
function isCastError(err) {
  return err?.name === "CastError";
}

const resolvers = {
  Query: {
    myLists: async (_parent, _args, context) => {
      const { userId } = requireAuth(context);
      return List.find({ owner: userId }).sort({ createdAt: -1 });
    },

    list: async (_parent, { id }, context) => {
      const { userId } = requireAuth(context);
      try {
        // Scoping the filter to owner (rather than fetching by id alone
        // and checking ownership after) means someone else's list simply
        // doesn't match — same shape of response as a nonexistent id.
        return await List.findOne({ _id: id, owner: userId });
      } catch (err) {
        if (isCastError(err)) return null;
        throw err;
      }
    },
  },

  Mutation: {
    createList: async (_parent, args, context) => {
      const { userId } = requireAuth(context);
      const { name } = validate(listNameSchema, args);

      try {
        return await List.create({ owner: userId, name });
      } catch (err) {
        if (err.code === 11000) {
          throw ApiError.conflict("You already have a list with that name", "LIST_NAME_CONFLICT");
        }
        throw err;
      }
    },

    renameList: async (_parent, args, context) => {
      const { userId } = requireAuth(context);
      const { name } = validate(listNameSchema, args);

      let list;
      try {
        list = await List.findOneAndUpdate(
          { _id: args.id, owner: userId },
          { $set: { name } },
          { new: true }
        );
      } catch (err) {
        if (isCastError(err)) throw ApiError.notFound("List not found");
        if (err.code === 11000) {
          throw ApiError.conflict("You already have a list with that name", "LIST_NAME_CONFLICT");
        }
        throw err;
      }

      if (!list) throw ApiError.notFound("List not found");
      return list;
    },

    deleteList: async (_parent, { id }, context) => {
      const { userId } = requireAuth(context);

      let result;
      try {
        result = await List.deleteOne({ _id: id, owner: userId });
      } catch (err) {
        if (isCastError(err)) throw ApiError.notFound("List not found");
        throw err;
      }

      if (result.deletedCount === 0) throw ApiError.notFound("List not found");
      return true;
    },

    addToList: async (_parent, { id, movieId }, context) => {
      const { userId } = requireAuth(context);

      // Ensure the movie is cached locally so `movies` can always resolve
      // it later, even if this tmdbId was never fetched through
      // dashboard/search/detail first.
      await moviesResolvers.getOrFetchMovie(movieId);

      let list;
      try {
        // Atomic, idempotent add: the filter only matches (and only
        // pushes) when movieId isn't already present — mirrors
        // addToWatchlist/addToFavorites.
        list = await List.findOneAndUpdate(
          { _id: id, owner: userId, movieIds: { $ne: movieId } },
          { $push: { movieIds: movieId } },
          { new: true }
        );
      } catch (err) {
        if (isCastError(err)) throw ApiError.notFound("List not found");
        throw err;
      }

      if (!list) {
        // Either the movie was already in the list (filter's $ne excluded
        // it — success, not an error) or the list doesn't exist/isn't
        // owned by this user. Re-fetch to tell the two apart.
        list = await List.findOne({ _id: id, owner: userId });
        if (!list) throw ApiError.notFound("List not found");
      }

      return list;
    },

    removeFromList: async (_parent, { id, movieId }, context) => {
      const { userId } = requireAuth(context);

      let list;
      try {
        list = await List.findOneAndUpdate(
          { _id: id, owner: userId },
          { $pull: { movieIds: movieId } },
          { new: true }
        );
      } catch (err) {
        if (isCastError(err)) throw ApiError.notFound("List not found");
        throw err;
      }

      if (!list) throw ApiError.notFound("List not found");
      return list;
    },
  },

  MovieList: {
    id: (list) => list._id.toString(),
    movieCount: (list) => list.movieIds.length,
    movies: (list) => Promise.all(list.movieIds.map((movieId) => moviesResolvers.getOrFetchMovie(movieId))),
    createdAt: (list) => list.createdAt.toISOString(),
    updatedAt: (list) => list.updatedAt.toISOString(),
  },
};

module.exports = resolvers;
