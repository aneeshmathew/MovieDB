import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { sdk } from "@/lib/graphqlClient";
import { MovieGrid } from "./MovieGrid";
import { RowSkeleton } from "@/components/Skeleton";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["search", query],
    queryFn: async ({ pageParam }) =>
      (await sdk.SearchMovies({ query, page: pageParam })).searchMovies,
    initialPageParam: 1,
    // TMDB's own totalPages tells us definitively when to stop — more
    // reliable than inferring from a short page, which can legitimately
    // happen mid-list too (TMDB doesn't guarantee a full 20 per page).
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: query.length > 0,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Loads the next page automatically once the sentinel scrolls into view,
  // rather than requiring a manual "Load more" click — standard infinite
  // scroll UX for a browsable grid like this.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const allMovies = data?.pages.flatMap((page) => page.movies) ?? [];
  const totalResults = data?.pages[0]?.totalResults ?? 0;

  // Backend returns TMDB's default relevance/popularity order per page —
  // sorted by release year descending here per the original request,
  // re-applied across the full accumulated set as more pages load.
  const sortedResults = [...allMovies].sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));

  return (
    <div>
      <h1 className="px-4 pt-6 font-display text-2xl uppercase text-ink sm:px-8">
        {query ? `Search results for "${query}"` : "Search"}
      </h1>
      {query && totalResults > 0 && !isLoading && (
        <p className="px-4 pt-1 font-mono text-xs text-ink-dim sm:px-8">
          {totalResults.toLocaleString()} {totalResults === 1 ? "result" : "results"}
        </p>
      )}

      {!query ? (
        <p className="px-4 py-16 text-center font-mono text-sm text-ink-dim sm:px-8">
          Type something into the search bar above to look for a movie.
        </p>
      ) : isLoading ? (
        <RowSkeleton title="" />
      ) : (
        <>
          <MovieGrid movies={sortedResults} emptyMessage={`No movies found for "${query}".`} />

          {hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center pb-10 pt-2">
              {isFetchingNextPage && (
                <Loader2
                  className="h-5 w-5 animate-spin text-ink-dim"
                  aria-label="Loading more results"
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
