import { SkiResortMetadata } from "../lib/ski-data";

// Define a type for guess results
export interface GuessResult {
  resortName: string;
  metadata: SkiResortMetadata | null;
}
