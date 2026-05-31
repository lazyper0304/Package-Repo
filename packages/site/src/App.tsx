import { useEffect } from "react";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from "./pages/Home";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { mode, systemDarkMode } = useTheme();

  const appearance = mode === "system" ? (systemDarkMode ? "dark" : "light") : mode;

  useEffect(() => {
    fetch("/api/visit/log").catch(() => {});
  }, []);

  return (
    <Theme appearance={appearance} accentColor="teal" grayColor="slate" panelBackground="translucent">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </Theme>
  );
}
