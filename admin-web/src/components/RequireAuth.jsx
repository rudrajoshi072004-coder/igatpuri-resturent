import { Navigate } from "react-router-dom";
import { getAdminToken } from "../auth/storage";

export default function RequireAuth({ children }) {
  const token = getAdminToken();
  if (!token) return <Navigate to="/admin-dashboard/login" replace />;
  return children;
}

