import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useMyLists, useCreateList, useRenameList, useDeleteList } from "./useMovieLists";
import { RowSkeleton } from "@/components/Skeleton";
import type { MovieListFieldsFragment } from "@/graphql/generated";

function ListCard({ list }: { list: MovieListFieldsFragment }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const renameList = useRenameList();
  const deleteList = useDeleteList();

  function handleRenameSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === list.name) {
      setEditing(false);
      return;
    }
    renameList.mutate({ id: list.id, name: trimmed }, { onSuccess: () => setEditing(false) });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${list.name}"? This can't be undone.`)) return;
    deleteList.mutate(list.id);
  }

  return (
    <div className="flex flex-col justify-between gap-3 rounded-md border border-line bg-panel p-4">
      {editing ? (
        <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5">
          <label htmlFor={`rename-${list.id}`} className="sr-only">
            List name
          </label>
          <input
            id={`rename-${list.id}`}
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="min-w-0 flex-1 rounded border border-line bg-panel-raised px-2 py-1 text-sm text-ink focus-visible:border-amber"
          />
          <button
            type="submit"
            disabled={renameList.isPending}
            aria-label="Save name"
            className="shrink-0 rounded bg-amber p-1 text-void disabled:opacity-50"
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setName(list.name);
              setEditing(false);
            }}
            aria-label="Cancel rename"
            className="shrink-0 rounded p-1 text-ink-dim hover:text-ink"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <Link to={`/lists/${list.id}`} className="font-display text-lg uppercase text-ink hover:text-amber">
          {list.name}
        </Link>
      )}

      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-ink-dim">
          {list.movieCount} {list.movieCount === 1 ? "movie" : "movies"}
        </p>
        {!editing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Rename ${list.name}`}
              className="rounded p-1 text-ink-dim hover:text-ink"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteList.isPending}
              aria-label={`Delete ${list.name}`}
              className="rounded p-1 text-ink-dim hover:text-crimson disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ListsPage() {
  const { data: lists, isLoading } = useMyLists();
  const createList = useCreateList();
  const [newListName, setNewListName] = useState("");

  function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    createList.mutate(trimmed, { onSuccess: () => setNewListName("") });
  }

  return (
    <div className="px-4 pb-12 pt-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase text-ink">My Lists</h1>

        <form onSubmit={handleCreateSubmit} className="flex items-center gap-1.5">
          <label htmlFor="new-list-name" className="sr-only">
            New list name
          </label>
          <input
            id="new-list-name"
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name…"
            maxLength={100}
            className="rounded border border-line bg-panel px-3 py-1.5 text-sm text-ink placeholder:text-ink-dim focus-visible:border-amber"
          />
          <button
            type="submit"
            disabled={createList.isPending || !newListName.trim()}
            className="flex shrink-0 items-center gap-1 rounded-full bg-amber px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-void disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New list
          </button>
        </form>
      </div>
      {createList.isError && (
        <p role="alert" className="mt-2 text-xs text-crimson">
          Couldn't create that list — you may already have one with that name.
        </p>
      )}

      {isLoading && <RowSkeleton title="" />}

      {!isLoading && (lists?.length ?? 0) === 0 && (
        <p className="py-16 text-center font-mono text-sm text-ink-dim">
          No lists yet — create one above to start organizing movies your way.
        </p>
      )}

      {!isLoading && (lists?.length ?? 0) > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists?.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
