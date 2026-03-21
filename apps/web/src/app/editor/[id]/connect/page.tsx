"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useResumeStore } from "@/lib/store/resumeStore";
import { createDefaultResume } from "@resumeai/shared";

const ConnectionFlow = dynamic(
  () => import("@/components/connection/ConnectionFlow"),
  { ssr: false }
);

export default function ConnectPage({
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
        // If the resume already has content, skip connect and go to editor
        const hasContent =
          found.experience.length > 0 ||
          found.education.length > 0 ||
          found.projects.length > 0 ||
          found.personalInfo.name;
        if (hasContent) {
          router.replace(`/editor/${id}`);
          return;
        }
        setResume(found);
        return;
      }
    }
    setResume(createDefaultResume(id, "local"));
  }, [id, setResume, router]);

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
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  return <ConnectionFlow resumeId={id} onComplete={handleComplete} />;
}
