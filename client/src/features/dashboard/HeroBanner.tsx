import { backdropUrl } from "@/lib/tmdbImage";
import type { MovieCardFieldsFragment } from "@/graphql/generated";

interface HeroBannerProps {
  movie: MovieCardFieldsFragment;
}

export function HeroBanner({ movie }: HeroBannerProps) {
  const backdrop = backdropUrl(movie.backdropPath, "w1280");

  return (
    <div className="relative h-[52vh] min-h-72 w-full overflow-hidden sm:h-[60vh]">
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      )}
      {/* Gradient scrim: ensures marquee text stays readable regardless of
          backdrop brightness, and blends the hero into the void background
          below rather than ending on a hard edge. */}
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-void/70 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-8 sm:pb-12">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber">
          Now Screening
        </p>
        <h1 className="max-w-2xl font-display text-4xl uppercase leading-[1.05] tracking-tight text-ink sm:text-6xl">
          {movie.title}
        </h1>
        {movie.releaseYear && (
          <p className="mt-3 font-mono text-sm text-ink-dim">{movie.releaseYear}</p>
        )}
      </div>
    </div>
  );
}
