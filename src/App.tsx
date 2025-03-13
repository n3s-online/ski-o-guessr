import { GameDisplay } from "./components/GameDisplay";
import { ThemeToggle } from "./components/ui/theme-toggle";
import { SettingsDropdown } from "./components/ui/settings-dropdown";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
          },
          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            },
            iconTheme: {
              primary: "#16a34a",
              secondary: "#ffffff",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:text-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <header className="flex items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-blue-800 dark:text-blue-400 tracking-tight">
                Ski-O-Guessr
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                Can you identify these ski resorts from their trail maps?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SettingsDropdown />
              <ThemeToggle />
            </div>
          </header>

          <main>
            <GameDisplay />
          </main>

          <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
              <p>
                Created with ❤️ by{" "}
                <a
                  href="https://willness.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  willness.dev
                </a>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

export default App;
