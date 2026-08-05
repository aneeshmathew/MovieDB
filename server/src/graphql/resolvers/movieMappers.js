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

module.exports = { extractCast, extractTrailerKey };
