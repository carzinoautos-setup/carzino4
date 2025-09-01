import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  X,
  Heart,
  Sliders,
  MapPin,
  Loader,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { FilterSection } from "@/components/FilterSection";
import { MySQLVehicleCard } from "@/components/MySQLVehicleCard";
import { Pagination } from "@/components/Pagination";
import ErrorBoundary from "@/components/ErrorBoundary";
import { VehicleRecord } from "../lib/vehicleApi";
import {
  wordpressCustomApi,
  WordPressVehicle,
  WordPressVehiclesResponse,
  WordPressVehicleFilters
} from "../lib/wordpressCustomApi";

export default function WordPressVehicles() {
  // State management
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(20);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  
  // UI states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [favorites, setFavorites] = useState<{ [key: number]: VehicleRecord }>({});
  const [collapsedFilters, setCollapsedFilters] = useState<{ [key: string]: boolean }>({});

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    makes: [] as Array<{ name: string; count: number }>,
    models: [] as Array<{ name: string; count: number }>,
    conditions: [] as Array<{ name: string; count: number }>,
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Transform WordPress vehicle to VehicleRecord
  const transformVehicle = useCallback((wpVehicle: WordPressVehicle): VehicleRecord => {
    const acf = wpVehicle.acf;
    
    return {
      id: wpVehicle.id,
      year: acf?.year || 0,
      make: acf?.make || "",
      model: acf?.model || "",
      trim: acf?.trim || "",
      body_style: acf?.body_style || "",
      engine_cylinders: acf?.engine_cylinders || 0,
      fuel_type: acf?.fuel_type || "",
      transmission: acf?.transmission || "",
      drivetrain: acf?.drivetrain || "",
      exterior_color_generic: acf?.exterior_color || "",
      interior_color_generic: acf?.interior_color || "",
      doors: acf?.doors || 4,
      price: wpVehicle.price || wpVehicle.sale_price || 0,
      mileage: acf?.mileage || 0,
      title_status: acf?.title_status || "Clean",
      highway_mpg: acf?.highway_mpg || 0,
      condition: acf?.condition || "Used",
      certified: acf?.certified || false,
      seller_type: acf?.account_type_seller || "Dealer",
      city_seller: acf?.city_seller,
      state_seller: acf?.state_seller,
      zip_seller: acf?.zip_seller,
      phone_number_seller: acf?.phone_number_seller,
      business_name_seller: acf?.business_name_seller,
      interest_rate: acf?.interest_rate || 0,
      down_payment: acf?.down_payment || 0,
      loan_term: acf?.loan_term || 60,
      payments: acf?.payment || 0,
      images: wpVehicle.images?.map(img => img.src) || [],
      stock_status: wpVehicle.stock_status || "instock",
      is_featured: acf?.is_featured || false,
      title: wpVehicle.name || `${acf?.year} ${acf?.make} ${acf?.model}`.trim(),
    };
  }, []);

  // Fetch vehicles from WordPress API
  const fetchVehicles = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Fetching WordPress vehicles - Page ${page}`);

      const filters: WordPressVehicleFilters = {
        page,
        per_page: pageSize,
      };

      // Add search and filter parameters
      if (selectedMakes.length > 0) {
        filters.make = selectedMakes[0]; // WordPress API might need single value
      }
      
      if (selectedModels.length > 0) {
        filters.model = selectedModels[0]; // WordPress API might need single value
      }
      
      if (selectedConditions.length > 0) {
        filters.condition = selectedConditions[0]; // WordPress API might need single value
      }

      if (priceMin) {
        filters.min_price = parseInt(priceMin.replace(/[^\d]/g, ''));
      }
      
      if (priceMax) {
        filters.max_price = parseInt(priceMax.replace(/[^\d]/g, ''));
      }

      const response: WordPressVehiclesResponse = await wordpressCustomApi.getVehicles(page, pageSize, filters);

      if (response.success && response.data) {
        const transformedVehicles = response.data.map(transformVehicle);
        setVehicles(transformedVehicles);
        setCurrentPage(response.pagination?.page || page);
        setTotalPages(response.pagination?.total_pages || 0);
        setTotalRecords(response.pagination?.total || 0);

        // Extract filter options from response data
        const makes = Array.from(new Set(response.data.map(v => v.acf?.make).filter(Boolean)))
          .map(make => ({ name: make, count: response.data.filter(v => v.acf?.make === make).length }));
        
        const models = Array.from(new Set(response.data.map(v => v.acf?.model).filter(Boolean)))
          .map(model => ({ name: model, count: response.data.filter(v => v.acf?.model === model).length }));
        
        const conditions = Array.from(new Set(response.data.map(v => v.acf?.condition).filter(Boolean)))
          .map(condition => ({ name: condition, count: response.data.filter(v => v.acf?.condition === condition).length }));

        setFilterOptions({ makes, models, conditions });

        console.log(`✅ WordPress vehicles loaded: ${transformedVehicles.length} vehicles`);
      } else {
        throw new Error(response.message || 'Failed to fetch vehicles');
      }

    } catch (err) {
      console.error('❌ Error fetching WordPress vehicles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, selectedMakes, selectedModels, selectedConditions, priceMin, priceMax, transformVehicle]);

  // Initial load
  useEffect(() => {
    fetchVehicles(1);
  }, []);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchVehicles(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle filter changes
  const applyFilters = useCallback(() => {
    setCurrentPage(1);
    fetchVehicles(1);
  }, [fetchVehicles]);

  // Toggle favorite
  const handleToggleFavorite = (vehicle: VehicleRecord) => {
    setFavorites(prev => {
      const newFavorites = { ...prev };
      if (newFavorites[vehicle.id]) {
        delete newFavorites[vehicle.id];
      } else {
        newFavorites[vehicle.id] = vehicle;
      }
      return newFavorites;
    });
  };

  // Toggle filter section
  const toggleFilter = (filterName: string) => {
    setCollapsedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Price formatting
  const formatPrice = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    return numericValue ? parseInt(numericValue).toLocaleString() : '';
  };

  const unformatPrice = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <NavigationHeader />

        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                WordPress Vehicles
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading...' : `${totalRecords.toLocaleString()} vehicles available`}
              </p>
            </div>
            
            {/* API Status */}
            <div className="mt-4 lg:mt-0 flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">WordPress Custom API</span>
              </div>
              <button
                onClick={() => {
                  wordpressCustomApi.clearCache();
                  fetchVehicles(currentPage);
                }}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <div className="lg:w-80 xl:w-96">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Filters
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Filter Panels */}
              <div className={`space-y-4 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search vehicles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Make Filter */}
                <FilterSection
                  title="Make"
                  isCollapsed={collapsedFilters.make}
                  onToggle={() => toggleFilter("make")}
                >
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filterOptions.makes.map((makeOption) => (
                      <label
                        key={makeOption.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedMakes.includes(makeOption.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMakes([...selectedMakes, makeOption.name]);
                            } else {
                              setSelectedMakes(selectedMakes.filter(m => m !== makeOption.name));
                            }
                          }}
                        />
                        <span className="flex-1">{makeOption.name}</span>
                        <span className="text-gray-500 text-sm">({makeOption.count})</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {/* Model Filter */}
                <FilterSection
                  title="Model"
                  isCollapsed={collapsedFilters.model}
                  onToggle={() => toggleFilter("model")}
                >
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filterOptions.models.map((modelOption) => (
                      <label
                        key={modelOption.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedModels.includes(modelOption.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModels([...selectedModels, modelOption.name]);
                            } else {
                              setSelectedModels(selectedModels.filter(m => m !== modelOption.name));
                            }
                          }}
                        />
                        <span className="flex-1">{modelOption.name}</span>
                        <span className="text-gray-500 text-sm">({modelOption.count})</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {/* Price Filter */}
                <FilterSection
                  title="Price"
                  isCollapsed={collapsedFilters.price}
                  onToggle={() => toggleFilter("price")}
                >
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="text"
                          placeholder="Min price"
                          value={formatPrice(priceMin)}
                          onChange={(e) => setPriceMin(unformatPrice(e.target.value))}
                          onBlur={applyFilters}
                          className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600"
                        />
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="text"
                          placeholder="Max price"
                          value={formatPrice(priceMax)}
                          onChange={(e) => setPriceMax(unformatPrice(e.target.value))}
                          onBlur={applyFilters}
                          className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </div>
                    <button
                      onClick={applyFilters}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </FilterSection>

                {/* Condition Filter */}
                <FilterSection
                  title="Condition"
                  isCollapsed={collapsedFilters.condition}
                  onToggle={() => toggleFilter("condition")}
                >
                  <div className="space-y-1">
                    {filterOptions.conditions.map((conditionOption) => (
                      <label
                        key={conditionOption.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedConditions.includes(conditionOption.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedConditions([...selectedConditions, conditionOption.name]);
                            } else {
                              setSelectedConditions(selectedConditions.filter(c => c !== conditionOption.name));
                            }
                          }}
                        />
                        <span className="flex-1">{conditionOption.name}</span>
                        <span className="text-gray-500 text-sm">({conditionOption.count})</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 bg-white rounded-lg border border-gray-200 p-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Search Results
                  </h2>
                  <p className="text-sm text-gray-600">
                    {loading ? 'Loading...' : `Showing ${vehicles.length} of ${totalRecords.toLocaleString()} vehicles`}
                  </p>
                </div>
                
                {totalRecords > 0 && (
                  <div className="text-sm text-gray-600 mt-2 sm:mt-0">
                    Page {currentPage} of {totalPages}
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader className="w-6 h-6 animate-spin text-red-600" />
                    <span className="text-gray-600">Loading WordPress vehicles...</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-semibold">Error Loading Vehicles</h3>
                  </div>
                  <p className="text-red-700 mb-4">{error}</p>
                  <button
                    onClick={() => fetchVehicles(currentPage)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* No Results */}
              {!loading && !error && vehicles.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
                  <button
                    onClick={() => {
                      setSelectedMakes([]);
                      setSelectedModels([]);
                      setSelectedConditions([]);
                      setPriceMin('');
                      setPriceMax('');
                      fetchVehicles(1);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Vehicle Grid */}
              {!loading && !error && vehicles.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {vehicles.map((vehicle) => (
                      <MySQLVehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onFavoriteToggle={handleToggleFavorite}
                        isFavorite={!!favorites[vehicle.id]}
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
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default WordPressVehicles;
