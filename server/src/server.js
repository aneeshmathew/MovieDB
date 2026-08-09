const env = require("./config/env");
const connectDB = require("./config/db");
const createApp = require("./app");

async function main() {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }

  const app = await createApp();

  app.listen(env.PORT, () => {
    console.log(`🚀 MovieDB server ready at http://localhost:${env.PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
