import { create } from "zustand";

export type ToastLevel = "error" | "warning" | "success" | "info";

export interface Toast {
  id: string;
  level: ToastLevel;
  message: string;
}

/** Default auto-dismiss durations in ms, by level. */
const AUTO_DISMISS_MS: Record<ToastLevel, number> = {
  error: 8000,
  warning: 5000,
  success: 3000,
  info: 4000,
};

let nextId = 0;

interface ToastState {
  toasts: Toast[];
  addToast: (level: ToastLevel, message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (level, message) => {
    const id = `toast_${nextId++}`;
    set({ toasts: [...get().toasts, { id, level, message }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, AUTO_DISMISS_MS[level]);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
