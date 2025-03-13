import { useState, useEffect } from "react";
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

export interface AppSettings {
  showCountryNames: boolean;
  useMetricUnits: boolean;
}

export function SettingsDropdown() {
  const [showCountryNames, setShowCountryNames] = useState<boolean>(false);
  const [useMetricUnits, setUseMetricUnits] = useState<boolean>(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (typeof parsedSettings.showCountryNames === "boolean") {
          setShowCountryNames(parsedSettings.showCountryNames);
        }
        if (typeof parsedSettings.useMetricUnits === "boolean") {
          setUseMetricUnits(parsedSettings.useMetricUnits);
        }
      } catch (error) {
        console.error("Failed to parse settings from localStorage:", error);
      }
    }
  }, []);

  const saveSettings = (settings: Partial<AppSettings>) => {
    const currentSettings: AppSettings = {
      showCountryNames,
      useMetricUnits,
      ...settings,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent("settingsChanged"));
  };

  const handleShowCountryNamesChange = (checked: boolean) => {
    setShowCountryNames(checked);
    saveSettings({ showCountryNames: checked });
  };

  const handleUseMetricUnitsChange = (checked: boolean) => {
    setUseMetricUnits(checked);
    saveSettings({ useMetricUnits: checked });
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
        <DropdownMenuCheckboxItem
          checked={useMetricUnits}
          onCheckedChange={handleUseMetricUnitsChange}
        >
          Use metric units (km)
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
