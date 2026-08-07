import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import { useAuthStore } from "@/store/authStore";
import { useListsStore } from "@/store/listsStore";

// Runs once on app mount: attempts a silent refresh using the httpOnly
// refresh cookie (if one exists) to restore a session after a hard reload,
// since the access token itself only ever lives in memory. A failure here
// is expected and silent for a logged-out visitor — not an error state.
export function useSessionBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const setHasCheckedSession = useAuthStore((s) => s.setHasCheckedSession);
  const setWatchlistIds = useListsStore((s) => s.setWatchlistIds);
  const setFavoriteIds = useListsStore((s) => s.setFavoriteIds);

  return useQuery({
    queryKey: ["session-bootstrap"],
    queryFn: async () => {
      try {
        const { refresh } = await sdk.Refresh();
        setSession(refresh.accessToken, refresh.user);

        const { me } = await sdk.Me();
        if (me) {
          setWatchlistIds(me.watchlist.map((w) => w.movieId));
          setFavoriteIds(me.favorites.map((f) => f.movieId));
        }
        return refresh.user;
      } catch {
        // No valid refresh cookie — a normal, expected state for a visitor
        // who isn't logged in. Nothing to surface as an error.
        return null;
      } finally {
        setHasCheckedSession(true);
      }
    },
    retry: false,
    staleTime: Infinity,
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const setWatchlistIds = useListsStore((s) => s.setWatchlistIds);
  const setFavoriteIds = useListsStore((s) => s.setFavoriteIds);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; password: string }) => sdk.Login({ input }),
    onSuccess: (data) => {
      setSession(data.login.accessToken, data.login.user);
      setWatchlistIds(data.login.user.watchlist.map((w) => w.movieId));
      setFavoriteIds(data.login.user.favorites.map((f) => f.movieId));
      // Dashboard may already be cached from a logged-out view — invalidate
      // so it refetches and picks up genre-based personalization now that
      // there's a user to personalize for.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) =>
      sdk.Register({ input }),
    onSuccess: (data) => {
      setSession(data.register.accessToken, data.register.user);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearLists = useListsStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sdk.Logout(),
    onSettled: () => {
      // Clear local state even if the network call itself failed — the
      // person clicked "log out," so the UI should reflect that regardless.
      clearSession();
      clearLists();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
