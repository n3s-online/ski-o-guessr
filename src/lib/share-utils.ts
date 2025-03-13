import { GuessResult } from "../types/game";
import { SkiResortMetadata } from "./ski-data";
import { getDaysSinceGameStart, getFormattedETDate } from "./time-utils";

/**
 * Generate an emojified version of the game results for sharing
 */
export function generateShareText(
  guessResults: GuessResult[],
  currentResortMetadata: SkiResortMetadata,
  guessedCorrectly: boolean,
  currentResortFolderName: string
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
    if (
      guess.metadata?.country &&
      guess.metadata.country.toLowerCase() ===
        currentResortMetadata.country.toLowerCase()
    ) {
      shareText += "🟩 "; // Green for correct country
    } else {
      shareText += "🟥 "; // Red for incorrect country
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
