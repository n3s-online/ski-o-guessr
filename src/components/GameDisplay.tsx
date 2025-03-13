import { useEffect, useState, useRef } from "react";
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
  getDailySkiResort,
} from "../lib/ski-data";
import { Button } from "./ui/button";
import { Loader2, Info, RefreshCw, Plus, Minus, Clock } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { GuessesTable } from "./GuessesTable";
import { GuessResult } from "../types/game";
import {
  shouldResetGame,
  getFormattedETDate,
  getTimeUntilReset,
} from "../lib/time-utils";
import {
  saveGameState,
  loadGameState,
  clearGameState,
  getLastPlayedDate,
} from "../lib/storage-utils";

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
  const [timeUntilReset, setTimeUntilReset] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });
  const [currentDate, setCurrentDate] = useState<string>(getFormattedETDate());

  // New state variables for progressive reveal
  const [revealPercentage, setRevealPercentage] = useState(33);
  const [centerCoordinates, setCenterCoordinates] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLImageElement>(null);
  const transformComponentRef = useRef(null);
  const timerRef = useRef<number | null>(null);

  // Define the loadGame function
  const loadGame = async () => {
    try {
      setLoading(true);
      const allResorts = getAllSkiResorts();
      setSkiResorts(allResorts);

      // Load metadata for all resorts
      const metadataMap: Record<string, SkiResortMetadata> = {};
      for (const resort of allResorts) {
        try {
          const resortMetadata = await loadSkiResortMetadata(resort.folderName);
          metadataMap[resort.folderName] = resortMetadata;
        } catch (err) {
          console.error(
            `Failed to load metadata for ${resort.folderName}:`,
            err
          );
        }
      }
      setResortMetadataMap(metadataMap);

      // Try to load saved game state
      const savedState = loadGameState();

      if (savedState && !shouldResetGame(getLastPlayedDate())) {
        // Restore saved game state
        const savedResort = allResorts.find(
          (r) => r.folderName === savedState.currentResortId
        );

        if (savedResort) {
          setCurrentResort(savedResort);
          setMetadata(metadataMap[savedResort.folderName]);
          setGuessedCorrectly(savedState.guessedCorrectly);
          setPreviousGuesses(savedState.previousGuesses);
          setGuessResults(savedState.guessResults);
          setRevealPercentage(savedState.revealPercentage);
          setCenterCoordinates(savedState.centerCoordinates);
        } else {
          // Fallback to daily resort if saved resort not found
          initializeNewGame(allResorts, metadataMap);
        }
      } else {
        // Initialize new game with daily resort
        initializeNewGame(allResorts, metadataMap);
      }
    } catch (err) {
      console.error("Error loading ski resort data:", err);
      setError("Failed to load ski resort data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update the timer every second
  useEffect(() => {
    const updateTimer = () => {
      setTimeUntilReset(getTimeUntilReset());
      setCurrentDate(getFormattedETDate());
    };

    // Initial update
    updateTimer();

    // Set up interval
    const timerId = window.setInterval(updateTimer, 1000);
    timerRef.current = timerId;

    // Clean up on unmount
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  // Check for game reset at midnight ET
  useEffect(() => {
    const checkForReset = () => {
      const lastPlayed = getLastPlayedDate();
      if (shouldResetGame(lastPlayed)) {
        // Clear saved game state and reload
        clearGameState();
        loadGame();
      }
    };

    // Check immediately
    checkForReset();

    // Set up interval to check every minute
    const resetCheckerId = window.setInterval(checkForReset, 60000);

    return () => {
      window.clearInterval(resetCheckerId);
    };
  }, []);

  useEffect(() => {
    loadGame();
  }, []);

  // Initialize a new game with the daily resort
  const initializeNewGame = (
    allResorts: SkiResort[],
    metadataMap: Record<string, SkiResortMetadata>
  ) => {
    // Get the daily resort based on current date in ET
    const dailyResort = getDailySkiResort();
    setCurrentResort(dailyResort);
    setMetadata(metadataMap[dailyResort.folderName]);

    // Reset game state
    setGuessedCorrectly(false);
    setPreviousGuesses([]);
    setGuessResults([]);
    setRevealPercentage(33);

    // Generate random coordinates within the middle 40% of the image
    const x = 30 + Math.random() * 40; // 30% to 70%
    const y = 30 + Math.random() * 40; // 30% to 70%
    setCenterCoordinates({ x, y });

    // Save initial game state
    saveGameState({
      currentResortId: dailyResort.folderName,
      guessedCorrectly: false,
      previousGuesses: [],
      guessResults: [],
      revealPercentage: 33,
      centerCoordinates: { x, y },
    });
  };

  // Hide zoom hint after 5 seconds
  useEffect(() => {
    if (!loading && showZoomHint) {
      const timer = setTimeout(() => {
        setShowZoomHint(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, showZoomHint]);

  // Save game state whenever it changes
  useEffect(() => {
    if (currentResort) {
      saveGameState({
        currentResortId: currentResort.folderName,
        guessedCorrectly,
        previousGuesses,
        guessResults,
        revealPercentage,
        centerCoordinates,
      });
    }
  }, [
    currentResort,
    guessedCorrectly,
    previousGuesses,
    guessResults,
    revealPercentage,
    centerCoordinates,
  ]);

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
      initializeNewGame(allResorts, resortMetadataMap);
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
    <div className="flex flex-col space-y-6">
      {/* Daily puzzle info */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="text-center sm:text-left mb-3 sm:mb-0">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-400">
            Daily Puzzle
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {currentDate}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono">
            Next puzzle in: {timeUntilReset.hours.toString().padStart(2, "0")}:
            {timeUntilReset.minutes.toString().padStart(2, "0")}:
            {timeUntilReset.seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

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
                      Green cells indicate correct information, red cells
                      indicate incorrect information.
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
                      <strong>Zoom Feature:</strong> Use the zoom controls in
                      the top-right corner of the map to zoom in/out or reset
                      the view. You can also use your mouse wheel or pinch
                      gestures on mobile.
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

            {/* Use the GuessesTable component with additional margin */}
            {guessResults.length > 0 && (
              <div className="mt-8">
                <GuessesTable
                  guessResults={guessResults}
                  currentResort={currentResort}
                  metadata={metadata}
                  formatResortName={formatResortName}
                  isMatchingField={isMatchingField}
                />
              </div>
            )}
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

            {/* Use the GuessesTable component */}
            <GuessesTable
              guessResults={guessResults}
              currentResort={currentResort}
              metadata={metadata}
              formatResortName={formatResortName}
              isMatchingField={isMatchingField}
            />

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
    </div>
  );
}
