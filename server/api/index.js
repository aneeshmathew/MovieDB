// Vercel serverless entry point. This does NOT replace src/server.js — that
// file is still what `npm run dev`/a traditional Node host (Render,
// Railway, a VM) runs. This wraps the exact same Express app (src/app.js)
// for Vercel's Node.js runtime instead, which expects a (req, res)
// handler rather than a long-running `app.listen()` process.
const connectDB = require("../src/config/db");
const createApp = require("../src/app");

// Cached at module scope so a warm invocation (the same lambda instance
// handling a later request) reuses the existing Mongo connection and
// Apollo Server instance instead of rebuilding them per-request. A cold
// start still pays for both once.
let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      await connectDB();
      return createApp();
    })().catch((err) => {
      // Don't cache a failed build — the next invocation (e.g. after a
      // transient Mongo outage clears) should retry from scratch instead
      // of permanently serving 500s from a poisoned promise.
      appPromise = undefined;
      throw err;
    });
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error("Fatal error building the app:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
};
