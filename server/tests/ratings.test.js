import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const Rating = require("../src/models/Rating");
const Movie = require("../src/models/Movie");
const moviesResolvers = require("../src/graphql/resolvers/movies.resolvers");
const { resolvers: ratingsResolvers } = require("../src/graphql/resolvers/ratings.resolvers");
const ApiError = require("../src/utils/ApiError");

const AUTH_CONTEXT = { user: { userId: "user123" } };
const FAKE_MOVIE = { _id: "movieDocId1", tmdbId: 278, title: "The Shawshank Redemption" };

describe("ratings resolvers", () => {
  let originalFindOne;
  let originalFindOneAndUpdate;
  let originalDeleteOne;
  let originalAggregate;
  let originalMovieUpdateOne;
  let originalGetOrFetchMovie;
  let originalFind;

  beforeEach(() => {
    originalFindOne = Rating.findOne;
    originalFindOneAndUpdate = Rating.findOneAndUpdate;
    originalDeleteOne = Rating.deleteOne;
    originalAggregate = Rating.aggregate;
    originalMovieUpdateOne = Movie.updateOne;
    originalGetOrFetchMovie = moviesResolvers.getOrFetchMovie;
    originalFind = Rating.find;

    moviesResolvers.getOrFetchMovie = vi.fn().mockResolvedValue(FAKE_MOVIE);
    Rating.aggregate = vi.fn().mockResolvedValue([{ _id: 278, avgRating: 4.5, ratingCount: 2 }]);
    Movie.updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
  });

  afterEach(() => {
    Rating.findOne = originalFindOne;
    Rating.findOneAndUpdate = originalFindOneAndUpdate;
    Rating.deleteOne = originalDeleteOne;
    Rating.aggregate = originalAggregate;
    Movie.updateOne = originalMovieUpdateOne;
    moviesResolvers.getOrFetchMovie = originalGetOrFetchMovie;
    Rating.find = originalFind;
  });

  describe("Query.rating", () => {
    it("throws unauthorized without a session", async () => {
      await expect(
        ratingsResolvers.Query.rating(null, { movieId: 278 }, { user: null })
      ).rejects.toThrow(ApiError);
    });

    it("looks up the current user's rating for the movie", async () => {
      const fakeRating = { _id: "r1", userId: "user123", movieId: 278, score: 5 };
      Rating.findOne = vi.fn().mockResolvedValue(fakeRating);

      const result = await ratingsResolvers.Query.rating(null, { movieId: 278 }, AUTH_CONTEXT);

      expect(Rating.findOne).toHaveBeenCalledWith({ userId: "user123", movieId: 278 });
      expect(result).toBe(fakeRating);
    });
  });

  describe("Mutation.upsertRating", () => {
    it("validates score range before touching the database", async () => {
      Rating.findOneAndUpdate = vi.fn();

      await expect(
        ratingsResolvers.Mutation.upsertRating(
          null,
          { movieId: 278, score: 7 },
          AUTH_CONTEXT
        )
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      expect(Rating.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("ensures the movie is cached, upserts the rating, and recomputes the movie's aggregate", async () => {
      const savedRating = { _id: "r1", userId: "user123", movieId: 278, score: 5, review: null };
      Rating.findOneAndUpdate = vi.fn().mockResolvedValue(savedRating);

      const result = await ratingsResolvers.Mutation.upsertRating(
        null,
        { movieId: 278, score: 5 },
        AUTH_CONTEXT
      );

      expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(278);
      expect(Rating.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: "user123", movieId: 278 },
        { $set: { score: 5, review: null } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      expect(Rating.aggregate).toHaveBeenCalled();
      expect(Movie.updateOne).toHaveBeenCalledWith(
        { tmdbId: 278 },
        { $set: { avgRating: 4.5, ratingCount: 2 } }
      );
      expect(result).toBe(savedRating);
    });

    it("passes the review through when provided, rather than nulling it", async () => {
      Rating.findOneAndUpdate = vi.fn().mockResolvedValue({});

      await ratingsResolvers.Mutation.upsertRating(
        null,
        { movieId: 278, score: 4, review: "Great film" },
        AUTH_CONTEXT
      );

      expect(Rating.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: "user123", movieId: 278 },
        { $set: { score: 4, review: "Great film" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    it("translates a duplicate-key error into a 409 ApiError", async () => {
      const dupError = new Error("E11000 duplicate key");
      dupError.code = 11000;
      Rating.findOneAndUpdate = vi.fn().mockRejectedValue(dupError);

      await expect(
        ratingsResolvers.Mutation.upsertRating(null, { movieId: 278, score: 5 }, AUTH_CONTEXT)
      ).rejects.toMatchObject({ code: "RATING_CONFLICT", statusCode: 409 });
    });
  });

  describe("Mutation.deleteRating", () => {
    it("deletes the rating and recomputes the movie's aggregate", async () => {
      Rating.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });
      Rating.aggregate = vi.fn().mockResolvedValue([]); // no ratings left

      const result = await ratingsResolvers.Mutation.deleteRating(
        null,
        { movieId: 278 },
        AUTH_CONTEXT
      );

      expect(Rating.deleteOne).toHaveBeenCalledWith({ userId: "user123", movieId: 278 });
      expect(Movie.updateOne).toHaveBeenCalledWith(
        { tmdbId: 278 },
        { $set: { avgRating: 0, ratingCount: 0 } }
      );
      expect(result).toBe(true);
    });
  });

  describe("Query.myRatings", () => {
    it("throws unauthorized without a session", async () => {
      await expect(
        ratingsResolvers.Query.myRatings(null, {}, { user: null })
      ).rejects.toThrow(ApiError);
    });

    it("finds all of the current user's ratings, sorted by most recently updated", async () => {
      const fakeRatings = [{ movieId: 278 }, { movieId: 550 }];
      const sortMock = vi.fn().mockResolvedValue(fakeRatings);
      Rating.find = vi.fn().mockReturnValue({ sort: sortMock });

      const result = await ratingsResolvers.Query.myRatings(null, {}, AUTH_CONTEXT);

      expect(Rating.find).toHaveBeenCalledWith({ userId: "user123" });
      expect(sortMock).toHaveBeenCalledWith({ updatedAt: -1 });
      expect(result).toBe(fakeRatings);
    });
  });

  describe("Rating.movie field resolver", () => {
    it("resolves the movie via the cache-first getOrFetchMovie helper", async () => {
      const rating = { movieId: 278 };
      const result = await ratingsResolvers.Rating.movie(rating);

      expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(278);
      expect(result).toBe(FAKE_MOVIE);
    });
  });
});
