export function generateLaTeX(resume: {
  personalInfo: { name: string; email: string; phone: string; linkedin: string; github: string };
  education: { institution: string; degree: string; field: string; location: string; startDate: string; endDate: string; gpa: string; coursework: string[] }[];
  experience: { company: string; title: string; location: string; startDate: string; endDate: string; bullets: string[] }[];
  projects: { name: string; techStack: string[]; startDate: string; endDate: string; bullets: string[] }[];
  skills: { languages: string[]; frameworks: string[]; tools: string[]; databases: string[] };
}): string {
  const { personalInfo: p, education, experience, projects, skills } = resume;

  const escapeLatex = (s: string) =>
    s.replace(/[&%$#_{}~^\\]/g, (m) => `\\${m}`);

  const e = (s: string) => escapeLatex(s);
  const stripProtocol = (s: string) => s.replace("https://", "").replace("http://", "");

  const lines: string[] = [];

  lines.push("\\documentclass[letterpaper,11pt]{article}");
  lines.push("\\usepackage[utf8]{inputenc}");
  lines.push("\\usepackage{latexsym}");
  lines.push("\\usepackage[empty]{fullpage}");
  lines.push("\\usepackage{titlesec}");
  lines.push("\\usepackage[usenames,dvipsnames]{color}");
  lines.push("\\usepackage{enumitem}");
  lines.push("\\usepackage[hidelinks]{hyperref}");
  lines.push("\\usepackage{fancyhdr}");
  lines.push("\\usepackage{tabularx}");
  lines.push("");
  lines.push("\\pagestyle{fancy}");
  lines.push("\\fancyhf{}");
  lines.push("\\renewcommand{\\headrulewidth}{0pt}");
  lines.push("\\setlength{\\tabcolsep}{0in}");
  lines.push("");
  lines.push("\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]");
  lines.push("");
  lines.push("\\begin{document}");
  lines.push("");
  lines.push("\\begin{center}");
  lines.push(`  \\textbf{\\Huge \\scshape ${e(p.name)}} \\\\ \\vspace{1pt}`);
  lines.push(`  \\small ${e(p.phone)} $|$ \\href{mailto:${p.email}}{\\underline{${e(p.email)}}} $|$ \\href{${p.linkedin}}{\\underline{${e(stripProtocol(p.linkedin))}}} $|$ \\href{${p.github}}{\\underline{${e(stripProtocol(p.github))}}}`);
  lines.push("\\end{center}");
  lines.push("");

  if (education.length > 0) {
    lines.push("\\section{Education}");
    lines.push("\\resumeSubHeadingListStart");
    for (const edu of education) {
      lines.push(`  \\resumeSubheading{${e(edu.institution)}}{${e(edu.startDate)} -- ${e(edu.endDate)}}{${e(edu.degree)} in ${e(edu.field)}${edu.gpa ? ", GPA: " + e(edu.gpa) : ""}}{${e(edu.location)}}`);
    }
    lines.push("\\resumeSubHeadingListEnd");
    lines.push("");
  }

  if (experience.length > 0) {
    lines.push("\\section{Experience}");
    lines.push("\\resumeSubHeadingListStart");
    for (const exp of experience) {
      lines.push(`  \\resumeSubheading{${e(exp.title)}}{${e(exp.startDate)} -- ${e(exp.endDate)}}{${e(exp.company)}}{${e(exp.location)}}`);
      lines.push("  \\resumeItemListStart");
      for (const bullet of exp.bullets) {
        if (bullet) lines.push(`    \\resumeItem{${e(bullet)}}`);
      }
      lines.push("  \\resumeItemListEnd");
    }
    lines.push("\\resumeSubHeadingListEnd");
    lines.push("");
  }

  if (projects.length > 0) {
    lines.push("\\section{Projects}");
    lines.push("\\resumeSubHeadingListStart");
    for (const proj of projects) {
      lines.push(`  \\resumeProjectHeading{\\textbf{${e(proj.name)}} $|$ \\emph{${proj.techStack.map(e).join(", ")}}}{${e(proj.startDate)} -- ${e(proj.endDate)}}`);
      lines.push("  \\resumeItemListStart");
      for (const bullet of proj.bullets) {
        if (bullet) lines.push(`    \\resumeItem{${e(bullet)}}`);
      }
      lines.push("  \\resumeItemListEnd");
    }
    lines.push("\\resumeSubHeadingListEnd");
    lines.push("");
  }

  lines.push("\\section{Technical Skills}");
  lines.push("\\begin{itemize}[leftmargin=0.15in, label={}]");
  lines.push("  \\small{\\item{");
  if (skills.languages.length) lines.push(`    \\textbf{Languages}{: ${skills.languages.map(e).join(", ")}} \\\\`);
  if (skills.frameworks.length) lines.push(`    \\textbf{Frameworks}{: ${skills.frameworks.map(e).join(", ")}} \\\\`);
  if (skills.tools.length) lines.push(`    \\textbf{Developer Tools}{: ${skills.tools.map(e).join(", ")}} \\\\`);
  if (skills.databases.length) lines.push(`    \\textbf{Databases}{: ${skills.databases.map(e).join(", ")}}`);
  lines.push("  }}");
  lines.push("\\end{itemize}");
  lines.push("");
  lines.push("\\end{document}");

  return lines.join("\n");
}
