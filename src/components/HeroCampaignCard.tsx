import { motion } from "framer-motion";
import { Users, Clock, TrendingUp, Shield } from "lucide-react";

const HeroCampaignCard = () => {
  const candidates = [
    { name: "Sarah Chen", votes: 342, pct: 45 },
    { name: "Marcus Williams", votes: 267, pct: 35 },
    { name: "Priya Patel", votes: 152, pct: 20 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotateY: -10 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
      className="relative w-full max-w-md"
    >
      {/* HUD corner brackets */}
      <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-primary/60" />
      <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-primary/60" />
      <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-primary/60" />
      <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-primary/60" />

      <div className="glass-card rounded-xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-primary font-semibold tracking-widest uppercase"
            >
              Live Campaign
            </motion.p>
            <h3 className="text-lg font-bold mt-1">Student Council President</h3>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
            <span className="text-xs font-medium">LIVE</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: "Voters", value: "761" },
            { icon: Clock, label: "Remaining", value: "2h 15m" },
            { icon: Shield, label: "Verified", value: "100%" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.15 }}
              className="bg-secondary/50 rounded-lg p-3 text-center"
            >
              <stat.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-sm font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Vote bars */}
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 + i * 0.2 }}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">{c.votes} votes</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 1.2, delay: 1.5 + i * 0.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${i === 0 ? "bg-primary shadow-neon-sm" : "bg-primary/40"}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="flex items-center justify-between pt-2 border-t border-border"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>+24 votes in last hour</span>
          </div>
          <span className="text-[10px] text-muted-foreground tracking-wider">UNIVOTE://SC-2026</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HeroCampaignCard;
