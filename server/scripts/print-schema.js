// Prints the merged GraphQL SDL to a file — used to give the frontend's
// GraphQL Codegen a schema to generate types against without needing a
// live server + database connection running during the client build.
// Re-run this (`npm run schema:print`) whenever the server schema changes.
const fs = require("fs");
const path = require("path");
const { buildASTSchema, printSchema } = require("graphql");
const { typeDefs } = require("../src/graphql/schema");

const schema = buildASTSchema(typeDefs);
const outPath = process.argv[2] || path.join(__dirname, "../schema.graphql");

fs.writeFileSync(outPath, printSchema(schema));
console.log(`Schema written to ${outPath}`);
