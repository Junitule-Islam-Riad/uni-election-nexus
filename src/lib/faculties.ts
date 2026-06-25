// Centralized faculty / department metadata for UniVote.
// Used for sign-up, campaign creation, filters and per-faculty UI theming.

export type FacultyKey = "business_studies" | "humanities_social_law" | "science_engineering";

export interface FacultyExtraField {
  key: string;
  label: string;
  options: string[];
}

export interface FacultyMeta {
  key: FacultyKey;
  name: string;
  short: string;
  tagline: string;
  departments: string[];
  electionTypes: string[];
  extraField: FacultyExtraField;
  // Tailwind utility-friendly accent (used for borders, glows, chips)
  accent: string; // hsl tuple-like string for inline use
  accentClass: string; // tailwind text class
  bgClass: string; // tailwind bg class
  borderClass: string;
  ringClass: string;
  gradientClass: string; // tailwind gradient utility used on card headers
  emoji: string;
}

export const FACULTIES: Record<FacultyKey, FacultyMeta> = {
  business_studies: {
    key: "business_studies",
    name: "Faculty of Business Studies",
    short: "FBS",
    departments: [
      "Business Administration",
      "Accounting & Information Systems",
      "Marketing",
      "Finance & Banking",
    ],
    accent: "38 95% 62%",
    accentClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
    borderClass: "border-amber-400/30",
    ringClass: "ring-amber-400/30",
    emoji: "💼",
  },
  humanities_social_law: {
    key: "humanities_social_law",
    name: "Faculty of Humanities, Social Sciences & Law",
    short: "FHSSL",
    departments: [
      "English",
      "Law",
      "Sociology",
      "Cultural Studies",
      "Journalism & Media",
    ],
    accent: "280 80% 70%",
    accentClass: "text-fuchsia-400",
    bgClass: "bg-fuchsia-400/10",
    borderClass: "border-fuchsia-400/30",
    ringClass: "ring-fuchsia-400/30",
    emoji: "⚖️",
  },
  science_engineering: {
    key: "science_engineering",
    name: "Faculty of Science and Engineering",
    short: "FSE",
    departments: [
      "Computer Science & Engineering",
      "Electrical & Electronic Engineering",
      "Civil Engineering",
      "Mathematics",
      "Physics",
    ],
    accent: "152 80% 55%",
    accentClass: "text-primary",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/30",
    ringClass: "ring-primary/30",
    emoji: "🔬",
  },
};

export const FACULTY_LIST: FacultyMeta[] = Object.values(FACULTIES);

export const facultyLabel = (key?: string | null): string =>
  key && FACULTIES[key as FacultyKey] ? FACULTIES[key as FacultyKey].name : "—";

export const facultyAccent = (key?: string | null): FacultyMeta | null =>
  key && FACULTIES[key as FacultyKey] ? FACULTIES[key as FacultyKey] : null;
