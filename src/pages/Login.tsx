import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Vote, ArrowRight, UserPlus, User, Hash, Phone, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { FACULTY_LIST, FACULTIES, type FacultyKey } from "@/lib/faculties";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Student profile fields
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState<FacultyKey | "">("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [phone, setPhone] = useState("");

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/campaigns", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && (!fullName || !studentId || !faculty || !department || !batch)) {
      toast({ title: "Missing info", description: "Please complete your student profile.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error } = isSignUp
      ? await signUp(email, password, {
          full_name: fullName,
          faculty,
          department,
          batch,
          student_id: studentId,
          phone,
        })
      : await signIn(email, password);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (isSignUp) {
      toast({
        title: "Account created",
        description: "Your profile is pending admin approval. You'll be notified once approved.",
      });
      setIsSignUp(false);
    } else {
      navigate("/campaigns");
    }
    setLoading(false);
  };

  const facultyMeta = faculty ? FACULTIES[faculty] : null;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-10 grid-bg relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(152,52%,7%)_70%)]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Vote className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to UniVote</h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? "Create your PCIU student account" : "Sign in with your university email"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
            {isSignUp && (
              <>
                <Field label="Full Name" icon={User}>
                  <input
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe" required
                    className={inputCls}
                  />
                </Field>
                <Field label="Student ID" icon={Hash}>
                  <input
                    value={studentId} onChange={(e) => setStudentId(e.target.value)}
                    placeholder="PCIU-2021-001" required
                    className={inputCls}
                  />
                </Field>
                <div>
                  <label className={labelCls}>Faculty</label>
                  <select
                    value={faculty}
                    onChange={(e) => { setFaculty(e.target.value as FacultyKey); setDepartment(""); }}
                    required
                    className={selectCls}
                  >
                    <option value="">Select faculty</option>
                    {FACULTY_LIST.map((f) => (
                      <option key={f.key} value={f.key}>{f.short} — {f.name}</option>
                    ))}
                  </select>
                </div>
                {facultyMeta && (
                  <div>
                    <label className={labelCls}>Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} required className={selectCls}>
                      <option value="">Select department</option>
                      {facultyMeta.departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
                <Field label="Batch / Year" icon={GraduationCap}>
                  <input
                    value={batch} onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. 2023" required className={inputCls}
                  />
                </Field>
                <Field label="Phone (optional)" icon={Phone}>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880..." className={inputCls} />
                </Field>
              </>
            )}

            <Field label="University Email" icon={Mail}>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pciu.edu" required className={inputCls}
              />
            </Field>

            <Field label="Password" icon={Lock}>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} className={inputCls}
              />
            </Field>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm neon-glow hover:shadow-neon-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : isSignUp ? (
                <><UserPlus className="w-4 h-4" /> Create Student Account</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {!isSignUp && (
              <a href="/forgot-password" className="block w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors">
                Forgot password?
              </a>
            )}
            <button
              type="button" onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "New student? Register here"}
            </button>

            {isSignUp && (
              <p className="text-[11px] text-muted-foreground/80 text-center pt-1">
                New accounts require admin approval before accessing campaigns.
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

const inputCls =
  "w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";
const selectCls =
  "w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none";
const labelCls = "text-sm font-medium text-muted-foreground mb-1.5 block";

const Field = ({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      {children}
    </div>
  </div>
);

export default Login;
