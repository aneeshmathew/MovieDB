import { useMutation, useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import { useAuthStore } from "@/store/authStore";

export function useUpdateProfile() {
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: (input: { name?: string; avatar?: string }) => sdk.UpdateProfile({ input }),
    onSuccess: (data) => {
      // Keep the in-memory user snapshot in sync with what the server saved
      // (e.g. Navbar shows the updated name immediately, no refetch needed).
      if (accessToken) setSession(accessToken, data.updateProfile);
    },
  });
}

export function useChangeEmail() {
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: (vars: { newEmail: string; password: string }) => sdk.ChangeEmail(vars),
    onSuccess: (data) => {
      if (accessToken && user) {
        setSession(accessToken, { ...user, email: data.changeEmail.email });
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (vars: { currentPassword: string; newPassword: string }) =>
      sdk.ChangePassword(vars),
  });
}

export function useMyRatings() {
  return useQuery({
    queryKey: ["myRatings"],
    queryFn: async () => (await sdk.MyRatings()).myRatings,
  });
}
