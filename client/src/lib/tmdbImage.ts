const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w200" | "w500";
export type BackdropSize = "w1280";

export function posterUrl(path: string | null, size: PosterSize = "w200"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: BackdropSize = "w1280"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
