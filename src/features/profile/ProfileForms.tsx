import { useState, type FormEvent } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChangeEmail, useChangePassword } from "./useProfile";

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-crimson">
      {message}
    </p>
  );
}

function SuccessNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-amber">{message}</p>;
}

export function ChangeEmailForm() {
  const user = useAuthStore((s) => s.user);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const changeEmail = useChangeEmail();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    changeEmail.mutate(
      { newEmail, password },
      {
        onSuccess: () => setPassword(""),
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
      <p className="font-mono text-xs text-ink-dim">Current email: {user?.email}</p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-email" className="font-mono text-xs uppercase text-ink-dim">
          New email
        </label>
        <input
          id="new-email"
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email-password" className="font-mono text-xs uppercase text-ink-dim">
          Current password (to confirm)
        </label>
        <input
          id="email-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
        />
      </div>

      {/* Generic on purpose, same reasoning as the login form — don't hand
          back the server's exact reason (wrong password vs. email taken)
          any more specifically than necessary. */}
      <FieldError
        message={
          changeEmail.isError
            ? "Couldn't change your email. Check your password and try again."
            : null
        }
      />
      <SuccessNote message={changeEmail.isSuccess ? "Email updated." : null} />

      <button
        type="submit"
        disabled={changeEmail.isPending}
        className="mt-1 self-start rounded-full bg-amber px-4 py-2 font-mono text-sm uppercase tracking-wide text-void disabled:opacity-50"
      >
        {changeEmail.isPending ? "Updating…" : "Update email"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const changePassword = useChangePassword();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="current-password" className="font-mono text-xs uppercase text-ink-dim">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="font-mono text-xs uppercase text-ink-dim">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
        />
      </div>

      <FieldError
        message={changePassword.isError ? "Couldn't change your password. Please try again." : null}
      />
      <SuccessNote
        message={
          changePassword.isSuccess
            ? "Password updated. You'll need to log in again on other devices."
            : null
        }
      />

      <button
        type="submit"
        disabled={changePassword.isPending}
        className="mt-1 self-start rounded-full bg-amber px-4 py-2 font-mono text-sm uppercase tracking-wide text-void disabled:opacity-50"
      >
        {changePassword.isPending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
