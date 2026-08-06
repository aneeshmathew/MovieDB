const { gql } = require("graphql-tag");

const typeDefs = gql`
  type Rating {
    id: ID!
    movieId: Int!
    score: Int!
    review: String
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    # The current user's own rating for a movie — null if they haven't rated it.
    rating(movieId: Int!): Rating
  }

  type Mutation {
    upsertRating(movieId: Int!, score: Int!, review: String): Rating!
    deleteRating(movieId: Int!): Boolean!
  }
`;

module.exports = typeDefs;
