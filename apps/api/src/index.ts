import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { aiRoutes } from "./routes/ai";
import { resumeRoutes } from "./routes/resume";
import { pdfExportRoute } from "./routes/export/pdf";
import { latexExportRoute } from "./routes/export/latex";
import { buildResumeRoute } from "./routes/build-resume";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  })
);

app.route("/api/ai", aiRoutes);
app.route("/api/resume", resumeRoutes);
app.route("/api/export/pdf", pdfExportRoute);
app.route("/api/export/latex", latexExportRoute);
app.route("/api/build-resume", buildResumeRoute);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API running on http://localhost:${info.port}`);
});
