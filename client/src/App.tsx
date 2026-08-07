import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HeroSkeleton, RowSkeleton } from "@/components/Skeleton";
import { useSessionBootstrap } from "@/features/auth/useAuth";

// Route-based code splitting: each page ships as its own chunk, per the
// plan's performance section — the dashboard bundle shouldn't include
// login/register/watchlist code a first-time visitor never touches.
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("@/features/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const WatchlistPage = lazy(() =>
  import("@/features/movies/WatchlistPage").then((m) => ({ default: m.WatchlistPage }))
);
const FavoritesPage = lazy(() =>
  import("@/features/movies/FavoritesPage").then((m) => ({ default: m.FavoritesPage }))
);

function RouteFallback() {
  return (
    <div>
      <HeroSkeleton />
      <RowSkeleton title="" />
    </div>
  );
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <p className="font-display text-xl uppercase text-ink">Reel snapped</p>
      <p className="max-w-sm text-sm text-ink-dim">
        {error instanceof Error ? error.message : "Something went wrong."}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="rounded-full border border-amber px-4 py-2 font-mono text-sm text-amber hover:bg-amber-dim"
      >
        Try again
      </button>
    </div>
  );
}

export function App() {
  // Fires once on mount — attempts the silent refresh so a page reload
  // doesn't require logging in again (access token is memory-only).
  useSessionBootstrap();

  return (
    <>
      {/* Visually hidden until focused — first Tab stop skips the navbar,
          per the accessibility plan's skip-link requirement. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-amber focus:px-3 focus:py-2 focus:font-mono focus:text-sm focus:text-void"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
}
