import { motion } from "framer-motion";
import { Vote, Shield, BarChart3, Users, Zap, Clock } from "lucide-react";

const features = [
  { icon: Shield, title: "Secure Voting", desc: "One vote per authenticated university email" },
  { icon: BarChart3, title: "Live Results", desc: "Real-time vote tallies with animated charts" },
  { icon: Users, title: "Candidate Portal", desc: "Upload photos, mottos, and campaign details" },
  { icon: Zap, title: "Instant Setup", desc: "Create campaigns with shareable URLs in seconds" },
  { icon: Clock, title: "Timed Elections", desc: "Automated start/end with winner reveal" },
  { icon: Vote, title: "Admin Control", desc: "Approve candidates and manage voter whitelists" },
];

const Features = () => (
  <section className="relative py-24 px-6">
    <div className="container max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">Platform Features</p>
        <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Run Elections</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-card rounded-lg p-6 group hover:shadow-neon-sm transition-shadow duration-300"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
