import { z } from "zod";

export const RewriteRequestSchema = z.object({
  bullet: z.string().min(1),
  mode: z.enum(["stronger", "metrics", "concise", "different"]),
  jobDescription: z.string().optional(),
  context: z.string().optional(),
});

export const TailorRequestSchema = z.object({
  resumeId: z.string(),
  jobDescription: z.string().min(10),
});

export const GitHubImportSchema = z.object({
  username: z.string().min(1),
});

export const LeetCodeImportSchema = z.object({
  username: z.string().min(1),
});

export const CodeforcesImportSchema = z.object({
  handle: z.string().min(1),
});

export const LinkedInImportSchema = z.object({
  profileUrl: z.string().url().refine(
    (url) => url.includes("linkedin.com/in/"),
    { message: "Must be a valid LinkedIn profile URL" }
  ),
});
