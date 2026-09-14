import { GraphQLClient } from "graphql-request";
import { getSdk, RefreshDocument, type RefreshMutation } from "@/graphql/generated";
import { useAuthStore } from "@/store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// credentials: "include" is what actually sends the httpOnly refresh
// cookie to the backend — without it, /graphql requests never carry the
// cookie and refresh() will always fail with NO_REFRESH_TOKEN.
const client = new GraphQLClient(`${API_URL}/graphql`, {
  credentials: "include",
});

// Shared across all callers: if five requests 401 at the same moment, they
// all await this one promise instead of each independently hitting
// /graphql's refresh mutation. Cleared once the refresh settles (success
// or failure) so the next 401 after that starts a fresh attempt.
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  try {
    // Raw client.request, NOT sdk.Refresh() — going through the SDK would
    // route back through withAuthRetry below and could recurse.
    const data = await client.request<RefreshMutation>(RefreshDocument);
    useAuthStore.getState().setSession(data.refresh.accessToken, data.refresh.user);
    return data.refresh.accessToken;
  } catch {
    // Refresh cookie is missing/expired/revoked — there is no session to
    // recover. Clear whatever stale state we had; the caller's original
    // error will still propagate so the UI can redirect to /login.
    useAuthStore.getState().clearSession();
    return null;
  }
}

// Wraps every SDK call: injects the current access token as a header, and
// on an UNAUTHENTICATED error, refreshes once and retries the original
// request exactly once with the new token. A second failure after that is
// treated as a real error, not retried again — an infinitely-retrying
// client on a permanently-broken token would just hammer the server.
async function withAuthRetry<T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>
): Promise<T> {
  const authHeader = (): Record<string, string> => {
    const token = useAuthStore.getState().accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  try {
    return await action(authHeader());
  } catch (err) {
    if (!isUnauthenticatedError(err)) throw err;

    refreshPromise ??= performRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;

    if (!newToken) throw err; // refresh failed too — surface the original error

    return action({ Authorization: `Bearer ${newToken}` });
  }
}

function isUnauthenticatedError(err: unknown): boolean {
  const graphqlErrors = (err as { response?: { errors?: Array<{ extensions?: { code?: string } }> } })
    ?.response?.errors;
  return graphqlErrors?.some((e) => e.extensions?.code === "UNAUTHENTICATED") ?? false;
}

export const sdk = getSdk(client, (action, _operationName, _operationType, _variables) =>
  withAuthRetry(action)
);
