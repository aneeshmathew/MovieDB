import { Link, NavLink } from "react-router-dom";
import { Film } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-mono text-xs uppercase tracking-wide transition-colors ${
    isActive ? "text-amber" : "text-ink-dim hover:text-ink"
  }`;

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-void/90 px-4 py-3 backdrop-blur sm:px-8">
      <Link to="/" className="flex items-center gap-2 font-display text-lg uppercase text-ink">
        <Film className="h-5 w-5 text-amber" aria-hidden="true" />
        MovieDB
      </Link>

      <nav className="flex items-center gap-5" aria-label="Primary">
        <NavLink to="/" className={navLinkClass} end>
          Dashboard
        </NavLink>
        {user && (
          <>
            <NavLink to="/watchlist" className={navLinkClass}>
              Watchlist
            </NavLink>
            <NavLink to="/favorites" className={navLinkClass}>
              Favorites
            </NavLink>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {user ? (
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="font-mono text-xs uppercase tracking-wide text-ink-dim hover:text-ink"
          >
            Log out
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="font-mono text-xs uppercase tracking-wide text-ink-dim hover:text-ink"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-amber px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-dim"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
