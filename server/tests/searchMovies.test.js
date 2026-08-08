import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const Movie = require("../src/models/Movie");
const tmdbService = require("../src/services/tmdb.service");
const cacheService = require("../src/services/cache.service");
const { resolvers } = require("../src/graphql/resolvers/movies.resolvers");

const FAKE_MOVIE_DOC = { _id: "doc1", tmdbId: 100, title: "Dune" };

describe("Query.searchMovies", () => {
  let originalSearchMovies;
  let originalUpsertFromTmdb;

  beforeEach(() => {
    originalSearchMovies = tmdbService.searchMovies;
    originalUpsertFromTmdb = Movie.upsertFromTmdb;
    Movie.upsertFromTmdb = vi.fn().mockResolvedValue(FAKE_MOVIE_DOC);
  });

  afterEach(() => {
    tmdbService.searchMovies = originalSearchMovies;
    Movie.upsertFromTmdb = originalUpsertFromTmdb;
  });

  it("returns an empty shape without calling TMDB for a blank query", async () => {
    tmdbService.searchMovies = vi.fn();

    const result = await resolvers.Query.searchMovies(null, { query: "   " });

    expect(tmdbService.searchMovies).not.toHaveBeenCalled();
    expect(result).toEqual({ movies: [], page: 1, totalPages: 0, totalResults: 0 });
  });

  it("passes through TMDB's page/totalPages/totalResults alongside mapped movies", async () => {
    tmdbService.searchMovies = vi.fn().mockResolvedValue({
      page: 2,
      total_pages: 5,
      total_results: 97,
      results: [{ id: 100, title: "Dune" }],
    });

    const result = await resolvers.Query.searchMovies(null, {
      query: "dune-pagination-test",
      page: 2,
    });

    expect(tmdbService.searchMovies).toHaveBeenCalledWith("dune-pagination-test", 2);
    expect(result).toEqual({
      movies: [FAKE_MOVIE_DOC],
      page: 2,
      totalPages: 5,
      totalResults: 97,
    });
  });

  it("caches per query+page so a repeated request doesn't hit TMDB again", async () => {
    const searchFn = vi.fn().mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [{ id: 100, title: "Dune" }],
    });
    tmdbService.searchMovies = searchFn;

    const uniqueQuery = `cache-test-${Date.now()}`;
    await resolvers.Query.searchMovies(null, { query: uniqueQuery, page: 1 });
    await resolvers.Query.searchMovies(null, { query: uniqueQuery, page: 1 });

    expect(searchFn).toHaveBeenCalledTimes(1);
    cacheService.del(`search:${uniqueQuery.toLowerCase()}:1`);
  });

  it("defaults to page 1 when no page argument is given", async () => {
    tmdbService.searchMovies = vi.fn().mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [],
    });

    await resolvers.Query.searchMovies(null, { query: "no-page-arg-test" });

    expect(tmdbService.searchMovies).toHaveBeenCalledWith("no-page-arg-test", 1);
  });
});
