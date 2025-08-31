import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, AlertCircle, Loader2 } from "lucide-react";
import {
  MySQLVehicleCard,
  VehicleCardSkeleton,
} from "../components/MySQLVehicleCard";
import {
  PaginationControls,
  SimplePagination,
} from "../components/PaginationControls";
import { NavigationHeader } from "../components/NavigationHeader";
import {
  vehicleApi,
  VehicleRecord,
  VehiclesApiResponse,
  VehicleFilters,
  FilterOptions,
} from "../lib/vehicleApi";

export function VehiclesList() {
  // State management
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<VehiclesApiResponse | null>(
    null,
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter state
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Favorites state (you can integrate with localStorage or backend)
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Fetch vehicles data
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await vehicleApi.getVehicles(
        currentPage,
        pageSize,
        filters,
      );

      if (response.success) {
        setVehicles(response.data);
        setApiResponse(response);
      } else {
        setError(response.message || "Failed to fetch vehicles");
        setVehicles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await vehicleApi.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Event handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Partial<VehicleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleFavoriteToggle = (vehicleId: number) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(vehicleId)) {
        newFavorites.delete(vehicleId);
      } else {
        newFavorites.add(vehicleId);
      }
      return newFavorites;
    });
  };

  const handleSearch = () => {
    // Implement search logic based on your needs
    if (searchTerm.trim()) {
      handleFilterChange({ make: searchTerm.trim() });
    }
  };

  // Loading skeleton
  if (loading && vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <VehicleCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vehicle Inventory
          </h1>
          <p className="text-gray-600">
            Browse our extensive collection of vehicles with advanced filtering
            and pagination
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by make, model, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          {/* Filter Panel */}
          {showFilters && filterOptions && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Make Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make
                  </label>
                  <select
                    value={filters.make || ""}
                    onChange={(e) =>
                      handleFilterChange({ make: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Makes</option>
                    {filterOptions.makes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    value={filters.condition || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        condition: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Conditions</option>
                    {filterOptions.conditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <select
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        maxPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">No Limit</option>
                    <option value="20000">Under $20,000</option>
                    <option value="30000">Under $30,000</option>
                    <option value="50000">Under $50,000</option>
                    <option value="75000">Under $75,000</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {apiResponse?.meta && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {apiResponse.meta.totalRecords.toLocaleString()} vehicles found
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Vehicle Grid */}
        {vehicles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {vehicles.map((vehicle) => (
                <MySQLVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={favorites.has(vehicle.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {apiResponse?.meta && (
              <>
                {/* Desktop Pagination */}
                <div className="hidden md:block">
                  <PaginationControls
                    meta={apiResponse.meta}
                    onPageChange={handlePageChange}
                  />
                </div>

                {/* Mobile Pagination */}
                <div className="block md:hidden">
                  <SimplePagination
                    meta={apiResponse.meta}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          !loading &&
          !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No vehicles found matching your criteria.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
