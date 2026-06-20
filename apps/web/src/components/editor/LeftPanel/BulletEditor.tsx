"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store/resumeStore";

interface BulletEditorProps {
  bullets: string[];
  parentId: string;
  parentType: "experience" | "project";
}

export default function BulletEditor({ bullets, parentId, parentType }: BulletEditorProps) {
  const addBullet = useResumeStore((s) => (parentType === "experience" ? s.addBullet : s.addProjectBullet));
  const updateBullet = useResumeStore((s) => (parentType === "experience" ? s.updateBullet : s.updateProjectBullet));
  const removeBullet = useResumeStore((s) => (parentType === "experience" ? s.removeBullet : s.removeProjectBullet));
  const [rewritingIdx, setRewritingIdx] = useState<number | null>(null);
  const [streamText, setStreamText] = useState("");
  const addToast = useResumeStore((s) => s.addToast);

  async function handleRewrite(index: number, mode: string) {
    const bullet = bullets[index];
    if (!bullet) return;

    setRewritingIdx(index);
    setStreamText("");

    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet, mode }),
      });

      if (!res.ok || !res.body) {
        addToast("AI rewrite failed", "error");
        setRewritingIdx(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        setStreamText(result);
      }

      updateBullet(parentId, index, result.trim());
      addToast("Bullet rewritten", "success");
    } catch {
      addToast("AI rewrite failed", "error");
    } finally {
      setRewritingIdx(null);
      setStreamText("");
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Bullet points</label>
        <button onClick={() => addBullet(parentId)} className="ed-add" style={{ fontSize: 11 }}>+ Add bullet</button>
      </div>

      {bullets.map((bullet, i) => (
        <div key={i} className="group relative">
          <div className="flex gap-2">
            <span className="ed-index mt-2 shrink-0">{i + 1}.</span>
            <div className="flex-1">
              <textarea
                value={rewritingIdx === i ? streamText || bullet : bullet}
                onChange={(e) => updateBullet(parentId, i, e.target.value)}
                readOnly={rewritingIdx === i}
                placeholder="Describe your achievement…"
                rows={2}
                className="w-full resize-none px-2.5 py-1.5 text-xs outline-none"
              />

              <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                {rewritingIdx === i ? (
                  <span className="ed-index animate-pulse">Rewriting…</span>
                ) : (
                  ([
                    ["stronger", "Stronger"],
                    ["metrics", "Add metrics"],
                    ["concise", "Concise"],
                    ["different", "Different"],
                  ] as const).map(([mode, label]) => (
                    <button key={mode} onClick={() => handleRewrite(i, mode)} className="ed-pill">
                      {label}
                    </button>
                  ))
                )}
                <button onClick={() => removeBullet(parentId, i)} className="ed-remove ml-auto">×</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
