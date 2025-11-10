import React, { useContext, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import VoiceAssistant from "./VoiceAssistant";

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col font-display">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-white dark:bg-[#111318] border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="size-6 text-primary">
            <svg
              fill="currentColor"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_6_319)">
                <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" />
              </g>
              <defs>
                <clipPath id="clip0_6_319">
                  <rect fill="white" height="48" width="48" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <h1 className="text-gray-900 dark:text-white text-base font-bold">
            PocketPilot
          </h1>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">
            {isSidebarOpen ? "close" : "menu"}
          </span>
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318] p-4 transition-transform duration-300 lg:translate-x-0 lg:z-20 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="size-6 text-primary">
              <svg
                fill="currentColor"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_6_319)">
                  <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" />
                </g>
                <defs>
                  <clipPath id="clip0_6_319">
                    <rect fill="white" height="48" width="48" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-gray-900 dark:text-white text-base font-bold leading-normal">
                PocketPilot
              </h1>
              <p className="text-gray-500 dark:text-[#9da6b9] text-sm font-normal leading-normal">
                Your Financial Copilot
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 flex flex-col gap-2">
            <Link
              to="/"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActive("/")
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <p className="text-sm font-medium leading-normal">Dashboard</p>
            </Link>
            <Link
              to="/expenses"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActive("/expenses")
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              <p className="text-sm font-medium leading-normal">Expenses</p>
            </Link>
            <Link
              to="/goals"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActive("/goals")
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="material-symbols-outlined">flag</span>
              <p className="text-sm font-medium leading-normal">Goals</p>
            </Link>
            <Link
              to="/analytics"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActive("/analytics")
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="material-symbols-outlined">assessment</span>
              <p className="text-sm font-medium leading-normal">Analytics</p>
            </Link>
          </nav>
        </div>

        {/* User Menu */}
        <div className="mt-auto flex flex-col gap-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage: user?.avatar ? `url(${user.avatar})` : "none",
                backgroundColor: !user?.avatar ? "#282e39" : "transparent",
              }}
            >
              {!user?.avatar && (
                <span className="flex h-full w-full items-center justify-center text-white">
                  {user?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-gray-900 dark:text-white text-sm font-medium leading-normal">
                {user?.name || "User"}
              </h2>
              <p className="text-gray-500 dark:text-[#9da6b9] text-xs font-normal leading-normal">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="material-symbols-outlined">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
            <p className="text-sm font-medium leading-normal">
              {isDark ? "Light Mode" : "Dark Mode"}
            </p>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="material-symbols-outlined">logout</span>
            <p className="text-sm font-medium leading-normal">Log out</p>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-background-light dark:bg-background-dark lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>

      {/* Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
};

export default Layout;
