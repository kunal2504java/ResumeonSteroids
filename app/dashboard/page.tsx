"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import ResumeCard from "@/components/dashboard/ResumeCard";
import NewResumeCard from "@/components/dashboard/NewResumeCard";
import { createDefaultResume, type Resume } from "@/types/resume";

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("resumeai_resumes");
    return stored ? JSON.parse(stored) : [];
  });

  function persist(updated: Resume[]) {
    setResumes(updated);
    localStorage.setItem("resumeai_resumes", JSON.stringify(updated));
  }

  function createNew() {
    const id = uuid();
    const resume = createDefaultResume(id, "local");
    resume.name = `Resume ${resumes.length + 1}`;
    persist([resume, ...resumes]);
    router.push(`/editor/${id}/import`);
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
    <div className="min-h-screen bg-[#0D1117]">
      {/* Header */}
      <header className="border-b border-[#1E2535]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-[#6366f1]">
              <path d="M10 1L12.39 7.26L19 8.27L14.5 12.14L15.82 18.54L10 15.27L4.18 18.54L5.5 12.14L1 8.27L7.61 7.26L10 1Z" fill="currentColor" />
            </svg>
            <span className="text-sm font-bold text-white">ResumeAI</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="flex items-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{resumes.length}</span>
            <span className="text-xs text-[#71717A]">resumes</span>
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-1">Your Resumes</h1>
          <p className="text-sm text-[#71717A]">
            Create, edit, and manage your AI-powered resumes.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      </div>
    </div>
  );
}
