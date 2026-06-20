"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/lib/store/resumeStore";

const TOAST_INK: Record<string, string> = {
  success: "#1f7a3f",
  error: "#e23b17",
  info: "#2a4c86",
};

export default function ToastContainer() {
  const toasts = useResumeStore((s) => s.toasts);
  const removeToast = useResumeStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const ink = TOAST_INK[toast.type] ?? TOAST_INK.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              onClick={() => removeToast(toast.id)}
              className="cursor-pointer px-4 py-3 text-sm font-medium"
              style={{
                background: "var(--sheet)",
                color: "var(--ink)",
                borderLeft: `3px solid ${ink}`,
                boxShadow: "3px 4px 0 rgba(33,30,24,0.14), 8px 14px 22px rgba(33,30,24,0.14)",
              }}
            >
              {toast.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
