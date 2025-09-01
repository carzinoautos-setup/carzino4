import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const location = useLocation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const [showMoreMakes, setShowMoreMakes] = useState(false);
  const [showMoreModels, setShowMoreModels] = useState(false);
  const [showMoreTrims, setShowMoreTrims] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("10");
  const [vehicleImages, setVehicleImages] = useState<{ [key: string]: string }>({});
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

  // Price range state
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Payment range state
  const [paymentMin, setPaymentMin] = useState("");
  const [paymentMax, setPaymentMax] = useState("");

  // Payment calculator state
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
    sellerType: [] as string[],
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

  // Refs and performance
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // API fetch function
  const fetchCombinedData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Build API URL
      const apiUrl = new URL('/api/simple-vehicles/combined', window.location.origin);
      apiUrl.searchParams.set('page', currentPage.toString());
      apiUrl.searchParams.set('pageSize', resultsPerPage.toString());

      if (sortBy !== "relevance") {
        apiUrl.searchParams.set('sortBy', sortBy);
      }

      // Add filters
      if (appliedFilters.make.length > 0) {
        apiUrl.searchParams.set('make', appliedFilters.make.join(','));
      }
      if (appliedFilters.condition.length > 0) {
        apiUrl.searchParams.set('condition', appliedFilters.condition.join(','));
      }

      const response = await fetch(apiUrl.toString());
      const data = await response.json();

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
  }, [currentPage, resultsPerPage, sortBy, appliedFilters]);

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

  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  const toggleFilter = (filterName: string) => {
    setCollapsedFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  const removeAppliedFilter = (category: string, value: string) => {
    setAppliedFilters((prev) => {
      const newFilters = {
        ...prev,
        [category]: (prev[category as keyof typeof prev] as string[]).filter(
          (item: string) => item !== value,
        ),
      };

      // Clear dependent filters when parent filter is removed
      if (category === "make") {
        newFilters.model = [];
        newFilters.trim = [];
      } else if (category === "model") {
        newFilters.trim = [];
      }

      return newFilters;
    });
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
      sellerType: [],
      priceMin: "",
      priceMax: "",
      paymentMin: "",
      paymentMax: "",
    });
    setPriceMin("10000");
    setPriceMax("100000");
  };

  // Handle make selection with cascading filter clearing
  const handleMakeChange = (makeName: string, isChecked: boolean) => {
    setAppliedFilters((prev) => {
      const newMakes = isChecked
        ? [...prev.make, makeName]
        : prev.make.filter((item) => item !== makeName);

      // Clear dependent filters (models and trims) when make changes
      return {
        ...prev,
        make: newMakes,
        model: [], // Clear all selected models when make changes
        trim: [], // Clear all selected trims when make changes
      };
    });
  };

  // Handle model selection with trim clearing
  const handleModelChange = (modelName: string, isChecked: boolean) => {
    setAppliedFilters((prev) => {
      const newModels = isChecked
        ? [...prev.model, modelName]
        : prev.model.filter((item) => item !== modelName);

      return {
        ...prev,
        model: newModels,
        trim: [], // Clear trims when model selection changes
      };
    });
  };

  // Handle trim selection (no cascading needed)
  const handleTrimChange = (trimName: string, isChecked: boolean) => {
    setAppliedFilters((prev) => ({
      ...prev,
      trim: isChecked
        ? [...prev.trim, trimName]
        : prev.trim.filter((item) => item !== trimName),
    }));
  };

  // Handle vehicle type selection
  const handleVehicleTypeToggle = (vehicleType: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      vehicleType: prev.vehicleType.includes(vehicleType)
        ? prev.vehicleType.filter((item) => item !== vehicleType)
        : [...prev.vehicleType, vehicleType],
    }));
  };

  // Get conditional models based on selected makes
  const getAvailableModels = () => {
    if (appliedFilters.make.length === 0) {
      return filterOptions.models;
    }
    return filterOptions.models; // Server handles conditional filtering
  };

  // Get conditional trims based on selected makes and models
  const getAvailableTrims = () => {
    if (appliedFilters.make.length === 0) {
      return filterOptions.trims;
    }
    return filterOptions.trims; // Server handles conditional filtering
  };

  const getAvailableBodyTypes = () => {
    if (appliedFilters.make.length === 0) {
      return filterOptions.vehicleTypes;
    }
    return filterOptions.vehicleTypes; // Server handles conditional filtering
  };

  const availableModels = getAvailableModels();
  const availableTrims = getAvailableTrims();
  const availableBodyTypes = getAvailableBodyTypes();

  const displayedMakes = showMoreMakes ? filterOptions.makes : filterOptions.makes.slice(0, 8);
  const displayedModels = showMoreModels ? availableModels : availableModels.slice(0, 8);
  const displayedTrims = showMoreTrims ? availableTrims : availableTrims.slice(0, 8);

  const ColorSwatch = ({
    color,
    name,
    count,
  }: {
    color: string;
    name: string;
    count: number;
  }) => (
    <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
      <input type="checkbox" className="mr-2" />
      <div
        className="w-4 h-4 rounded border border-gray-300 mr-2"
        style={{ backgroundColor: color }}
      ></div>
      <span className="carzino-filter-option">{name}</span>
      <span className="carzino-filter-count ml-1">({count})</span>
    </label>
  );

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

        @media (max-width: 768px) {
          :root {
            --carzino-vehicle-title: 17px;
            --carzino-price-value: 17px;
            --carzino-dealer-info: 11px;
            --carzino-filter-title: 17px;
            --carzino-filter-option: 15px;
            --carzino-filter-count: 15px;
            --carzino-search-input: 15px;
            --carzino-location-label: 15px;
            --carzino-dropdown-option: 15px;
            --carzino-vehicle-type-name: 13px;
            --carzino-vehicle-type-count: 12px;
            --carzino-show-more: 15px;
          }
        }

        @media (max-width: 640px) {
          :root {
            --carzino-featured-badge: 14px;
            --carzino-badge-label: 14px;
            --carzino-vehicle-title: 18px;
            --carzino-vehicle-details: 13px;
            --carzino-price-label: 14px;
            --carzino-price-value: 18px;
            --carzino-dealer-info: 12px;
            --carzino-image-counter: 14px;
            --carzino-filter-title: 18px;
            --carzino-filter-option: 16px;
            --carzino-filter-count: 16px;
            --carzino-search-input: 16px;
            --carzino-location-label: 16px;
            --carzino-dropdown-option: 16px;
            --carzino-vehicle-type-name: 14px;
            --carzino-vehicle-type-count: 13px;
            --carzino-show-more: 16px;
          }
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

        @media (max-width: 639px) {
          .vehicle-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          .main-container {
            padding: 0 !important;
          }
          
          .vehicle-card {
            border-radius: 8px !important;
            margin: 0 12px !important;
          }
        }
        
        @media (min-width: 640px) and (max-width: 1023px) {
          .vehicle-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .vehicle-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 24px !important;
          }
          
          .main-container {
            max-width: 1325px !important;
            margin: 0 auto !important;
          }
        }

        @media (max-width: 1023px) {
          .mobile-filter-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 35;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }
          
          .mobile-filter-overlay.open {
            opacity: 1;
            visibility: visible;
          }

          .mobile-filter-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            background: white;
            z-index: 40;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            width: 100% !important;
            max-width: 100% !important;
            overflow-y: auto !important;
            overflow-x: hidden;
            display: block !important;
            -webkit-overflow-scrolling: touch;
          }
          
          .mobile-filter-sidebar.open {
            transform: translateX(0);
          }
          
          .mobile-chevron {
            width: 22px !important;
            height: 22px !important;
          }
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        select:focus {
          outline: none;
          border-color: #dc2626;
        }

        .filter-tag {
          background-color: white;
          border: 1px solid #e5e7eb;
          color: #374151;
        }

        .filter-tag:hover .remove-x {
          color: #dc2626;
        }

        .view-switcher {
          display: inline-flex;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 2px;
        }

        .view-switcher button {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .view-switcher button.active {
          background: #dc2626;
          color: white;
        }

        .view-switcher button:not(.active) {
          background: transparent;
          color: #6b7280;
        }

        .view-switcher button:not(.active):hover {
          color: #374151;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row min-h-screen max-w-[1325px] mx-auto">
        <div
          className={`mobile-filter-overlay lg:hidden ${mobileFiltersOpen ? "open" : ""}`}
          onClick={() => setMobileFiltersOpen(false)}
        ></div>

        {/* Sidebar - Hidden on mobile by default */}
        <div
          className={`bg-white border-r border-gray-200 mobile-filter-sidebar hidden lg:block ${mobileFiltersOpen ? "open" : ""}`}
          style={{
            width: "280px",
          }}
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

          <div className="p-4">
            {/* Search Section - Mobile Only */}
            <div className="lg:hidden mb-4 pb-4 border-b border-gray-200">
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search Vehicles"
                  className="carzino-search-input w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-red-600"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Applied Filters in Mobile Filter Panel */}
              {(appliedFilters.condition.length > 0 ||
                appliedFilters.make.length > 0 ||
                appliedFilters.model.length > 0 ||
                appliedFilters.trim.length > 0 ||
                appliedFilters.driveType.length > 0 ||
                appliedFilters.vehicleType.length > 0 ||
                appliedFilters.mileage ||
                appliedFilters.exteriorColor.length > 0 ||
                appliedFilters.sellerType.length > 0 ||
                appliedFilters.priceMin ||
                appliedFilters.priceMax ||
                appliedFilters.paymentMin ||
                appliedFilters.paymentMax) && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs"
                  >
                    Clear All
                  </button>
                  {appliedFilters.condition.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("condition", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.make.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("make", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.model.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("model", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Search Section */}
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

            {/* Desktop Applied Filters */}
            {(appliedFilters.condition.length > 0 ||
              appliedFilters.make.length > 0 ||
              appliedFilters.model.length > 0 ||
              appliedFilters.trim.length > 0 ||
              appliedFilters.driveType.length > 0 ||
              appliedFilters.vehicleType.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.exteriorColor.length > 0 ||
              appliedFilters.sellerType.length > 0 ||
              appliedFilters.priceMin ||
              appliedFilters.priceMax ||
              appliedFilters.paymentMin ||
              appliedFilters.paymentMax) && (
              <div className="hidden lg:block mb-4 pb-4 border-b border-gray-200">
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
                </div>
              </div>
            )}

            {/* Distance */}
            <div className="mb-4 pb-4 border border-gray-200 rounded-lg p-3">
              <label className="carzino-location-label block mb-2">
                Distance
              </label>
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

            {/* Condition Filter */}
            <FilterSection
              title="Condition"
              isCollapsed={collapsedFilters.condition}
              onToggle={() => toggleFilter("condition")}
            >
              <div className="space-y-1">
                {filterOptions.conditions.length > 0 ? filterOptions.conditions.map((condition) => (
                  <label key={condition.name} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.condition.includes(condition.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAppliedFilters(prev => ({
                            ...prev,
                            condition: [...prev.condition, condition.name]
                          }));
                        } else {
                          removeAppliedFilter("condition", condition.name);
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{condition.name}</span>
                    <span className="carzino-filter-count ml-1">({condition.count})</span>
                  </label>
                )) : (
                  ["New", "Used", "Certified"].map((condition) => (
                    <label key={condition} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
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
                      />
                      <span className="carzino-filter-option">{condition}</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Make Filter */}
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
                    <span className="carzino-filter-count ml-1">
                      ({make.count})
                    </span>
                  </label>
                ))}
                {filterOptions.makes.length > 8 && (
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
                  <>
                    {displayedModels.map((model, index) => (
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
                        <span className="carzino-filter-option">
                          {model.name}
                        </span>
                        <span className="carzino-filter-count ml-1">
                          ({model.count})
                        </span>
                      </label>
                    ))}
                    {availableModels.length > 8 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowMoreModels(!showMoreModels);
                        }}
                        className="carzino-show-more text-red-600 hover:text-red-700 mt-1"
                      >
                        {showMoreModels ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </FilterSection>

            {/* Trim Filter */}
            <FilterSection
              title={`Trim ${appliedFilters.make.length > 0 ? `(${appliedFilters.make.join(", ")})` : ""}`}
              isCollapsed={collapsedFilters.trim}
              onToggle={() => toggleFilter("trim")}
            >
              <div className="space-y-1">
                {appliedFilters.make.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Select a make first to see available trims
                  </div>
                ) : displayedTrims.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    No trims available for selected make(s)
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
                      <span className="carzino-filter-count ml-1">
                        ({trim.count})
                      </span>
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="$10,000"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="text"
                    placeholder="$100,000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <button
                  onClick={() => {
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

            {/* Payment Filter */}
            <FilterSection
              title="Filter by Payment"
              isCollapsed={collapsedFilters.payment}
              onToggle={() => toggleFilter("payment")}
            >
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="$100"
                    value={paymentMin}
                    onChange={(e) => setPaymentMin(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="text"
                    placeholder="$2,000"
                    value={paymentMax}
                    onChange={(e) => setPaymentMax(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <button
                  onClick={() => {
                    setAppliedFilters(prev => ({
                      ...prev,
                      paymentMin: paymentMin,
                      paymentMax: paymentMax
                    }));
                  }}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                >
                  Apply Payment Filter
                </button>
              </div>
            </FilterSection>

            {/* Mileage Filter */}
            <FilterSection
              title="Mileage"
              isCollapsed={collapsedFilters.mileage}
              onToggle={() => toggleFilter("mileage")}
            >
              <div className="space-y-1">
                {[
                  { label: "Under 5,000 mi", value: "5000" },
                  { label: "Under 10,000 mi", value: "10000" },
                  { label: "Under 25,000 mi", value: "25000" },
                  { label: "Under 50,000 mi", value: "50000" },
                  { label: "Under 75,000 mi", value: "75000" },
                  { label: "Under 100,000 mi", value: "100000" },
                  { label: "100k+ mi", value: "100001" },
                ].map((mileage) => (
                  <label key={mileage.value} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="mileage"
                      value={mileage.value}
                      checked={appliedFilters.mileage === mileage.value}
                      onChange={(e) => {
                        setAppliedFilters(prev => ({
                          ...prev,
                          mileage: e.target.value
                        }));
                      }}
                      className="mr-2"
                    />
                    <span className="carzino-filter-option">{mileage.label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Vehicle Type Filter */}
            <FilterSection
              title="Vehicle Type"
              isCollapsed={collapsedFilters.vehicleType}
              onToggle={() => toggleFilter("vehicleType")}
            >
              <div className="space-y-1">
                {availableBodyTypes.length > 0 ? availableBodyTypes.map((bodyType) => (
                  <label key={bodyType.name} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.vehicleType.includes(bodyType.name)}
                      onChange={(e) => handleVehicleTypeToggle(bodyType.name)}
                    />
                    <span className="carzino-filter-option">{bodyType.name}</span>
                    <span className="carzino-filter-count ml-1">({bodyType.count})</span>
                  </label>
                )) : (
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

            {/* Drive Type Filter */}
            <FilterSection
              title="Drive Type"
              isCollapsed={collapsedFilters.driveType}
              onToggle={() => toggleFilter("driveType")}
            >
              <div className="space-y-1">
                {filterOptions.driveTypes.length > 0 ? filterOptions.driveTypes.map((driveType) => (
                  <label key={driveType.name} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
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
                          removeAppliedFilter("driveType", driveType.name);
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{driveType.name}</span>
                    <span className="carzino-filter-count ml-1">({driveType.count})</span>
                  </label>
                )) : (
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
                            removeAppliedFilter("driveType", driveType);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{driveType}</span>
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
                {[
                  { name: "White", color: "#FFFFFF", count: 9427 },
                  { name: "Black", color: "#000000", count: 8363 },
                  { name: "Gray", color: "#808080", count: 7502 },
                  { name: "Silver", color: "#C0C0C0", count: 5093 },
                  { name: "Blue", color: "#0066CC", count: 4266 },
                  { name: "Red", color: "#CC0000", count: 3436 },
                ].map((color) => (
                  <ColorSwatch
                    key={color.name}
                    color={color.color}
                    name={color.name}
                    count={color.count}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Seller Type Filter */}
            <FilterSection
              title="Seller Type"
              isCollapsed={collapsedFilters.sellerType}
              onToggle={() => toggleFilter("sellerType")}
            >
              <div className="space-y-1">
                {filterOptions.sellerTypes.length > 0 ? filterOptions.sellerTypes.map((sellerType) => (
                  <label key={sellerType.name} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
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
                          removeAppliedFilter("sellerType", sellerType.name);
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{sellerType.name}</span>
                    <span className="carzino-filter-count ml-1">({sellerType.count})</span>
                  </label>
                )) : (
                  ["Dealer", "Private Seller"].map((sellerType) => (
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
                            removeAppliedFilter("sellerType", sellerType);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{sellerType}</span>
                    </label>
                  ))
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
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 4h12M2 8h8M2 12h4" />
                    </svg>
                    Sort
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] w-56">
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
                      <button
                        onClick={() => {
                          setSortBy("price-high");
                          setSortDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "price-high" ? "bg-red-50 text-red-600" : ""}`}
                      >
                        Price: High to Low
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-l border-gray-400 h-8"></div>

                <button
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${viewMode === "favorites" ? "text-red-600" : ""}`}
                  onClick={() => setViewMode(viewMode === "favorites" ? "all" : "favorites")}
                >
                  Favorites
                  <div className="relative">
                    <div className={`w-12 h-6 rounded-full ${viewMode === "favorites" ? "bg-red-600" : "bg-gray-300"} transition-colors`}>
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                          viewMode === "favorites" ? "translate-x-6" : "translate-x-0.5"
                        } ${
                          viewMode === "favorites" ? "bg-white" : favoritesCount > 0 ? "bg-red-600 md:bg-white" : "bg-white"
                        }`}
                      />
                    </div>
                  </div>
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
              <div className="view-switcher">
                <button
                  className={viewMode === "all" ? "active" : ""}
                  onClick={() => setViewMode("all")}
                >
                  <Gauge className="w-4 h-4" />
                  All Vehicles
                </button>
                <button
                  className={viewMode === "favorites" ? "active" : ""}
                  onClick={() => setViewMode("favorites")}
                >
                  <Heart className="w-4 h-4" />
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
              {viewMode === "favorites" && (
                <button
                  onClick={() => setViewMode("all")}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Browse All Vehicles
                </button>
              )}
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
