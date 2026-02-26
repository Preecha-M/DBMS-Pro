import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import StartupLoader from "../components/StartupLoader";

const RequireRole = ({ roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <StartupLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const hasRole = roles.map(r => String(r).toLowerCase()).includes(String(user.role).toLowerCase());
  if (roles.length > 0 && !hasRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireRole