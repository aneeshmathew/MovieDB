const mongoose = require("mongoose");
const env = require("./env");

// Cached across warm serverless invocations (Vercel functions) so repeated
// calls to connectDB() within the same lambda instance don't reconnect on
// every request — only the first cold-start call actually dials Mongo.
let connectionPromise = null;

async function connectDB() {
  mongoose.set("strictQuery", true);

  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGO_URI).catch((err) => {
      connectionPromise = null; // let the next call retry instead of caching a permanent failure
      throw err;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });
  }

  await connectionPromise;
  return mongoose.connection;
}

module.exports = connectDB;
