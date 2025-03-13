/**
 * Utility functions for time-based operations and daily puzzle selection
 */

// Game start date (UTC) - adjust this to your desired start date
const GAME_START_DATE = new Date("2024-03-01T00:00:00Z");

/**
 * Get the current date in Eastern Time (ET)
 * This handles both EST and EDT automatically
 */
export function getCurrentDateInET(): Date {
  // Create a date object for the current time
  const now = new Date();

  // Format the date in ET using Intl.DateTimeFormat
  const etFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  // Get the formatted date string
  const etDateString = etFormatter.format(now);

  // Parse the formatted date string back to a Date object
  // Format: MM/DD/YYYY, HH:MM:SS
  const [datePart, timePart] = etDateString.split(", ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Get the date at midnight ET for the current day
 */
export function getMidnightETDate(): Date {
  const etDate = getCurrentDateInET();
  etDate.setHours(0, 0, 0, 0);
  return etDate;
}

/**
 * Check if the game should reset based on the last played date
 * @param lastPlayedDate The last time the user played
 * @returns boolean indicating if the game should reset
 */
export function shouldResetGame(lastPlayedDate: Date | null): boolean {
  if (!lastPlayedDate) return true;

  const midnightET = getMidnightETDate();
  const lastPlayedMidnightET = new Date(lastPlayedDate);
  lastPlayedMidnightET.setHours(0, 0, 0, 0);

  // Compare the dates (ignoring time)
  return midnightET.getTime() > lastPlayedMidnightET.getTime();
}

/**
 * Get the daily puzzle index based on days since game start
 * @param resortCount The total number of available resorts
 * @returns The index of today's puzzle
 */
export function getDailyPuzzleIndex(resortCount: number): number {
  const midnightET = getMidnightETDate();

  // Calculate days since game start
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor(
    (midnightET.getTime() - GAME_START_DATE.getTime()) / millisecondsPerDay
  );

  // Use modulo to cycle through available resorts
  return ((daysSinceStart % resortCount) + resortCount) % resortCount;
}

/**
 * Get the time until the next reset (midnight ET)
 * @returns Object with hours, minutes, and seconds until reset
 */
export function getTimeUntilReset(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = getCurrentDateInET();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const millisUntilReset = tomorrow.getTime() - now.getTime();

  const hours = Math.floor(millisUntilReset / (1000 * 60 * 60));
  const minutes = Math.floor(
    (millisUntilReset % (1000 * 60 * 60)) / (1000 * 60)
  );
  const seconds = Math.floor((millisUntilReset % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

/**
 * Format the current date in ET for display
 * @returns Formatted date string (e.g., "March 12, 2024")
 */
export function getFormattedETDate(): string {
  const etDate = getCurrentDateInET();

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(etDate);
}
