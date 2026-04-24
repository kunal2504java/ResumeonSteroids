"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { EventTimeline } from "@/components/tracker/EventTimeline";
import { NudgeBanner } from "@/components/tracker/NudgeBanner";
import { StatusBadge } from "@/components/tracker/StatusBadge";
import { trackerApi } from "@/lib/trackerApi";
import type { ApplicationDetail } from "@/types/tracker";

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    trackerApi.applications
      .detail(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load application"));
  }, [id]);

  if (error) {
    return <main className="min-h-screen bg-[#0D1117] p-8 text-[#FCA5A5]">{error}</main>;
  }

  if (!detail) {
    return <main className="min-h-screen bg-[#0D1117] p-8 text-[#71717A]">Loading application...</main>;
  }

  const { application } = detail;
  const topNudge = detail.nudges.find((nudge) => nudge.priority === "high") ?? detail.nudges[0];

  return (
    <main className="min-h-screen bg-[#0D1117] text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <Link href="/tracker" className="text-sm text-[#A1A1AA] hover:text-white">
          Back to tracker
        </Link>
        <header className="mt-6 flex flex-col justify-between gap-4 border-b border-[#1E2535] pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#71717A]">{application.status.replace("_", " ")}</p>
            <h1 className="mt-2 text-3xl font-semibold">{application.company_name}</h1>
            <p className="mt-2 text-[#A1A1AA]">{application.role_title}</p>
            <div className="mt-4">
              <StatusBadge status={application.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/tracker/${application.id}/outreach`} className="bg-white px-4 py-2 text-sm font-semibold text-[#0D1117]">
              Outreach
            </Link>
            <Link href={`/tracker/${application.id}/prep`} className="border border-[#273244] px-4 py-2 text-sm text-white">
              Prep
            </Link>
          </div>
        </header>

        <div className="mt-6">
          <NudgeBanner nudge={topNudge} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="border border-[#1E2535] bg-[#101620] p-6">
            <h2 className="text-sm font-semibold text-white">Timeline</h2>
            <div className="mt-6">
              <EventTimeline events={detail.events} />
            </div>
          </section>
          <aside className="space-y-4">
            <div className="border border-[#1E2535] bg-[#101620] p-5">
              <h2 className="text-sm font-semibold text-white">Role context</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-[#71717A]">Location</dt>
                  <dd className="mt-1 text-white">{application.location || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-[#71717A]">Source</dt>
                  <dd className="mt-1 text-white">{application.source || "Other"}</dd>
                </div>
                <div>
                  <dt className="text-[#71717A]">Nudges</dt>
                  <dd className="mt-1 text-white">{detail.nudges.length}</dd>
                </div>
              </dl>
            </div>
            {application.notes && (
              <div className="border border-[#1E2535] bg-[#101620] p-5">
                <h2 className="text-sm font-semibold text-white">Notes</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#A1A1AA]">{application.notes}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
