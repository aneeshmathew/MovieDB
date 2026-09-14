import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (crimson) instead of the default amber. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Replaces window.confirm()/window.alert(), which render as unstyled
// browser chrome (literally "localhost says…" in Chrome) rather than
// anything belonging to the app. This is a plain portal + fixed overlay,
// no dialog library — matches the rest of the app's minimal-dependency
// approach (see AddToListMenu's history for the same reasoning).
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focuses the confirm button on open (a reasonable default for a
  // yes/no prompt) and lets Escape dismiss it, same as a native dialog.
  useEffect(() => {
    if (!open) return;
    confirmButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-md border border-line bg-panel p-5 shadow-lg"
      >
        <h2 id="confirm-dialog-title" className="font-display text-lg uppercase text-ink">
          {title}
        </h2>
        {description && (
          <p id="confirm-dialog-description" className="mt-2 font-mono text-sm text-ink-dim">
            {description}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-ink hover:border-amber"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-void ${
              danger ? "bg-crimson" : "bg-amber"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
