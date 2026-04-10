import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Enums } from "@/integrations/supabase/types";

interface Props {
  children: React.ReactNode;
  requiredRole?: Enums<"app_role">;
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/campaigns" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
