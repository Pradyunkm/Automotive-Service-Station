import { Moon, Sun, Car } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Car className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Smart Automated Car Service
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transparent Vehicle Maintenance & Monitoring System
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-900 dark:text-white" />
            ) : (
              <Sun className="w-5 h-5 text-gray-900 dark:text-white" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
