import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const hasCheckedSession = useAuthStore((s) => s.hasCheckedSession);
  const location = useLocation();

  // Session bootstrap (silent refresh) hasn't resolved yet — render nothing
  // rather than redirecting, since a logged-in user refreshing the page
  // would otherwise be bounced to /login for a split second before their
  // session loads.
  if (!hasCheckedSession) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
