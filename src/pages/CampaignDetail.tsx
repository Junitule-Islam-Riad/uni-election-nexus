import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Shield, Check, Trophy, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";

const candidates = [
  { id: 1, name: "Sarah Chen", motto: "Innovation starts with inclusion", votes: 342, photo: "SC" },
  { id: 2, name: "Marcus Williams", motto: "Building bridges, not walls", votes: 267, photo: "MW" },
  { id: 3, name: "Priya Patel", motto: "Your voice, amplified", votes: 152, photo: "PP" },
];

const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);

const CampaignDetail = () => {
  const [voted, setVoted] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  const handleVote = () => {
    if (selectedCandidate !== null) setVoted(selectedCandidate);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="container max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">Student Council President</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse-neon" />
                Live
              </span>
            </div>
            <p className="text-muted-foreground">Cast your vote for the next student council president</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Users, label: "Total Votes", value: totalVotes.toString() },
              { icon: Clock, label: "Time Left", value: "2h 15m" },
              { icon: Shield, label: "Verified", value: "100%" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="glass-card rounded-xl p-4 text-center"
              >
                <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Candidates */}
          <div className="space-y-4 mb-8">
            {candidates.map((c, i) => {
              const pct = Math.round((c.votes / totalVotes) * 100);
              const isSelected = selectedCandidate === c.id;
              const isVoted = voted === c.id;
              const isLeading = i === 0;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  onClick={() => !voted && setSelectedCandidate(c.id)}
                  className={`glass-card rounded-xl p-5 cursor-pointer transition-all duration-300 ${
                    isSelected ? "border-primary/50 shadow-neon-sm" : "hover:border-primary/20"
                  } ${voted ? "cursor-default" : ""}`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isLeading ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      {c.photo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{c.name}</h3>
                        {isLeading && <Trophy className="w-4 h-4 text-primary" />}
                        {isVoted && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{c.motto}"</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{pct}%</p>
                      <p className="text-xs text-muted-foreground">{c.votes} votes</p>
                    </div>
                  </div>

                  {/* Vote bar */}
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
          {!voted ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={handleVote}
              disabled={selectedCandidate === null}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground neon-glow hover:shadow-neon-lg transition-all duration-300 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {selectedCandidate ? "Cast Your Vote" : "Select a Candidate"}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-5 text-center border-primary/30"
            >
              <Check className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Vote Cast Successfully!</p>
              <p className="text-sm text-muted-foreground">Your vote has been securely recorded</p>
            </motion.div>
          )}

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
