const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");

const authTypeDefs = require("./typeDefs/auth.typeDefs");
const moviesTypeDefs = require("./typeDefs/movies.typeDefs");
const watchlistTypeDefs = require("./typeDefs/watchlist.typeDefs");
const favoritesTypeDefs = require("./typeDefs/favorites.typeDefs");
const ratingsTypeDefs = require("./typeDefs/ratings.typeDefs");
const preferencesTypeDefs = require("./typeDefs/preferences.typeDefs");
const profileTypeDefs = require("./typeDefs/profile.typeDefs");

const authResolvers = require("./resolvers/auth.resolvers");
const { resolvers: moviesResolvers } = require("./resolvers/movies.resolvers");
const watchlistResolvers = require("./resolvers/watchlist.resolvers");
const favoritesResolvers = require("./resolvers/favorites.resolvers");
const { resolvers: ratingsResolvers } = require("./resolvers/ratings.resolvers");
const preferencesResolvers = require("./resolvers/preferences.resolvers");
const profileResolvers = require("./resolvers/profile.resolvers");

const typeDefs = mergeTypeDefs([
  authTypeDefs,
  moviesTypeDefs,
  watchlistTypeDefs,
  favoritesTypeDefs,
  ratingsTypeDefs,
  preferencesTypeDefs,
  profileTypeDefs,
]);

const resolvers = mergeResolvers([
  authResolvers,
  moviesResolvers,
  watchlistResolvers,
  favoritesResolvers,
  ratingsResolvers,
  preferencesResolvers,
  profileResolvers,
]);

module.exports = { typeDefs, resolvers };
