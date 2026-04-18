import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

let resolvedBinaryPromise: Promise<string> | null = null;

function getCandidateBinaries(): string[] {
  const candidates = new Set<string>();

  if (process.env.PDFLATEX_PATH) {
    candidates.add(process.env.PDFLATEX_PATH);
  }

  candidates.add("pdflatex");
  candidates.add("pdflatex.exe");

  if (process.platform === "win32") {
    const roots = [
      process.env.ProgramFiles,
      process.env["ProgramFiles(x86)"],
      process.env.LOCALAPPDATA,
    ].filter(Boolean) as string[];

    for (const root of roots) {
      candidates.add(path.join(root, "MiKTeX", "miktex", "bin", "x64", "pdflatex.exe"));
      candidates.add(path.join(root, "MiKTeX", "miktex", "bin", "pdflatex.exe"));
    }

    for (let year = 2030; year >= 2020; year -= 1) {
      candidates.add(path.join("C:\\texlive", String(year), "bin", "windows", "pdflatex.exe"));
      candidates.add(path.join("C:\\texlive", String(year), "bin", "win32", "pdflatex.exe"));
    }
  }

  return Array.from(candidates);
}

async function canExecute(binary: string): Promise<boolean> {
  try {
    if (path.isAbsolute(binary) && !fs.existsSync(binary)) {
      return false;
    }

    await execFileAsync(binary, ["--version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function resolvePdflatexBinary(): Promise<string> {
  if (!resolvedBinaryPromise) {
    resolvedBinaryPromise = (async () => {
      for (const candidate of getCandidateBinaries()) {
        if (await canExecute(candidate)) {
          return candidate;
        }
      }

      throw new Error(
        "pdflatex was not found. Install TeX Live or MiKTeX, or set PDFLATEX_PATH to the full pdflatex executable path."
      );
    })();
  }

  return resolvedBinaryPromise;
}

export async function compileLatexToPdf(
  texContent: string,
  tempPrefix = "resume-"
): Promise<{ pdfBuffer: Buffer; logTail: string }> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), tempPrefix));
  const texFile = path.join(tmpDir, "resume.tex");
  const pdfFile = path.join(tmpDir, "resume.pdf");
  const logFile = path.join(tmpDir, "resume.log");

  try {
    fs.writeFileSync(texFile, texContent, "utf-8");

    const pdflatexBinary = await resolvePdflatexBinary();
    const pdflatexArgs = [
      "-interaction=nonstopmode",
      `-output-directory=${tmpDir}`,
      texFile,
    ];

    try {
      await execFileAsync(pdflatexBinary, pdflatexArgs, {
        timeout: 30000,
        cwd: tmpDir,
      });
      await execFileAsync(pdflatexBinary, pdflatexArgs, {
        timeout: 30000,
        cwd: tmpDir,
      });
    } catch (error) {
      if (!fs.existsSync(pdfFile)) {
        const logTail = fs.existsSync(logFile)
          ? fs.readFileSync(logFile, "utf-8").slice(-2000)
          : "No log file found";
        const details = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`LaTeX compilation failed. ${details}\n${logTail}`);
      }
    }

    if (!fs.existsSync(pdfFile)) {
      throw new Error("PDF file was not generated after LaTeX compilation");
    }

    const logTail = fs.existsSync(logFile)
      ? fs.readFileSync(logFile, "utf-8").slice(-2000)
      : "";

    return {
      pdfBuffer: fs.readFileSync(pdfFile),
      logTail,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup.
    }
  }
}
