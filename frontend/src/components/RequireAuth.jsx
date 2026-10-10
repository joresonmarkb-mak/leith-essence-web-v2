import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-8 text-muted">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}