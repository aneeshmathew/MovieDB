import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.graphql",
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
