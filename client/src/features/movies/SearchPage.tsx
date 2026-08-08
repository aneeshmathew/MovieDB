import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import { MovieGrid } from "./MovieGrid";
import { RowSkeleton } from "@/components/Skeleton";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => (await sdk.SearchMovies({ query })).searchMovies,
    enabled: query.length > 0,
  });

  // Backend returns TMDB's default relevance/popularity order — sorted by
  // release year descending here per the request, client-side, since
  // sorting is a display concern and the same data can be re-sorted
  // without a new network call if more sort options are added later.
  const sortedResults = [...(data ?? [])].sort(
    (a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0)
  );

  return (
    <div>
      <h1 className="px-4 pt-6 font-display text-2xl uppercase text-ink sm:px-8">
        {query ? `Search results for "${query}"` : "Search"}
      </h1>

      {!query ? (
        <p className="px-4 py-16 text-center font-mono text-sm text-ink-dim sm:px-8">
          Type something into the search bar above to look for a movie.
        </p>
      ) : isLoading ? (
        <RowSkeleton title="" />
      ) : (
        <MovieGrid movies={sortedResults} emptyMessage={`No movies found for "${query}".`} />
      )}
    </div>
  );
}
