import { GuessResult } from "../types/game";
import { SkiResortMetadata } from "./ski-data";
import { getDaysSinceGameStart, getFormattedETDate } from "./time-utils";
import {
  calculateDistanceAndDirection,
  formatDistance,
} from "./distance-utils";

/**
 * Get direction emoji based on bearing
 */
function getDirectionEmoji(bearing: number): string {
  // Convert bearing to 0-360 range
  const normalizedBearing = ((bearing % 360) + 360) % 360;

  // Map bearing to one of 8 directions with emojis
  if (normalizedBearing >= 337.5 || normalizedBearing < 22.5) {
    return "⬆️"; // North
  } else if (normalizedBearing >= 22.5 && normalizedBearing < 67.5) {
    return "↗️"; // Northeast
  } else if (normalizedBearing >= 67.5 && normalizedBearing < 112.5) {
    return "➡️"; // East
  } else if (normalizedBearing >= 112.5 && normalizedBearing < 157.5) {
    return "↘️"; // Southeast
  } else if (normalizedBearing >= 157.5 && normalizedBearing < 202.5) {
    return "⬇️"; // South
  } else if (normalizedBearing >= 202.5 && normalizedBearing < 247.5) {
    return "↙️"; // Southwest
  } else if (normalizedBearing >= 247.5 && normalizedBearing < 292.5) {
    return "⬅️"; // West
  } else {
    return "↖️"; // Northwest
  }
}

/**
 * Generate an emojified version of the game results for sharing
 */
export function generateShareText(
  guessResults: GuessResult[],
  currentResortMetadata: SkiResortMetadata,
  currentResortFolderName: string,
  showCountryNames: boolean,
  useMetricUnits: boolean = false
): string {
  // Get the puzzle number (days since game start)
  const puzzleNumber = getDaysSinceGameStart() + 1;

  // Start with the header - simplified format
  let shareText = `https://skioguessr.app #${puzzleNumber}\n`;
  shareText += `${getFormattedETDate()}\n\n`;

  // Add emojis for each guess
  for (const guess of guessResults) {
    // Resort name match - compare with the current resort's folderName
    if (guess.resortName === currentResortFolderName) {
      shareText += "🟩 "; // Green for correct resort
    } else {
      shareText += "🟥 "; // Red for incorrect resort
    }

    // Country match
    if (showCountryNames) {
      if (
        guess.metadata?.country &&
        guess.metadata.country.toLowerCase() ===
          currentResortMetadata.country.toLowerCase()
      ) {
        shareText += "🟩 "; // Green for correct country
      } else {
        shareText += "🟥 "; // Red for incorrect country
      }
    }

    // Region match
    if (
      guess.metadata?.region &&
      guess.metadata.region.toLowerCase() ===
        currentResortMetadata.region.toLowerCase()
    ) {
      shareText += "🟩 "; // Green for correct region
    } else {
      shareText += "🟥 "; // Red for incorrect region
    }

    // Continent match
    if (
      guess.metadata?.continent &&
      guess.metadata.continent.toLowerCase() ===
        currentResortMetadata.continent.toLowerCase()
    ) {
      shareText += "🟩 "; // Green for correct continent
    } else {
      shareText += "🟥 "; // Red for incorrect continent
    }

    // Acreage comparison
    if (
      guess.metadata?.skiable_acreage === currentResortMetadata.skiable_acreage
    ) {
      shareText += "🟩 "; // Green for exact match
    } else if (guess.metadata?.skiable_acreage !== undefined) {
      if (
        guess.metadata.skiable_acreage > currentResortMetadata.skiable_acreage
      ) {
        shareText += "⬇️ "; // Down arrow for too high
      } else {
        shareText += "⬆️ "; // Up arrow for too low
      }
    } else {
      shareText += "⬜ "; // White for unknown
    }

    // Lifts comparison
    if (guess.metadata?.lifts === currentResortMetadata.lifts) {
      shareText += "🟩 "; // Green for exact match
    } else if (guess.metadata?.lifts !== undefined) {
      if (guess.metadata.lifts > currentResortMetadata.lifts) {
        shareText += "⬇️ "; // Down arrow for too high
      } else {
        shareText += "⬆️ "; // Up arrow for too low
      }
    } else {
      shareText += "⬜ "; // White for unknown
    }

    // Parent company match
    if (
      guess.metadata?.parent_company &&
      guess.metadata.parent_company.toLowerCase() ===
        currentResortMetadata.parent_company.toLowerCase()
    ) {
      shareText += "🟩"; // Green for correct parent company
    } else {
      shareText += "🟥"; // Red for incorrect parent company
    }

    // Add distance if coordinates are available
    if (
      guess.resortName !== currentResortFolderName && // Only show distance for incorrect guesses
      guess.metadata?.latitude !== undefined &&
      guess.metadata?.longitude !== undefined &&
      currentResortMetadata?.latitude !== undefined &&
      currentResortMetadata?.longitude !== undefined
    ) {
      const distanceInfo = calculateDistanceAndDirection(
        currentResortMetadata.latitude,
        currentResortMetadata.longitude,
        guess.metadata.latitude,
        guess.metadata.longitude
      );

      const distance = useMetricUnits
        ? distanceInfo.distanceKm
        : distanceInfo.distanceMiles;

      const directionEmoji = getDirectionEmoji(distanceInfo.direction);

      shareText += ` (${formatDistance(
        distance,
        useMetricUnits
      )} ${directionEmoji})`;
    }

    shareText += "\n";
  }

  // No URL at the bottom

  return shareText;
}

/**
 * Copy text to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
