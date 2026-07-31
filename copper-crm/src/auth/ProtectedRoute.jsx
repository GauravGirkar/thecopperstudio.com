
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function ProtectedRoute({ role }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && auth.user?.role !== role) {
    const target = auth.user?.role === "superadmin" ? "/admin" : auth.user?.role === "developer" ? "/developer" : "/client";
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
