"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { OutreachPanel } from "@/components/outreach/OutreachPanel";
import { trackerApi } from "@/lib/trackerApi";
import type { ApplicationDetail } from "@/types/tracker";

export default function OutreachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    trackerApi.applications
      .detail(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load outreach"));
  }, [id]);

  return (
    <main className="min-h-screen bg-[#0D1117] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <Link href={`/tracker/${id}`} className="text-sm text-[#A1A1AA] hover:text-white">
          Back to application
        </Link>
        <div className="mt-6">
          {error && <div className="border border-[#7F1D1D] bg-[#1F1111] p-4 text-sm text-[#FCA5A5]">{error}</div>}
          {!error && !detail && <p className="text-sm text-[#71717A]">Loading outreach...</p>}
          {detail && (
            <OutreachPanel
              application={detail.application}
              initialTargets={detail.targets}
              initialDrafts={detail.drafts}
            />
          )}
        </div>
      </div>
    </main>
  );
}

