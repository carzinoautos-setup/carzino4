import React, { useState, useEffect, useCallback, useRef } from "react";
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
  console.log("🚀 MySQL Vehicles - Loading with original design");

  const location = useLocation();
  const navigate = useNavigate();

  // Core state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const [showMoreMakes, setShowMoreMakes] = useState(false);
  const [showMoreModels, setShowMoreModels] = useState(false);
  const [showMoreTrims, setShowMoreTrims] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("10");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState("all");
  const [favorites, setFavorites] = useState<{ [key: number]: Vehicle }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);

  // API State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<VehiclesApiResponse | null>(null);

  // Price and payment state
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [paymentMin, setPaymentMin] = useState("");
  const [paymentMax, setPaymentMax] = useState("");
  const [termLength, setTermLength] = useState("72");
  const [interestRate, setInterestRate] = useState("8");
  const [downPayment, setDownPayment] = useState("2000");

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    condition: [] as string[],
    make: [] as string[],
    model: [] as string[],
    trim: [] as string[],
    vehicleType: [] as string[],
    driveType: [] as string[],
    mileage: "",
    exteriorColor: [] as string[],
    interiorColor: [] as string[],
    sellerType: [] as string[],
    transmission: [] as string[],
    dealer: [] as string[],
    city: [] as string[],
    state: [] as string[],
    priceMin: "",
    priceMax: "",
    paymentMin: "",
    paymentMax: "",
  });

  const [collapsedFilters, setCollapsedFilters] = useState({
    vehicleType: true,
    condition: false,
    mileage: false,
    make: false,
    model: false,
    trim: false,
    price: false,
    payment: false,
    driveType: false,
    transmissionSpeed: true,
    exteriorColor: true,
    interiorColor: true,
    sellerType: true,
    dealer: true,
    state: true,
    city: true,
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

  // Refs
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // API fetch function
  const fetchCombinedData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Build API URL - call our backend that properly handles filters
      const apiUrl = new URL('/api/simple-vehicles/combined', window.location.origin);
      apiUrl.searchParams.set('page', currentPage.toString());
      apiUrl.searchParams.set('pageSize', resultsPerPage.toString());

      if (sortBy !== "relevance") {
        apiUrl.searchParams.set('sortBy', sortBy);
      }

      // Add ALL filters to API call
      if (appliedFilters.make.length > 0) {
        apiUrl.searchParams.set('make', appliedFilters.make.join(','));
      }
      if (appliedFilters.condition.length > 0) {
        apiUrl.searchParams.set('condition', appliedFilters.condition.join(','));
      }
      if (appliedFilters.model.length > 0) {
        apiUrl.searchParams.set('model', appliedFilters.model.join(','));
      }
      if (appliedFilters.trim.length > 0) {
        apiUrl.searchParams.set('trim', appliedFilters.trim.join(','));
      }
      if (appliedFilters.vehicleType.length > 0) {
        apiUrl.searchParams.set('body_style', appliedFilters.vehicleType.join(','));
      }
      if (appliedFilters.driveType.length > 0) {
        apiUrl.searchParams.set('driveType', appliedFilters.driveType.join(','));
      }
      if (appliedFilters.exteriorColor.length > 0) {
        apiUrl.searchParams.set('exteriorColor', appliedFilters.exteriorColor.join(','));
      }
      if (appliedFilters.sellerType.length > 0) {
        apiUrl.searchParams.set('sellerType', appliedFilters.sellerType.join(','));
      }
      if (appliedFilters.transmission.length > 0) {
        apiUrl.searchParams.set('transmission', appliedFilters.transmission.join(','));
      }
      if (appliedFilters.interiorColor.length > 0) {
        apiUrl.searchParams.set('interiorColor', appliedFilters.interiorColor.join(','));
      }
      if (appliedFilters.dealer.length > 0) {
        apiUrl.searchParams.set('dealer', appliedFilters.dealer.join(','));
      }
      if (appliedFilters.city.length > 0) {
        apiUrl.searchParams.set('city', appliedFilters.city.join(','));
      }
      if (appliedFilters.state.length > 0) {
        apiUrl.searchParams.set('state', appliedFilters.state.join(','));
      }
      if (appliedFilters.mileage) {
        // Convert mileage range text to min/max numeric values for API
        switch (appliedFilters.mileage) {
          case "Under 15,000":
            apiUrl.searchParams.set('max_mileage', '15000');
            break;
          case "15,000 – 30,000":
            apiUrl.searchParams.set('min_mileage', '15000');
            apiUrl.searchParams.set('max_mileage', '30000');
            break;
          case "30,000 – 60,000":
            apiUrl.searchParams.set('min_mileage', '30000');
            apiUrl.searchParams.set('max_mileage', '60000');
            break;
          case "60,000 – 100,000":
            apiUrl.searchParams.set('min_mileage', '60000');
            apiUrl.searchParams.set('max_mileage', '100000');
            break;
          case "Over 100,000":
            apiUrl.searchParams.set('min_mileage', '100000');
            break;
        }
      }
      if (appliedFilters.priceMin) {
        apiUrl.searchParams.set('priceMin', appliedFilters.priceMin);
      }
      if (appliedFilters.priceMax) {
        apiUrl.searchParams.set('priceMax', appliedFilters.priceMax);
      }
      if (appliedFilters.paymentMin) {
        apiUrl.searchParams.set('paymentMin', appliedFilters.paymentMin);
      }
      if (appliedFilters.paymentMax) {
        apiUrl.searchParams.set('paymentMax', appliedFilters.paymentMax);
      }
      if (zipCode) {
        apiUrl.searchParams.set('zipCode', zipCode);
      }
      if (radius !== "10") {
        apiUrl.searchParams.set('radius', radius);
      }

      console.log("🔗 API URL:", apiUrl.toString());
      console.log("🔍 DEBUG: Applied filters being sent:", appliedFilters);
      console.log("🔍 DEBUG: All filter params:", {
        make: appliedFilters.make,
        condition: appliedFilters.condition,
        model: appliedFilters.model,
        zipCode,
        radius
      });

      const response = await fetch(apiUrl.toString());
      const data = await response.json();

      console.log("✅ API Response:", { success: data.success, vehiclesCount: data.data?.vehicles?.length });

      if (data.success) {
        setVehicles(data.data.vehicles || []);
        setApiResponse({
          data: data.data.vehicles,
          meta: data.data.meta,
          success: true
        });
        setTotalPages(data.data.meta?.totalPages || 1);
        setTotalResults(data.data.meta?.totalRecords || 0);
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
      console.error("❌ API Error:", err);
      setError('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, [currentPage, resultsPerPage, sortBy, appliedFilters, zipCode, radius, priceMin, priceMax, paymentMin, paymentMax, termLength, interestRate, downPayment]);

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
    fetchCombinedData();
  }, [fetchCombinedData]);

  // Helper functions
  const saveFavorites = (newFavorites: { [key: number]: Vehicle }) => {
    setFavorites(newFavorites);
    localStorage.setItem("carzino_favorites", JSON.stringify(newFavorites));
  };

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
    saveFavorites(newFavorites);
  };

  const getDisplayedVehicles = () => {
    if (viewMode === "favorites") {
      return Object.values(favorites);
    }
    return vehicles;
  };

  const clearAllFilters = () => {
    setAppliedFilters({
      condition: [],
      make: [],
      model: [],
      trim: [],
      vehicleType: [],
      driveType: [],
      mileage: "",
      exteriorColor: [],
      interiorColor: [],
      sellerType: [],
      transmission: [],
      dealer: [],
      city: [],
      state: [],
      priceMin: "",
      priceMax: "",
      paymentMin: "",
      paymentMax: "",
    });
    setPriceMin("");
    setPriceMax("");
    setPaymentMin("");
    setPaymentMax("");
    setTermLength("72");
    setInterestRate("8");
    setDownPayment("2000");
    setZipCode("");
    setRadius("10");
    setCurrentPage(1);
  };

  const removeAppliedFilter = (category: string, value: string) => {
    setCurrentPage(1); // Reset to first page when filters change
    setAppliedFilters((prev) => {
      const newFilters = {
        ...prev,
        [category]: (prev[category as keyof typeof prev] as string[]).filter(
          (item: string) => item !== value,
        ),
      };

      if (category === "make") {
        newFilters.model = [];
        newFilters.trim = [];
      } else if (category === "model") {
        newFilters.trim = [];
      }

      return newFilters;
    });
  };

  const toggleFilter = (filterName: string) => {
    setCollapsedFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  // Handle filter changes
  const handleMakeChange = (makeName: string, isChecked: boolean) => {
    setCurrentPage(1); // Reset to first page when filters change
    setAppliedFilters((prev) => {
      const newMakes = isChecked
        ? [...prev.make, makeName]
        : prev.make.filter((item) => item !== makeName);

      return {
        ...prev,
        make: newMakes,
        model: [],
        trim: [],
      };
    });
  };

  const handleModelChange = (modelName: string, isChecked: boolean) => {
    setCurrentPage(1); // Reset to first page when filters change
    setAppliedFilters((prev) => {
      const newModels = isChecked
        ? [...prev.model, modelName]
        : prev.model.filter((item) => item !== modelName);

      return {
        ...prev,
        model: newModels,
        trim: [],
      };
    });
  };

  const handleTrimChange = (trimName: string, isChecked: boolean) => {
    setCurrentPage(1); // Reset to first page when filters change
    setAppliedFilters((prev) => ({
      ...prev,
      trim: isChecked
        ? [...prev.trim, trimName]
        : prev.trim.filter((item) => item !== trimName),
    }));
  };

  const handleVehicleTypeToggle = (vehicleType: string) => {
    setCurrentPage(1); // Reset to first page when filters change
    setAppliedFilters((prev) => ({
      ...prev,
      vehicleType: prev.vehicleType.includes(vehicleType)
        ? prev.vehicleType.filter((item) => item !== vehicleType)
        : [...prev.vehicleType, vehicleType],
    }));
  };

  // Get conditional data - WordPress API already returns conditional filters, use directly
  const getAvailableModels = () => {
    // If no makes are selected, don't show any models
    if (appliedFilters.make.length === 0) {
      return [];
    }

    // WordPress API returns conditional models based on selected makes
    // No need for client-side filtering - use the conditional data directly
    return filterOptions.models || [];
  };

  const getAvailableTrims = () => {
    // If no models are selected, don't show any trims
    if (appliedFilters.model.length === 0) {
      return [];
    }

    // WordPress API returns conditional trims based on selected models
    // No need for client-side filtering - use the conditional data directly
    return filterOptions.trims || [];
  };

  const getAvailableBodyTypes = () => {
    // WordPress API returns conditional body types based on all applied filters
    return filterOptions.vehicleTypes || [];
  };

  const availableModels = getAvailableModels();
  const availableTrims = getAvailableTrims();
  const availableBodyTypes = getAvailableBodyTypes();

  const displayedMakes = showMoreMakes ? (filterOptions.makes || []) : (filterOptions.makes || []).slice(0, 8);
  const displayedModels = showMoreModels ? availableModels : availableModels.slice(0, 8);
  const displayedTrims = showMoreTrims ? availableTrims : availableTrims.slice(0, 8);

  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  return (
    <div
      className="min-h-screen bg-white main-container"
      style={{ fontFamily: "Albert Sans, sans-serif" }}
    >
      <NavigationHeader />
      <style>{`
        :root {
          --carzino-featured-badge: 12px;
          --carzino-badge-label: 12px;
          --carzino-vehicle-title: 16px;
          --carzino-vehicle-details: 12px;
          --carzino-price-label: 12px;
          --carzino-price-value: 16px;
          --carzino-dealer-info: 10px;
          --carzino-image-counter: 12px;
          --carzino-filter-title: 16px;
          --carzino-filter-option: 14px;
          --carzino-filter-count: 14px;
          --carzino-search-input: 14px;
          --carzino-location-label: 14px;
          --carzino-dropdown-option: 14px;
          --carzino-vehicle-type-name: 12px;
          --carzino-vehicle-type-count: 11px;
          --carzino-show-more: 14px;
        }

        .carzino-featured-badge { font-size: var(--carzino-featured-badge) !important; font-weight: 500 !important; }
        .carzino-badge-label { font-size: var(--carzino-badge-label) !important; font-weight: 500 !important; }
        .carzino-vehicle-title { font-size: var(--carzino-vehicle-title) !important; font-weight: 600 !important; }
        .carzino-vehicle-details { font-size: var(--carzino-vehicle-details) !important; font-weight: 400 !important; }
        .carzino-price-label { font-size: var(--carzino-price-label) !important; font-weight: 400 !important; }
        .carzino-price-value { font-size: var(--carzino-price-value) !important; font-weight: 700 !important; }
        .carzino-dealer-info { font-size: 12px !important; font-weight: 500 !important; }
        .carzino-image-counter { font-size: var(--carzino-image-counter) !important; font-weight: 400 !important; }
        .carzino-filter-title { font-size: var(--carzino-filter-title) !important; font-weight: 600 !important; }
        .carzino-filter-option { font-size: var(--carzino-filter-option) !important; font-weight: 400 !important; }
        .carzino-filter-count { font-size: var(--carzino-filter-count) !important; font-weight: 400 !important; color: #6B7280 !important; }
        .carzino-search-input { font-size: var(--carzino-search-input) !important; font-weight: 400 !important; }
        .carzino-location-label { font-size: var(--carzino-location-label) !important; font-weight: 500 !important; }
        .carzino-dropdown-option { font-size: var(--carzino-dropdown-option) !important; font-weight: 400 !important; }
        .carzino-vehicle-type-name { font-size: var(--carzino-vehicle-type-name) !important; font-weight: 500 !important; }
        .carzino-vehicle-type-count { font-size: var(--carzino-vehicle-type-count) !important; font-weight: 400 !important; color: #6B7280 !important; }
        .carzino-show-more { font-size: var(--carzino-show-more) !important; font-weight: 500 !important; }

        input[type="checkbox"] {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid #d1d5db;
          border-radius: 3px;
          background-color: white;
          position: relative;
          cursor: pointer;
        }
        
        input[type="checkbox"]:hover {
          border-color: #6b7280;
          background-color: #f9fafb;
        }
        
        input[type="checkbox"]:checked {
          background-color: #dc2626;
          border-color: #dc2626;
        }
        
        input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          color: white;
          font-size: 12px;
          top: -2px;
          left: 2px;
        }

        .vehicle-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        
        .main-container {
          max-width: 1325px;
          margin: 0 auto;
        }

        @media (max-width: 1023px) {
          .vehicle-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }

        @media (max-width: 639px) {
          .vehicle-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .main-container {
            padding: 0;
          }
          
          .vehicle-card {
            border-radius: 8px;
            margin: 0 12px;
          }
        }
      `}</style>

      <div className="flex flex-col lg:flex-row min-h-screen max-w-[1325px] mx-auto">
        {/* Mobile Filter Overlay */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden ${mobileFiltersOpen ? "" : "hidden"}`}
          onClick={() => setMobileFiltersOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50 lg:relative lg:block ${mobileFiltersOpen ? "block" : "hidden"}`}
          style={{ width: "280px" }}
        >
          <div className="lg:hidden flex justify-between items-center mb-4 pb-4 border-b px-4 pt-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 h-full overflow-y-auto">
            {/* Search Section */}
            <div className="hidden lg:block mb-4 pb-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Vehicles"
                  className="carzino-search-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Applied Filters */}
            {(appliedFilters.condition.length > 0 ||
              appliedFilters.make.length > 0 ||
              appliedFilters.model.length > 0 ||
              appliedFilters.trim.length > 0 ||
              appliedFilters.vehicleType.length > 0 ||
              appliedFilters.driveType.length > 0 ||
              appliedFilters.exteriorColor.length > 0 ||
              appliedFilters.interiorColor.length > 0 ||
              appliedFilters.sellerType.length > 0 ||
              appliedFilters.transmission.length > 0 ||
              appliedFilters.dealer.length > 0 ||
              appliedFilters.city.length > 0 ||
              appliedFilters.state.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.priceMin ||
              appliedFilters.priceMax ||
              appliedFilters.paymentMin ||
              appliedFilters.paymentMax) && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="carzino-filter-title">Applied Filters</h3>
                  <button
                    onClick={clearAllFilters}
                    className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-red-700"
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
                      <button
                        onClick={() => removeAppliedFilter("condition", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.make.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("make", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.model.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("model", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.trim.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("trim", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.vehicleType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("vehicleType", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.driveType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("driveType", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.exteriorColor.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("exteriorColor", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.sellerType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("sellerType", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.mileage && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {appliedFilters.mileage}
                      <button
                        onClick={() => setAppliedFilters(prev => ({ ...prev, mileage: "" }))}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(appliedFilters.priceMin || appliedFilters.priceMax) && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      Price: {appliedFilters.priceMin || "$0"} - {appliedFilters.priceMax || "Max"}
                      <button
                        onClick={() => {
                          setAppliedFilters(prev => ({ ...prev, priceMin: "", priceMax: "" }));
                          setPriceMin("");
                          setPriceMax("");
                        }}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(appliedFilters.paymentMin || appliedFilters.paymentMax) && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      Payment: {appliedFilters.paymentMin || "$0"} - {appliedFilters.paymentMax || "Max"}
                      <button
                        onClick={() => {
                          setAppliedFilters(prev => ({ ...prev, paymentMin: "", paymentMax: "" }));
                          setPaymentMin("");
                          setPaymentMax("");
                        }}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {appliedFilters.transmission.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("transmission", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.interiorColor.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("interiorColor", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.dealer.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("dealer", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.city.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("city", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.state.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("state", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Distance */}
            <div className="mb-4 pb-4 border border-gray-200 rounded-lg p-3">
              <label className="carzino-location-label block mb-2">Distance</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="carzino-search-input w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none"
                />
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="carzino-dropdown-option w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none"
                >
                  <option value="10">10 Miles</option>
                  <option value="25">25 Miles</option>
                  <option value="50">50 Miles</option>
                  <option value="100">100 Miles</option>
                  <option value="200">200 Miles</option>
                  <option value="500">500 Miles</option>
                  <option value="nationwide">Nationwide</option>
                </select>
              </div>
            </div>

            {/* Make Filter - moved to be first main filter after Distance */}
            <FilterSection
              title="Make"
              isCollapsed={collapsedFilters.make}
              onToggle={() => toggleFilter("make")}
            >
              <div className="space-y-1">
                {displayedMakes.map((make, index) => (
                  <label
                    key={index}
                    className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.make.includes(make.name)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleMakeChange(make.name, e.target.checked);
                      }}
                    />
                    <span className="carzino-filter-option">{make.name}</span>
                    <span className="carzino-filter-count ml-1">({make.count})</span>
                  </label>
                ))}
                {(filterOptions.makes && filterOptions.makes.length > 8) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMoreMakes(!showMoreMakes);
                    }}
                    className="carzino-show-more text-red-600 hover:text-red-700 mt-1"
                  >
                    {showMoreMakes ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>
            </FilterSection>

            {/* Model Filter */}
            <FilterSection
              title={`Model ${appliedFilters.make.length > 0 ? `(${appliedFilters.make.join(", ")})` : ""}`}
              isCollapsed={collapsedFilters.model}
              onToggle={() => toggleFilter("model")}
            >
              <div className="space-y-1">
                {appliedFilters.make.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Select a make first to see available models
                  </div>
                ) : displayedModels.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    No models available for selected make(s)
                  </div>
                ) : (
                  displayedModels.map((model, index) => (
                    <label
                      key={index}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.model.includes(model.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleModelChange(model.name, e.target.checked);
                        }}
                      />
                      <span className="carzino-filter-option">{model.name}</span>
                      <span className="carzino-filter-count ml-1">({model.count})</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Price Filter */}
            <FilterSection
              title="Filter by Price"
              isCollapsed={collapsedFilters.price}
              onToggle={() => toggleFilter("price")}
            >
              <div className="space-y-2">
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="$10,000"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="text"
                    placeholder="$100,000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <button
                  onClick={() => {
                    setCurrentPage(1); // Reset to first page when filters change
                    setAppliedFilters(prev => ({
                      ...prev,
                      priceMin: priceMin,
                      priceMax: priceMax
                    }));
                  }}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                >
                  Apply Price Filter
                </button>
              </div>
            </FilterSection>

            {/* Trim Filter */}
            <FilterSection
              title={`Trim ${appliedFilters.model.length > 0 ? `(${appliedFilters.model.join(", ")})` : ""}`}
              isCollapsed={collapsedFilters.trim}
              onToggle={() => toggleFilter("trim")}
            >
              <div className="space-y-1">
                {appliedFilters.model.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Select a model first to see available trims
                  </div>
                ) : displayedTrims.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    No trims available for selected model(s)
                  </div>
                ) : (
                  displayedTrims.map((trim, index) => (
                    <label
                      key={index}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.trim.includes(trim.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleTrimChange(trim.name, e.target.checked);
                        }}
                      />
                      <span className="carzino-filter-option">{trim.name}</span>
                      <span className="carzino-filter-count ml-1">({trim.count})</span>
                    </label>
                  ))
                )}
                {(availableTrims && availableTrims.length > 8) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMoreTrims(!showMoreTrims);
                    }}
                    className="carzino-show-more text-red-600 hover:text-red-700 mt-1"
                  >
                    {showMoreTrims ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>
            </FilterSection>

            {/* Vehicle Type Filter */}
            <FilterSection
              title="Vehicle Type"
              isCollapsed={collapsedFilters.vehicleType}
              onToggle={() => toggleFilter("vehicleType")}
            >
              <div className="space-y-1">
                {(availableBodyTypes && availableBodyTypes.length > 0) ? (
                  availableBodyTypes.map((type, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.vehicleType.includes(type.name)}
                        onChange={(e) => handleVehicleTypeToggle(type.name)}
                      />
                      <span className="carzino-filter-option">{type.name}</span>
                      <span className="carzino-filter-count ml-1">({type.count})</span>
                    </label>
                  ))
                ) : (
                  ["SUV / Crossover", "Truck", "Sedan", "Coupe", "Convertible", "Hatchback", "Van / Minivan", "Wagon"].map((type) => (
                    <label key={type} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.vehicleType.includes(type)}
                        onChange={(e) => handleVehicleTypeToggle(type)}
                      />
                      <span className="carzino-filter-option">{type}</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Payment Calculator Filter */}
            <FilterSection
              title="Search by Payment"
              isCollapsed={collapsedFilters.payment}
              onToggle={() => toggleFilter("payment")}
            >
              <div className="space-y-3">
                {/* Payment Range - two inputs side by side with /mo labels */}
                <div className="flex gap-1">
                  <div className="relative w-1/2">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="text"
                      placeholder="100"
                      value={paymentMin}
                      onChange={(e) => setPaymentMin(e.target.value)}
                      className="w-full pl-6 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">/mo</span>
                  </div>
                  <div className="relative w-1/2">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="text"
                      placeholder="2,000"
                      value={paymentMax}
                      onChange={(e) => setPaymentMax(e.target.value)}
                      className="w-full pl-6 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">/mo</span>
                  </div>
                </div>

                {/* Term Length and Interest Rate side by side */}
                <div className="flex gap-1">
                  <select
                    value={termLength}
                    onChange={(e) => setTermLength(e.target.value)}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none bg-white"
                  >
                    <option value="36">36 Months</option>
                    <option value="48">48 Months</option>
                    <option value="60">60 Months</option>
                    <option value="72">72 Months</option>
                    <option value="84">84 Months</option>
                  </select>
                  <select
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none bg-white"
                  >
                    <option value="3">3% APR</option>
                    <option value="4">4% APR</option>
                    <option value="5">5% APR</option>
                    <option value="6">6% APR</option>
                    <option value="7">7% APR</option>
                    <option value="8">8% APR</option>
                    <option value="9">9% APR</option>
                    <option value="10">10% APR</option>
                    <option value="12">12% APR</option>
                  </select>
                </div>

                {/* Down Payment - full width */}
                <input
                  type="text"
                  placeholder="Down Payment: 2000"
                  value={`Down Payment: ${downPayment}`}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setDownPayment(value);
                  }}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600 text-gray-500"
                />
              </div>
            </FilterSection>

            {/* Condition Filter - positioned to match original demo order */}
            <FilterSection
              title="Condition"
              isCollapsed={collapsedFilters.condition}
              onToggle={() => toggleFilter("condition")}
            >
              <div className="space-y-1">
                {["New", "Used", "Certified"].map((condition) => (
                  <label key={condition} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.condition.includes(condition)}
                      onChange={(e) => {
                        setCurrentPage(1); // Reset to first page when filters change
                        if (e.target.checked) {
                          setAppliedFilters(prev => ({
                            ...prev,
                            condition: [...prev.condition, condition]
                          }));
                        } else {
                          removeAppliedFilter("condition", condition);
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{condition}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Mileage Filter */}
            <FilterSection
              title="Mileage"
              isCollapsed={collapsedFilters.mileage}
              onToggle={() => toggleFilter("mileage")}
            >
              <select
                value={appliedFilters.mileage || ""}
                onChange={(e) => {
                  setCurrentPage(1); // Reset to first page when filters change
                  setAppliedFilters(prev => ({
                    ...prev,
                    mileage: e.target.value
                  }));
                }}
                className="carzino-dropdown-option w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none bg-white"
              >
                <option value="">Any Mileage</option>
                <option value="Under 15,000">Under 15,000</option>
                <option value="15,000 – 30,000">15,000 – 30,000</option>
                <option value="30,000 – 60,000">30,000 – 60,000</option>
                <option value="60,000 – 100,000">60,000 – 100,000</option>
                <option value="Over 100,000">Over 100,000</option>
              </select>
            </FilterSection>

            {/* Drive Type Filter */}
            <FilterSection
              title="Drive Type"
              isCollapsed={collapsedFilters.driveType}
              onToggle={() => toggleFilter("driveType")}
            >
              <div className="space-y-1">
                {(filterOptions.driveTypes && filterOptions.driveTypes.length > 0) ? (
                  filterOptions.driveTypes.map((driveType, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.driveType.includes(driveType.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              driveType: [...prev.driveType, driveType.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              driveType: prev.driveType.filter(item => item !== driveType.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{driveType.name}</span>
                      <span className="carzino-filter-count ml-1">({driveType.count})</span>
                    </label>
                  ))
                ) : (
                  ["AWD", "4WD", "FWD", "RWD"].map((driveType) => (
                    <label key={driveType} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.driveType.includes(driveType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              driveType: [...prev.driveType, driveType]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              driveType: prev.driveType.filter(item => item !== driveType)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{driveType}</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Transmission Speed Filter */}
            <FilterSection
              title="Transmission/Speed"
              isCollapsed={collapsedFilters.transmissionSpeed}
              onToggle={() => toggleFilter("transmissionSpeed")}
            >
              <div className="space-y-1">
                {(filterOptions.transmissions && filterOptions.transmissions.length > 0) ? (
                  filterOptions.transmissions.map((transmission, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.transmission.includes(transmission.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              transmission: [...prev.transmission, transmission.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              transmission: prev.transmission.filter(item => item !== transmission.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{transmission.name}</span>
                      <span className="carzino-filter-count ml-1">({transmission.count})</span>
                    </label>
                  ))
                ) : (
                  ["Automatic", "Manual", "CVT"].map((transmission) => (
                    <label key={transmission} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.transmission.includes(transmission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              transmission: [...prev.transmission, transmission]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              transmission: prev.transmission.filter(item => item !== transmission)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{transmission}</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Exterior Color Filter */}
            <FilterSection
              title="Exterior Color"
              isCollapsed={collapsedFilters.exteriorColor}
              onToggle={() => toggleFilter("exteriorColor")}
            >
              <div className="space-y-1">
                {(filterOptions.exteriorColors && filterOptions.exteriorColors.length > 0) ? (
                  filterOptions.exteriorColors.map((color, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.exteriorColor.includes(color.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              exteriorColor: [...prev.exteriorColor, color.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              exteriorColor: prev.exteriorColor.filter(item => item !== color.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{color.name}</span>
                      <span className="carzino-filter-count ml-1">({color.count})</span>
                    </label>
                  ))
                ) : (
                  ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Brown", "Gold", "Yellow", "Orange", "Purple"].map((color) => (
                    <label key={color} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.exteriorColor.includes(color)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              exteriorColor: [...prev.exteriorColor, color]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              exteriorColor: prev.exteriorColor.filter(item => item !== color)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{color}</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Interior Color Filter */}
            <FilterSection
              title="Interior Color"
              isCollapsed={collapsedFilters.interiorColor}
              onToggle={() => toggleFilter("interiorColor")}
            >
              <div className="space-y-1">
                {(filterOptions.interiorColors && filterOptions.interiorColors.length > 0) ? (
                  filterOptions.interiorColors.map((color, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.interiorColor.includes(color.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              interiorColor: [...prev.interiorColor, color.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              interiorColor: prev.interiorColor.filter(item => item !== color.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{color.name}</span>
                      <span className="carzino-filter-count ml-1">({color.count})</span>
                    </label>
                  ))
                ) : (
                  ["Black", "Beige", "Gray", "Brown", "Tan", "White"].map((color) => (
                    <label key={color} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.interiorColor.includes(color)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              interiorColor: [...prev.interiorColor, color]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              interiorColor: prev.interiorColor.filter(item => item !== color)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{color}</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Seller Type Filter */}
            <FilterSection
              title="Seller Type"
              isCollapsed={collapsedFilters.sellerType}
              onToggle={() => toggleFilter("sellerType")}
            >
              <div className="space-y-1">
                {(filterOptions.sellerTypes && filterOptions.sellerTypes.length > 0) ? (
                  filterOptions.sellerTypes.map((sellerType, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.sellerType.includes(sellerType.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              sellerType: [...prev.sellerType, sellerType.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              sellerType: prev.sellerType.filter(item => item !== sellerType.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{sellerType.name}</span>
                      <span className="carzino-filter-count ml-1">({sellerType.count})</span>
                    </label>
                  ))
                ) : (
                  ["Dealer", "Private Party"].map((sellerType) => (
                    <label key={sellerType} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.sellerType.includes(sellerType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              sellerType: [...prev.sellerType, sellerType]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              sellerType: prev.sellerType.filter(item => item !== sellerType)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{sellerType}</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Dealer Filter */}
            <FilterSection
              title="Dealer"
              isCollapsed={collapsedFilters.dealer}
              onToggle={() => toggleFilter("dealer")}
            >
              <div className="space-y-1">
                {(filterOptions.dealers && filterOptions.dealers.length > 0) ? (
                  filterOptions.dealers.slice(0, 10).map((dealer, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.dealer.includes(dealer.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              dealer: [...prev.dealer, dealer.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              dealer: prev.dealer.filter(item => item !== dealer.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{dealer.name}</span>
                      <span className="carzino-filter-count ml-1">({dealer.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    No dealer data available
                  </div>
                )}
              </div>
            </FilterSection>

            {/* State Filter */}
            <FilterSection
              title="State"
              isCollapsed={collapsedFilters.state}
              onToggle={() => toggleFilter("state")}
            >
              <div className="space-y-1">
                {(filterOptions.states && filterOptions.states.length > 0) ? (
                  filterOptions.states.slice(0, 10).map((state, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.state.includes(state.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              state: [...prev.state, state.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              state: prev.state.filter(item => item !== state.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{state.name}</span>
                      <span className="carzino-filter-count ml-1">({state.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    No state data available
                  </div>
                )}
              </div>
            </FilterSection>

            {/* City Filter */}
            <FilterSection
              title="City"
              isCollapsed={collapsedFilters.city}
              onToggle={() => toggleFilter("city")}
            >
              <div className="space-y-1">
                {(filterOptions.cities && filterOptions.cities.length > 0) ? (
                  filterOptions.cities.slice(0, 10).map((city, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.city.includes(city.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              city: [...prev.city, city.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              city: prev.city.filter(item => item !== city.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{city.name}</span>
                      <span className="carzino-filter-count ml-1">({city.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    No city data available
                  </div>
                )}
              </div>
            </FilterSection>

          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Mobile Header */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <Sliders className="w-4 h-4" />
                  Filter
                  {(appliedFilters.condition.length +
                    appliedFilters.make.length +
                    appliedFilters.model.length +
                    appliedFilters.trim.length +
                    appliedFilters.vehicleType.length +
                    appliedFilters.driveType.length +
                    appliedFilters.exteriorColor.length +
                    appliedFilters.interiorColor.length +
                    appliedFilters.sellerType.length +
                    appliedFilters.transmission.length +
                    appliedFilters.dealer.length +
                    appliedFilters.city.length +
                    appliedFilters.state.length +
                    (appliedFilters.mileage ? 1 : 0) +
                    (appliedFilters.priceMin || appliedFilters.priceMax ? 1 : 0) +
                    (appliedFilters.paymentMin || appliedFilters.paymentMax ? 1 : 0)) > 0 && (
                    <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {appliedFilters.condition.length +
                       appliedFilters.make.length +
                       appliedFilters.model.length +
                       appliedFilters.trim.length +
                       appliedFilters.vehicleType.length +
                       appliedFilters.driveType.length +
                       appliedFilters.exteriorColor.length +
                       appliedFilters.interiorColor.length +
                       appliedFilters.sellerType.length +
                       appliedFilters.transmission.length +
                       appliedFilters.dealer.length +
                       appliedFilters.city.length +
                       appliedFilters.state.length +
                       (appliedFilters.mileage ? 1 : 0) +
                       (appliedFilters.priceMin || appliedFilters.priceMax ? 1 : 0) +
                       (appliedFilters.paymentMin || appliedFilters.paymentMax ? 1 : 0)}
                    </span>
                  )}
                </button>

                <div className="border-l border-gray-400 h-8"></div>

                <div className="relative">
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  >
                    Sort
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-60 w-56">
                      <button
                        onClick={() => {
                          setSortBy("relevance");
                          setSortDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "relevance" ? "bg-red-50 text-red-600" : ""}`}
                      >
                        Relevance
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("price-low");
                          setSortDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "price-low" ? "bg-red-50 text-red-600" : ""}`}
                      >
                        Price: Low to High
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-l border-gray-400 h-8"></div>

                <button
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${viewMode === "favorites" ? "text-red-600" : ""}`}
                  onClick={() => setViewMode(viewMode === "favorites" ? "all" : "favorites")}
                >
                  Favorites ({favoritesCount})
                </button>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {viewMode === "favorites"
                  ? `${favoritesCount} Saved Vehicles`
                  : `${totalResults.toLocaleString()} Vehicles Found`
                }
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <div className="flex bg-white border border-gray-300 rounded-md">
                <button
                  className={`px-4 py-2 text-sm font-medium ${viewMode === "all" ? "bg-red-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => setViewMode("all")}
                >
                  All Vehicles
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${viewMode === "favorites" ? "bg-red-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => setViewMode("favorites")}
                >
                  Favorites ({favoritesCount})
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="miles-low">Miles: Low to High</option>
                <option value="year-newest">Year: Newest First</option>
              </select>
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
              <div className="text-lg">Loading vehicles...</div>
              <div className="text-sm text-gray-500 mt-2">Found {totalResults} vehicles in database</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <div className="text-red-600 mb-4">Error loading vehicles:</div>
              <div className="text-sm text-gray-600 mb-4">{error}</div>
              <button
                onClick={fetchCombinedData}
                className="bg-red-600 text-white px-4 py-2 rounded mt-4 hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : displayedVehicles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {viewMode === "favorites" ? "No favorites yet" : "No vehicles found"}
              </h3>
              <p className="text-gray-500 mb-4">
                {viewMode === "favorites" 
                  ? "Start browsing to add vehicles to your favorites!"
                  : "Try adjusting your filters to see more results."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Vehicle Grid */}
              <div className="vehicle-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {displayedVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    keeperMessage={keeperMessage}
                    termLength={termLength}
                    interestRate={interestRate}
                    downPayment={downPayment}
                  />
                ))}
              </div>

              {/* Pagination */}
              {viewMode === "all" && totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalResults={totalResults}
                    resultsPerPage={resultsPerPage}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
