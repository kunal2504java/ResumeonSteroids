"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PrepPanel } from "@/components/prep/PrepPanel";
import { trackerApi } from "@/lib/trackerApi";
import type { InterviewPrep } from "@/types/tracker";

export default function PrepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    trackerApi.applications
      .prep(id)
      .then(setPrep)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load prep"));
  }, [id]);

  return (
    <main className="min-h-screen bg-[#0D1117] text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <Link href={`/tracker/${id}`} className="text-sm text-[#A1A1AA] hover:text-white">
          Back to application
        </Link>
        <header className="mt-6 border-b border-[#1E2535] pb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#71717A]">Interview prep</p>
          <h1 className="mt-2 text-3xl font-semibold">Question bank and STAR outlines</h1>
        </header>
        <div className="mt-8">
          {error && <div className="border border-[#7F1D1D] bg-[#1F1111] p-4 text-sm text-[#FCA5A5]">{error}</div>}
          {!error && !prep && <p className="text-sm text-[#71717A]">Generating prep...</p>}
          {prep && <PrepPanel prep={prep} />}
        </div>
      </div>
    </main>
  );
}

