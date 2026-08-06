import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const User = require("../src/models/User");
const preferencesResolvers = require("../src/graphql/resolvers/preferences.resolvers");
const ApiError = require("../src/utils/ApiError");

const AUTH_CONTEXT = { user: { userId: "user123" } };

describe("preferences resolvers", () => {
  let originalFindById;
  let originalFindByIdAndUpdate;

  beforeEach(() => {
    originalFindById = User.findById;
    originalFindByIdAndUpdate = User.findByIdAndUpdate;
  });

  afterEach(() => {
    User.findById = originalFindById;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  });

  describe("Query.myPreferences", () => {
    it("throws unauthorized without a session", async () => {
      await expect(
        preferencesResolvers.Query.myPreferences(null, {}, { user: null })
      ).rejects.toThrow(ApiError);
    });

    it("returns the current user's preferences", async () => {
      const fakePrefs = { genres: [18, 35], language: "en", adultContent: false, autoplayTrailers: true };
      User.findById = vi.fn().mockResolvedValue({ preferences: fakePrefs });

      const result = await preferencesResolvers.Query.myPreferences(null, {}, AUTH_CONTEXT);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(result).toBe(fakePrefs);
    });
  });

  describe("Mutation.updatePreferences", () => {
    it("validates input before touching the database", async () => {
      User.findByIdAndUpdate = vi.fn();

      await expect(
        preferencesResolvers.Mutation.updatePreferences(
          null,
          { input: { genres: Array(25).fill(1) } }, // exceeds max 20
          AUTH_CONTEXT
        )
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("only $sets the fields provided, using dot-notation on the preferences subdocument", async () => {
      User.findByIdAndUpdate = vi.fn().mockResolvedValue({
        preferences: { genres: [18], language: "en", adultContent: true, autoplayTrailers: true },
      });

      await preferencesResolvers.Mutation.updatePreferences(
        null,
        { input: { adultContent: true } },
        AUTH_CONTEXT
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { $set: { "preferences.adultContent": true } },
        { new: true }
      );
    });

    it("sets multiple provided fields together in one update", async () => {
      User.findByIdAndUpdate = vi.fn().mockResolvedValue({
        preferences: { genres: [18, 35], language: "fr", adultContent: false, autoplayTrailers: true },
      });

      await preferencesResolvers.Mutation.updatePreferences(
        null,
        { input: { genres: [18, 35], language: "fr" } },
        AUTH_CONTEXT
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { $set: { "preferences.genres": [18, 35], "preferences.language": "fr" } },
        { new: true }
      );
    });
  });
});
