import React, { Suspense, useMemo, useEffect, useState } from "react";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from "./pages/Home";
import { useLocalStorageState } from "ahooks";

type ThemeMode = "light" | "dark" | "system";

const App: React.FC = () => {
  const [themeMode, setThemeMode] = useLocalStorageState<ThemeMode>("theme-mode", {
    defaultValue: "system",
  });

  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const appearance = useMemo(() => {
    if (themeMode === "system") {
      return systemDarkMode ? "dark" : "light";
    }
    return themeMode;
  }, [themeMode, systemDarkMode]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  useEffect(() => {
    const currentTheme = themeMode === "system" ? (systemDarkMode ? "dark" : "light") : themeMode;
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [themeMode, systemDarkMode]);

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("auth_token"));

  useEffect(() => {
    if (isLoggedIn) {
      fetch("/api/visit/log?logged=true").catch(() => {});
    } else {
      fetch("/api/visit/log").catch(() => {});
    }
  }, []);

  return (
    <Theme appearance={appearance} accentColor={appearance === "dark" ? "teal" : "blue"} grayColor="gray" panelBackground="translucent">
      <BrowserRouter>
        <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", fontSize: "24px" }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home themeMode={themeMode} setThemeMode={setThemeMode} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Theme>
  );
};

export default React.memo(App);
