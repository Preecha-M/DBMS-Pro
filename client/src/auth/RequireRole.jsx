import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

const RequireRole = ({ roles = [] }) => {
  const { user } = useAuth();

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireRole