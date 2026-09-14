import { Link } from "react-router-dom";
import { posterUrl } from "@/lib/tmdbImage";
import { StarRating } from "@/components/StarRating";
import { useMyRatings } from "./useProfile";
import { RowSkeleton } from "@/components/Skeleton";

export function ReviewsList() {
  const { data, isLoading } = useMyRatings();

  if (isLoading) return <RowSkeleton title="" />;

  if (!data || data.length === 0) {
    return (
      <p className="px-4 py-16 text-center font-mono text-sm text-ink-dim sm:px-8">
        You haven't rated anything yet — rate a movie from its detail page.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4 px-4 py-6 sm:px-8">
      {data.map((rating) => {
        const poster = posterUrl(rating.movie.posterPath, "w200");
        return (
          <li key={rating.id} className="flex gap-4 rounded-md border border-line p-3">
            <Link to={`/movies/${rating.movieId}`} className="shrink-0">
              {poster ? (
                <img
                  src={poster}
                  alt={`${rating.movie.title} poster`}
                  className="h-24 w-16 rounded object-cover"
                />
              ) : (
                <div className="flex h-24 w-16 items-center justify-center rounded bg-panel-raised text-center font-mono text-[10px] text-ink-dim">
                  {rating.movie.title}
                </div>
              )}
            </Link>
            <div className="flex-1">
              <Link to={`/movies/${rating.movieId}`} className="font-body text-ink hover:text-amber">
                {rating.movie.title}
              </Link>
              <div className="mt-1">
                <StarRating value={rating.score} readOnly size="sm" />
              </div>
              {rating.review && <p className="mt-2 text-sm text-ink-dim">{rating.review}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
