const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");

const authTypeDefs = require("./typeDefs/auth.typeDefs");
const moviesTypeDefs = require("./typeDefs/movies.typeDefs");

const authResolvers = require("./resolvers/auth.resolvers");
const moviesResolvers = require("./resolvers/movies.resolvers");

// Later phases (watchlist, favorites, ratings, preferences) add their own
// typeDefs/resolvers modules and get appended to these two arrays.
const typeDefs = mergeTypeDefs([authTypeDefs, moviesTypeDefs]);
const resolvers = mergeResolvers([authResolvers, moviesResolvers]);

module.exports = { typeDefs, resolvers };
