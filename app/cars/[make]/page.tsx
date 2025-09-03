'use client'

import React from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { parseCarURL } from "../../../lib/utils";

interface CarsPageProps {
  params: {
    make: string;
  };
}

export default function MakePage({ params }: CarsPageProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Parse URL to get filters
  const urlFilters = parseCarURL(pathname, searchParams);

  return (
    <div
      className="min-h-screen bg-white main-container"
      style={{ fontFamily: "Albert Sans, sans-serif" }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Carzino Autos</h1>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/cars" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700">
                Vehicle Search
              </a>
            </nav>
            <div className="text-sm text-gray-500">
              SEO-Friendly URLs!
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {params.make.charAt(0).toUpperCase() + params.make.slice(1).replace(/-/g, ' ')} Vehicles
        </h1>
        <p className="text-gray-600 mb-4">
          Showing vehicles for make: <strong>{params.make}</strong>
        </p>
        
        <div className="mt-8">
          <p className="text-gray-500">Current URL filters:</p>
          <pre className="bg-gray-100 p-4 rounded mt-2 text-left overflow-x-auto">
            {JSON.stringify({ params, filters: urlFilters }, null, 2)}
          </pre>
        </div>

        <div className="mt-8 space-y-2 text-sm text-blue-600">
          <a href="/cars" className="block hover:underline">← Back to all cars</a>
          <a href={`/cars/${params.make}/camry`} className="block hover:underline">
            View {params.make} Camry →
          </a>
          <a href={`/cars/${params.make}/camry?year=2022&condition=used`} className="block hover:underline">
            View {params.make} Camry with filters →
          </a>
        </div>
      </div>
    </div>
  );
}
