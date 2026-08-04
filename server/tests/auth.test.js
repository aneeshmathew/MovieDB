import { describe, it, expect } from "vitest";
const { registerSchema, loginSchema, validate } = require("../src/middleware/validate");
const ApiError = require("../src/utils/ApiError");

describe("validation schemas", () => {
  it("accepts a valid register input", () => {
    const data = validate(registerSchema, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret123",
    });
    expect(data.email).toBe("ada@example.com");
  });

  it("rejects a short password", () => {
    expect(() =>
      validate(registerSchema, { name: "Ada", email: "ada@example.com", password: "short" })
    ).toThrow(ApiError);
  });

  it("rejects an invalid email on login", () => {
    expect(() => validate(loginSchema, { email: "not-an-email", password: "x" })).toThrow(ApiError);
  });
});
