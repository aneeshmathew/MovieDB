import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRegister } from "./useAuth";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = useRegister();
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    register.mutate({ name, email, password }, { onSuccess: () => navigate("/") });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 font-display text-3xl uppercase text-ink">Sign up</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="font-mono text-xs uppercase text-ink-dim">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
          />
        </div>

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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
          />
          <p className="font-mono text-[11px] text-ink-dim">At least 8 characters.</p>
        </div>

        {register.isError && (
          <p role="alert" className="text-sm text-crimson">
            {/* Generic on purpose — mirrors the login page's reasoning:
                don't surface the server's specific reason (e.g. exact
                validation detail or internal error text) beyond what's
                actionable. Field-level validation (email format, password
                length) is still caught by the input's own `required`/
                `minLength` before this ever fires. */}
            Couldn't create your account. Please check your details and try again.
          </p>
        )}

        <button
          type="submit"
          disabled={register.isPending}
          className="mt-2 rounded-full bg-amber py-2.5 font-mono text-sm uppercase tracking-wide text-void disabled:opacity-50"
        >
          {register.isPending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-dim">
        Already have an account?{" "}
        <Link to="/login" className="text-amber hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
