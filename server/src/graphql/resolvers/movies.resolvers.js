const Movie = require("../../models/Movie");
const User = require("../../models/User");
const tmdbService = require("../../services/tmdb.service");
const cacheService = require("../../services/cache.service");
const { extractCast, extractTrailerKey, personalizeByGenres } = require("./movieMappers");

const { TTL } = cacheService;

// Upserts a list of raw TMDB movie objects into our Movie collection and
// returns the resulting Mongoose docs, in the same order.
async function upsertMovies(tmdbMovies = []) {
  return Promise.all(tmdbMovies.map((m) => Movie.upsertFromTmdb(m)));
}

// Fetches + caches the full TMDB detail payload (movie + credits + videos +
// similar) for a given tmdbId. Shared by Query.movie and the Movie.cast /
// Movie.trailerKey / Movie.similar field resolvers, so whichever one runs
// first populates the cache for the others.
function loadDetail(tmdbId) {
  return cacheService.getOrSet(`movieDetail:${tmdbId}`, TTL.DAYS(7), () =>
    tmdbService.getMovieDetails(tmdbId)
  );
}

// Cache-first lookup used by watchlist/favorites: if the movie is already
// cached locally (e.g. seen on the dashboard or in search), skip the TMDB
// call entirely — a partial (list-only) cached doc is fine for card
// display, since cast/trailer/similar still resolve lazily either way.
// Only reaches out to TMDB when this tmdbId has genuinely never been seen.
async function getOrFetchMovie(tmdbId) {
  const existing = await Movie.findOne({ tmdbId });
  if (existing) return existing;

  const detail = await loadDetail(tmdbId);
  return Movie.upsertFromTmdb(detail);
}

const resolvers = {
  Query: {
    dashboard: async (_parent, _args, context) => {
      const [newReleases, trending, upcoming, classics] = await Promise.all([
        cacheService.getOrSet("dashboard:newReleases", TTL.DAYS(1), async () =>
          upsertMovies((await tmdbService.getNowPlaying()).results)
        ),
        cacheService.getOrSet("dashboard:trending", TTL.HOURS(4), async () =>
          upsertMovies((await tmdbService.getTrendingWeek()).results)
        ),
        cacheService.getOrSet("dashboard:upcoming", TTL.DAYS(1), async () =>
          upsertMovies((await tmdbService.getUpcoming()).results)
        ),
        cacheService.getOrSet("dashboard:classics", TTL.DAYS(1), async () =>
          upsertMovies((await tmdbService.getClassics()).results)
        ),
      ]);

      // Boost/reorder each section by the logged-in user's preferred genres.
      // Sections themselves stay cached and shared across users — only this
      // final reordering is per-user, and it's cheap (in-memory partition).
      let preferredGenres = [];
      if (context?.user) {
        const user = await User.findById(context.user.userId).select("preferences.genres");
        preferredGenres = user?.preferences?.genres || [];
      }

      return {
        newReleases: personalizeByGenres(newReleases, preferredGenres),
        trending: personalizeByGenres(trending, preferredGenres),
        upcoming: personalizeByGenres(upcoming, preferredGenres),
        classics: personalizeByGenres(classics, preferredGenres),
      };
    },

    movie: async (_parent, { tmdbId }) => {
      const detail = await loadDetail(tmdbId);
      return Movie.upsertFromTmdb(detail);
    },

    searchMovies: async (_parent, { query, page = 1 }) => {
      const trimmed = query.trim();
      if (!trimmed) return { movies: [], page: 1, totalPages: 0, totalResults: 0 };

      return cacheService.getOrSet(
        `search:${trimmed.toLowerCase()}:${page}`,
        TTL.HOURS(1),
        async () => {
          const raw = await tmdbService.searchMovies(trimmed, page);
          const movies = await upsertMovies(raw.results);
          // TMDB's own page/total_pages/total_results, passed through so the
          // client knows when to stop paginating without guessing from a
          // short final page (which can legitimately happen mid-list too).
          return {
            movies,
            page: raw.page,
            totalPages: raw.total_pages,
            totalResults: raw.total_results,
          };
        }
      );
    },
  },

  Movie: {
    id: (movie) => movie._id.toString(),

    cast: async (movie) => {
      const detail = await loadDetail(movie.tmdbId);
      return extractCast(detail);
    },

    trailerKey: async (movie) => {
      const detail = await loadDetail(movie.tmdbId);
      return extractTrailerKey(detail);
    },

    similar: async (movie) => {
      const detail = await loadDetail(movie.tmdbId);
      return upsertMovies((detail.similar?.results || []).slice(0, 10));
    },
  },
};

module.exports = { resolvers, getOrFetchMovie };
