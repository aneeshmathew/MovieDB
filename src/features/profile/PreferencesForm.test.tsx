import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PreferencesForm } from "./PreferencesForm";

vi.mock("@/lib/graphqlClient", () => ({
  sdk: {
    MyPreferences: vi.fn(),
    UpdatePreferences: vi.fn(),
  },
}));

const BASE_PREFERENCES = {
  genres: [28], // Action
  language: "en",
  adultContent: false,
  autoplayTrailers: true,
};

function renderWithProviders(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe("PreferencesForm", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.MyPreferences as ReturnType<typeof vi.fn>).mockResolvedValue({
      myPreferences: BASE_PREFERENCES,
    });
  });

  it("seeds the form with the current preferences once loaded", async () => {
    renderWithProviders(<PreferencesForm />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    );
    expect(screen.getByRole("button", { name: "Comedy" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Language")).toHaveValue("en");
    expect(screen.getByRole("switch", { name: /Show adult content/ })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: /Autoplay trailers/ })).toBeChecked();
  });

  it("toggling a genre pill and submitting sends the updated genre list", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.UpdatePreferences as ReturnType<typeof vi.fn>).mockResolvedValue({
      updatePreferences: { ...BASE_PREFERENCES, genres: [28, 35] },
    });

    renderWithProviders(<PreferencesForm />);
    await waitFor(() => screen.getByRole("button", { name: "Comedy" }));

    await userEvent.click(screen.getByRole("button", { name: "Comedy" }));
    await userEvent.click(screen.getByRole("button", { name: "Save preferences" }));

    await waitFor(() =>
      expect(sdk.UpdatePreferences).toHaveBeenCalledWith({
        input: { genres: [28, 35], language: "en", adultContent: false, autoplayTrailers: true },
      })
    );
  });

  it("toggling adult content and changing language submits both changes", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.UpdatePreferences as ReturnType<typeof vi.fn>).mockResolvedValue({
      updatePreferences: { ...BASE_PREFERENCES, adultContent: true, language: "fr" },
    });

    renderWithProviders(<PreferencesForm />);
    await waitFor(() => screen.getByLabelText("Language"));

    await userEvent.click(screen.getByRole("switch", { name: /Show adult content/ }));
    await userEvent.selectOptions(screen.getByLabelText("Language"), "fr");
    await userEvent.click(screen.getByRole("button", { name: "Save preferences" }));

    await waitFor(() =>
      expect(sdk.UpdatePreferences).toHaveBeenCalledWith({
        input: { genres: [28], language: "fr", adultContent: true, autoplayTrailers: true },
      })
    );
  });

  it("shows an error message when saving fails", async () => {
    const { sdk } = await import("@/lib/graphqlClient");
    (sdk.UpdatePreferences as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("nope"));

    renderWithProviders(<PreferencesForm />);
    await waitFor(() => screen.getByRole("button", { name: "Save preferences" }));

    await userEvent.click(screen.getByRole("button", { name: "Save preferences" }));

    await waitFor(() =>
      expect(screen.getByText("Couldn't save your preferences. Please try again.")).toBeInTheDocument()
    );
  });
});
