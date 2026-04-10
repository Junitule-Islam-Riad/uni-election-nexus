import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Clock, Shield, Check, Trophy, TrendingUp, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import WinnerReveal from "@/components/WinnerReveal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;
type Candidate = Tables<"candidates">;

interface VoteTally {
  candidate_id: string;
  count: number;
}

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tallies, setTallies] = useState<VoteTally[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isEnded, setIsEnded] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const computeTallies = useCallback((votes: { candidate_id: string }[]) => {
    const map: Record<string, number> = {};
    votes.forEach((v) => { map[v.candidate_id] = (map[v.candidate_id] || 0) + 1; });
    return Object.entries(map).map(([candidate_id, count]) => ({ candidate_id, count }));
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: camp }, { data: cands }, { data: votes }] = await Promise.all([
        supabase.from("campaigns").select("*").eq("id", id).single(),
        supabase.from("candidates").select("*").eq("campaign_id", id).eq("status", "approved"),
        supabase.from("votes").select("candidate_id, user_id").eq("campaign_id", id),
      ]);
      setCampaign(camp);
      setCandidates(cands ?? []);
      setTallies(computeTallies(votes ?? []));

      if (user && votes) {
        const myVote = votes.find((v) => v.user_id === user.id);
        if (myVote) setUserVote(myVote.candidate_id);
      }
      setLoading(false);
    };
    load();
  }, [id, user, computeTallies]);

  // Real-time vote subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`votes-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `campaign_id=eq.${id}` },
        async () => {
          const { data: votes } = await supabase.from("votes").select("candidate_id, user_id").eq("campaign_id", id);
          setTallies(computeTallies(votes ?? []));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, computeTallies]);

  // Timer
  useEffect(() => {
    if (!campaign) return;
    const tick = () => {
      const now = new Date();
      const start = new Date(campaign.start_time);
      const end = new Date(campaign.end_time);
      setIsStarted(now >= start);
      setIsEnded(now >= end);

      if (now >= end) {
        setTimeLeft("Ended");
        return;
      }
      if (now < start) {
        const diff = start.getTime() - now.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(`Starts in ${h}h ${m}m`);
        return;
      }
      const diff = end.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [campaign]);

  const totalVotes = tallies.reduce((s, t) => s + t.count, 0);

  const handleVote = async () => {
    if (!selectedCandidate || !user || !id) return;
    setVoting(true);
    const { error } = await supabase.from("votes").insert({
      campaign_id: id,
      candidate_id: selectedCandidate,
      user_id: user.id,
    });
    if (error) {
      toast({ title: "Vote failed", description: error.message, variant: "destructive" });
    } else {
      setUserVote(selectedCandidate);
      toast({ title: "Vote cast!", description: "Your vote has been securely recorded." });
    }
    setVoting(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-muted-foreground">Campaign not found</p>
        </div>
      </Layout>
    );
  }

  // Sort candidates by votes
  const sorted = [...candidates].sort((a, b) => {
    const aVotes = tallies.find((t) => t.candidate_id === a.id)?.count ?? 0;
    const bVotes = tallies.find((t) => t.candidate_id === b.id)?.count ?? 0;
    return bVotes - aVotes;
  });

  // Winner reveal
  if (isEnded && sorted.length > 0) {
    const winner = sorted[0];
    const winnerVotes = tallies.find((t) => t.candidate_id === winner.id)?.count ?? 0;
    const initials = winner.name.split(" ").map((n) => n[0]).join("");

    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
          <div className="container max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <h1 className="text-3xl font-bold mb-1">{campaign.title}</h1>
              <p className="text-muted-foreground">Election concluded</p>
            </motion.div>

            <WinnerReveal
              name={winner.name}
              motto={winner.motto}
              photoUrl={winner.photo_url}
              initials={initials}
              voteCount={winnerVotes}
              totalVotes={totalVotes}
            />

            {/* Full results below */}
            <div className="mt-8 space-y-3">
              <h3 className="text-lg font-semibold">Final Results</h3>
              {sorted.map((c, i) => {
                const votes = tallies.find((t) => t.candidate_id === c.id)?.count ?? 0;
                const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                return (
                  <div key={c.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{c.name}</p>
                      <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-primary/40"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{pct}%</p>
                      <p className="text-xs text-muted-foreground">{votes} votes</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const canVote = isStarted && !isEnded && !userVote;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="container max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
              {isStarted && !isEnded && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse-neon" />
                  Live
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{campaign.description || "Cast your vote"}</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Users, label: "Total Votes", value: totalVotes.toString() },
              { icon: Clock, label: "Time Left", value: timeLeft },
              { icon: Shield, label: "Verified", value: "100%" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="glass-card rounded-xl p-4 text-center">
                <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Candidates */}
          <div className="space-y-4 mb-8">
            {sorted.map((c, i) => {
              const votes = tallies.find((t) => t.candidate_id === c.id)?.count ?? 0;
              const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isSelected = selectedCandidate === c.id;
              const isVoted = userVote === c.id;
              const isLeading = i === 0 && totalVotes > 0;
              const initials = c.name.split(" ").map((n) => n[0]).join("");

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  onClick={() => canVote && setSelectedCandidate(c.id)}
                  className={`glass-card rounded-xl p-5 transition-all duration-300 ${
                    canVote ? "cursor-pointer" : "cursor-default"
                  } ${isSelected ? "border-primary/50 shadow-neon-sm" : "hover:border-primary/20"}`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm overflow-hidden ${
                      isLeading ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                      ) : initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{c.name}</h3>
                        {isLeading && <Trophy className="w-4 h-4 text-primary" />}
                        {isVoted && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      {c.motto && <p className="text-sm text-muted-foreground italic">"{c.motto}"</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{pct}%</p>
                      <p className="text-xs text-muted-foreground">{votes} votes</p>
                    </div>
                  </div>

                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                      className={`h-full rounded-full ${isLeading ? "bg-primary shadow-neon-sm" : "bg-primary/40"}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Vote button */}
          {canVote ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={handleVote}
              disabled={!selectedCandidate || voting}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground neon-glow hover:shadow-neon-lg transition-all duration-300 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {voting ? "Casting..." : selectedCandidate ? "Cast Your Vote" : "Select a Candidate"}
            </motion.button>
          ) : userVote ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-5 text-center border-primary/30"
            >
              <Check className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Vote Cast Successfully!</p>
              <p className="text-sm text-muted-foreground">Your vote has been securely recorded</p>
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground"
          >
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>Results update in real-time</span>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CampaignDetail;
