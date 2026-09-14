import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (score: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

const SIZE_CLASSES = { sm: "h-4 w-4", md: "h-6 w-6" };

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  if (readOnly) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
        {stars.map((n) => (
          <Star
            key={n}
            className={`${SIZE_CLASSES[size]} ${n <= value ? "fill-amber text-amber" : "text-line"}`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange?.(n)}
          className="rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
        >
          <Star
            className={`${SIZE_CLASSES[size]} transition-colors ${
              n <= value ? "fill-amber text-amber" : "text-line hover:text-amber/60"
            }`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
