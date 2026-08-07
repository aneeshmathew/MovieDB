import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import { MovieGrid } from "@/features/movies/MovieGrid";
import { RowSkeleton } from "@/components/Skeleton";

export function WatchlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => (await sdk.Watchlist()).watchlist,
  });

  return (
    <div>
      <h1 className="px-4 pt-6 font-display text-2xl uppercase text-ink sm:px-8">Watchlist</h1>
      {isLoading ? (
        <RowSkeleton title="" />
      ) : (
        <MovieGrid
          movies={data ?? []}
          emptyMessage="Nothing queued up yet — add a movie to watch later."
        />
      )}
    </div>
  );
}
