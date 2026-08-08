import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Film, Search, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-mono text-xs uppercase tracking-wide transition-colors ${
    isActive ? "text-amber" : "text-ink-dim hover:text-ink"
  }`;

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-void/90 px-4 py-3 backdrop-blur sm:flex-nowrap sm:gap-4 sm:px-8">
      <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg uppercase text-ink">
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
            <NavLink to="/lists" className={navLinkClass}>
              My Lists
            </NavLink>
          </>
        )}
      </nav>

      <form
        onSubmit={handleSearchSubmit}
        role="search"
        className="order-last flex w-full min-w-0 max-w-sm flex-1 items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 focus-within:border-amber sm:order-none"
      >
        <Search className="h-4 w-4 shrink-0 text-ink-dim" aria-hidden="true" />
        <label htmlFor="navbar-search" className="sr-only">
          Search movies
        </label>
        <input
          id="navbar-search"
          type="search"
          placeholder="Search movies…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
        />
      </form>

      <div className="flex shrink-0 items-center gap-3">
        {user ? (
          <>
            <Link
              to="/profile"
              aria-label="Your profile"
              className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-ink-dim hover:text-ink"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              {user.name.split(" ")[0]}
            </Link>
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="font-mono text-xs uppercase tracking-wide text-ink-dim hover:text-ink"
            >
              Log out
            </button>
          </>
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
