function extractCast(detail) {
  return (detail.credits?.cast || []).slice(0, 10).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character || null,
    profilePath: c.profile_path || null,
  }));
}

function extractTrailerKey(detail) {
  const trailer = (detail.videos?.results || []).find(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );
  return trailer?.key || null;
}

// Stable partition: movies matching any of the user's preferred genres move
// to the front, preserving relative order within each group otherwise.
// Falls through unchanged for logged-out users (empty preferredGenres).
function personalizeByGenres(movies, preferredGenres = []) {
  if (!preferredGenres.length) return movies;

  const preferredSet = new Set(preferredGenres);
  const matched = [];
  const unmatched = [];

  for (const movie of movies) {
    const genres = movie.genres || [];
    if (genres.some((g) => preferredSet.has(g))) {
      matched.push(movie);
    } else {
      unmatched.push(movie);
    }
  }

  return [...matched, ...unmatched];
}

module.exports = { extractCast, extractTrailerKey, personalizeByGenres };
