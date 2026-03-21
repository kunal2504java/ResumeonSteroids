"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/lib/store/resumeStore";
import { createDefaultResume } from "@resumeai/shared";
import ImportWizard from "@/components/editor/ImportWizard";

export default function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const setResume = useResumeStore((s) => s.setResume);
  const resume = useResumeStore((s) => s.resume);

  useEffect(() => {
    // Load from localStorage or create new
    const stored = localStorage.getItem("resumeai_resumes");
    if (stored) {
      const resumes = JSON.parse(stored);
      const found = resumes.find((r: { id: string }) => r.id === id);
      if (found) {
        setResume(found);
        return;
      }
    }
    setResume(createDefaultResume(id, "local"));
  }, [id, setResume]);

  function handleComplete() {
    // Save to localStorage
    const current = useResumeStore.getState().resume;
    if (current) {
      const stored = localStorage.getItem("resumeai_resumes");
      const resumes = stored ? JSON.parse(stored) : [];
      const idx = resumes.findIndex((r: { id: string }) => r.id === id);
      if (idx >= 0) resumes[idx] = current;
      else resumes.unshift(current);
      localStorage.setItem("resumeai_resumes", JSON.stringify(resumes));
    }
    router.push(`/editor/${id}`);
  }

  if (!resume) {
    return (
      <div className="h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-[#71717A] text-sm">Loading...</div>
      </div>
    );
  }

  return <ImportWizard onComplete={handleComplete} />;
}
