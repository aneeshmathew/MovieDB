import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import { useListsStore } from "@/store/listsStore";

type ToggleAction = "add" | "remove";

// The action ("add" or "remove") is captured explicitly as a mutate()
// argument, NOT derived inside mutationFn from a closure over the
// component's current isInWatchlist/isFavorited prop. That prop gets
// flipped by this very mutation's optimistic onMutate update, which
// triggers a re-render before the async mutationFn actually runs —
// useMutation always uses the latest render's closures, so a mutationFn
// that reads the outer prop would see the ALREADY-FLIPPED value and
// execute the opposite action from the one the click intended.
export function useToggleWatchlist(movieId: number) {
  const addWatchlistId = useListsStore((s) => s.addWatchlistId);
  const removeWatchlistId = useListsStore((s) => s.removeWatchlistId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: ToggleAction) => {
      if (action === "remove") {
        const { removeFromWatchlist } = await sdk.RemoveFromWatchlist({ movieId });
        return removeFromWatchlist;
      }
      const { addToWatchlist } = await sdk.AddToWatchlist({ movieId });
      return addToWatchlist;
    },
    onMutate: (action) => {
      if (action === "remove") {
        removeWatchlistId(movieId);
      } else {
        addWatchlistId(movieId);
      }
      return { action };
    },
    onError: (_err, _action, context) => {
      if (!context) return;
      // Roll back exactly the change onMutate made, regardless of what the
      // store looks like now.
      if (context.action === "remove") {
        addWatchlistId(movieId);
      } else {
        removeWatchlistId(movieId);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useToggleFavorite(movieId: number) {
  const addFavoriteId = useListsStore((s) => s.addFavoriteId);
  const removeFavoriteId = useListsStore((s) => s.removeFavoriteId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: ToggleAction) => {
      if (action === "remove") {
        const { removeFromFavorites } = await sdk.RemoveFromFavorites({ movieId });
        return removeFromFavorites;
      }
      const { addToFavorites } = await sdk.AddToFavorites({ movieId });
      return addToFavorites;
    },
    onMutate: (action) => {
      if (action === "remove") {
        removeFavoriteId(movieId);
      } else {
        addFavoriteId(movieId);
      }
      return { action };
    },
    onError: (_err, _action, context) => {
      if (!context) return;
      if (context.action === "remove") {
        addFavoriteId(movieId);
      } else {
        removeFavoriteId(movieId);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
