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
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-foreground">
              ResumeAI
            </Link>
            <span className="text-xs text-muted">/</span>
            <span className="text-sm text-muted">Application tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-indigo-light"
            >
              Add application
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Pipeline</h1>
            <p className="mt-2 text-sm text-muted">
              Track applications, outreach, interviews, and next actions from one board.
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-muted">{applications.length} applications</span>
            <span className="text-muted">{nudges.length} nudges</span>
          </div>
        </motion.div>

        {error && (
          <div className="mb-5 border border-[#7F1D1D] bg-[#1F1111] px-4 py-3 text-sm text-[#FCA5A5]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="border border-border bg-surface p-8 text-sm text-muted">
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
