import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchPage } from "./SearchPage";

vi.mock("@/lib/graphqlClient", () => ({
  sdk: {
    SearchMovies: vi.fn(),
  },
}));

function movie(tmdbId: number, releaseYear: number) {
  return {
    id: String(tmdbId),
    tmdbId,
    title: `Movie ${tmdbId}`,
    posterPath: null,
    backdropPath: null,
    releaseYear,
    tmdbVoteAverage: 7,
    avgRating: 0,
    ratingCount: 0,
    isClassic: false,
    genres: [],
  };
}

// jsdom doesn't implement IntersectionObserver — capture the callback
// passed to it so tests can fire it manually to simulate the sentinel
// scrolling into view.
let observerCallback: IntersectionObserverCallback | null = null;

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

function renderWithProviders(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/search?q=dune"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    observerCallback = null;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the prompt when there's no query", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/search"]}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(
      screen.getByText("Type something into the search bar above to look for a movie.")
    ).toBeInTheDocument();
  });

  it("renders the first page of results and a total count", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.SearchMovies as ReturnType<typeof vi.fn>).mockResolvedValue({
      searchMovies: { movies: [movie(1, 2020)], page: 1, totalPages: 3, totalResults: 55 },
    });

    renderWithProviders(<SearchPage />);

    await waitFor(() => expect(screen.getAllByText("Movie 1").length).toBeGreaterThan(0));
    expect(screen.getByText("55 results")).toBeInTheDocument();
  });

  it("fetches the next page when the sentinel intersects, and stops at the last page", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    const searchMock = sdk.SearchMovies as ReturnType<typeof vi.fn>;
    searchMock
      .mockResolvedValueOnce({
        searchMovies: { movies: [movie(1, 2020)], page: 1, totalPages: 2, totalResults: 2 },
      })
      .mockResolvedValueOnce({
        searchMovies: { movies: [movie(2, 2019)], page: 2, totalPages: 2, totalResults: 2 },
      });

    renderWithProviders(<SearchPage />);

    await waitFor(() => expect(screen.getAllByText("Movie 1").length).toBeGreaterThan(0));
    expect(searchMock).toHaveBeenCalledWith({ query: "dune", page: 1 });

    // Simulate the sentinel scrolling into view.
    observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as never);

    await waitFor(() => expect(screen.getAllByText("Movie 2").length).toBeGreaterThan(0));
    expect(searchMock).toHaveBeenCalledWith({ query: "dune", page: 2 });
    expect(searchMock).toHaveBeenCalledTimes(2);
  });

  it("shows the empty message when there are no results", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.SearchMovies as ReturnType<typeof vi.fn>).mockResolvedValue({
      searchMovies: { movies: [], page: 1, totalPages: 0, totalResults: 0 },
    });

    renderWithProviders(<SearchPage />);

    await waitFor(() =>
      expect(screen.getByText('No movies found for "dune".')).toBeInTheDocument()
    );
  });
});
