"use client";

import { useState, useEffect, useRef } from "react";
import { useResumeStore } from "@/lib/store/resumeStore";
import SectionTabs from "./LeftPanel/SectionTabs";
import PersonalInfo from "./LeftPanel/PersonalInfo";
import SummaryEditor from "./LeftPanel/SummaryEditor";
import ExperienceEditor from "./LeftPanel/ExperienceEditor";
import EducationEditor from "./LeftPanel/EducationEditor";
import ProjectEditor from "./LeftPanel/ProjectEditor";
import SkillsEditor from "./LeftPanel/SkillsEditor";
import ResumePreview from "./RightPanel/ResumePreview";
import Toolbar from "./Toolbar";
import TailorDrawer from "./TailorDrawer";
import CommandPalette from "@/components/ui/CommandPalette";
import ToastContainer from "@/components/ui/Toast";

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
  const dragging = useRef(false);

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
    { id: "pdf", label: "Download PDF", shortcut: "", action: handleDownloadPDF },
    { id: "latex", label: "Copy LaTeX", shortcut: "", action: handleCopyLaTeX },
    { id: "tailor", label: "Tailor to Job", shortcut: "", action: () => setTailorOpen(true) },
    { id: "add-exp", label: "Add Experience", shortcut: "", action: () => { addExperience(); setActiveSection("experience"); } },
    { id: "add-proj", label: "Add Project", shortcut: "", action: () => { addProject(); setActiveSection("projects"); } },
    { id: "personal", label: "Edit Personal Info", shortcut: "", action: () => setActiveSection("personal") },
    { id: "skills", label: "Edit Skills", shortcut: "", action: () => setActiveSection("skills") },
  ];

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
    if (!resume) return;
    const { generateLaTeX } = await import("@/lib/pdf/latex");
    const latex = generateLaTeX(resume);
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
        onDownloadPDF={handleDownloadPDF}
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
          <ResumePreview />
        </div>
      </div>

      <TailorDrawer isOpen={tailorOpen} onClose={() => setTailorOpen(false)} />
      <CommandPalette
        commands={commands}
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
      />
      <ToastContainer />
    </div>
  );
}
