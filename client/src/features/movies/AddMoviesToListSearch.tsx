import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus, Search } from "lucide-react";
import { sdk } from "@/lib/graphqlClient";
import { posterUrl } from "@/lib/tmdbImage";
import { useToggleListMembership } from "./useMovieLists";

interface AddMoviesToListSearchProps {
  listId: string;
  /** tmdbIds already in this list, so results can show "Added" instead of "Add". */
  movieIds: number[];
}

function ResultRow({
  listId,
  movie,
  inList,
}: {
  listId: string;
  movie: { tmdbId: number; title: string; posterPath: string | null; releaseYear: number | null };
  inList: boolean;
}) {
  const toggle = useToggleListMembership(listId, movie.tmdbId);
  const poster = posterUrl(movie.posterPath, "w200");

  return (
    <li className="flex items-center gap-3 py-2">
      <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-panel-raised">
        {poster && <img src={poster} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{movie.title}</p>
        {movie.releaseYear && <p className="font-mono text-xs text-ink-dim">{movie.releaseYear}</p>}
      </div>
      <button
        type="button"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(inList ? "remove" : "add")}
        className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide disabled:opacity-50 ${
          inList ? "border-amber text-amber" : "border-line text-ink hover:border-amber"
        }`}
      >
        {inList ? (
          <>
            <Check className="h-3 w-3" aria-hidden="true" />
            Added
          </>
        ) : (
          <>
            <Plus className="h-3 w-3" aria-hidden="true" />
            Add
          </>
        )}
      </button>
    </li>
  );
}

// This is the actual way movies get into a list beyond the default one —
// per-card icons only ever touch the single default "My List" (see
// useQuickAddToMyList), so a newly created list has no other path to
// populate it without this.
export function AddMoviesToListSearch({ listId, movieIds }: AddMoviesToListSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["listSearch", debouncedQuery],
    queryFn: async () => (await sdk.SearchMovies({ query: debouncedQuery, page: 1 })).searchMovies,
    enabled: debouncedQuery.length > 1,
  });

  const results = data?.movies ?? [];

  return (
    <div className="rounded-md border border-line bg-panel p-4">
      <label htmlFor="add-to-list-search" className="mb-2 block font-mono text-xs uppercase text-ink-dim">
        Add movies to this list
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim"
          aria-hidden="true"
        />
        <input
          id="add-to-list-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie…"
          className="w-full rounded border border-line bg-panel-raised py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-dim focus-visible:border-amber"
        />
      </div>

      {debouncedQuery.length > 1 && (
        <div className="mt-3">
          {isFetching && !data && (
            <p className="py-2 font-mono text-xs text-ink-dim">Searching…</p>
          )}
          {!isFetching && results.length === 0 && (
            <p className="py-2 font-mono text-xs text-ink-dim">No movies found for "{debouncedQuery}".</p>
          )}
          {results.length > 0 && (
            <ul className="max-h-72 divide-y divide-line overflow-y-auto">
              {results.map((movie) => (
                <ResultRow
                  key={movie.tmdbId}
                  listId={listId}
                  movie={movie}
                  inList={movieIds.includes(movie.tmdbId)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
