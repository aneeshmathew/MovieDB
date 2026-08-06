const Rating = require("../../models/Rating");
const Movie = require("../../models/Movie");
const ApiError = require("../../utils/ApiError");
const { requireAuth } = require("../../middleware/auth.middleware");
const { ratingSchema, validate } = require("../../middleware/validate");
const moviesResolvers = require("./movies.resolvers");

// Recomputes Movie.avgRating/ratingCount from the Rating collection —
// called after every upsert/delete so the community rating shown on cards
// stays in sync with actual Rating documents (source of truth), rather than
// being incremented/decremented in place and risking drift.
async function recomputeMovieRating(movieId) {
  const [agg] = await Rating.aggregate([
    { $match: { movieId } },
    { $group: { _id: "$movieId", avgRating: { $avg: "$score" }, ratingCount: { $sum: 1 } } },
  ]);

  const avgRating = agg ? Math.round(agg.avgRating * 10) / 10 : 0;
  const ratingCount = agg ? agg.ratingCount : 0;

  await Movie.updateOne({ tmdbId: movieId }, { $set: { avgRating, ratingCount } });
  return { avgRating, ratingCount };
}

const resolvers = {
  Query: {
    rating: async (_parent, { movieId }, context) => {
      const { userId } = requireAuth(context);
      return Rating.findOne({ userId, movieId });
    },
  },

  Mutation: {
    upsertRating: async (_parent, args, context) => {
      const { userId } = requireAuth(context);
      const data = validate(ratingSchema, args);

      // Ensure the movie is cached locally so avgRating/ratingCount have
      // somewhere to land even if this tmdbId was never seen before.
      await moviesResolvers.getOrFetchMovie(data.movieId);

      let rating;
      try {
        rating = await Rating.findOneAndUpdate(
          { userId, movieId: data.movieId },
          // review explicitly set to null when omitted, so resubmitting a
          // rating without a review clears any previous one deterministically
          // rather than leaving stale text behind.
          { $set: { score: data.score, review: data.review ?? null } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        if (err.code === 11000) {
          throw ApiError.conflict("Rating already exists — please retry", "RATING_CONFLICT");
        }
        throw err;
      }

      await recomputeMovieRating(data.movieId);

      return rating;
    },

    deleteRating: async (_parent, { movieId }, context) => {
      const { userId } = requireAuth(context);

      await Rating.deleteOne({ userId, movieId });
      await recomputeMovieRating(movieId);

      return true;
    },
  },

  Rating: {
    id: (rating) => rating._id.toString(),
    createdAt: (rating) => rating.createdAt.toISOString(),
    updatedAt: (rating) => rating.updatedAt.toISOString(),
  },
};

module.exports = { resolvers, recomputeMovieRating };
