import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// movies.resolvers.js requires tmdb.service.js, which requires config/env.js,
// which validates process.env at require-time — set the baseline vars first.
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const List = require("../src/models/List");
const moviesResolvers = require("../src/graphql/resolvers/movies.resolvers");
const listsResolvers = require("../src/graphql/resolvers/lists.resolvers");
const ApiError = require("../src/utils/ApiError");

const FAKE_MOVIE = { _id: "movieDocId1", tmdbId: 278, title: "The Shawshank Redemption" };
const AUTH_CONTEXT = { user: { userId: "user123" } };

function fakeList(overrides = {}) {
  return {
    _id: "list1",
    owner: "user123",
    name: "Weekend Watch",
    movieIds: [278],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("lists resolvers", () => {
  let originalFind;
  let originalFindOne;
  let originalFindOneAndUpdate;
  let originalCreate;
  let originalDeleteOne;
  let originalGetOrFetchMovie;

  beforeEach(() => {
    originalFind = List.find;
    originalFindOne = List.findOne;
    originalFindOneAndUpdate = List.findOneAndUpdate;
    originalCreate = List.create;
    originalDeleteOne = List.deleteOne;
    originalGetOrFetchMovie = moviesResolvers.getOrFetchMovie;

    moviesResolvers.getOrFetchMovie = vi.fn().mockResolvedValue(FAKE_MOVIE);
  });

  afterEach(() => {
    List.find = originalFind;
    List.findOne = originalFindOne;
    List.findOneAndUpdate = originalFindOneAndUpdate;
    List.create = originalCreate;
    List.deleteOne = originalDeleteOne;
    moviesResolvers.getOrFetchMovie = originalGetOrFetchMovie;
  });

  describe("Query.myLists", () => {
    it("throws unauthorized when there is no authenticated user", async () => {
      await expect(listsResolvers.Query.myLists(null, {}, { user: null })).rejects.toThrow(
        ApiError
      );
    });

    it("returns the current user's lists sorted by newest first", async () => {
      const sort = vi.fn().mockResolvedValue([fakeList()]);
      List.find = vi.fn().mockReturnValue({ sort });

      const result = await listsResolvers.Query.myLists(null, {}, AUTH_CONTEXT);

      expect(List.find).toHaveBeenCalledWith({ owner: "user123" });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual([fakeList()]);
    });
  });

  describe("Query.list", () => {
    it("scopes the lookup to the requesting user", async () => {
      List.findOne = vi.fn().mockResolvedValue(fakeList());

      const result = await listsResolvers.Query.list(null, { id: "list1" }, AUTH_CONTEXT);

      expect(List.findOne).toHaveBeenCalledWith({ _id: "list1", owner: "user123" });
      expect(result).toEqual(fakeList());
    });

    it("returns null on a malformed id instead of throwing", async () => {
      const castError = new Error("Cast failed");
      castError.name = "CastError";
      List.findOne = vi.fn().mockRejectedValue(castError);

      const result = await listsResolvers.Query.list(null, { id: "not-an-id" }, AUTH_CONTEXT);

      expect(result).toBeNull();
    });
  });

  describe("Mutation.createList", () => {
    it("creates a list owned by the current user", async () => {
      List.create = vi.fn().mockResolvedValue(fakeList({ name: "Oscar Bait" }));

      const result = await listsResolvers.Mutation.createList(
        null,
        { name: "Oscar Bait" },
        AUTH_CONTEXT
      );

      expect(List.create).toHaveBeenCalledWith({ owner: "user123", name: "Oscar Bait" });
      expect(result.name).toBe("Oscar Bait");
    });

    it("throws a conflict when the user already has a list with that name", async () => {
      const dupError = new Error("duplicate");
      dupError.code = 11000;
      List.create = vi.fn().mockRejectedValue(dupError);

      await expect(
        listsResolvers.Mutation.createList(null, { name: "Weekend Watch" }, AUTH_CONTEXT)
      ).rejects.toThrow(ApiError);
    });

    it("throws validation error on an empty name", async () => {
      await expect(
        listsResolvers.Mutation.createList(null, { name: "  " }, AUTH_CONTEXT)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("Mutation.renameList", () => {
    it("updates the name scoped to owner", async () => {
      List.findOneAndUpdate = vi.fn().mockResolvedValue(fakeList({ name: "New Name" }));

      const result = await listsResolvers.Mutation.renameList(
        null,
        { id: "list1", name: "New Name" },
        AUTH_CONTEXT
      );

      expect(List.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "list1", owner: "user123" },
        { $set: { name: "New Name" } },
        { new: true }
      );
      expect(result.name).toBe("New Name");
    });

    it("throws not found when the list doesn't exist or isn't owned by the user", async () => {
      List.findOneAndUpdate = vi.fn().mockResolvedValue(null);

      await expect(
        listsResolvers.Mutation.renameList(null, { id: "list1", name: "X" }, AUTH_CONTEXT)
      ).rejects.toThrow(ApiError);
    });

    it("throws a conflict on duplicate name", async () => {
      const dupError = new Error("duplicate");
      dupError.code = 11000;
      List.findOneAndUpdate = vi.fn().mockRejectedValue(dupError);

      await expect(
        listsResolvers.Mutation.renameList(null, { id: "list1", name: "X" }, AUTH_CONTEXT)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("Mutation.deleteList", () => {
    it("deletes scoped to owner and returns true", async () => {
      List.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });

      const result = await listsResolvers.Mutation.deleteList(null, { id: "list1" }, AUTH_CONTEXT);

      expect(List.deleteOne).toHaveBeenCalledWith({ _id: "list1", owner: "user123" });
      expect(result).toBe(true);
    });

    it("throws not found when nothing was deleted", async () => {
      List.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 0 });

      await expect(
        listsResolvers.Mutation.deleteList(null, { id: "list1" }, AUTH_CONTEXT)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("Mutation.addToList", () => {
    it("ensures the movie is cached, then pushes it onto the list", async () => {
      List.findOneAndUpdate = vi.fn().mockResolvedValue(fakeList({ movieIds: [278, 550] }));

      const result = await listsResolvers.Mutation.addToList(
        null,
        { id: "list1", movieId: 550 },
        AUTH_CONTEXT
      );

      expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(550);
      expect(List.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "list1", owner: "user123", movieIds: { $ne: 550 } },
        { $push: { movieIds: 550 } },
        { new: true }
      );
      expect(result.movieIds).toEqual([278, 550]);
    });

    it("falls back to re-fetching when the movie is already present (idempotent add)", async () => {
      List.findOneAndUpdate = vi.fn().mockResolvedValue(null);
      List.findOne = vi.fn().mockResolvedValue(fakeList());

      const result = await listsResolvers.Mutation.addToList(
        null,
        { id: "list1", movieId: 278 },
        AUTH_CONTEXT
      );

      expect(List.findOne).toHaveBeenCalledWith({ _id: "list1", owner: "user123" });
      expect(result).toEqual(fakeList());
    });

    it("throws not found when the list doesn't exist or isn't owned by the user", async () => {
      List.findOneAndUpdate = vi.fn().mockResolvedValue(null);
      List.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        listsResolvers.Mutation.addToList(null, { id: "list1", movieId: 278 }, AUTH_CONTEXT)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("Mutation.removeFromList", () => {
    it("pulls the movie and returns the updated list", async () => {
      List.findOneAndUpdate = vi.fn().mockResolvedValue(fakeList({ movieIds: [] }));

      const result = await listsResolvers.Mutation.removeFromList(
        null,
        { id: "list1", movieId: 278 },
        AUTH_CONTEXT
      );

      expect(List.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "list1", owner: "user123" },
        { $pull: { movieIds: 278 } },
        { new: true }
      );
      expect(result.movieIds).toEqual([]);
    });

    it("throws not found when the list doesn't exist or isn't owned by the user", async () => {
      List.findOneAndUpdate = vi.fn().mockResolvedValue(null);

      await expect(
        listsResolvers.Mutation.removeFromList(null, { id: "list1", movieId: 278 }, AUTH_CONTEXT)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("MovieList field resolvers", () => {
    it("movieCount reflects movieIds length", () => {
      expect(listsResolvers.MovieList.movieCount(fakeList({ movieIds: [1, 2, 3] }))).toBe(3);
    });

    it("movies resolves each movieId via getOrFetchMovie", async () => {
      const result = await listsResolvers.MovieList.movies(fakeList({ movieIds: [278] }));
      expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(278);
      expect(result).toEqual([FAKE_MOVIE]);
    });

    it("id stringifies the Mongo _id", () => {
      expect(listsResolvers.MovieList.id(fakeList({ _id: { toString: () => "abc123" } }))).toBe(
        "abc123"
      );
    });
  });
});
