import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";

function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Wait until the backend session check finishes.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-fg-muted">Checking your session...</p>
      </div>
    );
  }

  // Redirect users who are not logged in.
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Customer portal is only for customer accounts.
  if (user.role !== "Customer" || !user.customer_id) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;