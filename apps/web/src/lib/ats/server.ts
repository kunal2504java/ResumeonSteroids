import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import type { Resume } from "@resumeai/shared";
import { generateLaTeX } from "@/lib/pdf/latex";
import type { ATSFixResponse, ATSReport, ATSRuleInfo } from "@/types/ats";

interface BridgeSimulationResult {
  report: ATSReport;
  ats_keywords: string[];
}

interface ATSSnapshot {
  run_id: string;
  assembled_resume: Resume;
  latex_source: string;
  job_description: string;
  ats_keywords: string[];
  max_pages: number;
  report: ATSReport;
}

export interface SimulationInput {
  run_id: string;
  assembled_resume: Resume;
  job_description: string;
  latex_source?: string;
  max_pages?: number;
}

function isRoot(dir: string): boolean {
  return path.dirname(dir) === dir;
}

export async function findRepoRoot(start = process.cwd()): Promise<string> {
  let current = path.resolve(start);
  while (true) {
    const bridgePath = path.join(current, "resume_pipeline", "ats_bridge.py");
    try {
      await fs.access(bridgePath);
      return current;
    } catch {
      if (isRoot(current)) {
        throw new Error("Could not locate repo root containing resume_pipeline/ats_bridge.py");
      }
      current = path.dirname(current);
    }
  }
}

function pythonCandidates(): Array<{ command: string; args: string[] }> {
  const configured = process.env.PYTHON_EXECUTABLE;
  if (configured) {
    return [{ command: configured, args: [] }];
  }
  if (process.platform === "win32") {
    return [
      { command: "python", args: [] },
      { command: "py", args: ["-3"] },
    ];
  }
  return [
    { command: "python3", args: [] },
    { command: "python", args: [] },
  ];
}

async function runPythonBridge<T>(
  bridgeCommand: "simulate" | "rules" | "fix",
  payload?: unknown,
): Promise<T> {
  const repoRoot = await findRepoRoot();
  const bridgePath = path.join(repoRoot, "resume_pipeline", "ats_bridge.py");
  const input = payload === undefined ? "" : JSON.stringify(payload);
  const failures: string[] = [];

  for (const candidate of pythonCandidates()) {
    try {
      const output = await new Promise<string>((resolve, reject) => {
        const child = spawn(
          candidate.command,
          [...candidate.args, bridgePath, bridgeCommand],
          {
            cwd: repoRoot,
            env: process.env,
            stdio: ["pipe", "pipe", "pipe"],
          },
        );

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
        });
        child.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });
        child.on("error", (error) => {
          reject(error);
        });
        child.on("close", (code) => {
          if (code === 0) {
            resolve(stdout);
            return;
          }
          reject(new Error(stderr || `${candidate.command} exited with code ${code}`));
        });

        if (input) {
          child.stdin.write(input);
        }
        child.stdin.end();
      });

      return JSON.parse(output) as T;
    } catch (error) {
      failures.push(`${candidate.command}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Failed to execute Python ATS bridge. ${failures.join(" | ")}`);
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
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
}

export function estimateMaxPages(resume: Resume): number {
  const totalMonths = resume.experience.reduce((months, entry) => {
    const start = parseResumeDate(entry.startDate);
    const end = parseResumeDate(entry.endDate);
    if (!start || !end || end < start) {
      return months;
    }
    const diffMonths =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth());
    return months + Math.max(0, diffMonths || 1);
  }, 0);

  return totalMonths / 12 < 3 ? 1 : 2;
}

async function snapshotPath(runId: string): Promise<string> {
  const repoRoot = await findRepoRoot();
  return path.join(repoRoot, "resume_pipeline", "runs", "ats-web", runId, "ats_snapshot.json");
}

async function writeSnapshot(snapshot: ATSSnapshot): Promise<void> {
  const targetPath = await snapshotPath(snapshot.run_id);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const tempPath = `${targetPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(snapshot, null, 2), "utf-8");
  await fs.rename(tempPath, targetPath);
}

export async function readSnapshot(runId: string): Promise<ATSSnapshot | null> {
  try {
    const targetPath = await snapshotPath(runId);
    const raw = await fs.readFile(targetPath, "utf-8");
    return JSON.parse(raw) as ATSSnapshot;
  } catch {
    return null;
  }
}

export async function simulateAndPersist(input: SimulationInput): Promise<ATSSnapshot> {
  const latex_source = input.latex_source ?? generateLaTeX(input.assembled_resume);
  const max_pages = input.max_pages ?? estimateMaxPages(input.assembled_resume);
  const bridgeResult = await runPythonBridge<BridgeSimulationResult>("simulate", {
    assembled_resume: input.assembled_resume,
    job_description: input.job_description,
    latex_source,
    max_pages,
  });

  const snapshot: ATSSnapshot = {
    run_id: input.run_id,
    assembled_resume: input.assembled_resume,
    latex_source,
    job_description: input.job_description,
    ats_keywords: bridgeResult.ats_keywords,
    max_pages,
    report: bridgeResult.report,
  };
  await writeSnapshot(snapshot);
  return snapshot;
}

export async function fetchRules(): Promise<{ rules: ATSRuleInfo[] }> {
  return runPythonBridge<{ rules: ATSRuleInfo[] }>("rules");
}

export async function applyFix(runId: string, ruleId: string): Promise<ATSFixResponse> {
  const snapshot = await readSnapshot(runId);
  if (!snapshot) {
    throw new Error("ATS snapshot not found");
  }

  const fixResult = await runPythonBridge<ATSFixResponse>("fix", {
    rule_id: ruleId,
    assembled_resume: snapshot.assembled_resume,
    job_description: snapshot.job_description,
    ats_keywords: snapshot.ats_keywords,
    latex_source: snapshot.latex_source,
    max_pages: snapshot.max_pages,
  });

  if (!fixResult.auto_fixed || !fixResult.assembled_resume) {
    return fixResult;
  }

  const updatedSnapshot = await simulateAndPersist({
    run_id: runId,
    assembled_resume: fixResult.assembled_resume,
    job_description: snapshot.job_description,
    max_pages: snapshot.max_pages,
  });

  return {
    auto_fixed: true,
    manual_instruction: null,
    assembled_resume: updatedSnapshot.assembled_resume,
    report: updatedSnapshot.report,
  };
}
