import { describe, it, expect } from "vitest";
const Movie = require("../src/models/Movie");
const { extractCast, extractTrailerKey, personalizeByGenres } = require("../src/graphql/resolvers/movieMappers");

// Shaped like a real TMDB /movie/now_playing or /trending list item.
const listItemFixture = {
  id: 1022789,
  title: "Inside Out 2",
  overview: "Teenager Riley's mind headquarters is undergoing a sudden demolition.",
  poster_path: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
  backdrop_path: "/stKGOm8UyhuLPR9sZLjs5AkmncA.jpg",
  genre_ids: [16, 10751, 12],
  release_date: "2024-06-11",
  vote_average: 7.6,
  vote_count: 3400,
  // no `runtime` on list items
};

// Shaped like a real TMDB /movie/{id} detail item — genres as objects,
// runtime present.
const detailItemFixture = {
  id: 278,
  title: "The Shawshank Redemption",
  overview: "Framed in the 1940s for the double murder of his wife and her lover.",
  poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
  backdrop_path: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
  genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
  release_date: "1994-09-23",
  runtime: 142,
  vote_average: 8.7,
  vote_count: 27000,
  credits: {
    cast: [
      { id: 504, name: "Tim Robbins", character: "Andy Dufresne", profile_path: "/hsCu1i44FEg1ijK1kQmg2K2p6EN.jpg" },
      { id: 192, name: "Morgan Freeman", character: "Ellis Boyd 'Red' Redding", profile_path: null },
    ],
  },
  videos: {
    results: [
      { site: "YouTube", type: "Featurette", key: "not-the-trailer" },
      { site: "YouTube", type: "Trailer", key: "6hB3S9bIaco" },
      { site: "Vimeo", type: "Trailer", key: "should-be-ignored" },
    ],
  },
};

// Recent movie that's highly rated but too new to count as a classic.
const recentHighRatedFixture = {
  id: 999999,
  title: "Brand New Hit",
  release_date: `${new Date().getFullYear() - 1}-01-01`,
  vote_average: 9.0,
  vote_count: 5000,
  genre_ids: [28],
};

describe("Movie.mapTmdbMovie", () => {
  it("maps a list-item shape using genre_ids, with no runtime key", () => {
    const mapped = Movie.mapTmdbMovie(listItemFixture);

    expect(mapped.tmdbId).toBe(1022789);
    expect(mapped.title).toBe("Inside Out 2");
    expect(mapped.genres).toEqual([16, 10751, 12]);
    expect(mapped.releaseYear).toBe(2024);
    expect(mapped).not.toHaveProperty("runtime");
  });

  it("maps a detail-item shape using genres objects, with runtime present", () => {
    const mapped = Movie.mapTmdbMovie(detailItemFixture);

    expect(mapped.genres).toEqual([18, 80]);
    expect(mapped.runtime).toBe(142);
    expect(mapped.releaseYear).toBe(1994);
  });

  it("flags a 30-year-old, highly-rated, highly-voted movie as a classic", () => {
    const mapped = Movie.mapTmdbMovie(detailItemFixture);
    expect(mapped.isClassic).toBe(true);
  });

  it("does not flag a recent highly-rated movie as a classic (age threshold)", () => {
    const mapped = Movie.mapTmdbMovie(recentHighRatedFixture);
    expect(mapped.isClassic).toBe(false);
  });

  it("does not flag an old movie with a low rating as a classic", () => {
    const mapped = Movie.mapTmdbMovie({ ...detailItemFixture, vote_average: 5.0 });
    expect(mapped.isClassic).toBe(false);
  });

  it("handles a movie with no release_date without throwing", () => {
    const mapped = Movie.mapTmdbMovie({ id: 1, title: "No Date", genre_ids: [] });
    expect(mapped.releaseYear).toBeNull();
    expect(mapped.isClassic).toBe(false);
  });
});

describe("movieMappers.extractCast", () => {
  it("maps the top cast members with correct field names", () => {
    const cast = extractCast(detailItemFixture);
    expect(cast).toHaveLength(2);
    expect(cast[0]).toEqual({
      id: 504,
      name: "Tim Robbins",
      character: "Andy Dufresne",
      profilePath: "/hsCu1i44FEg1ijK1kQmg2K2p6EN.jpg",
    });
    expect(cast[1].profilePath).toBeNull();
  });

  it("returns an empty array when credits are missing", () => {
    expect(extractCast({})).toEqual([]);
  });
});

describe("movieMappers.personalizeByGenres", () => {
  it("returns the list unchanged when there are no preferred genres", () => {
    const movies = [{ genres: [16] }, { genres: [18] }];
    expect(personalizeByGenres(movies, [])).toEqual(movies);
    expect(personalizeByGenres(movies, undefined)).toEqual(movies);
  });

  it("moves genre-matching movies to the front, preserving relative order within each group", () => {
    const action = { id: "a", genres: [28] };
    const drama = { id: "d", genres: [18] };
    const comedy = { id: "c", genres: [35] };
    const horror = { id: "h", genres: [27] };

    const result = personalizeByGenres([action, drama, comedy, horror], [18, 35]);

    expect(result.map((m) => m.id)).toEqual(["d", "c", "a", "h"]);
  });

  it("treats a movie with no genres field as unmatched rather than throwing", () => {
    const noGenres = { id: "n" };
    const matches = { id: "m", genres: [18] };
    const result = personalizeByGenres([noGenres, matches], [18]);
    expect(result.map((m) => m.id)).toEqual(["m", "n"]);
  });
});

describe("movieMappers.extractTrailerKey", () => {
  it("finds the YouTube trailer, ignoring featurettes and non-YouTube sources", () => {
    expect(extractTrailerKey(detailItemFixture)).toBe("6hB3S9bIaco");
  });

  it("returns null when no YouTube trailer exists", () => {
    expect(extractTrailerKey({ videos: { results: [] } })).toBeNull();
  });

  it("returns null when videos are missing entirely", () => {
    expect(extractTrailerKey({})).toBeNull();
  });
});
