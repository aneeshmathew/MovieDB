import { ListCheck, ListPlus } from "lucide-react";
import { useQuickAddToMyList } from "./useMovieLists";

interface QuickAddToListButtonProps {
  movieId: number;
}

// A single-click toggle against one default "My List", styled and behaving
// exactly like the watchlist/favorite icon buttons next to it on
// MovieCard — no popover, no choosing which list. Full multi-list
// management still lives on the My Lists page.
export function QuickAddToListButton({ movieId }: QuickAddToListButtonProps) {
  const { inMyList, isPending, toggle } = useQuickAddToMyList(movieId);

  return (
    <button
      type="button"
      aria-pressed={inMyList}
      aria-label={inMyList ? "Remove from My List" : "Add to My List"}
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className="relative z-10 rounded-full bg-panel/90 p-1.5 text-ink hover:bg-panel disabled:opacity-50"
    >
      {inMyList ? (
        <ListCheck className="h-3.5 w-3.5 text-amber" aria-hidden="true" />
      ) : (
        <ListPlus className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
