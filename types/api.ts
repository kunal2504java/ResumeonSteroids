import { z } from "zod";

export const RewriteRequestSchema = z.object({
  bullet: z.string().min(1),
  mode: z.enum(["stronger", "metrics", "concise", "different"]),
  jobDescription: z.string().optional(),
  context: z.string().optional(),
});

export type RewriteRequest = z.infer<typeof RewriteRequestSchema>;

export const TailorRequestSchema = z.object({
  resumeId: z.string(),
  jobDescription: z.string().min(10),
});

export type TailorRequest = z.infer<typeof TailorRequestSchema>;

export const GitHubImportSchema = z.object({
  username: z.string().min(1),
});

export const LeetCodeImportSchema = z.object({
  username: z.string().min(1),
});

export const CodeforcesImportSchema = z.object({
  handle: z.string().min(1),
});

export interface TailorResponse {
  missingKeywords: string[];
  suggestedChanges: { section: string; original: string; suggested: string; reason: string }[];
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
