const { gql } = require("graphql-tag");

const typeDefs = gql`
  input PreferencesInput {
    genres: [Int!]
    language: String
    adultContent: Boolean
    autoplayTrailers: Boolean
  }

  type Query {
    myPreferences: Preferences!
  }

  type Mutation {
    updatePreferences(input: PreferencesInput!): Preferences!
  }
`;

module.exports = typeDefs;
