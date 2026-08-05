const mongoose = require("mongoose");

const { Schema } = mongoose;

// Same thresholds used by the TMDB "classics" discover query — kept here too
// so any movie (regardless of which list it arrived through) is flagged
// consistently if it happens to qualify.
const CLASSICS_MIN_RATING = 7.5;
const CLASSICS_MIN_VOTES = 1000;
const CLASSICS_MAX_AGE_YEARS = 20;

const movieSchema = new Schema(
  {
    tmdbId: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    overview: { type: String, default: "" },
    posterPath: { type: String, default: null },
    backdropPath: { type: String, default: null },
    genres: { type: [Number], default: [] }, // TMDB genre IDs
    releaseDate: { type: String, default: null }, // YYYY-MM-DD, as TMDB returns it
    releaseYear: { type: Number, default: null },
    runtime: { type: Number, default: null }, // only present once detail has been fetched

    // TMDB's own aggregate rating, cached for display/classics-flagging.
    tmdbVoteAverage: { type: Number, default: 0 },
    tmdbVoteCount: { type: Number, default: 0 },

    // Our own community rating, populated in Phase 4 (Rating collection).
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    isClassic: { type: Boolean, default: false },
    cachedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

function computeReleaseYear(releaseDate) {
  if (!releaseDate) return null;
  const year = Number(releaseDate.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function computeIsClassic(releaseYear, voteAverage, voteCount) {
  if (!releaseYear) return false;
  const currentYear = new Date().getFullYear();
  return (
    currentYear - releaseYear >= CLASSICS_MAX_AGE_YEARS &&
    voteAverage >= CLASSICS_MIN_RATING &&
    voteCount >= CLASSICS_MIN_VOTES
  );
}

// Pure mapping function — no DB access — so the TMDB shape-normalization
// logic (list item vs. detail item, missing runtime, genre_ids vs. genres)
// can be unit tested without a database connection.
function mapTmdbMovie(tmdbMovie) {
  const genres = Array.isArray(tmdbMovie.genres)
    ? tmdbMovie.genres.map((g) => g.id)
    : tmdbMovie.genre_ids || [];

  const releaseYear = computeReleaseYear(tmdbMovie.release_date);
  const tmdbVoteAverage = tmdbMovie.vote_average || 0;
  const tmdbVoteCount = tmdbMovie.vote_count || 0;

  const mapped = {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    overview: tmdbMovie.overview || "",
    posterPath: tmdbMovie.poster_path || null,
    backdropPath: tmdbMovie.backdrop_path || null,
    genres,
    releaseDate: tmdbMovie.release_date || null,
    releaseYear,
    tmdbVoteAverage,
    tmdbVoteCount,
    isClassic: computeIsClassic(releaseYear, tmdbVoteAverage, tmdbVoteCount),
  };

  // runtime is only present on the detail endpoint — omit the key entirely
  // (rather than setting null) so upsertFromTmdb can avoid overwriting a
  // previously-cached runtime with null just because this call came from
  // a list endpoint that doesn't include it.
  if (typeof tmdbMovie.runtime === "number") {
    mapped.runtime = tmdbMovie.runtime;
  }

  return mapped;
}

movieSchema.statics.mapTmdbMovie = mapTmdbMovie;
movieSchema.statics.computeReleaseYear = computeReleaseYear;
movieSchema.statics.computeIsClassic = computeIsClassic;

// Accepts a raw TMDB movie object — either a list-item shape (genre_ids,
// no runtime) or a detail shape (genres: [{id,name}], runtime present) —
// and upserts it into our cache collection. Called on every cache-miss
// TMDB fetch (dashboard, search, detail) so the local Movie collection
// stays a live cache rather than a one-time import.
movieSchema.statics.upsertFromTmdb = async function upsertFromTmdb(tmdbMovie) {
  const update = { ...mapTmdbMovie(tmdbMovie), cachedAt: new Date() };
  delete update.tmdbId; // set via $setOnInsert instead, since it's the query key

  return this.findOneAndUpdate(
    { tmdbId: tmdbMovie.id },
    { $set: update, $setOnInsert: { tmdbId: tmdbMovie.id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model("Movie", movieSchema);
