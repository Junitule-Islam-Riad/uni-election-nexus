import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Settings, BarChart3, CheckCircle, XCircle, Clock, Link as LinkIcon, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";

const mockCampaigns = [
  { id: "sc-2026", title: "Student Council President", status: "live", candidates: 3, voters: 761, pending: 1 },
  { id: "cs-rep", title: "CS Department Representative", status: "upcoming", candidates: 4, voters: 0, pending: 0 },
];

const pendingCandidates = [
  { id: 1, name: "Alex Rivera", campaign: "Student Council President", motto: "Progress through unity" },
];

const AdminDashboard = () => {
  const [tab, setTab] = useState<"campaigns" | "approvals" | "voters">("campaigns");
  const [whitelistEmail, setWhitelistEmail] = useState("");

  const tabs = [
    { key: "campaigns" as const, label: "Campaigns", icon: BarChart3 },
    { key: "approvals" as const, label: "Approvals", icon: CheckCircle },
    { key: "voters" as const, label: "Voters", icon: Users },
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
              <button className="glass-card rounded-xl p-4 w-full border-dashed border-2 border-border hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New Campaign</span>
              </button>

              {mockCampaigns.map((c) => (
                <div key={c.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{c.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{c.candidates} candidates</span>
                        <span>{c.voters} voters</span>
                        {c.pending > 0 && (
                          <span className="text-primary">{c.pending} pending approval</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
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
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm">
                        {c.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-semibold">{c.name}</h3>
                        <p className="text-sm text-muted-foreground">"{c.motto}" — {c.campaign}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
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
                <h3 className="font-semibold mb-3">Whitelist Voter Email</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={whitelistEmail}
                    onChange={(e) => setWhitelistEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:shadow-neon-sm transition-all">
                    Add
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-3">Whitelisted Voters</h3>
                <div className="space-y-2">
                  {["john@university.edu", "sarah@university.edu", "priya@university.edu"].map((email) => (
                    <div key={email} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                      <span className="text-sm">{email}</span>
                      <button className="text-muted-foreground hover:text-destructive transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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
