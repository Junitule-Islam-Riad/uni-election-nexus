import { motion } from "framer-motion";
import {
  GraduationCap, Cpu, Building2, FlaskConical, Briefcase, Stethoscope,
  Users, Code2, Music, Camera, Trophy, BookOpen,
} from "lucide-react";

const faculties = [
  { icon: Cpu, name: "Faculty of Engineering", desc: "CSE, EEE, Civil & Mechanical" },
  { icon: Briefcase, name: "Faculty of Business", desc: "BBA, MBA & Economics" },
  { icon: Stethoscope, name: "Faculty of Health Sciences", desc: "Pharmacy, Public Health & Nursing" },
  { icon: FlaskConical, name: "Faculty of Science", desc: "Mathematics, Physics & Chemistry" },
  { icon: BookOpen, name: "Faculty of Arts & Humanities", desc: "English, Law & Social Sciences" },
  { icon: GraduationCap, name: "Faculty of Education", desc: "B.Ed & M.Ed Programs" },
];

const departments = [
  { icon: Code2, name: "Dept. of CSE" },
  { icon: Cpu, name: "Dept. of EEE" },
  { icon: Building2, name: "Dept. of Civil" },
  { icon: Briefcase, name: "Dept. of BBA" },
  { icon: Stethoscope, name: "Dept. of Pharmacy" },
  { icon: BookOpen, name: "Dept. of English" },
];

const clubs = [
  { icon: Code2, name: "PCIU Computer Club" },
  { icon: Trophy, name: "Sports Club" },
  { icon: Music, name: "Cultural Club" },
  { icon: Camera, name: "Photography Society" },
  { icon: Users, name: "Debate Club" },
  { icon: BookOpen, name: "Literary Society" },
];

const Card = ({ icon: Icon, name, desc }: { icon: any; name: string; desc?: string }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="glass-card hud-border rounded-xl p-5 group cursor-pointer"
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground leading-tight">{name}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
      </div>
    </div>
  </motion.div>
);

const Group = ({ title, tag, items }: { title: string; tag: string; items: any[] }) => (
  <div className="mb-16 last:mb-0">
    <div className="mb-6">
      <span className="text-xs font-mono uppercase tracking-widest text-primary">{tag}</span>
      <h3 className="text-2xl sm:text-3xl font-bold mt-1">{title}</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => (
        <Card key={it.name} {...it} />
      ))}
    </div>
  </div>
);

const FacultiesSection = () => (
  <section className="relative py-24 px-6 overflow-hidden">
    <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
    <div className="container max-w-7xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <span className="text-xs font-mono uppercase tracking-widest text-primary">// Network</span>
        <h2 className="text-3xl sm:text-5xl font-black mt-2 mb-4">
          Powering the Entire <span className="text-primary neon-text">PCIU Ecosystem</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Faculties, departments and student clubs running their elections on UniVote.
        </p>
      </motion.div>

      <Group title="Faculties" tag="// 01_Faculties" items={faculties} />
      <Group title="Departments" tag="// 02_Departments" items={departments} />
      <Group title="Student Clubs" tag="// 03_Clubs" items={clubs} />
    </div>
  </section>
);

export default FacultiesSection;
