import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  getRandomSkiResort,
  getSkiResortImageUrl,
  loadSkiResortMetadata,
  SkiResortMetadata,
  SkiResort,
} from "../lib/ski-data";

export function SkiResortDisplay() {
  const [skiResort, setSkiResort] = useState<SkiResort | null>(null);
  const [metadata, setMetadata] = useState<SkiResortMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRandomResort = async () => {
      try {
        setLoading(true);
        const randomResort = getRandomSkiResort();
        setSkiResort(randomResort);

        const resortMetadata = await loadSkiResortMetadata(
          randomResort.folderName
        );
        setMetadata(resortMetadata);
      } catch (err) {
        console.error("Error loading ski resort data:", err);
        setError("Failed to load ski resort data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadRandomResort();
  }, []);

  const handleNewResort = async () => {
    setLoading(true);
    setError(null);
    try {
      const randomResort = getRandomSkiResort();
      setSkiResort(randomResort);

      const resortMetadata = await loadSkiResortMetadata(
        randomResort.folderName
      );
      setMetadata(resortMetadata);
    } catch (err) {
      console.error("Error loading ski resort data:", err);
      setError("Failed to load ski resort data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-blue-600 dark:text-blue-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={handleNewResort}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!skiResort || !metadata) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-2xl font-bold text-center text-blue-800 dark:text-blue-400">
        {metadata.name}
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <img
            src={getSkiResortImageUrl(skiResort.folderName)}
            alt={`${metadata.name} ski map`}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-blue-800 dark:text-blue-400">
              Resort Information
            </h3>
            <p>
              <span className="font-medium">Country:</span> {metadata.country}
            </p>
            <p>
              <span className="font-medium">Region:</span> {metadata.region}
            </p>
            <p>
              <span className="font-medium">Parent Company:</span>{" "}
              {metadata.parent_company}
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-blue-800 dark:text-blue-400">
              Technical Details
            </h3>
            <p>
              <span className="font-medium">Number of Marked Areas:</span>{" "}
              {metadata.boxes.length}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleNewResort}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors"
          >
            Show Another Resort
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
