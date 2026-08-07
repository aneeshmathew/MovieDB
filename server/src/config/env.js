require("dotenv").config();
const { z } = require("zod");

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url(),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET should be a long random string"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET should be a long random string"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  // TMDB v4 read access token (Bearer), NOT the v3 api_key — sent as an
  // Authorization header rather than a URL query param.
  TMDB_ACCESS_TOKEN: z.string().optional().default(""),
  // Optional override for where to find the built frontend's static files.
  // Defaults (in app.js) to a sibling "client/dist" next to this server's
  // parent directory if unset. Only relevant when serving the SPA from
  // this same Express app rather than a separate static host.
  CLIENT_DIST_PATH: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
