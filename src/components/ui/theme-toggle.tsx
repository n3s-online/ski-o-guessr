import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";

const STORAGE_KEY = "ski-o-guessr-theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);

  // Load theme from localStorage and set initial theme
  useEffect(() => {
    const loadTheme = () => {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      let newIsDark: boolean;
      if (savedTheme) {
        newIsDark = savedTheme === "dark";
      } else {
        newIsDark = prefersDark;
      }

      setIsDark(newIsDark);
      document.documentElement.classList.toggle("dark", newIsDark);
    };

    loadTheme();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem(STORAGE_KEY, newIsDark ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {!isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
