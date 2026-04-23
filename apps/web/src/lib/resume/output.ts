import type { Experience, Project, Resume } from "@resumeai/shared";
import { normalizeSkillsInput } from "@/lib/resume/skills";

const GENERIC_COMPANY_PATTERNS = [
  "freelance",
  "self employed",
  "self-employed",
  "independent",
  "consultant",
  "consulting",
  "contract",
  "contractor",
  "client",
  "confidential",
  "stealth",
  "startup",
  "student",
  "personal",
  "open source",
  "volunteer",
];

const HIGH_SIGNAL_COMPANY_TOKENS = [
  "google",
  "microsoft",
  "amazon",
  "meta",
  "apple",
  "netflix",
  "uber",
  "stripe",
  "airbnb",
  "salesforce",
  "oracle",
  "adobe",
  "atlassian",
  "nvidia",
  "intel",
  "jpmorgan",
  "goldman sachs",
  "morgan stanley",
  "deloitte",
  "accenture",
  "infosys",
  "tcs",
  "wipro",
  "flipkart",
  "swiggy",
  "zomato",
  "razorpay",
  "phonepe",
  "paytm",
  "cred",
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeStringList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = normalizeText(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function dedupeBullets(bullets: string[]): string[] {
  return dedupeStringList(bullets);
}

function chooseLonger(a: string, b: string): string {
  return b.trim().length > a.trim().length ? b : a;
}

function mergeProjects(primary: Project, incoming: Project): Project {
  return {
    ...primary,
    name: chooseLonger(primary.name, incoming.name),
    techStack: dedupeStringList([...(primary.techStack ?? []), ...(incoming.techStack ?? [])]),
    url: primary.url || incoming.url,
    startDate: primary.startDate || incoming.startDate,
    endDate: primary.endDate || incoming.endDate,
    bullets: dedupeBullets([...(primary.bullets ?? []), ...(incoming.bullets ?? [])]),
  };
}

function projectsMatch(a: Project, b: Project): boolean {
  const urlA = normalizeText(a.url);
  const urlB = normalizeText(b.url);
  if (urlA && urlB && urlA === urlB) {
    return true;
  }

  const nameA = normalizeText(a.name);
  const nameB = normalizeText(b.name);
  if (nameA && nameB && nameA === nameB) {
    return true;
  }

  const bulletA = normalizeText((a.bullets ?? [])[0] ?? "");
  const bulletB = normalizeText((b.bullets ?? [])[0] ?? "");
  return Boolean(nameA && bulletA && nameA === nameB && bulletA === bulletB);
}

export function dedupeProjects(projects: Project[]): Project[] {
  const deduped: Project[] = [];

  for (const project of projects) {
    const normalized: Project = {
      ...project,
      techStack: dedupeStringList(project.techStack ?? []),
      bullets: dedupeBullets(project.bullets ?? []),
    };

    if (
      !normalized.name.trim() &&
      !normalized.url.trim() &&
      normalized.techStack.length === 0 &&
      normalized.bullets.length === 0
    ) {
      continue;
    }

    const existingIndex = deduped.findIndex((candidate) => projectsMatch(candidate, normalized));
    if (existingIndex >= 0) {
      deduped[existingIndex] = mergeProjects(deduped[existingIndex], normalized);
      continue;
    }

    deduped.push(normalized);
  }

  return deduped;
}

function dedupeExperienceBullets(experience: Experience[]): Experience[] {
  return experience.map((entry) => ({
    ...entry,
    bullets: dedupeBullets(entry.bullets ?? []),
  }));
}

function dedupeSkills(resume: Resume): Resume {
  return {
    ...resume,
    skills: normalizeSkillsInput({
      languages: dedupeStringList(resume.skills.languages ?? []),
      frameworks: dedupeStringList(resume.skills.frameworks ?? []),
      tools: dedupeStringList(resume.skills.tools ?? []),
      databases: dedupeStringList(resume.skills.databases ?? []),
    }),
  };
}

function sanitizeResume(resume: Resume): Resume {
  const sanitized = dedupeSkills({
    ...resume,
    experience: dedupeExperienceBullets(resume.experience ?? []).filter(
      (entry) =>
        entry.company.trim() ||
        entry.title.trim() ||
        entry.location.trim() ||
        entry.startDate.trim() ||
        entry.endDate.trim() ||
        entry.bullets.length > 0,
    ),
    education: (resume.education ?? []).filter(
      (entry) =>
        entry.institution.trim() ||
        entry.degree.trim() ||
        entry.field.trim() ||
        entry.location.trim() ||
        entry.startDate.trim() ||
        entry.endDate.trim() ||
        entry.gpa.trim(),
    ),
    projects: dedupeProjects(resume.projects ?? []),
    achievements: dedupeStringList(resume.achievements ?? []),
  });

  return sanitized;
}

function bulletUnits(bullet: string): number {
  const wordCount = bullet.trim().split(/\s+/).filter(Boolean).length;
  return 0.72 + Math.max(0, wordCount - 16) * 0.03;
}

export function estimateResumePages(resume: Resume): number {
  const sanitized = sanitizeResume(resume);
  let units = 4.2;

  if (sanitized.summary.trim()) {
    const summaryWords = sanitized.summary.trim().split(/\s+/).filter(Boolean).length;
    units += 1.1 + summaryWords * 0.025;
  }

  if (sanitized.education.length > 0) {
    units += 0.9 + sanitized.education.length * 1.2;
  }

  for (const entry of sanitized.experience) {
    units += 1.25;
    units += entry.bullets.reduce((sum, bullet) => sum + bulletUnits(bullet), 0);
  }

  for (const project of sanitized.projects) {
    units += 1.0;
    units += project.bullets.reduce((sum, bullet) => sum + bulletUnits(bullet), 0);
  }

  const skillLines = [
    sanitized.skills.languages,
    sanitized.skills.frameworks,
    sanitized.skills.tools,
    sanitized.skills.databases,
  ].filter((values) => values.length > 0).length;

  if (skillLines > 0) {
    units += 0.85 + skillLines * 0.7;
  }

  if (sanitized.achievements.length > 0) {
    units += 0.8 + sanitized.achievements.reduce((sum, bullet) => sum + bulletUnits(bullet), 0);
  }

  return Number((units / 32).toFixed(2));
}

function parseResumeDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "present") {
    return trimmed ? new Date() : null;
  }
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}-01T00:00:00Z`);
  }
  if (/^\d{4}$/.test(trimmed)) {
    return new Date(`${trimmed}-01-01T00:00:00Z`);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthsSince(date: Date | null): number {
  if (!date) {
    return 0;
  }

  const now = new Date();
  return Math.max(
    0,
    (now.getUTCFullYear() - date.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - date.getUTCMonth()),
  );
}

function companySignalScore(company: string): number {
  const normalized = normalizeText(company);
  if (!normalized) {
    return 0;
  }

  if (HIGH_SIGNAL_COMPANY_TOKENS.some((token) => normalized.includes(token))) {
    return 4.5;
  }

  if (GENERIC_COMPANY_PATTERNS.some((token) => normalized.includes(token))) {
    return 0.75;
  }

  const words = normalized.split(" ").filter(Boolean);
  if (words.length >= 3) {
    return 3.1;
  }

  if (words.length >= 1) {
    return 2.5;
  }

  return 1.5;
}

function recencyScore(entry: Experience): number {
  const normalizedEnd = entry.endDate.trim().toLowerCase();
  if (normalizedEnd === "present") {
    return 3.2;
  }

  const months = monthsSince(parseResumeDate(entry.endDate));
  if (months <= 12) return 2.7;
  if (months <= 24) return 2.1;
  if (months <= 48) return 1.4;
  return 0.8;
}

function titleStrengthScore(title: string): number {
  const normalized = normalizeText(title);
  if (!normalized) {
    return 0.4;
  }

  if (
    normalized.includes("staff") ||
    normalized.includes("principal") ||
    normalized.includes("head") ||
    normalized.includes("manager") ||
    normalized.includes("lead") ||
    normalized.includes("founder")
  ) {
    return 2.6;
  }

  if (normalized.includes("senior")) {
    return 2.2;
  }

  if (
    normalized.includes("engineer") ||
    normalized.includes("developer") ||
    normalized.includes("scientist") ||
    normalized.includes("architect") ||
    normalized.includes("analyst")
  ) {
    return 1.7;
  }

  if (
    normalized.includes("intern") ||
    normalized.includes("trainee") ||
    normalized.includes("apprentice")
  ) {
    return 0.7;
  }

  return 1.1;
}

function bulletStrengthScore(entry: Experience): number {
  const bullets = entry.bullets.filter((bullet) => bullet.trim());
  const quantified = bullets.filter((bullet) => /\d/.test(bullet)).length;
  return bullets.length * 0.45 + quantified * 0.35;
}

function experienceStrengthScore(entry: Experience): number {
  return (
    companySignalScore(entry.company) * 1.8 +
    recencyScore(entry) * 1.3 +
    titleStrengthScore(entry.title) +
    bulletStrengthScore(entry)
  );
}

function weakestExperienceIndex(
  experiences: Experience[],
  predicate: (entry: Experience) => boolean,
): number {
  let weakestIndex = -1;
  let weakestScore = Number.POSITIVE_INFINITY;

  experiences.forEach((entry, index) => {
    if (!predicate(entry)) {
      return;
    }

    const score = experienceStrengthScore(entry);
    if (score < weakestScore) {
      weakestScore = score;
      weakestIndex = index;
      return;
    }

    if (score === weakestScore && index > weakestIndex) {
      weakestIndex = index;
    }
  });

  return weakestIndex;
}

function totalExperienceYears(resume: Resume): number {
  const totalMonths = (resume.experience ?? []).reduce((months, entry) => {
    const start = parseResumeDate(entry.startDate);
    const end = parseResumeDate(entry.endDate);
    if (!start || !end || end < start) {
      return months;
    }

    const diffMonths =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth());

    return months + Math.max(1, diffMonths);
  }, 0);

  return totalMonths / 12;
}

export function shouldOfferTwoPageResume(resume: Resume): boolean {
  const sanitized = sanitizeResume(resume);
  const estimatedPages = estimateResumePages(sanitized);
  const experienceCount = sanitized.experience.length;
  const projectCount = sanitized.projects.length;
  const achievementCount = sanitized.achievements.length;
  const totalBullets =
    sanitized.experience.reduce((sum, entry) => sum + entry.bullets.length, 0) +
    sanitized.projects.reduce((sum, entry) => sum + entry.bullets.length, 0) +
    achievementCount;
  const years = totalExperienceYears(sanitized);

  const strongSignalProfile =
    (experienceCount >= 4 && totalBullets >= 16) ||
    (years >= 5 && totalBullets >= 14) ||
    (achievementCount >= 5 && (experienceCount >= 3 || projectCount >= 3));

  return estimatedPages > 1.15 && strongSignalProfile;
}

function trimSummary(summary: string): string {
  const trimmed = summary.trim();
  if (!trimmed) return "";

  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const firstTwo = sentences.slice(0, 2).join(" ");
  const words = firstTwo.split(/\s+/).filter(Boolean);
  if (words.length <= 40) {
    return firstTwo;
  }
  return `${words.slice(0, 40).join(" ")}…`;
}

function trimSkillCategory(values: string[], limit: number): string[] {
  return values.slice(0, limit);
}

function trimProjectBullets(resume: Resume, minBullets: number): boolean {
  for (let index = resume.projects.length - 1; index >= 0; index -= 1) {
    const project = resume.projects[index];
    if (project.bullets.length > minBullets) {
      project.bullets = project.bullets.slice(0, project.bullets.length - 1);
      return true;
    }
  }
  return false;
}

function trimExperienceBullets(resume: Resume, minBullets: number): boolean {
  const index = weakestExperienceIndex(
    resume.experience,
    (entry) => entry.bullets.length > minBullets,
  );
  if (index >= 0) {
    const experience = resume.experience[index];
    experience.bullets = experience.bullets.slice(0, experience.bullets.length - 1);
    return true;
  }
  return false;
}

function dropTrailingProject(resume: Resume, minProjects: number): boolean {
  if (resume.projects.length > minProjects) {
    resume.projects = resume.projects.slice(0, resume.projects.length - 1);
    return true;
  }
  return false;
}

function dropWeakestExperience(resume: Resume, minExperience: number): boolean {
  if (resume.experience.length > minExperience) {
    const index = weakestExperienceIndex(resume.experience, () => true);
    if (index >= 0) {
      resume.experience = resume.experience.filter((_, entryIndex) => entryIndex !== index);
      return true;
    }
  }
  return false;
}

function dropTrailingAchievement(resume: Resume): boolean {
  if (resume.achievements.length > 2) {
    resume.achievements = resume.achievements.slice(0, resume.achievements.length - 1);
    return true;
  }
  return false;
}

function keepBestExperiences(resume: Resume, count: number): void {
  if (resume.experience.length <= count) {
    return;
  }

  const ranked = resume.experience
    .map((entry, index) => ({ entry, index, score: experienceStrengthScore(entry) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, count)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.entry);

  resume.experience = ranked;
}

function keepBestProjects(resume: Resume, count: number): void {
  if (resume.projects.length <= count) {
    return;
  }

  const ranked = resume.projects
    .map((project, index) => ({
      project,
      index,
      score:
        project.bullets.filter((bullet) => bullet.trim()).length * 1.2 +
        project.techStack.length * 0.3 +
        (project.url.trim() ? 0.8 : 0),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, count)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.project);

  resume.projects = ranked;
}

function constrainSectionsForOnePage(resume: Resume): void {
  keepBestExperiences(resume, 4);
  keepBestProjects(resume, 3);

  resume.experience = resume.experience.map((entry) => ({
    ...entry,
    bullets: entry.bullets.slice(0, 3),
  }));
  resume.projects = resume.projects.map((project) => ({
    ...project,
    bullets: project.bullets.slice(0, 2),
  }));
  resume.achievements = resume.achievements.slice(0, 4);
}

export function prepareResumeForOutput(
  resume: Resume,
  options?: { maxPages?: 1 | 2 },
): Resume {
  const maxPages = options?.maxPages ?? 1;
  const shaped = sanitizeResume(JSON.parse(JSON.stringify(resume)) as Resume);

  shaped.summary = trimSummary(shaped.summary);

  if (maxPages > 1) {
    return shaped;
  }

  shaped.skills.languages = trimSkillCategory(shaped.skills.languages, 6);
  shaped.skills.frameworks = trimSkillCategory(shaped.skills.frameworks, 6);
  shaped.skills.tools = trimSkillCategory(shaped.skills.tools, 8);
  shaped.skills.databases = trimSkillCategory(shaped.skills.databases, 5);
  constrainSectionsForOnePage(shaped);

  while (estimateResumePages(shaped) > 1) {
    const changed =
      dropTrailingAchievement(shaped) ||
      trimProjectBullets(shaped, 1) ||
      dropTrailingProject(shaped, 2) ||
      trimExperienceBullets(shaped, 2) ||
      trimExperienceBullets(shaped, 1) ||
      dropTrailingProject(shaped, 1) ||
      dropWeakestExperience(shaped, 3);

    if (!changed) {
      break;
    }
  }

  return shaped;
}
