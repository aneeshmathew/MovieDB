import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import type { MovieListFieldsFragment } from "@/graphql/generated";

// My Lists live entirely in TanStack Query (server state), unlike
// watchlist/favorites membership which is mirrored into listsStore
// (Zustand) — a list's own name/id/movieIds only ever needs to be read by
// components already inside a query context (list menu, lists page), so
// there's no need for a second, harder-to-keep-in-sync copy of the data.
export function useMyLists() {
  return useQuery({
    queryKey: ["myLists"],
    queryFn: async () => (await sdk.MyLists()).myLists,
  });
}

export function useListDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["list", id],
    queryFn: async () => (await sdk.ListDetail({ id: id as string })).list,
    enabled: Boolean(id),
  });
}

function upsertList(lists: MovieListFieldsFragment[], updated: MovieListFieldsFragment) {
  const idx = lists.findIndex((l) => l.id === updated.id);
  if (idx === -1) return [updated, ...lists];
  const next = lists.slice();
  next[idx] = updated;
  return next;
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => sdk.CreateList({ name }).then((r) => r.createList),
    onSuccess: (list) => {
      queryClient.setQueryData<MovieListFieldsFragment[]>(["myLists"], (prev) =>
        prev ? upsertList(prev, list) : [list]
      );
    },
  });
}

export function useRenameList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      sdk.RenameList({ id, name }).then((r) => r.renameList),
    onSuccess: (list) => {
      queryClient.setQueryData<MovieListFieldsFragment[]>(["myLists"], (prev) =>
        prev ? upsertList(prev, list) : [list]
      );
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sdk.DeleteList({ id }).then((r) => r.deleteList),
    onSuccess: (_ok, id) => {
      queryClient.setQueryData<MovieListFieldsFragment[]>(["myLists"], (prev) =>
        prev ? prev.filter((l) => l.id !== id) : prev
      );
      queryClient.removeQueries({ queryKey: ["list", id] });
    },
  });
}

type ToggleListAction = "add" | "remove";

// Mirrors useToggleWatchlist/useToggleFavorite: the action is passed
// explicitly at mutate()-call time rather than derived from a closed-over
// "is this movie in this list" boolean, since that value can change (via
// this same mutation's cache update) before the async mutationFn runs.
export function useToggleListMembership(listId: string, movieId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: ToggleListAction) => {
      if (action === "remove") {
        const { removeFromList } = await sdk.RemoveFromList({ id: listId, movieId });
        return removeFromList;
      }
      const { addToList } = await sdk.AddToList({ id: listId, movieId });
      return addToList;
    },
    onMutate: (action) => {
      const previous = queryClient.getQueryData<MovieListFieldsFragment[]>(["myLists"]);

      queryClient.setQueryData<MovieListFieldsFragment[]>(["myLists"], (prev) =>
        prev?.map((list) => {
          if (list.id !== listId) return list;
          const has = list.movieIds.includes(movieId);
          if (action === "add" && !has) {
            return { ...list, movieIds: [...list.movieIds, movieId], movieCount: list.movieCount + 1 };
          }
          if (action === "remove" && has) {
            return {
              ...list,
              movieIds: list.movieIds.filter((id) => id !== movieId),
              movieCount: list.movieCount - 1,
            };
          }
          return list;
        })
      );

      return { previous };
    },
    onError: (_err, _action, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["myLists"], context.previous);
      }
    },
    onSuccess: (list) => {
      queryClient.setQueryData<MovieListFieldsFragment[]>(["myLists"], (prev) =>
        prev ? upsertList(prev, list) : [list]
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["list", listId] });
    },
  });
}
