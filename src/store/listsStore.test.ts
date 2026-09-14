import { describe, it, expect, beforeEach } from "vitest";
import { useListsStore } from "./listsStore";

describe("listsStore", () => {
  beforeEach(() => {
    useListsStore.setState({ watchlistIds: new Set(), favoriteIds: new Set() });
  });

  it("starts with empty sets", () => {
    const state = useListsStore.getState();
    expect(state.watchlistIds.size).toBe(0);
    expect(state.favoriteIds.size).toBe(0);
  });

  it("setWatchlistIds replaces the set from an array of ids", () => {
    useListsStore.getState().setWatchlistIds([278, 550]);
    expect(useListsStore.getState().watchlistIds).toEqual(new Set([278, 550]));
  });

  it("addWatchlistId is idempotent — adding the same id twice doesn't grow the set", () => {
    useListsStore.getState().addWatchlistId(278);
    useListsStore.getState().addWatchlistId(278);
    expect(useListsStore.getState().watchlistIds.size).toBe(1);
  });

  it("removeWatchlistId removes only the targeted id", () => {
    useListsStore.getState().setWatchlistIds([278, 550]);
    useListsStore.getState().removeWatchlistId(278);
    expect(useListsStore.getState().watchlistIds).toEqual(new Set([550]));
  });

  it("keeps favorites independent of watchlist", () => {
    useListsStore.getState().addWatchlistId(278);
    useListsStore.getState().addFavoriteId(550);

    const state = useListsStore.getState();
    expect(state.watchlistIds).toEqual(new Set([278]));
    expect(state.favoriteIds).toEqual(new Set([550]));
  });

  it("clear empties both sets", () => {
    useListsStore.getState().setWatchlistIds([278]);
    useListsStore.getState().setFavoriteIds([550]);
    useListsStore.getState().clear();

    const state = useListsStore.getState();
    expect(state.watchlistIds.size).toBe(0);
    expect(state.favoriteIds.size).toBe(0);
  });
});
