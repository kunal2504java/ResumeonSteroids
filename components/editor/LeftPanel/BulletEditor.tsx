"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store/resumeStore";

interface BulletEditorProps {
  bullets: string[];
  parentId: string;
  parentType: "experience" | "project";
}

export default function BulletEditor({
  bullets,
  parentId,
  parentType,
}: BulletEditorProps) {
  const addBullet = useResumeStore((s) =>
    parentType === "experience" ? s.addBullet : s.addProjectBullet
  );
  const updateBullet = useResumeStore((s) =>
    parentType === "experience" ? s.updateBullet : s.updateProjectBullet
  );
  const removeBullet = useResumeStore((s) =>
    parentType === "experience" ? s.removeBullet : s.removeProjectBullet
  );
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-[#71717A] font-medium">
          Bullet Points
        </label>
        <button
          onClick={() => addBullet(parentId)}
          className="text-[10px] text-[#6366f1] hover:text-[#818cf8] transition-colors cursor-pointer"
        >
          + Add bullet
        </button>
      </div>

      {bullets.map((bullet, i) => (
        <div key={i} className="group relative">
          <div className="flex gap-2">
            <span className="text-[10px] text-[#71717A] mt-2 shrink-0 font-mono">
              {i + 1}.
            </span>
            <div className="flex-1">
              <textarea
                value={rewritingIdx === i ? streamText || bullet : bullet}
                onChange={(e) => updateBullet(parentId, i, e.target.value)}
                readOnly={rewritingIdx === i}
                placeholder="Describe your achievement..."
                rows={2}
                className="w-full bg-[#161B27] border border-[#1E2535] px-2.5 py-1.5 text-xs text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono resize-none"
              />

              {/* AI rewrite buttons */}
              <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {rewritingIdx === i ? (
                  <span className="text-[10px] text-[#6366f1] animate-pulse">
                    Rewriting...
                  </span>
                ) : (
                  <>
                    {(
                      [
                        ["stronger", "Stronger"],
                        ["metrics", "Add metrics"],
                        ["concise", "Concise"],
                        ["different", "Different"],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        onClick={() => handleRewrite(i, mode)}
                        className="text-[9px] px-2 py-0.5 text-[#6366f1] bg-[#6366f1]/10 border border-[#6366f1]/20 hover:bg-[#6366f1]/20 transition-colors cursor-pointer"
                      >
                        ✨ {label}
                      </button>
                    ))}
                  </>
                )}

                <button
                  onClick={() => removeBullet(parentId, i)}
                  className="ml-auto text-[9px] text-red-400/50 hover:text-red-400 transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
