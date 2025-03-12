import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          setTheme(
            theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
          )
        }
        title={`Current theme: ${theme}. Click to switch.`}
      >
        {theme === "light" && <Sun className="h-5 w-5" />}
        {theme === "dark" && <Moon className="h-5 w-5" />}
        {theme === "system" && <Monitor className="h-5 w-5" />}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
