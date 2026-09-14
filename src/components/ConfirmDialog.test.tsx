import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete this?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders the title and description when open", () => {
    render(
      <ConfirmDialog
        open
        title='Delete "Weekend Watch"?'
        description="This can't be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText('Delete "Weekend Watch"?')).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete this?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button, the overlay, or Escape is used", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete this?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("clicking inside the dialog panel does not trigger onCancel (only the overlay does)", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete this?"
        description="This can't be undone."
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByText("This can't be undone."));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
