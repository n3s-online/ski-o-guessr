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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  getAllSkiResorts,
  getSkiResortRedactedImageUrl,
  getSkiResortImageUrl,
  loadSkiResortMetadata,
  SkiResortMetadata,
  SkiResort,
} from "../lib/ski-data";
import { Button } from "./ui/button";
import { Loader2, Info, RefreshCw } from "lucide-react";

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
  const [imageLoading, setImageLoading] = useState(true);

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
    setImageLoading(true);

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
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Loading game data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <Alert variant="destructive" className="mb-6 max-w-md">
          <AlertTitle className="text-lg font-semibold">Error</AlertTitle>
          <AlertDescription className="mt-2">{error}</AlertDescription>
        </Alert>
        <Button
          onClick={handleNewGame}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
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
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-400">
            Guess the Ski Resort
          </h2>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Play
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto p-2">
              <SheetHeader>
                <SheetTitle className="text-2xl text-blue-800 dark:text-blue-400">
                  How to Play Ski-O-Guessr
                </SheetTitle>
                <SheetDescription className="text-lg">
                  Test your knowledge of ski resorts around the world!
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <h3 className="font-medium text-xl mb-3">Game Rules:</h3>
                <ol className="list-decimal pl-6 space-y-3">
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
                <Separator className="my-6" />
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Tip:</strong> Pay attention to the layout of the
                    trails and lifts to help identify the resort.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mb-8 relative rounded-xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-700 max-w-full">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
        )}
        <img
          src={
            guessedCorrectly
              ? getSkiResortImageUrl(currentResort.folderName)
              : getSkiResortRedactedImageUrl(currentResort.folderName)
          }
          alt="Ski resort map"
          className="w-full h-auto"
          onLoad={() => setImageLoading(false)}
        />
      </div>

      {guessedCorrectly ? (
        <div className="text-center mb-8 px-2">
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <AlertTitle className="text-xl text-green-800 dark:text-green-400">
              Correct!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300 mt-2 text-lg">
              You've successfully identified {metadata.name}.
            </AlertDescription>
          </Alert>
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <span className="font-medium block text-sm text-gray-500 dark:text-gray-400">
                  Country
                </span>
                <span className="text-lg">{metadata.country}</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <span className="font-medium block text-sm text-gray-500 dark:text-gray-400">
                  Region
                </span>
                <span className="text-lg">{metadata.region}</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <span className="font-medium block text-sm text-gray-500 dark:text-gray-400">
                  Parent Company
                </span>
                <span className="text-lg">{metadata.parent_company}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleNewGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Play Again
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-8 px-2">
            <div className="flex-grow">
              <label
                htmlFor="resort-select"
                className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
              >
                Select a ski resort:
              </label>
              <div className="w-full">
                <Select
                  value={selectedResort}
                  onValueChange={setSelectedResort}
                  disabled={availableResorts.length === 0 || guessedCorrectly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Select a resort --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResorts.map((resort) => (
                      <SelectItem
                        key={resort.folderName}
                        value={resort.folderName}
                      >
                        {formatResortName(resort.folderName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGuess}
                disabled={!selectedResort || guessedCorrectly}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                Submit Guess
              </Button>
            </div>
          </div>

          {guessResults.length > 0 && (
            <div className="mb-8 px-2">
              <div className="flex flex-col items-center mb-4">
                <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-200">
                  Your Guesses
                </h3>
                <Separator className="flex-grow ml-4" />
              </div>
              <div className="overflow-x-auto rounded-lg shadow">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                      <TableHead className="font-semibold">Resort</TableHead>
                      <TableHead className="font-semibold">Country</TableHead>
                      <TableHead className="font-semibold">Region</TableHead>
                      <TableHead className="font-semibold">
                        Parent Company
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guessResults.map((result, index) => (
                      <TableRow
                        key={index}
                        className="border-b dark:border-gray-700"
                      >
                        <TableCell
                          className={
                            result.resortName === currentResort.folderName
                              ? "bg-green-100 dark:bg-green-900/30 font-medium"
                              : "bg-red-100 dark:bg-red-900/30"
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
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
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
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
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
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
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
            <div className="text-center mb-8 px-2">
              <Alert variant="destructive" className="mb-6">
                <AlertTitle className="text-xl">Game Over</AlertTitle>
                <AlertDescription className="mt-2 text-lg">
                  You've used all available guesses! The correct answer was:{" "}
                  <span className="font-semibold">{metadata.name}</span>
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleNewGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Play Again
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
