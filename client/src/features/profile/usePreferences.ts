import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import type { UpdatePreferencesMutationVariables } from "@/graphql/generated";

export function useMyPreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: async () => (await sdk.MyPreferences()).myPreferences,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePreferencesMutationVariables["input"]) =>
      sdk.UpdatePreferences({ input }).then((r) => r.updatePreferences),
    onSuccess: (preferences) => {
      queryClient.setQueryData(["preferences"], preferences);
      // Dashboard personalization reads preferences.genres server-side —
      // refetch so a genre change is reflected without a manual reload.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
