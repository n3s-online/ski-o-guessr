/**
 * Utility functions for local storage operations
 */

// Storage keys
const GAME_STATE_KEY = "ski-o-guessr-game-state";
const LAST_PLAYED_KEY = "ski-o-guessr-last-played";

export interface GameState {
  currentResortId: string;
  guessedCorrectly: boolean;
  previousGuesses: string[];
  guessResults: any[]; // Using any for simplicity, should match GuessResult type
  revealPercentage: number;
  centerCoordinates: { x: number; y: number };
}

/**
 * Save the current game state to local storage
 */
export function saveGameState(gameState: GameState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    // Update last played timestamp
    localStorage.setItem(LAST_PLAYED_KEY, new Date().toISOString());
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
}

/**
 * Load the game state from local storage
 * @returns The saved game state or null if not found
 */
export function loadGameState(): GameState | null {
  try {
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    if (!savedState) return null;

    return JSON.parse(savedState) as GameState;
  } catch (error) {
    console.error("Failed to load game state:", error);
    return null;
  }
}

/**
 * Get the last played date from local storage
 * @returns The last played date or null if not found
 */
export function getLastPlayedDate(): Date | null {
  try {
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
    if (!lastPlayed) return null;

    return new Date(lastPlayed);
  } catch (error) {
    console.error("Failed to get last played date:", error);
    return null;
  }
}

/**
 * Clear the game state from local storage
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch (error) {
    console.error("Failed to clear game state:", error);
  }
}
