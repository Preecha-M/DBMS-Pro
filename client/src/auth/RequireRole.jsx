import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

const RequireRole = ({ roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireRole