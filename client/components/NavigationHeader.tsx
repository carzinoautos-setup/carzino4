import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Database, Home, Globe, TestTube, Stethoscope } from "lucide-react";

export function NavigationHeader() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Carzino Autos</h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Home className="w-4 h-4" />
              Original Demo
            </Link>

            <Link
              to="/mysql-vehicles"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/mysql-vehicles")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Database className="w-4 h-4" />
              MySQL Vehicles (50k)
            </Link>

            <Link
              to="/wordpress-vehicles"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/wordpress-vehicles")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Globe className="w-4 h-4" />
              WordPress API
            </Link>

            <Link
              to="/wordpress-api-test"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/wordpress-api-test")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <TestTube className="w-4 h-4" />
              API Test
            </Link>

            <Link
              to="/wordpress-diagnostic"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/wordpress-diagnostic")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              API Diagnostic
            </Link>
          </nav>

          {/* Stats/Info */}
          <div className="text-sm text-gray-500">
            {isActive("/mysql-vehicles") && "MySQL Vehicles (50k)"}
            {isActive("/wordpress-vehicles") && "WordPress API"}
            {isActive("/wordpress-api-test") && "API Test"}
            {isActive("/") && "Original Demo"}
          </div>
        </div>
      </div>
    </header>
  );
}
