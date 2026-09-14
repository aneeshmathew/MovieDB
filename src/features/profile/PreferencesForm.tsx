import { useEffect, useState } from "react";
import { useMyPreferences, useUpdatePreferences } from "./usePreferences";
import { MOVIE_GENRES } from "@/lib/genres";
import { LANGUAGES } from "@/lib/languages";

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm text-ink">{label}</span>
        <span className="block font-mono text-xs text-ink-dim">{description}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="h-5 w-9 rounded-full bg-panel-raised transition-colors peer-checked:bg-amber peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-ink transition-transform peer-checked:translate-x-4"
        />
      </span>
    </label>
  );
}

export function PreferencesForm() {
  const { data: preferences, isLoading } = useMyPreferences();
  const updatePreferences = useUpdatePreferences();

  const [genres, setGenres] = useState<number[]>([]);
  const [language, setLanguage] = useState("en");
  const [adultContent, setAdultContent] = useState(false);
  const [autoplayTrailers, setAutoplayTrailers] = useState(true);

  // Seed local editable state once the server value arrives — a plain
  // controlled form over server state, same shape as ProfileInfoForm.
  useEffect(() => {
    if (!preferences) return;
    setGenres(preferences.genres);
    setLanguage(preferences.language);
    setAdultContent(preferences.adultContent);
    setAutoplayTrailers(preferences.autoplayTrailers);
  }, [preferences]);

  function toggleGenre(id: number) {
    setGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updatePreferences.mutate({ genres, language, adultContent, autoplayTrailers });
  }

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-dim">Loading preferences…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <div>
        <p className="mb-2 font-mono text-xs uppercase text-ink-dim">
          Favorite genres — personalizes your dashboard rows
        </p>
        <div className="flex flex-wrap gap-2">
          {MOVIE_GENRES.map((genre) => {
            const selected = genres.includes(genre.id);
            return (
              <button
                key={genre.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleGenre(genre.id)}
                className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide transition-colors ${
                  selected
                    ? "border-amber bg-amber-dim text-amber"
                    : "border-line text-ink-dim hover:text-ink"
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="preferences-language" className="font-mono text-xs uppercase text-ink-dim">
          Language
        </label>
        <select
          id="preferences-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-48 rounded border border-line bg-panel px-3 py-2 text-ink focus-visible:border-amber"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-line rounded-md border border-line px-4">
        <Toggle
          id="preferences-adult-content"
          label="Show adult content"
          description="Include mature-rated titles in search and browsing."
          checked={adultContent}
          onChange={setAdultContent}
        />
        <Toggle
          id="preferences-autoplay"
          label="Autoplay trailers"
          description="Play a movie's trailer automatically on its detail page."
          checked={autoplayTrailers}
          onChange={setAutoplayTrailers}
        />
      </div>

      {updatePreferences.isError && (
        <p role="alert" className="text-xs text-crimson">
          Couldn't save your preferences. Please try again.
        </p>
      )}
      {updatePreferences.isSuccess && !updatePreferences.isPending && (
        <p className="text-xs text-amber">Preferences saved.</p>
      )}

      <button
        type="submit"
        disabled={updatePreferences.isPending}
        className="self-start rounded-full bg-amber px-4 py-2 font-mono text-sm uppercase tracking-wide text-void disabled:opacity-50"
      >
        {updatePreferences.isPending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
