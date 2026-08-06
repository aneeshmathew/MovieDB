const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { Schema } = mongoose;

const watchlistItemSchema = new Schema(
  { movieId: { type: Number, required: true }, addedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const favoriteItemSchema = new Schema(
  { movieId: { type: Number, required: true }, addedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const preferencesSchema = new Schema(
  {
    genres: { type: [Number], default: [] }, // TMDB genre IDs
    language: { type: String, default: "en" },
    adultContent: { type: Boolean, default: false },
    autoplayTrailers: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String, default: null },

    watchlist: { type: [watchlistItemSchema], default: [] },
    favorites: { type: [favoriteItemSchema], default: [] },
    preferences: { type: preferencesSchema, default: () => ({}) },

    refreshTokenVersion: { type: Number, default: 0 }, // bumped on logout/logout-all to invalidate old refresh tokens
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plainText) {
  return bcrypt.compare(plainText, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plainText) {
  return bcrypt.hash(plainText, 12);
};

module.exports = mongoose.model("User", userSchema);
