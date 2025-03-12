import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Guess the Ski Resort</h2>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
                How to Play
              </button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>How to Play Ski-O-Guessr</SheetTitle>
                <SheetDescription>
                  Test your knowledge of ski resorts around the world!
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <h3 className="font-medium text-lg mb-2">Game Rules:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>You'll be shown a redacted ski resort map.</li>
                  <li>
                    Select a resort from the dropdown and submit your guess.
                  </li>
                  <li>
                    Green cells indicate correct information, red cells indicate
                    incorrect information.
                  </li>
                  <li>
                    Keep guessing until you identify the correct resort or run
                    out of options.
                  </li>
                  <li>
                    The full map will be revealed when you guess correctly.
                  </li>
                </ol>
                <Separator className="my-4" />
                <p className="text-sm text-gray-500">
                  Tip: Pay attention to the layout of the trails and lifts to
                  help identify the resort.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

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
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertTitle className="text-green-800">Correct!</AlertTitle>
            <AlertDescription className="text-green-700">
              You've successfully identified {metadata.name}.
            </AlertDescription>
          </Alert>
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
              <label htmlFor="resort-select" className="block mb-2 font-medium">
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
            <div className="mb-6">
              <div className="flex flex-col items-center mb-2">
                <h3 className="font-semibold text-lg">Your Guesses</h3>
                <Separator className="flex-grow ml-3" />
              </div>
              <div className="overflow-x-auto">
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
            </div>
          )}

          {availableResorts.length === 0 && !guessedCorrectly && (
            <div className="text-center mb-6">
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Game Over</AlertTitle>
                <AlertDescription>
                  You've used all available guesses! The correct answer was:{" "}
                  {metadata.name}
                </AlertDescription>
              </Alert>
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
    </div>
  );
}
