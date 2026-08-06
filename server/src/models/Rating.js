const mongoose = require("mongoose");

const { Schema } = mongoose;

const ratingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: Number, required: true }, // TMDB id, matches Movie.tmdbId
    score: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: null, maxlength: 2000 },
  },
  { timestamps: true }
);

// One rating per user per movie — upsertRating relies on this to make a
// second submission overwrite the first rather than create a duplicate.
ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
