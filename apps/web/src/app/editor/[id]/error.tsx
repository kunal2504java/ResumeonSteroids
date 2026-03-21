"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Editor Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#111118] border border-white/10 p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center bg-red-500/10 border border-red-500/20">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Editor ran into a problem
        </h2>
        <p className="text-sm text-[#71717A] mb-6 leading-relaxed">
          Your latest changes were auto-saved. You can try again or head back to
          the dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 bg-white/5 text-[#A1A1AA] text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
          >
            Back to dashboard
          </button>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#6366f1] text-white text-sm font-medium hover:bg-[#818cf8] transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
