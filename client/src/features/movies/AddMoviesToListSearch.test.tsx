import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddMoviesToListSearch } from "./AddMoviesToListSearch";

vi.mock("@/lib/graphqlClient", () => ({
  sdk: {
    SearchMovies: vi.fn(),
    AddToList: vi.fn(),
    RemoveFromList: vi.fn(),
  },
}));

function movie(tmdbId: number, title: string) {
  return {
    id: String(tmdbId),
    tmdbId,
    title,
    posterPath: null,
    backdropPath: null,
    releaseYear: 2010,
    tmdbVoteAverage: 7,
    avgRating: 0,
    ratingCount: 0,
    isClassic: false,
    genres: [],
  };
}

function renderWithProviders(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe("AddMoviesToListSearch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("does not search until at least two characters are typed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { sdk } = await import("@/lib/graphqlClient");

    renderWithProviders(<AddMoviesToListSearch listId="list1" movieIds={[]} />);
    await user.type(screen.getByLabelText("Add movies to this list"), "d");
    act(() => { vi.advanceTimersByTime(500); });

    expect(sdk.SearchMovies).not.toHaveBeenCalled();
  });

  it("debounces the search and renders results with an Add button", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.SearchMovies as ReturnType<typeof vi.fn>).mockResolvedValue({
      searchMovies: { movies: [movie(1, "Dune")], page: 1, totalPages: 1, totalResults: 1 },
    });

    renderWithProviders(<AddMoviesToListSearch listId="list1" movieIds={[]} />);
    await user.type(screen.getByLabelText("Add movies to this list"), "dune");
    act(() => { vi.advanceTimersByTime(400); });

    await waitFor(() => expect(sdk.SearchMovies).toHaveBeenCalledWith({ query: "dune", page: 1 }));
    await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Add/ })).toBeInTheDocument();
  });

  it("shows 'Added' for a movie already in the list, and clicking it removes instead", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.SearchMovies as ReturnType<typeof vi.fn>).mockResolvedValue({
      searchMovies: { movies: [movie(1, "Dune")], page: 1, totalPages: 1, totalResults: 1 },
    });
    (sdk.RemoveFromList as ReturnType<typeof vi.fn>).mockResolvedValue({
      removeFromList: { id: "list1", name: "Sci-Fi", movieIds: [], movieCount: 0 },
    });

    renderWithProviders(<AddMoviesToListSearch listId="list1" movieIds={[1]} />);
    await user.type(screen.getByLabelText("Add movies to this list"), "dune");
    act(() => { vi.advanceTimersByTime(400); });

    await waitFor(() => expect(screen.getByRole("button", { name: /Added/ })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Added/ }));
    await waitFor(() =>
      expect(sdk.RemoveFromList).toHaveBeenCalledWith({ id: "list1", movieId: 1 })
    );
  });

  it("clicking Add on a new result calls AddToList with this list's id", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.SearchMovies as ReturnType<typeof vi.fn>).mockResolvedValue({
      searchMovies: { movies: [movie(1, "Dune")], page: 1, totalPages: 1, totalResults: 1 },
    });
    (sdk.AddToList as ReturnType<typeof vi.fn>).mockResolvedValue({
      addToList: { id: "list1", name: "Sci-Fi", movieIds: [1], movieCount: 1 },
    });

    renderWithProviders(<AddMoviesToListSearch listId="list1" movieIds={[]} />);
    await user.type(screen.getByLabelText("Add movies to this list"), "dune");
    act(() => { vi.advanceTimersByTime(400); });

    await waitFor(() => expect(screen.getByRole("button", { name: /Add/ })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Add/ }));

    await waitFor(() =>
      expect(sdk.AddToList).toHaveBeenCalledWith({ id: "list1", movieId: 1 })
    );
  });

  it("shows an empty message when a search returns nothing", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.SearchMovies as ReturnType<typeof vi.fn>).mockResolvedValue({
      searchMovies: { movies: [], page: 1, totalPages: 0, totalResults: 0 },
    });

    renderWithProviders(<AddMoviesToListSearch listId="list1" movieIds={[]} />);
    await user.type(screen.getByLabelText("Add movies to this list"), "zzzznotreal");
    act(() => { vi.advanceTimersByTime(400); });

    await waitFor(() =>
      expect(screen.getByText('No movies found for "zzzznotreal".')).toBeInTheDocument()
    );
  });
});
