import { describe, it, expect, beforeAll } from "vitest";
const request = require("supertest");

// Env must be set before requiring anything that loads config/env.js
process.env.PORT = process.env.PORT || "4000";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const createApp = require("../src/app");

describe("app", () => {
  let app;

  beforeAll(async () => {
    app = await createApp();
  });

  it("responds on /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("exposes the expected mutations via introspection", async () => {
    const res = await request(app)
      .post("/graphql")
      .send({ query: "{ __schema { mutationType { fields { name } } } }" });

    const names = res.body.data.__schema.mutationType.fields.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(["register", "login", "refresh", "logout"]));
  });

  it("rejects invalid register input before touching the database", async () => {
    const res = await request(app)
      .post("/graphql")
      .send({
        query:
          "mutation Register($input: RegisterInput!) { register(input: $input) { accessToken } }",
        variables: { input: { name: "", email: "not-an-email", password: "short" } },
      });

    expect(res.body.errors[0].extensions.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors[0].extensions.details).toHaveProperty("email");
    expect(res.body.errors[0].extensions.details).toHaveProperty("password");
  });
});
