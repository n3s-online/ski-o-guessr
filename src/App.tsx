import { SkiResortDisplay } from "./components/SkiResortDisplay";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Ski-O-Guessr</h1>
        <p className="text-gray-600 mt-2">
          Explore ski resorts from around the world
        </p>
      </header>

      <main>
        <SkiResortDisplay />
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Ski-O-Guessr</p>
      </footer>
    </div>
  );
}

export default App;
