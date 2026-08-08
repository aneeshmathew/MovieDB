const mongoose = require("mongoose");

const { Schema } = mongoose;

const listSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // TMDB ids, matches Movie.tmdbId — same shape as User.watchlist/favorites
    // items, but kept in its own collection (rather than embedded on User)
    // since a user can have an arbitrary number of named lists.
    movieIds: { type: [Number], default: [] },
  },
  { timestamps: true }
);

// One list name per owner — createList/renameList rely on the resulting
// duplicate-key error (code 11000) to reject a second list with the same
// name, rather than silently allowing ambiguous "Weekend Watch" x2.
listSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("List", listSchema);
