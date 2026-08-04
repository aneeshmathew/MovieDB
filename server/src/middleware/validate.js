const { z } = require("zod");
const ApiError = require("../utils/ApiError");

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// Parses `input` against `schema`; throws a 400 ApiError with per-field
// messages attached as `.details` so resolvers don't each write their own try/catch.
function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    const error = ApiError.badRequest("Validation failed", "VALIDATION_ERROR");
    error.details = details;
    throw error;
  }
  return result.data;
}

module.exports = { registerSchema, loginSchema, validate };
