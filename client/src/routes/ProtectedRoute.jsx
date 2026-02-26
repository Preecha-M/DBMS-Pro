import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import StartupLoader from "../components/StartupLoader";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <StartupLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
