'use client'

import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Import your ACTUAL components
import { VehicleCard } from "../client/components/VehicleCard";
import { FilterSection } from "../client/components/FilterSection";
import { VehicleTypeCard } from "../client/components/VehicleTypeCard";
import { Pagination } from "../client/components/Pagination";

interface Vehicle {
  id: number;
  featured: boolean;
  viewed: boolean;
  images: string[];
  badges: string[];
  title: string;

  // Core ACF vehicle fields
  year: string;
  make?: string;
  model?: string;
  trim?: string;
  mileage: string;
  condition: string;
  price?: number;
  vin: string;

  // Technical specs
  transmission: string;
  drivetrain: string;
  fuel_type: string;
  body_style: string;
  exterior_color: string;
  interior_color: string;

  // Legacy/display fields
  doors: string;
  doorIcon?: string;
  mileageIcon?: string;
  transmissionIcon?: string;
  salePrice: string | null;
  payment: string | null;

  // Dealer information (using ACF field names)
  dealer: string; // Display name (account_name_seller or business_name_seller)
  seller_account_number: string; // For filtering logic
  account_name_seller?: string;
  business_name_seller?: string;
  location: string; // Formatted location string
  city_seller?: string;
  state_seller?: string;
  zip_seller?: string;
  phone: string;
  seller_type: string;

  // Location data for radius filtering
  car_location_latitude?: number;
  car_location_longitude?: number;
}

export default function HomePage() {
  console.log("🚀 MySQL Vehicles - Loading with original design");

  // Core state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(47);
  const [totalResults, setTotalResults] = useState(8527);
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
  const [apiTestResult, setApiTestResult] = useState<any>(null);

  // Price and payment state
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [paymentMin, setPaymentMin] = useState("");
  const [paymentMax, setPaymentMax] = useState("");
  const [termLength, setTermLength] = useState("72");
  const [interestRate, setInterestRate] = useState("8");
  const [downPayment, setDownPayment] = useState("2000");

  // Applied filters state - includes all ACF fields
  const [appliedFilters, setAppliedFilters] = useState({
    // Core vehicle filters
    condition: [] as string[],
    make: [] as string[],
    model: [] as string[],
    trim: [] as string[],
    year: [] as string[],

    // Technical specs
    vehicleType: [] as string[], // maps to body_style
    driveType: [] as string[],   // maps to drivetrain
    transmission: [] as string[],
    fuel_type: [] as string[],

    // Colors
    exteriorColor: [] as string[],
    interiorColor: [] as string[],

    // Dealer/location
    sellerType: [] as string[],
    dealer: [] as string[],      // maps to account_number_seller
    city: [] as string[],        // maps to city_seller
    state: [] as string[],       // maps to state_seller

    // Ranges
    mileage: "",
    priceMin: "",
    priceMax: "",
    yearMin: "",
    yearMax: "",
    paymentMin: "",
    paymentMax: "",
  });

  const [collapsedFilters, setCollapsedFilters] = useState({
    vehicleType: true,
    condition: false,
    mileage: false,
    make: false,
    model: true,
    trim: true,
    year: false,
    price: false,
    payment: false,
    driveType: false,
    transmissionSpeed: true,
    fuelType: true,
    exteriorColor: true,
    interiorColor: true,
    sellerType: true,
    dealer: false,
    state: true,
    city: true,
  });

  // API State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Refs
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Direct WordPress API test function
  const testWordPressAPI = async () => {
    console.log("🧪 Testing WordPress API directly...");

    try {
      // Test 1: Get all filters (no conditions)
      const allFiltersResponse = await fetch('/api/wp/filters');
      const allFiltersData = await allFiltersResponse.json();

      // Test 2: Get filters with Toyota selected
      const toyotaFiltersResponse = await fetch('/api/wp/filters?make=Toyota');
      const toyotaFiltersData = await toyotaFiltersResponse.json();

      const testResults = {
        allFilters: {
          success: allFiltersData.success,
          totalMakes: allFiltersData.filters?.make?.length || 0,
          totalModels: allFiltersData.filters?.model?.length || 0,
          sampleModels: allFiltersData.filters?.model?.slice(0, 5) || []
        },
        toyotaFilters: {
          success: toyotaFiltersData.success,
          appliedFilters: toyotaFiltersData.applied_filters,
          totalModels: toyotaFiltersData.filters?.model?.length || 0,
          models: toyotaFiltersData.filters?.model || [],
          hasFordModels: toyotaFiltersData.filters?.model?.some((m: any) =>
            m.name.toLowerCase().includes('f-150') ||
            m.name.toLowerCase().includes('explorer') ||
            m.name.toLowerCase().includes('mustang')
          ) || false,
          hasChevyModels: toyotaFiltersData.filters?.model?.some((m: any) =>
            m.name.toLowerCase().includes('silverado') ||
            m.name.toLowerCase().includes('tahoe') ||
            m.name.toLowerCase().includes('malibu')
          ) || false
        }
      };

      console.log("🧪 WordPress API Test Results:", testResults);
      setApiTestResult(testResults);

      if (testResults.toyotaFilters.hasFordModels || testResults.toyotaFilters.hasChevyModels) {
        console.error("🚨 CONDITIONAL FILTERING IS BROKEN!");
        console.error("Toyota filter still showing Ford/Chevy models");
      } else {
        console.log("✅ Conditional filtering appears to be working correctly");
      }

    } catch (error) {
      console.error("❌ WordPress API test failed:", error);
      setApiTestResult({ error: error.message });
    }
  };

  // Clear WordPress cache
  const clearWordPressCache = async () => {
    console.log("🗑️ Clearing WordPress cache...");

    try {
      // Method 1: Use the via_build_filters=1 parameter
      const cacheResponse = await fetch('/api/wp/rebuild-filters');
      console.log("✅ Cache clear response:", cacheResponse.status);

      // Method 2: Also try the API endpoint if it exists
      const apiCacheResponse = await fetch('/api/wp/rebuild-filters');
      const apiCacheData = await apiCacheResponse.json();
      console.log("✅ API cache clear response:", apiCacheData);

      // Refresh our data after cache clear
      setTimeout(() => {
        fetchCombinedData();
      }, 1000);

    } catch (error) {
      console.error("❌ Cache clear failed:", error);
    }
  };

  // Debug WordPress filtering directly
  const debugWordPressFiltering = async () => {
    console.log("🔬 Debug WordPress filtering...");

    try {
      const debugResponse = await fetch('/api/wp/debug-filters?make=Ford');
      const debugData = await debugResponse.json();

      console.log("🔬 WordPress Debug Results:", debugData);
      setApiTestResult({
        ...apiTestResult,
        debug: debugData.debug,
        debugComplete: true
      });

    } catch (error) {
      console.error("❌ WordPress debug failed:", error);
      setApiTestResult({
        ...apiTestResult,
        debugError: error.message
      });
    }
  };

  // Test the new WordPress conditional filtering directly
  const testBackendAPI = async () => {
    console.log("🧪 Testing WordPress v5.0 conditional filtering...");

    try {
      const testResponse = await fetch('/api/test-conditional-filters');
      const testData = await testResponse.json();

      console.log("🧪 WordPress v5.0 Conditional Filtering Results:", testData);

      setApiTestResult({
        ...apiTestResult,
        backendTests: testData.tests,
        backendTestComplete: true,
        conditionalWorking: testData.conditionalFilteringWorking,
        summary: testData.summary
      });

    } catch (error) {
      console.error("❌ WordPress v5.0 conditional test failed:", error);
      setApiTestResult({
        ...apiTestResult,
        backendTestError: error.message
      });
    }
  };

  // API fetch function - Using working combined endpoint that includes WordPress conditional filtering
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
        apiUrl.searchParams.set('sort', sortBy);
      }

      // Add ALL ACF filters to API call (using correct WordPress field names)
      if (appliedFilters.make.length > 0) {
        apiUrl.searchParams.set('make', appliedFilters.make.join(','));
      }
      if (appliedFilters.model.length > 0) {
        apiUrl.searchParams.set('model', appliedFilters.model.join(','));
      }
      if (appliedFilters.trim.length > 0) {
        apiUrl.searchParams.set('trim', appliedFilters.trim.join(','));
      }
      if (appliedFilters.year.length > 0) {
        apiUrl.searchParams.set('year', appliedFilters.year.join(','));
      }
      if (appliedFilters.condition.length > 0) {
        apiUrl.searchParams.set('condition', appliedFilters.condition.join(','));
      }

      // Technical specs (map to correct ACF field names)
      if (appliedFilters.vehicleType.length > 0) {
        apiUrl.searchParams.set('body_style', appliedFilters.vehicleType.join(','));
      }
      if (appliedFilters.driveType.length > 0) {
        apiUrl.searchParams.set('drivetrain', appliedFilters.driveType.join(','));
      }
      if (appliedFilters.transmission.length > 0) {
        apiUrl.searchParams.set('transmission', appliedFilters.transmission.join(','));
      }
      if (appliedFilters.fuel_type.length > 0) {
        apiUrl.searchParams.set('fuel_type', appliedFilters.fuel_type.join(','));
      }

      // Colors
      if (appliedFilters.exteriorColor.length > 0) {
        apiUrl.searchParams.set('exterior_color', appliedFilters.exteriorColor.join(','));
      }
      if (appliedFilters.interiorColor.length > 0) {
        apiUrl.searchParams.set('interior_color', appliedFilters.interiorColor.join(','));
      }

      // Dealer/location (map to correct ACF field names)
      if (appliedFilters.sellerType.length > 0) {
        apiUrl.searchParams.set('seller_type', appliedFilters.sellerType.join(','));
      }
      if (appliedFilters.dealer.length > 0) {
        apiUrl.searchParams.set('account_number_seller', appliedFilters.dealer.join(','));
      }
      if (appliedFilters.city.length > 0) {
        apiUrl.searchParams.set('city_seller', appliedFilters.city.join(','));
      }
      if (appliedFilters.state.length > 0) {
        apiUrl.searchParams.set('state_seller', appliedFilters.state.join(','));
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
        apiUrl.searchParams.set('min_price', appliedFilters.priceMin);
      }
      if (appliedFilters.priceMax) {
        apiUrl.searchParams.set('max_price', appliedFilters.priceMax);
      }
      if (appliedFilters.yearMin) {
        apiUrl.searchParams.set('min_year', appliedFilters.yearMin);
      }
      if (appliedFilters.yearMax) {
        apiUrl.searchParams.set('max_year', appliedFilters.yearMax);
      }
      if (appliedFilters.paymentMin) {
        apiUrl.searchParams.set('paymentMin', appliedFilters.paymentMin);
      }
      if (appliedFilters.paymentMax) {
        apiUrl.searchParams.set('paymentMax', appliedFilters.paymentMax);
      }
      if (termLength && termLength !== "72") {
        apiUrl.searchParams.set('termLength', termLength);
      }
      if (interestRate && interestRate !== "8") {
        apiUrl.searchParams.set('interestRate', interestRate);
      }
      if (downPayment && downPayment !== "2000") {
        apiUrl.searchParams.set('downPayment', downPayment);
      }
      if (zipCode) {
        apiUrl.searchParams.set('zipCode', zipCode);
      }
      if (radius !== "10") {
        apiUrl.searchParams.set('radius', radius);
      }

      console.log("🔗 API URL:", apiUrl.toString());
      console.log("🔍 DEBUG: Applied filters being sent:", appliedFilters);

      const response = await fetch(apiUrl.toString());
      const data = await response.json();

      console.log("✅ API Response:", { success: data.success, vehiclesCount: data.data?.vehicles?.length });

      if (data.success) {
        setVehicles(data.data || []);
        setApiResponse({
          data: data.data,
          meta: data.pagination,
          success: true
        });
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalResults(data.pagination?.total || 0);

        const filters = data.filters || {
          makes: [], models: [], trims: [], years: [], conditions: [],
          vehicleTypes: [], driveTypes: [], transmissions: [], fuelTypes: [],
          exteriorColors: [], interiorColors: [], sellerTypes: [],
          dealers: [], states: [], cities: [], totalVehicles: 0
        };

        console.log("🔍 DEBUG: Filter options received:", {
          makes: filters.makes?.length || 0,
          models: filters.models?.length || 0,
          years: filters.years?.length || 0,
          conditions: filters.conditions?.length || 0,
          dealers: filters.dealers?.length || 0,
          sampleMakes: filters.makes?.slice(0, 3),
          sampleModels: filters.models?.slice(0, 5),
          appliedFilters: data.applied_filters,
          currentAppliedFilters: appliedFilters
        });

        console.log("🚨 CRITICAL DEBUG: Conditional filtering check:", {
          frontendSelectedMakes: appliedFilters.make,
          vehicleData: {
            count: data.data?.length || 0,
            totalResults: data.pagination?.total || 0
          },
          filterOptionsAlreadySet: 'WordPress filters already processed above'
        });
      } else {
        setError(data.message || 'Failed to load vehicles');
        console.error('❌ Vehicle data fetch failed:', data);
      }
    } catch (err) {
      console.error("❌ API Error:", err);
      setError('Failed to fetch vehicles');

      // Clear filter options on error
      setFilterOptions({
        makes: [], models: [], trims: [], years: [], conditions: [],
        vehicleTypes: [], driveTypes: [], transmissions: [], fuelTypes: [],
        exteriorColors: [], interiorColors: [], sellerTypes: [],
        dealers: [], states: [], cities: [], totalVehicles: 0
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, resultsPerPage, sortBy, appliedFilters, zipCode, radius, termLength, interestRate, downPayment]);

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
    let vehiclesToDisplay;
    if (viewMode === "favorites") {
      vehiclesToDisplay = Object.values(favorites);
    } else {
      vehiclesToDisplay = vehicles;
    }

    // Sort vehicles to put those without prices at the end
    return vehiclesToDisplay.sort((a, b) => {
      const hasAPrice = a.salePrice && a.salePrice !== "Call for Price" && a.salePrice !== "No Sale Price Listed";
      const hasBPrice = b.salePrice && b.salePrice !== "Call for Price" && b.salePrice !== "No Sale Price Listed";

      if (hasAPrice === hasBPrice) {
        return 0;
      }

      if (hasAPrice && !hasBPrice) {
        return -1;
      }

      return 1;
    });
  };

  const clearAllFilters = () => {
    // First, reset all applied filters to empty state
    const emptyFilters = {
      // Core vehicle filters
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],

      // Technical specs
      vehicleType: [],
      driveType: [],
      transmission: [],
      fuel_type: [],

      // Colors
      exteriorColor: [],
      interiorColor: [],

      // Dealer/location
      sellerType: [],
      dealer: [],
      city: [],
      state: [],

      // Ranges
      mileage: "",
      priceMin: "",
      priceMax: "",
      yearMin: "",
      yearMax: "",
      paymentMin: "",
      paymentMax: "",
    };

    setAppliedFilters(emptyFilters);
    setPriceMin("");
    setPriceMax("");
    setYearMin("");
    setYearMax("");
    setPaymentMin("");
    setPaymentMax("");
    setTermLength("72");
    setInterestRate("8");
    setDownPayment("2000");
    setZipCode("");
    setRadius("10");
    setCurrentPage(1);

    // Force refresh filter options with no filters applied
    // This ensures we get all available options back
    setTimeout(() => {
      fetchCombinedData();
    }, 100);
  };

  const removeAppliedFilter = (category: string, value: string) => {
    setCurrentPage(1);
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

  // Vehicle data with your exact structure
  const bodyTypes = [
    { name: "Convertible", count: 196 },
    { name: "Coupe", count: 419 },
    { name: "Hatchback", count: 346 },
    { name: "Sedan", count: 1698 },
    { name: "SUV / Crossover", count: 3405 },
    { name: "Truck", count: 2217 },
    { name: "Van / Minivan", count: 203 },
    { name: "Wagon", count: 43 },
  ];

  // Filter options with counts - includes all ACF fields
  const [filterOptions, setFilterOptions] = useState<{
    makes: { name: string; count: number }[];
    models: { name: string; count: number }[];
    trims: { name: string; count: number }[];
    years: { name: string; count: number }[];
    conditions: { name: string; count: number }[];
    vehicleTypes: { name: string; count: number }[]; // body_style
    driveTypes: { name: string; count: number }[];   // drivetrain
    transmissions: { name: string; count: number }[];
    fuelTypes: { name: string; count: number }[];    // fuel_type
    exteriorColors: { name: string; count: number }[];
    interiorColors: { name: string; count: number }[];
    sellerTypes: { name: string; count: number }[];
    dealers: { name: string; count: number }[];      // account_name_seller display
    states: { name: string; count: number }[];       // state_seller
    cities: { name: string; count: number }[];       // city_seller
    totalVehicles: number;
  }>({
    makes: [], models: [], trims: [], years: [], conditions: [],
    vehicleTypes: [], driveTypes: [], transmissions: [], fuelTypes: [],
    exteriorColors: [], interiorColors: [], sellerTypes: [],
    dealers: [], states: [], cities: [], totalVehicles: 0
  });

  const allMakes = filterOptions.makes || [];
  const displayedMakes = showMoreMakes ? allMakes : allMakes.slice(0, 8);

  // CRITICAL FIX: Always use the API response for models and trims
  // The API already handles conditional filtering, so we just display what it returns
  const availableModels = filterOptions.models || [];
  const availableTrims = filterOptions.trims || [];
  const availableYears = filterOptions.years || [];
  const availableConditions = filterOptions.conditions || [];
  const availableFuelTypes = filterOptions.fuelTypes || [];
  const availableDriveTypes = filterOptions.driveTypes || [];
  const availableTransmissions = filterOptions.transmissions || [];
  const availableExteriorColors = filterOptions.exteriorColors || [];
  const availableInteriorColors = filterOptions.interiorColors || [];
  const availableDealers = filterOptions.dealers || [];
  const availableStates = filterOptions.states || [];
  const availableCities = filterOptions.cities || [];

  console.log("🔍 DEBUG: Filter options from API:", {
    selectedMakes: appliedFilters.make,
    apiModelsCount: availableModels.length,
    apiTrimsCount: availableTrims.length,
    apiYearsCount: availableYears.length,
    sampleApiModels: availableModels.slice(0, 5).map(m => m.name),
    filterOptionsTimestamp: Date.now()
  });
  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  const handleVehicleTypeToggle = (vehicleType: string) => {
    setCurrentPage(1);
    setAppliedFilters((prev) => ({
      ...prev,
      vehicleType: prev.vehicleType.includes(vehicleType)
        ? prev.vehicleType.filter((item) => item !== vehicleType)
        : [...prev.vehicleType, vehicleType],
    }));
  };

  const getSortDisplayLabel = (sortValue: string) => {
    const sortOptions = {
      "relevance": "Relevance",
      "price_asc": "Price: Low to High",
      "price_desc": "Price: High to Low",
      "mileage_asc": "Mileage: Low to High",
      "mileage_desc": "Mileage: High to Low",
      "year_asc": "Year: Oldest to Newest",
      "year_desc": "Year: Newest to Oldest"
    };
    return sortOptions[sortValue as keyof typeof sortOptions] || sortValue;
  };

  return (
    <div
      className="min-h-screen bg-white main-container"
      style={{ fontFamily: "Albert Sans, sans-serif" }}
    >
      {/* Your Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Carzino Autos</h1>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700">
                <Search className="w-4 h-4" />
                Vehicle Search
              </a>
              <a href="/icon-demo" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                Icon Demo
              </a>
            </nav>
            <div className="text-sm text-gray-500">
              Your Original Design!
            </div>
          </div>
        </div>
      </header>

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
      `}</style>

      <div className="flex flex-col lg:flex-row min-h-screen max-w-[1325px] mx-auto">
        {/* Mobile Filter Overlay */}
        <div
          className={`mobile-filter-overlay lg:hidden ${mobileFiltersOpen ? "open" : ""}`}
          onClick={() => setMobileFiltersOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`bg-white border-r border-gray-200 mobile-filter-sidebar hidden lg:block ${mobileFiltersOpen ? "open" : ""}`}
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

          <div className="p-4 h-full overflow-y-auto pb-24">
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

            {/* Debug Status - Remove in production */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-xs font-semibold text-yellow-800 mb-2">🔧 WordPress Plugin v5.0 - Conditional Filtering Test</div>
              <div className="text-xs text-yellow-700 mb-2">
                <strong>Expected behavior:</strong> WordPress /filters endpoint should return narrowed results.
                Toyota filter = only Toyota models. Toyota + Ford = only Toyota & Ford models.
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={testWordPressAPI}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
                >
                  Test WP API
                </button>
                <button
                  onClick={clearWordPressCache}
                  className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700"
                >
                  Clear Cache
                </button>
                <button
                  onClick={debugWordPressFiltering}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                >
                  Debug SQL
                </button>
                <button
                  onClick={testBackendAPI}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                >
                  Test Conditional
                </button>
              </div>
              {apiTestResult && (
                <div className="text-xs text-yellow-700 mt-2 p-2 bg-white border rounded">
                  {apiTestResult.backendTests && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <div className="font-semibold text-green-800 mb-2">🧪 WordPress v5.0 Conditional Filtering:</div>
                      {apiTestResult.summary && (
                        <div className="mb-2 p-1 bg-white border rounded">
                          <div className="font-semibold">Test Summary:</div>
                          <div>Total: {apiTestResult.summary.totalTests} | Pass: {apiTestResult.summary.passed} | Fail: {apiTestResult.summary.failed}</div>
                          <div className={apiTestResult.conditionalWorking ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                            {apiTestResult.conditionalWorking ? "✅ CONDITIONAL FILTERING WORKING" : "❌ CONDITIONAL FILTERING BROKEN"}
                          </div>
                        </div>
                      )}
                      {apiTestResult.backendTests.map((test: any, index: number) => (
                        <div key={index} className="mt-1 p-1 bg-white border rounded">
                          <div className="font-semibold">{test.name}:</div>
                          <div>Makes: {test.makeCount || 'N/A'} | Models: {test.modelCount || 'N/A'}</div>
                          <div className={test.status === 'pass' ? "text-green-600" : test.status === 'fail' ? "text-red-600" : "text-blue-600"}>
                            Status: {test.status.toUpperCase()}
                          </div>
                          {test.name === 'Toyota Only' && (
                            <div>
                              {test.hasFordModels && <div className="text-red-600">- ❌ Still shows Ford models</div>}
                              {test.hasChevyModels && <div className="text-red-600">- ❌ Still shows Chevy models</div>}
                              {!test.hasFordModels && !test.hasChevyModels && <div className="text-green-600">- ✅ Only Toyota models shown</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {apiTestResult.backendTestError && (
                    <div className="text-red-600 font-semibold">❌ WordPress Test Error: {apiTestResult.backendTestError}</div>
                  )}
                  {apiTestResult.error && (
                    <div className="text-red-600 font-semibold">❌ API Error: {apiTestResult.error}</div>
                  )}
                  {apiTestResult.debug && (
                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                      <div className="font-semibold text-purple-800">🔬 WordPress SQL Debug:</div>
                      <div>All vehicles: {apiTestResult.debug.all_vehicles_count}</div>
                      <div>Ford vehicles: {apiTestResult.debug.filtered_vehicles_count}</div>
                      <div>All models: {apiTestResult.debug.all_models_count}</div>
                      <div>Ford models: {apiTestResult.debug.filtered_models_count}</div>
                      <div className={apiTestResult.debug.filtered_models_count > 0 && apiTestResult.debug.filtered_vehicles_count > 0 ? "text-green-600" : "text-red-600"}>
                        {apiTestResult.debug.filtered_models_count > 0 ? "✅ SQL filtering working" : "❌ SQL filtering broken"}
                      </div>
                    </div>
                  )}
                  {apiTestResult.debugError && (
                    <div className="text-red-600 font-semibold">❌ Debug Error: {apiTestResult.debugError}</div>
                  )}
                </div>
              )}
            </div>

            {(appliedFilters.make.length > 0) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs font-semibold text-blue-800 mb-1">🔍 Conditional Filtering Debug</div>
                <div className="text-xs text-blue-700">
                  Selected: {appliedFilters.make.join(', ')}<br/>
                  Models shown: {filterOptions.models?.length || 0}<br/>
                  Expected: Only {appliedFilters.make.join(' & ')} models
                </div>
                {filterOptions.models && filterOptions.models.length > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Sample models: {filterOptions.models.slice(0, 3).map(m => m.name).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Applied Filters */}
            {(appliedFilters.condition.length > 0 ||
              appliedFilters.make.length > 0 ||
              appliedFilters.model.length > 0 ||
              appliedFilters.trim.length > 0 ||
              appliedFilters.year.length > 0 ||
              appliedFilters.vehicleType.length > 0 ||
              appliedFilters.driveType.length > 0 ||
              appliedFilters.transmission.length > 0 ||
              appliedFilters.fuel_type.length > 0 ||
              appliedFilters.exteriorColor.length > 0 ||
              appliedFilters.interiorColor.length > 0 ||
              appliedFilters.sellerType.length > 0 ||
              appliedFilters.dealer.length > 0 ||
              appliedFilters.city.length > 0 ||
              appliedFilters.state.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.priceMin ||
              appliedFilters.priceMax ||
              appliedFilters.yearMin ||
              appliedFilters.yearMax ||
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
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("condition", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.make.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("make", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.model.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("model", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.trim.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("trim", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.year.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("year", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.vehicleType.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("vehicleType", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.driveType.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("driveType", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.transmission.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("transmission", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.fuel_type.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("fuel_type", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.exteriorColor.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("exteriorColor", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.interiorColor.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("interiorColor", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.sellerType.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("sellerType", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.dealer.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("dealer", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.city.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("city", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.state.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button onClick={() => removeAppliedFilter("state", item)} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  ))}
                  {appliedFilters.mileage && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {appliedFilters.mileage}
                      <button onClick={() => setAppliedFilters(prev => ({ ...prev, mileage: "" }))} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  )}
                  {(appliedFilters.priceMin || appliedFilters.priceMax) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      Price: ${appliedFilters.priceMin || "0"} - ${appliedFilters.priceMax || "Any"}
                      <button onClick={() => { setAppliedFilters(prev => ({ ...prev, priceMin: "", priceMax: "" })); setPriceMin(""); setPriceMax(""); }} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  )}
                  {(appliedFilters.yearMin || appliedFilters.yearMax) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      Year: {appliedFilters.yearMin || "Any"} - {appliedFilters.yearMax || "Any"}
                      <button onClick={() => { setAppliedFilters(prev => ({ ...prev, yearMin: "", yearMax: "" })); setYearMin(""); setYearMax(""); }} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  )}
                  {(appliedFilters.paymentMin || appliedFilters.paymentMax) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      Payment: ${appliedFilters.paymentMin || "0"} - ${appliedFilters.paymentMax || "Any"}/mo
                      <button onClick={() => { setAppliedFilters(prev => ({ ...prev, paymentMin: "", paymentMax: "" })); setPaymentMin(""); setPaymentMax(""); }} className="ml-1 text-white hover:text-gray-300">×</button>
                    </span>
                  )}
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

            {/* Vehicle Type Filter */}
            <FilterSection
              title="Search by Vehicle Type"
              isCollapsed={collapsedFilters.vehicleType}
              onToggle={() => toggleFilter("vehicleType")}
            >
              <div className="grid grid-cols-2 gap-2">
                {bodyTypes.map((type, index) => (
                  <VehicleTypeCard
                    key={index}
                    type={type.name}
                    count={type.count}
                    vehicleImages={vehicleImages}
                    isSelected={appliedFilters.vehicleType.includes(type.name)}
                    onToggle={handleVehicleTypeToggle}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Condition Filter */}
            <FilterSection
              title="Condition"
              isCollapsed={collapsedFilters.condition}
              onToggle={() => toggleFilter("condition")}
            >
              <div className="space-y-1">
                {availableConditions.length > 0 ? (
                  availableConditions.map((condition, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
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
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    {appliedFilters.make.length > 0 ? "No conditions available for selected vehicles" : "Select filters to see condition options"}
                  </div>
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
                        setCurrentPage(1); // Reset to first page when filters change
                        if (e.target.checked) {
                          console.log("🔍 DEBUG: Adding make:", make.name);

                          setAppliedFilters(prev => {
                            const newFilters = {
                              ...prev,
                              make: [...prev.make, make.name],
                              model: [], // Clear models when make changes
                              trim: []   // Clear trims when make changes
                            };
                            console.log("🔍 DEBUG: New applied filters:", newFilters);
                            return newFilters;
                          });

                        } else {
                          console.log("🔍 DEBUG: Removing make:", make.name);
                          removeAppliedFilter("make", make.name);
                        }
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
                    Select a make first to see models
                  </div>
                ) : (
                  availableModels.map((model, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.model.includes(model.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            console.log("🔍 DEBUG: Adding model:", model.name);

                            setAppliedFilters(prev => ({
                              ...prev,
                              model: [...prev.model, model.name],
                              trim: [] // Clear trims when model changes
                            }));

                          } else {
                            console.log("🔍 DEBUG: Removing model:", model.name);
                            removeAppliedFilter("model", model.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{model.name}</span>
                      <span className="carzino-filter-count ml-1">({model.count})</span>
                    </label>
                  ))
                )}
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
                    Select a model first to see trims
                  </div>
                ) : (
                  availableTrims.map((trim, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.trim.includes(trim.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              trim: [...prev.trim, trim.name]
                            }));
                          } else {
                            removeAppliedFilter("trim", trim.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{trim.name}</span>
                      <span className="carzino-filter-count ml-1">({trim.count})</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Year Filter */}
            <FilterSection
              title="Filter by Year"
              isCollapsed={collapsedFilters.year}
              onToggle={() => toggleFilter("year")}
            >
              <div className="flex gap-1">
                <select
                  value={yearMin}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setYearMin(e.target.value);
                    setAppliedFilters(prev => ({
                      ...prev,
                      yearMin: e.target.value
                    }));
                  }}
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none bg-white"
                >
                  <option value="">Min Year</option>
                  {Array.from({ length: 35 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
                <select
                  value={yearMax}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setYearMax(e.target.value);
                    setAppliedFilters(prev => ({
                      ...prev,
                      yearMax: e.target.value
                    }));
                  }}
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none bg-white"
                >
                  <option value="">Max Year</option>
                  {Array.from({ length: 35 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
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
                    setCurrentPage(1);
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

            {/* Payment Calculator Filter */}
            <FilterSection
              title="Search by Payment"
              isCollapsed={collapsedFilters.payment}
              onToggle={() => toggleFilter("payment")}
            >
              <div className="space-y-3">
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

                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="text"
                    placeholder={downPayment ? "" : "2,000 Down Payment"}
                    value={downPayment}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d,]/g, '');
                      setDownPayment(value);
                    }}
                    className="w-full pl-6 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPaymentMin("");
                      setPaymentMax("");
                      setTermLength("72");
                      setInterestRate("8");
                      setDownPayment("2000");
                      setAppliedFilters(prev => ({
                        ...prev,
                        paymentMin: "",
                        paymentMax: ""
                      }));
                      setCurrentPage(1);
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 text-sm"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      setAppliedFilters(prev => ({
                        ...prev,
                        paymentMin: paymentMin,
                        paymentMax: paymentMax
                      }));
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                  >
                    Apply
                  </button>
                </div>
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
                  setCurrentPage(1);
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

            {/* Fuel Type Filter */}
            <FilterSection
              title="Fuel Type"
              isCollapsed={collapsedFilters.fuelType}
              onToggle={() => toggleFilter("fuelType")}
            >
              <div className="space-y-1">
                {availableFuelTypes.length > 0 ? (
                  availableFuelTypes.map((fuelType, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.fuel_type.includes(fuelType.name)}
                        onChange={(e) => {
                          setCurrentPage(1);
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              fuel_type: [...prev.fuel_type, fuelType.name]
                            }));
                          } else {
                            setAppliedFilters(prev => ({
                              ...prev,
                              fuel_type: prev.fuel_type.filter(ft => ft !== fuelType.name)
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{fuelType.name}</span>
                      <span className="carzino-filter-count ml-1">({fuelType.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    {appliedFilters.make.length > 0 ? "No fuel types available for selected vehicles" : "Select filters to see fuel type options"}
                  </div>
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
                {availableDriveTypes.length > 0 ? (
                  availableDriveTypes.map((driveType, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.driveType.includes(driveType.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
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
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    {appliedFilters.make.length > 0 ? "No drive types available for selected vehicles" : "Select filters to see drive type options"}
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Transmission Filter */}
            <FilterSection
              title="Transmission"
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
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              transmission: [...prev.transmission, transmission.name]
                            }));
                          } else {
                            removeAppliedFilter("transmission", transmission.name);
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
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              transmission: [...prev.transmission, transmission]
                            }));
                          } else {
                            removeAppliedFilter("transmission", transmission);
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
                    <label key={index} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.exteriorColor.includes(color.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              exteriorColor: [...prev.exteriorColor, color.name]
                            }));
                          } else {
                            removeAppliedFilter("exteriorColor", color.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{color.name}</span>
                      <span className="carzino-filter-count ml-1">({color.count})</span>
                    </label>
                  ))
                ) : (
                  [
                    { name: "White", color: "#FFFFFF" },
                    { name: "Black", color: "#000000" },
                    { name: "Gray", color: "#808080" },
                    { name: "Silver", color: "#C0C0C0" },
                    { name: "Blue", color: "#0066CC" },
                    { name: "Red", color: "#CC0000" }
                  ].map((color) => (
                    <label key={color.name} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.exteriorColor.includes(color.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              exteriorColor: [...prev.exteriorColor, color.name]
                            }));
                          } else {
                            removeAppliedFilter("exteriorColor", color.name);
                          }
                        }}
                      />
                      <div
                        className="w-4 h-4 rounded border border-gray-300 mr-2"
                        style={{ backgroundColor: color.color }}
                      ></div>
                      <span className="carzino-filter-option">{color.name}</span>
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
                    <label key={index} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.interiorColor.includes(color.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              interiorColor: [...prev.interiorColor, color.name]
                            }));
                          } else {
                            removeAppliedFilter("interiorColor", color.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{color.name}</span>
                      <span className="carzino-filter-count ml-1">({color.count})</span>
                    </label>
                  ))
                ) : (
                  [
                    { name: "Black", color: "#000000" },
                    { name: "Gray", color: "#808080" },
                    { name: "Beige", color: "#F5F5DC" },
                    { name: "Brown", color: "#8B4513" }
                  ].map((color) => (
                    <label key={color.name} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.interiorColor.includes(color.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              interiorColor: [...prev.interiorColor, color.name]
                            }));
                          } else {
                            removeAppliedFilter("interiorColor", color.name);
                          }
                        }}
                      />
                      <div
                        className="w-4 h-4 rounded border border-gray-300 mr-2"
                        style={{ backgroundColor: color.color }}
                      ></div>
                      <span className="carzino-filter-option">{color.name}</span>
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
                          setCurrentPage(1); // Reset to first page when filters change
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
                  ))
                ) : (
                  ["Dealer", "Private Seller", "Fleet"].map((sellerType) => (
                    <label key={sellerType} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.sellerType.includes(sellerType)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
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

            {/* Dealer Filter */}
            <FilterSection
              title="Dealer"
              isCollapsed={collapsedFilters.dealer}
              onToggle={() => toggleFilter("dealer")}
            >
              <div className="space-y-1">
                {(filterOptions.dealers && filterOptions.dealers.length > 0) ? (
                  filterOptions.dealers.map((dealer, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.dealer.includes(dealer.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              dealer: [...prev.dealer, dealer.name]
                            }));
                          } else {
                            removeAppliedFilter("dealer", dealer.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{dealer.name}</span>
                      <span className="carzino-filter-count ml-1">({dealer.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Loading dealers...
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
                  filterOptions.states.map((state, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.state.includes(state.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              state: [...prev.state, state.name]
                            }));
                          } else {
                            removeAppliedFilter("state", state.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{state.name}</span>
                      <span className="carzino-filter-count ml-1">({state.count})</span>
                    </label>
                  ))
                ) : (
                  ["WA", "CA", "OR", "TX", "FL", "NY"].map((state) => (
                    <label key={state} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.state.includes(state)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              state: [...prev.state, state]
                            }));
                          } else {
                            removeAppliedFilter("state", state);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{state}</span>
                    </label>
                  ))
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
                  filterOptions.cities.map((city, index) => (
                    <label key={index} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.city.includes(city.name)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              city: [...prev.city, city.name]
                            }));
                          } else {
                            removeAppliedFilter("city", city.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{city.name}</span>
                      <span className="carzino-filter-count ml-1">({city.count})</span>
                    </label>
                  ))
                ) : (
                  ["Seattle", "Lakewood", "Tacoma", "Federal Way", "Bellevue", "Everett"].map((city) => (
                    <label key={city} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.city.includes(city)}
                        onChange={(e) => {
                          setCurrentPage(1); // Reset to first page when filters change
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              city: [...prev.city, city]
                            }));
                          } else {
                            removeAppliedFilter("city", city);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{city}</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white">
          {/* Top Bar */}
          <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Sliders className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters</span>
                  </button>

                  <div className="hidden lg:flex flex-col">
                    <h1 className="text-lg font-semibold text-gray-900">
                      New and Used Vehicles for sale
                    </h1>
                    <span className="text-sm text-gray-500">
                      {totalResults.toLocaleString()} Matches
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-700">{favoritesCount}</span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <span className="text-sm">Sort</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {sortDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                        {[
                          { value: "relevance", label: "Relevance" },
                          { value: "price_asc", label: "Price: Low to High" },
                          { value: "price_desc", label: "Price: High to Low" },
                          { value: "mileage_asc", label: "Mileage: Low to High" },
                          { value: "mileage_desc", label: "Mileage: High to Low" },
                          { value: "year_asc", label: "Year: Oldest to Newest" },
                          { value: "year_desc", label: "Year: Newest to Oldest" }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              sortBy === option.value ? 'bg-red-50 text-red-700' : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={resultsPerPage}
                      onChange={(e) => {
                        setResultsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none bg-white hover:bg-gray-50"
                    >
                      <option value="10">View: 10</option>
                      <option value="25">View: 25</option>
                      <option value="30">View: 30</option>
                      <option value="50">View: 50</option>
                      <option value="100">View: 100</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="lg:hidden mt-3">
                <div className="text-sm text-gray-600">
                  New and Used Vehicles for sale
                </div>
                <div className="text-xs text-gray-500">
                  {totalResults.toLocaleString()} Matches
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Grid */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
                <p className="text-gray-500 text-lg">Loading vehicles from your WordPress...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
                <p className="text-gray-500 text-lg mb-4">Error loading vehicles</p>
                <p className="text-gray-400 text-sm">{error}</p>
                <button
                  onClick={() => fetchCombinedData()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : displayedVehicles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {viewMode === "favorites" ? "No favorites saved yet" : "No vehicles found with current filters"}
                </p>
                {appliedFilters.make.length > 0 || appliedFilters.condition.length > 0 ? (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Clear All Filters
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid vehicle-grid">
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
            )}

            {/* Pagination */}
            {displayedVehicles.length > 0 && viewMode !== "favorites" && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  resultsPerPage={resultsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
