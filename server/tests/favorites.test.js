import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const User = require("../src/models/User");
const moviesResolvers = require("../src/graphql/resolvers/movies.resolvers");
const favoritesResolvers = require("../src/graphql/resolvers/favorites.resolvers");
const ApiError = require("../src/utils/ApiError");

const FAKE_MOVIE = { _id: "movieDocId2", tmdbId: 550, title: "Fight Club" };
const AUTH_CONTEXT = { user: { userId: "user123" } };

describe("favorites resolvers", () => {
  let originalFindOneAndUpdate;
  let originalFindById;
  let originalFindByIdAndUpdate;
  let originalGetOrFetchMovie;

  beforeEach(() => {
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

  describe("Query.favorites", () => {
    it("throws unauthorized when there is no authenticated user", async () => {
      await expect(
        favoritesResolvers.Query.favorites(null, {}, { user: null })
      ).rejects.toThrow(ApiError);
    });

    it("resolves the current user's favorites to Movie docs", async () => {
      User.findById = vi.fn().mockResolvedValue({
        favorites: [{ movieId: 550, addedAt: new Date() }],
      });

      const result = await favoritesResolvers.Query.favorites(null, {}, AUTH_CONTEXT);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(550);
      expect(result).toEqual([FAKE_MOVIE]);
    });
  });

  describe("Mutation.addToFavorites", () => {
    it("ensures the movie is cached, then pushes it onto favorites", async () => {
      User.findOneAndUpdate = vi.fn().mockResolvedValue({
        favorites: [{ movieId: 550, addedAt: new Date() }],
      });

      const result = await favoritesResolvers.Mutation.addToFavorites(
        null,
        { movieId: 550 },
        AUTH_CONTEXT
      );

      expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(550);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "user123", "favorites.movieId": { $ne: 550 } },
        { $push: { favorites: { movieId: 550, addedAt: expect.any(Date) } } },
        { new: true }
      );
      expect(result).toEqual([FAKE_MOVIE]);
    });

    it("falls back to re-fetching the user when already favorited (idempotent add)", async () => {
      User.findOneAndUpdate = vi.fn().mockResolvedValue(null);
      User.findById = vi.fn().mockResolvedValue({
        favorites: [{ movieId: 550, addedAt: new Date() }],
      });

      const result = await favoritesResolvers.Mutation.addToFavorites(
        null,
        { movieId: 550 },
        AUTH_CONTEXT
      );

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(result).toEqual([FAKE_MOVIE]);
    });

    it("throws unauthorized without a valid session", async () => {
      await expect(
        favoritesResolvers.Mutation.addToFavorites(null, { movieId: 550 }, { user: null })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("Mutation.removeFromFavorites", () => {
    it("pulls the movie from favorites and returns the remaining resolved list", async () => {
      User.findByIdAndUpdate = vi.fn().mockResolvedValue({ favorites: [] });

      const result = await favoritesResolvers.Mutation.removeFromFavorites(
        null,
        { movieId: 550 },
        AUTH_CONTEXT
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { $pull: { favorites: { movieId: 550 } } },
        { new: true }
      );
      expect(result).toEqual([]);
    });
  });

  it("exposes exactly the two expected mutations, independent of watchlist", () => {
    expect(Object.keys(favoritesResolvers.Mutation)).toEqual([
      "addToFavorites",
      "removeFromFavorites",
    ]);
  });
});
