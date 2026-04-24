"use client";

import { useEffect, useMemo, useState } from "react";
import type { Application, OutreachDraft, OutreachTarget } from "@/types/tracker";
import { trackerApi } from "@/lib/trackerApi";
import { TargetCard } from "./TargetCard";
import { DraftComposer } from "./DraftComposer";

interface Props {
  application: Application;
  initialTargets: OutreachTarget[];
  initialDrafts: OutreachDraft[];
}

export function OutreachPanel({ application, initialTargets, initialDrafts }: Props) {
  const [targets, setTargets] = useState(initialTargets);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [selectedTargetId, setSelectedTargetId] = useState(initialTargets[0]?.id ?? "");
  const [selectedDraftId, setSelectedDraftId] = useState(initialDrafts[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTarget = targets.find((target) => target.id === selectedTargetId) ?? targets[0];
  const targetDrafts = useMemo(
    () => drafts.filter((draft) => draft.outreach_target_id === selectedTarget?.id),
    [drafts, selectedTarget?.id],
  );
  const selectedDraft = targetDrafts.find((draft) => draft.id === selectedDraftId) ?? targetDrafts[0];

  useEffect(() => {
    if (!selectedDraftId && targetDrafts[0]) {
      setSelectedDraftId(targetDrafts[0].id);
    }
  }, [selectedDraftId, targetDrafts]);

  async function findTargets() {
    setLoading(true);
    setError("");
    try {
      const res = await trackerApi.outreach.findTargets({
        application_id: application.id,
        company_name: application.company_name,
        role_title: application.role_title,
      });
      setTargets(res.targets);
      setSelectedTargetId(res.targets[0]?.id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find targets");
    } finally {
      setLoading(false);
    }
  }

  async function generate(target: OutreachTarget) {
    setLoading(true);
    setError("");
    try {
      const res = await trackerApi.outreach.generate({
        application_id: application.id,
        outreach_target_id: target.id,
        tone: "professional",
        candidate_context: {
          name: "",
          top_achievement: application.notes ?? "",
          relevant_skills: [],
        },
      });
      setDrafts((current) => [...res.drafts, ...current]);
      setSelectedDraftId(res.drafts[0]?.id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate drafts");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft(draftId: string, body: { subject_line?: string | null; body: string }) {
    try {
      const res = await trackerApi.outreach.updateDraft(draftId, body);
      setDrafts((current) => current.map((draft) => (draft.id === draftId ? res.draft : draft)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    }
  }

  async function markSent(draftId: string) {
    setLoading(true);
    try {
      const res = await trackerApi.outreach.markSent(draftId);
      setDrafts((current) => current.map((draft) => (draft.id === draftId ? res.draft : draft)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark sent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[720px] gap-5 lg:grid-cols-[minmax(280px,0.42fr)_1fr]">
      <section className="border border-[#1E2535] bg-[#0D1117]">
        <div className="border-b border-[#1E2535] p-5">
          <h1 className="text-lg font-semibold text-white">Outreach</h1>
          <p className="mt-1 text-sm text-[#71717A]">
            {application.company_name} - {application.role_title}
          </p>
          <button
            onClick={findTargets}
            disabled={loading}
            className="mt-4 w-full bg-white px-3 py-2 text-xs font-semibold text-[#0D1117] transition hover:bg-[#E5E7EB] disabled:opacity-50"
          >
            {loading ? "Finding contacts..." : targets.length ? "Refresh contacts" : "Find contacts"}
          </button>
          {error && <p className="mt-3 text-xs text-[#FCA5A5]">{error}</p>}
        </div>
        <div className="space-y-3 p-4">
          {targets.length === 0 && (
            <p className="p-4 text-sm leading-6 text-[#71717A]">
              No targets yet. Find contacts to generate cold email, LinkedIn DM, and referral drafts.
            </p>
          )}
          {targets.map((target) => (
            <TargetCard
              key={target.id}
              target={target}
              selected={selectedTarget?.id === target.id}
              loading={loading}
              onSelect={() => {
                setSelectedTargetId(target.id);
                setSelectedDraftId("");
              }}
              onGenerate={() => generate(target)}
            />
          ))}
        </div>
      </section>

      <section className="min-w-0">
        {targetDrafts.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto">
            {targetDrafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => setSelectedDraftId(draft.id)}
                className={`border px-3 py-2 text-xs font-medium ${
                  selectedDraft?.id === draft.id
                    ? "border-[#6366F1] bg-[#172033] text-white"
                    : "border-[#273244] text-[#A1A1AA]"
                }`}
              >
                {draft.draft_type.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
        {selectedDraft ? (
          <DraftComposer
            draft={selectedDraft}
            loading={loading}
            onSave={saveDraft}
            onMarkSent={markSent}
          />
        ) : (
          <div className="flex min-h-[640px] items-center justify-center border border-dashed border-[#273244] bg-[#101620] p-8 text-center">
            <p className="max-w-sm text-sm leading-6 text-[#71717A]">
              Select a contact and generate drafts. This panel keeps drafts editable before sending.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

