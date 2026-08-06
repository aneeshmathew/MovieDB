import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// movies.resolvers.js requires tmdb.service.js, which requires config/env.js,
// which validates process.env at require-time — set the baseline vars first.
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const User = require("../src/models/User");
const moviesResolvers = require("../src/graphql/resolvers/movies.resolvers");
const watchlistResolvers = require("../src/graphql/resolvers/watchlist.resolvers");
const ApiError = require("../src/utils/ApiError");

const FAKE_MOVIE = { _id: "movieDocId1", tmdbId: 278, title: "The Shawshank Redemption" };
const AUTH_CONTEXT = { user: { userId: "user123" } };

describe("watchlist resolvers", () => {
  let originalFindOneAndUpdate;
  let originalFindById;
  let originalFindByIdAndUpdate;
  let originalGetOrFetchMovie;

  beforeEach(() => {
    // Save originals so each test can restore them and not leak mocks.
    originalFindOneAndUpdate = User.findOneAndUpdate;
    originalFindById = User.findById;
    originalFindByIdAndUpdate = User.findByIdAndUpdate;
    originalGetOrFetchMovie = moviesResolvers.getOrFetchMovie;

    moviesResolvers.getOrFetchMovie = vi.fn().mockResolvedValue(FAKE_MOVIE);
  });

  afterEach(() => {
    User.findOneAndUpdate = originalFindOneAndUpdate;
    User.findById = originalFindById;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
    moviesResolvers.getOrFetchMovie = originalGetOrFetchMovie;
  });

  describe("Query.watchlist", () => {
    it("throws unauthorized when there is no authenticated user", async () => {
      await expect(
        watchlistResolvers.Query.watchlist(null, {}, { user: null })
      ).rejects.toThrow(ApiError);
    });

    it("resolves the current user's watchlist items to Movie docs", async () => {
      User.findById = vi.fn().mockResolvedValue({
        watchlist: [{ movieId: 278, addedAt: new Date() }],
      });

      const result = await watchlistResolvers.Query.watchlist(null, {}, AUTH_CONTEXT);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(278);
      expect(result).toEqual([FAKE_MOVIE]);
    });
  });

  describe("Mutation.addToWatchlist", () => {
    it("ensures the movie is cached, then pushes it onto the watchlist", async () => {
      User.findOneAndUpdate = vi.fn().mockResolvedValue({
        watchlist: [{ movieId: 278, addedAt: new Date() }],
      });

      const result = await watchlistResolvers.Mutation.addToWatchlist(
        null,
        { movieId: 278 },
        AUTH_CONTEXT
      );

      expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(278);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "user123", "watchlist.movieId": { $ne: 278 } },
        { $push: { watchlist: { movieId: 278, addedAt: expect.any(Date) } } },
        { new: true }
      );
      expect(result).toEqual([FAKE_MOVIE]);
    });

    it("falls back to re-fetching the user when the movie is already present (idempotent add)", async () => {
      // findOneAndUpdate returns null because the $ne filter matched nothing —
      // the movie was already in the list.
      User.findOneAndUpdate = vi.fn().mockResolvedValue(null);
      User.findById = vi.fn().mockResolvedValue({
        watchlist: [{ movieId: 278, addedAt: new Date() }],
      });

      const result = await watchlistResolvers.Mutation.addToWatchlist(
        null,
        { movieId: 278 },
        AUTH_CONTEXT
      );

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(result).toEqual([FAKE_MOVIE]);
    });

    it("throws unauthorized without a valid session", async () => {
      await expect(
        watchlistResolvers.Mutation.addToWatchlist(null, { movieId: 278 }, { user: null })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("Mutation.removeFromWatchlist", () => {
    it("pulls the movie from the watchlist and returns the remaining resolved list", async () => {
      User.findByIdAndUpdate = vi.fn().mockResolvedValue({ watchlist: [] });

      const result = await watchlistResolvers.Mutation.removeFromWatchlist(
        null,
        { movieId: 278 },
        AUTH_CONTEXT
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { $pull: { watchlist: { movieId: 278 } } },
        { new: true }
      );
      expect(result).toEqual([]);
    });
  });
});
