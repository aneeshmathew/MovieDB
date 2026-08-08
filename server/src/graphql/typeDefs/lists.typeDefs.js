const { gql } = require("graphql-tag");

const typeDefs = gql`
  # Named "MovieList" (not "List") to avoid any confusion with GraphQL's
  # own list type syntax ([Movie!]!) elsewhere in the schema.
  type MovieList {
    id: ID!
    name: String!
    # Raw ids for cheap membership checks (e.g. "is this movie already in
    # this list?" in a client dropdown) without paying for full Movie
    # resolution when the caller doesn't need it.
    movieIds: [Int!]!
    movieCount: Int!
    # Resolved lazily to full Movie docs — only fetched from
    # Mongo/TMDB-cache when a caller actually selects this field.
    movies: [Movie!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    myLists: [MovieList!]!
    list(id: ID!): MovieList
  }

  type Mutation {
    createList(name: String!): MovieList!
    renameList(id: ID!, name: String!): MovieList!
    deleteList(id: ID!): Boolean!
    addToList(id: ID!, movieId: Int!): MovieList!
    removeFromList(id: ID!, movieId: Int!): MovieList!
  }
`;

module.exports = typeDefs;
