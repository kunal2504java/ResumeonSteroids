/**
 * fillTemplate.ts
 *
 * Reads the Jake's Resume LaTeX template and fills it with resume data.
 * Uses programmatic section building so it supports any number of
 * experience / education / project entries — not hard-coded placeholders.
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types (mirrors @resumeai/shared but kept self-contained for the API)
// ---------------------------------------------------------------------------
interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

interface Experience {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  coursework: string[];
}

interface Project {
  name: string;
  techStack: string[];
  startDate: string;
  endDate: string;
  bullets: string[];
}

interface Skills {
  languages: string[];
  frameworks: string[];
  tools: string[];
  databases: string[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skills;
  achievements?: string[];
}

// ---------------------------------------------------------------------------
// LaTeX character escaping
// ---------------------------------------------------------------------------
const LATEX_SPECIAL: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "$": "\\$",
  "&": "\\&",
  "#": "\\#",
  "%": "\\%",
  "_": "\\_",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

/** Escape all LaTeX-special characters in a user-supplied string. */
function esc(text: string): string {
  if (!text) return "";
  return text.replace(/[\\{}$&#%_~^]/g, (ch) => LATEX_SPECIAL[ch] ?? ch);
}

/** Strip protocol prefix for display: "https://github.com/foo" → "github.com/foo" */
function stripProto(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "");
}

// ---------------------------------------------------------------------------
// Date formatting — "2025-11" → "November 2025"
// ---------------------------------------------------------------------------
const MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function fmtDate(date: string): string {
  if (!date) return "";
  if (date.includes("-")) {
    const [year, month] = date.split("-");
    const monthName = month ? MONTHS[Number(month)] : "";
    return month ? `${monthName || month} ${year}` : year;
  }
  return date; // already human-readable ("Present", "May 2024", etc.)
}

function dateRange(start: string, end: string): string {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (!s && !e) return "";
  if (!e || e.toLowerCase() === "present") return `${s} -- Present`;
  return `${s} -- ${e}`;
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildEducation(entries: Education[]): string {
  if (!entries.length) return "";
  const lines: string[] = [];
  lines.push("%-----------EDUCATION-----------");
  lines.push("\\section{Education}");
  lines.push("  \\resumeSubHeadingListStart");

  for (const edu of entries) {
    const degreeStr = [
      esc(edu.degree),
      edu.field ? ` in ${esc(edu.field)}` : "",
      edu.gpa ? `, GPA: ${esc(edu.gpa)}` : "",
    ].join("");

    lines.push("    \\resumeSubheading");
    lines.push(`      {${esc(edu.institution)}}{${esc(edu.location)}}`);
    lines.push(`      {${degreeStr}}{${esc(dateRange(edu.startDate, edu.endDate))}}`);
  }

  lines.push("  \\resumeSubHeadingListEnd");
  lines.push("");
  return lines.join("\n");
}

function buildExperience(entries: Experience[]): string {
  if (!entries.length) return "";
  const lines: string[] = [];
  lines.push("%-----------EXPERIENCE-----------");
  lines.push("\\section{Experience}");
  lines.push("  \\resumeSubHeadingListStart");

  for (const exp of entries) {
    lines.push("");
    lines.push("    \\resumeSubheading");
    lines.push(`      {${esc(exp.company)}}{${esc(dateRange(exp.startDate, exp.endDate))}}`);
    lines.push(`      {${esc(exp.title)}}{${esc(exp.location)}}`);

    const bullets = exp.bullets.filter((b) => b.trim());
    if (bullets.length) {
      lines.push("      \\resumeItemListStart");
      for (const b of bullets) {
        lines.push(`        \\resumeItem{${esc(b)}}`);
      }
      lines.push("      \\resumeItemListEnd");
    }
  }

  lines.push("");
  lines.push("  \\resumeSubHeadingListEnd");
  lines.push("");
  return lines.join("\n");
}

function buildProjects(entries: Project[]): string {
  if (!entries.length) return "";
  const lines: string[] = [];
  lines.push("%-----------PROJECTS-----------");
  lines.push("\\section{Projects}");
  lines.push("    \\resumeSubHeadingListStart");

  for (const proj of entries) {
    const techStr =
      proj.techStack.length > 0
        ? ` $|$ \\emph{${proj.techStack.map(esc).join(", ")}}`
        : "";
    lines.push("      \\resumeProjectHeading");
    lines.push(
      `          {\\textbf{${esc(proj.name)}}${techStr}}{${esc(dateRange(proj.startDate, proj.endDate))}}`
    );

    const bullets = proj.bullets.filter((b) => b.trim());
    if (bullets.length) {
      lines.push("          \\resumeItemListStart");
      for (const b of bullets) {
        lines.push(`            \\resumeItem{${esc(b)}}`);
      }
      lines.push("          \\resumeItemListEnd");
    }
  }

  lines.push("    \\resumeSubHeadingListEnd");
  lines.push("");
  return lines.join("\n");
}

function buildSkills(skills: Skills): string {
  const rows: string[] = [];
  if (skills.languages.length)
    rows.push(`     \\textbf{Languages}{: ${skills.languages.map(esc).join(", ")}}`);
  if (skills.frameworks.length)
    rows.push(`     \\textbf{Frameworks}{: ${skills.frameworks.map(esc).join(", ")}}`);
  if (skills.tools.length)
    rows.push(`     \\textbf{Developer Tools}{: ${skills.tools.map(esc).join(", ")}}`);
  if (skills.databases.length)
    rows.push(`     \\textbf{Databases}{: ${skills.databases.map(esc).join(", ")}}`);

  if (!rows.length) return "";

  const lines: string[] = [];
  lines.push("%-----------PROGRAMMING SKILLS-----------");
  lines.push("\\section{Technical Skills}");
  lines.push(" \\begin{itemize}[leftmargin=0.15in, label={}]");
  lines.push("    \\small{\\item{");
  lines.push(rows.join(" \\\\\n"));
  lines.push("    }}");
  lines.push(" \\end{itemize}");
  lines.push("");
  return lines.join("\n");
}

function buildAchievements(achievements: string[]): string {
  const filtered = achievements.filter((a) => a.trim());
  if (!filtered.length) return "";

  const lines: string[] = [];
  lines.push("%-----------ACHIEVEMENTS-----------");
  lines.push("\\section{Achievements}");
  lines.push("  \\resumeItemListStart");
  for (const a of filtered) {
    lines.push(`    \\resumeItem{${esc(a)}}`);
  }
  lines.push("  \\resumeItemListEnd");
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main export: fillTemplate
// ---------------------------------------------------------------------------

/**
 * Read the LaTeX template from disk and fill it with resume data.
 * Returns a complete, compilable .tex string.
 */
export function fillTemplate(data: ResumeData): string {
  // Resolve template path relative to this file (src/lib/) → (../../templates/)
  const templatePath = path.resolve(__dirname, "../../templates/resume.tex");
  let template = fs.readFileSync(templatePath, "utf-8");

  const p = data.personalInfo;

  // ----- Header: name -----
  template = template.replace("{{NAME}}", esc(p.name || "Your Name"));

  // ----- Header: address line (only if location exists) -----
  const addressLine = p.location
    ? `${esc(p.location)} \\\\ \\vspace{1pt}\n    `
    : "";
  template = template.replace("{{ADDRESS_LINE}}", addressLine);

  // ----- Header: contact items -----
  const contactItems: string[] = [];
  if (p.phone) contactItems.push(esc(p.phone));
  if (p.email)
    contactItems.push(
      `\\href{mailto:${p.email}}{\\underline{${esc(p.email)}}}`
    );
  if (p.linkedin)
    contactItems.push(
      `\\href{${p.linkedin}}{\\underline{${esc(stripProto(p.linkedin))}}}`
    );
  if (p.github)
    contactItems.push(
      `\\href{${p.github}}{\\underline{${esc(stripProto(p.github))}}}`
    );
  if (p.website)
    contactItems.push(
      `\\href{${p.website}}{\\underline{${esc(stripProto(p.website))}}}`
    );
  template = template.replace(
    "{{CONTACT_LINE}}",
    contactItems.join(" $|$ ")
  );

  // ----- Body sections -----
  const bodySections: string[] = [];
  bodySections.push(buildEducation(data.education));
  bodySections.push(buildExperience(data.experience));
  bodySections.push(buildProjects(data.projects));
  bodySections.push(buildSkills(data.skills));
  if (data.achievements) bodySections.push(buildAchievements(data.achievements));

  template = template.replace("{{BODY}}", bodySections.filter(Boolean).join("\n"));

  return template;
}
