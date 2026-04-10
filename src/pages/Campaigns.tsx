import { motion } from "framer-motion";
import { Clock, Users, ChevronRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const mockCampaigns = [
  {
    id: "sc-2026",
    title: "Student Council President",
    status: "live" as const,
    candidates: 3,
    voters: 761,
    endsIn: "2h 15m",
  },
  {
    id: "cs-rep",
    title: "CS Department Representative",
    status: "live" as const,
    candidates: 4,
    voters: 234,
    endsIn: "5h 42m",
  },
  {
    id: "sports-sec",
    title: "Sports Secretary",
    status: "upcoming" as const,
    candidates: 2,
    voters: 0,
    endsIn: "Starts in 3d",
  },
  {
    id: "cultural-head",
    title: "Cultural Committee Head",
    status: "ended" as const,
    candidates: 3,
    voters: 512,
    endsIn: "Ended",
  },
];

const statusColors = {
  live: "bg-primary/10 text-primary border-primary/20",
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ended: "bg-muted text-muted-foreground border-border",
};

const Campaigns = () => (
  <Layout>
    <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold mb-2">Active Campaigns</h1>
          <p className="text-muted-foreground">Browse and vote in ongoing university elections</p>
        </motion.div>

        <div className="grid gap-4">
          {mockCampaigns.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/campaign/${c.id}`}
                className="block glass-card rounded-xl p-5 hover:shadow-neon-sm hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{c.title}</h3>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusColors[c.status]}`}>
                        {c.status === "live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse-neon" />}
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{c.candidates} candidates</span>
                      <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />{c.voters} voters</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{c.endsIn}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </Layout>
);

export default Campaigns;
