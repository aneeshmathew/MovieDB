const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const BASE_URL = "https://api.themoviedb.org/3";

// Thresholds for the "classics" discover query — no canonical TMDB list
// exists for this, so it's a curated query. Tunable; see plan v3 §9.
const CLASSICS_MIN_RATING = 7.5;
const CLASSICS_MIN_VOTES = 1000;
const CLASSICS_MAX_AGE_YEARS = 20;

function assertAccessTokenConfigured() {
  if (!env.TMDB_ACCESS_TOKEN) {
    throw ApiError.badGateway(
      "TMDB_ACCESS_TOKEN is not configured on the server",
      "TMDB_NOT_CONFIGURED"
    );
  }
}

async function tmdbFetch(path, params = {}) {
  assertAccessTokenConfigured();

  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  }

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN}`,
        accept: "application/json",
      },
    });
  } catch (err) {
    throw ApiError.badGateway(`Could not reach TMDB: ${err.message}`, "TMDB_UNREACHABLE");
  }

  if (!response.ok) {
    throw ApiError.badGateway(`TMDB request failed with status ${response.status}`, "TMDB_ERROR");
  }

  return response.json();
}

function nYearsAgoDate(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10); // TMDB expects YYYY-MM-DD
}

const tmdbService = {
  getNowPlaying(page = 1) {
    return tmdbFetch("/movie/now_playing", { page });
  },

  getTrendingWeek(page = 1) {
    return tmdbFetch("/trending/movie/week", { page });
  },

  getUpcoming(page = 1) {
    return tmdbFetch("/movie/upcoming", { page });
  },

  getClassics(page = 1) {
    return tmdbFetch("/discover/movie", {
      sort_by: "vote_average.desc",
      "vote_average.gte": CLASSICS_MIN_RATING,
      "vote_count.gte": CLASSICS_MIN_VOTES,
      "primary_release_date.lte": nYearsAgoDate(CLASSICS_MAX_AGE_YEARS),
      page,
    });
  },

  // append_to_response bundles cast, trailers, and similar-movie recommendations
  // into a single TMDB call instead of three separate round trips.
  getMovieDetails(tmdbId) {
    return tmdbFetch(`/movie/${tmdbId}`, { append_to_response: "credits,videos,similar" });
  },

  searchMovies(query, page = 1) {
    return tmdbFetch("/search/movie", { query, page });
  },
};

module.exports = tmdbService;
