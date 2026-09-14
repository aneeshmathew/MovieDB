import { useState } from "react";
import { Check, Share2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text?: string;
  /** Defaults to the current page URL. */
  url?: string;
}

// Prefers the native OS share sheet (mobile browsers, most desktop
// browsers over HTTPS) and falls back to copying the link to the
// clipboard when navigator.share isn't available — e.g. desktop Firefox,
// or any browser served over plain HTTP in local dev.
export function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function handleShare() {
    const shareUrl = url ?? window.location.href;
    setError(false);

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch (err) {
        // AbortError fires when the person just closes the share sheet —
        // not a failure worth surfacing.
        if ((err as Error)?.name !== "AbortError") setError(true);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Link copied" : "Share"}
      className="flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-xs uppercase leading-none text-ink hover:border-amber"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-amber" aria-hidden="true" />
      ) : (
        <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      {copied ? "Copied!" : error ? "Couldn't share" : "Share"}
    </button>
  );
}
