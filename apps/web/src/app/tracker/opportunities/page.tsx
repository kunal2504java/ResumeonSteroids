"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackerApi } from "@/lib/trackerApi";
import type { JobOpportunity } from "@/types/tracker";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [extractUrl, setExtractUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await trackerApi.opportunities.list();
      setOpportunities(res.opportunities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addOpportunity() {
    setLoading(true);
    setError("");
    try {
      const res = await trackerApi.opportunities.create({
        company_name: company.trim(),
        role_title: role.trim(),
        location: location.trim(),
        source: sourceUrl.includes("linkedin.com") ? "linkedin_post" : "manual",
        source_url: sourceUrl.trim(),
        raw_text: rawText.trim(),
      });
      setOpportunities((current) => [res.opportunity, ...current]);
      setCompany("");
      setRole("");
      setLocation("");
      setSourceUrl("");
      setRawText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save opportunity");
    } finally {
      setLoading(false);
    }
  }

  async function createApplication(id: string) {
    setLoading(true);
    setError("");
    try {
      await trackerApi.opportunities.createApplication(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setLoading(false);
    }
  }

  async function extractAndCreate() {
    if (!extractUrl.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await trackerApi.opportunities.extract({
        url: extractUrl.trim(),
        create_application: true,
      });
      setOpportunities((current) => [res.opportunity, ...current]);
      setExtractUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract job link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="theme-adaptive min-h-screen bg-[#0f0f0f] text-white">
      <header className="border-b border-white/10 bg-[#0f0f0f]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/tracker" className="text-zinc-500 transition hover:text-white">
              Tracker
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-medium text-white">Opportunities</span>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-2xl border border-white/10 bg-zinc-900/30 p-5 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">JD extractor</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Paste a job link</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Supports readable career pages and common ATS links. It extracts the JD,
            normalizes the role, and creates a tracker entry.
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <label className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                Job URL
              </label>
              <input
                value={extractUrl}
                onChange={(event) => setExtractUrl(event.target.value)}
                placeholder="https://boards.greenhouse.io/... or Workday/Keka/LinkedIn link"
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm outline-none placeholder:text-zinc-700 focus:border-white/20"
              />
              <button
                type="button"
                disabled={loading || !extractUrl.trim()}
                onClick={() => void extractAndCreate()}
                className="mt-3 w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Extracting..." : "Extract JD + create tracker entry"}
              </button>
            </div>

            <div className="pt-2 text-center text-[11px] uppercase tracking-[0.18em] text-zinc-700">
              or add manually
            </div>

            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Company"
              className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm outline-none placeholder:text-zinc-700 focus:border-white/20"
            />
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role title"
              className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm outline-none placeholder:text-zinc-700 focus:border-white/20"
            />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location"
              className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm outline-none placeholder:text-zinc-700 focus:border-white/20"
            />
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="LinkedIn post or job URL"
              className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm outline-none placeholder:text-zinc-700 focus:border-white/20"
            />
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={8}
              placeholder="Paste job post text here..."
              className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm leading-6 outline-none placeholder:text-zinc-700 focus:border-white/20"
            />
            <button
              type="button"
              disabled={loading || (!rawText.trim() && (!company.trim() || !role.trim()))}
              onClick={() => void addOpportunity()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add opportunity"}
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        </section>

        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Feed</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {opportunities.length} opportunities
              </p>
            </div>
            <button
              onClick={() => void load()}
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-3">
            {opportunities.map((opportunity) => (
              <article
                key={opportunity.id}
                className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 backdrop-blur-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {opportunity.role_title}
                      </h3>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                        {opportunity.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">
                      {opportunity.company_name}
                      {opportunity.location ? ` · ${opportunity.location}` : ""}
                    </p>
                    {opportunity.normalized_jd && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
                        {opportunity.normalized_jd}
                      </p>
                    )}
                    {opportunity.source_url && (
                      <a
                        href={opportunity.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs text-zinc-500 underline-offset-4 hover:text-white hover:underline"
                      >
                        Open source
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={loading || opportunity.status !== "new"}
                    onClick={() => void createApplication(opportunity.id)}
                    className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Create application
                  </button>
                </div>
              </article>
            ))}

            {!loading && opportunities.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/20 p-10 text-center text-sm text-zinc-500">
                No opportunities yet. Add a LinkedIn post or job description to start.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
