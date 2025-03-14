import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Separator } from "./ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ArrowUp, ArrowDown } from "lucide-react";
import { GuessResult } from "../types/game";
import { SkiResort, SkiResortMetadata } from "../lib/ski-data";
import {
  calculateDistanceAndDirection,
  formatDistance,
} from "../lib/distance-utils";
import { useEffect, useState } from "react";

// Guesses Table Component props
interface GuessesTableProps {
  guessResults: GuessResult[];
  currentResort: SkiResort;
  metadata: SkiResortMetadata;
  formatResortName: (folderName: string) => string;
  isMatchingField: (
    guessValue: string | undefined,
    actualValue: string | undefined
  ) => boolean;
}

export const GuessesTable = ({
  guessResults,
  currentResort,
  metadata,
  formatResortName,
  isMatchingField,
}: GuessesTableProps) => {
  const [useMetricUnits, setUseMetricUnits] = useState<boolean>(false);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      const settingsStr = localStorage.getItem("ski-o-guessr-settings-v2");
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr);
          if (typeof settings.useMetricUnits === "boolean") {
            setUseMetricUnits(settings.useMetricUnits);
          }
        } catch (error) {
          console.error("Failed to parse settings:", error);
        }
      }
    };

    // Initial load
    handleSettingsChange();

    // Listen for changes
    window.addEventListener("settingsChanged", handleSettingsChange);
    return () => {
      window.removeEventListener("settingsChanged", handleSettingsChange);
    };
  }, []);

  // Get direction arrow with rotation based on bearing
  const getDirectionArrow = (bearing: number) => {
    // Convert bearing to 0-360 range
    const normalizedBearing = ((bearing % 360) + 360) % 360;

    // Calculate rotation style based on bearing
    const rotation = `rotate(${Math.round(normalizedBearing)}deg)`;

    return <ArrowUp className={`h-5 w-5`} style={{ transform: rotation }} />;
  };

  if (guessResults.length === 0) return null;

  return (
    <div className="mb-8 px-2">
      <div className="flex flex-col items-center mb-4">
        <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200">
          Your Guesses
        </h3>
        <Separator className="flex-grow ml-4" />
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableHead className="font-semibold">Resort</TableHead>
              <TableHead className="font-semibold">Distance</TableHead>
              <TableHead className="font-semibold">Country</TableHead>
              <TableHead className="font-semibold">Region</TableHead>
              <TableHead className="font-semibold">Continent</TableHead>
              <TableHead className="font-semibold">Acreage</TableHead>
              <TableHead className="font-semibold">Lifts</TableHead>
              <TableHead className="font-semibold">Parent Company</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guessResults.map((result, index) => {
              // Calculate distance and direction if both resorts have coordinates
              let distanceInfo = null;
              if (
                result.metadata?.latitude !== undefined &&
                result.metadata?.longitude !== undefined &&
                metadata?.latitude !== undefined &&
                metadata?.longitude !== undefined
              ) {
                distanceInfo = calculateDistanceAndDirection(
                  metadata.latitude,
                  metadata.longitude,
                  result.metadata.latitude,
                  result.metadata.longitude
                );
              }

              return (
                <TableRow key={index} className="border-b dark:border-gray-700">
                  <TableCell
                    className={
                      result.resortName === currentResort.folderName
                        ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100 font-medium"
                        : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                    }
                  >
                    {formatResortName(result.resortName)}
                  </TableCell>
                  <TableCell className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                    {distanceInfo ? (
                      <div className="flex items-center gap-2">
                        <span>
                          {formatDistance(
                            useMetricUnits
                              ? distanceInfo.distanceKm
                              : distanceInfo.distanceMiles,
                            useMetricUnits
                          )}
                        </span>
                        {result.resortName !== currentResort.folderName && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center">
                                  {getDirectionArrow(distanceInfo.direction)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Direction to actual resort</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      result.metadata &&
                      isMatchingField(result.metadata.country, metadata.country)
                        ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                        : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                    }
                  >
                    {result.metadata?.country || "Unknown"}
                  </TableCell>
                  <TableCell
                    className={
                      result.metadata &&
                      isMatchingField(result.metadata.region, metadata.region)
                        ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                        : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                    }
                  >
                    {result.metadata?.region || "Unknown"}
                  </TableCell>
                  <TableCell
                    className={
                      result.metadata &&
                      isMatchingField(
                        result.metadata.continent,
                        metadata.continent
                      )
                        ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                        : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                    }
                  >
                    {result.metadata?.continent || "Unknown"}
                  </TableCell>
                  <TableCell
                    className={
                      result.metadata &&
                      result.metadata.skiable_acreage ===
                        metadata.skiable_acreage
                        ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                        : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                    }
                  >
                    {result.metadata?.skiable_acreage || "Unknown"}
                    {result.metadata &&
                      metadata &&
                      result.metadata.skiable_acreage !==
                        metadata.skiable_acreage &&
                      result.metadata.skiable_acreage !== undefined && (
                        <span className="ml-2 inline-flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  {result.metadata.skiable_acreage >
                                  metadata.skiable_acreage ? (
                                    <ArrowDown className="h-4 w-4" />
                                  ) : (
                                    <ArrowUp className="h-4 w-4" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {result.metadata.skiable_acreage >
                                  metadata.skiable_acreage
                                    ? "Too high"
                                    : "Too low"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      )}
                  </TableCell>
                  <TableCell
                    className={
                      result.metadata &&
                      result.metadata.lifts === metadata.lifts
                        ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                        : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                    }
                  >
                    {result.metadata?.lifts || "Unknown"}
                    {result.metadata &&
                      metadata &&
                      result.metadata.lifts !== metadata.lifts &&
                      result.metadata.lifts !== undefined && (
                        <span className="ml-2 inline-flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  {result.metadata.lifts > metadata.lifts ? (
                                    <ArrowDown className="h-4 w-4" />
                                  ) : (
                                    <ArrowUp className="h-4 w-4" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {result.metadata.lifts > metadata.lifts
                                    ? "Too high"
                                    : "Too low"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      )}
                  </TableCell>
                  <TableCell
                    className={
                      result.metadata &&
                      isMatchingField(
                        result.metadata.parent_company,
                        metadata.parent_company
                      )
                        ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                        : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                    }
                  >
                    {result.metadata?.parent_company || "Unknown"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
