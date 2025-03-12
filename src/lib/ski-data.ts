import skiData from "../assets/ski-data/index.json";

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
