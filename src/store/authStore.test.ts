import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, hasCheckedSession: false });
  });

  it("starts logged out with session not yet checked", () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.hasCheckedSession).toBe(false);
  });

  it("setSession stores the token and user together", () => {
    const user = { id: "1", name: "Ada", email: "ada@example.com", avatar: null };
    useAuthStore.getState().setSession("token123", user);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("token123");
    expect(state.user).toEqual(user);
  });

  it("clearSession wipes both token and user, independent of hasCheckedSession", () => {
    const user = { id: "1", name: "Ada", email: "ada@example.com", avatar: null };
    useAuthStore.getState().setSession("token123", user);
    useAuthStore.getState().setHasCheckedSession(true);

    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.hasCheckedSession).toBe(true); // untouched by clearSession
  });
});
