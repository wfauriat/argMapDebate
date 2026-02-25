import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  hydrate: () => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      applyTheme(next);
      return { theme: next };
    }),
  hydrate: () => {
    // Sync store state with what the inline <head> script already applied
    const isDark = document.documentElement.classList.contains("dark");
    set({ theme: isDark ? "dark" : "light" });
  },
}));
