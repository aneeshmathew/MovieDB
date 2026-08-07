import { QueryClient } from "@tanstack/react-query";

function isUnauthenticatedError(error: unknown): boolean {
  const graphqlErrors = (error as { response?: { errors?: Array<{ extensions?: { code?: string } }> } })
    ?.response?.errors;
  return graphqlErrors?.some((e) => e.extensions?.code === "UNAUTHENTICATED") ?? false;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry with a token already known to be stale — graphqlClient's
      // withAuthRetry already refreshes and retries once at the transport
      // level. Retrying here on top of that would mean a second, redundant
      // refresh attempt racing the first. Other transient errors still get
      // TanStack Query's normal retry behavior (default: up to 3 times).
      retry: (failureCount, error) => !isUnauthenticatedError(error) && failureCount < 2,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
