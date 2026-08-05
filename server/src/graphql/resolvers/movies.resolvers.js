const Movie = require("../../models/Movie");
const tmdbService = require("../../services/tmdb.service");
const cacheService = require("../../services/cache.service");
const { extractCast, extractTrailerKey } = require("./movieMappers");

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

const resolvers = {
  Query: {
    dashboard: async () => {
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

      return { newReleases, trending, upcoming, classics };
    },

    movie: async (_parent, { tmdbId }) => {
      const detail = await loadDetail(tmdbId);
      return Movie.upsertFromTmdb(detail);
    },

    searchMovies: async (_parent, { query, page = 1 }) => {
      const trimmed = query.trim();
      if (!trimmed) return [];

      const results = await cacheService.getOrSet(
        `search:${trimmed.toLowerCase()}:${page}`,
        TTL.HOURS(1),
        async () => upsertMovies((await tmdbService.searchMovies(trimmed, page)).results)
      );

      return results;
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

module.exports = resolvers;
