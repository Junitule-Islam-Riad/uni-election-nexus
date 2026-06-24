import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;

export interface StudentSignupMeta {
  full_name: string;
  faculty: string;
  department: string;
  batch: string;
  student_id: string;
  phone?: string;
}

export interface ProfileSummary {
  user_id: string;
  email: string | null;
  display_name: string | null;
  faculty: string | null;
  department: string | null;
  batch: string | null;
  student_id: string | null;
  approval_status: "pending" | "approved" | "rejected";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  profile: ProfileSummary | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isStudent: boolean;
  isApproved: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, meta?: StudentSignupMeta) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    setRoles((data?.map((r) => r.role as AppRole)) ?? []);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id,email,display_name,faculty,department,batch,student_id,approval_status")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile((data as ProfileSummary | null) ?? null);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchRoles(session.user.id);
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setRoles([]);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchRoles, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, meta?: StudentSignupMeta) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/campaigns`,
        data: meta
          ? {
              full_name: meta.full_name,
              faculty: meta.faculty,
              department: meta.department,
              batch: meta.batch,
              student_id: meta.student_id,
              phone: meta.phone ?? "",
            }
          : undefined,
      },
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };

  return (
    <AuthContext.Provider
      value={{
        user, session, roles, profile, loading,
        isAdmin: roles.includes("admin" as AppRole),
        isModerator: roles.includes("moderator" as AppRole),
        isStudent: roles.includes("student" as AppRole) || roles.includes("voter" as AppRole),
        isApproved:
          roles.includes("admin" as AppRole) ||
          roles.includes("moderator" as AppRole) ||
          profile?.approval_status === "approved",
        refreshProfile,
        signIn, signUp, resetPassword, updatePassword, signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
