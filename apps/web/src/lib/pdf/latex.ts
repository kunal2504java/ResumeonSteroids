/**
 * Client-side LaTeX generator for "Copy LaTeX" functionality.
 * Outputs a complete .tex file using Jake's Resume template that
 * compiles correctly in Overleaf / pdflatex.
 *
 * This mirrors apps/api/src/lib/fillTemplate.ts exactly so the
 * output matches what the server-side compilation produces.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location?: string;
  linkedin: string;
  github: string;
  website?: string;
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

interface Experience {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
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

// ---------------------------------------------------------------------------
// Helpers
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

function esc(text: string): string {
  if (!text) return "";
  return text.replace(/[\\{}$&#%_~^]/g, (ch) => LATEX_SPECIAL[ch] ?? ch);
}

function stripProto(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "");
}

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
  return date;
}

function dateRange(start: string, end: string): string {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (!s && !e) return "";
  if (!e || e.toLowerCase() === "present") return `${s} -- Present`;
  return `${s} -- ${e}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function generateLaTeX(resume: {
  personalInfo: PersonalInfo;
  summary?: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skills;
  achievements?: string[];
}): string {
  const { personalInfo: p, education, experience, projects, skills } = resume;
  const L: string[] = []; // output lines

  // ======================== PREAMBLE ========================
  L.push(`%-------------------------
% Resume in LaTeX
% Based on: Jake Gutierrez's template
% License: MIT
%-------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
\\begin{document}`);

  // ======================== HEADING ========================
  L.push("");
  L.push("\\begin{center}");
  L.push(`    \\textbf{\\Huge \\scshape ${esc(p.name || "Your Name")}} \\\\ \\vspace{1pt}`);

  if (p.location) {
    L.push(`    ${esc(p.location)} \\\\ \\vspace{1pt}`);
  }

  const contact: string[] = [];
  if (p.phone) contact.push(esc(p.phone));
  if (p.email) contact.push(`\\href{mailto:${p.email}}{\\underline{${esc(p.email)}}}`);
  if (p.linkedin) contact.push(`\\href{${p.linkedin}}{\\underline{${esc(stripProto(p.linkedin))}}}`);
  if (p.github) contact.push(`\\href{${p.github}}{\\underline{${esc(stripProto(p.github))}}}`);
  if (p.website) contact.push(`\\href{${p.website}}{\\underline{${esc(stripProto(p.website))}}}`);
  L.push(`    \\small ${contact.join(" $|$ ")}`);
  L.push("\\end{center}");

  // ======================== EDUCATION ========================
  if (education.length > 0) {
    L.push("");
    L.push("\\section{Education}");
    L.push("  \\resumeSubHeadingListStart");
    for (const edu of education) {
      const deg = `${esc(edu.degree)}${edu.field ? " in " + esc(edu.field) : ""}${edu.gpa ? ", GPA: " + esc(edu.gpa) : ""}`;
      L.push("    \\resumeSubheading");
      L.push(`      {${esc(edu.institution)}}{${esc(edu.location)}}`);
      L.push(`      {${deg}}{${esc(dateRange(edu.startDate, edu.endDate))}}`);
    }
    L.push("  \\resumeSubHeadingListEnd");
  }

  // ======================== EXPERIENCE ========================
  if (experience.length > 0) {
    L.push("");
    L.push("\\section{Experience}");
    L.push("  \\resumeSubHeadingListStart");
    for (const exp of experience) {
      L.push("");
      L.push("    \\resumeSubheading");
      L.push(`      {${esc(exp.company)}}{${esc(dateRange(exp.startDate, exp.endDate))}}`);
      L.push(`      {${esc(exp.title)}}{${esc(exp.location)}}`);
      const bullets = exp.bullets.filter((b) => b.trim());
      if (bullets.length) {
        L.push("      \\resumeItemListStart");
        for (const b of bullets) L.push(`        \\resumeItem{${esc(b)}}`);
        L.push("      \\resumeItemListEnd");
      }
    }
    L.push("");
    L.push("  \\resumeSubHeadingListEnd");
  }

  // ======================== PROJECTS ========================
  if (projects.length > 0) {
    L.push("");
    L.push("\\section{Projects}");
    L.push("    \\resumeSubHeadingListStart");
    for (const proj of projects) {
      const tech = proj.techStack.length
        ? ` $|$ \\emph{${proj.techStack.map(esc).join(", ")}}`
        : "";
      L.push("      \\resumeProjectHeading");
      L.push(`          {\\textbf{${esc(proj.name)}}${tech}}{${esc(dateRange(proj.startDate, proj.endDate))}}`);
      const bullets = proj.bullets.filter((b) => b.trim());
      if (bullets.length) {
        L.push("          \\resumeItemListStart");
        for (const b of bullets) L.push(`            \\resumeItem{${esc(b)}}`);
        L.push("          \\resumeItemListEnd");
      }
    }
    L.push("    \\resumeSubHeadingListEnd");
  }

  // ======================== TECHNICAL SKILLS ========================
  const skillRows: string[] = [];
  if (skills.languages.length)
    skillRows.push(`     \\textbf{Languages}{: ${skills.languages.map(esc).join(", ")}}`);
  if (skills.frameworks.length)
    skillRows.push(`     \\textbf{Frameworks}{: ${skills.frameworks.map(esc).join(", ")}}`);
  if (skills.tools.length)
    skillRows.push(`     \\textbf{Developer Tools}{: ${skills.tools.map(esc).join(", ")}}`);
  if (skills.databases.length)
    skillRows.push(`     \\textbf{Databases}{: ${skills.databases.map(esc).join(", ")}}`);

  if (skillRows.length) {
    L.push("");
    L.push("\\section{Technical Skills}");
    L.push(" \\begin{itemize}[leftmargin=0.15in, label={}]");
    L.push("    \\small{\\item{");
    L.push(skillRows.join(" \\\\\n"));
    L.push("    }}");
    L.push(" \\end{itemize}");
  }

  // ======================== ACHIEVEMENTS ========================
  const achievements = (resume.achievements ?? []).filter((a) => a.trim());
  if (achievements.length) {
    L.push("");
    L.push("\\section{Achievements}");
    L.push("  \\resumeItemListStart");
    for (const a of achievements) L.push(`    \\resumeItem{${esc(a)}}`);
    L.push("  \\resumeItemListEnd");
  }

  L.push("");
  L.push("\\end{document}");

  return L.join("\n");
}
