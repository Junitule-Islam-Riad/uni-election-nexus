import { motion } from "framer-motion";
import { Clock, ShieldCheck, LogOut, RefreshCcw } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { facultyLabel } from "@/lib/faculties";

const PendingApproval = () => {
  const { profile, signOut, refreshProfile } = useAuth();

  const status = profile?.approval_status ?? "pending";

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 grid-bg relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(152,52%,7%)_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-lg glass-card rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mx-auto flex items-center justify-center mb-5">
            {status === "rejected" ? (
              <ShieldCheck className="w-8 h-8 text-destructive" />
            ) : (
              <Clock className="w-8 h-8 text-primary animate-pulse" />
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {status === "rejected" ? "Account not approved" : "Awaiting admin approval"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {status === "rejected"
              ? "Your registration was rejected. Please contact the admin office for assistance."
              : "Your student profile has been submitted. An admin or moderator will review it shortly."}
          </p>

          {profile && (
            <div className="text-left bg-secondary/40 rounded-xl p-4 mb-6 text-sm space-y-1.5 border border-border">
              <div><span className="text-muted-foreground">Name:</span> {profile.display_name ?? "—"}</div>
              <div><span className="text-muted-foreground">Student ID:</span> {profile.student_id ?? "—"}</div>
              <div><span className="text-muted-foreground">Faculty:</span> {facultyLabel(profile.faculty)}</div>
              <div><span className="text-muted-foreground">Department:</span> {profile.department ?? "—"}</div>
              <div><span className="text-muted-foreground">Batch:</span> {profile.batch ?? "—"}</div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={refreshProfile}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:shadow-neon-sm transition-all"
            >
              <RefreshCcw className="w-4 h-4" /> Check status
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PendingApproval;
