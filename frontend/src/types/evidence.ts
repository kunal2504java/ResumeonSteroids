export type EvidenceGrade = "A" | "B" | "C" | "D" | "F";

export interface EvidenceCategoryScore {
  score: number;
  max: number;
  evidence: string;
}

export interface EvidenceReport {
  scores: {
    open_source: EvidenceCategoryScore;
    self_projects: EvidenceCategoryScore;
    production: EvidenceCategoryScore;
    technical_skills: EvidenceCategoryScore;
  };
  bonus: { total: number; breakdown: string };
  deductions: { total: number; reasons: string };
  key_strengths: string[];
  areas_for_improvement: string[];
  total_score: number;
  grade: EvidenceGrade;
  grounding: {
    github: boolean;
    leetcode: boolean;
    codeforces: boolean;
    notes: string[];
  };
}
