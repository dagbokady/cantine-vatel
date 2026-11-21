import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ACCUEIL_ROLE } from "../utils/roles";

export default function RequireAuth({ children, roles = ["eleve"] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={roles.includes("eleve") ? "/login" : "/pro"} replace />;
  if (!roles.includes(user.role)) return <Navigate to={ACCUEIL_ROLE[user.role] || "/login"} replace />;
  return children;
}
