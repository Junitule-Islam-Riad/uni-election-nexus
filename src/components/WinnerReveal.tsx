import { motion } from "framer-motion";
import { Trophy, Star, Sparkles } from "lucide-react";

interface WinnerProps {
  name: string;
  motto: string | null;
  photoUrl: string | null;
  initials: string;
  voteCount: number;
  totalVotes: number;
}

const WinnerReveal = ({ name, motto, photoUrl, initials, voteCount, totalVotes }: WinnerProps) => {
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="glass-card rounded-2xl p-8 text-center border-primary/40 relative overflow-hidden"
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline pointer-events-none" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -60],
            x: [0, (i % 2 === 0 ? 1 : -1) * 20],
          }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          style={{ left: `${15 + i * 14}%`, bottom: "20%" }}
        />
      ))}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="w-20 h-20 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center relative"
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full rounded-2xl object-cover" />
        ) : (
          <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
        )}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-neon-sm"
        >
          <Trophy className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Winner</span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-1">{name}</h2>
        {motto && <p className="text-muted-foreground italic text-sm mb-4">"{motto}"</p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-3 gap-4 mt-6"
      >
        <div className="glass-card rounded-xl p-3">
          <p className="text-xl font-bold text-primary">{pct}%</p>
          <p className="text-xs text-muted-foreground">Vote Share</p>
        </div>
        <div className="glass-card rounded-xl p-3">
          <p className="text-xl font-bold">{voteCount}</p>
          <p className="text-xs text-muted-foreground">Votes Won</p>
        </div>
        <div className="glass-card rounded-xl p-3">
          <p className="text-xl font-bold">{totalVotes}</p>
          <p className="text-xs text-muted-foreground">Total Cast</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground"
      >
        <Star className="w-3 h-3 text-primary" />
        <span>Election concluded — results are final</span>
      </motion.div>
    </motion.div>
  );
};

export default WinnerReveal;
