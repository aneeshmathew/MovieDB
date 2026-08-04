const env = require("./config/env");
const connectDB = require("./config/db");
const createApp = require("./app");

async function main() {
  await connectDB();
  const app = await createApp();

  app.listen(env.PORT, () => {
    console.log(`🚀 MovieDB server ready at http://localhost:${env.PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
