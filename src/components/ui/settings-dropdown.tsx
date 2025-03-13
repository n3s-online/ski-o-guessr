import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const STORAGE_KEY = "ski-o-guessr-settings";

export function SettingsDropdown() {
  const [showCountryNames, setShowCountryNames] = useState<boolean>(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (typeof parsedSettings.showCountryNames === "boolean") {
          setShowCountryNames(parsedSettings.showCountryNames);
        }
      } catch (error) {
        console.error("Failed to parse settings from localStorage:", error);
      }
    }
  }, []);

  const handleShowCountryNamesChange = (checked: boolean) => {
    setShowCountryNames(checked);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ showCountryNames: checked })
    );
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent("settingsChanged"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Game Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showCountryNames}
          onCheckedChange={handleShowCountryNamesChange}
        >
          Show country names
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
