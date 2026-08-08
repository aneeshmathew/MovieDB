import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://placeholder/moviedb";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-please-change-1234567890";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-please-change-0987654321";

const User = require("../src/models/User");
const profileResolvers = require("../src/graphql/resolvers/profile.resolvers");
const ApiError = require("../src/utils/ApiError");

const AUTH_CONTEXT = { user: { userId: "user123" } };

function fakeUser(overrides = {}) {
  return {
    _id: "user123",
    email: "old@example.com",
    comparePassword: vi.fn().mockResolvedValue(true),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("profile resolvers", () => {
  let originalFindByIdAndUpdate;
  let originalFindById;
  let originalFindOne;
  let originalHashPassword;

  beforeEach(() => {
    originalFindByIdAndUpdate = User.findByIdAndUpdate;
    originalFindById = User.findById;
    originalFindOne = User.findOne;
    originalHashPassword = User.hashPassword;
  });

  afterEach(() => {
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
    User.findById = originalFindById;
    User.findOne = originalFindOne;
    User.hashPassword = originalHashPassword;
  });

  describe("Mutation.updateProfile", () => {
    it("throws unauthorized without a session", async () => {
      await expect(
        profileResolvers.Mutation.updateProfile(null, { input: { name: "Ada" } }, { user: null })
      ).rejects.toThrow(ApiError);
    });

    it("validates input before touching the database", async () => {
      User.findByIdAndUpdate = vi.fn();
      await expect(
        profileResolvers.Mutation.updateProfile(null, { input: { name: "" } }, AUTH_CONTEXT)
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("only $sets fields actually provided", async () => {
      User.findByIdAndUpdate = vi.fn().mockResolvedValue({ name: "Ada" });
      await profileResolvers.Mutation.updateProfile(null, { input: { name: "Ada" } }, AUTH_CONTEXT);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { $set: { name: "Ada" } },
        { new: true }
      );
    });
  });

  describe("Mutation.changeEmail", () => {
    it("rejects an incorrect password without changing anything", async () => {
      const user = fakeUser({ comparePassword: vi.fn().mockResolvedValue(false) });
      User.findById = vi.fn().mockReturnValue({ select: () => Promise.resolve(user) });

      await expect(
        profileResolvers.Mutation.changeEmail(
          null,
          { newEmail: "new@example.com", password: "wrong" },
          AUTH_CONTEXT
        )
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });

      expect(user.save).not.toHaveBeenCalled();
    });

    it("rejects when the new email already belongs to a different account", async () => {
      const user = fakeUser();
      User.findById = vi.fn().mockReturnValue({ select: () => Promise.resolve(user) });
      User.findOne = vi.fn().mockResolvedValue({ _id: { toString: () => "someone-else" } });

      await expect(
        profileResolvers.Mutation.changeEmail(
          null,
          { newEmail: "taken@example.com", password: "correct" },
          AUTH_CONTEXT
        )
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("updates the email and saves when the password is correct and email is free", async () => {
      const user = fakeUser();
      User.findById = vi.fn().mockReturnValue({ select: () => Promise.resolve(user) });
      User.findOne = vi.fn().mockResolvedValue(null);

      const result = await profileResolvers.Mutation.changeEmail(
        null,
        { newEmail: "new@example.com", password: "correct" },
        AUTH_CONTEXT
      );

      expect(user.email).toBe("new@example.com");
      expect(user.save).toHaveBeenCalled();
      expect(result).toBe(user);
    });

    it("allows keeping your own current email unchanged (matches your own id)", async () => {
      const user = fakeUser({ email: "same@example.com" });
      User.findById = vi.fn().mockReturnValue({ select: () => Promise.resolve(user) });
      User.findOne = vi.fn().mockResolvedValue({ _id: { toString: () => "user123" } });

      await expect(
        profileResolvers.Mutation.changeEmail(
          null,
          { newEmail: "same@example.com", password: "correct" },
          AUTH_CONTEXT
        )
      ).resolves.toBe(user);
    });
  });

  describe("Mutation.changePassword", () => {
    it("rejects an incorrect current password", async () => {
      const user = fakeUser({ comparePassword: vi.fn().mockResolvedValue(false) });
      User.findById = vi.fn().mockReturnValue({ select: () => Promise.resolve(user) });

      await expect(
        profileResolvers.Mutation.changePassword(
          null,
          { currentPassword: "wrong", newPassword: "newpassword123" },
          AUTH_CONTEXT
        )
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    });

    it("validates the new password length before touching the database", async () => {
      User.findById = vi.fn();
      await expect(
        profileResolvers.Mutation.changePassword(
          null,
          { currentPassword: "correct", newPassword: "short" },
          AUTH_CONTEXT
        )
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
      expect(User.findById).not.toHaveBeenCalled();
    });

    it("hashes the new password, bumps refreshTokenVersion, and saves", async () => {
      const user = fakeUser({ refreshTokenVersion: 0 });
      User.findById = vi.fn().mockReturnValue({ select: () => Promise.resolve(user) });
      User.hashPassword = vi.fn().mockResolvedValue("hashed-new-password");

      const result = await profileResolvers.Mutation.changePassword(
        null,
        { currentPassword: "correct", newPassword: "newpassword123" },
        AUTH_CONTEXT
      );

      expect(user.passwordHash).toBe("hashed-new-password");
      expect(user.refreshTokenVersion).toBe(1);
      expect(user.save).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
