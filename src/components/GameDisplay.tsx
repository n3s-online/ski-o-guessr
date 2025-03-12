import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  getAllSkiResorts,
  getSkiResortRedactedImageUrl,
  getSkiResortImageUrl,
  loadSkiResortMetadata,
  SkiResortMetadata,
  SkiResort,
} from "../lib/ski-data";

// Define a type for guess results
interface GuessResult {
  resortName: string;
  metadata: SkiResortMetadata | null;
}

export function GameDisplay() {
  const [skiResorts, setSkiResorts] = useState<SkiResort[]>([]);
  const [currentResort, setCurrentResort] = useState<SkiResort | null>(null);
  const [metadata, setMetadata] = useState<SkiResortMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guessedCorrectly, setGuessedCorrectly] = useState(false);
  const [previousGuesses, setPreviousGuesses] = useState<string[]>([]);
  const [guessResults, setGuessResults] = useState<GuessResult[]>([]);
  const [selectedResort, setSelectedResort] = useState<string>("");
  const [resortMetadataMap, setResortMetadataMap] = useState<
    Record<string, SkiResortMetadata>
  >({});

  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const allResorts = getAllSkiResorts();
        setSkiResorts(allResorts);

        // Load metadata for all resorts
        const metadataMap: Record<string, SkiResortMetadata> = {};
        for (const resort of allResorts) {
          try {
            const resortMetadata = await loadSkiResortMetadata(
              resort.folderName
            );
            metadataMap[resort.folderName] = resortMetadata;
          } catch (err) {
            console.error(
              `Failed to load metadata for ${resort.folderName}:`,
              err
            );
          }
        }
        setResortMetadataMap(metadataMap);

        // Select a random resort to guess
        const randomIndex = Math.floor(Math.random() * allResorts.length);
        const randomResort = allResorts[randomIndex];
        setCurrentResort(randomResort);
        setMetadata(metadataMap[randomResort.folderName]);
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
    if (!selectedResort || !currentResort || !metadata) return;

    // Add to previous guesses
    setPreviousGuesses((prev) => [...prev, selectedResort]);

    // Add to guess results with metadata
    const guessMetadata = resortMetadataMap[selectedResort] || null;
    setGuessResults((prev) => [
      ...prev,
      {
        resortName: selectedResort,
        metadata: guessMetadata,
      },
    ]);

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
    setGuessResults([]);
    setSelectedResort("");

    try {
      const allResorts = getAllSkiResorts();

      // Select a random resort to guess
      const randomIndex = Math.floor(Math.random() * allResorts.length);
      const randomResort = allResorts[randomIndex];
      setCurrentResort(randomResort);
      setMetadata(resortMetadataMap[randomResort.folderName]);
    } catch (err) {
      console.error("Error loading ski resort data:", err);
      setError("Failed to load ski resort data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to format resort name for display
  const formatResortName = (folderName: string): string => {
    return folderName
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Function to check if a metadata field matches the current resort
  const isMatchingField = (
    guessValue: string | undefined,
    actualValue: string | undefined
  ): boolean => {
    if (!guessValue || !actualValue) return false;
    return guessValue.toLowerCase() === actualValue.toLowerCase();
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
                  disabled={availableResorts.length === 0 || guessedCorrectly}
                >
                  <option value="">-- Select a resort --</option>
                  {availableResorts.map((resort) => (
                    <option key={resort.folderName} value={resort.folderName}>
                      {formatResortName(resort.folderName)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGuess}
                  disabled={!selectedResort || guessedCorrectly}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Submit Guess
                </button>
              </div>
            </div>

            {guessResults.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <h3 className="font-semibold text-lg mb-2">Your Guesses:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resort</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Parent Company</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guessResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell
                          className={
                            result.resortName === currentResort.folderName
                              ? "bg-green-100"
                              : "bg-red-100"
                          }
                        >
                          {formatResortName(result.resortName)}
                        </TableCell>
                        <TableCell
                          className={
                            result.metadata &&
                            isMatchingField(
                              result.metadata.country,
                              metadata.country
                            )
                              ? "bg-green-100"
                              : "bg-red-100"
                          }
                        >
                          {result.metadata?.country || "Unknown"}
                        </TableCell>
                        <TableCell
                          className={
                            result.metadata &&
                            isMatchingField(
                              result.metadata.region,
                              metadata.region
                            )
                              ? "bg-green-100"
                              : "bg-red-100"
                          }
                        >
                          {result.metadata?.region || "Unknown"}
                        </TableCell>
                        <TableCell
                          className={
                            result.metadata &&
                            isMatchingField(
                              result.metadata.parent_company,
                              metadata.parent_company
                            )
                              ? "bg-green-100"
                              : "bg-red-100"
                          }
                        >
                          {result.metadata?.parent_company || "Unknown"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {availableResorts.length === 0 && !guessedCorrectly && (
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
