import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ListPlus, Plus } from "lucide-react";
import { useMyLists, useCreateList, useToggleListMembership } from "./useMovieLists";

interface AddToListMenuProps {
  movieId: number;
}

// One toggle row per list — isolated into its own component so each row
// owns its own useToggleListMembership mutation (keyed to this list's id)
// without the parent menu needing to juggle N mutation instances by hand.
function ListRow({ list, movieId }: { list: { id: string; name: string; movieIds: number[] }; movieId: number }) {
  const inList = list.movieIds.includes(movieId);
  const toggle = useToggleListMembership(list.id, movieId);

  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={inList}
      disabled={toggle.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate(inList ? "remove" : "add");
      }}
      className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-panel-raised disabled:opacity-50"
    >
      <span className="truncate">{list.name}</span>
      {inList && <Check className="h-3.5 w-3.5 shrink-0 text-amber" aria-hidden="true" />}
    </button>
  );
}

// The "add to list" icon + popover shown alongside the watchlist/favorite
// buttons on a MovieCard. Kept as a plain positioned div (no portal/library)
// since it only ever needs to escape its own card's overflow, not the
// viewport — matches the rest of the app's minimal-dependency approach.
export function AddToListMenu({ movieId }: AddToListMenuProps) {
  const [open, setOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: lists, isLoading } = useMyLists();
  const createList = useCreateList();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    createList.mutate(trimmed, { onSuccess: () => setNewListName("") });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Add to a list"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative z-10 rounded-full bg-panel/90 p-1.5 text-ink hover:bg-panel"
      >
        <ListPlus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-md border border-line bg-panel p-2 shadow-lg"
        >
          {isLoading && <p className="px-2 py-1.5 text-xs text-ink-dim">Loading lists…</p>}

          {!isLoading && lists?.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-ink-dim">No lists yet — make one below.</p>
          )}

          {!isLoading && (lists?.length ?? 0) > 0 && (
            <div className="mb-1 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {lists?.map((list) => (
                <ListRow key={list.id} list={list} movieId={movieId} />
              ))}
            </div>
          )}

          <form
            onSubmit={handleCreateSubmit}
            className="flex items-center gap-1 border-t border-line pt-2"
          >
            <label htmlFor={`new-list-${movieId}`} className="sr-only">
              New list name
            </label>
            <input
              id={`new-list-${movieId}`}
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="New list…"
              maxLength={100}
              className="min-w-0 flex-1 rounded border border-line bg-panel-raised px-2 py-1 text-xs text-ink placeholder:text-ink-dim focus-visible:border-amber"
            />
            <button
              type="submit"
              disabled={createList.isPending || !newListName.trim()}
              aria-label="Create list"
              className="shrink-0 rounded bg-amber p-1 text-void disabled:opacity-50"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          </form>
          {createList.isError && (
            <p role="alert" className="mt-1 px-2 text-xs text-crimson">
              Couldn't create that list.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
