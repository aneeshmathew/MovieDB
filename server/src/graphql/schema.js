const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");

const authTypeDefs = require("./typeDefs/auth.typeDefs");
const moviesTypeDefs = require("./typeDefs/movies.typeDefs");
const watchlistTypeDefs = require("./typeDefs/watchlist.typeDefs");
const favoritesTypeDefs = require("./typeDefs/favorites.typeDefs");

const authResolvers = require("./resolvers/auth.resolvers");
const { resolvers: moviesResolvers } = require("./resolvers/movies.resolvers");
const watchlistResolvers = require("./resolvers/watchlist.resolvers");
const favoritesResolvers = require("./resolvers/favorites.resolvers");

// Later phases (ratings, preferences) add their own typeDefs/resolvers
// modules and get appended to these two arrays.
const typeDefs = mergeTypeDefs([authTypeDefs, moviesTypeDefs, watchlistTypeDefs, favoritesTypeDefs]);
const resolvers = mergeResolvers([authResolvers, moviesResolvers, watchlistResolvers, favoritesResolvers]);

module.exports = { typeDefs, resolvers };
