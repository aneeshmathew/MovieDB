#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { SERVER_DIR, CLIENT_DIR } = require("./setup");

function prefixedSpawn(label, color, command, args, cwd) {
  const child = spawn(command, args, { cwd, shell: process.platform === "win32" });

  const prefix = `\x1b[${color}m[${label}]\x1b[0m `;
  const pipe = (stream, out) => {
    stream.on("data", (chunk) => {
      const lines = chunk.toString().split("\n").filter((l) => l.length > 0);
      for (const line of lines) out.write(prefix + line + "\n");
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);

  return child;
}

// Fails fast with a clear instruction rather than letting `npm run dev`
// crash deep inside server/ or client/ with a confusing "module not found"
// if setup was never run. Deliberately does NOT run install itself —
// that's `npm run setup`'s job, not this one's.
function checkReady() {
  const missing = [];
  if (!fs.existsSync(path.join(SERVER_DIR, "node_modules"))) missing.push("server/node_modules");
  if (!fs.existsSync(path.join(CLIENT_DIR, "node_modules"))) missing.push("client/node_modules");
  if (!fs.existsSync(path.join(SERVER_DIR, ".env"))) missing.push("server/.env");
  if (!fs.existsSync(path.join(CLIENT_DIR, ".env"))) missing.push("client/.env");

  if (missing.length > 0) {
    console.error("\n❌ Not set up yet — missing: " + missing.join(", "));
    console.error("   Run \x1b[36mnpm run setup\x1b[0m first, then try again.\n");
    process.exit(1);
  }
}

function main() {
  checkReady();

  console.log("\n\x1b[32m🚀 Starting server + client dev servers…\x1b[0m\n");

  const server = prefixedSpawn("server", "34", "npm", ["run", "dev"], SERVER_DIR);
  const client = prefixedSpawn("client", "35", "npm", ["run", "dev"], CLIENT_DIR);

  let shuttingDown = false;
  function shutdown(code) {
    if (shuttingDown) return;
    shuttingDown = true;
    server.kill("SIGTERM");
    client.kill("SIGTERM");
    process.exit(code);
  }

  // If either dev server exits on its own (crash, config error), bring the
  // other down too rather than leaving one process orphaned and running.
  server.on("exit", (code) => shutdown(code ?? 1));
  client.on("exit", (code) => shutdown(code ?? 1));

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
}

main();
