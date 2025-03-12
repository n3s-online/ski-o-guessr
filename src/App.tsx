import { GameDisplay } from "./components/GameDisplay";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 dark:text-blue-400 tracking-tight">
            Ski-O-Guessr
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-3 text-lg max-w-2xl mx-auto">
            Can you identify these ski resorts from their trail maps?
          </p>
        </header>

        <main>
          <GameDisplay />
        </main>

        <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <p>© {new Date().getFullYear()} Ski-O-Guessr</p>
            <div className="flex gap-4">
              <a
                href="#"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
