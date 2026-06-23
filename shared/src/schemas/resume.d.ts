import { z } from "zod";
export declare const RewriteRequestSchema: z.ZodObject<{
    bullet: z.ZodString;
    mode: z.ZodEnum<{
        stronger: "stronger";
        metrics: "metrics";
        concise: "concise";
        different: "different";
    }>;
    jobDescription: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const TailorRequestSchema: z.ZodObject<{
    resumeId: z.ZodString;
    jobDescription: z.ZodString;
}, z.core.$strip>;
export declare const GitHubImportSchema: z.ZodObject<{
    username: z.ZodString;
}, z.core.$strip>;
export declare const LeetCodeImportSchema: z.ZodObject<{
    username: z.ZodString;
}, z.core.$strip>;
export declare const CodeforcesImportSchema: z.ZodObject<{
    handle: z.ZodString;
}, z.core.$strip>;
export declare const LinkedInImportSchema: z.ZodObject<{
    profileUrl: z.ZodString;
}, z.core.$strip>;
