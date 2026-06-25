import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Users, BarChart3, CheckCircle, XCircle, Link as LinkIcon,
  Trash2, MessageSquare, GraduationCap, ShieldPlus,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { FACULTY_LIST, FACULTIES, facultyLabel, type FacultyKey } from "@/lib/faculties";

type Campaign = Tables<"campaigns"> & {
  faculty?: string | null; department?: string | null; election_type?: string | null;
};
type CandidateRow = Tables<"candidates">;
type Profile = Tables<"profiles"> & {
  faculty?: string | null;
  department?: string | null;
  batch?: string | null;
  student_id?: string | null;
  approval_status?: "pending" | "approved" | "rejected";
};

type ModAssignment = { id: string; user_id: string; faculty: string; invited_email: string | null; created_at: string };

const AdminDashboard = () => {
  const { user, isAdmin, isModerator } = useAuth();
  const [tab, setTab] = useState<"campaigns" | "approvals" | "students" | "voters" | "community" | "moderators">("campaigns");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pendingCandidates, setPendingCandidates] = useState<CandidateRow[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Profile[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Profile[]>([]);
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [whitelistedEmails, setWhitelistedEmails] = useState<{ id: string; email: string; campaign_id: string }[]>([]);

  // Moderators
  const [moderators, setModerators] = useState<(ModAssignment & { display_name?: string | null; email?: string | null })[]>([]);
  const [modEmail, setModEmail] = useState("");
  const [modFaculty, setModFaculty] = useState<FacultyKey | "">("");

  // Create campaign wizard
  const [createStep, setCreateStep] = useState<"closed" | "faculty" | "form">("closed");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newFaculty, setNewFaculty] = useState<FacultyKey | "">("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newElectionType, setNewElectionType] = useState("");
  const [newExtra, setNewExtra] = useState("");

  const loadCampaigns = async () => {
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) ?? []);
    if (data?.length && !selectedCampaignId) setSelectedCampaignId(data[0].id);
  };

  const loadPending = async () => {
    const { data } = await supabase.from("candidates").select("*").eq("status", "pending");
    setPendingCandidates(data ?? []);
  };

  const loadPendingStudents = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("approval_status" as never, "pending" as never);
    setPendingStudents((data as Profile[]) ?? []);
  };

  const loadPendingMembers = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("community_status", "pending");
    setPendingMembers((data as Profile[]) ?? []);
  };

  const loadWhitelist = async () => {
    if (!selectedCampaignId) return;
    const { data } = await supabase.from("voter_whitelist").select("*").eq("campaign_id", selectedCampaignId);
    setWhitelistedEmails(data ?? []);
  };

  const loadModerators = async () => {
    const { data } = await supabase
      .from("moderator_assignments" as never)
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data as ModAssignment[]) ?? [];
    if (list.length) {
      const ids = list.map((m) => m.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,display_name,email")
        .in("user_id", ids);
      const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));
      setModerators(
        list.map((m) => ({
          ...m,
          display_name: profMap.get(m.user_id)?.display_name ?? null,
          email: profMap.get(m.user_id)?.email ?? m.invited_email ?? null,
        })),
      );
    } else setModerators([]);
  };

  useEffect(() => {
    loadCampaigns();
    loadPending();
    loadPendingStudents();
    loadPendingMembers();
    loadModerators();
  }, []);
  useEffect(() => { loadWhitelist(); }, [selectedCampaignId]);

  const approveStudent = async (userId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: status, approved_by: user?.id, approved_at: new Date().toISOString() } as never)
      .eq("user_id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      loadPendingStudents();
      toast({ title: `Student ${status}` });
    }
  };

  const setMemberStatus = async (userId: string, status: "approved" | "rejected") => {
    await supabase.from("profiles").update({ community_status: status } as never).eq("user_id", userId);
    loadPendingMembers();
    toast({ title: `Member ${status}` });
  };

  const createCampaign = async () => {
    if (!newTitle || !newStart || !newEnd || !newFaculty || !user) {
      toast({ title: "Missing info", description: "Title, faculty, start & end are required.", variant: "destructive" });
      return;
    }
    const meta = newFaculty ? FACULTIES[newFaculty] : null;
    const extraSuffix = newExtra && meta ? ` · ${meta.extraField.label}: ${newExtra}` : "";
    const { error } = await supabase.from("campaigns").insert({
      title: newTitle,
      description: (newDesc || "") + extraSuffix || null,
      start_time: new Date(newStart).toISOString(),
      end_time: new Date(newEnd).toISOString(),
      created_by: user.id,
      faculty: newFaculty,
      department: newDepartment || null,
      election_type: newElectionType || null,
    } as never);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Campaign created!" });
      setCreateStep("closed");
      setNewTitle(""); setNewDesc(""); setNewStart(""); setNewEnd("");
      setNewFaculty(""); setNewDepartment(""); setNewElectionType(""); setNewExtra("");
      loadCampaigns();
    }
  };

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else loadCampaigns();
  };

  const approveCandidate = async (id: string) => {
    await supabase.from("candidates").update({ status: "approved" }).eq("id", id);
    loadPending();
    toast({ title: "Candidate approved" });
  };
  const rejectCandidate = async (id: string) => {
    await supabase.from("candidates").update({ status: "rejected" }).eq("id", id);
    loadPending();
    toast({ title: "Candidate rejected" });
  };

  const addWhitelist = async () => {
    if (!whitelistEmail || !selectedCampaignId) return;
    const { error } = await supabase.from("voter_whitelist").insert({
      campaign_id: selectedCampaignId, email: whitelistEmail,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setWhitelistEmail(""); loadWhitelist(); }
  };
  const removeWhitelist = async (id: string) => {
    await supabase.from("voter_whitelist").delete().eq("id", id);
    loadWhitelist();
  };

  const assignModerator = async () => {
    if (!modEmail || !modFaculty) {
      toast({ title: "Missing info", description: "Provide email and faculty.", variant: "destructive" });
      return;
    }
    // Lookup existing profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("email", modEmail)
      .maybeSingle();

    if (!prof?.user_id) {
      toast({
        title: "User not found",
        description: "That email has no account yet. Ask them to sign up first, then invite.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("moderator_assignments" as never).insert({
      user_id: prof.user_id, faculty: modFaculty, invited_email: modEmail, assigned_by: user?.id,
    } as never);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // Also grant moderator role (ignore conflict)
    await supabase.from("user_roles").insert({ user_id: prof.user_id, role: "moderator" as never });
    toast({ title: "Moderator assigned" });
    setModEmail(""); setModFaculty("");
    loadModerators();
  };

  const removeModerator = async (id: string, userId: string) => {
    await supabase.from("moderator_assignments" as never).delete().eq("id", id);
    // remove the moderator role only if no other assignments exist
    const { data: remaining } = await supabase
      .from("moderator_assignments" as never)
      .select("id")
      .eq("user_id", userId);
    if (!remaining || remaining.length === 0) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "moderator" as never);
    }
    loadModerators();
  };

  const tabs = useMemo(() => {
    const base: { key: typeof tab; label: string; icon: typeof BarChart3 }[] = [
      { key: "campaigns", label: "Campaigns", icon: BarChart3 },
      { key: "approvals", label: "Candidates", icon: CheckCircle },
      { key: "students", label: "Students", icon: GraduationCap },
      { key: "voters", label: "Voters", icon: Users },
      { key: "community", label: "Community", icon: MessageSquare },
    ];
    if (isAdmin) base.push({ key: "moderators", label: "Moderators", icon: ShieldPlus });
    return base;
  }, [isAdmin]);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="container max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{isAdmin ? "Admin Dashboard" : "Moderator Dashboard"}</h1>
            <p className="text-muted-foreground">
              Manage campaigns, approve students &amp; candidates, and moderate the community.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 glass-card rounded-xl p-1 w-fit flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Campaigns Tab */}
          {tab === "campaigns" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {createStep === "closed" && (
                <button
                  onClick={() => setCreateStep("faculty")}
                  className="glass-card rounded-xl p-4 w-full border-dashed border-2 border-border hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Campaign</span>
                </button>
              )}

              {createStep === "faculty" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Step 1 · Choose a Faculty</h3>
                      <p className="text-sm text-muted-foreground">Each faculty has its own designed form and election presets.</p>
                    </div>
                    <button onClick={() => setCreateStep("closed")} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {FACULTY_LIST.map((f, i) => (
                      <motion.button
                        key={f.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ y: -4 }}
                        onClick={() => {
                          setNewFaculty(f.key);
                          setNewDepartment("");
                          setNewElectionType("");
                          setNewExtra("");
                          setCreateStep("form");
                        }}
                        className={`relative overflow-hidden text-left rounded-2xl p-5 glass-card border ${f.borderClass} hover:${f.ringClass} hover:ring-2 transition-all group`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${f.gradientClass} opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                        <div className="relative">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.bgClass} ${f.accentClass} text-2xl mb-3`}>
                            {f.emoji}
                          </div>
                          <div className={`text-[10px] tracking-[0.2em] font-semibold ${f.accentClass} mb-1`}>{f.short}</div>
                          <h4 className="font-semibold leading-tight mb-1">{f.name}</h4>
                          <p className="text-xs text-muted-foreground mb-3">{f.tagline}</p>
                          <div className="flex flex-wrap gap-1">
                            {f.electionTypes.slice(0, 3).map((t) => (
                              <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full ${f.bgClass} ${f.accentClass} border ${f.borderClass}`}>
                                {t}
                              </span>
                            ))}
                          </div>
                          <div className={`mt-4 text-xs font-medium ${f.accentClass} flex items-center gap-1`}>
                            Configure campaign →
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {createStep === "form" && newFaculty && (() => {
                const meta = FACULTIES[newFaculty];
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative overflow-hidden glass-card rounded-2xl p-6 space-y-4 border ${meta.borderClass}`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${meta.gradientClass} pointer-events-none`} />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${meta.bgClass} ${meta.accentClass} text-2xl flex items-center justify-center`}>
                          {meta.emoji}
                        </div>
                        <div>
                          <div className={`text-[10px] tracking-[0.2em] font-semibold ${meta.accentClass}`}>STEP 2 · {meta.short}</div>
                          <h3 className="font-semibold">{meta.name}</h3>
                          <p className="text-xs text-muted-foreground">{meta.tagline}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCreateStep("faculty")}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        ← Change faculty
                      </button>
                    </div>

                    <div className="relative space-y-4">
                      <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={`Campaign Title (e.g. ${meta.electionTypes[0]} ${new Date().getFullYear()})`} className={inputCls} />
                      <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className={inputCls} />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                          <select value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} className={inputCls}>
                            <option value="">All departments</option>
                            {meta.departments.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Election Type</label>
                          <select value={newElectionType} onChange={(e) => setNewElectionType(e.target.value)} className={inputCls}>
                            <option value="">Select type</option>
                            {meta.electionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{meta.extraField.label}</label>
                        <div className="flex flex-wrap gap-2">
                          {meta.extraField.options.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => setNewExtra(opt)}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                newExtra === opt
                                  ? `${meta.bgClass} ${meta.accentClass} ${meta.borderClass}`
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                          <input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
                          <input type="datetime-local" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className={inputCls} />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button onClick={createCampaign} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:shadow-neon-sm transition-all">
                          Create {meta.short} Campaign
                        </button>
                        <button onClick={() => setCreateStep("closed")} className="px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}


              {campaigns.map((c) => (
                <div key={c.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{c.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {facultyLabel(c.faculty)}{c.department ? ` · ${c.department}` : ""}{c.election_type ? ` · ${c.election_type}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(c.start_time).toLocaleDateString()} — {new Date(c.end_time).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/campaign/${c.id}`); toast({ title: "Link copied!" }); }}
                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Approvals (Candidates) Tab */}
          {tab === "approvals" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {pendingCandidates.length === 0 ? (
                <Empty icon={CheckCircle} title="All caught up!" subtitle="No pending candidate approvals" />
              ) : (
                pendingCandidates.map((c) => (
                  <div key={c.id} className="glass-card rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm overflow-hidden">
                        {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" /> : c.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-semibold">{c.name}</h3>
                        <p className="text-sm text-muted-foreground">"{c.motto}"</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveCandidate(c.id)} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => rejectCandidate(c.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Students Tab */}
          {tab === "students" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-1">Student Sign-up Approvals</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verify each student profile before they gain access to UniVote.
                </p>
                {pendingStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending student registrations.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingStudents.map((p) => (
                      <div key={p.user_id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary/30">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{p.display_name ?? "Unnamed"}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {facultyLabel(p.faculty)} · {p.department ?? "—"} · Batch {p.batch ?? "—"} · ID {p.student_id ?? "—"}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <button onClick={() => approveStudent(p.user_id, "approved")} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => approveStudent(p.user_id, "rejected")} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Voters Tab */}
          {tab === "voters" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-3">Select Campaign</h3>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className={`${inputCls} mb-4`}
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>

                <h3 className="font-semibold mb-3">Whitelist Voter Email</h3>
                <div className="flex gap-3">
                  <input
                    type="email" value={whitelistEmail} onChange={(e) => setWhitelistEmail(e.target.value)}
                    placeholder="student@pciu.edu" className={`flex-1 ${inputCls}`}
                  />
                  <button onClick={addWhitelist} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:shadow-neon-sm transition-all">
                    Add
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-3">Whitelisted Voters ({whitelistedEmails.length})</h3>
                <div className="space-y-2">
                  {whitelistedEmails.map((w) => (
                    <div key={w.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                      <span className="text-sm">{w.email}</span>
                      <button onClick={() => removeWhitelist(w.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {whitelistedEmails.length === 0 && (
                    <p className="text-sm text-muted-foreground">No voters whitelisted for this campaign</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Community Tab */}
          {tab === "community" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-1">Community Member Approval</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Approve PCIU members so they can post in the Social Hub.
                </p>
                {pendingMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending community members.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingMembers.map((p) => (
                      <div key={p.user_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                        <div>
                          <div className="text-sm font-medium">{p.display_name ?? "Unnamed"}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setMemberStatus(p.user_id, "approved")} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setMemberStatus(p.user_id, "rejected")} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Admins and moderators can also delete any community post or comment directly from the
                <a href="/community" className="text-primary hover:underline ml-1">Social Hub</a>.
              </p>
            </motion.div>
          )}

          {/* Moderators Tab (admin only) */}
          {tab === "moderators" && isAdmin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-1">Assign Moderator</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Promote an existing student to moderator for a specific faculty.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="email" value={modEmail} onChange={(e) => setModEmail(e.target.value)}
                    placeholder="moderator@pciu.edu" className={`md:col-span-2 ${inputCls}`}
                  />
                  <select value={modFaculty} onChange={(e) => setModFaculty(e.target.value as FacultyKey)} className={inputCls}>
                    <option value="">Select faculty</option>
                    {FACULTY_LIST.map((f) => <option key={f.key} value={f.key}>{f.short}</option>)}
                  </select>
                </div>
                <button onClick={assignModerator} className="mt-3 px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:shadow-neon-sm transition-all">
                  Assign Moderator
                </button>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-3">Current Moderators ({moderators.length})</h3>
                {moderators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No moderators assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {moderators.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                        <div>
                          <div className="text-sm font-medium">{m.display_name ?? m.email ?? "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{m.email} · {facultyLabel(m.faculty)}</div>
                        </div>
                        <button onClick={() => removeModerator(m.id, m.user_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const inputCls =
  "w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50";

const Empty = ({ icon: Icon, title, subtitle }: { icon: typeof CheckCircle; title: string; subtitle: string }) => (
  <div className="glass-card rounded-xl p-12 text-center">
    <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
    <p className="font-medium">{title}</p>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
);

export default AdminDashboard;
