import { create } from "zustand";

interface ListsState {
  watchlistIds: Set<number>;
  favoriteIds: Set<number>;
  setWatchlistIds: (ids: number[]) => void;
  setFavoriteIds: (ids: number[]) => void;
  addWatchlistId: (id: number) => void;
  removeWatchlistId: (id: number) => void;
  addFavoriteId: (id: number) => void;
  removeFavoriteId: (id: number) => void;
  clear: () => void;
}

// Populated from the Me query on session bootstrap, then kept in sync by
// each watchlist/favorites mutation's onSuccess handler. MovieCard reads
// from here (via useListsStore) rather than each card independently
// tracking its own membership state, so toggling one card can never drift
// out of sync with what the server actually has.
export const useListsStore = create<ListsState>((set) => ({
  watchlistIds: new Set(),
  favoriteIds: new Set(),

  setWatchlistIds: (ids) => set({ watchlistIds: new Set(ids) }),
  setFavoriteIds: (ids) => set({ favoriteIds: new Set(ids) }),

  addWatchlistId: (id) =>
    set((state) => ({ watchlistIds: new Set(state.watchlistIds).add(id) })),
  removeWatchlistId: (id) =>
    set((state) => {
      const next = new Set(state.watchlistIds);
      next.delete(id);
      return { watchlistIds: next };
    }),

  addFavoriteId: (id) => set((state) => ({ favoriteIds: new Set(state.favoriteIds).add(id) })),
  removeFavoriteId: (id) =>
    set((state) => {
      const next = new Set(state.favoriteIds);
      next.delete(id);
      return { favoriteIds: next };
    }),

  clear: () => set({ watchlistIds: new Set(), favoriteIds: new Set() }),
}));
