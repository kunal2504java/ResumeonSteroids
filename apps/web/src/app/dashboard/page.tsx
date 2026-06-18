"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import ResumeCard from "@/components/dashboard/ResumeCard";
import NewResumeCard from "@/components/dashboard/NewResumeCard";
import AppHeader from "@/components/layout/AppHeader";
import InkLayer from "@/components/ink/InkLayer";
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
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <InkLayer />
      <AppHeader active="resumes" />

      <main className="page-wrap" style={{ paddingTop: 44, paddingBottom: 80, position: "relative", zIndex: 1 }}>
        <div className="db-head">
          <div>
            <span className="eyebrow">your workspace</span>
            <h1 className="db-title">
              Your <span data-mark="circle" data-color="pen" style={{ position: "relative" }}>drafts</span>
            </h1>
            <p className="hand hand-ink" style={{ fontSize: 17, marginTop: 6 }}>
              {!hydrated
                ? " "
                : resumes.length === 0
                  ? "nothing here yet — let's fix that"
                  : `${resumes.length} draft${resumes.length > 1 ? "s" : ""} on the desk`}
            </p>
          </div>
          <button onClick={createNew} className="btn btn-pen">
            <span aria-hidden="true">+</span> New draft
          </button>
        </div>

        {hydrated && resumes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="ink-card db-empty"
            data-frame
          >
            <div className="sticky db-empty-sticky">
              <span className="tape" />
              start<br />here
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>No drafts on the desk yet</h3>
            <p style={{ maxWidth: 440, margin: "12px auto 0", color: "#3a362d", fontSize: 16, lineHeight: 1.55 }}>
              Connect your GitHub, LeetCode, or Codeforces, or upload an existing resume — we&apos;ll mark up the first draft for you.
            </p>
            <button onClick={createNew} className="btn btn-pen" style={{ marginTop: 26 }}>
              Build my first draft <span aria-hidden="true">→</span>
            </button>
          </motion.div>
        )}

        {hydrated && resumes.length > 0 && (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <NewResumeCard onClick={createNew} />
            {resumes.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <ResumeCard
                  resume={r}
                  tilt={((i % 3) - 1) * 1.2}
                  onEdit={() => router.push(`/editor/${r.id}`)}
                  onDuplicate={() => duplicate(r)}
                  onDelete={() => remove(r.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        .db-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 40px; flex-wrap: wrap; }
        .db-title { font-family: var(--font-bricolage), sans-serif; font-weight: 800; font-size: clamp(34px, 5vw, 52px); letter-spacing: -0.03em; line-height: 1; margin-top: 14px; }
        .db-empty { text-align: center; padding: 70px 32px; position: relative; }
        .db-empty-sticky { position: absolute; top: -22px; left: 40px; width: 84px; height: 84px; display: grid; place-items: center; text-align: center; font-weight: 800; font-size: 16px; line-height: 1.1; transform: rotate(-5deg); font-family: var(--font-shantell), cursive; }
        @media (max-width: 560px) { .db-empty-sticky { display: none; } }
      `}</style>
    </div>
  );
}
