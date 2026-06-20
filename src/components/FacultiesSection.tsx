import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import engineeringImg from "@/assets/ecosystem-engineering.jpg";
import businessImg from "@/assets/ecosystem-business.jpg";
import healthImg from "@/assets/ecosystem-health.jpg";
import cseImg from "@/assets/ecosystem-cse.jpg";
import clubsImg from "@/assets/ecosystem-clubs.jpg";
import scienceImg from "@/assets/ecosystem-science.jpg";

const ecosystem = [
  {
    image: engineeringImg,
    title: "Faculty of Engineering",
    subtitle: "CSE, EEE, Civil & Mechanical",
    tag: "Faculty",
  },
  {
    image: businessImg,
    title: "Faculty of Business",
    subtitle: "BBA, MBA & Economics",
    tag: "Faculty",
  },
  {
    image: healthImg,
    title: "Faculty of Health Sciences",
    subtitle: "Pharmacy, Public Health & Nursing",
    tag: "Faculty",
  },
  {
    image: cseImg,
    title: "Dept. of Computer Science",
    subtitle: "Software, AI & Cybersecurity",
    tag: "Department",
  },
  {
    image: clubsImg,
    title: "Student Clubs & Societies",
    subtitle: "Tech, Sports, Culture & Arts",
    tag: "Clubs",
  },
  {
    image: scienceImg,
    title: "Faculty of Science",
    subtitle: "Mathematics, Physics & Chemistry",
    tag: "Faculty",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

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
            Faculties, departments and student clubs running their elections on
            UniVote.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {ecosystem.map((entity) => (
            <motion.div
              key={entity.title}
              variants={item}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group glass-card hud-border rounded-2xl overflow-hidden cursor-pointer"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={entity.image}
                  alt={entity.title}
                  loading="lazy"
                  width={1024}
                  height={512}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <span className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider text-primary bg-background/60 backdrop-blur-sm px-2 py-1 rounded-md border border-primary/20">
                  {entity.tag}
                </span>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-primary transition-colors duration-300">
                  {entity.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {entity.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
