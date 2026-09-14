import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MovieCard } from "./MovieCard";
import type { MovieCardFieldsFragment } from "@/graphql/generated";

interface MovieRowProps {
  title: string;
  movies: MovieCardFieldsFragment[];
  /** How many leading cards render eager (no loading="lazy") — above-the-fold rows only. */
  eagerCount?: number;
}

// Matches MovieCard's sm:w-44 (44 * 4px). Used as a fixed size for the
// virtualizer rather than measuring each card — cards are uniform width,
// so a constant estimateSize is both simpler and exact at the sm+ breakpoint
// (a minor, acceptable imprecision below it, where cards are w-40/160px).
const CARD_WIDTH = 176;
const GAP = 16;

export function MovieRow({ title, movies, eagerCount = 0 }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: movies.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_WIDTH + GAP,
    horizontal: true,
    overscan: 4,
  });

  if (movies.length === 0) return null;

  return (
    <section aria-label={title} className="py-2">
      <h2 className="mb-3 px-4 font-display text-lg uppercase tracking-wide text-ink sm:px-6">
        {title}
      </h2>

      {/* role="region" + keyboard-scrollable per the plan's accessibility
          spec for horizontal scroll rows — tabIndex makes it a Tab stop so
          arrow-key/Page-Up-Down scrolling works without a mouse. */}
      <div
        ref={scrollRef}
        role="region"
        aria-label={`${title} — scrollable`}
        tabIndex={0}
        className="scrollbar-none h-[19rem] overflow-x-auto px-4 pb-2 sm:px-6"
      >
        <div
          style={{ width: `${virtualizer.getTotalSize()}px`, position: "relative", height: "100%" }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const movie = movies[virtualItem.index];
            return (
              <div
                key={movie.id}
                style={{
                  position: "absolute",
                  left: `${virtualItem.start}px`,
                  top: 0,
                  width: `${CARD_WIDTH}px`,
                }}
              >
                <MovieCard movie={movie} eager={virtualItem.index < eagerCount} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
