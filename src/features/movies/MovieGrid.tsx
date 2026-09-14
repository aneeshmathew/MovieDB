import { MovieCard } from "./MovieCard";
import type { MovieCardFieldsFragment } from "@/graphql/generated";

interface MovieGridProps {
  movies: MovieCardFieldsFragment[];
  emptyMessage: string;
}

export function MovieGrid({ movies, emptyMessage }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <p className="px-4 py-16 text-center font-mono text-sm text-ink-dim sm:px-8">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-3 sm:px-8 md:grid-cols-4 lg:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
