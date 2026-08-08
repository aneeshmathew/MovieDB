const { gql } = require("graphql-tag");

const typeDefs = gql`
  type Rating {
    id: ID!
    movieId: Int!
    score: Int!
    review: String
    createdAt: String!
    updatedAt: String!
    # Lazily resolved (same cache-first pattern as Movie.cast/similar) — only
    # fetched when a query actually asks for it, e.g. the Profile page's
    # "reviews you've posted" list.
    movie: Movie!
  }

  type Query {
    # The current user's own rating for a movie — null if they haven't rated it.
    rating(movieId: Int!): Rating
    # All of the current user's ratings/reviews, most recently updated first.
    myRatings: [Rating!]!
  }

  type Mutation {
    upsertRating(movieId: Int!, score: Int!, review: String): Rating!
    deleteRating(movieId: Int!): Boolean!
  }
`;

module.exports = typeDefs;
