export interface TailorResponse {
  missingKeywords: string[];
  suggestedChanges: {
    section: string;
    original: string;
    suggested: string;
    reason: string;
  }[];
  overallMatch: number;
  atsScore: number;
}

export interface GitHubProject {
  name: string;
  description: string;
  techStack: string[];
  highlights: string[];
  url: string;
  stars: number;
}

export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number;
  topPercentage: number;
  badges: string[];
}

export interface CodeforcesStats {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
}

export interface RewriteRequest {
  bullet: string;
  mode: "stronger" | "metrics" | "concise" | "different";
  jobDescription?: string;
  context?: string;
}

export interface TailorRequest {
  resumeId: string;
  jobDescription: string;
}

export interface GitHubImportRequest {
  username: string;
}

export interface LeetCodeImportRequest {
  username: string;
}

export interface CodeforcesImportRequest {
  handle: string;
}
