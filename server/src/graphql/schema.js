const typeDefs = require("./typeDefs");
const authResolvers = require("./resolvers/auth.resolvers");

// Later phases add their own resolver modules here (movies, watchlist,
// favorites, ratings, preferences) and get merged in the same way.
const resolvers = authResolvers;

module.exports = { typeDefs, resolvers };
