import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ApiError = require("../src/utils/ApiError");
const cacheService = require("../src/services/cache.service");

describe("cache.service.getOrSet", () => {
  it("calls fetchFn only once across repeated calls with the same key", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ some: "value" });

    const first = await cacheService.getOrSet("test:key:1", cacheService.TTL.MINUTES(5), fetchFn);
    const second = await cacheService.getOrSet("test:key:1", cacheService.TTL.MINUTES(5), fetchFn);

    expect(first).toEqual({ some: "value" });
    expect(second).toEqual({ some: "value" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("calls fetchFn again for a different key", async () => {
    const fetchFn = vi.fn().mockResolvedValue("a");
    const fetchFn2 = vi.fn().mockResolvedValue("b");

    await cacheService.getOrSet("test:key:2", cacheService.TTL.MINUTES(5), fetchFn);
    await cacheService.getOrSet("test:key:3", cacheService.TTL.MINUTES(5), fetchFn2);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn2).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after the key is explicitly deleted", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce("v1").mockResolvedValue("v2");

    const first = await cacheService.getOrSet("test:key:4", cacheService.TTL.MINUTES(5), fetchFn);
    cacheService.del("test:key:4");
    const second = await cacheService.getOrSet("test:key:4", cacheService.TTL.MINUTES(5), fetchFn);

    expect(first).toBe("v1");
    expect(second).toBe("v2");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

// tmdb.service.js reads config/env.js at require-time, which reads process.env
// at require-time. To vary TMDB_ACCESS_TOKEN per test we set real process.env
// values and clear both modules from Node's require cache so each test gets
// a fresh read — vi.doMock doesn't intercept plain require() in a CJS module.
const ENV_PATH = require.resolve("../src/config/env");
const SERVICE_PATH = require.resolve("../src/services/tmdb.service");

const BASE_ENV = {
  PORT: "4000",
  CLIENT_URL: "http://localhost:5173",
  MONGO_URI: "mongodb://placeholder/moviedb",
  JWT_ACCESS_SECRET: "test-access-secret-please-change-1234567890",
  JWT_REFRESH_SECRET: "test-refresh-secret-please-change-0987654321",
};

function freshTmdbService(tmdbAccessToken) {
  delete require.cache[ENV_PATH];
  delete require.cache[SERVICE_PATH];
  Object.assign(process.env, BASE_ENV, { TMDB_ACCESS_TOKEN: tmdbAccessToken });
  return require("../src/services/tmdb.service");
}

describe("tmdb.service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws a clear ApiError when TMDB_ACCESS_TOKEN is not configured", async () => {
    const tmdbService = freshTmdbService("");

    await expect(tmdbService.getNowPlaying()).rejects.toThrow(ApiError);
    await expect(tmdbService.getNowPlaying()).rejects.toMatchObject({
      code: "TMDB_NOT_CONFIGURED",
      statusCode: 502,
    });
  });

  it("sends the Bearer token as an Authorization header, not a query param", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tmdbService = freshTmdbService("fake-bearer-token");
    await tmdbService.getClassics(2);

    const [calledUrl, calledOptions] = fetchMock.mock.calls[0];
    const url = new URL(calledUrl);

    expect(url.pathname).toBe("/3/discover/movie");
    expect(url.searchParams.get("api_key")).toBeNull(); // must NOT appear in the URL
    expect(calledOptions.headers.Authorization).toBe("Bearer fake-bearer-token");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("vote_average.gte")).toBe("7.5");
    expect(url.searchParams.get("vote_count.gte")).toBe("1000");
    expect(url.searchParams.get("primary_release_date.lte")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("throws a badGateway ApiError on a non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    const tmdbService = freshTmdbService("fake-bearer-token");
    await expect(tmdbService.getNowPlaying()).rejects.toMatchObject({
      code: "TMDB_ERROR",
      statusCode: 502,
    });
  });

  it("throws a badGateway ApiError when the network request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND api.themoviedb.org"))
    );

    const tmdbService = freshTmdbService("fake-bearer-token");
    await expect(tmdbService.searchMovies("dune")).rejects.toMatchObject({
      code: "TMDB_UNREACHABLE",
      statusCode: 502,
    });
  });
});
