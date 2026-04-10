import { motion } from "framer-motion";
import { Vote, ChevronRight } from "lucide-react";
import HeroCampaignCard from "./HeroCampaignCard";

const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
    {/* Scanline overlay */}
    <div className="absolute inset-0 scanline pointer-events-none" />

    {/* Radial gradient overlay */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(152,52%,7%)_70%)]" />

    <div className="container relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-16">
      {/* Left content */}
      <div className="flex-1 text-center lg:text-left">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Election System v2.0</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6"
        >
          The Future of{" "}
          <span className="text-primary neon-text">University Elections</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed"
        >
          Secure, transparent, and real-time. UniVote empowers student elections with cutting-edge technology and a futuristic experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
        >
          <a
            href="/campaigns"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-lg font-semibold neon-glow hover:shadow-neon-lg transition-all duration-300 hover:scale-105"
          >
            <Vote className="w-5 h-5" />
            View Campaigns
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 glass-card px-8 py-3.5 rounded-lg font-semibold text-foreground hover:border-primary/50 transition-all duration-300"
          >
            Get Started
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>

      {/* Right - HUD Campaign Card */}
      <div className="flex-1 flex justify-center">
        <HeroCampaignCard />
      </div>
    </div>
  </section>
);

export default Hero;
