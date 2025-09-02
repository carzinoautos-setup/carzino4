'use client'

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Home, Globe, TestTube, Stethoscope } from "lucide-react";

export function NavigationHeader() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
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
              href="/"
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
              href="/icon-demo"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/icon-demo")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Database className="w-4 h-4" />
              Icon Demo
            </Link>

            <Link
              href="/vehicles-original"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/vehicles-original")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Globe className="w-4 h-4" />
              Vehicles (Original)
            </Link>
          </nav>

          {/* Stats/Info */}
          <div className="text-sm text-gray-500">
            {isActive("/") && "Homepage"}
            {isActive("/icon-demo") && "Icon Demo"}
            {isActive("/vehicles-original") && "Vehicles (Original)"}
          </div>
        </div>
      </div>
    </header>
  );
}
