import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import { useAuthStore } from "@/store/authStore";
import { MovieGrid } from "@/features/movies/MovieGrid";
import { ListsPage } from "@/features/movies/ListsPage";
import { RowSkeleton } from "@/components/Skeleton";
import { ChangeEmailForm, ChangePasswordForm } from "./ProfileForms";
import { PreferencesForm } from "./PreferencesForm";
import { ReviewsList } from "./ReviewsList";

type Tab = "info" | "preferences" | "mylists" | "reviews" | "favorites" | "watchlist";

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "Profile" },
  { id: "preferences", label: "Preferences" },
  { id: "mylists", label: "My Lists" },
  { id: "reviews", label: "Reviews & Ratings" },
  { id: "favorites", label: "Favorites" },
  { id: "watchlist", label: "Watchlist" },
];

function FavoritesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => (await sdk.Favorites()).favorites,
  });
  if (isLoading) return <RowSkeleton title="" />;
  return <MovieGrid movies={data ?? []} emptyMessage="No favorites yet." />;
}

function WatchlistTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => (await sdk.Watchlist()).watchlist,
  });
  if (isLoading) return <RowSkeleton title="" />;
  return <MovieGrid movies={data ?? []} emptyMessage="Nothing queued up yet." />;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <h1 className="font-display text-3xl uppercase text-ink">{user?.name}</h1>
      <p className="mt-1 font-mono text-sm text-ink-dim">{user?.email}</p>

      <div
        role="tablist"
        aria-label="Profile sections"
        className="mt-6 flex flex-wrap gap-1 border-b border-line"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wide transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-amber text-amber"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div
          role="tabpanel"
          id="panel-info"
          aria-labelledby="tab-info"
          hidden={activeTab !== "info"}
          className="flex flex-col gap-8"
        >
          {/* Name is fixed at registration — no edit UI here by design. */}
          <section>
            <h2 className="mb-3 font-display text-lg uppercase text-ink">Email</h2>
            <ChangeEmailForm />
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg uppercase text-ink">Password</h2>
            <ChangePasswordForm />
          </section>
        </div>

        <div
          role="tabpanel"
          id="panel-preferences"
          aria-labelledby="tab-preferences"
          hidden={activeTab !== "preferences"}
        >
          {activeTab === "preferences" && <PreferencesForm />}
        </div>

        <div
          role="tabpanel"
          id="panel-mylists"
          aria-labelledby="tab-mylists"
          hidden={activeTab !== "mylists"}
          className="-mx-4 sm:-mx-8"
        >
          {activeTab === "mylists" && <ListsPage />}
        </div>

        <div
          role="tabpanel"
          id="panel-reviews"
          aria-labelledby="tab-reviews"
          hidden={activeTab !== "reviews"}
        >
          {activeTab === "reviews" && <ReviewsList />}
        </div>

        <div
          role="tabpanel"
          id="panel-favorites"
          aria-labelledby="tab-favorites"
          hidden={activeTab !== "favorites"}
        >
          {activeTab === "favorites" && <FavoritesTab />}
        </div>

        <div
          role="tabpanel"
          id="panel-watchlist"
          aria-labelledby="tab-watchlist"
          hidden={activeTab !== "watchlist"}
        >
          {activeTab === "watchlist" && <WatchlistTab />}
        </div>
      </div>
    </div>
  );
}
