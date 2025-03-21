import skiData from "../assets/ski-data/index.json";
import { getDailyPuzzleIndex, getShuffledArray } from "./time-utils";

export interface SkiResort {
  folderName: string;
}

export interface SkiResortMetadata {
  name: string;
  country: string;
  region: string;
  parent_company: string;
  continent: string;
  skiable_acreage: number;
  lifts: number;
  latitude: number;
  longitude: number;
  boxes: number[][];
}

export const getAllSkiResorts = (): SkiResort[] => {
  return skiData.skiResorts;
};

export const getRandomSkiResort = (): SkiResort => {
  const { skiResorts } = skiData;
  const randomIndex = Math.floor(Math.random() * skiResorts.length);
  return skiResorts[randomIndex];
};

/**
 * Get the daily ski resort based on the current date in Eastern Time
 * This ensures all users get the same resort on the same day
 * The resorts are deterministically shuffled to avoid alphabetical order
 */
export const getDailySkiResort = (): SkiResort => {
  const { skiResorts } = skiData;
  // Shuffle the resorts array deterministically based on the day
  const shuffledResorts = getShuffledArray(skiResorts);
  const dailyIndex = getDailyPuzzleIndex(shuffledResorts.length);
  return shuffledResorts[dailyIndex];
};

export const getSkiResortImageUrl = (folderName: string): string => {
  return `/ski-images/${folderName}/ski_map_original.png`;
};

export const getSkiResortRedactedImageUrl = (folderName: string): string => {
  return `/ski-images/${folderName}/ski_map_redacted.png`;
};

export const loadSkiResortMetadata = async (
  folderName: string
): Promise<SkiResortMetadata> => {
  try {
    const metadata = await import(
      `../assets/ski-data/${folderName}/metadata.json`
    );
    return metadata.default;
  } catch (error) {
    console.error(`Failed to load metadata for ${folderName}:`, error);
    throw error;
  }
};
