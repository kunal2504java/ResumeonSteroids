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
    const copy = {
      ...JSON.parse(JSON.stringify(r)),
      id,
      name: `${r.name} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persist([copy, ...resumes]);
  }

  function remove(id: string) {
    persist(resumes.filter((r) => r.id !== id));
  }

  return (
    <div className="theme-adaptive relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-96 w-[48rem] -translate-x-1/2 rounded-full bg-white/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-18rem] top-32 h-80 w-80 rounded-full bg-white/[0.035] blur-[100px]" />

      <header className="relative z-10 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-white">
              <path d="M10 1L12.39 7.26L19 8.27L14.5 12.14L15.82 18.54L10 15.27L4.18 18.54L5.5 12.14L1 8.27L7.61 7.26L10 1Z" fill="currentColor" />
            </svg>
            <span className="text-sm font-semibold tracking-tight text-white">ResumeAI</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-zinc-400 sm:flex">
            <Link href="/dashboard" className="text-white">Resumes</Link>
            <Link href="/tracker" className="transition hover:text-white">Tracker</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-semibold text-white shadow-inner shadow-white/10">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-zinc-500">Workspace</p>
            <h1 className="mb-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">Your resumes</h1>
            <p className="text-sm text-zinc-400">
              {!hydrated
                ? "\u00A0"
                : resumes.length === 0
                  ? "Create your first AI-powered resume"
                  : `${resumes.length} resume${resumes.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={createNew}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_18px_40px_rgba(255,255,255,0.08)] transition hover:bg-zinc-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Resume
          </button>
        </motion.div>

        {hydrated && resumes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/12 bg-white/[0.04] px-8 py-24 text-center shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-inner shadow-white/10">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">No resumes yet</h3>
            <p className="mb-8 max-w-md text-sm leading-relaxed text-zinc-400">
              Connect your GitHub, LeetCode, or Codeforces, or upload your existing resume and let AI do the rest.
            </p>
            <button
              onClick={createNew}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_18px_40px_rgba(255,255,255,0.08)] transition hover:bg-zinc-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create my first resume
            </button>
          </motion.div>
        )}

        {hydrated && resumes.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </main>
    </div>
  );
}
