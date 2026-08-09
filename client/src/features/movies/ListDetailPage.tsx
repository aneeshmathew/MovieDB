import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useListDetail } from "./useMovieLists";
import { MovieGrid } from "./MovieGrid";
import { AddMoviesToListSearch } from "./AddMoviesToListSearch";
import { RowSkeleton } from "@/components/Skeleton";

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: list, isLoading } = useListDetail(id);

  return (
    <div>
      <div className="px-4 pt-6 sm:px-8">
        <Link
          to="/lists"
          className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-ink-dim hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          My Lists
        </Link>
        <h1 className="mt-2 font-display text-2xl uppercase text-ink">
          {list?.name ?? (isLoading ? "" : "List not found")}
        </h1>

        {list && (
          <div className="mt-4 max-w-md">
            <AddMoviesToListSearch listId={list.id} movieIds={list.movieIds} />
          </div>
        )}
      </div>

      {isLoading ? (
        <RowSkeleton title="" />
      ) : (
        <MovieGrid
          movies={list?.movies ?? []}
          emptyMessage={
            list
              ? "Nothing in this list yet — search above to add a movie."
              : "This list doesn't exist, or isn't yours."
          }
        />
      )}
    </div>
  );
}
