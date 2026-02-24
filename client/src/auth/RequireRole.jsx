import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

const RequireRole = ({ roles = [] }) => {
  const { user } = useAuth();

  const hasRole = roles.map(r => String(r).toLowerCase()).includes(String(user.role).toLowerCase());
  if (roles.length > 0 && !hasRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireRole