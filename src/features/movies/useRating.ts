import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";
import { useAuthStore } from "@/store/authStore";

export function useMyRating(movieId: number) {
  const isLoggedIn = useAuthStore((s) => Boolean(s.accessToken));

  return useQuery({
    queryKey: ["rating", movieId],
    queryFn: async () => (await sdk.MyRating({ movieId })).rating,
    enabled: isLoggedIn, // no point asking for "my rating" when logged out
  });
}

export function useUpsertRating(movieId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { score: number; review?: string }) =>
      sdk.UpsertRating({ movieId, score: vars.score, review: vars.review }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rating", movieId] });
      queryClient.invalidateQueries({ queryKey: ["movie", movieId] }); // avgRating/ratingCount changed
      queryClient.invalidateQueries({ queryKey: ["myRatings"] });
    },
  });
}

export function useDeleteRating(movieId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sdk.DeleteRating({ movieId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rating", movieId] });
      queryClient.invalidateQueries({ queryKey: ["movie", movieId] });
      queryClient.invalidateQueries({ queryKey: ["myRatings"] });
    },
  });
}
