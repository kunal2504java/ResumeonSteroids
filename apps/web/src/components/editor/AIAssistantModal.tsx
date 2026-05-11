"use client";

import { useEffect, useRef, useState } from "react";
import type { Resume } from "@resumeai/shared";
import { ScrollArea } from "@/components/ui/scroll-area";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume | null;
  jobDescription: string;
  onApplyResume: (resume: Resume) => void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
}

interface FixResumeResponse {
  resume: Resume;
  changes?: string[];
  assistant_message?: string;
}

const QUICK_PROMPTS = [
  { code: "01", label: "Fix all", detail: "One-page, ATS, duplicates, weak copy" },
  { code: "02", label: "Experience", detail: "Sharper technical bullets" },
  { code: "03", label: "Dedupe", detail: "Remove repeated project evidence" },
  { code: "04", label: "ATS pass", detail: "Improve keyword placement" },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "assistant-initial",
  role: "assistant",
  content:
    "Tell me what to change. I can rewrite sections, remove duplicates, tighten to one page, or improve ATS fit.",
};

function expandQuickPrompt(prompt: string): string {
  const prompts: Record<string, string> = {
    "Fix all": "Fix everything and make this a strong one-page resume.",
    Experience:
      "Improve only the experience bullets. Make them technical, specific, and metric-driven.",
    Dedupe:
      "Remove duplicate projects or repeated bullets and keep only the strongest evidence.",
    "ATS pass":
      "Make this resume more ATS friendly for the pasted job description.",
  };

  return prompts[prompt] ?? prompt;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AIAssistantModal({
  isOpen,
  onClose,
  resume,
  jobDescription,
  onApplyResume,
  onToast,
}: AIAssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function sendMessage(promptOverride?: string) {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || !resume || loading) return;

    const userMessage: ChatMessage = {
      id: makeId("user"),
      role: "user",
      content: prompt,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/ai/fix-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          jobDescription,
          instruction: prompt,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "AI assistant failed" }));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as FixResumeResponse;
      const fixedResume: Resume = {
        ...resume,
        ...data.resume,
        id: resume.id,
        userId: resume.userId,
        template: resume.template,
        createdAt: resume.createdAt,
        updatedAt: new Date().toISOString(),
      };

      onApplyResume(fixedResume);
      const assistantText =
        data.assistant_message ||
        data.changes?.join(" ") ||
        "I applied the requested resume changes.";

      setMessages((current) => [
        ...current,
        {
          id: makeId("assistant"),
          role: "assistant",
          content: assistantText,
        },
      ]);
      onToast(data.changes?.[0] ?? "AI assistant updated the resume.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI assistant failed";
      setMessages((current) => [
        ...current,
        {
          id: makeId("assistant-error"),
          role: "assistant",
          content: `I could not apply that change: ${message}`,
        },
      ]);
      onToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close AI assistant"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section className="absolute bottom-5 right-5 top-20 flex w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[#090909]/96 shadow-[0_34px_120px_rgba(0,0,0,0.78)] ring-1 ring-white/[0.04]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <div className="relative border-b border-white/10 bg-black/60">
          <div className="flex">
            <div className="w-1 bg-[var(--accent)]" />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">
                    Resume Ops
                  </span>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    Live edit
                  </span>
                </div>
                <h2 className="mt-1 truncate text-[15px] font-semibold tracking-tight text-white">
                  AI command console
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-sm text-zinc-500 transition hover:border-white/20 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
          <div className="border-t border-white/[0.06] px-4 py-2">
            <p className="text-[11px] leading-4 text-zinc-500">
              Type an instruction. If the edit is safe, it is applied to the resume immediately.
            </p>
          </div>
        </div>

        <ScrollArea className="relative min-h-0 flex-1">
          <div className="space-y-4 p-3.5">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
              {QUICK_PROMPTS.map((prompt, index) => (
                <button
                  key={prompt.code}
                  type="button"
                  disabled={loading || !resume}
                  onClick={() => sendMessage(expandQuickPrompt(prompt.label))}
                  className={`group flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-[var(--accent)]/8 disabled:cursor-not-allowed disabled:opacity-50 ${
                    index > 0 ? "border-t border-white/[0.06]" : ""
                  }`}
                >
                  <span className="font-mono text-[10px] text-zinc-600 group-hover:text-[var(--accent)]">
                    {prompt.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-zinc-200">
                      {prompt.label}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-600 group-hover:text-zinc-400">
                      {prompt.detail}
                    </span>
                  </span>
                  <span className="text-[11px] text-zinc-700 group-hover:text-[var(--accent)]">
                    ↵
                  </span>
                </button>
              ))}
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`grid grid-cols-[44px_1fr] gap-2 ${
                  message.role === "user" ? "pl-8" : ""
                }`}
              >
                <div
                  className={`pt-2 font-mono text-[10px] uppercase tracking-[0.16em] ${
                    message.role === "user" ? "text-[var(--accent)]" : "text-zinc-600"
                  }`}
                >
                  {message.role === "user" ? "You" : "Ops"}
                </div>
                <div
                  className={`border-l px-3 py-2 text-xs leading-5 ${
                    message.role === "user"
                      ? "border-[var(--accent)]/70 bg-[var(--accent)]/[0.08] text-zinc-100"
                      : "border-white/10 bg-white/[0.025] text-zinc-300"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="grid grid-cols-[44px_1fr] gap-2">
                <div className="pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                  Ops
                </div>
                <div className="border-l border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-zinc-300">
                  <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                  Reviewing and applying changes...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form
          className="relative border-t border-white/10 bg-black/70 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <div className="flex items-end gap-2">
            <div className="hidden pb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600 sm:block">
              cmd
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="e.g. rewrite experience for backend roles"
              className="min-h-10 flex-1 resize-none border-0 border-l border-white/10 bg-transparent px-3 py-2.5 text-xs leading-5 text-white outline-none placeholder:text-zinc-700 focus:border-[var(--accent)]/70"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !resume}
              className="h-10 rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Run
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
