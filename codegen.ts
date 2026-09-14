import type { CodegenConfig } from "@graphql-codegen/cli";

// The backend now lives in its own repo (moviedb-server), so there's no
// sibling server/schema.graphql to copy locally anymore (that copy step
// used to live in the monorepo's scripts/setup.js). Instead, codegen
// introspects the schema straight from a running server's /graphql
// endpoint. Override with CODEGEN_SCHEMA_URL to point at a deployed
// backend (or a teammate's tunnel) instead of localhost — e.g.:
//   CODEGEN_SCHEMA_URL=https://moviedb-server.example.com/graphql npm run codegen
const schemaUrl =
  process.env.CODEGEN_SCHEMA_URL ??
  `${process.env.VITE_API_URL ?? "http://localhost:4000"}/graphql`;

const config: CodegenConfig = {
  schema: schemaUrl,
  documents: ["src/graphql/operations/**/*.graphql"],
  generates: {
    "src/graphql/generated.ts": {
      // Deliberately NOT using the "typescript" plugin here: combined with
      // "typescript-operations" in one output file, it causes a genuine
      // duplicate-identifier collision — "typescript-operations" emits its
      // own self-contained copies of every input type referenced by a
      // variable (LoginInput, RegisterInput, PreferencesInput) using plain
      // primitives, completely independent of "typescript"'s Scalars-based
      // versions of the same types. Since nothing in this app imports the
      // base schema-wide types directly (only operation-specific selection
      // types and the generated SDK), dropping "typescript" avoids the
      // collision without losing anything we actually use.
      plugins: ["typescript-operations", "typescript-graphql-request"],
      config: {
        skipTypename: true,
      },
    },
  },
};

export default config;
