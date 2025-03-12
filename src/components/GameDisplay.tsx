import { useEffect, useState, useRef } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  getAllSkiResorts,
  getSkiResortRedactedImageUrl,
  getSkiResortImageUrl,
  loadSkiResortMetadata,
  SkiResortMetadata,
  SkiResort,
} from "../lib/ski-data";
import { Button } from "./ui/button";
import {
  Loader2,
  Info,
  RefreshCw,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

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
  const [showZoomHint, setShowZoomHint] = useState(true);

  // New state variables for progressive reveal
  const [revealPercentage, setRevealPercentage] = useState(33);
  const [centerCoordinates, setCenterCoordinates] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLImageElement>(null);
  const transformComponentRef = useRef(null);

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

        // Generate random coordinates within the middle 40% of the image
        const x = 30 + Math.random() * 40; // 30% to 70%
        const y = 30 + Math.random() * 40; // 30% to 70%
        setCenterCoordinates({ x, y });

        // Reset reveal percentage to 33%
        setRevealPercentage(33);
      } catch (err) {
        console.error("Error loading ski resort data:", err);
        setError("Failed to load ski resort data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, []);

  // Hide zoom hint after 5 seconds
  useEffect(() => {
    if (!loading && showZoomHint) {
      const timer = setTimeout(() => {
        setShowZoomHint(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, showZoomHint]);

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
      setRevealPercentage(100); // Show full image on correct guess
    } else {
      // Update reveal percentage based on number of guesses
      if (previousGuesses.length === 0) {
        // After first guess, show 66%
        setRevealPercentage(66);
      } else if (previousGuesses.length === 1) {
        // After second guess, show 100%
        setRevealPercentage(100);
      }
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
    setShowZoomHint(true);

    // Reset reveal percentage to 33%
    setRevealPercentage(33);

    try {
      const allResorts = getAllSkiResorts();

      // Select a random resort to guess
      const randomIndex = Math.floor(Math.random() * allResorts.length);
      const randomResort = allResorts[randomIndex];
      setCurrentResort(randomResort);
      setMetadata(resortMetadataMap[randomResort.folderName]);

      // Generate new random coordinates within the middle 40% of the image
      const x = 30 + Math.random() * 40; // 30% to 70%
      const y = 30 + Math.random() * 40; // 30% to 70%
      setCenterCoordinates({ x, y });
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

  // Effect to reset zoom when reveal percentage changes
  useEffect(() => {
    if (transformComponentRef.current) {
      // Small delay to allow the clip-path transition to start
      setTimeout(() => {
        // @ts-ignore - The type definitions don't include resetTransform, but it exists
        transformComponentRef.current.resetTransform();
      }, 100);
    }
  }, [revealPercentage]);

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
  const availableResorts = skiResorts
    .filter((resort) => !previousGuesses.includes(resort.folderName))
    .sort((a, b) =>
      formatResortName(a.folderName).localeCompare(
        formatResortName(b.folderName)
      )
    );

  // Calculate the clip path based on reveal percentage and center coordinates
  const getClipPath = () => {
    if (revealPercentage >= 100) {
      return "none"; // Show full image
    }

    const halfWidth = revealPercentage / 2;
    const halfHeight = revealPercentage / 2;

    // Calculate the clip path coordinates based on center point and reveal percentage
    const left = Math.max(0, centerCoordinates.x - halfWidth);
    const right = Math.min(100, centerCoordinates.x + halfWidth);
    const top = Math.max(0, centerCoordinates.y - halfHeight);
    const bottom = Math.min(100, centerCoordinates.y + halfHeight);

    return `inset(${top}% ${100 - right}% ${100 - bottom}% ${left}%)`;
  };

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
                  <li>You'll be shown a portion of a ski resort map.</li>
                  <li>
                    Select a resort from the dropdown and submit your guess.
                  </li>
                  <li>
                    Green cells indicate correct information, red cells indicate
                    incorrect information.
                  </li>
                  <li>After each guess, more of the map will be revealed.</li>
                  <li>
                    Keep guessing until you identify the correct resort or run
                    out of options.
                  </li>
                  <li>
                    The full map will be revealed when you guess correctly or
                    after your second guess.
                  </li>
                </ol>
                <Separator className="my-6" />
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                    <strong>Tip:</strong> Pay attention to the layout of the
                    trails and lifts to help identify the resort.
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Zoom Feature:</strong> Use the zoom controls in the
                    top-right corner of the map to zoom in/out or reset the
                    view. You can also use your mouse wheel or pinch gestures on
                    mobile.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mb-8 relative rounded-xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-700 max-w-full max-h-[700px] min-h-[300px] flex items-center justify-center">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70 z-10">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
        )}
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          wheel={{ step: 0.1 }}
          centerOnInit={true}
          limitToBounds={true}
          doubleClick={{ disabled: false, mode: "reset" }}
          ref={transformComponentRef}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => zoomIn()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom In</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => zoomOut()}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom Out</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resetTransform()}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <TransformComponent wrapperClass="w-full h-full max-h-[70vh] overflow-hidden flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={
                    guessedCorrectly
                      ? getSkiResortImageUrl(currentResort.folderName)
                      : getSkiResortRedactedImageUrl(currentResort.folderName)
                  }
                  alt="Ski resort map"
                  className="max-w-full max-h-[70vh] object-contain"
                  onLoad={() => setImageLoading(false)}
                  draggable="false"
                  style={{
                    clipPath: getClipPath(),
                    transition: "clip-path 0.5s ease-in-out",
                  }}
                />
              </TransformComponent>

              {showZoomHint && !imageLoading && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm animate-pulse">
                  <p className="flex items-center gap-2">
                    <Plus className="h-3 w-3" /> Zoom in to see details
                  </p>
                </div>
              )}

              {revealPercentage < 100 && !imageLoading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                  <p>
                    {revealPercentage}% of map revealed
                    {previousGuesses.length === 0
                      ? " (first guess)"
                      : previousGuesses.length === 1
                      ? " (second guess)"
                      : ""}
                  </p>
                </div>
              )}
            </>
          )}
        </TransformWrapper>
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
                  Continent
                </span>
                <span className="text-lg">{metadata.continent}</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <span className="font-medium block text-sm text-gray-500 dark:text-gray-400">
                  Acreage
                </span>
                <span className="text-lg">{metadata.skiable_acreage}</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <span className="font-medium block text-sm text-gray-500 dark:text-gray-400">
                  Lifts
                </span>
                <span className="text-lg">{metadata.lifts}</span>
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
                      <TableHead className="font-semibold">Continent</TableHead>
                      <TableHead className="font-semibold">Acreage</TableHead>
                      <TableHead className="font-semibold">Lifts</TableHead>
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
                              ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100 font-medium"
                              : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
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
                              ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                              : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
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
                              ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                              : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                          }
                        >
                          {result.metadata?.region || "Unknown"}
                        </TableCell>
                        <TableCell
                          className={
                            result.metadata &&
                            isMatchingField(
                              result.metadata.continent,
                              metadata.continent
                            )
                              ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                              : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                          }
                        >
                          {result.metadata?.continent || "Unknown"}
                        </TableCell>
                        <TableCell
                          className={
                            result.metadata &&
                            result.metadata.skiable_acreage ===
                              metadata.skiable_acreage
                              ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                              : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                          }
                        >
                          {result.metadata?.skiable_acreage || "Unknown"}
                          {result.metadata &&
                            metadata &&
                            result.metadata.skiable_acreage !==
                              metadata.skiable_acreage &&
                            result.metadata.skiable_acreage !== undefined && (
                              <span className="ml-2 inline-flex items-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        {result.metadata.skiable_acreage >
                                        metadata.skiable_acreage ? (
                                          <ArrowDown className="h-4 w-4" />
                                        ) : (
                                          <ArrowUp className="h-4 w-4" />
                                        )}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {result.metadata.skiable_acreage >
                                        metadata.skiable_acreage
                                          ? "Too high"
                                          : "Too low"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </span>
                            )}
                        </TableCell>
                        <TableCell
                          className={
                            result.metadata &&
                            result.metadata.lifts === metadata.lifts
                              ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                              : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
                          }
                        >
                          {result.metadata?.lifts || "Unknown"}
                          {result.metadata &&
                            metadata &&
                            result.metadata.lifts !== metadata.lifts &&
                            result.metadata.lifts !== undefined && (
                              <span className="ml-2 inline-flex items-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        {result.metadata.lifts >
                                        metadata.lifts ? (
                                          <ArrowDown className="h-4 w-4" />
                                        ) : (
                                          <ArrowUp className="h-4 w-4" />
                                        )}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {result.metadata.lifts > metadata.lifts
                                          ? "Too high"
                                          : "Too low"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </span>
                            )}
                        </TableCell>
                        <TableCell
                          className={
                            result.metadata &&
                            isMatchingField(
                              result.metadata.parent_company,
                              metadata.parent_company
                            )
                              ? "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-100"
                              : "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-100"
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
