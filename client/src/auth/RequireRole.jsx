import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import { hasAnyRole } from "./roleUtils";
import StartupLoader from "../components/StartupLoader";

const RequireRole = ({ roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <StartupLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (roles.length > 0 && !hasAnyRole(user, roles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireRole