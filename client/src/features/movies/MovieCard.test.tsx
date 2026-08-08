import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MovieCard } from "./MovieCard";
import { useAuthStore } from "@/store/authStore";
import { useListsStore } from "@/store/listsStore";

vi.mock("@/lib/graphqlClient", () => ({
  sdk: {
    AddToWatchlist: vi.fn().mockResolvedValue({ addToWatchlist: [] }),
    RemoveFromWatchlist: vi.fn().mockResolvedValue({ removeFromWatchlist: [] }),
    AddToFavorites: vi.fn().mockResolvedValue({ addToFavorites: [] }),
    RemoveFromFavorites: vi.fn().mockResolvedValue({ removeFromFavorites: [] }),
    // AddToListMenu (rendered inside MovieCard for logged-in users) fetches
    // the user's lists to populate its popover.
    MyLists: vi.fn().mockResolvedValue({ myLists: [] }),
    CreateList: vi.fn(),
    AddToList: vi.fn(),
    RemoveFromList: vi.fn(),
  },
}));

const baseMovie = {
  id: "1",
  tmdbId: 278,
  title: "The Shawshank Redemption",
  posterPath: "/poster.jpg",
  backdropPath: null,
  releaseYear: 1994,
  tmdbVoteAverage: 8.7,
  avgRating: 0,
  ratingCount: 0,
  isClassic: true,
  genres: [18],
};

const loggedInUser = { id: "u1", name: "Ada", email: "a@b.com", avatar: null };

function renderWithProviders(children: ReactNode) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("MovieCard", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, hasCheckedSession: false });
    useListsStore.setState({ watchlistIds: new Set(), favoriteIds: new Set() });
    vi.clearAllMocks();
  });

  it("renders the title, year, and poster alt text", () => {
    renderWithProviders(<MovieCard movie={baseMovie} />);
    expect(screen.getByText("The Shawshank Redemption")).toBeInTheDocument();
    expect(screen.getByText("1994")).toBeInTheDocument();
    expect(screen.getByAltText("The Shawshank Redemption poster")).toBeInTheDocument();
  });

  it("shows the Classic badge when isClassic is true", () => {
    renderWithProviders(<MovieCard movie={baseMovie} />);
    expect(screen.getByText("Classic")).toBeInTheDocument();
  });

  it("does not render watchlist/favorite toggle buttons when logged out", () => {
    renderWithProviders(<MovieCard movie={baseMovie} />);
    expect(screen.queryByLabelText("Add to watchlist")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Add to favorites")).not.toBeInTheDocument();
  });

  it("shows toggle buttons with aria-pressed=false when logged in but not yet added", () => {
    useAuthStore.setState({ accessToken: "token", user: loggedInUser, hasCheckedSession: true });

    renderWithProviders(<MovieCard movie={baseMovie} />);

    expect(screen.getByLabelText("Add to watchlist")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Add to favorites")).toHaveAttribute("aria-pressed", "false");
  });

  it("reflects existing watchlist/favorite membership in label and aria-pressed", () => {
    useAuthStore.setState({ accessToken: "token", user: loggedInUser, hasCheckedSession: true });
    useListsStore.setState({ watchlistIds: new Set([278]), favoriteIds: new Set([278]) });

    renderWithProviders(<MovieCard movie={baseMovie} />);

    expect(screen.getByLabelText("Remove from watchlist")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Remove from favorites")).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking the watchlist toggle calls the add mutation with the correct movieId", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    useAuthStore.setState({ accessToken: "token", user: loggedInUser, hasCheckedSession: true });

    renderWithProviders(<MovieCard movie={baseMovie} />);
    await userEvent.click(screen.getByLabelText("Add to watchlist"));

    await waitFor(() => expect(sdk.AddToWatchlist).toHaveBeenCalledWith({ movieId: 278 }));
    expect(sdk.RemoveFromWatchlist).not.toHaveBeenCalled();
  });

  it("clicking an already-added favorite calls the remove mutation instead", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    useAuthStore.setState({ accessToken: "token", user: loggedInUser, hasCheckedSession: true });
    useListsStore.setState({ watchlistIds: new Set(), favoriteIds: new Set([278]) });

    renderWithProviders(<MovieCard movie={baseMovie} />);
    await userEvent.click(screen.getByLabelText("Remove from favorites"));

    await waitFor(() => expect(sdk.RemoveFromFavorites).toHaveBeenCalledWith({ movieId: 278 }));
    expect(sdk.AddToFavorites).not.toHaveBeenCalled();
  });

  it("falls back to a title placeholder tile when there is no poster", () => {
    renderWithProviders(<MovieCard movie={{ ...baseMovie, posterPath: null }} />);
    expect(screen.queryByAltText("The Shawshank Redemption poster")).not.toBeInTheDocument();
    expect(screen.getAllByText("The Shawshank Redemption").length).toBeGreaterThan(0);
  });
});
