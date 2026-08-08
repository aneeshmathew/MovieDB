#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const SERVER_DIR = path.join(ROOT, "server");
const CLIENT_DIR = path.join(ROOT, "client");

function log(msg) {
  console.log(`\n\x1b[36m${msg}\x1b[0m`);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`\n❌ Command failed: ${command} ${args.join(" ")} (in ${cwd})`);
    process.exit(result.status ?? 1);
  }
}

function randomSecret() {
  return crypto.randomBytes(48).toString("hex");
}

// Copies .env.example -> .env if .env doesn't exist yet. For the server,
// also fills in real random JWT secrets (fine for local dev — these are
// per-machine dev secrets, not shared/committed) so a fresh clone boots
// without the person needing to generate them manually. MONGO_URI and
// TMDB_ACCESS_TOKEN are left as placeholders since those genuinely require
// the person's own credentials — setup can't invent those.
function ensureEnvFile(dir, { generateJwtSecrets = false } = {}) {
  const envPath = path.join(dir, ".env");
  const examplePath = path.join(dir, ".env.example");

  if (fs.existsSync(envPath)) {
    console.log(`  .env already exists in ${path.basename(dir)}/ — leaving it untouched`);
    return;
  }

  if (!fs.existsSync(examplePath)) {
    console.log(`  No .env.example found in ${path.basename(dir)}/ — skipping`);
    return;
  }

  let contents = fs.readFileSync(examplePath, "utf-8");

  if (generateJwtSecrets) {
    contents = contents
      .replace(/^JWT_ACCESS_SECRET=.*$/m, `JWT_ACCESS_SECRET=${randomSecret()}`)
      .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${randomSecret()}`);
  }

  fs.writeFileSync(envPath, contents);
  console.log(`  ✅ Created ${path.basename(dir)}/.env`);
}

function runSetup() {
  log("📦 Installing server dependencies…");
  run("npm", ["install"], SERVER_DIR);

  log("📦 Installing client dependencies…");
  run("npm", ["install"], CLIENT_DIR);

  log("🔐 Setting up environment files…");
  ensureEnvFile(SERVER_DIR, { generateJwtSecrets: true });
  ensureEnvFile(CLIENT_DIR);

  log("🧬 Printing the GraphQL schema from the server's live typeDefs…");
  run("npm", ["run", "schema:print"], SERVER_DIR);
  fs.copyFileSync(path.join(SERVER_DIR, "schema.graphql"), path.join(CLIENT_DIR, "schema.graphql"));
  console.log("  ✅ Copied server/schema.graphql → client/schema.graphql");

  log("⚙️  Generating typed GraphQL operations (Codegen)…");
  run("npm", ["run", "codegen"], CLIENT_DIR);

  log("✅ Setup complete.");
  console.log(`
Before running the app for real, fill in server/.env with:
  - MONGO_URI          (Atlas connection string, or mongodb://localhost:27017/moviedb)
  - TMDB_ACCESS_TOKEN   (TMDB account settings → API → "API Read Access Token")

JWT secrets were generated for you. Everything else has sensible local defaults.
`);
}

if (require.main === module) {
  runSetup();
}

module.exports = { runSetup, SERVER_DIR, CLIENT_DIR, ROOT };
