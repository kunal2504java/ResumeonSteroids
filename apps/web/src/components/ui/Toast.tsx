"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/lib/store/resumeStore";

export default function ToastContainer() {
  const toasts = useResumeStore((s) => s.toasts);
  const removeToast = useResumeStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`px-4 py-3 text-sm font-medium border backdrop-blur-sm cursor-pointer ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : toast.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-indigo/10 border-indigo/30 text-indigo-light"
            }`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
