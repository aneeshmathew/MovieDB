import { useDashboard } from "./useDashboard";
import { HeroBanner } from "./HeroBanner";
import { MovieRow } from "@/features/movies/MovieRow";
import { SprocketDivider } from "@/components/SprocketDivider";
import { HeroSkeleton, RowSkeleton } from "@/components/Skeleton";

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div>
        <HeroSkeleton />
        <RowSkeleton title="Trending" />
        <RowSkeleton title="New Releases" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl uppercase text-ink">Projector jammed</p>
        <p className="max-w-sm text-sm text-ink-dim">
          {error instanceof Error ? error.message : "Something went wrong loading the dashboard."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full border border-amber px-4 py-2 font-mono text-sm text-amber hover:bg-amber-dim"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Trending's top pick anchors the hero — it's the section most likely to
  // have a strong, recognizable backdrop image.
  const heroMovie = data.trending[0] ?? data.newReleases[0];

  return (
    <div>
      {heroMovie && <HeroBanner movie={heroMovie} />}

      <div className="pb-16">
        <MovieRow title="Trending" movies={data.trending} eagerCount={6} />
        <SprocketDivider />
        <MovieRow title="New Releases" movies={data.newReleases} />
        <SprocketDivider />
        <MovieRow title="Upcoming" movies={data.upcoming} />
        <SprocketDivider />
        <MovieRow title="Classics" movies={data.classics} />
      </div>
    </div>
  );
}
