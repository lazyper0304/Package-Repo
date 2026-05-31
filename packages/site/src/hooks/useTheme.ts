import { useLocalStorageState } from "ahooks";
import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export function useTheme() {
  const [mode, setMode] = useLocalStorageState<ThemeMode>("theme-mode", {
    defaultValue: "system",
    deserializer: (v) => {
      try { return JSON.parse(v); } catch { return v as ThemeMode; }
    },
  });

  const [systemDarkMode, setSystemDarkMode] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const effective = (mode || "system") === "system"
      ? (systemDarkMode ? "dark" : "light")
      : mode || "light";
    document.documentElement.setAttribute("data-theme", effective);
    document.documentElement.style.backgroundColor =
      effective === "dark" ? "#0f172a" : "#f8fafc";
  }, [mode, systemDarkMode]);

  const cycleTheme = useCallback(() => {
    const next: ThemeMode =
      (mode || "system") === "light" ? "dark" : (mode || "system") === "dark" ? "system" : "light";
    setMode(next);
  }, [mode, setMode]);

  return { mode: mode || "system", systemDarkMode, cycleTheme };
}
