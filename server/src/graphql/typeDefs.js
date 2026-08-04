const { gql } = require("graphql-tag");

const typeDefs = gql`
  type WatchlistItem {
    movieId: String!
    addedAt: String!
  }

  type FavoriteItem {
    movieId: String!
    addedAt: String!
  }

  type Preferences {
    genres: [Int!]!
    language: String!
    adultContent: Boolean!
    autoplayTrailers: Boolean!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    watchlist: [WatchlistItem!]!
    favorites: [FavoriteItem!]!
    preferences: Preferences!
    createdAt: String!
  }

  # Returned by register/login. The refresh token itself is never returned
  # in the payload — it's set as an httpOnly cookie by the resolver.
  type AuthPayload {
    accessToken: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refresh: AuthPayload!
    logout: Boolean!
  }
`;

module.exports = typeDefs;
