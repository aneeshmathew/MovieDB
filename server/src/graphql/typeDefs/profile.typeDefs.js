const { gql } = require("graphql-tag");

const typeDefs = gql`
  input UpdateProfileInput {
    name: String
    avatar: String
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    # Requires the current password as confirmation — changing the email
    # address is security-sensitive (it's the account's login identifier).
    changeEmail(newEmail: String!, password: String!): User!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
  }
`;

module.exports = typeDefs;
