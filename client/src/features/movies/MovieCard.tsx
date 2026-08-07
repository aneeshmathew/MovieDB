import { memo } from "react";
import { Bookmark, Heart, Star } from "lucide-react";
import { posterUrl } from "@/lib/tmdbImage";
import { useListsStore } from "@/store/listsStore";
import { useAuthStore } from "@/store/authStore";
import { useToggleWatchlist, useToggleFavorite } from "./useListMutations";
import type { MovieCardFieldsFragment } from "@/graphql/generated";

interface MovieCardProps {
  movie: MovieCardFieldsFragment;
  /** Rendered eagerly (no loading="lazy") for above-the-fold cards — see plan §Image Loading. */
  eager?: boolean;
}

// React.memo: a genre row can hold dozens of cards, and toggling one card's
// watchlist state shouldn't re-render every sibling card in the row.
export const MovieCard = memo(function MovieCard({ movie, eager = false }: MovieCardProps) {
  const isLoggedIn = useAuthStore((s) => Boolean(s.accessToken));
  const isInWatchlist = useListsStore((s) => s.watchlistIds.has(movie.tmdbId));
  const isFavorited = useListsStore((s) => s.favoriteIds.has(movie.tmdbId));

  const toggleWatchlist = useToggleWatchlist(movie.tmdbId);
  const toggleFavorite = useToggleFavorite(movie.tmdbId);

  const poster = posterUrl(movie.posterPath, "w200");
  const rating = movie.ratingCount > 0 ? movie.avgRating : movie.tmdbVoteAverage;

  return (
    <div className="group relative w-40 shrink-0 sm:w-44">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-panel-raised ring-1 ring-line transition-transform duration-200 group-hover:scale-[1.03] group-hover:ring-amber/60">
        {poster ? (
          <img
            src={poster}
            srcSet={`${posterUrl(movie.posterPath, "w200")} 200w, ${posterUrl(movie.posterPath, "w500")} 500w`}
            sizes="(max-width: 640px) 140px, 176px"
            alt={`${movie.title} poster`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-panel-raised px-2 text-center font-display text-sm text-ink-dim">
            {movie.title}
          </div>
        )}

        {movie.isClassic && (
          <span className="absolute left-1.5 top-1.5 rounded bg-void/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber">
            Classic
          </span>
        )}

        {rating > 0 && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded bg-void/80 px-1.5 py-0.5 font-mono text-[10px] text-ink">
            <Star className="h-2.5 w-2.5 fill-amber text-amber" aria-hidden="true" />
            {rating.toFixed(1)}
          </span>
        )}

        {isLoggedIn && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-void/90 to-transparent p-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              aria-pressed={isInWatchlist}
              aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              onClick={() => toggleWatchlist.mutate(isInWatchlist ? "remove" : "add")}
              disabled={toggleWatchlist.isPending}
              className="rounded-full bg-panel/90 p-1.5 text-ink hover:bg-panel disabled:opacity-50"
            >
              <Bookmark
                className="h-3.5 w-3.5"
                fill={isInWatchlist ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              aria-pressed={isFavorited}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              onClick={() => toggleFavorite.mutate(isFavorited ? "remove" : "add")}
              disabled={toggleFavorite.isPending}
              className="rounded-full bg-panel/90 p-1.5 text-ink hover:bg-panel disabled:opacity-50"
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={isFavorited ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>

      <p className="mt-1.5 truncate font-body text-sm text-ink">{movie.title}</p>
      {movie.releaseYear && (
        <p className="font-mono text-xs text-ink-dim">{movie.releaseYear}</p>
      )}
    </div>
  );
});
