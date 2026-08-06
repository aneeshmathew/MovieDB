import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const express = require("express");
const request = require("supertest");
const moviesResolvers = require("../src/graphql/resolvers/movies.resolvers");
const movieOgRoute = require("../src/routes/movieOg.route");

const FAKE_MOVIE = {
  tmdbId: 278,
  title: "The Shawshank Redemption",
  overview: "Framed in the 1940s for a double murder.",
  posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
};

const CRAWLER_UA = "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)";
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36";

function buildApp() {
  const app = express();
  app.use(movieOgRoute);
  // A trailing 404 handler, standing in for "whatever comes after this in
  // the real app" (the SPA static serving, once it exists).
  app.use((req, res) => res.status(404).send("not found downstream"));
  return app;
}

describe("GET /movies/:tmdbId (OG crawler route)", () => {
  let originalGetOrFetchMovie;

  beforeEach(() => {
    originalGetOrFetchMovie = moviesResolvers.getOrFetchMovie;
  });

  afterEach(() => {
    moviesResolvers.getOrFetchMovie = originalGetOrFetchMovie;
  });

  it("serves an OG HTML shell to a known crawler user agent", async () => {
    moviesResolvers.getOrFetchMovie = vi.fn().mockResolvedValue(FAKE_MOVIE);
    const app = buildApp();

    const res = await request(app).get("/movies/278").set("User-Agent", CRAWLER_UA);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("The Shawshank Redemption");
    expect(res.text).toContain('og:image" content="https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"');
    expect(res.text).toContain('og:url" content="http://localhost:5173/movies/278"');
    expect(moviesResolvers.getOrFetchMovie).toHaveBeenCalledWith(278);
  });

  it("falls through to the downstream handler for a regular browser user agent", async () => {
    moviesResolvers.getOrFetchMovie = vi.fn().mockResolvedValue(FAKE_MOVIE);
    const app = buildApp();

    const res = await request(app).get("/movies/278").set("User-Agent", BROWSER_UA);

    expect(res.status).toBe(404);
    expect(res.text).toBe("not found downstream");
    expect(moviesResolvers.getOrFetchMovie).not.toHaveBeenCalled();
  });

  it("falls through for a crawler UA with a non-numeric tmdbId, rather than erroring", async () => {
    const app = buildApp();

    const res = await request(app).get("/movies/not-a-number").set("User-Agent", CRAWLER_UA);

    expect(res.status).toBe(404);
  });

  it("falls through gracefully (not a 500) when the movie lookup fails", async () => {
    moviesResolvers.getOrFetchMovie = vi.fn().mockRejectedValue(new Error("TMDB down"));
    const app = buildApp();

    const res = await request(app).get("/movies/278").set("User-Agent", CRAWLER_UA);

    expect(res.status).toBe(404);
    expect(res.text).toBe("not found downstream");
  });

  it("omits the og:image tag when the movie has no poster", async () => {
    moviesResolvers.getOrFetchMovie = vi.fn().mockResolvedValue({ ...FAKE_MOVIE, posterPath: null });
    const app = buildApp();

    const res = await request(app).get("/movies/278").set("User-Agent", CRAWLER_UA);

    expect(res.status).toBe(200);
    expect(res.text).not.toContain("og:image");
  });
});
