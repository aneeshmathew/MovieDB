// A curated subset, not an exhaustive ISO 639-1 list — matches what TMDB's
// own UI commonly surfaces. `preferences.language` is stored as a plain
// string (validated server-side as 2-10 chars), so this is just a
// convenience picker, not an enum enforced anywhere.
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
] as const;
