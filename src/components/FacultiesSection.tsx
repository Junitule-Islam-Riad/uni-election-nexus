import { motion } from "framer-motion";
import { ArrowUpRight, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { FACULTY_LIST, type FacultyMeta } from "@/lib/faculties";
import engineeringImg from "@/assets/ecosystem-engineering.jpg";
import businessImg from "@/assets/ecosystem-business.jpg";
import clubsImg from "@/assets/ecosystem-clubs.jpg";

const facultyImages: Record<string, string> = {
  business_studies: businessImg,
  humanities_social_law: clubsImg,
  science_engineering: engineeringImg,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const FacultyCard = ({ f }: { f: FacultyMeta }) => (
  <motion.div
    variants={item}
    whileHover={{ y: -6 }}
    transition={{ type: "spring", stiffness: 300, damping: 22 }}
    className={`group relative glass-card hud-border rounded-2xl overflow-hidden flex flex-col border ${f.borderClass}`}
  >
    <div className="relative h-40 overflow-hidden">
      <img
        src={facultyImages[f.key]}
        alt={f.name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className={`absolute inset-0 bg-gradient-to-br ${f.gradientClass} mix-blend-overlay opacity-60`} />
      <span
        className={`absolute top-3 left-3 text-[10px] font-mono uppercase tracking-[0.2em] ${f.accentClass} bg-background/70 backdrop-blur-sm px-2 py-1 rounded-md border ${f.borderClass}`}
      >
        {f.short}
      </span>
      <div
        className={`absolute top-3 right-3 w-9 h-9 rounded-full ${f.bgClass} backdrop-blur-sm border ${f.borderClass} flex items-center justify-center text-xl`}
      >
        {f.emoji}
      </div>
    </div>

    <div className="p-5 flex flex-col flex-1">
      <h3 className={`font-bold text-lg leading-snug mb-1 group-hover:${f.accentClass} transition-colors`}>
        {f.name}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">{f.tagline}</p>

      <div className="mb-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          // Departments
        </div>
        <div className="flex flex-wrap gap-1.5">
          {f.departments.map((d) => (
            <span
              key={d}
              className={`text-[11px] px-2 py-1 rounded-md ${f.bgClass} ${f.accentClass} border ${f.borderClass}`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link
          to={`/admin?create=1&faculty=${f.key}`}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${f.bgClass} ${f.accentClass} border ${f.borderClass} hover:ring-2 ${f.ringClass} transition`}
        >
          <Rocket className="w-3.5 h-3.5" />
          Start Campaign
        </Link>
        <Link
          to={`/campaigns?faculty=${f.key}`}
          className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
        >
          View
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  </motion.div>
);

export default function FacultiesSection() {
  return (
    <section className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="container max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-primary">
            // Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl font-black mt-2 mb-3">
            Powering the Entire{" "}
            <span className="text-primary neon-text">PCIU Ecosystem</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Three faculties, every department — launch an election in seconds.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {FACULTY_LIST.map((f) => (
            <FacultyCard key={f.key} f={f} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
