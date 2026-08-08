import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddToListMenu } from "./AddToListMenu";

vi.mock("@/lib/graphqlClient", () => ({
  sdk: {
    MyLists: vi.fn(),
    CreateList: vi.fn(),
    AddToList: vi.fn(),
    RemoveFromList: vi.fn(),
  },
}));

const LIST_A = { id: "list1", name: "Weekend Watch", movieIds: [278], movieCount: 1 };
const LIST_B = { id: "list2", name: "Oscar Bait", movieIds: [], movieCount: 0 };

function renderWithProviders(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe("AddToListMenu", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.MyLists as ReturnType<typeof vi.fn>).mockResolvedValue({ myLists: [LIST_A, LIST_B] });
  });

  it("is closed by default", () => {
    renderWithProviders(<AddToListMenu movieId={278} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the popover and lists the user's lists with membership state", async () => {
    renderWithProviders(<AddToListMenu movieId={278} />);

    await userEvent.click(screen.getByLabelText("Add to a list"));

    await waitFor(() => expect(screen.getByText("Weekend Watch")).toBeInTheDocument());
    expect(screen.getByText("Oscar Bait")).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: /Weekend Watch/ })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("menuitemcheckbox", { name: /Oscar Bait/ })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("clicking a list not containing the movie calls AddToList", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.AddToList as ReturnType<typeof vi.fn>).mockResolvedValue({
      addToList: { ...LIST_B, movieIds: [278], movieCount: 1 },
    });

    renderWithProviders(<AddToListMenu movieId={278} />);
    await userEvent.click(screen.getByLabelText("Add to a list"));
    await waitFor(() => screen.getByText("Oscar Bait"));

    await userEvent.click(screen.getByRole("menuitemcheckbox", { name: /Oscar Bait/ }));

    await waitFor(() =>
      expect(sdk.AddToList).toHaveBeenCalledWith({ id: "list2", movieId: 278 })
    );
    expect(sdk.RemoveFromList).not.toHaveBeenCalled();
  });

  it("clicking a list already containing the movie calls RemoveFromList", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.RemoveFromList as ReturnType<typeof vi.fn>).mockResolvedValue({
      removeFromList: { ...LIST_A, movieIds: [], movieCount: 0 },
    });

    renderWithProviders(<AddToListMenu movieId={278} />);
    await userEvent.click(screen.getByLabelText("Add to a list"));
    await waitFor(() => screen.getByText("Weekend Watch"));

    await userEvent.click(screen.getByRole("menuitemcheckbox", { name: /Weekend Watch/ }));

    await waitFor(() =>
      expect(sdk.RemoveFromList).toHaveBeenCalledWith({ id: "list1", movieId: 278 })
    );
    expect(sdk.AddToList).not.toHaveBeenCalled();
  });

  it("submitting the new-list form calls CreateList and clears the input", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.CreateList as ReturnType<typeof vi.fn>).mockResolvedValue({
      createList: { id: "list3", name: "Horror Nights", movieIds: [], movieCount: 0 },
    });

    renderWithProviders(<AddToListMenu movieId={278} />);
    await userEvent.click(screen.getByLabelText("Add to a list"));
    await waitFor(() => screen.getByText("Weekend Watch"));

    const input = screen.getByPlaceholderText("New list…");
    await userEvent.type(input, "Horror Nights");
    await userEvent.click(screen.getByLabelText("Create list"));

    await waitFor(() => expect(sdk.CreateList).toHaveBeenCalledWith({ name: "Horror Nights" }));
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("shows an empty state when the user has no lists yet", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.MyLists as ReturnType<typeof vi.fn>).mockResolvedValue({ myLists: [] });

    renderWithProviders(<AddToListMenu movieId={278} />);
    await userEvent.click(screen.getByLabelText("Add to a list"));

    await waitFor(() =>
      expect(screen.getByText("No lists yet — make one below.")).toBeInTheDocument()
    );
  });
});
