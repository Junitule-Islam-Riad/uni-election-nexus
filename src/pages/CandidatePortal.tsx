import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, User, MessageSquare, Send, Image } from "lucide-react";
import Layout from "@/components/Layout";

const CandidatePortal = () => {
  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [bio, setBio] = useState("");

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="container max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Candidate Portal</h1>
            <p className="text-muted-foreground">Submit your candidacy for an active campaign</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-6 space-y-6"
          >
            {/* Photo upload */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Profile Photo</label>
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors flex flex-col items-center justify-center cursor-pointer bg-secondary/30 group">
                <Image className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                <span className="text-xs text-muted-foreground">Upload</span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Motto */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Election Motto</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Your election motto"
                  className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">About You</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell voters about your vision and qualifications..."
                rows={4}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              />
            </div>

            {/* Campaign select */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Campaign</label>
              <select className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                <option>Select a campaign...</option>
                <option>Student Council President</option>
                <option>CS Department Representative</option>
              </select>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm neon-glow hover:shadow-neon-lg transition-all duration-300 hover:scale-[1.02]">
              <Send className="w-4 h-4" />
              Submit Candidacy
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Your submission will be reviewed by an admin before appearing publicly
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CandidatePortal;
