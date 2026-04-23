"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useResumeStore } from "@/lib/store/resumeStore";
import type { Resume } from "@resumeai/shared";
import SectionTabs from "./LeftPanel/SectionTabs";
import PersonalInfo from "./LeftPanel/PersonalInfo";
import SummaryEditor from "./LeftPanel/SummaryEditor";
import ExperienceEditor from "./LeftPanel/ExperienceEditor";
import EducationEditor from "./LeftPanel/EducationEditor";
import ProjectEditor from "./LeftPanel/ProjectEditor";
import SkillsEditor from "./LeftPanel/SkillsEditor";
import Toolbar from "./Toolbar";
import TailorDrawer from "./TailorDrawer";
import CommandPalette from "@/components/ui/CommandPalette";
import ToastContainer from "@/components/ui/Toast";
import { ATSReportPanel } from "@/components/ats/ATSReportPanel";
import { ResumePreviewPanel } from "@/components/resume/ResumePreviewPanel";
import { useATSReport } from "@/hooks/useATSReport";
import {
  estimateResumePages,
  prepareResumeForOutput,
  shouldOfferTwoPageResume,
} from "@/lib/resume/output";

export default function EditorLayout() {
  const activeSection = useResumeStore((s) => s.activeSection);
  const resume = useResumeStore((s) => s.resume);
  const addToast = useResumeStore((s) => s.addToast);
  const save = useResumeStore((s) => s.save);
  const isDirty = useResumeStore((s) => s.isDirty);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const addExperience = useResumeStore((s) => s.addExperience);
  const addProject = useResumeStore((s) => s.addProject);

  const [tailorOpen, setTailorOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [dividerX, setDividerX] = useState(480);
  const [jobDescription, setJobDescription] = useState("");
  const [highlightedSection, setHighlightedSection] = useState<string | undefined>();
  const [mobileTab, setMobileTab] = useState<"resume" | "ats">("resume");
  const [pagePreference, setPagePreference] = useState<1 | 2 | null>(null);
  const dragging = useRef(false);
  const atsRunId = resume ? `ats-${resume.id}` : null;
  const canOfferTwoPages = useMemo(
    () => (resume ? shouldOfferTwoPageResume(resume) : false),
    [resume],
  );
  const effectiveMaxPages: 1 | 2 = canOfferTwoPages && pagePreference === 2 ? 2 : 1;
  const outputResume = useMemo<Resume | null>(
    () => (resume ? prepareResumeForOutput(resume, { maxPages: effectiveMaxPages }) : null),
    [effectiveMaxPages, resume],
  );
  const estimatedRawPages = useMemo(
    () => (resume ? estimateResumePages(resume) : 0),
    [resume],
  );
  const { report, loading: atsLoading, error: atsError, triggerFix } = useATSReport(
    atsRunId,
    outputResume,
    jobDescription,
    effectiveMaxPages,
  );

  useEffect(() => {
    if (!resume) {
      setPagePreference(null);
      return;
    }

    const key = `resumeai:max-pages:${resume.id}`;
    const stored = window.localStorage.getItem(key);
    setPagePreference(stored === "2" ? 2 : stored === "1" ? 1 : null);
  }, [resume?.id]);

  useEffect(() => {
    if (!resume?.id) {
      return;
    }

    const key = `resumeai:max-pages:${resume.id}`;
    if (pagePreference == null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, String(pagePreference));
  }, [pagePreference, resume?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  // Debounced auto-save
  useEffect(() => {
    if (!isDirty) return;
    const timeout = setTimeout(() => save(), 1500);
    return () => clearTimeout(timeout);
  }, [isDirty, save]);

  // Divider drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const x = Math.max(320, Math.min(e.clientX, window.innerWidth - 400));
      setDividerX(x);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const commands = [
    { id: "save", label: "Save Resume", shortcut: "⌘S", action: () => save() },
    { id: "pdf", label: "Download PDF (LaTeX)", shortcut: "", action: handleDownloadLatexPDF },
    { id: "pdf-quick", label: "Download PDF (Quick)", shortcut: "", action: handleDownloadPDF },
    { id: "latex", label: "Copy LaTeX", shortcut: "", action: handleCopyLaTeX },
    { id: "tailor", label: "Tailor to Job", shortcut: "", action: () => setTailorOpen(true) },
    { id: "add-exp", label: "Add Experience", shortcut: "", action: () => { addExperience(); setActiveSection("experience"); } },
    { id: "add-proj", label: "Add Project", shortcut: "", action: () => { addProject(); setActiveSection("projects"); } },
    { id: "personal", label: "Edit Personal Info", shortcut: "", action: () => setActiveSection("personal") },
    { id: "skills", label: "Edit Skills", shortcut: "", action: () => setActiveSection("skills") },
  ];

  /**
   * Primary PDF download — sends resume data to the API which compiles
   * LaTeX with pdflatex and returns a real PDF. Falls back to the quick
   * (html-to-image) method if pdflatex is not available.
   */
  async function handleDownloadLatexPDF() {
    if (!outputResume) return;
    try {
      addToast("Compiling LaTeX PDF...", "info");
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/export/latex`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo: outputResume.personalInfo,
          summary: outputResume.summary,
          experience: outputResume.experience,
          education: outputResume.education,
          projects: outputResume.projects,
          skills: outputResume.skills,
          achievements: outputResume.achievements,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Compilation failed" }));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      // Stream the PDF blob and trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${outputResume.personalInfo.name || "resume"}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("PDF downloaded", "success");
    } catch (err) {
      console.error("[LaTeX PDF Error]", err);
      addToast(
        `LaTeX PDF failed: ${(err as Error).message}. Try Quick PDF instead.`,
        "error"
      );
    }
  }

  /** Fallback: client-side PDF from the HTML preview (html-to-image + jsPDF) */
  async function handleDownloadPDF() {
    const el = document.querySelector("[data-resume-preview]") as HTMLElement;
    if (!el) return;
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");
      const png = await toPng(el, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: 816,
        height: 1056,
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.addImage(png, "PNG", 0, 0, w, h);
      pdf.save(`${resume?.name || "resume"}.pdf`);
      addToast("PDF downloaded", "success");
    } catch {
      addToast("PDF export failed", "error");
    }
  }

  async function handleCopyLaTeX() {
    if (!outputResume) return;
    const { generateLaTeX } = await import("@/lib/pdf/latex");
    const latex = generateLaTeX(outputResume);
    navigator.clipboard.writeText(latex);
    addToast("LaTeX copied to clipboard", "success");
  }

  const sectionComponents: Record<string, React.ReactNode> = {
    personal: <PersonalInfo />,
    summary: <SummaryEditor />,
    experience: <ExperienceEditor />,
    education: <EducationEditor />,
    projects: <ProjectEditor />,
    skills: <SkillsEditor />,
    achievements: <SkillsEditor />,
  };

  return (
    <div className="h-screen flex flex-col bg-[#0D1117] text-white overflow-hidden">
      <Toolbar
        onDownloadPDF={handleDownloadLatexPDF}
        onCopyLaTeX={handleCopyLaTeX}
        onTailor={() => setTailorOpen(true)}
        onCommandPalette={() => setCmdOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div
          className="flex flex-col border-r border-[#1E2535] overflow-hidden"
          style={{ width: dividerX }}
        >
          <SectionTabs />
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {sectionComponents[activeSection]}
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-1 bg-[#1E2535] hover:bg-[#6366f1]/40 cursor-col-resize shrink-0 transition-colors"
          onMouseDown={() => {
            dragging.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        />

        {/* Right Panel */}
        <div className="flex-1 overflow-hidden" data-resume-preview-container>
          <div className="flex h-full flex-col gap-4 p-4">
            {canOfferTwoPages && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-amber-100">
                      This candidate has enough high-signal content for a 2-page resume.
                    </div>
                    <p className="mt-1 text-xs leading-5 text-amber-100/80">
                      Defaulting to 1 page. Current raw content estimates at {estimatedRawPages.toFixed(2)} pages.
                      Allow 2 pages only if you want to keep the extra experience and achievements.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPagePreference(1)}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        effectiveMaxPages === 1
                          ? "bg-white text-[#0D1117]"
                          : "border border-white/15 text-white/80 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      Keep 1 page
                    </button>
                    <button
                      type="button"
                      onClick={() => setPagePreference(2)}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        effectiveMaxPages === 2
                          ? "bg-indigo-500 text-white"
                          : "border border-indigo-400/30 text-indigo-100 hover:border-indigo-300/50 hover:text-white"
                      }`}
                    >
                      Allow 2 pages
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-[#1E2535] bg-[#111827] p-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileTab("resume")}
                className={`flex-1 rounded-xl px-3 py-2 text-sm transition ${
                  mobileTab === "resume"
                    ? "bg-white text-[#0D1117]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("ats")}
                className={`flex-1 rounded-xl px-3 py-2 text-sm transition ${
                  mobileTab === "ats"
                    ? "bg-white text-[#0D1117]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                ATS Report
              </button>
            </div>

            <div className="hidden h-full gap-4 lg:flex">
              <div className="min-w-0 flex-[3]">
                <ResumePreviewPanel
                  highlightedSection={highlightedSection}
                  resume={outputResume}
                  maxPages={effectiveMaxPages}
                />
              </div>
              <div className="min-w-0 flex-[2]">
                <ATSReportPanel
                  report={report}
                  loading={atsLoading}
                  error={atsError}
                  onFix={triggerFix}
                  onHighlightSection={setHighlightedSection}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 lg:hidden">
              {mobileTab === "resume" ? (
                <ResumePreviewPanel
                  highlightedSection={highlightedSection}
                  resume={outputResume}
                  maxPages={effectiveMaxPages}
                />
              ) : (
                <ATSReportPanel
                  report={report}
                  loading={atsLoading}
                  error={atsError}
                  onFix={triggerFix}
                  onHighlightSection={setHighlightedSection}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <TailorDrawer
        isOpen={tailorOpen}
        onClose={() => setTailorOpen(false)}
        jobDescription={jobDescription}
        onJobDescriptionChange={setJobDescription}
      />
      <CommandPalette
        commands={commands}
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
      />
      <ToastContainer />
    </div>
  );
}
