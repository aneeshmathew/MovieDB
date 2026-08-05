const { gql } = require("graphql-tag");

const typeDefs = gql`
  type CastMember {
    id: Int!
    name: String!
    character: String
    profilePath: String
  }

  type Movie {
    id: ID!
    tmdbId: Int!
    title: String!
    overview: String
    posterPath: String
    backdropPath: String
    genres: [Int!]!
    releaseDate: String
    releaseYear: Int
    runtime: Int
    tmdbVoteAverage: Float!
    tmdbVoteCount: Int!
    avgRating: Float!
    ratingCount: Int!
    isClassic: Boolean!

    # Resolved lazily and only when requested — see Movie field resolvers.
    # Backed by the same cached TMDB detail payload regardless of whether
    # it was first warmed by a detail-page view or a list view requesting
    # these fields.
    cast: [CastMember!]!
    trailerKey: String
    similar: [Movie!]!
  }

  type DashboardSections {
    newReleases: [Movie!]!
    trending: [Movie!]!
    upcoming: [Movie!]!
    classics: [Movie!]!
  }

  type Query {
    dashboard: DashboardSections!
    movie(tmdbId: Int!): Movie
    searchMovies(query: String!, page: Int): [Movie!]!
  }
`;

module.exports = typeDefs;
