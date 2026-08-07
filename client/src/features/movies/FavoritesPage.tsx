import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import { MovieGrid } from "@/features/movies/MovieGrid";
import { RowSkeleton } from "@/components/Skeleton";

export function FavoritesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => (await sdk.Favorites()).favorites,
  });

  return (
    <div>
      <h1 className="px-4 pt-6 font-display text-2xl uppercase text-ink sm:px-8">Favorites</h1>
      {isLoading ? (
        <RowSkeleton title="" />
      ) : (
        <MovieGrid
          movies={data ?? []}
          emptyMessage="No favorites yet — the heart icon on any card adds one."
        />
      )}
    </div>
  );
}
