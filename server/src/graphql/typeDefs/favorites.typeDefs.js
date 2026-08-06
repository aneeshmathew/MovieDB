const { gql } = require("graphql-tag");

const typeDefs = gql`
  type Query {
    favorites: [Movie!]!
  }

  type Mutation {
    addToFavorites(movieId: Int!): [Movie!]!
    removeFromFavorites(movieId: Int!): [Movie!]!
  }
`;

module.exports = typeDefs;
