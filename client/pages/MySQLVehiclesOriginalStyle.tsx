import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Gauge,
  Settings,
  ChevronDown,
  X,
  Heart,
  Sliders,
  Check,
  MapPin,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { VehicleCard } from "@/components/VehicleCard";
import { FilterSection } from "@/components/FilterSection";
import { VehicleTypeCard } from "@/components/VehicleTypeCard";
import { Pagination } from "@/components/Pagination";
import { NavigationHeader } from "@/components/NavigationHeader";
import ErrorBoundary, { SimpleFallback } from "@/components/ErrorBoundary";
import { useDebounce, apiCache, OptimizedApiClient, PerformanceMonitor } from "@/lib/performance";

console.log("🚀 FULL DESIGN: MySQLVehiclesOriginalStyle loading");

// Vehicle interface for live data
interface Vehicle {
  id: number;
  featured: boolean;
  viewed: boolean;
  images: string[];
  badges: string[];
  title: string;
  mileage: string;
  transmission: string;
  doors: string;
  salePrice: string | null;
  payment: string | null;
  dealer: string;
  location: string;
  phone: string;
  seller_type: string;
  city_seller?: string;
  state_seller?: string;
  zip_seller?: string;
}

// API types
interface PaginationMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface VehiclesApiResponse {
  data: Vehicle[];
  meta: PaginationMeta;
  success: boolean;
  message?: string;
}

function MySQLVehiclesOriginalStyleInner() {
  console.log("🚀 FULL DESIGN: Component rendering");

  // React Router hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Core state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<VehiclesApiResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(20);

  // UI state
  const [favorites, setFavorites] = useState<{ [key: number]: Vehicle }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [unifiedSearch, setUnifiedSearch] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("200");

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    condition: [] as string[],
    make: [] as string[],
    model: [] as string[],
    trim: [] as string[],
    year: [] as string[],
    bodyStyle: [] as string[],
    vehicleType: [] as string[],
    driveType: [] as string[],
    transmission: [] as string[],
    mileage: "",
    exteriorColor: [] as string[],
    interiorColor: [] as string[],
    sellerType: [] as string[],
    dealer: [] as string[],
    state: [] as string[],
    city: [] as string[],
    priceMin: "",
    priceMax: "",
    paymentMin: "",
    paymentMax: "",
  });

  // Filter options with counts
  const [filterOptions, setFilterOptions] = useState<{
    makes: { name: string; count: number }[];
    models: { name: string; count: number }[];
    trims: { name: string; count: number }[];
    conditions: { name: string; count: number }[];
    vehicleTypes: { name: string; count: number }[];
    driveTypes: { name: string; count: number }[];
    transmissions: { name: string; count: number }[];
    exteriorColors: { name: string; count: number }[];
    interiorColors: { name: string; count: number }[];
    sellerTypes: { name: string; count: number }[];
    dealers: { name: string; count: number }[];
    states: { name: string; count: number }[];
    cities: { name: string; count: number }[];
    totalVehicles: number;
  }>({
    makes: [], models: [], trims: [], conditions: [],
    vehicleTypes: [], driveTypes: [], transmissions: [],
    exteriorColors: [], interiorColors: [], sellerTypes: [],
    dealers: [], states: [], cities: [], totalVehicles: 0
  });

  // Filter UI state
  const [collapsedFilters, setCollapsedFilters] = useState({
    vehicleType: false,
    condition: true,
    mileage: true,
    make: false,
    model: true,
    trim: true,
    year: true,
    price: false,
    payment: true,
    driveType: true,
    transmission: true,
    transmissionSpeed: true,
    exteriorColor: true,
    interiorColor: true,
    sellerType: true,
    dealer: true,
    state: true,
    city: true,
  });

  // Price and payment state
  const [priceMin, setPriceMin] = useState("10000");
  const [priceMax, setPriceMax] = useState("100000");
  const [paymentMin, setPaymentMin] = useState("100");
  const [paymentMax, setPaymentMax] = useState("2000");

  // Location state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [appliedLocation, setAppliedLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [appliedRadius, setAppliedRadius] = useState("200");

  // Refs and performance
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced values
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedAppliedFilters = useDebounce(appliedFilters, 300);

  // Calculated values
  const totalPages = apiResponse?.meta?.totalPages || 1;
  const totalResults = apiResponse?.meta?.totalRecords || 0;
  const favoritesCount = Object.keys(favorites).length;

  console.log("🔍 FULL DESIGN: State initialized", {
    loading,
    vehiclesCount: vehicles.length,
    totalResults,
    currentPage
  });

  // API fetch function
  const fetchCombinedData = useCallback(async () => {
    if (!isMountedRef.current) return;

    console.log("🚀 FULL DESIGN: Fetching data");
    
    try {
      setLoading(true);
      setError(null);

      // Build API URL
      const apiUrl = new URL('/api/simple-vehicles/combined', window.location.origin);
      apiUrl.searchParams.set('page', currentPage.toString());
      apiUrl.searchParams.set('pageSize', resultsPerPage.toString());

      if (debouncedSearchTerm.trim()) {
        apiUrl.searchParams.set('search', debouncedSearchTerm.trim());
      }

      if (sortBy !== "relevance") {
        apiUrl.searchParams.set('sortBy', sortBy);
      }

      // Add filters
      if (debouncedAppliedFilters.make.length > 0) {
        apiUrl.searchParams.set('make', debouncedAppliedFilters.make.join(','));
      }
      if (debouncedAppliedFilters.condition.length > 0) {
        apiUrl.searchParams.set('condition', debouncedAppliedFilters.condition.join(','));
      }

      console.log("🔗 FULL DESIGN: API URL:", apiUrl.toString());

      const response = await fetch(apiUrl.toString());
      const data = await response.json();

      console.log("✅ FULL DESIGN: API Response:", {
        success: data.success,
        vehiclesCount: data.data?.vehicles?.length,
        totalRecords: data.data?.meta?.totalRecords
      });

      if (data.success) {
        setVehicles(data.data.vehicles || []);
        setApiResponse({
          data: data.data.vehicles,
          meta: data.data.meta,
          success: true
        });
        setFilterOptions(data.data.filters || {
          makes: [], models: [], trims: [], conditions: [],
          vehicleTypes: [], driveTypes: [], transmissions: [],
          exteriorColors: [], interiorColors: [], sellerTypes: [],
          dealers: [], states: [], cities: [], totalVehicles: 0
        });
      } else {
        setError(data.message || 'Failed to load vehicles');
      }
    } catch (err) {
      console.error("❌ FULL DESIGN: API Error:", err);
      setError('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, [currentPage, resultsPerPage, debouncedSearchTerm, sortBy, debouncedAppliedFilters]);

  // Effects
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem("carzino_favorites") || "{}");
    setFavorites(savedFavorites);
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    console.log("🔄 FULL DESIGN: Triggering data fetch");
    fetchCombinedData();
  }, [fetchCombinedData]);

  // Helper functions
  const toggleFavorite = (vehicle: Vehicle) => {
    const newFavorites = { ...favorites };
    const wasAlreadyFavorited = !!newFavorites[vehicle.id];

    if (wasAlreadyFavorited) {
      delete newFavorites[vehicle.id];
    } else {
      newFavorites[vehicle.id] = vehicle;
      setKeeperMessage(vehicle.id);
      setTimeout(() => setKeeperMessage(null), 2000);
    }
    
    setFavorites(newFavorites);
    localStorage.setItem("carzino_favorites", JSON.stringify(newFavorites));
  };

  const getDisplayedVehicles = () => {
    if (viewMode === "favorites") {
      return Object.values(favorites);
    }
    return vehicles;
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setUnifiedSearch("");
    setZipCode("");
    setAppliedFilters({
      condition: [], make: [], model: [], trim: [], year: [], bodyStyle: [],
      vehicleType: [], driveType: [], transmission: [], mileage: "",
      exteriorColor: [], interiorColor: [], sellerType: [], dealer: [],
      state: [], city: [], priceMin: "", priceMax: "", paymentMin: "", paymentMax: ""
    });
    setCurrentPage(1);
  };

  const removeAppliedFilter = (category: string, value: string) => {
    const newFilters = {
      ...appliedFilters,
      [category]: (appliedFilters[category as keyof typeof appliedFilters] as string[])
        .filter((item: string) => item !== value),
    };
    setAppliedFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedVehicles = getDisplayedVehicles();

  console.log("🎨 FULL DESIGN: About to render", {
    loading,
    vehiclesCount: displayedVehicles.length,
    totalResults
  });

  return (
    <div className="min-h-screen bg-white main-container" style={{ fontFamily: "Albert Sans, sans-serif" }}>
      <NavigationHeader />
      
      <div className="flex lg:space-x-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Find Your Perfect Vehicle</h2>
            
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={unifiedSearch}
                  onChange={(e) => setUnifiedSearch(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Applied Filters */}
            {(appliedFilters.condition.length > 0 || appliedFilters.make.length > 0) && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Applied Filters</h3>
                  <button
                    onClick={clearAllFilters}
                    className="bg-red-600 text-white px-3 py-1 rounded-full text-xs"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appliedFilters.condition.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("condition", item)} className="ml-1">×</button>
                    </span>
                  ))}
                  {appliedFilters.make.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("make", item)} className="ml-1">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Sections */}
            <div className="space-y-4">
              {/* Condition Filter */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Condition</h3>
                <div className="space-y-2">
                  {["New", "Used", "Certified"].map((condition) => (
                    <label key={condition} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={appliedFilters.condition.includes(condition)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              condition: [...prev.condition, condition]
                            }));
                          } else {
                            removeAppliedFilter("condition", condition);
                          }
                        }}
                        className="mr-2"
                      />
                      {condition}
                    </label>
                  ))}
                </div>
              </div>

              {/* Make Filter */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Make</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.makes.slice(0, 10).map((make) => (
                    <label key={make.name} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={appliedFilters.make.includes(make.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              make: [...prev.make, make.name]
                            }));
                          } else {
                            removeAppliedFilter("make", make.name);
                          }
                        }}
                        className="mr-2"
                      />
                      {make.name} ({make.count})
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 bg-white sticky top-0 z-40 border-b">
            <h1 className="text-xl font-bold mb-3">
              {viewMode === "favorites" ? "My Favorites" : "Vehicles for Sale"}
            </h1>
            
            <div className="flex items-center justify-between">
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Sliders className="w-4 h-4" />
                Filter
              </button>
              
              <button
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${viewMode === "favorites" ? "text-red-600" : ""}`}
                onClick={() => setViewMode(viewMode === "favorites" ? "all" : "favorites")}
              >
                Favorites ({favoritesCount})
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {viewMode === "favorites" 
                  ? `${favoritesCount} Saved Vehicles`
                  : `${totalResults} Vehicles Found`
                }
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="miles-low">Miles: Low to High</option>
                  <option value="year-newest">Year: Newest First</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
                <div className="text-lg">Loading vehicles...</div>
                <div className="text-sm text-gray-500 mt-2">Found {totalResults} vehicles</div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <div className="text-red-600 mb-4">Error: {error}</div>
                <button 
                  onClick={fetchCombinedData}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Try Again
                </button>
              </div>
            ) : displayedVehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">No vehicles found</div>
              </div>
            ) : (
              <>
                {/* Vehicle Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {displayedVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      isFavorited={!!favorites[vehicle.id]}
                      onToggleFavorite={() => toggleFavorite(vehicle)}
                      keeperMessage={keeperMessage === vehicle.id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {viewMode === "all" && totalPages > 1 && (
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
      </div>

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Mobile filter content */}
              <div className="space-y-4">
                {/* Same filter content as desktop */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Condition</h3>
                  <div className="space-y-2">
                    {["New", "Used", "Certified"].map((condition) => (
                      <label key={condition} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={appliedFilters.condition.includes(condition)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAppliedFilters(prev => ({
                                ...prev,
                                condition: [...prev.condition, condition]
                              }));
                            } else {
                              removeAppliedFilter("condition", condition);
                            }
                          }}
                          className="mr-2"
                        />
                        {condition}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-red-600 text-white py-2 rounded"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    clearAllFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full border border-gray-300 py-2 rounded"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Error boundary wrapper
export default function MySQLVehiclesOriginalStyle() {
  return (
    <ErrorBoundary fallback={SimpleFallback}>
      <MySQLVehiclesOriginalStyleInner />
    </ErrorBoundary>
  );
}
