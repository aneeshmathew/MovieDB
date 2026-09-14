import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  // True once we've attempted the initial silent refresh on app load, so
  // ProtectedRoute knows whether "no user yet" means "still checking" or
  // "actually logged out".
  hasCheckedSession: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  setHasCheckedSession: (value: boolean) => void;
}

// Access token lives in memory only — never localStorage/sessionStorage, so
// it can't be read by an XSS payload that persists across reloads. This
// does mean a hard refresh always re-runs the silent refresh-token flow
// (see lib/graphqlClient.ts) to get a new access token from the httpOnly
// refresh cookie.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hasCheckedSession: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHasCheckedSession: (value) => set({ hasCheckedSession: value }),
}));
