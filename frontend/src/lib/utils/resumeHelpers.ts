import type { Resume } from "@resumeai/shared";

export function resumeToPlainText(resume: Resume): string {
  const lines: string[] = [];
  const { personalInfo: p } = resume;

  lines.push(p.name);
  const contact = [p.phone, p.email, p.linkedin, p.github, p.website]
    .filter(Boolean)
    .join(" | ");
  if (contact) lines.push(contact);
  lines.push("");

  if (resume.summary) {
    lines.push("SUMMARY");
    lines.push(resume.summary);
    lines.push("");
  }

  if (resume.education.length > 0) {
    lines.push("EDUCATION");
    for (const edu of resume.education) {
      lines.push(
        `${edu.institution} — ${edu.degree} in ${edu.field} (${edu.startDate} - ${edu.endDate})`
      );
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
    }
    lines.push("");
  }

  if (resume.experience.length > 0) {
    lines.push("EXPERIENCE");
    for (const exp of resume.experience) {
      lines.push(
        `${exp.company} — ${exp.title} (${exp.startDate} - ${exp.endDate})`
      );
      for (const b of exp.bullets) {
        if (b) lines.push(`• ${b}`);
      }
    }
    lines.push("");
  }

  if (resume.projects.length > 0) {
    lines.push("PROJECTS");
    for (const proj of resume.projects) {
      lines.push(
        `${proj.name} | ${proj.techStack.join(", ")} (${proj.startDate} - ${proj.endDate})`
      );
      for (const b of proj.bullets) {
        if (b) lines.push(`• ${b}`);
      }
    }
    lines.push("");
  }

  if (
    resume.skills.languages.length > 0 ||
    resume.skills.frameworks.length > 0 ||
    resume.skills.tools.length > 0 ||
    resume.skills.databases.length > 0
  ) {
    lines.push("TECHNICAL SKILLS");
    if (resume.skills.languages.length)
      lines.push(`Languages: ${resume.skills.languages.join(", ")}`);
    if (resume.skills.frameworks.length)
      lines.push(`Frameworks: ${resume.skills.frameworks.join(", ")}`);
    if (resume.skills.tools.length)
      lines.push(`Platforms & Concepts: ${resume.skills.tools.join(", ")}`);
    if (resume.skills.databases.length)
      lines.push(`Databases: ${resume.skills.databases.join(", ")}`);
  }

  return lines.join("\n");
}

export function formatDate(date: string): string {
  if (!date) return "";
  if (date.toLowerCase() === "present") return "Present";
  return date;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
