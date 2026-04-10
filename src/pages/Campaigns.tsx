import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users, ChevronRight, Zap, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

const getStatus = (c: Campaign): "live" | "upcoming" | "ended" => {
  const now = new Date();
  if (now < new Date(c.start_time)) return "upcoming";
  if (now > new Date(c.end_time)) return "ended";
  return "live";
};

const getTimeLabel = (c: Campaign): string => {
  const now = new Date();
  const start = new Date(c.start_time);
  const end = new Date(c.end_time);
  if (now < start) {
    const diff = start.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    return h > 24 ? `Starts in ${Math.floor(h / 24)}d` : `Starts in ${h}h`;
  }
  if (now > end) return "Ended";
  const diff = end.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m left`;
};

const statusColors = {
  live: "bg-primary/10 text-primary border-primary/20",
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ended: "bg-muted text-muted-foreground border-border",
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [candidateCounts, setCandidateCounts] = useState<Record<string, number>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: camps } = await supabase.from("campaigns").select("*").order("start_time", { ascending: false });
      setCampaigns(camps ?? []);

      if (camps?.length) {
        const ids = camps.map((c) => c.id);
        const { data: cands } = await supabase.from("candidates").select("campaign_id").eq("status", "approved").in("campaign_id", ids);
        const cc: Record<string, number> = {};
        cands?.forEach((c) => { cc[c.campaign_id] = (cc[c.campaign_id] || 0) + 1; });
        setCandidateCounts(cc);

        const { data: votes } = await supabase.from("votes").select("campaign_id").in("campaign_id", ids);
        const vc: Record<string, number> = {};
        votes?.forEach((v) => { vc[v.campaign_id] = (vc[v.campaign_id] || 0) + 1; });
        setVoteCounts(vc);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="container max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl font-bold mb-2">Active Campaigns</h1>
            <p className="text-muted-foreground">Browse and vote in ongoing university elections</p>
          </motion.div>

          {campaigns.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-muted-foreground">No campaigns yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((c, i) => {
                const status = getStatus(c);
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link
                      to={`/campaign/${c.id}`}
                      className="block glass-card rounded-xl p-5 hover:shadow-neon-sm hover:border-primary/30 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{c.title}</h3>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusColors[status]}`}>
                              {status === "live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse-neon" />}
                              {status}
                            </span>
                          </div>
                          <div className="flex items-center gap-5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{candidateCounts[c.id] || 0} candidates</span>
                            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />{voteCounts[c.id] || 0} voters</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{getTimeLabel(c)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Campaigns;
