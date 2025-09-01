import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Filter, SortAsc, Loader, AlertTriangle } from "lucide-react";
import { MySQLVehicleCard, VehicleCardSkeleton } from "@/components/MySQLVehicleCard";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Pagination } from "@/components/Pagination";
import { 
  vehicleApi, 
  VehicleRecord, 
  VehicleFilters, 
  FilterOptions,
  VehiclesApiResponse 
} from "@/lib/vehicleApi";

export default function MySQLVehiclesOriginalStyle() {
  console.log("🚀 MySQL Vehicles - Original Design Loading");

  const location = useLocation();
  const navigate = useNavigate();

  // Core state
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Filter state
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    makes: [],
    models: [],
    conditions: [],
    fuelTypes: [],
    transmissions: [],
    drivetrains: [],
    bodyStyles: [],
    sellerTypes: [],
  });

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const isMountedRef = useRef(true);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem("vehicle_favorites") || "[]");
    setFavorites(savedFavorites);
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: number[]) => {
    setFavorites(newFavorites);
    localStorage.setItem("vehicle_favorites", JSON.stringify(newFavorites));
  }, []);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((vehicleId: number) => {
    const newFavorites = favorites.includes(vehicleId)
      ? favorites.filter(id => id !== vehicleId)
      : [...favorites, vehicleId];
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching vehicles:", { currentPage, pageSize, filters, sortBy, sortOrder });

      const response = await vehicleApi.getVehicles(
        currentPage,
        pageSize,
        filters,
        sortBy,
        sortOrder
      );

      console.log("✅ Vehicles fetched:", {
        success: response.success,
        count: response.data?.length,
        total: response.meta?.totalRecords
      });

      if (response.success) {
        setVehicles(response.data || []);
        setTotalPages(response.meta?.totalPages || 1);
        setTotalRecords(response.meta?.totalRecords || 0);
      } else {
        setError(response.message || "Failed to load vehicles");
      }
    } catch (err) {
      console.error("❌ Error fetching vehicles:", err);
      setError("Failed to connect to vehicle database");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, filters, sortBy, sortOrder]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await vehicleApi.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (err) {
      console.error("❌ Error fetching filter options:", err);
    }
  }, []);

  // Effects
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (newFilters: Partial<VehicleFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: "ASC" | "DESC" = "DESC") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MySQL Vehicles Database
          </h1>
          <p className="text-gray-600">
            Browse our inventory of {totalRecords.toLocaleString()} vehicles
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  handleSortChange(newSortBy, newSortOrder as "ASC" | "DESC");
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="id-DESC">Newest First</option>
                <option value="id-ASC">Oldest First</option>
                <option value="price-ASC">Price: Low to High</option>
                <option value="price-DESC">Price: High to Low</option>
                <option value="mileage-ASC">Mileage: Low to High</option>
                <option value="mileage-DESC">Mileage: High to Low</option>
                <option value="year-DESC">Year: Newest First</option>
                <option value="year-ASC">Year: Oldest First</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  showFilters
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Make Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make
                  </label>
                  <select
                    value={filters.make || ""}
                    onChange={(e) => handleFilterChange({ make: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Makes</option>
                    {filterOptions.makes.map((make) => (
                      <option key={make} value={make}>{make}</option>
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
                    onChange={(e) => handleFilterChange({ condition: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Conditions</option>
                    {filterOptions.conditions.map((condition) => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={filters.minPrice || ""}
                    onChange={(e) => handleFilterChange({ 
                      minPrice: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.maxPrice || ""}
                    onChange={(e) => handleFilterChange({ 
                      maxPrice: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords.toLocaleString()} vehicles
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={20}>20</option>
              <option value={40}>40</option>
              <option value={60}>60</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <VehicleCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Vehicles</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchVehicles}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No vehicles found matching your criteria</div>
            <button
              onClick={handleClearFilters}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {vehicles.map((vehicle) => (
                <MySQLVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={favorites.includes(vehicle.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
