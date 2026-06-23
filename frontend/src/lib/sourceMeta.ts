export interface SourceMeta {
  id: string;
  name: string;
  description: string;
  imports: string[];
  iconBg: string;
  iconColor: string;
}

export const SOURCES: SourceMeta[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Import repos, contributions, READMEs",
    imports: ["Projects", "Tech Stack", "Profile"],
    iconBg: "bg-white/10",
    iconColor: "text-white",
  },
  {
    id: "leetcode",
    name: "LeetCode",
    description: "Solved count, contest rating, badges",
    imports: ["Solve Stats", "Contest Rating", "Skills"],
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    id: "codeforces",
    name: "Codeforces",
    description: "Rating, rank, contest history",
    imports: ["Rating", "Rank", "Contests"],
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Paste your profile URL, AI extracts experience",
    imports: ["Experience", "Education", "Skills"],
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
  },
  {
    id: "resume",
    name: "Upload Resume",
    description: "PDF or DOCX — AI extracts everything",
    imports: ["Experience", "Education", "Projects", "Skills"],
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    id: "blank",
    name: "Start Blank",
    description: "Fill everything manually in the editor",
    imports: [],
    iconBg: "bg-zinc-500/10",
    iconColor: "text-zinc-400",
  },
];

export function getSourceMeta(id: string): SourceMeta {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[SOURCES.length - 1];
}
