const express = require("express");
const env = require("../config/env");
const { isCrawler, renderOgHtml } = require("../middleware/ogCrawler.middleware");
// Referenced as a namespace, not destructured, so tests can monkey-patch
// moviesResolvers.getOrFetchMovie the same way the GraphQL resolver tests do.
const moviesResolvers = require("../graphql/resolvers/movies.resolvers");

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

const router = express.Router();

router.get("/movies/:tmdbId", async (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";

  // Not a crawler — this route's only job is serving crawlers. Real users
  // fall through to whatever's mounted after this (the built SPA's static
  // files + history-fallback, once the frontend exists).
  if (!isCrawler(userAgent)) {
    return next();
  }

  const tmdbId = Number(req.params.tmdbId);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return next();
  }

  try {
    const movie = await moviesResolvers.getOrFetchMovie(tmdbId);

    const html = renderOgHtml({
      title: movie.title,
      description: movie.overview,
      imageUrl: movie.posterPath ? `${POSTER_BASE_URL}${movie.posterPath}` : null,
      pageUrl: `${env.CLIENT_URL}/movies/${tmdbId}`,
    });

    res.set("Content-Type", "text/html");
    return res.send(html);
  } catch (err) {
    // Don't block the crawler with a 500 just because TMDB/DB lookup
    // failed — fall through so at least *something* responds (SPA or 404).
    return next();
  }
});

module.exports = router;
