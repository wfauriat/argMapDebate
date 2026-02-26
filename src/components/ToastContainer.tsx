"use client";

import { useToastStore, type ToastLevel } from "@/store/useToastStore";

const LEVEL_STYLES: Record<ToastLevel, string> = {
  error:   "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400",
  warning: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400",
  success: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400",
  info:    "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400",
};

const CLOSE_STYLES: Record<ToastLevel, string> = {
  error:   "text-red-400 hover:text-red-600 dark:hover:text-red-300",
  warning: "text-amber-400 hover:text-amber-600 dark:hover:text-amber-300",
  success: "text-green-400 hover:text-green-600 dark:hover:text-green-300",
  info:    "text-blue-400 hover:text-blue-600 dark:hover:text-blue-300",
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2 p-3 text-sm border rounded-lg shadow-lg animate-slide-in ${LEVEL_STYLES[toast.level]}`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className={`shrink-0 ${CLOSE_STYLES[toast.level]}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
