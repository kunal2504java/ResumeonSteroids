"use client";

import { useEffect, use } from "react";
import dynamic from "next/dynamic";
import { useResumeStore } from "@/lib/store/resumeStore";
import { createDefaultResume } from "@resumeai/shared";

const EditorLayout = dynamic(
  () => import("@/components/editor/EditorLayout"),
  { ssr: false }
);

export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const setResume = useResumeStore((s) => s.setResume);
  const resume = useResumeStore((s) => s.resume);

  useEffect(() => {
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

  if (!resume) {
    return (
      <div className="h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-[#71717A] text-sm">Loading editor...</div>
      </div>
    );
  }

  return <EditorLayout />;
}
