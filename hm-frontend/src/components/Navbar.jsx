import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { Moon, Sun, LogOut, User, Menu, X, Maximize, Minimize } from "lucide-react";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { toggleMobileMenu } = useSidebar();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes (handles ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <nav
      className={`w-full fixed top-0 left-0 right-0 z-50 shadow-lg transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Brand */}
          <div className="flex items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? "bg-blue-600" : "bg-gradient-to-br from-blue-600 to-indigo-600"
                }`}>
                <span className="text-white text-xl font-bold">🏥</span>
              </div>
              <div className="hidden sm:block">
                <h2 className={`text-lg lg:text-xl font-bold ${darkMode ? "text-white" : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                  }`}>
                  Naitiri Jambo HMS
                </h2>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Healthcare Excellence
                </p>
              </div>
              <h2 className={`block sm:hidden text-lg font-bold ${darkMode ? "text-white" : "text-blue-600"
                }`}>
                HMS
              </h2>
            </div>
          </div>

          {/* Desktop Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme toggle button - Hidden for now */}
            {/* <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-yellow-400"
                : "bg-yellow-50 hover:bg-yellow-100 text-yellow-600"
                }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button> */}

            {/* Fullscreen toggle button */}
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* Notification Bell — only for doctor and admin */}
            {user && ["doctor", "admin"].includes(user.role) && (
              <NotificationBell />
            )}

            {/* User info */}
            {user ? (
              <>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"
                  }`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${darkMode ? "bg-blue-600" : "bg-gradient-to-br from-blue-600 to-indigo-600"
                    }`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"
                      }`}>
                      {user.name || user.email || "User"}
                    </p>
                    <p className={`text-xs capitalize ${darkMode ? "text-blue-400" : "text-blue-600"
                      }`}>
                      {user.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg ${darkMode
                    ? "bg-gray-700 hover:bg-gray-800 text-white"
                    : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white"
                    }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"
                }`}>
                <p className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                  Not logged in
                </p>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-lg transition-all ${darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                }`}
              title="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Theme toggle hidden for now */}
            {/* <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all ${darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-yellow-400"
                : "bg-yellow-50 hover:bg-yellow-100 text-yellow-600"
                }`}
            >
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button> */}
            {/* Fullscreen toggle button */}
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg transition-all ${darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            {/* Notification Bell - mobile */}
            {user && ["doctor", "admin"].includes(user.role) && (
              <NotificationBell />
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-all ${darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                }`}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden pb-4 border-t ${darkMode ? "border-gray-800" : "border-gray-200"
            }`}>
            {user ? (
              <div className="pt-4 space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"
                  }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-blue-600" : "bg-gradient-to-br from-blue-600 to-indigo-600"
                    }`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"
                      }`}>
                      {user.name || user.email || "User"}
                    </p>
                    <p className={`text-xs capitalize ${darkMode ? "text-blue-400" : "text-blue-600"
                      }`}>
                      {user.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-md ${darkMode
                    ? "bg-gray-700 hover:bg-gray-800 text-white"
                    : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white"
                    }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className={`mt-4 p-3 rounded-lg text-center ${darkMode ? "bg-gray-800" : "bg-gray-50"
                }`}>
                <p className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                  Not logged in
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;