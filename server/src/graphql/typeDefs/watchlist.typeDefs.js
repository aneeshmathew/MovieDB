const { gql } = require("graphql-tag");

const typeDefs = gql`
  type Query {
    watchlist: [Movie!]!
  }

  type Mutation {
    addToWatchlist(movieId: Int!): [Movie!]!
    removeFromWatchlist(movieId: Int!): [Movie!]!
  }
`;

module.exports = typeDefs;
