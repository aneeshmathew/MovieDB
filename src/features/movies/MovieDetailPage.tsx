import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Heart } from "lucide-react";
import { sdk } from "@/lib/graphqlClient";
import { backdropUrl, posterUrl } from "@/lib/tmdbImage";
import { ShareButton } from "@/components/ShareButton";
import { useAuthStore } from "@/store/authStore";
import { useListsStore } from "@/store/listsStore";
import { useToggleWatchlist, useToggleFavorite } from "./useListMutations";
import { useMyRating, useUpsertRating, useDeleteRating } from "./useRating";
import { StarRating } from "@/components/StarRating";
import { MovieRow } from "./MovieRow";
import { HeroSkeleton, RowSkeleton } from "@/components/Skeleton";

export function MovieDetailPage() {
  const params = useParams<{ tmdbId: string }>();
  const tmdbId = Number(params.tmdbId);

  const {
    data: movie,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["movie", tmdbId],
    queryFn: async () => (await sdk.MovieDetail({ tmdbId })).movie,
    enabled: Number.isInteger(tmdbId) && tmdbId > 0,
  });

  const isLoggedIn = useAuthStore((s) => Boolean(s.accessToken));
  const isInWatchlist = useListsStore((s) => s.watchlistIds.has(tmdbId));
  const isFavorited = useListsStore((s) => s.favoriteIds.has(tmdbId));
  const toggleWatchlist = useToggleWatchlist(tmdbId);
  const toggleFavorite = useToggleFavorite(tmdbId);

  const { data: myRating } = useMyRating(tmdbId);
  const upsertRating = useUpsertRating(tmdbId);
  const deleteRating = useDeleteRating(tmdbId);

  if (isLoading) {
    return (
      <div>
        <HeroSkeleton />
        <RowSkeleton title="Similar" />
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-display text-xl uppercase text-ink">Reel missing</p>
        <p className="text-sm text-ink-dim">Couldn't find that movie.</p>
      </div>
    );
  }

  const backdrop = backdropUrl(movie.backdropPath, "w1280");
  const poster = posterUrl(movie.posterPath, "w500");
  // The movie's own rating (from TMDB) — always shown as-is, independent of
  // what any individual user (including the signed-in viewer) rates it.
  // Personal ratings live only in the "YOUR RATING" section below and are
  // never mixed into this number.
  const movieRating = movie.tmdbVoteAverage;

  return (
    <div>
      <div className="relative h-[40vh] min-h-64 w-full overflow-hidden sm:h-[46vh]">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-void/20" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:flex-row sm:items-start sm:px-8">
        {poster && (
          <img
            src={poster}
            alt={`${movie.title} poster`}
            className="aspect-[2/3] w-40 shrink-0 -mt-8 rounded-md object-cover ring-1 ring-line sm:-mt-12 sm:w-56 translate-y-[4px]"
          />
        )}

        <div className="flex-1 pb-12 pt-2 sm:pt-4">
          <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">{movie.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-sm text-ink-dim">
            {movie.releaseYear && <span>{movie.releaseYear}</span>}
            {movie.runtime && <span>{movie.runtime} min</span>}
            {movieRating > 0 && (
              <span className="flex items-center gap-1">
                <StarRating value={Math.round(movieRating / 2)} readOnly size="sm" />(
                {movieRating.toFixed(1)})
              </span>
            )}
            {movie.isClassic && <span className="uppercase text-amber">Classic</span>}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isLoggedIn && (
              <>
                <button
                  type="button"
                  aria-pressed={isInWatchlist}
                  aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                  onClick={() => toggleWatchlist.mutate(isInWatchlist ? "remove" : "add")}
                  className="flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-xs uppercase leading-none text-ink hover:border-amber"
                >
                  <Bookmark
                    className="h-3.5 w-3.5 shrink-0"
                    fill={isInWatchlist ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  {isInWatchlist ? "In Watchlist" : "Watchlist"}
                </button>
                <button
                  type="button"
                  aria-pressed={isFavorited}
                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  onClick={() => toggleFavorite.mutate(isFavorited ? "remove" : "add")}
                  className="flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-xs uppercase leading-none text-ink hover:border-amber"
                >
                  <Heart
                    className="h-3.5 w-3.5 shrink-0"
                    fill={isFavorited ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  {isFavorited ? "Favorited" : "Favorite"}
                </button>
              </>
            )}
            <ShareButton title={movie.title} text={movie.overview ?? undefined} />
          </div>

          {movie.overview && <p className="mt-5 max-w-2xl text-ink-dim">{movie.overview}</p>}

          {isLoggedIn && (
            <div className="mt-6 rounded-md border border-line p-4">
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink-dim">
                Your rating
              </p>
              <div className="flex items-center gap-3">
                <StarRating
                  value={myRating?.score ?? 0}
                  onChange={(score) =>
                    upsertRating.mutate({ score, review: myRating?.review ?? undefined })
                  }
                />
                {myRating && (
                  <button
                    type="button"
                    onClick={() => deleteRating.mutate()}
                    className="font-mono text-xs text-ink-dim underline hover:text-crimson"
                  >
                    Remove rating
                  </button>
                )}
              </div>
            </div>
          )}

          {movie.trailerKey && (
            <div className="mt-8 aspect-video w-full max-w-2xl overflow-hidden rounded-md">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                title={`${movie.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}

          {movie.cast.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg uppercase text-ink">Cast</h2>
              <div className="flex flex-wrap gap-4">
                {movie.cast.map((member) => (
                  <div key={member.id} className="w-24">
                    <p className="truncate text-sm text-ink">{member.name}</p>
                    {member.character && (
                      <p className="truncate font-mono text-xs text-ink-dim">{member.character}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {movie.similar.length > 0 && <MovieRow title="Similar" movies={movie.similar} />}
    </div>
  );
}
