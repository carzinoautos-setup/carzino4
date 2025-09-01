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
  Check,
} from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { FilterSection } from "@/components/FilterSection";
import { VehicleCard } from "@/components/VehicleCard";
import { VehicleTypeCard } from "@/components/VehicleTypeCard";
import { Pagination } from "@/components/Pagination";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  wordpressCustomApi,
  WordPressVehicle,
  WordPressVehiclesResponse,
  WordPressVehicleFilters
} from "../lib/wordpressCustomApi";
import { apiCache } from "@/lib/performance";

// Geocoding function for ZIP code lookup
const geocodeZip = async (zipCode: string): Promise<{
  lat: number;
  lng: number;
  city?: string;
  state?: string;
} | null> => {
  try {
    const response = await fetch(`/api/geocoding?zip=${zipCode}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.location) {
        return data.location;
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
};

// Vehicle interface to match MySQL page design
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

export default function WordPressVehicles() {
  // State management - matching MySQL page
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(20);
  
  // Filter states - matching MySQL page
  const [searchTerm, setSearchTerm] = useState("");
  const [unifiedSearch, setUnifiedSearch] = useState("");
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

  // Location/Distance states - matching MySQL page
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("200");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [appliedRadius, setAppliedRadius] = useState("200");

  // UI states - matching MySQL page
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [favorites, setFavorites] = useState<{ [key: number]: Vehicle }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Financing states (for VehicleCard component)
  const [termLength, setTermLength] = useState("60");
  const [interestRate, setInterestRate] = useState("5");
  const [downPayment, setDownPayment] = useState("2000");

  // Filter options from API
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
    makes: [],
    models: [],
    trims: [],
    conditions: [],
    vehicleTypes: [],
    driveTypes: [],
    transmissions: [],
    exteriorColors: [],
    interiorColors: [],
    sellerTypes: [],
    dealers: [],
    states: [],
    cities: [],
    totalVehicles: 0
  });

  // Vehicle types and dealer states
  const [vehicleTypes, setVehicleTypes] = useState<{ name: string; count: number }[]>([]);
  const [availableDealers, setAvailableDealers] = useState<{ name: string; count: number }[]>([]);

  // Show More state for Make filter
  const [showAllMakes, setShowAllMakes] = useState(false);

  // Collapsed filters state - matching MySQL page
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

  // Price and payment filter states
  const [priceMin, setPriceMin] = useState("10000");
  const [priceMax, setPriceMax] = useState("100000");
  const [paymentMin, setPaymentMin] = useState("100");
  const [paymentMax, setPaymentMax] = useState("2000");

  const location = useLocation();
  const navigate = useNavigate();

  // Transform WordPress vehicle to Vehicle interface (same as MySQL page)
  const transformVehicle = useCallback((wpVehicle: WordPressVehicle): Vehicle => {
    const acf = wpVehicle.acf;
    
    return {
      id: wpVehicle.id,
      featured: acf?.is_featured === "1" || acf?.is_featured === true,
      viewed: false, // Default for WordPress vehicles
      images: wpVehicle.featured_image ? [wpVehicle.featured_image] : [],
      badges: [
        acf?.condition || "Used",
        ...(acf?.certified === "1" || acf?.certified === true ? ["Certified"] : []),
        ...(acf?.is_featured === "1" || acf?.is_featured === true ? ["Featured"] : [])
      ].filter(Boolean),
      title: `${acf?.year || ""} ${acf?.make || ""} ${acf?.model || ""}`.trim() || wpVehicle.name,
      mileage: acf?.mileage ? `${parseInt(acf.mileage).toLocaleString()} Mi.` : "0 Mi.",
      transmission: acf?.transmission || "Auto",
      doors: acf?.doors ? `${acf.doors} Doors` : "4 Doors",
      salePrice: wpVehicle.price ? `$${parseInt(wpVehicle.price).toLocaleString()}` : null,
      payment: acf?.payment ? `$${acf.payment}/mo*` : null,
      dealer: acf?.account_name_seller || "Dealer Account #1000821",
      location: `${acf?.city_seller || "Seattle"}, ${acf?.state_seller || "WA"} ${acf?.zip_seller || "98101"}`,
      phone: acf?.phone_number_seller || "(253) 555-0100",
      seller_type: acf?.account_type_seller || "Dealer",
      city_seller: acf?.city_seller,
      state_seller: acf?.state_seller,
      zip_seller: acf?.zip_seller,
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
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      if (appliedFilters.make.length > 0) {
        filters.make = appliedFilters.make.join(',');
      }

      if (appliedFilters.model.length > 0) {
        filters.model = appliedFilters.model.join(',');
      }

      if (appliedFilters.trim.length > 0) {
        filters.trim = appliedFilters.trim.join(',');
      }

      if (appliedFilters.condition.length > 0) {
        filters.condition = appliedFilters.condition.join(',');
      }

      if (appliedFilters.year.length > 0) {
        filters.year = appliedFilters.year.join(',');
      }

      if (appliedFilters.vehicleType.length > 0) {
        filters.body_type = appliedFilters.vehicleType.join(',');
      }

      if (appliedFilters.driveType.length > 0) {
        filters.drive_type = appliedFilters.driveType.join(',');
      }

      if (appliedFilters.transmission.length > 0) {
        filters.transmission = appliedFilters.transmission.join(',');
      }

      if (appliedFilters.exteriorColor.length > 0) {
        filters.exterior_color = appliedFilters.exteriorColor.join(',');
      }

      if (appliedFilters.interiorColor.length > 0) {
        filters.interior_color = appliedFilters.interiorColor.join(',');
      }

      if (appliedFilters.sellerType.length > 0) {
        filters.seller_type = appliedFilters.sellerType.join(',');
      }

      if (appliedFilters.dealer.length > 0) {
        filters.dealer = appliedFilters.dealer.join(',');
      }

      if (appliedFilters.state.length > 0) {
        filters.state = appliedFilters.state.join(',');
      }

      if (appliedFilters.city.length > 0) {
        filters.city = appliedFilters.city.join(',');
      }

      if (appliedFilters.priceMin) {
        filters.min_price = parseInt(appliedFilters.priceMin.replace(/[^\d]/g, ''));
      }

      if (appliedFilters.priceMax) {
        filters.max_price = parseInt(appliedFilters.priceMax.replace(/[^\d]/g, ''));
      }

      if (appliedFilters.paymentMin) {
        filters.min_payment = parseInt(appliedFilters.paymentMin.replace(/[^\d]/g, ''));
      }

      if (appliedFilters.paymentMax) {
        filters.max_payment = parseInt(appliedFilters.paymentMax.replace(/[^\d]/g, ''));
      }

      if (appliedFilters.mileage) {
        filters.max_mileage = parseInt(appliedFilters.mileage.replace(/[^\d]/g, ''));
      }

      // Add location filters
      if (appliedLocation && appliedRadius !== "nationwide") {
        filters.lat = appliedLocation.lat;
        filters.lng = appliedLocation.lng;
        filters.radius = parseInt(appliedRadius);
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
          .map(make => ({ name: make!, count: response.data.filter(v => v.acf?.make === make).length }));

        const models = Array.from(new Set(response.data.map(v => v.acf?.model).filter(Boolean)))
          .map(model => ({ name: model!, count: response.data.filter(v => v.acf?.model === model).length }));

        const trims = Array.from(new Set(response.data.map(v => v.acf?.trim).filter(Boolean)))
          .map(trim => ({ name: trim!, count: response.data.filter(v => v.acf?.trim === trim).length }));

        const conditions = Array.from(new Set(response.data.map(v => v.acf?.condition).filter(Boolean)))
          .map(condition => ({ name: condition!, count: response.data.filter(v => v.acf?.condition === condition).length }));

        const vehicleTypes = Array.from(new Set(response.data.map(v => v.acf?.body_type).filter(Boolean)))
          .map(type => ({ name: type!, count: response.data.filter(v => v.acf?.body_type === type).length }));

        const driveTypes = Array.from(new Set(response.data.map(v => v.acf?.drive_type).filter(Boolean)))
          .map(type => ({ name: type!, count: response.data.filter(v => v.acf?.drive_type === type).length }));

        const transmissions = Array.from(new Set(response.data.map(v => v.acf?.transmission).filter(Boolean)))
          .map(trans => ({ name: trans!, count: response.data.filter(v => v.acf?.transmission === trans).length }));

        const exteriorColors = Array.from(new Set(response.data.map(v => v.acf?.exterior_color).filter(Boolean)))
          .map(color => ({ name: color!, count: response.data.filter(v => v.acf?.exterior_color === color).length }));

        const interiorColors = Array.from(new Set(response.data.map(v => v.acf?.interior_color).filter(Boolean)))
          .map(color => ({ name: color!, count: response.data.filter(v => v.acf?.interior_color === color).length }));

        const sellerTypes = Array.from(new Set(response.data.map(v => v.acf?.account_type_seller).filter(Boolean)))
          .map(type => ({ name: type!, count: response.data.filter(v => v.acf?.account_type_seller === type).length }));

        const dealers = Array.from(new Set(response.data.map(v => v.acf?.account_name_seller).filter(Boolean)))
          .map(dealer => ({ name: dealer!, count: response.data.filter(v => v.acf?.account_name_seller === dealer).length }));

        const states = Array.from(new Set(response.data.map(v => v.acf?.state_seller).filter(Boolean)))
          .map(state => ({ name: state!, count: response.data.filter(v => v.acf?.state_seller === state).length }));

        const cities = Array.from(new Set(response.data.map(v => v.acf?.city_seller).filter(Boolean)))
          .map(city => ({ name: city!, count: response.data.filter(v => v.acf?.city_seller === city).length }));

        setFilterOptions({
          makes, models, trims, conditions, vehicleTypes, driveTypes,
          transmissions, exteriorColors, interiorColors, sellerTypes,
          dealers, states, cities, totalVehicles: response.data.length
        });
        setVehicleTypes(vehicleTypes);
        setAvailableDealers(dealers);

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
  }, [pageSize, appliedFilters, transformVehicle]);

  // Geocode ZIP code when it changes (with debouncing)
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (zipCode && zipCode.length >= 5) {
        setIsGeocodingLoading(true);
        const location = await geocodeZip(zipCode);
        setUserLocation(location);
        setIsGeocodingLoading(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(debounceTimer);
  }, [zipCode]);

  // Initial load and refetch when filters change
  useEffect(() => {
    fetchVehicles(currentPage);
  }, [appliedFilters, searchTerm, appliedLocation, appliedRadius, sortBy]);

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

  // Toggle favorite (matching MySQL page function signature)
  const toggleFavorite = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    setFavorites(prev => {
      const newFavorites = { ...prev };
      if (newFavorites[vehicle.id]) {
        delete newFavorites[vehicle.id];
        setKeeperMessage(null);
      } else {
        newFavorites[vehicle.id] = vehicle;
        setKeeperMessage(vehicle.id);
        // Clear keeper message after 3 seconds
        setTimeout(() => setKeeperMessage(null), 3000);
      }
      return newFavorites;
    });
  };

  // Handle unified search submit
  const handleUnifiedSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(unifiedSearch);
    setCurrentPage(1);
    fetchVehicles(1);
  };

  // Handle filter update with refetch
  const updateFilter = (filterType: string, value: string, checked: boolean) => {
    setAppliedFilters(prev => {
      const currentValues = prev[filterType as keyof typeof prev] as string[];
      let newValues;

      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(item => item !== value);
      }

      const newFilters = { ...prev, [filterType]: newValues };

      // Trigger refetch with new filters
      setTimeout(() => {
        setCurrentPage(1);
        fetchVehicles(1);
      }, 100);

      return newFilters;
    });
  };

  // Helper functions for price formatting
  const formatPrice = (value: string): string => {
    const numericValue = value.replace(/[^\d]/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue).toLocaleString();
  };

  const unformatPrice = (value: string): string => {
    return value.replace(/,/g, "");
  };

  // Apply location filters
  const applyLocationFilters = () => {
    setAppliedLocation(userLocation);
    setAppliedRadius(radius);
    setCurrentPage(1);
    fetchVehicles(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setUnifiedSearch("");
    setZipCode("");
    setRadius("200");
    setAppliedLocation(null);
    setAppliedRadius("200");
    setAppliedFilters({
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      bodyStyle: [],
      vehicleType: [],
      driveType: [],
      transmission: [],
      mileage: "",
      exteriorColor: [],
      interiorColor: [],
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      priceMin: "",
      priceMax: "",
      paymentMin: "",
      paymentMax: "",
    });
    setShowAllMakes(false);
    setPriceMin("10000");
    setPriceMax("100000");
    setPaymentMin("100");
    setPaymentMax("2000");
    setCurrentPage(1);
    fetchVehicles(1);
  };

  // Remove applied filter
  const removeAppliedFilter = (filterType: string, value: string) => {
    setAppliedFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType])
        ? (prev[filterType] as string[]).filter(item => item !== value)
        : prev[filterType]
    }));
  };

  // Toggle filter section
  const toggleFilter = (filterName: string) => {
    setCollapsedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Calculate counts
  const favoritesCount = Object.keys(favorites).length;
  const displayedVehicles = viewMode === "favorites" 
    ? Object.values(favorites) 
    : vehicles;

  return (
    <ErrorBoundary>
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

          input[type="checkbox"]:checked {
            background-color: #dc2626 !important;
            border-color: #dc2626 !important;
          }

          input[type="checkbox"]:checked::after {
            content: '✓' !important;
            position: absolute;
            color: white !important;
            font-size: 12px !important;
            top: -2px;
            left: 2px;
            font-weight: bold !important;
          }

          .main-container {
            max-width: 1325px !important;
            margin: 0 auto !important;
          }

          .vehicle-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 24px !important;
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

          @media (max-width: 1024px) {
            .mobile-filter-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              z-index: 40;
              opacity: 0;
              visibility: hidden;
              transition: all 0.3s ease;
            }

            .mobile-filter-overlay.open {
              opacity: 1;
              visibility: visible;
            }

            .mobile-filter-sidebar {
              position: fixed;
              top: 0;
              left: -280px;
              width: 280px;
              height: 100vh;
              background: white;
              z-index: 50;
              transition: left 0.3s ease;
              overflow-y: auto;
            }

            .mobile-filter-sidebar.open {
              left: 0;
            }
          }
        `}</style>

        <div className="flex flex-col lg:flex-row min-h-screen max-w-[1325px] mx-auto">
          <div
            className={`mobile-filter-overlay lg:hidden ${mobileFiltersOpen ? "open" : ""}`}
            onClick={() => setMobileFiltersOpen(false)}
          ></div>

          {/* Sidebar - exactly like MySQL page */}
          <div
            className={`bg-white border-r border-gray-200 mobile-filter-sidebar hidden lg:block ${mobileFiltersOpen ? "open" : ""}`}
            style={{ width: "280px" }}
          >
            <div className="p-4">
              {/* Desktop Search Section */}
              <div className="hidden lg:block mb-4 pb-4 border-b border-gray-200">
                <form onSubmit={handleUnifiedSearchSubmit}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search Cars For Sale"
                      value={unifiedSearch}
                      onChange={(e) => setUnifiedSearch(e.target.value)}
                      className="carzino-search-input w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Distance */}
              <div className="mb-4 pb-4 border border-gray-200 rounded-lg p-3">
                <label className="carzino-location-label block mb-2">
                  Distance
                </label>
                <input
                  type="text"
                  placeholder="Enter your zip code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className={`carzino-search-input w-full px-3 py-2 border rounded-md focus:outline-none ${
                    zipCode.trim() === ""
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-red-600"
                  }`}
                />
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="carzino-dropdown-option w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none mt-2"
                >
                  <option value="10">10 Miles</option>
                  <option value="25">25 Miles</option>
                  <option value="50">50 Miles</option>
                  <option value="100">100 Miles</option>
                  <option value="200">200 Miles</option>
                  <option value="500">500 Miles</option>
                  <option value="nationwide">Nationwide</option>
                </select>

                {/* Location Status */}
                {isGeocodingLoading && (
                  <div className="mt-2 text-sm text-gray-500 italic flex items-center gap-1">
                    <Loader className="w-4 h-4 animate-spin" />
                    Looking up location for ZIP {zipCode}...
                  </div>
                )}

                {userLocation && !isGeocodingLoading && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-red-600" />
                    {userLocation.city && userLocation.state
                      ? `${userLocation.city}, ${userLocation.state}`
                      : `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                    {userLocation.city === "Geographic Center" && (
                      <span className="text-yellow-600 ml-1">(Offline mode)</span>
                    )}
                  </div>
                )}

                {!userLocation &&
                  !isGeocodingLoading &&
                  zipCode &&
                  zipCode.length >= 5 && (
                    <div className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Location service unavailable. Radius filtering disabled.
                    </div>
                  )}

                {/* Apply Location Filters Button */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={applyLocationFilters}
                    disabled={!userLocation || isGeocodingLoading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Apply Location Filter
                  </button>
                </div>
              </div>

              {/* Vehicle Type Filter */}
              <FilterSection
                title="Vehicle Type"
                isCollapsed={collapsedFilters.vehicleType}
                onToggle={() => toggleFilter("vehicleType")}
              >
                <div className="space-y-1">
                  {filterOptions.vehicleTypes.length > 0 ? (
                    filterOptions.vehicleTypes
                      .filter(type => type.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((type) => (
                      <label
                        key={type.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.vehicleType.includes(type.name)}
                          onChange={(e) => updateFilter("vehicleType", type.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{type.name}</span>
                        <span className="carzino-filter-count">({type.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">Loading vehicle types...</div>
                  )}
                </div>
              </FilterSection>

              {/* Condition Filter */}
              <FilterSection
                title="Condition"
                isCollapsed={collapsedFilters.condition}
                onToggle={() => toggleFilter("condition")}
              >
                <div className="space-y-1">
                  {filterOptions.conditions.length > 0 ? (
                    filterOptions.conditions
                      .filter(condition => condition.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((condition) => (
                      <label
                        key={condition.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.condition.includes(condition.name)}
                          onChange={(e) => updateFilter("condition", condition.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{condition.name}</span>
                        <span className="carzino-filter-count">({condition.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">Loading conditions...</div>
                  )}
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
                    { label: "Under 10,000 Mi.", value: "10000" },
                    { label: "Under 25,000 Mi.", value: "25000" },
                    { label: "Under 50,000 Mi.", value: "50000" },
                    { label: "Under 75,000 Mi.", value: "75000" },
                    { label: "Under 100,000 Mi.", value: "100000" },
                    { label: "Under 150,000 Mi.", value: "150000" },
                  ].map((mileageOption) => (
                    <label
                      key={mileageOption.value}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="mileage"
                        className="mr-2"
                        checked={appliedFilters.mileage === mileageOption.value}
                        onChange={() => {
                          setAppliedFilters(prev => ({ ...prev, mileage: mileageOption.value }));
                          setTimeout(() => {
                            setCurrentPage(1);
                            fetchVehicles(1);
                          }, 100);
                        }}
                      />
                      <span className="carzino-filter-option flex-1">{mileageOption.label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Make Filter */}
              <FilterSection
                title="Make"
                isCollapsed={collapsedFilters.make}
                onToggle={() => toggleFilter("make")}
              >
                <div className="space-y-1">
                  {filterOptions.makes.length > 0 ? (
                    filterOptions.makes
                      .filter(makeOption => makeOption.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, showAllMakes ? undefined : 10)
                      .map((makeOption) => (
                      <label
                        key={makeOption.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.make.includes(makeOption.name)}
                          onChange={(e) => updateFilter("make", makeOption.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{makeOption.name}</span>
                        <span className="carzino-filter-count">({makeOption.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">Loading makes...</div>
                  )}
                  {filterOptions.makes.length > 10 && (
                    <button
                      onClick={() => setShowAllMakes(!showAllMakes)}
                      className="carzino-show-more text-red-600 hover:text-red-700 mt-2 text-sm font-medium"
                    >
                      {showAllMakes ? "Show Less" : `Show More (${filterOptions.makes.length - 10})`}
                    </button>
                  )}
                </div>
              </FilterSection>

              {/* Model Filter */}
              <FilterSection
                title="Model"
                isCollapsed={collapsedFilters.model}
                onToggle={() => toggleFilter("model")}
              >
                <div className="space-y-1">
                  {filterOptions.models.length > 0 ? (
                    filterOptions.models
                      .filter(modelOption => modelOption.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((modelOption) => (
                      <label
                        key={modelOption.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.model.includes(modelOption.name)}
                          onChange={(e) => updateFilter("model", modelOption.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{modelOption.name}</span>
                        <span className="carzino-filter-count">({modelOption.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No models available</div>
                  )}
                </div>
              </FilterSection>

              {/* Trim Filter */}
              <FilterSection
                title="Trim"
                isCollapsed={collapsedFilters.trim}
                onToggle={() => toggleFilter("trim")}
              >
                <div className="space-y-1">
                  {filterOptions.trims.length > 0 ? (
                    filterOptions.trims
                      .filter(trimOption => trimOption.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((trimOption) => (
                      <label
                        key={trimOption.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.trim.includes(trimOption.name)}
                          onChange={(e) => updateFilter("trim", trimOption.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{trimOption.name}</span>
                        <span className="carzino-filter-count">({trimOption.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No trim options available</div>
                  )}
                </div>
              </FilterSection>

              {/* Year Filter */}
              <FilterSection
                title="Year"
                isCollapsed={collapsedFilters.year}
                onToggle={() => toggleFilter("year")}
              >
                <div className="space-y-1">
                  {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i)
                    .map((year) => (
                    <label
                      key={year}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.year.includes(year.toString())}
                        onChange={(e) => updateFilter("year", year.toString(), e.target.checked)}
                      />
                      <span className="carzino-filter-option flex-1">{year}</span>
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
                        placeholder="10,000"
                        value={formatPrice(priceMin)}
                        onChange={(e) => {
                          const formatted = unformatPrice(e.target.value);
                          setPriceMin(formatted);
                          setAppliedFilters(prev => ({ ...prev, priceMin: formatted }));
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setCurrentPage(1);
                            fetchVehicles(1);
                          }, 100);
                        }}
                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="text"
                        placeholder="100,000"
                        value={formatPrice(priceMax)}
                        onChange={(e) => {
                          const formatted = unformatPrice(e.target.value);
                          setPriceMax(formatted);
                          setAppliedFilters(prev => ({ ...prev, priceMax: formatted }));
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setCurrentPage(1);
                            fetchVehicles(1);
                          }, 100);
                        }}
                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Payment Filter */}
              <FilterSection
                title="Payment"
                isCollapsed={collapsedFilters.payment}
                onToggle={() => toggleFilter("payment")}
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="text"
                        placeholder="100"
                        value={formatPrice(paymentMin)}
                        onChange={(e) => {
                          const formatted = unformatPrice(e.target.value);
                          setPaymentMin(formatted);
                          setAppliedFilters(prev => ({ ...prev, paymentMin: formatted }));
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setCurrentPage(1);
                            fetchVehicles(1);
                          }, 100);
                        }}
                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="text"
                        placeholder="2,000"
                        value={formatPrice(paymentMax)}
                        onChange={(e) => {
                          const formatted = unformatPrice(e.target.value);
                          setPaymentMax(formatted);
                          setAppliedFilters(prev => ({ ...prev, paymentMax: formatted }));
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setCurrentPage(1);
                            fetchVehicles(1);
                          }, 100);
                        }}
                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex gap-2">
                      <select
                        value={termLength}
                        onChange={(e) => setTermLength(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
                      >
                        <option value="48">48 months</option>
                        <option value="60">60 months</option>
                        <option value="72">72 months</option>
                        <option value="84">84 months</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Rate"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Down Payment"
                      value={`$${formatPrice(downPayment)}`}
                      onChange={(e) => setDownPayment(unformatPrice(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              </FilterSection>

              {/* Drive Type Filter */}
              <FilterSection
                title="Drive Type"
                isCollapsed={collapsedFilters.driveType}
                onToggle={() => toggleFilter("driveType")}
              >
                <div className="space-y-1">
                  {filterOptions.driveTypes.length > 0 ? (
                    filterOptions.driveTypes
                      .filter(type => type.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((type) => (
                      <label
                        key={type.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.driveType.includes(type.name)}
                          onChange={(e) => updateFilter("driveType", type.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{type.name}</span>
                        <span className="carzino-filter-count">({type.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No drive types available</div>
                  )}
                </div>
              </FilterSection>

              {/* Transmission Filter */}
              <FilterSection
                title="Transmission"
                isCollapsed={collapsedFilters.transmission}
                onToggle={() => toggleFilter("transmission")}
              >
                <div className="space-y-1">
                  {filterOptions.transmissions.length > 0 ? (
                    filterOptions.transmissions
                      .filter(trans => trans.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((trans) => (
                      <label
                        key={trans.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.transmission.includes(trans.name)}
                          onChange={(e) => updateFilter("transmission", trans.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{trans.name}</span>
                        <span className="carzino-filter-count">({trans.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No transmissions available</div>
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
                  {filterOptions.exteriorColors.length > 0 ? (
                    filterOptions.exteriorColors
                      .filter(color => color.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((color) => (
                      <label
                        key={color.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.exteriorColor.includes(color.name)}
                          onChange={(e) => updateFilter("exteriorColor", color.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{color.name}</span>
                        <span className="carzino-filter-count">({color.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No exterior colors available</div>
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
                  {filterOptions.interiorColors.length > 0 ? (
                    filterOptions.interiorColors
                      .filter(color => color.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((color) => (
                      <label
                        key={color.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.interiorColor.includes(color.name)}
                          onChange={(e) => updateFilter("interiorColor", color.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{color.name}</span>
                        <span className="carzino-filter-count">({color.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No interior colors available</div>
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
                  {filterOptions.sellerTypes.length > 0 ? (
                    filterOptions.sellerTypes
                      .filter(type => type.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((type) => (
                      <label
                        key={type.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.sellerType.includes(type.name)}
                          onChange={(e) => updateFilter("sellerType", type.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{type.name}</span>
                        <span className="carzino-filter-count">({type.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No seller types available</div>
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
                  {filterOptions.dealers.length > 0 ? (
                    filterOptions.dealers
                      .filter(dealer => dealer.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map((dealer) => (
                      <label
                        key={dealer.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.dealer.includes(dealer.name)}
                          onChange={(e) => updateFilter("dealer", dealer.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{dealer.name}</span>
                        <span className="carzino-filter-count">({dealer.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No dealers available</div>
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
                  {filterOptions.states.length > 0 ? (
                    filterOptions.states
                      .filter(state => state.count > 0)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((state) => (
                      <label
                        key={state.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.state.includes(state.name)}
                          onChange={(e) => updateFilter("state", state.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{state.name}</span>
                        <span className="carzino-filter-count">({state.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No states available</div>
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
                  {filterOptions.cities.length > 0 ? (
                    filterOptions.cities
                      .filter(city => city.count > 0)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((city) => (
                      <label
                        key={city.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.city.includes(city.name)}
                          onChange={(e) => updateFilter("city", city.name, e.target.checked)}
                        />
                        <span className="carzino-filter-option flex-1">{city.name}</span>
                        <span className="carzino-filter-count">({city.count})</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No cities available</div>
                  )}
                </div>
              </FilterSection>
            </div>
          </div>

          {/* Main Content - exactly like MySQL page */}
          <div className="flex-1 bg-white">
            {/* Mobile Header */}
            <div className="md:hidden p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Sliders className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Mobile Favorites Button */}
                  <button
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50 bg-white relative"
                    onClick={() => setViewMode(viewMode === "favorites" ? "all" : "favorites")}
                  >
                    <Heart
                      className={`w-4 h-4 ${favoritesCount > 0 ? "text-red-600 fill-red-600" : "text-red-600"}`}
                    />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {favoritesCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleUnifiedSearchSubmit} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Cars For Sale"
                    value={unifiedSearch}
                    onChange={(e) => setUnifiedSearch(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="text-sm text-gray-600">
                {totalRecords.toLocaleString()} Matches
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    New and Used Vehicles for sale
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    {totalRecords.toLocaleString()} Matches
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Switcher */}
                  {viewMode === "favorites" ? (
                    <div className="view-switcher">
                      <button
                        className={viewMode === "all" ? "active" : ""}
                        onClick={() => setViewMode("all")}
                      >
                        All Results
                      </button>
                      <button
                        className={viewMode === "favorites" ? "active" : ""}
                        onClick={() => setViewMode("favorites")}
                      >
                        <Heart className="w-4 h-4" />
                        Saved ({favoritesCount})
                      </button>
                    </div>
                  ) : (
                    <button
                      className="p-2 border border-gray-300 rounded hover:bg-gray-50 bg-white relative"
                      onClick={() => setViewMode("favorites")}
                    >
                      <Heart
                        className={`w-5 h-5 ${favoritesCount > 0 ? "text-red-600 fill-red-600" : "text-red-600"}`}
                      />
                      {favoritesCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {favoritesCount}
                        </span>
                      )}
                    </button>
                  )}

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none bg-white"
                  >
                    <option value="relevance">Sort</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>

                  <select className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="30">View: 30</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vehicle Grid */}
            <div className="p-4 lg:p-4 bg-white min-h-screen">
              {loading ? (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
                  <div className="text-lg">Loading vehicles...</div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <div className="text-red-600 mb-4">Error loading vehicles:</div>
                  <div className="text-sm text-gray-600 mb-4">{error}</div>
                  <button
                    onClick={() => fetchVehicles(currentPage)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : viewMode === "favorites" && favoritesCount === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start browsing vehicles and save your favorites by clicking the heart icon.
                  </p>
                  <button
                    onClick={() => setViewMode("all")}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Browse Vehicles
                  </button>
                </div>
              ) : displayedVehicles.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No vehicles found
                  </h3>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search filters or{" "}
                    <button
                      onClick={clearAllFilters}
                      className="text-red-600 underline"
                    >
                      clear all filters
                    </button>
                  </p>
                </div>
              ) : (
                <div>
                  {/* Debug info */}
                  <div className="text-xs text-gray-500 mb-2 p-2 bg-yellow-50 rounded">
                    🔍 Debug: vehicles={vehicles.length}, displayed={displayedVehicles.length}, loading={loading.toString()}, error={error || 'none'}
                  </div>
                  
                  <div className="vehicle-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

                  {viewMode === "all" && totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalResults={totalRecords}
                      resultsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
