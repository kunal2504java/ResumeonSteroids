"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/lib/store/resumeStore";
import { dedupeProjects } from "@/lib/resume/output";
import { mergeSkills, normalizeSkillsInput } from "@/lib/resume/skills";
import { v4 as uuid } from "uuid";
import type { Project } from "@resumeai/shared";

type ImportSource = "resume" | "github" | "leetcode" | "codeforces" | "manual";

interface SourceCard {
  id: ImportSource;
  icon: string;
  title: string;
  description: string;
}

const sources: SourceCard[] = [
  { id: "resume", icon: "📄", title: "Upload old resume", description: "PDF or DOCX — AI extracts everything" },
  { id: "github", icon: "🐙", title: "GitHub username", description: "Import repos and contributions" },
  { id: "leetcode", icon: "🧩", title: "LeetCode username", description: "Sync problems solved and rating" },
  { id: "codeforces", icon: "⚡", title: "Codeforces handle", description: "Import competitive programming stats" },
  { id: "manual", icon: "✏️", title: "Fill manually", description: "Start from scratch" },
];

interface ProgressItem {
  source: string;
  status: "pending" | "loading" | "done" | "error";
  message: string;
}

function cleanImportedName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeExperienceKey(company: string, title: string): string {
  return `${company}::${title}`.trim().toLowerCase();
}

function parseEnrichedDuration(duration: string): {
  startDate: string;
  endDate: string;
} {
  const separators = [" -- ", " - ", " – ", " — ", "–", "—"];
  for (const separator of separators) {
    if (duration.includes(separator)) {
      const [startDate, endDate] = duration.split(separator).map((part) => part.trim());
      return { startDate, endDate };
    }
  }
  return { startDate: duration.trim(), endDate: "" };
}

export default function ImportWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Set<ImportSource>>(new Set());
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [importedData, setImportedData] = useState<Record<string, unknown>>({});
  const resume = useResumeStore((s) => s.resume);
  const setResume = useResumeStore((s) => s.setResume);
  const addToast = useResumeStore((s) => s.addToast);

  function toggleSource(id: ImportSource) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function runImports() {
    setStep(3);
    const items: ProgressItem[] = [];
    const aggregatedData: Record<string, unknown> = {};
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

    for (const src of selected) {
      if (src === "manual") continue;
      items.push({ source: src, status: "pending", message: "Waiting..." });
    }
    setProgress([...items]);

    for (let i = 0; i < items.length; i++) {
      items[i].status = "loading";
      items[i].message = `Importing from ${items[i].source}...`;
      setProgress([...items]);

      try {
        let result: unknown;

        if (items[i].source === "github") {
          const res = await fetch(`${API_URL}/api/ai/import/github`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: inputs.github }),
          });
          if (!res.ok) throw new Error("Failed");
          result = await res.json();
          const data = result as { projects?: { name: string; description: string; techStack: string[]; highlights: string[]; url: string; stars: number }[]; profile?: { name: string } };
          items[i].message = `Fetched ${data.projects?.length || 0} projects`;
          aggregatedData.github = data;
          setImportedData((d) => ({ ...d, github: data }));
        } else if (items[i].source === "leetcode") {
          const res = await fetch(`${API_URL}/api/ai/import/leetcode`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: inputs.leetcode }),
          });
          if (!res.ok) throw new Error("Failed");
          result = await res.json();
          const data = result as { stats?: { totalSolved: number }; achievement?: string };
          items[i].message = `${data.stats?.totalSolved || 0} problems solved`;
          aggregatedData.leetcode = data;
          setImportedData((d) => ({ ...d, leetcode: data }));
        } else if (items[i].source === "codeforces") {
          const res = await fetch(`${API_URL}/api/ai/import/codeforces`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handle: inputs.codeforces }),
          });
          if (!res.ok) throw new Error("Failed");
          result = await res.json();
          const data = result as { stats?: { maxRank: string; maxRating: number } };
          items[i].message = `${data.stats?.maxRank} (${data.stats?.maxRating})`;
          aggregatedData.codeforces = data;
          setImportedData((d) => ({ ...d, codeforces: data }));
        } else if (items[i].source === "resume") {
          if (!file) throw new Error("No file");
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(`${API_URL}/api/ai/import/resume`, {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("Failed");
          result = await res.json();
          items[i].message = "Resume parsed successfully";
          aggregatedData.resume = result;
          setImportedData((d) => ({ ...d, resume: result }));
        } else if (items[i].source === "linkedin") {
          const res = await fetch(`${API_URL}/api/ai/import/linkedin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileUrl: inputs.linkedin }),
          });
          if (!res.ok) throw new Error("Failed");
          result = await res.json();
          const data = result as {
            profile?: { name?: string };
            experience?: unknown[];
          };
          items[i].message = `${data.experience?.length || 0} roles imported`;
          aggregatedData.linkedin = data;
          setImportedData((d) => ({ ...d, linkedin: data }));
        }

        items[i].status = "done";
      } catch {
        items[i].status = "error";
        items[i].message = `Failed to import from ${items[i].source}`;
      }
      setProgress([...items]);
    }

    if (
      aggregatedData.linkedin ||
      aggregatedData.resume ||
      aggregatedData.github
    ) {
      try {
        const res = await fetch(`${API_URL}/api/ai/enrich-experience`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkedin: aggregatedData.linkedin ?? null,
            github: aggregatedData.github ?? null,
            resume: aggregatedData.resume ?? null,
          }),
        });
        if (res.ok) {
          const enrichment = await res.json();
          aggregatedData.experience_enrichment = enrichment;
          setImportedData((d) => ({ ...d, experience_enrichment: enrichment }));
        }
      } catch {
        // Non-blocking: the base imports still work without the enrichment pass.
      }
    }

    // Auto-advance if only manual selected or everything done
    if (selected.has("manual") && selected.size === 1) {
      onComplete();
      return;
    }
    setStep(4);
  }

  function applyImports() {
    if (!resume) return;
    const updated = { ...resume };

    // Apply resume import
    const resumeImport = importedData.resume as { resumeData?: Record<string, unknown> } | undefined;
    const importedResumeName = cleanImportedName(
      resumeImport?.resumeData &&
        typeof resumeImport.resumeData === "object" &&
        "personalInfo" in resumeImport.resumeData
        ? (resumeImport.resumeData.personalInfo as Record<string, unknown> | undefined)?.name
        : ""
    );
    if (resumeImport?.resumeData) {
      const rd = resumeImport.resumeData as Record<string, unknown>;
      if (rd.personalInfo) updated.personalInfo = { ...updated.personalInfo, ...(rd.personalInfo as Record<string, string>) };
      if (rd.summary) updated.summary = rd.summary as string;
      if (rd.experience && Array.isArray(rd.experience)) {
        updated.experience = (rd.experience as Record<string, unknown>[]).map((e) => ({
          id: uuid(),
          company: (e.company as string) || "",
          title: (e.title as string) || "",
          location: (e.location as string) || "",
          startDate: (e.startDate as string) || "",
          endDate: (e.endDate as string) || "",
          bullets: (e.bullets as string[]) || [""],
        }));
      }
      if (rd.education && Array.isArray(rd.education)) {
        updated.education = (rd.education as Record<string, unknown>[]).map((e) => ({
          id: uuid(),
          institution: (e.institution as string) || "",
          degree: (e.degree as string) || "",
          field: (e.field as string) || "",
          location: (e.location as string) || "",
          startDate: (e.startDate as string) || "",
          endDate: (e.endDate as string) || "",
          gpa: (e.gpa as string) || "",
          coursework: (e.coursework as string[]) || [],
        }));
      }
      if (rd.skills) {
        updated.skills = mergeSkills(
          updated.skills,
          normalizeSkillsInput(rd.skills as Record<string, string[]>),
        );
      }
      if (rd.projects && Array.isArray(rd.projects)) {
        updated.projects = (rd.projects as Record<string, unknown>[]).map((p) => ({
          id: uuid(),
          name: (p.name as string) || "",
          techStack: (p.techStack as string[]) || [],
          url: (p.url as string) || "",
          startDate: (p.startDate as string) || "",
          endDate: (p.endDate as string) || "",
          bullets: (p.bullets as string[]) || [""],
        }));
      }
    }

    // Apply GitHub projects
    const ghData = importedData.github as { projects?: { name: string; description: string; techStack: string[]; highlights: string[]; url: string }[]; profile?: { name: string } } | undefined;
    if (ghData?.projects) {
      const ghProjects: Project[] = ghData.projects.map((p) => ({
        id: uuid(),
        name: p.name,
        techStack: p.techStack || [],
        url: p.url || "",
        startDate: "",
        endDate: "",
        bullets: p.highlights || [p.description],
      }));
      updated.projects = dedupeProjects([
        ...updated.projects,
        ...ghProjects.slice(0, 4),
      ]);
    }

    // Apply LeetCode
    const lcData = importedData.leetcode as
      | { achievement?: string; skills?: string[] }
      | undefined;
    if (lcData?.achievement) {
      updated.achievements = [...updated.achievements, lcData.achievement];
    }

    // Apply Codeforces
    const cfData = importedData.codeforces as { achievement?: string } | undefined;
    if (cfData?.achievement) {
      updated.achievements = [...updated.achievements, cfData.achievement];
    }

    if (Array.isArray(lcData?.skills) && lcData.skills.length > 0) {
      updated.skills = mergeSkills(updated.skills, { tools: lcData.skills });
    }

    const liDataWithSkills = importedData.linkedin as
      | { profile?: { name?: string }; skills?: Record<string, string[]> }
      | undefined;
    if (liDataWithSkills?.skills) {
      updated.skills = mergeSkills(updated.skills, liDataWithSkills.skills);
    }

    const liData = importedData.linkedin as { profile?: { name?: string } } | undefined;
    const importedLinkedinName = cleanImportedName(liData?.profile?.name);
    const preferredImportedName = importedResumeName || importedLinkedinName;
    if (preferredImportedName) {
      updated.personalInfo.name = preferredImportedName;
    }

    const experienceEnrichment = importedData.experience_enrichment as
      | {
          experience?: Array<{
            company?: string;
            title?: string;
            duration?: string;
            location?: string;
            bullets?: Array<{ text?: string }>;
            status?: string;
          }>;
        }
      | undefined;

    if (experienceEnrichment?.experience?.length) {
      const existingIndexByKey = new Map(
        updated.experience.map((entry) => [
          normalizeExperienceKey(entry.company, entry.title),
          entry,
        ])
      );

      for (const enriched of experienceEnrichment.experience) {
        if (!enriched) continue;

        const company = cleanImportedName(enriched.company);
        const title = cleanImportedName(enriched.title);
        const key = normalizeExperienceKey(company, title);
        const bulletTexts = (enriched.bullets ?? [])
          .map((bullet) => cleanImportedName(bullet?.text))
          .filter(Boolean);
        const matched = existingIndexByKey.get(key);
        const { startDate, endDate } = parseEnrichedDuration(
          cleanImportedName(enriched.duration)
        );

        if (enriched.status === "awaiting_user_input") {
          if (matched) {
            matched.bullets = [""];
          }
          continue;
        }

        if (matched) {
          matched.company = company || matched.company;
          matched.title = title || matched.title;
          matched.location = cleanImportedName(enriched.location) || matched.location;
          matched.startDate = startDate || matched.startDate;
          matched.endDate = endDate || matched.endDate;
          if (bulletTexts.length) {
            matched.bullets = bulletTexts;
          }
          continue;
        }

        updated.experience.push({
          id: uuid(),
          company,
          title,
          location: cleanImportedName(enriched.location),
          startDate,
          endDate,
          bullets: bulletTexts.length ? bulletTexts : [""],
        });
      }
    }

    updated.projects = dedupeProjects(updated.projects);
    updated.skills = normalizeSkillsInput(updated.skills);
    updated.updatedAt = new Date().toISOString();
    setResume(updated);
    addToast("Profile data imported", "success");
    onComplete();
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 flex items-center justify-center text-xs font-mono ${
                  step >= s
                    ? "bg-[#6366f1] text-white"
                    : "bg-[#161B27] text-[#71717A] border border-[#1E2535]"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > s ? "bg-[#6366f1]" : "bg-[#1E2535]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select sources */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Let&apos;s build your profile
              </h2>
              <p className="text-sm text-[#71717A] text-center mb-8">
                Select your data sources. We&apos;ll pull everything in automatically.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {sources.map((src) => (
                  <button
                    key={src.id}
                    onClick={() => toggleSource(src.id)}
                    className={`text-left p-4 border transition-all cursor-pointer ${
                      selected.has(src.id)
                        ? "bg-[#6366f1]/10 border-[#6366f1]/50"
                        : "bg-[#161B27] border-[#1E2535] hover:border-[#6366f1]/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xl">{src.icon}</span>
                      {selected.has(src.id) && (
                        <span className="text-[#6366f1] text-sm">✓</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white mt-2">
                      {src.title}
                    </h3>
                    <p className="text-[11px] text-[#71717A] mt-0.5">
                      {src.description}
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (selected.has("manual") && selected.size === 1) {
                    onComplete();
                  } else {
                    setStep(2);
                  }
                }}
                disabled={selected.size === 0}
                className="w-full py-3 bg-[#6366f1] text-white text-sm font-medium hover:bg-[#818cf8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Step 2: Input fields */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Enter your details
              </h2>
              <p className="text-sm text-[#71717A] text-center mb-8">
                Provide usernames and files for your selected sources.
              </p>

              <div className="space-y-4 mb-8">
                {selected.has("resume") && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <label className="block text-xs text-[#71717A] mb-1.5">
                      Upload Resume (PDF/DOCX)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full bg-[#161B27] border border-[#1E2535] px-3 py-2 text-sm text-white file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:bg-[#6366f1]/20 file:text-[#818cf8] file:cursor-pointer"
                    />
                  </motion.div>
                )}

                {selected.has("github") && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <label className="block text-xs text-[#71717A] mb-1.5">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      value={inputs.github || ""}
                      onChange={(e) =>
                        setInputs((p) => ({ ...p, github: e.target.value }))
                      }
                      placeholder="octocat"
                      className="w-full bg-[#161B27] border border-[#1E2535] px-3 py-2 text-sm text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
                    />
                  </motion.div>
                )}

                {selected.has("leetcode") && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-xs text-[#71717A] mb-1.5">
                      LeetCode Username
                    </label>
                    <input
                      type="text"
                      value={inputs.leetcode || ""}
                      onChange={(e) =>
                        setInputs((p) => ({ ...p, leetcode: e.target.value }))
                      }
                      placeholder="leetcoder123"
                      className="w-full bg-[#161B27] border border-[#1E2535] px-3 py-2 text-sm text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
                    />
                  </motion.div>
                )}

                {selected.has("codeforces") && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="block text-xs text-[#71717A] mb-1.5">
                      Codeforces Handle
                    </label>
                    <input
                      type="text"
                      value={inputs.codeforces || ""}
                      onChange={(e) =>
                        setInputs((p) => ({ ...p, codeforces: e.target.value }))
                      }
                      placeholder="tourist"
                      className="w-full bg-[#161B27] border border-[#1E2535] px-3 py-2 text-sm text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-sm text-[#71717A] border border-[#1E2535] hover:text-white transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={runImports}
                  className="flex-1 py-3 bg-[#6366f1] text-white text-sm font-medium hover:bg-[#818cf8] transition-colors cursor-pointer"
                >
                  Import Data
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Progress */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Analyzing your profiles...
              </h2>
              <p className="text-sm text-[#71717A] text-center mb-8">
                Sit tight while we fetch and analyze your data.
              </p>

              <div className="space-y-3">
                {progress.map((item) => (
                  <div
                    key={item.source}
                    className="flex items-center gap-3 bg-[#161B27] border border-[#1E2535] px-4 py-3"
                  >
                    <span className="w-5 text-center">
                      {item.status === "done" && (
                        <span className="text-emerald-400">✓</span>
                      )}
                      {item.status === "loading" && (
                        <span className="text-[#6366f1] animate-spin inline-block">⟳</span>
                      )}
                      {item.status === "pending" && (
                        <span className="text-[#71717A]">○</span>
                      )}
                      {item.status === "error" && (
                        <span className="text-red-400">✕</span>
                      )}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm text-white capitalize">
                        {item.source}
                      </span>
                      <span className="text-xs text-[#71717A] ml-2">
                        {item.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Data imported successfully
              </h2>
              <p className="text-sm text-[#71717A] text-center mb-8">
                Review what we found, then start editing.
              </p>

              {(
                importedData.experience_enrichment as
                  | { rolesNeedingInput?: string[]; questionsBlock?: string }
                  | undefined
              )?.rolesNeedingInput?.length ? (
                <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <h4 className="text-sm font-semibold text-amber-100">
                    Some experience roles still need more detail
                  </h4>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-amber-50/90">
                    {(
                      importedData.experience_enrichment as
                        | { questionsBlock?: string }
                        | undefined
                    )?.questionsBlock || ""}
                  </pre>
                </div>
              ) : null}

              <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto">
                {Object.entries(importedData).map(([source, data]) => (
                  <div
                    key={source}
                    className="bg-[#161B27] border border-[#1E2535] p-4"
                  >
                    <h4 className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider mb-2">
                      {source}
                    </h4>
                    <pre className="text-[10px] text-[#71717A] font-mono overflow-x-auto max-h-32 overflow-y-auto">
                      {JSON.stringify(data, null, 2).slice(0, 500)}
                    </pre>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onComplete}
                  className="px-6 py-3 text-sm text-[#71717A] border border-[#1E2535] hover:text-white transition-colors cursor-pointer"
                >
                  Skip & Edit Manually
                </button>
                <button
                  onClick={applyImports}
                  className="flex-1 py-3 bg-[#6366f1] text-white text-sm font-medium hover:bg-[#818cf8] transition-colors cursor-pointer"
                >
                  Apply & Start Editing
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
