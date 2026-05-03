import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Settings, BarChart3, CheckCircle, XCircle, Clock, Link as LinkIcon, Trash2, MessageSquare } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;
type CandidateRow = Tables<"candidates">;
type Profile = Tables<"profiles"> & { community_status?: string };

const AdminDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"campaigns" | "approvals" | "voters" | "community">("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pendingCandidates, setPendingCandidates] = useState<CandidateRow[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Profile[]>([]);
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [whitelistedEmails, setWhitelistedEmails] = useState<{ id: string; email: string; campaign_id: string }[]>([]);

  // Create campaign state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const loadCampaigns = async () => {
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data ?? []);
    if (data?.length && !selectedCampaignId) setSelectedCampaignId(data[0].id);
  };

  const loadPending = async () => {
    const { data } = await supabase.from("candidates").select("*").eq("status", "pending");
    setPendingCandidates(data ?? []);
  };

  const loadPendingMembers = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("community_status", "pending");
    setPendingMembers((data as any) ?? []);
  };

  const loadWhitelist = async () => {
    if (!selectedCampaignId) return;
    const { data } = await supabase.from("voter_whitelist").select("*").eq("campaign_id", selectedCampaignId);
    setWhitelistedEmails(data ?? []);
  };

  useEffect(() => { loadCampaigns(); loadPending(); loadPendingMembers(); }, []);
  useEffect(() => { loadWhitelist(); }, [selectedCampaignId]);

  const setMemberStatus = async (userId: string, status: "approved" | "rejected") => {
    await supabase.from("profiles").update({ community_status: status } as any).eq("user_id", userId);
    loadPendingMembers();
    toast({ title: `Member ${status}` });
  };

  const createCampaign = async () => {
    if (!newTitle || !newStart || !newEnd || !user) return;
    const { error } = await supabase.from("campaigns").insert({
      title: newTitle, description: newDesc || null,
      start_time: new Date(newStart).toISOString(),
      end_time: new Date(newEnd).toISOString(),
      created_by: user.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Campaign created!" });
      setShowCreate(false); setNewTitle(""); setNewDesc(""); setNewStart(""); setNewEnd("");
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

  const tabs = [
    { key: "campaigns" as const, label: "Campaigns", icon: BarChart3 },
    { key: "approvals" as const, label: "Candidates", icon: CheckCircle },
    { key: "voters" as const, label: "Voters", icon: Users },
    { key: "community" as const, label: "Community", icon: MessageSquare },
  ];

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="container max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage campaigns, approve candidates, and whitelist voters</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 glass-card rounded-xl p-1 w-fit">
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
              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                  className="glass-card rounded-xl p-4 w-full border-dashed border-2 border-border hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Campaign</span>
                </button>
              ) : (
                <div className="glass-card rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold">New Campaign</h3>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Campaign Title"
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)"
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                      <input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
                      <input type="datetime-local" value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={createCampaign} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:shadow-neon-sm transition-all">Create</button>
                    <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                </div>
              )}

              {campaigns.map((c) => (
                <div key={c.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{c.title}</h3>
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

          {/* Approvals Tab */}
          {tab === "approvals" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {pendingCandidates.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No pending candidate approvals</p>
                </div>
              ) : (
                pendingCandidates.map((c) => (
                  <div key={c.id} className="glass-card rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm overflow-hidden">
                        {c.photo_url ? (
                          <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                        ) : c.name.split(" ").map(n => n[0]).join("")}
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

          {/* Voters Tab */}
          {tab === "voters" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-3">Select Campaign</h3>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none mb-4"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>

                <h3 className="font-semibold mb-3">Whitelist Voter Email</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={whitelistEmail}
                    onChange={(e) => setWhitelistEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
