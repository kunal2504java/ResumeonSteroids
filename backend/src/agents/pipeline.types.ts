/**
 * pipeline.types.ts
 *
 * Shared type definitions for the multi-agent resume pipeline.
 * Each agent produces a typed output that becomes the next agent's input.
 *
 * Data Sources → [Agent 1] → [Agent 2] → [Agent 3] → [Agent 4] → PDF
 */

// ---------------------------------------------------------------------------
// Source types — what the user provides to kick off the pipeline
// ---------------------------------------------------------------------------

export type SourceType = "github" | "leetcode" | "codeforces" | "linkedin" | "resume";

export interface PipelineInput {
  /** Which sources to collect from */
  sources: {
    github?: { username: string };
    leetcode?: { username: string };
    codeforces?: { handle: string };
    linkedin?: { profileUrl: string };
    resume?: { fileBase64: string; mimeType: string; fileName: string };
  };
  /** Optional job description for ATS optimization (Agent 3) */
  jobDescription?: string;
}

// ---------------------------------------------------------------------------
// Agent 1 output — Normalized data from all sources (single Claude call)
// ---------------------------------------------------------------------------

/** Personal info extracted and merged across all sources */
export interface NormalizedPersonal {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
}

/** A single education entry */
export interface NormalizedEducation {
  institution: string;
  degree: string;
  dates: string;
  location: string;
  gpa: string;
}

/** A single work experience entry */
export interface NormalizedExperience {
  company: string;
  title: string;
  location: string;
  dates: string;
  bullets: string[];
}

/** A single project entry */
export interface NormalizedProject {
  name: string;
  techStack: string;
  date: string;
  bullets: string[];
  url: string;
  stars: number;
}

/** Skills categorized by domain */
export interface NormalizedSkills {
  languages: string[];
  backend: string[];
  frontend: string[];
  databases: string[];
  devops: string[];
  other: string[];
}

/** Competitive programming stats */
export interface NormalizedCompetitive {
  leetcode: {
    solved: number;
    rating: number;
    rank: string;
  };
  codeforces: {
    rating: number;
    rank: string;
  };
}

/**
 * Agent 1 output — the unified, Claude-normalized data bundle passed to Agent 2.
 * Produced by a single Claude call that merges and deduplicates all raw source data.
 */
export interface NormalizedData {
  personal: NormalizedPersonal;
  education: NormalizedEducation[];
  experience: NormalizedExperience[];
  projects: NormalizedProject[];
  skills: NormalizedSkills;
  competitive: NormalizedCompetitive;
}

/**
 * Full Agent 1 output — normalized data + source collection status.
 */
export interface Agent1Output {
  data: NormalizedData;
  /** Track which sources succeeded/failed during collection */
  sourcesStatus: Record<SourceType, { ok: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Agent 2 output — Rewritten, optimized resume content
// ---------------------------------------------------------------------------

/**
 * Agent 2 output — same NormalizedData schema but with professionally
 * rewritten content: stronger action verbs, quantified metrics,
 * ATS-optimized bullets, and curated project descriptions.
 *
 * Agent 2 is THE key agent. It transforms raw normalized data into
 * resume-ready content that beats tools like ResumeWorded.
 */
export interface Agent2Output {
  data: NormalizedData;
  /** The job description used for tailoring (if provided) */
  jobDescription?: string;
}

// ---------------------------------------------------------------------------
// Agent 3 output — ATS scoring & actionable feedback
// ---------------------------------------------------------------------------

/** A single issue found during ATS analysis */
export interface ScoringIssue {
  severity: "high" | "medium" | "low";
  section: string;
  message: string;
  fix: string;
}

/**
 * Agent 3 output — ATS scoring, impact analysis, and actionable feedback.
 * Tells the user exactly how strong their resume is and what to fix.
 */
export interface Agent3Output {
  /** Overall resume quality score (0-100) */
  overallScore: number;
  /** ATS parse-ability and keyword match score (0-100) */
  atsScore: number;
  /** Impact and achievement quantification score (0-100) */
  impactScore: number;
  /** Writing clarity and readability score (0-100) */
  clarityScore: number;
  /** Specific issues found, ordered by severity */
  issues: ScoringIssue[];
  /** Top strengths of the resume */
  strengths: string[];
  /** Keywords from job description found in resume (if JD provided) */
  keywordsMatched: string[];
  /** Keywords from job description missing from resume (if JD provided) */
  keywordsMissing: string[];
  /** Whether the resume is strong enough to submit as-is */
  readyToApply: boolean;
}

// ---------------------------------------------------------------------------
// Agent 4 output — LaTeX formatted resume → compiled PDF
// ---------------------------------------------------------------------------

/**
 * Agent 4 output — the final compiled PDF buffer and the LaTeX source.
 */
export interface Agent4Output {
  /** Compiled PDF as a Buffer (base64-encode for JSON transport) */
  pdfBuffer: Buffer;
  /** The filled LaTeX source (for debugging or user download) */
  texSource: string;
}

// ---------------------------------------------------------------------------
// Full pipeline output — everything returned to the client
// ---------------------------------------------------------------------------

/**
 * The complete pipeline result returned by the master orchestrator.
 * Contains the scoring feedback, the rewritten resume data, and the PDF.
 */
export interface PipelineResult {
  /** ATS scoring and feedback from Agent 3 */
  score: Agent3Output;
  /** The rewritten, optimized resume data from Agent 2 */
  resumeData: NormalizedData;
  /** Compiled PDF as base64 string */
  pdf: string;
}
