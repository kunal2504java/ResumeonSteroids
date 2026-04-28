"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import ResumeCard from "@/components/dashboard/ResumeCard";
import NewResumeCard from "@/components/dashboard/NewResumeCard";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { createDefaultResume, type Resume } from "@resumeai/shared";

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem("resumeai_resumes");
      if (stored) setResumes(JSON.parse(stored));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function persist(updated: Resume[]) {
    setResumes(updated);
    localStorage.setItem("resumeai_resumes", JSON.stringify(updated));
  }

  function createNew() {
    const id = uuid();
    const resume = createDefaultResume(id, "local");
    resume.name = `Resume ${resumes.length + 1}`;
    persist([resume, ...resumes]);
    router.push(`/editor/${id}/connect`);
  }

  function duplicate(r: Resume) {
    const id = uuid();
    const copy = { ...JSON.parse(JSON.stringify(r)), id, name: `${r.name} (copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    persist([copy, ...resumes]);
  }

  function remove(id: string) {
    persist(resumes.filter((r) => r.id !== id));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Dashboard navbar */}
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-10 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-indigo">
              <path d="M10 1L12.39 7.26L19 8.27L14.5 12.14L15.82 18.54L10 15.27L4.18 18.54L5.5 12.14L1 8.27L7.61 7.26L10 1Z" fill="currentColor" />
            </svg>
            <span className="text-sm font-bold text-foreground">ResumeAI</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted sm:flex">
            <Link href="/dashboard" className="text-foreground">Resumes</Link>
            <Link href="/tracker" className="transition hover:text-foreground">Tracker</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo/70 to-[var(--palette-steel)] flex items-center justify-center text-[10px] font-bold text-[var(--accent-contrast)]">
              U
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-10 py-12">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Your Resumes</h1>
            <p className="text-sm text-muted">
              {!hydrated
                ? "\u00A0"
                : resumes.length === 0
                  ? "Create your first AI-powered resume"
                  : `${resumes.length} resume${resumes.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={createNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo text-[var(--accent-contrast)] text-sm font-medium hover:bg-indigo-light transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Resume
          </button>
        </motion.div>

        {/* Empty state */}
        {hydrated && resumes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-24 px-8 border border-dashed border-border bg-surface-raised/70"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-indigo/10 border border-indigo/20 mb-6">
              <svg className="w-8 h-8 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No resumes yet</h3>
            <p className="text-sm text-muted text-center max-w-md mb-8 leading-relaxed">
              Connect your GitHub, LeetCode, or Codeforces — or upload your existing resume and let AI do the rest.
            </p>
            <button
              onClick={createNew}
              className="flex items-center gap-2 px-6 py-3 bg-indigo text-[var(--accent-contrast)] text-sm font-medium hover:bg-indigo-light transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create my first resume
            </button>
          </motion.div>
        )}

        {/* Resume grid */}
        {hydrated && resumes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <NewResumeCard onClick={createNew} />
            {resumes.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ResumeCard
                  resume={r}
                  onEdit={() => router.push(`/editor/${r.id}`)}
                  onDuplicate={() => duplicate(r)}
                  onDelete={() => remove(r.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
