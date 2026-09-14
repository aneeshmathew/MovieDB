import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLogin } from "./useAuth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => navigate("/") });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 font-display text-3xl uppercase text-ink">Log in</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-mono text-xs uppercase text-ink-dim">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="font-mono text-xs uppercase text-ink-dim">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
          />
        </div>

        {login.isError && (
          <p role="alert" className="text-sm text-crimson">
            {/* Deliberately generic regardless of the actual server error
                (wrong password, unknown email, network failure, etc.) —
                surfacing the specific reason would let someone probe which
                emails are registered, and isn't actionable for the user
                beyond "check what you typed." */}
            Login failed. Please check your email and password and try again.
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="mt-2 rounded-full bg-amber py-2.5 font-mono text-sm uppercase tracking-wide text-void disabled:opacity-50"
        >
          {login.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-dim">
        No account?{" "}
        <Link to="/register" className="text-amber hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
