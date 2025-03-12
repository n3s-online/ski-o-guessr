import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  getAllSkiResorts,
  getSkiResortRedactedImageUrl,
  getSkiResortImageUrl,
  loadSkiResortMetadata,
  SkiResortMetadata,
  SkiResort,
} from "../lib/ski-data";

export function GameDisplay() {
  const [skiResorts, setSkiResorts] = useState<SkiResort[]>([]);
  const [currentResort, setCurrentResort] = useState<SkiResort | null>(null);
  const [metadata, setMetadata] = useState<SkiResortMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guessedCorrectly, setGuessedCorrectly] = useState(false);
  const [previousGuesses, setPreviousGuesses] = useState<string[]>([]);
  const [selectedResort, setSelectedResort] = useState<string>("");

  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const allResorts = getAllSkiResorts();
        setSkiResorts(allResorts);

        // Select a random resort to guess
        const randomIndex = Math.floor(Math.random() * allResorts.length);
        const randomResort = allResorts[randomIndex];
        setCurrentResort(randomResort);

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

    loadGame();
  }, []);

  const handleGuess = async () => {
    if (!selectedResort || !currentResort) return;

    // Add to previous guesses
    setPreviousGuesses((prev) => [...prev, selectedResort]);

    // Check if guess is correct
    if (selectedResort === currentResort.folderName) {
      setGuessedCorrectly(true);
    }

    // Reset selection
    setSelectedResort("");
  };

  const handleNewGame = async () => {
    setLoading(true);
    setError(null);
    setGuessedCorrectly(false);
    setPreviousGuesses([]);
    setSelectedResort("");

    try {
      const allResorts = getAllSkiResorts();

      // Select a random resort to guess
      const randomIndex = Math.floor(Math.random() * allResorts.length);
      const randomResort = allResorts[randomIndex];
      setCurrentResort(randomResort);

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
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleNewGame}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentResort || !metadata) {
    return null;
  }

  // Filter out already guessed resorts
  const availableResorts = skiResorts.filter(
    (resort) => !previousGuesses.includes(resort.folderName)
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-2xl font-bold text-center">
        Guess the Ski Resort
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <img
            src={
              guessedCorrectly
                ? getSkiResortImageUrl(currentResort.folderName)
                : getSkiResortRedactedImageUrl(currentResort.folderName)
            }
            alt="Ski resort map"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>

        {guessedCorrectly ? (
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Correct! This is {metadata.name}
            </h3>
            <p className="mb-4">
              <span className="font-medium">Country:</span> {metadata.country} |
              <span className="font-medium"> Region:</span> {metadata.region} |
              <span className="font-medium"> Parent Company:</span>{" "}
              {metadata.parent_company}
            </p>
            <button
              onClick={handleNewGame}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Play Again
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow">
                <label
                  htmlFor="resort-select"
                  className="block mb-2 font-medium"
                >
                  Select a ski resort:
                </label>
                <select
                  id="resort-select"
                  value={selectedResort}
                  onChange={(e) => setSelectedResort(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={availableResorts.length === 0}
                >
                  <option value="">-- Select a resort --</option>
                  {availableResorts.map((resort) => (
                    <option key={resort.folderName} value={resort.folderName}>
                      {resort.folderName
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGuess}
                  disabled={!selectedResort}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Submit Guess
                </button>
              </div>
            </div>

            {previousGuesses.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">
                  Previous Guesses:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {previousGuesses.map((guess, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-200 rounded-full text-sm"
                    >
                      {guess
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {availableResorts.length === 0 && (
              <div className="text-center mb-6">
                <p className="text-red-500 mb-2">
                  You've used all available guesses!
                </p>
                <p className="mb-4">The correct answer was: {metadata.name}</p>
                <button
                  onClick={handleNewGame}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Play Again
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
