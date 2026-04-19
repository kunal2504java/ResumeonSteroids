import { Hono } from "hono";
import { rewriteRoute } from "./rewrite";
import { tailorRoute } from "./tailor";
import { githubImportRoute } from "./import/github";
import { leetcodeImportRoute } from "./import/leetcode";
import { codeforcesImportRoute } from "./import/codeforces";
import { resumeImportRoute } from "./import/resume";
import { linkedinImportRoute } from "./import/linkedin";
import { enrichExperienceRoute } from "./enrich-experience";

const aiRoutes = new Hono();

aiRoutes.route("/rewrite", rewriteRoute);
aiRoutes.route("/tailor", tailorRoute);
aiRoutes.route("/import/github", githubImportRoute);
aiRoutes.route("/import/leetcode", leetcodeImportRoute);
aiRoutes.route("/import/codeforces", codeforcesImportRoute);
aiRoutes.route("/import/resume", resumeImportRoute);
aiRoutes.route("/import/linkedin", linkedinImportRoute);
aiRoutes.route("/enrich-experience", enrichExperienceRoute);

export { aiRoutes };
