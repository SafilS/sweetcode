"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTimeout(() => setTheme(isDark ? "dark" : "light"), 0);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sweetcode:theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sweetcode:theme", "light");
    }
  }

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      type="button"
    >
      {theme === "light" ? (
        <Moon aria-hidden="true" size={20} />
      ) : (
        <Sun aria-hidden="true" size={20} />
      )}
    </button>
  );
}
