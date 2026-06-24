import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Enums } from "@/integrations/supabase/types";

interface Props {
  children: React.ReactNode;
  requiredRole?: Enums<"app_role"> | "admin_or_moderator";
  /** if true, bypass the "must be approved" gate (e.g. for the pending-approval page itself) */
  allowUnapproved?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, allowUnapproved }: Props) => {
  const { user, loading, roles, profile, isApproved, isAdmin, isModerator } = useAuth();

  // Wait for both roles and profile to hydrate before deciding redirects
  const hydrating = loading || (!!user && roles.length === 0 && profile === null);

  if (hydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole === "admin_or_moderator") {
    if (!isAdmin && !isModerator) return <Navigate to="/campaigns" replace />;
  } else if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/campaigns" replace />;
  }

  if (!allowUnapproved && !isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
