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

const ratingSchema = z.object({
  movieId: z.number().int().positive(),
  score: z.number().int().min(1, "Score must be between 1 and 5").max(5, "Score must be between 1 and 5"),
  review: z.string().trim().max(2000, "Review must be 2000 characters or fewer").optional().nullable(),
});

const preferencesSchema = z.object({
  genres: z.array(z.number().int()).max(20, "Pick at most 20 genres").optional(),
  language: z.string().trim().min(2).max(10).optional(),
  adultContent: z.boolean().optional(),
  autoplayTrailers: z.boolean().optional(),
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

module.exports = { registerSchema, loginSchema, ratingSchema, preferencesSchema, validate };
