"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AddApplicationModal } from "@/components/tracker/AddApplicationModal";
import { ApplicationBoard } from "@/components/tracker/ApplicationBoard";
import { NudgeList } from "@/components/tracker/NudgeList";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { trackerApi } from "@/lib/trackerApi";
import type { Application, ApplicationStatus, Nudge } from "@/types/tracker";

const LOCAL_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [apps, nudgeRes] = await Promise.all([
        trackerApi.applications.list(),
        trackerApi.nudges.list(),
      ]);
      setApplications(apps.applications);
      setNudges(nudgeRes.nudges);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracker");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createApplication(body: Parameters<typeof trackerApi.applications.create>[0]) {
    setSaving(true);
    try {
      const res = await trackerApi.applications.create(body);
      setApplications((current) => [res.application, ...current]);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, status: ApplicationStatus) {
    try {
      const res = await trackerApi.applications.status(id, status);
      setApplications((current) =>
        current.map((application) => (application.id === id ? res.application : application)),
      );
      const nudgeRes = await trackerApi.nudges.list();
      setNudges(nudgeRes.nudges);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change status");
    }
  }

  async function dismissNudge(id: string) {
    await trackerApi.nudges.dismiss(id);
    setNudges((current) => current.filter((nudge) => nudge.id !== id));
  }

  async function completeNudge(id: string) {
    await trackerApi.nudges.complete(id);
    setNudges((current) => current.filter((nudge) => nudge.id !== id));
  }

  return (
    <main className="theme-adaptive min-h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none fixed left-1/2 top-[-18rem] h-[34rem] w-[62rem] -translate-x-1/2 rounded-full bg-white/[0.045] blur-[130px]" />

      <header className="relative z-10 border-b border-white/10 bg-[#0f0f0f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-foreground">
              ResumeAI
            </Link>
            <span className="text-xs text-zinc-700">/</span>
            <span className="text-sm text-zinc-500">Application tracker</span>
            {LOCAL_MODE && (
              <span className="rounded-full border border-white/10 bg-zinc-900/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Local mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/tracker/opportunities"
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              Opportunity feed
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black shadow-[0_0_26px_rgba(250,255,105,0.16)] transition hover:brightness-95"
            >
              Add application
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
        >
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-zinc-600">Pipeline</p>
            <h1 className="text-4xl font-semibold tracking-tight">Application board</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Track applications, outreach, interviews, and next actions from one board.
            </p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 backdrop-blur-md">
            <div className="border-r border-white/10 px-5 py-3">
              <div className="text-2xl font-light tracking-tight text-white">{applications.length}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">Applications</div>
            </div>
            <div className="px-5 py-3">
              <div className="text-2xl font-light tracking-tight text-white">{nudges.length}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">Nudges</div>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-8 text-sm text-zinc-500 backdrop-blur-md">
            Loading tracker...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <ApplicationBoard applications={applications} onStatusChange={changeStatus} />
            <NudgeList nudges={nudges} onDismiss={dismissNudge} onComplete={completeNudge} />
          </div>
        )}
      </div>

      <AddApplicationModal
        open={modalOpen}
        loading={saving}
        onClose={() => setModalOpen(false)}
        onCreate={createApplication}
      />
    </main>
  );
}
