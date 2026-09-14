import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareButton } from "./ShareButton";

describe("ShareButton", () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, "share", { value: originalShare, configurable: true });
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("uses navigator.share with title/text/url when available", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: shareMock, configurable: true });

    render(<ShareButton title="The Shawshank Redemption" text="A great film." url="https://example.com/movies/278" />);
    await userEvent.click(screen.getByLabelText("Share"));

    await waitFor(() =>
      expect(shareMock).toHaveBeenCalledWith({
        title: "The Shawshank Redemption",
        text: "A great film.",
        url: "https://example.com/movies/278",
      })
    );
  });

  it("does not show an error when the share sheet is dismissed (AbortError)", async () => {
    const abortError = new Error("cancelled");
    abortError.name = "AbortError";
    const shareMock = vi.fn().mockRejectedValue(abortError);
    Object.defineProperty(navigator, "share", { value: shareMock, configurable: true });

    render(<ShareButton title="Some Movie" url="https://example.com/movies/1" />);
    await userEvent.click(screen.getByLabelText("Share"));

    await waitFor(() => expect(shareMock).toHaveBeenCalled());
    expect(screen.queryByText("Couldn't share")).not.toBeInTheDocument();
  });

  it("falls back to clipboard and shows 'Copied!' when navigator.share is unavailable", async () => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<ShareButton title="Some Movie" url="https://example.com/movies/1" />);
    await userEvent.click(screen.getByLabelText("Share"));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://example.com/movies/1"));
    await waitFor(() => expect(screen.getByText("Copied!")).toBeInTheDocument());
  });

  it("shows an error state when both share and clipboard fail", async () => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<ShareButton title="Some Movie" url="https://example.com/movies/1" />);
    await userEvent.click(screen.getByLabelText("Share"));

    await waitFor(() => expect(screen.getByText("Couldn't share")).toBeInTheDocument());
  });
});
