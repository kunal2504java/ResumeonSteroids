"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AddApplicationModal } from "@/components/tracker/AddApplicationModal";
import { ApplicationBoard } from "@/components/tracker/ApplicationBoard";
import { NudgeList } from "@/components/tracker/NudgeList";
import AppHeader from "@/components/layout/AppHeader";
import InkLayer from "@/components/ink/InkLayer";
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
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <InkLayer />
      <AppHeader active="tracker" />

      <main className="page-wrap" style={{ maxWidth: 1500, paddingTop: 36, paddingBottom: 70, position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="tk-page-head"
        >
          <div>
            <span className="eyebrow">your pipeline {LOCAL_MODE && "· local mode"}</span>
            <h1 style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 800, fontSize: "clamp(32px,4.4vw,48px)", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 12 }}>
              The <span data-mark="underline" data-color="pen" style={{ position: "relative" }}>board</span>
            </h1>
            <p className="hand hand-ink" style={{ fontSize: 17, marginTop: 6 }}>
              everything you&apos;ve sent, pinned where you can see it
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="tk-tally">
              <div className="ink-card" style={{ padding: "12px 18px" }}>
                <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{applications.length}</div>
                <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-soft)", marginTop: 5 }}>applied</div>
              </div>
              <div className="ink-card" style={{ padding: "12px 18px" }}>
                <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 26, lineHeight: 1, color: "var(--pen)" }}>{nudges.length}</div>
                <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-soft)", marginTop: 5 }}>nudges</div>
              </div>
            </div>
            <Link href="/tracker/opportunities" className="tk-mini" style={{ flex: "0 0 auto", padding: "10px 16px" }}>Opportunity feed</Link>
            <button onClick={() => setModalOpen(true)} className="btn btn-pen btn-sm">
              <span aria-hidden="true">+</span> Add application
            </button>
          </div>
        </motion.div>

        {error && (
          <div style={{ marginBottom: 20, border: "1.5px solid var(--pen)", background: "rgba(226,59,23,0.08)", padding: "12px 16px", fontSize: 14, color: "var(--pen-deep)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="surf hand" style={{ fontSize: 18 }}>laying out the board…</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <ApplicationBoard applications={applications} onStatusChange={changeStatus} />
            <NudgeList nudges={nudges} onDismiss={dismissNudge} onComplete={completeNudge} />
          </div>
        )}
      </main>

      <AddApplicationModal
        open={modalOpen}
        loading={saving}
        onClose={() => setModalOpen(false)}
        onCreate={createApplication}
      />

      <style>{`
        .tk-page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 26px; flex-wrap: wrap; }
        .tk-tally { display: flex; gap: 12px; }
        @media (max-width: 720px) { .tk-tally { display: none; } }
      `}</style>
    </div>
  );
}
