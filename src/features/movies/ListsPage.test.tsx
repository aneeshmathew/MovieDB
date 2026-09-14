import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ListsPage } from "./ListsPage";

vi.mock("@/lib/graphqlClient", () => ({
  sdk: {
    MyLists: vi.fn(),
    CreateList: vi.fn(),
    RenameList: vi.fn(),
    DeleteList: vi.fn(),
  },
}));

const LIST_A = { id: "list1", name: "Weekend Watch", movieIds: [278], movieCount: 1 };

function renderWithProviders(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ListsPage delete flow", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.MyLists as ReturnType<typeof vi.fn>).mockResolvedValue({ myLists: [LIST_A] });
  });

  it("clicking delete opens an in-app confirm dialog rather than calling window.confirm", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");

    renderWithProviders(<ListsPage />);
    await waitFor(() => screen.getByLabelText("Delete Weekend Watch"));
    await userEvent.click(screen.getByLabelText("Delete Weekend Watch"));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText('Delete "Weekend Watch"?')).toBeInTheDocument();
  });

  it("cancelling the dialog does not delete the list", async () => {
    const { sdk } = await import("@/lib/graphqlClient");

    renderWithProviders(<ListsPage />);
    await waitFor(() => screen.getByLabelText("Delete Weekend Watch"));
    await userEvent.click(screen.getByLabelText("Delete Weekend Watch"));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(sdk.DeleteList).not.toHaveBeenCalled();
  });

  it("confirming the dialog deletes the list", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.DeleteList as ReturnType<typeof vi.fn>).mockResolvedValue({ deleteList: true });

    renderWithProviders(<ListsPage />);
    await waitFor(() => screen.getByLabelText("Delete Weekend Watch"));
    await userEvent.click(screen.getByLabelText("Delete Weekend Watch"));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(sdk.DeleteList).toHaveBeenCalledWith({ id: "list1" }));
  });
});
