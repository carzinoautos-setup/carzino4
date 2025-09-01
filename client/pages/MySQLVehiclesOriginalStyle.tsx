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
import { wordpressCustomApi, WordPressVehiclesResponse, WordPressVehicleFilters } from "../lib/wordpressCustomApi";

// Vehicle interface for live WooCommerce data
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

// URL utility functions
const parseFiltersFromURL = (pathname: string) => {
  // Expected format: /cars-for-sale/{make}/{model}/{trim}/{condition}/{year}/{body_style}/
  const segments = pathname.split("/").filter(Boolean);

  // Remove 'cars-for-sale' from segments
  if (segments[0] === "cars-for-sale") {
    segments.shift();
  }

  const filters = {
    make: segments[0] || "",
    model: segments[1] || "",
    trim: segments[2] || "",
    condition: segments[3] || "",
    year: segments[4] || "",
    bodyStyle: segments[5] || "",
  };

  return filters;
};

const generateURLFromFilters = (filters: {
  make?: string[];
  model?: string[];
  trim?: string[];
  condition?: string[];
  year?: string;
  bodyStyle?: string;
}) => {
  const segments = [];

  // Only include the first selected value for each filter in URL
  if (filters.make && filters.make.length > 0) {
    segments.push(filters.make[0].toLowerCase().replace(/\s+/g, "-"));
  }
  if (filters.model && filters.model.length > 0) {
    segments.push(filters.model[0].toLowerCase().replace(/\s+/g, "-"));
  }
  if (filters.trim && filters.trim.length > 0) {
    segments.push(filters.trim[0].toLowerCase().replace(/\s+/g, "-"));
  }
  if (filters.condition && filters.condition.length > 0) {
    segments.push(filters.condition[0].toLowerCase());
  }
  if (filters.year) {
    segments.push(filters.year);
  }
  if (filters.bodyStyle) {
    segments.push(filters.bodyStyle.toLowerCase().replace(/\s+/g, "-"));
  }

  return `/cars-for-sale/${segments.join("/")}/`;
};

const normalizeFilterValue = (value: string) => {
  // Convert URL-safe values back to display values
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function MySQLVehiclesOriginalStyleInner() {
  // React Router hooks
  const location = useLocation();
  const navigate = useNavigate();

  // State management - exactly like original
  const [favorites, setFavorites] = useState<{ [key: number]: Vehicle }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");
  const [vehicleImages, setVehicleImages] = useState<{ [key: string]: string }>(
    {},
  );
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // API state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<VehiclesApiResponse | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = apiResponse?.meta?.totalPages || 1;
  const totalResults = apiResponse?.meta?.totalRecords || 0;
  const resultsPerPage = 20;

  // Filter states - exactly like original
  const [searchTerm, setSearchTerm] = useState("");

  // Unified search state for URL generation
  const [unifiedSearch, setUnifiedSearch] = useState("");

  // Location/Distance states
  const [zipCode, setZipCode] = useState(""); // No default ZIP
  const [radius, setRadius] = useState("200"); // Default radius in miles

  // Dealers state
  const [availableDealers, setAvailableDealers] = useState<
    { name: string; count: number }[]
  >([]);

  // Vehicle types state
  const [vehicleTypes, setVehicleTypes] = useState<
    { name: string; count: number }[]
  >([]);

  // Real filter options with counts
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
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Applied location filters (separate from current input values)
  const [appliedLocation, setAppliedLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [appliedRadius, setAppliedRadius] = useState("200");

  // Show More state for Make filter
  const [showAllMakes, setShowAllMakes] = useState(false);

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
  const [termLength, setTermLength] = useState("60");
  const [interestRate, setInterestRate] = useState("5");
  const [downPayment, setDownPayment] = useState("2000");

  // Performance monitoring (only in development)
  if (import.meta.env.DEV && Math.random() < 0.1) { // Log only 10% of renders
    console.log("📊 Render State:", {
      vehiclesCount: vehicles.length,
      totalResults,
      loading,
      error
    });
  }

  // Keep track of active controller to abort previous requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const apiClient = useRef(new OptimizedApiClient());

  // Performance: Debounce search term and filters (minimal debounce for immediate response)
  const debouncedSearchTerm = useDebounce(searchTerm, 100);
  const debouncedAppliedFilters = useDebounce(appliedFilters, 150);

  // Get the API base URL - handle different environments
  const getApiBaseUrl = () => {
    // Always use relative URLs - let the browser handle the base URL
    return "";
  };

  // Get models for a specific make from live filter options
  const getModelsForMake = (make: string): { name: string; count: number }[] => {
    // This will be populated by the live API data
    // For now, return empty array - models will be fetched from the server
    return [];
  };

  // Performance: Memoize API parameters to prevent unnecessary calls
  const apiParams = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      pageSize: resultsPerPage.toString(),
    });

    if (debouncedSearchTerm.trim()) {
      params.append("search", debouncedSearchTerm.trim());
    }

    if (sortBy !== "relevance") {
      params.append("sortBy", sortBy);
    }

    if (appliedLocation && appliedRadius !== "nationwide") {
      params.append("lat", appliedLocation.lat.toString());
      params.append("lng", appliedLocation.lng.toString());
      params.append("radius", appliedRadius);
    }

    // Add filters (only if not empty)
    if (debouncedAppliedFilters) {
      Object.entries(debouncedAppliedFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          if (key === 'vehicleType') {
            params.append('body_type', value.join(','));
          } else {
            params.append(key, value.join(','));
          }
        } else if (typeof value === 'string' && value.trim()) {
          params.append(key, value);
        }
      });
    }

    return params.toString();
  }, [currentPage, debouncedSearchTerm, sortBy, appliedLocation, appliedRadius, debouncedAppliedFilters, resultsPerPage]);

  // PERFORMANCE OPTIMIZATION: Combined API call that fetches vehicles + filters + dealers in one request
  const fetchCombinedData = useCallback(async (retryCount = 0) => {
    if (!isMountedRef.current) {
      if (import.meta.env.DEV) {
        console.log("🚫 Component unmounted, skipping combined fetch");
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log("🚀 COMBINED FETCH: Starting with params:", apiParams);
    }

    try {
      // Abort any previous request safely
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        try {
          abortControllerRef.current.abort();
        } catch (err) {
          // Ignore abort errors - this is expected in some cases
          if (import.meta.env.DEV) {
            console.log("🔄 Previous combined request abort handled:", err?.message);
          }
        }
      }

      // Create new controller safely
      let requestController: AbortController;
      try {
        requestController = new AbortController();
        abortControllerRef.current = requestController;
      } catch (err) {
        console.error("❌ Failed to create AbortController:", err);
        return;
      }

      if (!isMountedRef.current) {
        try {
          requestController.abort();
        } catch (err) {
          // Ignore abort errors
        }
        return;
      }

      setLoading(true);
      setError(null);

      PerformanceMonitor.startMeasure('fetchCombinedData');

      // Check cache first
      const cacheKey = `combined_${apiParams}`;
      const cachedData = import.meta.env.DEV ? null : apiCache.get(cacheKey);
      if (cachedData && retryCount === 0) {
        if (import.meta.env.DEV) {
          console.log("⚡ Using cached combined data");
        }
        setVehicles(cachedData.data.vehicles || []);
        setApiResponse({
          data: cachedData.data.vehicles,
          meta: cachedData.data.meta,
          success: true
        });
        setFilterOptions(cachedData.data.filters || {
          makes: [], models: [], trims: [], conditions: [],
          vehicleTypes: [], driveTypes: [], transmissions: [],
          exteriorColors: [], interiorColors: [], sellerTypes: [],
          dealers: [], states: [], cities: [], totalVehicles: 0
        });
        setAvailableDealers(cachedData.data.dealers || []);
        setVehicleTypes(cachedData.data.filters?.vehicleTypes || []);
        setLoading(false);
        PerformanceMonitor.endMeasure('fetchCombinedData');
        return;
      }

      if (import.meta.env.DEV && retryCount === 0) {
        console.log("🚀 COMBINED FETCH: Calling WordPress API");
      }

      // Set timeout for request
      let timeoutId: NodeJS.Timeout | null = null;
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      if (!requestController.signal.aborted && isMountedRef.current) {
        timeoutId = setTimeout(() => {
          if (abortControllerRef.current === requestController &&
              !requestController.signal.aborted &&
              isMountedRef.current) {
            try {
              requestController.abort();
              if (import.meta.env.DEV) {
                console.log("⏰ Combined request timeout after 30 seconds");
              }
            } catch (err) {
              // Ignore timeout abort errors
              if (import.meta.env.DEV) {
                console.log("⏰ Timeout abort handled:", err?.message);
              }
            }
          }
        }, 30000);
      }

      // Build WordPress API filters from current applied filters
      const wpFilters: WordPressVehicleFilters = {
        page: currentPage,
        per_page: resultsPerPage,
      };

      // Add filters from URL params
      if (debouncedSearchTerm.trim()) {
        // WordPress API doesn't have search yet, skip for now
      }

      if (debouncedAppliedFilters) {
        if (debouncedAppliedFilters.make.length > 0) {
          wpFilters.make = debouncedAppliedFilters.make[0];
        }
        if (debouncedAppliedFilters.model.length > 0) {
          wpFilters.model = debouncedAppliedFilters.model[0];
        }
        if (debouncedAppliedFilters.condition.length > 0) {
          wpFilters.condition = debouncedAppliedFilters.condition[0];
        }
        if (debouncedAppliedFilters.priceMin) {
          wpFilters.min_price = parseInt(debouncedAppliedFilters.priceMin.replace(/[^\d]/g, ''));
        }
        if (debouncedAppliedFilters.priceMax) {
          wpFilters.max_price = parseInt(debouncedAppliedFilters.priceMax.replace(/[^\d]/g, ''));
        }
        if (debouncedAppliedFilters.paymentMin) {
          wpFilters.min_payment = parseInt(debouncedAppliedFilters.paymentMin.replace(/[^\d]/g, ''));
        }
        if (debouncedAppliedFilters.paymentMax) {
          wpFilters.max_payment = parseInt(debouncedAppliedFilters.paymentMax.replace(/[^\d]/g, ''));
        }
      }

      const response: WordPressVehiclesResponse = await wordpressCustomApi.getVehicles(
        currentPage,
        resultsPerPage,
        wpFilters
      );

      cleanup();

      if (abortControllerRef.current !== requestController || !isMountedRef.current) {
        console.log("🚫 Combined request superseded or component unmounted");
        return;
      }

      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null;
      }

      if (!response.success) {
        throw new Error(`WordPress API error: ${response.message || 'Unknown error'}`);
      }

      const data = {
        success: true,
        data: {
          vehicles: response.data.map(wpVehicle => {
            // Transform WordPress vehicle to MySQL format
            const acf = wpVehicle.acf;

            // Debug log to see actual WordPress data structure
            if (import.meta.env.DEV) {
              console.log('🔍 WordPress Vehicle Data:', {
                id: wpVehicle.id,
                name: wpVehicle.name,
                price: wpVehicle.price,
                regular_price: wpVehicle.regular_price,
                sale_price: wpVehicle.sale_price,
                acf: acf ? {
                  price: acf.price,
                  sale_price: acf.sale_price,
                  payment: acf.payment,
                  year: acf.year,
                  make: acf.make,
                  model: acf.model
                } : null,
                images: wpVehicle.images,
                featured_image: wpVehicle.featured_image
              });
            }

            // Convert price to number - try multiple sources for price
            const rawPrice = acf?.price ||
                           acf?.sale_price ||
                           wpVehicle.price ||
                           wpVehicle.sale_price ||
                           wpVehicle.regular_price;

            // Convert to number, handling string and various formats
            let vehiclePrice = 0;
            if (rawPrice) {
              if (typeof rawPrice === 'string') {
                // Remove any non-numeric characters except decimal point
                const numStr = rawPrice.replace(/[^\d.]/g, '');
                vehiclePrice = parseFloat(numStr) || 0;
              } else {
                vehiclePrice = Number(rawPrice) || 0;
              }
            }

            // Convert payment to number
            let vehiclePayment = 0;
            if (acf?.payment) {
              if (typeof acf.payment === 'string') {
                const numStr = acf.payment.replace(/[^\d.]/g, '');
                vehiclePayment = parseFloat(numStr) || 0;
              } else {
                vehiclePayment = Number(acf.payment) || 0;
              }
            }

            // Remove mock data - using real WordPress data now

            if (import.meta.env.DEV) {
              console.log('💰 Price conversion:', {
                rawPrice,
                vehiclePrice,
                rawPayment: acf?.payment,
                vehiclePayment,
                finalPrice: vehiclePrice,
                finalPayment: vehiclePayment
              });
            }

            // Handle featured image from multiple sources
            const vehicleImages = wpVehicle.featured_image ?
                                [wpVehicle.featured_image] :
                                (wpVehicle.images?.map(img => img.src) || []);

            return {
              id: wpVehicle.id,
              year: acf?.year || 2020,
              make: acf?.make || 'Unknown',
              model: acf?.model || 'Model',
              trim: acf?.trim || '',
              body_style: acf?.body_style || acf?.body_type || '',
              engine_cylinders: acf?.engine_cylinders || 4,
              fuel_type: acf?.fuel_type || 'Gasoline',
              transmission: acf?.transmission || 'Auto',
              drivetrain: acf?.drivetrain || acf?.drive_type || 'FWD',
              exterior_color_generic: acf?.exterior_color || 'Black',
              interior_color_generic: acf?.interior_color || 'Black',
              doors: acf?.doors || 4,
              price: vehiclePrice,
              salePrice: vehiclePrice > 0 ? `$${vehiclePrice.toLocaleString()}` : null,
              mileage: acf?.mileage || 0,
              title_status: acf?.title_status || 'Clean',
              highway_mpg: acf?.highway_mpg || 25,
              condition: acf?.condition || 'Used',
              certified: acf?.certified === true || acf?.certified === '1',
              seller_type: acf?.account_type_seller || 'Dealer',
              city_seller: acf?.city_seller || 'Seattle',
              state_seller: acf?.state_seller || 'WA',
              zip_seller: acf?.zip_seller || '98101',
              interest_rate: acf?.interest_rate || 5.0,
              down_payment: acf?.down_payment || 2000,
              loan_term: acf?.loan_term || 60,
              payments: vehiclePayment,
              payment: vehiclePayment > 0 ? `$${vehiclePayment}/mo*` :
                       (vehiclePrice > 0 ? `$${Math.round(vehiclePrice / 60)}/mo*` : null),
              featured: acf?.is_featured === true || acf?.is_featured === '1',
              viewed: false,
              images: vehicleImages,
              badges: [acf?.condition || 'Used', acf?.drivetrain || acf?.drive_type || 'FWD'].filter(Boolean),
              title: wpVehicle.name || `${acf?.year || ''} ${acf?.make || ''} ${acf?.model || ''}`.trim(),
              phone: acf?.phone_number_seller || '(253) 555-0100',
              dealer: acf?.account_name_seller || 'Dealer',
              location: `${acf?.city_seller || 'Seattle'}, ${acf?.state_seller || 'WA'} ${acf?.zip_seller || '98101'}`,
            };
          }),
          meta: {
            totalRecords: response.pagination?.total || 0,
            totalPages: response.pagination?.total_pages || 0,
            currentPage: response.pagination?.page || 1,
            pageSize: response.pagination?.per_page || 20,
            hasNextPage: (response.pagination?.page || 1) < (response.pagination?.total_pages || 0),
            hasPreviousPage: (response.pagination?.page || 1) > 1,
          },
          filters: {
            makes: Array.from(new Set(response.data.map(v => v.acf?.make).filter(Boolean)))
              .map(make => ({ name: make!, count: response.data.filter(v => v.acf?.make === make).length })),
            models: Array.from(new Set(response.data.map(v => v.acf?.model).filter(Boolean)))
              .map(model => ({ name: model!, count: response.data.filter(v => v.acf?.model === model).length })),
            trims: Array.from(new Set(response.data.map(v => v.acf?.trim).filter(Boolean)))
              .map(trim => ({ name: trim!, count: response.data.filter(v => v.acf?.trim === trim).length })),
            conditions: Array.from(new Set(response.data.map(v => v.acf?.condition).filter(Boolean)))
              .map(condition => ({ name: condition!, count: response.data.filter(v => v.acf?.condition === condition).length })),
            vehicleTypes: Array.from(new Set(response.data.map(v => v.acf?.body_style || v.acf?.body_type).filter(Boolean)))
              .map(type => ({ name: type!, count: response.data.filter(v => (v.acf?.body_style || v.acf?.body_type) === type).length })),
            driveTypes: Array.from(new Set(response.data.map(v => v.acf?.drivetrain || v.acf?.drive_type).filter(Boolean)))
              .map(drive => ({ name: drive!, count: response.data.filter(v => (v.acf?.drivetrain || v.acf?.drive_type) === drive).length })),
            transmissions: Array.from(new Set(response.data.map(v => v.acf?.transmission).filter(Boolean)))
              .map(trans => ({ name: trans!, count: response.data.filter(v => v.acf?.transmission === trans).length })),
            exteriorColors: Array.from(new Set(response.data.map(v => v.acf?.exterior_color).filter(Boolean)))
              .map(color => ({ name: color!, count: response.data.filter(v => v.acf?.exterior_color === color).length })),
            interiorColors: Array.from(new Set(response.data.map(v => v.acf?.interior_color).filter(Boolean)))
              .map(color => ({ name: color!, count: response.data.filter(v => v.acf?.interior_color === color).length })),
            sellerTypes: Array.from(new Set(response.data.map(v => v.acf?.account_type_seller).filter(Boolean)))
              .map(type => ({ name: type!, count: response.data.filter(v => v.acf?.account_type_seller === type).length })),
            dealers: Array.from(new Set(response.data.map(v => v.acf?.account_name_seller).filter(Boolean)))
              .map(dealer => ({ name: dealer!, count: response.data.filter(v => v.acf?.account_name_seller === dealer).length })),
            states: Array.from(new Set(response.data.map(v => v.acf?.state_seller).filter(Boolean)))
              .map(state => ({ name: state!, count: response.data.filter(v => v.acf?.state_seller === state).length })),
            cities: Array.from(new Set(response.data.map(v => v.acf?.city_seller).filter(Boolean)))
              .map(city => ({ name: city!, count: response.data.filter(v => v.acf?.city_seller === city).length })),
            totalVehicles: response.pagination?.total || 0
          },
          dealers: []
        }
      };

      if (import.meta.env.DEV) {
        console.log("🚀 COMBINED API Response:", {
          success: data.success,
          vehiclesCount: data.data?.vehicles?.length,
          filtersCount: Object.keys(data.data?.filters || {}).length,
          dealersCount: data.data?.dealers?.length,
          meta: data.data?.meta
        });
      }

      if (data.success) {
        // Cache combined response
        const cacheTTL = import.meta.env.DEV ? 30 * 1000 : 1 * 60 * 1000;
        apiCache.set(cacheKey, data, cacheTTL);

        // Set all data from combined response
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
        setAvailableDealers(data.data.dealers || []);
        setVehicleTypes(data.data.filters?.vehicleTypes || []);

        // Force update of totalResults and loading state
        setLoading(false);

        if (import.meta.env.DEV) {
          console.log("✅ COMBINED: Successfully loaded all data in one call", {
            vehiclesCount: data.data.vehicles?.length || 0,
            totalRecords: data.data.meta?.totalRecords || 0,
            filtersCount: Object.keys(data.data.filters || {}).length
          });
        }
      } else {
        throw new Error(data.message || "Combined API returned error");
      }

      PerformanceMonitor.endMeasure('fetchCombinedData');
    } catch (err) {
      cleanup();

      if (abortControllerRef.current !== requestController || !isMountedRef.current) {
        console.log("🚫 Ignoring combined error from superseded request");
        return;
      }

      if (err instanceof Error && err.name === "AbortError") {
        if (import.meta.env.DEV) {
          console.log("🚫 Combined request aborted (expected behavior)");
        }
        if (abortControllerRef.current === requestController) {
          abortControllerRef.current = null;
        }
        // Clear loading state if this was the active request
        if (abortControllerRef.current === requestController || abortControllerRef.current === null) {
          setLoading(false);
        }
        return;
      }

      if (import.meta.env.DEV) {
        console.error("�� Combined fetch error:", err);
      }

      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null;
      }

      // Retry logic for network failures
      if (err instanceof TypeError && err.message.includes("Failed to fetch") && retryCount < 2) {
        if (import.meta.env.DEV) {
          console.log(`🔄 Retrying combined request (attempt ${retryCount + 1}/3)...`);
        }
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          if (abortControllerRef.current === requestController || abortControllerRef.current === null) {
            fetchCombinedData(retryCount + 1);
          }
        }, delay);
        return;
      }

      // Set error state
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError("Unable to connect to vehicle database. Check your internet connection and try refreshing the page.");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred while loading data.");
      }

      // Set empty state
      setVehicles([]);
      setApiResponse({
        success: false,
        data: [],
        message: "No data available",
        meta: {
          totalRecords: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 20,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    } finally {
      if ((abortControllerRef.current === requestController || abortControllerRef.current === null) && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiParams]);

  // LEGACY: Keep original fetchVehicles for compatibility (now calls combined)
  const fetchVehicles = useCallback(async (retryCount = 0) => {
    // Just call the combined data fetch for consistency
    return fetchCombinedData(retryCount);
  }, [fetchCombinedData]);

  // Cleanup effect to abort pending requests on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      if (import.meta.env.DEV) {
        console.log("�� Component unmounting - cleaning up requests");
      }
      isMountedRef.current = false;

      // Safe cleanup of abort controller
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        try {
          abortControllerRef.current.abort();
          if (import.meta.env.DEV) {
            console.log("🧹 Pending request aborted on unmount");
          }
        } catch (err) {
          // Ignore errors during cleanup - this is expected
          if (import.meta.env.DEV) {
            console.log("🧹 Cleanup abort handled:", err?.message);
          }
        }
      }
      abortControllerRef.current = null;
    };
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("carzino_favorites") || "{}",
    );
    setFavorites(savedFavorites);
  }, []);

  // Initialize filters from URL
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(location.pathname);

    // Only update if we're on the cars-for-sale route and have filters
    if (
      location.pathname.startsWith("/cars-for-sale") &&
      (urlFilters.make ||
        urlFilters.model ||
        urlFilters.trim ||
        urlFilters.condition ||
        urlFilters.year ||
        urlFilters.bodyStyle)
    ) {
      setAppliedFilters((prev) => ({
        ...prev,
        make: urlFilters.make ? [normalizeFilterValue(urlFilters.make)] : [],
        model: urlFilters.model ? [normalizeFilterValue(urlFilters.model)] : [],
        trim: urlFilters.trim ? [normalizeFilterValue(urlFilters.trim)] : [],
        condition: urlFilters.condition
          ? [normalizeFilterValue(urlFilters.condition)]
          : [],
        year: urlFilters.year ? [urlFilters.year] : [],
        bodyStyle: urlFilters.bodyStyle
          ? [normalizeFilterValue(urlFilters.bodyStyle)]
          : [],
      }));
    }
  }, [location.pathname]);

  // Function to update URL when filters change
  const updateURLFromFilters = useCallback(
    (newFilters: typeof appliedFilters) => {
      // Only generate URL for main filter categories (not price, payment, etc.)
      const urlFilters = {
        make: newFilters.make,
        model: newFilters.model,
        trim: newFilters.trim,
        condition: newFilters.condition,
        year: newFilters.year.length > 0 ? newFilters.year[0] : undefined,
        bodyStyle:
          newFilters.bodyStyle.length > 0 ? newFilters.bodyStyle[0] : undefined,
      };

      const newURL = generateURLFromFilters(urlFilters);

      // Only navigate if we're changing the URL structure
      if (
        location.pathname !== newURL &&
        (urlFilters.make?.length ||
          urlFilters.model?.length ||
          urlFilters.trim?.length ||
          urlFilters.condition?.length ||
          urlFilters.year ||
          urlFilters.bodyStyle?.length)
      ) {
        navigate(newURL, { replace: true });
      }
    },
    [navigate, location.pathname],
  );

  // Performance: Fetch combined data when memoized parameters change
  useEffect(() => {
    if (!isMountedRef.current) return;

    fetchCombinedData();
  }, [fetchCombinedData]);

  // Safety mechanism: Force clear loading state after 15 seconds on mobile
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading && import.meta.env.DEV) {
          console.warn("⚠️ Loading timeout - forcing loading state to false");
          setLoading(false);
        }
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Cleanup effect to abort any pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Geocode ZIP code when it changes (with debouncing)
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (zipCode && zipCode.length >= 5) {
        const location = await geocodeZip(zipCode);
        setUserLocation(location);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(debounceTimer);
  }, [zipCode]);

  // No automatic location initialization - users must enter their own ZIP code

  // Vehicle type images - using emoji/icon-based approach for better UX
  useEffect(() => {
    // Use placeholders for all vehicle types as requested by user
    const vehicleImageMap = {
      // Cars and Sedans
      "Car": "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center",
      "Cars": "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center",
      "Sedan": "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center",
      "Sedans": "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center",

      // SUVs and Crossovers
      "SUV": "🚙",
      "SUVs": "🚙",
      "Crossover": "🚙",
      "Crossovers": "🚙",
      "Crossover/SUV": "🚙",
      "SUV / Crossover": "🚙",
      "SUV/Crossover": "����",
      "Sport Utility Vehicle": "🚙",

      // Trucks
      "Truck": "🚚",
      "Trucks": "🚚",
      "Pickup": "🚚",
      "Pickup Truck": "🚚",
      "Crew Cab Truck": "🚚",
      "Regular Cab Truck": "��",
      "Extended Cab Truck": "🚚",
      "Full Size Truck": "🚚",
      "Compact Truck": "��",

      // Sports Cars and Coupes
      "Coupe": "🏎️",
      "Coupes": "🏎️",
      "Sports Car": "🏎️",
      "Sports Cars": "🏎️",
      "Convertible": "🏎️",
      "Convertibles": "🏎️",
      "Roadster": "🏎️",

      // Hatchbacks and Compacts
      "Hatchback": "🚗",
      "Hatchbacks": "🚗",
      "Compact": "🚗",
      "Compact Car": "🚗",

      // Vans and Minivans
      "Van": "🚐",
      "Vans": "🚐",
      "Minivan": "🚐",
      "Minivans": "🚐",
      "Van / Minivan": "🚐",
      "Cargo Van": "🚐",
      "Passenger Van": "🚐",

      // Wagons
      "Wagon": "🚗",
      "Wagons": "🚗",
      "Station Wagon": "🚗",

      // Motorcycles
      "Motorcycle": "🏍️",
      "Motorcycles": "🏍️",
      "Bike": "🏍️",

      // RVs and Large Vehicles
      "RV": "🚐",
      "RVs": "🚐",
      "Motorhome": "🚐",
      "Recreational Vehicle": "🚐"
    };

    console.log("🖼️ Setting up vehicle type images mapping...");
    setVehicleImages(vehicleImageMap);
  }, []);

  // REMOVED: Dealers now fetched via combined endpoint for better performance

  // Update filter options based on current selections (conditional filtering)
  // This needs to call the API to get proper conditional filter counts
  const fetchFilterOptions = useCallback(async (currentFilters = debouncedAppliedFilters, forceRefresh = false) => {
    if (!isMountedRef.current) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log("🔄 Fetching conditional filter options with filters:", currentFilters);
    }

    try {
      // Build WordPress API filters from current applied filters to get conditional counts
      const wpFilters: WordPressVehicleFilters = {
        page: 1,
        per_page: 1000, // Get all vehicles to calculate proper filter counts
      };

      // Add current filters to get conditional options
      if (currentFilters.make && currentFilters.make.length > 0) {
        wpFilters.make = currentFilters.make.join(','); // WordPress API can handle multiple makes
      }
      if (currentFilters.model && currentFilters.model.length > 0) {
        wpFilters.model = currentFilters.model.join(',');
      }
      if (currentFilters.condition && currentFilters.condition.length > 0) {
        wpFilters.condition = currentFilters.condition.join(',');
      }
      if (currentFilters.priceMin) {
        wpFilters.min_price = parseInt(currentFilters.priceMin.replace(/[^\d]/g, ''));
      }
      if (currentFilters.priceMax) {
        wpFilters.max_price = parseInt(currentFilters.priceMax.replace(/[^\d]/g, ''));
      }
      if (currentFilters.paymentMin) {
        wpFilters.min_payment = parseInt(currentFilters.paymentMin.replace(/[^\d]/g, ''));
      }
      if (currentFilters.paymentMax) {
        wpFilters.max_payment = parseInt(currentFilters.paymentMax.replace(/[^\d]/g, ''));
      }

      const response: WordPressVehiclesResponse = await wordpressCustomApi.getVehicles(
        1,
        1000, // Get all to calculate filter counts
        wpFilters
      );

      if (!response.success) {
        if (import.meta.env.DEV) {
          console.warn("❌ Filter options API call failed:", response.message);
        }
        return;
      }

      // Calculate filter options from all vehicles matching current filters
      const allVehicles = response.data;
      const updatedOptions = {
        makes: Array.from(new Set(allVehicles.map(v => v.acf?.make).filter(Boolean)))
          .map(make => ({ name: make!, count: allVehicles.filter(v => v.acf?.make === make).length }))
          .sort((a, b) => b.count - a.count),
        models: Array.from(new Set(allVehicles.map(v => v.acf?.model).filter(Boolean)))
          .map(model => ({ name: model!, count: allVehicles.filter(v => v.acf?.model === model).length }))
          .sort((a, b) => b.count - a.count),
        trims: Array.from(new Set(allVehicles.map(v => v.acf?.trim).filter(Boolean)))
          .map(trim => ({ name: trim!, count: allVehicles.filter(v => v.acf?.trim === trim).length }))
          .sort((a, b) => b.count - a.count),
        conditions: Array.from(new Set(allVehicles.map(v => v.acf?.condition).filter(Boolean)))
          .map(condition => ({ name: condition!, count: allVehicles.filter(v => v.acf?.condition === condition).length }))
          .sort((a, b) => b.count - a.count),
        vehicleTypes: Array.from(new Set(allVehicles.map(v => v.acf?.body_style || v.acf?.body_type).filter(Boolean)))
          .map(type => ({ name: type!, count: allVehicles.filter(v => (v.acf?.body_style || v.acf?.body_type) === type).length }))
          .sort((a, b) => b.count - a.count),
        driveTypes: Array.from(new Set(allVehicles.map(v => v.acf?.drivetrain || v.acf?.drive_type).filter(Boolean)))
          .map(drive => ({ name: drive!, count: allVehicles.filter(v => (v.acf?.drivetrain || v.acf?.drive_type) === drive).length }))
          .sort((a, b) => b.count - a.count),
        transmissions: Array.from(new Set(allVehicles.map(v => v.acf?.transmission).filter(Boolean)))
          .map(trans => ({ name: trans!, count: allVehicles.filter(v => v.acf?.transmission === trans).length }))
          .sort((a, b) => b.count - a.count),
        exteriorColors: Array.from(new Set(allVehicles.map(v => v.acf?.exterior_color).filter(Boolean)))
          .map(color => ({ name: color!, count: allVehicles.filter(v => v.acf?.exterior_color === color).length }))
          .sort((a, b) => b.count - a.count),
        interiorColors: Array.from(new Set(allVehicles.map(v => v.acf?.interior_color).filter(Boolean)))
          .map(color => ({ name: color!, count: allVehicles.filter(v => v.acf?.interior_color === color).length }))
          .sort((a, b) => b.count - a.count),
        sellerTypes: Array.from(new Set(allVehicles.map(v => v.acf?.account_type_seller).filter(Boolean)))
          .map(type => ({ name: type!, count: allVehicles.filter(v => v.acf?.account_type_seller === type).length }))
          .sort((a, b) => b.count - a.count),
        dealers: Array.from(new Set(allVehicles.map(v => v.acf?.account_name_seller).filter(Boolean)))
          .map(dealer => ({ name: dealer!, count: allVehicles.filter(v => v.acf?.account_name_seller === dealer).length }))
          .sort((a, b) => b.count - a.count),
        states: Array.from(new Set(allVehicles.map(v => v.acf?.state_seller).filter(Boolean)))
          .map(state => ({ name: state!, count: allVehicles.filter(v => v.acf?.state_seller === state).length }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        cities: Array.from(new Set(allVehicles.map(v => v.acf?.city_seller).filter(Boolean)))
          .map(city => ({ name: city!, count: allVehicles.filter(v => v.acf?.city_seller === city).length }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        totalVehicles: allVehicles.length
      };

      setFilterOptions(updatedOptions);
      setVehicleTypes(updatedOptions.vehicleTypes);
      setAvailableDealers(updatedOptions.dealers);

      if (import.meta.env.DEV) {
        console.log("🔄 Updated conditional filters via API:", {
          totalVehicles: allVehicles.length,
          makes: updatedOptions.makes.length,
          models: updatedOptions.models.length,
          dealers: updatedOptions.dealers.length
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("❌ Error fetching filter options:", error);
      }
      // Fall back to local filtering if API fails
      const filteredVehicles = vehicles.filter(v => {
        if (currentFilters.make && currentFilters.make.length > 0 && !currentFilters.make.includes(v.make)) return false;
        if (currentFilters.model && currentFilters.model.length > 0 && !currentFilters.model.includes(v.model)) return false;
        if (currentFilters.condition && currentFilters.condition.length > 0 && !currentFilters.condition.includes(v.condition)) return false;
        return true;
      });

      const fallbackOptions = {
        makes: Array.from(new Set(filteredVehicles.map(v => v.make).filter(Boolean)))
          .map(make => ({ name: make!, count: filteredVehicles.filter(v => v.make === make).length }))
          .sort((a, b) => b.count - a.count),
        models: Array.from(new Set(filteredVehicles.map(v => v.model).filter(Boolean)))
          .map(model => ({ name: model!, count: filteredVehicles.filter(v => v.model === model).length }))
          .sort((a, b) => b.count - a.count),
        trims: Array.from(new Set(filteredVehicles.map(v => v.trim).filter(Boolean)))
          .map(trim => ({ name: trim!, count: filteredVehicles.filter(v => v.trim === trim).length }))
          .sort((a, b) => b.count - a.count),
        conditions: Array.from(new Set(filteredVehicles.map(v => v.condition).filter(Boolean)))
          .map(condition => ({ name: condition!, count: filteredVehicles.filter(v => v.condition === condition).length }))
          .sort((a, b) => b.count - a.count),
        vehicleTypes: Array.from(new Set(filteredVehicles.map(v => v.body_style).filter(Boolean)))
          .map(type => ({ name: type!, count: filteredVehicles.filter(v => v.body_style === type).length }))
          .sort((a, b) => b.count - a.count),
        driveTypes: Array.from(new Set(filteredVehicles.map(v => v.drivetrain).filter(Boolean)))
          .map(drive => ({ name: drive!, count: filteredVehicles.filter(v => v.drivetrain === drive).length }))
          .sort((a, b) => b.count - a.count),
        transmissions: Array.from(new Set(filteredVehicles.map(v => v.transmission).filter(Boolean)))
          .map(trans => ({ name: trans!, count: filteredVehicles.filter(v => v.transmission === trans).length }))
          .sort((a, b) => b.count - a.count),
        exteriorColors: Array.from(new Set(filteredVehicles.map(v => v.exterior_color_generic).filter(Boolean)))
          .map(color => ({ name: color!, count: filteredVehicles.filter(v => v.exterior_color_generic === color).length }))
          .sort((a, b) => b.count - a.count),
        interiorColors: Array.from(new Set(filteredVehicles.map(v => v.interior_color_generic).filter(Boolean)))
          .map(color => ({ name: color!, count: filteredVehicles.filter(v => v.interior_color_generic === color).length }))
          .sort((a, b) => b.count - a.count),
        sellerTypes: Array.from(new Set(filteredVehicles.map(v => v.seller_type).filter(Boolean)))
          .map(type => ({ name: type!, count: filteredVehicles.filter(v => v.seller_type === type).length }))
          .sort((a, b) => b.count - a.count),
        dealers: Array.from(new Set(filteredVehicles.map(v => v.dealer).filter(Boolean)))
          .map(dealer => ({ name: dealer!, count: filteredVehicles.filter(v => v.dealer === dealer).length }))
          .sort((a, b) => b.count - a.count),
        states: Array.from(new Set(filteredVehicles.map(v => v.state_seller).filter(Boolean)))
          .map(state => ({ name: state!, count: filteredVehicles.filter(v => v.state_seller === state).length }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        cities: Array.from(new Set(filteredVehicles.map(v => v.city_seller).filter(Boolean)))
          .map(city => ({ name: city!, count: filteredVehicles.filter(v => v.city_seller === city).length }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        totalVehicles: filteredVehicles.length
      };

      setFilterOptions(fallbackOptions);
      setVehicleTypes(fallbackOptions.vehicleTypes);
      setAvailableDealers(fallbackOptions.dealers);
    }
  }, [debouncedAppliedFilters, vehicles]);

  // Load initial data on component mount - OPTIMIZED: Single combined call
  useEffect(() => {
    if (isMountedRef.current) {
      if (import.meta.env.DEV) {
        console.log("🚀 Component mounted - starting COMBINED data load");
        console.log("📊 Initial state:", {
          appliedFilters,
          searchTerm,
          currentPage,
          loading
        });
      }
      // PERFORMANCE: Single call instead of 3 separate calls
      fetchCombinedData();
    }
  }, [fetchCombinedData]);

  // Performance: Only re-fetch filter options when filters change (reduced debounce)
  const filterChangeDebounced = useDebounce(appliedFilters, 500); // 500ms debounce

  useEffect(() => {
    // Only re-fetch if we have some filters applied and component is mounted
    const hasFilters = Object.values(filterChangeDebounced).some(filter =>
      Array.isArray(filter) ? filter.length > 0 : Boolean(filter)
    );

    if (hasFilters && isMountedRef.current) {
      if (import.meta.env.DEV) {
        console.log("🔄 Filters changed, re-fetching conditional filter options...");
      }
      fetchFilterOptions(filterChangeDebounced);
    }
  }, [filterChangeDebounced, fetchFilterOptions]);

  // Helper functions for price formatting
  const formatPrice = (value: string): string => {
    // Remove non-numeric characters except decimal points
    const numericValue = value.replace(/[^\d]/g, "");
    if (!numericValue) return "";
    // Add commas for thousands
    return parseInt(numericValue).toLocaleString();
  };

  const unformatPrice = (value: string): string => {
    // Remove commas and return clean number string
    return value.replace(/,/g, "");
  };

  // Helper functions - exactly like original
  const saveFavorites = (newFavorites: { [key: number]: Vehicle }) => {
    setFavorites(newFavorites);
    localStorage.setItem("carzino_favorites", JSON.stringify(newFavorites));
  };

  const isFavorited = (vehicleId: number): boolean => {
    return !!favorites[vehicleId];
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

  const toggleFilter = (filterName: string) => {
    setCollapsedFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  const removeAppliedFilter = (category: string, value: string) => {
    const newFilters = {
      ...appliedFilters,
      [category]: (
        appliedFilters[category as keyof typeof appliedFilters] as string[]
      ).filter((item: string) => item !== value),
    };
    setAppliedFilters(newFilters);

    // Update URL if main filter categories changed
    if (
      [
        "make",
        "model",
        "trim",
        "condition",
        "year",
        "bodyStyle",
        "transmission",
      ].includes(category)
    ) {
      updateURLFromFilters(newFilters);
    }
  };

  const clearAllFilters = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log("🧹 Clearing all filters and resetting state");
    }

    // Reset all filter-related state
    setSearchTerm("");
    setUnifiedSearch("");
    setZipCode(""); // Reset ZIP code
    setRadius("200"); // Reset to default radius
    setAppliedLocation(null);
    setAppliedRadius("200");

    // Reset all applied filters
    const emptyFilters = {
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
    };

    setAppliedFilters(emptyFilters);

    // Reset Show More state for Make filter
    setShowAllMakes(false);

    // Reset price and payment input fields
    setPriceMin("10000");
    setPriceMax("100000");
    setPaymentMin("100");
    setPaymentMax("2000");
    setTermLength("60");
    setInterestRate("5");
    setDownPayment("2000");
    setCurrentPage(1);

    // Reset URL to base cars-for-sale path
    if (location.pathname.startsWith("/cars-for-sale")) {
      navigate("/cars-for-sale/", { replace: true });
    }

    // Critical fix: Reset filter options to empty state first, then force refresh
    apiCache.clear(); // Clear cache to ensure fresh data

    // Reset filter options to empty state immediately
    setFilterOptions({
      makes: [], models: [], trims: [], conditions: [],
      vehicleTypes: [], driveTypes: [], transmissions: [],
      exteriorColors: [], interiorColors: [], sellerTypes: [],
      dealers: [], states: [], cities: [], totalVehicles: 0
    });

    if (import.meta.env.DEV) {
      console.log("🔄 Clearing all filter state and refreshing with COMBINED endpoint...");
    }

    // PERFORMANCE: Use combined endpoint to get fresh vehicles + filters + dealers
    if (isMountedRef.current) {
      fetchCombinedData(); // Single call instead of separate filter fetch
    }

    if (import.meta.env.DEV) {
      console.log("✅ All filters cleared successfully");
    }
  }, [location.pathname, navigate, fetchFilterOptions]);

  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Apply payment filters handler
  const applyPaymentFilters = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log("💰 Applying payment filters:", {
        paymentMin,
        paymentMax,
        currentAppliedPaymentMin: appliedFilters.paymentMin,
        currentAppliedPaymentMax: appliedFilters.paymentMax
      });
    }

    // Only apply if values have actually changed
    const newPaymentMin = paymentMin.trim();
    const newPaymentMax = paymentMax.trim();

    if (newPaymentMin !== (appliedFilters.paymentMin || "") ||
        newPaymentMax !== (appliedFilters.paymentMax || "")) {

      setAppliedFilters((prev) => {
        const newFilters = {
          ...prev,
          paymentMin: newPaymentMin,
          paymentMax: newPaymentMax,
        };
        if (import.meta.env.DEV) {
          console.log("💰 Payment filters state updated:", newFilters);
        }
        return newFilters;
      });

      setCurrentPage(1); // Reset to first page when applying filters
      if (import.meta.env.DEV) {
        console.log("✅ Payment filters applied - vehicles will re-fetch with payment range");
      }
    } else if (import.meta.env.DEV) {
      console.log("💰 Payment filters unchanged, skipping update");
    }
  }, [paymentMin, paymentMax, termLength, interestRate, downPayment, appliedFilters.paymentMin, appliedFilters.paymentMax]);

  // Apply location filters handler
  const applyLocationFilters = () => {
    setAppliedLocation(userLocation);
    setAppliedRadius(radius);
    setCurrentPage(1); // Reset to first page when applying filters
  };

  // Parse unified search query and extract vehicle attributes
  const parseUnifiedSearch = (query: string) => {
    const words = query.toLowerCase().trim().split(/\s+/);
    const filters: any = {};

    // Known makes (you can expand this list)
    const makes = [
      "toyota",
      "honda",
      "ford",
      "chevrolet",
      "nissan",
      "bmw",
      "audi",
      "mercedes",
      "lexus",
      "infiniti",
      "acura",
      "cadillac",
      "buick",
      "gmc",
      "jeep",
      "ram",
      "dodge",
      "chrysler",
      "hyundai",
      "kia",
      "subaru",
      "mazda",
      "mitsubishi",
      "volvo",
      "land rover",
      "jaguar",
      "porsche",
      "ferrari",
      "lamborghini",
      "maserati",
      "bentley",
      "rolls-royce",
      "tesla",
      "lucid",
      "rivian",
    ];

    // Known conditions
    const conditions = ["new", "used", "certified"];

    // Known body styles
    const bodyStyles = [
      "sedan",
      "suv",
      "coupe",
      "convertible",
      "hatchback",
      "truck",
      "wagon",
      "van",
    ];

    // Extract year (4-digit number)
    const yearMatch = query.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      filters.year = [yearMatch[0]];
    }

    // Extract make
    const foundMake = words.find((word) => makes.includes(word));
    if (foundMake) {
      filters.make = [foundMake.charAt(0).toUpperCase() + foundMake.slice(1)];
    }

    // Extract condition
    const foundCondition = words.find((word) => conditions.includes(word));
    if (foundCondition) {
      filters.condition = [
        foundCondition.charAt(0).toUpperCase() + foundCondition.slice(1),
      ];
    }

    // Extract body style
    const foundBodyStyle = words.find((word) => bodyStyles.includes(word));
    if (foundBodyStyle) {
      filters.bodyStyle = [
        foundBodyStyle.charAt(0).toUpperCase() + foundBodyStyle.slice(1),
      ];
    }

    // For model and trim, try to identify them by position or common patterns
    // This is a simplified approach - you might want to add more sophisticated logic
    if (foundMake) {
      const makeIndex = words.indexOf(foundMake.toLowerCase());
      if (makeIndex >= 0 && makeIndex + 1 < words.length) {
        const nextWord = words[makeIndex + 1];
        // If next word is not a condition, year, or body style, it's likely a model
        if (
          !conditions.includes(nextWord) &&
          !bodyStyles.includes(nextWord) &&
          !/^\d{4}$/.test(nextWord)
        ) {
          filters.model = [
            nextWord.charAt(0).toUpperCase() + nextWord.slice(1),
          ];

          // Check for trim after model
          if (makeIndex + 2 < words.length) {
            const trimWord = words[makeIndex + 2];
            if (
              !conditions.includes(trimWord) &&
              !bodyStyles.includes(trimWord) &&
              !/^\d{4}$/.test(trimWord)
            ) {
              filters.trim = [trimWord.toUpperCase()]; // Trims are often uppercase (SE, EX, etc.)
            }
          }
        }
      }
    }

    return filters;
  };

  // Handle unified search submission
  const handleUnifiedSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!unifiedSearch.trim()) return;

    // Parse the unified search query
    const parsedFilters = parseUnifiedSearch(unifiedSearch);

    // Generate URL and navigate
    const searchURL = generateURLFromFilters({
      make: parsedFilters.make,
      model: parsedFilters.model,
      trim: parsedFilters.trim,
      condition: parsedFilters.condition,
      year: parsedFilters.year?.[0],
      bodyStyle: parsedFilters.bodyStyle?.[0],
    });

    // Update applied filters to match the search
    setAppliedFilters((prev) => ({
      ...prev,
      make: parsedFilters.make || [],
      model: parsedFilters.model || [],
      trim: parsedFilters.trim || [],
      condition: parsedFilters.condition || [],
      year: parsedFilters.year || [],
      bodyStyle: parsedFilters.bodyStyle || [],
    }));

    // Navigate to the generated URL
    navigate(searchURL);

    // Clear the search input
    setUnifiedSearch("");

    // Close mobile filter panel after search
    setMobileFiltersOpen(false);
  };

  // Geocoding function to convert ZIP to lat/lng using optimized backend
  const geocodeZip = async (
    zip: string,
  ): Promise<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null> => {
    if (!zip || zip.length < 5) return null;

    // Don't proceed if component is unmounted
    if (!isMountedRef.current) {
      console.log("🚫 Component unmounted, skipping geocoding");
      return null;
    }

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setIsGeocodingLoading(true);

      // Call our geocoding API with proper error handling
      const apiUrl = `${getApiBaseUrl()}/api/geocode/${zip}`;
      console.log("🔍 Geocoding ZIP:", zip, "using:", apiUrl);

      const controller = new AbortController();

      if (isMountedRef.current) {
        timeoutId = setTimeout(() => {
          if (!controller.signal.aborted && isMountedRef.current) {
            try {
              controller.abort();
            } catch (err) {
              // Ignore timeout abort errors
              if (import.meta.env.DEV) {
                console.log("⏰ Geocoding timeout abort handled:", err?.message);
              }
            }
          }
        }, 10000); // 10 second timeout
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log("🚫 Component unmounted during geocoding");
        return null;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log(
            `�� Geocoded ${zip} to ${result.data.city}, ${result.data.state}`,
          );
          return {
            lat: result.data.lat,
            lng: result.data.lng,
            city: result.data.city,
            state: result.data.state,
          };
        } else {
          console.warn(`❌ Geocoding failed for ${zip}: ${result.message}`);
        }
      } else if (response.status === 404) {
        try {
          const errorResult = await response.json();
          console.warn(`❌ ZIP ${zip} not found: ${errorResult.message}`);
        } catch {
          console.warn(`�� ZIP ${zip} not found`);
        }
      } else {
        console.error(
          `❌ Geocoding API error: ${response.status} ${response.statusText}`,
        );
      }

      return null;
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log("🚫 Ignoring geocoding error from unmounted component");
        return null;
      }

      // Handle AbortError gracefully
      if (error instanceof Error && error.name === "AbortError") {
        if (import.meta.env.DEV) {
          console.log("🚫 Geocoding request aborted (expected behavior)");
        }
        return null;
      }

      console.error("❌ Geocoding network error:", error);

      // Always use fallback for any network error
      if (
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        console.log("🔄 Using fallback coordinates due to network error");
        const zipCoordinates: {
          [key: string]: {
            lat: number;
            lng: number;
            city: string;
            state: string;
          };
        } = {
          "98498": {
            lat: 47.0379,
            lng: -122.9015,
            city: "Lakewood",
            state: "WA",
          },
          "98468": {
            lat: 47.0379,
            lng: -122.9015,
            city: "Lakewood",
            state: "WA",
          },
          "90210": {
            lat: 34.0901,
            lng: -118.4065,
            city: "Beverly Hills",
            state: "CA",
          },
          "10001": {
            lat: 40.7505,
            lng: -73.9934,
            city: "New York",
            state: "NY",
          },
          "60601": {
            lat: 41.8781,
            lng: -87.6298,
            city: "Chicago",
            state: "IL",
          },
          "75001": {
            lat: 32.9483,
            lng: -96.7299,
            city: "Addison",
            state: "TX",
          },
          "33101": { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL" },
          "85001": {
            lat: 33.4484,
            lng: -112.074,
            city: "Phoenix",
            state: "AZ",
          },
          "97201": {
            lat: 45.5152,
            lng: -122.6784,
            city: "Portland",
            state: "OR",
          },
          "02101": { lat: 42.3601, lng: -71.0589, city: "Boston", state: "MA" },
        };

        const coords = zipCoordinates[zip];
        if (coords) {
          console.warn(`🆘 Using fallback coordinates for ZIP: ${zip}`);
          return coords;
        }

        // If ZIP not in our fallback list, use a default location
        console.warn(`🆘 Using default coordinates for unknown ZIP: ${zip}`);
        return {
          lat: 39.8283,
          lng: -98.5795,
          city: "Geographic Center",
          state: "US",
        };
      }

      return null;
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setIsGeocodingLoading(false);
      }
    }
  };

  // Vehicle type toggle handler
  const toggleVehicleType = (type: string) => {
    setAppliedFilters(prev => ({
      ...prev,
      vehicleType: prev.vehicleType.includes(type)
        ? prev.vehicleType.filter(t => t !== type)
        : [...prev.vehicleType, type]
    }));
    setCurrentPage(1);
  };

  // Color data for filters
  const exteriorColors = [
    { name: "Black", color: "#000000", count: 8234 },
    { name: "White", color: "#FFFFFF", count: 7456 },
    { name: "Silver", color: "#C0C0C0", count: 6789 },
    { name: "Gray", color: "#808080", count: 5234 },
    { name: "Blue", color: "#0000FF", count: 4567 },
    { name: "Red", color: "#FF0000", count: 3456 },
  ];

  const interiorColors = [
    { name: "Black", color: "#000000", count: 12456 },
    { name: "Gray", color: "#808080", count: 8234 },
    { name: "Beige", color: "#F5F5DC", count: 6789 },
    { name: "Brown", color: "#8B4513", count: 4567 },
  ];

  // Color swatch component
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
      <input
        type="checkbox"
        className="mr-2"
        checked={appliedFilters.exteriorColor.includes(name)}
        onChange={(e) => {
          e.stopPropagation();
          if (e.target.checked) {
            setAppliedFilters((prev) => ({
              ...prev,
              exteriorColor: [...prev.exteriorColor, name],
            }));
          } else {
            removeAppliedFilter("exteriorColor", name);
          }
        }}
      />
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

        /* Ensure checkbox visual state is properly maintained */
        input[type="checkbox"]:focus {
          outline: 2px solid #dc2626;
          outline-offset: 2px;
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
            padding-bottom: 120px !important; /* Extra space for fixed action buttons */
          }

          .mobile-action-buttons {
            position: fixed !important;
            position: -webkit-fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 60 !important;
            background: white !important;
            padding: 16px !important;
            padding-bottom: calc(16px + env(safe-area-inset-bottom)) !important;
            box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.15) !important;
            border-top: 1px solid #e5e7eb !important;
            -webkit-transform: translateZ(0) !important;
            transform: translateZ(0) !important;
            min-height: 80px !important;
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

        {/* Sidebar - exactly like original */}
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

          <div className="p-4">
            {/* Search Section - Mobile Only */}
            <div className="lg:hidden mb-4 pb-4 border-b border-gray-200">
              <form onSubmit={handleUnifiedSearchSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Cars For Sale"
                    value={unifiedSearch}
                    onChange={(e) => setUnifiedSearch(e.target.value)}
                    className="carzino-search-input w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-[10px] sm:rounded-full overflow-hidden focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Applied Filters in Mobile Filter Panel */}
              {((appliedLocation && appliedRadius !== "nationwide") ||
                appliedFilters.condition.length > 0 ||
                appliedFilters.make.length > 0 ||
                appliedFilters.model.length > 0 ||
                appliedFilters.trim.length > 0 ||
                appliedFilters.year.length > 0 ||
                appliedFilters.bodyStyle.length > 0 ||
                appliedFilters.driveType.length > 0 ||
                appliedFilters.vehicleType.length > 0 ||
                appliedFilters.mileage ||
                appliedFilters.exteriorColor.length > 0 ||
                appliedFilters.interiorColor.length > 0 ||
                appliedFilters.sellerType.length > 0 ||
                appliedFilters.state.length > 0 ||
                appliedFilters.city.length > 0 ||
                appliedFilters.priceMin ||
                appliedFilters.priceMax ||
                appliedFilters.paymentMin ||
                appliedFilters.paymentMax) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs"
                  >
                    Clear All
                  </button>
                  {appliedLocation && appliedRadius !== "nationwide" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      <MapPin className="w-3 h-3" />
                      {appliedRadius} miles
                      <button
                        onClick={() => {
                          setAppliedLocation(null);
                          setAppliedRadius("200");
                        }}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
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
                      onClick={() => removeAppliedFilter("make", item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                      onClick={() => removeAppliedFilter("model", item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                  {appliedFilters.trim.map((item) => (
                    <span
                      key={item}
                      onClick={() => removeAppliedFilter("trim", item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("trim", item)}
                        className="ml-1 text-white"
                      >
                        ��
                      </button>
                    </span>
                  ))}
                  {appliedFilters.year.map((item) => (
                    <span
                      key={item}
                      onClick={() => removeAppliedFilter("year", item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("year", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.bodyStyle.map((item) => (
                    <span
                      key={item}
                      onClick={() => removeAppliedFilter("bodyStyle", item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("bodyStyle", item)}
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

            {/* Desktop Applied Filters */}
            {((appliedLocation && appliedRadius !== "nationwide") ||
              appliedFilters.condition.length > 0 ||
              appliedFilters.make.length > 0 ||
              appliedFilters.model.length > 0 ||
              appliedFilters.trim.length > 0 ||
              appliedFilters.year.length > 0 ||
              appliedFilters.bodyStyle.length > 0 ||
              appliedFilters.driveType.length > 0 ||
              appliedFilters.vehicleType.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.exteriorColor.length > 0 ||
              appliedFilters.interiorColor.length > 0 ||
              appliedFilters.sellerType.length > 0 ||
              appliedFilters.state.length > 0 ||
              appliedFilters.city.length > 0 ||
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
                  {appliedLocation && appliedRadius !== "nationwide" && (
                    <span
                      onClick={() => {
                        setAppliedLocation(null);
                        setAppliedRadius("200");
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      <MapPin className="w-3 h-3" />
                      {appliedRadius} miles
                      <button
                        onClick={() => {
                          setAppliedLocation(null);
                          setAppliedRadius("200");
                        }}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {appliedFilters.condition.map((item) => (
                    <span
                      key={item}
                      onClick={() => removeAppliedFilter("condition", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                      onClick={() => removeAppliedFilter("make", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                      onClick={() => removeAppliedFilter("model", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                      onClick={() => removeAppliedFilter("trim", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                  {appliedFilters.year.map((item) => (
                    <span
                      key={item}
                      onClick={() => removeAppliedFilter("year", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("year", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.bodyStyle.map((item) => (
                    <span
                      key={item}
                      onClick={() => removeAppliedFilter("bodyStyle", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("bodyStyle", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.vehicleType.map((item) => (
                    <span
                      key={item}
                      onClick={() => removeAppliedFilter("vehicleType", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                      onClick={() => removeAppliedFilter("driveType", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                      onClick={() => removeAppliedFilter("exteriorColor", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item} Color
                      <button
                        onClick={() =>
                          removeAppliedFilter("exteriorColor", item)
                        }
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.sellerType.map((item) => (
                    <span
                      key={item}
                      onClick={() => removeAppliedFilter("sellerType", item)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                      onClick={() =>
                        setAppliedFilters((prev) => ({
                          ...prev,
                          mileage: "",
                        }))
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {appliedFilters.mileage === "100001"
                        ? "100k+ miles"
                        : `Under ${parseInt(appliedFilters.mileage).toLocaleString()} mi`}
                      <button
                        onClick={() =>
                          setAppliedFilters((prev) => ({
                            ...prev,
                            mileage: "",
                          }))
                        }
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(appliedFilters.priceMin || appliedFilters.priceMax) && (
                    <span
                      onClick={() => {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          priceMin: "",
                          priceMax: "",
                        }));
                        setPriceMin("10000");
                        setPriceMax("100000");
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />$
                      {appliedFilters.priceMin || "0"} - $
                      {appliedFilters.priceMax || "Any"}
                      <button
                        onClick={() => {
                          setAppliedFilters((prev) => ({
                            ...prev,
                            priceMin: "",
                            priceMax: "",
                          }));
                          setPriceMin("10000");
                          setPriceMax("100000");
                        }}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(appliedFilters.paymentMin || appliedFilters.paymentMax) && (
                    <span
                      onClick={() =>
                        setAppliedFilters((prev) => ({
                          ...prev,
                          paymentMin: "",
                          paymentMax: "",
                        }))
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                    >
                      <Check className="w-3 h-3 text-red-600" />$
                      {appliedFilters.paymentMin || "0"}-$
                      {appliedFilters.paymentMax || "Any"}/mo
                      <button
                        onClick={() =>
                          setAppliedFilters((prev) => ({
                            ...prev,
                            paymentMin: "",
                            paymentMax: "",
                          }))
                        }
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

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

            {/* Make Filter */}
            <FilterSection
              title="Make"
              isCollapsed={collapsedFilters.make}
              onToggle={() => toggleFilter("make")}
            >
              <div className="space-y-1">
                {filterOptions.makes.length > 0 ? (
                  <>
                    {filterOptions.makes
                      .filter(makeOption => makeOption.count > 0) // Only show makes with vehicles
                      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                      .slice(0, showAllMakes ? undefined : 10) // Show first 10 or all
                      .map((makeOption) => (
                      <label
                        key={makeOption.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.make.includes(makeOption.name)}
                          onChange={(e) => {
                          console.log("�� Make filter clicked:", makeOption.name, "checked:", e.target.checked);
                          console.log("🔧 Current applied makes:", appliedFilters.make);
                          e.stopPropagation();
                          try {
                            if (e.target.checked) {
                              const newFilters = {
                                ...appliedFilters,
                                make: [...appliedFilters.make, makeOption.name],
                              };
                              console.log("🔧 Adding make filter. New makes array:", newFilters.make);
                              setAppliedFilters(newFilters);
                              updateURLFromFilters(newFilters);

                              // Force immediate data refresh after filter change
                              setCurrentPage(1); // Reset to page 1 when filtering
                            } else {
                              console.log("🔧 Removing make filter:", makeOption.name, "from:", appliedFilters.make);
                              removeAppliedFilter("make", makeOption.name);

                              // Force immediate data refresh after filter change
                              setCurrentPage(1); // Reset to page 1 when filtering
                            }
                          } catch (error) {
                            console.error("❌ Error in make filter handler:", error);
                          }
                        }}
                        />
                        <span className="carzino-filter-option">{makeOption.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({makeOption.count})
                        </span>
                      </label>
                    ))}
                    {/* Show More/Show Less button */}
                    {filterOptions.makes.filter(makeOption => makeOption.count > 0).length > 10 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllMakes(!showAllMakes);
                        }}
                        className="carzino-show-more text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer p-1 w-full text-left"
                      >
                        {showAllMakes ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading makes...
                  </div>
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
                    .filter(modelOption => modelOption.count > 0) // Only show models with vehicles
                    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                    .map((modelOption) => (
                    <label
                      key={modelOption.name}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.model.includes(modelOption.name)}
                        onChange={(e) => {
                          console.log("🔧 Model filter clicked:", modelOption.name, "checked:", e.target.checked);
                          e.stopPropagation();
                          try {
                            if (e.target.checked) {
                              const newFilters = {
                                ...appliedFilters,
                                model: [...appliedFilters.model, modelOption.name],
                              };
                              console.log("����� Adding model filter:", newFilters);
                              setAppliedFilters(newFilters);
                              updateURLFromFilters(newFilters);
                            } else {
                              console.log("🔧 Removing model filter:", modelOption.name);
                              removeAppliedFilter("model", modelOption.name);
                            }
                          } catch (error) {
                            console.error("❌ Error in model filter handler:", error);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{modelOption.name}</span>
                      <span className="carzino-filter-count ml-1">({modelOption.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading models...
                  </div>
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
                    .filter(trimOption => trimOption.count > 0) // Only show trims with vehicles
                    .map((trimOption) => (
                    <label
                      key={trimOption.name}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.trim.includes(trimOption.name)}
                        onChange={(e) => {
                          console.log("🔧 Trim filter clicked:", trimOption.name, "checked:", e.target.checked);
                          e.stopPropagation();
                          try {
                            if (e.target.checked) {
                              const newFilters = {
                                ...appliedFilters,
                                trim: [...appliedFilters.trim, trimOption.name],
                              };
                              console.log("🔧 Adding trim filter:", newFilters);
                              setAppliedFilters(newFilters);
                              updateURLFromFilters(newFilters);
                            } else {
                              console.log("🔧 Removing trim filter:", trimOption.name);
                              removeAppliedFilter("trim", trimOption.name);
                            }
                          } catch (error) {
                            console.error("❌ Error in trim filter handler:", error);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{trimOption.name}</span>
                      <span className="carzino-filter-count ml-1">({trimOption.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading trims...
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Year - REMOVED: Demo data with random counts only */}

            {/* Price Filter */}
            <FilterSection
              title="Price"
              isCollapsed={collapsedFilters.price}
              onToggle={() => toggleFilter("price")}
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="10,000"
                      value={formatPrice(priceMin)}
                      onChange={(e) => {
                        const unformattedValue = unformatPrice(e.target.value);
                        setPriceMin(unformattedValue);
                      }}
                      onBlur={(e) => {
                        const unformattedValue = unformatPrice(e.target.value);
                        setAppliedFilters((prev) => ({
                          ...prev,
                          priceMin: unformattedValue,
                        }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-search-input w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="100,000"
                      value={formatPrice(priceMax)}
                      onChange={(e) => {
                        const unformattedValue = unformatPrice(e.target.value);
                        setPriceMax(unformattedValue);
                      }}
                      onBlur={(e) => {
                        const unformattedValue = unformatPrice(e.target.value);
                        setAppliedFilters((prev) => ({
                          ...prev,
                          priceMax: unformattedValue,
                        }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-search-input w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded focus:outline-none"
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
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="100"
                      value={paymentMin}
                      onChange={(e) => {
                        console.log("💰 Payment min changed:", e.target.value);
                        setPaymentMin(e.target.value);
                      }}
                      onBlur={(e) => {
                        // Auto-apply when user finishes editing
                        if (e.target.value !== (appliedFilters.paymentMin || "")) {
                          console.log("💰 Auto-applying payment min filter on blur:", e.target.value);
                          applyPaymentFilters();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-search-input w-full pl-6 pr-8 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                      /mo
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="2,000"
                      value={paymentMax}
                      onChange={(e) => {
                        console.log("💰 Payment max changed:", e.target.value);
                        setPaymentMax(e.target.value);
                      }}
                      onBlur={(e) => {
                        // Auto-apply when user finishes editing
                        if (e.target.value !== (appliedFilters.paymentMax || "")) {
                          console.log("💰 Auto-applying payment max filter on blur:", e.target.value);
                          applyPaymentFilters();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-search-input w-full pl-6 pr-8 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                      /mo
                    </span>
                  </div>
                </div>

                {/* Term Length and Interest Rate */}
                <div className="flex gap-2">
                  <select
                    value={termLength}
                    onChange={(e) => {
                      setTermLength(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="carzino-dropdown-option flex-1 px-2 py-1.5 border border-gray-300 rounded focus:outline-none bg-white"
                  >
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                    <option value="48">48 Months</option>
                    <option value="60">60 Months</option>
                    <option value="72">72 Months</option>
                    <option value="84">84 Months</option>
                  </select>
                  <select
                    value={interestRate}
                    onChange={(e) => {
                      setInterestRate(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="carzino-dropdown-option flex-1 px-2 py-1.5 border border-gray-300 rounded focus:outline-none bg-white"
                  >
                    <option value="0">0% APR</option>
                    <option value="3">3% APR</option>
                    <option value="4">4% APR</option>
                    <option value="5">5% APR</option>
                    <option value="6">6% APR</option>
                    <option value="7">7% APR</option>
                    <option value="8">8% APR</option>
                    <option value="9">9% APR</option>
                    <option value="10">10% APR</option>
                    <option value="12">12% APR</option>
                    <option value="16">16% APR</option>
                  </select>
                </div>

                {/* Down Payment */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Down Payment: $2,000"
                    value={`Down Payment: $${formatPrice(downPayment)}`}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "");
                      setDownPayment(value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="carzino-search-input w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none text-gray-500"
                  />
                </div>

                {/* Apply Button */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      applyPaymentFilters();
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Apply Payment Filters
                  </button>
                </div>
              </div>
            </FilterSection>


            {/* Condition */}
            <FilterSection
              title="Condition"
              isCollapsed={collapsedFilters.condition}
              onToggle={() => toggleFilter("condition")}
            >
              <div className="space-y-1">
                {filterOptions.conditions.length > 0 ? (
                  filterOptions.conditions
                    .filter(conditionOption => conditionOption.count > 0) // Only show conditions with vehicles
                    .map((conditionOption) => (
                    <label
                      key={conditionOption.name}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.condition.includes(conditionOption.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            const newFilters = {
                              ...appliedFilters,
                              condition: [...appliedFilters.condition, conditionOption.name],
                            };
                            setAppliedFilters(newFilters);
                            updateURLFromFilters(newFilters);
                          } else {
                            removeAppliedFilter("condition", conditionOption.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{conditionOption.name}</span>
                      <span className="carzino-filter-count ml-1">({conditionOption.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading conditions...
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Mileage */}
            <FilterSection
              title="Mileage"
              isCollapsed={collapsedFilters.mileage}
              onToggle={() => toggleFilter("mileage")}
            >
              <div className="space-y-1">
                <select
                  className="carzino-dropdown-option w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none bg-white"
                  value={appliedFilters.mileage}
                  onChange={(e) =>
                    setAppliedFilters((prev) => ({
                      ...prev,
                      mileage: e.target.value,
                    }))
                  }
                >
                  <option value="">Any Mileage</option>
                  <option value="10000">10,000 or less</option>
                  <option value="20000">20,000 or less</option>
                  <option value="30000">30,000 or less</option>
                  <option value="40000">40,000 or less</option>
                  <option value="50000">50,000 or less</option>
                  <option value="60000">60,000 or less</option>
                  <option value="70000">70,000 or less</option>
                  <option value="80000">80,000 or less</option>
                  <option value="90000">90,000 or less</option>
                  <option value="100000">100,000 or less</option>
                  <option value="100001">100,000 or more</option>
                </select>
              </div>
            </FilterSection>

            {/* Search by Vehicle Type */}
            <FilterSection
              title="Search by Vehicle Type"
              isCollapsed={collapsedFilters.vehicleType}
              onToggle={() => toggleFilter("vehicleType")}
            >
              <div className="grid grid-cols-2 gap-2">
                {Array.isArray(vehicleTypes) && vehicleTypes
                  .filter(type => type.count > 0) // Only show vehicle types with vehicles
                  .map((type, index) => (
                  <VehicleTypeCard
                    key={index}
                    type={type.name}
                    count={type.count}
                    vehicleImages={vehicleImages}
                    isSelected={appliedFilters.vehicleType.includes(type.name)}
                    onToggle={() => {
                      setAppliedFilters((prev) => ({
                        ...prev,
                        vehicleType: prev.vehicleType.includes(type.name)
                          ? prev.vehicleType.filter(
                              (item) => item !== type.name,
                            )
                          : [...prev.vehicleType, type.name],
                      }));
                    }}
                  />
                ))}
                {(!Array.isArray(vehicleTypes) || vehicleTypes.length === 0) && (
                  <div className="text-gray-500 text-sm p-2 col-span-2 text-center">
                    Loading vehicle types...
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Drive Type */}
            <FilterSection
              title="Drive Type"
              isCollapsed={collapsedFilters.driveType}
              onToggle={() => toggleFilter("driveType")}
            >
              <div className="space-y-1">
                {filterOptions.driveTypes.length > 0 ? (
                  filterOptions.driveTypes
                    .filter(driveTypeOption => driveTypeOption.count > 0) // Only show drive types with vehicles
                    .map((driveTypeOption) => (
                    <label
                      key={driveTypeOption.name}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.driveType.includes(driveTypeOption.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              driveType: [...prev.driveType, driveTypeOption.name],
                            }));
                          } else {
                            removeAppliedFilter("driveType", driveTypeOption.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{driveTypeOption.name}</span>
                      <span className="carzino-filter-count ml-1">({driveTypeOption.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading drive types...
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Transmission */}
            <FilterSection
              title="Transmission"
              isCollapsed={collapsedFilters.transmission}
              onToggle={() => toggleFilter("transmission")}
            >
              <div className="space-y-1">
                {filterOptions.transmissions.length > 0 ? (
                  filterOptions.transmissions
                    .filter(transmissionOption => transmissionOption.count > 0) // Only show transmissions with vehicles
                    .map((transmissionOption) => (
                    <label
                      key={transmissionOption.name}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.transmission.includes(transmissionOption.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              transmission: [...prev.transmission, transmissionOption.name],
                            }));
                          } else {
                            removeAppliedFilter("transmission", transmissionOption.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">
                        {transmissionOption.name === "Auto" ? "Automatic" : transmissionOption.name}
                      </span>
                      <span className="carzino-filter-count ml-1">({transmissionOption.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading transmissions...
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Transmission Speed - REMOVED: Demo data only */}

            {/* Exterior Color */}
            <FilterSection
              title="Exterior Color"
              isCollapsed={collapsedFilters.exteriorColor}
              onToggle={() => toggleFilter("exteriorColor")}
            >
              <div className="space-y-1">
                {filterOptions.exteriorColors.length > 0 ? (
                  filterOptions.exteriorColors
                    .filter(color => color.count > 0) // Only show colors with vehicles
                    .map((colorOption) => (
                      <label
                        key={colorOption.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.exteriorColor.includes(colorOption.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                exteriorColor: [...prev.exteriorColor, colorOption.name],
                              }));
                            } else {
                              removeAppliedFilter("exteriorColor", colorOption.name);
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{colorOption.name}</span>
                        <span className="carzino-filter-count ml-1">({colorOption.count})</span>
                      </label>
                    ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    No exterior color data available
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Interior Color - REMOVED: Demo data only */}

            {/* Seller Type */}
            <FilterSection
              title="Seller Type"
              isCollapsed={collapsedFilters.sellerType}
              onToggle={() => toggleFilter("sellerType")}
            >
              <div className="space-y-1">
                {filterOptions.sellerTypes.length > 0 ? (
                  filterOptions.sellerTypes
                    .filter(sellerTypeOption => sellerTypeOption.count > 0) // Only show seller types with vehicles
                    .map((sellerTypeOption) => (
                    <label
                      key={sellerTypeOption.name}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.sellerType.includes(sellerTypeOption.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              sellerType: [...prev.sellerType, sellerTypeOption.name],
                            }));
                          } else {
                            removeAppliedFilter("sellerType", sellerTypeOption.name);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{sellerTypeOption.name}</span>
                      <span className="carzino-filter-count ml-1">({sellerTypeOption.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading seller types...
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Dealer */}
            <FilterSection
              title="Dealer"
              isCollapsed={collapsedFilters.dealer}
              onToggle={() => toggleFilter("dealer")}
            >
              <div className="space-y-1">
                {(() => {
                  // Prefer filterOptions.dealers if available and has data, otherwise use availableDealers
                  const dealersToShow = filterOptions.dealers && filterOptions.dealers.length > 0
                    ? filterOptions.dealers
                    : availableDealers;

                  console.log("💼 Dealer filter rendering:", {
                    filterOptionsDealers: filterOptions.dealers?.length || 0,
                    availableDealers: availableDealers?.length || 0,
                    dealersToShow: dealersToShow?.length || 0,
                    sampleDealers: dealersToShow?.slice(0, 3)
                  });

                  // NOTE: Dealer names should come from Advanced Custom Fields 'acount_name_seller'
                  // Current implementation may be using demo data - check backend API
                  if (import.meta.env.DEV && dealersToShow?.length > 0) {
                    console.warn("🏪 DEALER FILTER: This should use 'acount_name_seller' from ACF, not demo data");
                    console.log("🏪 Current dealer data source:", dealersToShow?.slice(0, 2));
                  }

                  // Show dealers even if count is 0 for now, to debug the issue
                  const filteredDealers = dealersToShow.filter(dealer =>
                    dealer && dealer.name && dealer.name.trim() !== ''
                  );

                  return filteredDealers.map((dealer, index) => (
                    <label
                      key={`dealer-${dealer.name}-${index}`}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.dealer.includes(dealer.name)}
                        onChange={(e) => {
                          console.log("��� Dealer filter clicked:", dealer.name, "checked:", e.target.checked);
                          e.stopPropagation();
                          try {
                            if (e.target.checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                dealer: [...prev.dealer, dealer.name],
                              }));
                            } else {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                dealer: prev.dealer.filter(
                                  (item) => item !== dealer.name,
                                ),
                              }));
                            }
                          } catch (error) {
                            console.error("❌ Error in dealer filter handler:", error);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{dealer.name}</span>
                      <span className="carzino-filter-count ml-1">
                        ({dealer.count || 0})
                      </span>
                    </label>
                  ));
                })()}
                {filterOptions.dealers.length === 0 && availableDealers.length === 0 && (
                  <div className="text-gray-500 text-sm p-2">
                    Loading dealers...
                  </div>
                )}
                {filterOptions.dealers.length === 0 && availableDealers.length > 0 && (
                  <div className="text-yellow-600 text-sm p-2 italic">
                    Note: Using fallback dealer data. Counts may be inaccurate.
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Interior Color */}
            <FilterSection
              title="Interior Color"
              isCollapsed={collapsedFilters.interiorColor}
              onToggle={() => toggleFilter("interiorColor")}
            >
              <div className="space-y-1">
                {filterOptions.interiorColors && filterOptions.interiorColors.length > 0 ? (
                  filterOptions.interiorColors
                    .filter(colorOption => colorOption.count > 0)
                    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                    .map((colorOption) => (
                    <label
                      key={colorOption.name}
                      className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.interiorColor && appliedFilters.interiorColor.includes(colorOption.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              interiorColor: [...(prev.interiorColor || []), colorOption.name],
                            }));
                          } else {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              interiorColor: (prev.interiorColor || []).filter(
                                (item) => item !== colorOption.name
                              ),
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{colorOption.name}</span>
                      <span className="carzino-filter-count ml-1">({colorOption.count})</span>
                    </label>
                  ))
                ) : (
                  interiorColors.map((color) => (
                    <label
                      key={color.name}
                      className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.interiorColor && appliedFilters.interiorColor.includes(color.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              interiorColor: [...(prev.interiorColor || []), color.name],
                            }));
                          } else {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              interiorColor: (prev.interiorColor || []).filter(
                                (item) => item !== color.name
                              ),
                            }));
                          }
                        }}
                      />
                      <div
                        className="w-4 h-4 rounded border border-gray-300 mr-2"
                        style={{ backgroundColor: color.color }}
                      ></div>
                      <span className="carzino-filter-option">{color.name}</span>
                      <span className="carzino-filter-count ml-1">({color.count})</span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* State */}
            <FilterSection
              title="State"
              isCollapsed={collapsedFilters.state}
              onToggle={() => toggleFilter("state")}
            >
              <div className="space-y-1">
                {filterOptions.states && filterOptions.states.length > 0 ? (
                  filterOptions.states
                    .filter(stateOption => stateOption.count > 0)
                    .map((stateOption) => (
                    <label
                      key={stateOption.name}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.state && appliedFilters.state.includes(stateOption.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              state: [...(prev.state || []), stateOption.name],
                            }));
                          } else {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              state: (prev.state || []).filter(
                                (item) => item !== stateOption.name
                              ),
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{stateOption.name}</span>
                      <span className="carzino-filter-count ml-1">({stateOption.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading states...
                  </div>
                )}
              </div>
            </FilterSection>

            {/* City */}
            <FilterSection
              title="City"
              isCollapsed={collapsedFilters.city}
              onToggle={() => toggleFilter("city")}
            >
              <div className="space-y-1">
                {filterOptions.cities && filterOptions.cities.length > 0 ? (
                  filterOptions.cities
                    .filter(cityOption => cityOption.count > 0)
                    .slice(0, 20) // Limit to first 20 cities to avoid overwhelming the UI
                    .map((cityOption) => (
                    <label
                      key={cityOption.name}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.city && appliedFilters.city.includes(cityOption.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              city: [...(prev.city || []), cityOption.name],
                            }));
                          } else {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              city: (prev.city || []).filter(
                                (item) => item !== cityOption.name
                              ),
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{cityOption.name}</span>
                      <span className="carzino-filter-count ml-1">({cityOption.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2">
                    Loading cities...
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Mobile Filter Action Buttons - Always Visible and Sticky */}
            <div className="lg:hidden mobile-action-buttons">
              <div className="flex gap-3 max-w-md mx-auto">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors touch-manipulation"
                  style={{ minHeight: '48px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setMobileFiltersOpen(false);
                    // Filters are already applied in real-time, so just close the panel
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors touch-manipulation"
                  style={{ minHeight: '48px' }}
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Spacer to prevent content from being hidden behind fixed buttons */}
            <div className="lg:hidden h-20"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Complete Mobile Layout - matching original demo exactly */}
          <div className="lg:hidden">
            {/* Non-sticky title and search */}
            <div className="p-3 bg-white">
              <h1 className="text-lg font-semibold text-gray-900 mb-3">
                {viewMode === "favorites"
                  ? "My Favorites"
                  : "Vehicles for Sale"}
              </h1>

              {/* Search Bar */}
              <form onSubmit={handleUnifiedSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={unifiedSearch}
                  onChange={(e) => setUnifiedSearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                />
                <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Applied Filters Pills - Outside sticky container, always visible */}
            {((appliedLocation && appliedRadius !== "nationwide") ||
              appliedFilters.condition.length > 0 ||
              appliedFilters.make.length > 0 ||
              appliedFilters.model.length > 0 ||
              appliedFilters.trim.length > 0 ||
              appliedFilters.year.length > 0 ||
              appliedFilters.bodyStyle.length > 0 ||
              appliedFilters.vehicleType.length > 0 ||
              appliedFilters.driveType.length > 0 ||
              appliedFilters.exteriorColor.length > 0 ||
              appliedFilters.sellerType.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.priceMin ||
              appliedFilters.priceMax ||
              appliedFilters.paymentMin ||
              appliedFilters.paymentMax) && (
              <div className="px-3 pt-3 bg-white">
                <div className="flex gap-2 overflow-x-auto pb-3">
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                  >
                    Clear All
                  </button>
                  {appliedLocation && appliedRadius !== "nationwide" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                      <Check className="w-3 h-3 text-red-600" />
                      <MapPin className="w-3 h-3" />
                      {appliedRadius} miles
                      <button
                        onClick={() => {
                          setAppliedLocation(null);
                          setAppliedRadius("200");
                        }}
                        className="ml-1 text-white"
                      >
                        ���
                      </button>
                    </span>
                  )}
                  {appliedFilters.condition.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("condition", item)}
                        className="ml-1 text-white"
                      >
                        ��
                      </button>
                    </span>
                  ))}
                  {appliedFilters.make.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
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
                  {appliedFilters.trim.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("trim", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.year.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("year", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.bodyStyle.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("bodyStyle", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.vehicleType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("vehicleType", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.driveType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("driveType", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.exteriorColor.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item} Color
                      <button
                        onClick={() =>
                          removeAppliedFilter("exteriorColor", item)
                        }
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.sellerType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("sellerType", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.mileage && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                      <Check className="w-3 h-3 text-red-600" />
                      {appliedFilters.mileage === "100001"
                        ? "100k+ miles"
                        : `Under ${parseInt(appliedFilters.mileage).toLocaleString()} mi`}
                      <button
                        onClick={() =>
                          setAppliedFilters((prev) => ({
                            ...prev,
                            mileage: "",
                          }))
                        }
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(appliedFilters.priceMin || appliedFilters.priceMax) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                      <Check className="w-3 h-3 text-red-600" />$
                      {appliedFilters.priceMin || "0"} - $
                      {appliedFilters.priceMax || "Any"}
                      <button
                        onClick={() => {
                          setAppliedFilters((prev) => ({
                            ...prev,
                            priceMin: "",
                            priceMax: "",
                          }));
                          setPriceMin("10000");
                          setPriceMax("100000");
                        }}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(appliedFilters.paymentMin || appliedFilters.paymentMax) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                      <Check className="w-3 h-3 text-red-600" />$
                      {appliedFilters.paymentMin || "0"}-$
                      {appliedFilters.paymentMax || "Any"}/mo
                      <button
                        onClick={() =>
                          setAppliedFilters((prev) => ({
                            ...prev,
                            paymentMin: "",
                            paymentMax: "",
                          }))
                        }
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Sticky wrapper - will stick throughout the entire scrollable area */}
            <div className={mobileFiltersOpen ? "" : "sticky top-0 z-50"}>
              {/* Filter, Sort, Favorites Bar */}
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-gray-400 bg-white shadow-md">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <Sliders className="w-4 h-4" />
                  Filter
                  {appliedFilters.condition.length +
                    appliedFilters.make.length +
                    appliedFilters.model.length +
                    appliedFilters.trim.length +
                    appliedFilters.vehicleType.length +
                    appliedFilters.driveType.length +
                    appliedFilters.exteriorColor.length +
                    (appliedFilters.mileage ? 1 : 0) +
                    (appliedFilters.priceMin || appliedFilters.priceMax
                      ? 1
                      : 0) +
                    (appliedFilters.paymentMin || appliedFilters.paymentMax
                      ? 1
                      : 0) >
                    0 && (
                    <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {appliedFilters.condition.length +
                        appliedFilters.make.length +
                        appliedFilters.model.length +
                        appliedFilters.trim.length +
                        appliedFilters.vehicleType.length +
                        appliedFilters.driveType.length +
                        appliedFilters.exteriorColor.length +
                        (appliedFilters.mileage ? 1 : 0) +
                        (appliedFilters.priceMin || appliedFilters.priceMax
                          ? 1
                          : 0) +
                        (appliedFilters.paymentMin || appliedFilters.paymentMax
                          ? 1
                          : 0)}
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
                      <button
                        onClick={() => {
                          setSortBy("miles-low");
                          setSortDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "miles-low" ? "bg-red-50 text-red-600" : ""}`}
                      >
                        Miles: Low to High
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("miles-high");
                          setSortDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "miles-high" ? "bg-red-50 text-red-600" : ""}`}
                      >
                        Miles: High to Low
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("year-newest");
                          setSortDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "year-newest" ? "bg-red-50 text-red-600" : ""}`}
                      >
                        Year: Newest to Oldest
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("year-oldest");
                          setSortDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "year-oldest" ? "bg-red-50 text-red-600" : ""}`}
                      >
                        Year: Oldest to Newest
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("distance-closest");
                          setSortDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "distance-closest" ? "bg-red-50 text-red-600" : ""}`}
                      >
                        Distance: Closest to Me
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-l border-gray-400 h-8"></div>

                <button
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${viewMode === "favorites" ? "text-red-600" : ""}`}
                  onClick={() =>
                    setViewMode(viewMode === "favorites" ? "all" : "favorites")
                  }
                >
                  Favorites
                  <div className="relative">
                    <div
                      className={`w-12 h-6 rounded-full ${viewMode === "favorites" ? "bg-red-600" : "bg-gray-300"} transition-colors`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                          viewMode === "favorites"
                            ? "translate-x-6"
                            : "translate-x-0.5"
                        } ${
                          viewMode === "favorites"
                            ? "bg-white"
                            : favoritesCount > 0
                              ? "bg-red-600 md:bg-white"
                              : "bg-white"
                        }`}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Connection Status & Results Count - NOT in sticky */}
            <div className="px-3 py-2 bg-gray-50 text-sm">
              {error && error.includes("Unable to connect") && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded mb-2 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Connection issues detected. Some features may be limited.
                </div>
              )}
              <span className="font-medium">
                {viewMode === "favorites"
                  ? `${favoritesCount} Saved Vehicles`
                  : `${appliedFilters.condition.join(", ")}${appliedFilters.condition.length > 0 && appliedFilters.make.length > 0 ? ", " : ""}${appliedFilters.make.join(", ")}${appliedFilters.condition.length > 0 || appliedFilters.make.length > 0 ? " for sale" : "All Vehicles"} - ${Math.max(totalResults, displayedVehicles.length).toLocaleString()} Results`}
              </span>
              {import.meta.env.DEV && (
                <div className="text-xs text-gray-400 mt-1">
                  Debug: API={totalResults}, Displayed={displayedVehicles.length}, Total={vehicles.length}
                </div>
              )}
            </div>

            {/* Mobile Product Grid */}
            <div className="p-4 bg-white min-h-screen">
              {loading ? (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
                  <div className="text-lg">Loading vehicles...</div>
                  <div className="text-sm text-gray-500 mt-2">
                    {import.meta.env.DEV && `API: WordPress Custom API (/wp-json/custom/v1/vehicles)`}
                  </div>
                  {import.meta.env.DEV && (
                    <button
                      onClick={() => setLoading(false)}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded text-sm"
                    >
                      Force Stop Loading (Debug)
                    </button>
                  )}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <div className="text-red-600 mb-4">Error loading vehicles:</div>
                  <div className="text-sm text-gray-600 mb-4">{error}</div>
                  {import.meta.env.DEV && (
                    <div className="text-xs text-gray-400 mt-4 p-4 bg-gray-50 rounded">
                      <div>Debug Info:</div>
                      <div>• Total vehicles: {vehicles.length}</div>
                      <div>• Current page: {currentPage}</div>
                      <div>• API URL: WordPress Custom API (/wp-json/custom/v1/vehicles)</div>
                      <div>• Window width: {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setError(null);
                      fetchCombinedData();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded mt-4 hover:bg-red-700"
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
                    Start browsing vehicles and save your favorites by clicking
                    the heart icon.
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
                  <div className="text-gray-500 mb-4">
                    <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No vehicles found
                    </h3>
                    <p className="text-sm">
                      Try adjusting your search filters or{" "}
                      <button
                        onClick={clearAllFilters}
                        className="text-red-600 underline"
                      >
                        clear all filters
                      </button>
                    </p>
                    {import.meta.env.DEV && (
                      <div className="text-xs text-gray-400 mt-4 p-4 bg-gray-50 rounded">
                        <div>Debug: {vehicles.length} total vehicles loaded</div>
                        <div>API Response: {apiResponse?.success ? 'Success' : 'Failed'}</div>
                        <div>Total Records: {totalResults}</div>
                        <div>Displayed: {displayedVehicles.length}</div>
                        <div>View Mode: {viewMode}</div>
                        <div>Filters applied: {Object.keys(appliedFilters).filter(key =>
                          Array.isArray(appliedFilters[key]) ? appliedFilters[key].length > 0 : appliedFilters[key]
                        ).length}</div>
                        <button
                          onClick={() => console.log('State:', {vehicles, apiResponse, appliedFilters, loading})}
                          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                        >
                          Log State
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="vehicle-grid grid grid-cols-1 gap-4 mb-8">
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

                  {viewMode === "all" && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalResults={totalResults}
                      resultsPerPage={resultsPerPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {viewMode === "favorites"
                    ? "My Favorites"
                    : "New and Used Vehicles for sale"}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {viewMode === "favorites"
                    ? `${favoritesCount} Vehicles`
                    : `${totalResults.toLocaleString()} Matches`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Desktop View Switcher - Only show when in favorites mode */}
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
                  <option value="miles-low">Miles: Low to High</option>
                  <option value="miles-high">Miles: High to Low</option>
                  <option value="year-newest">Year: Newest to Oldest</option>
                  <option value="year-oldest">Year: Oldest to Newest</option>
                  <option value="distance-closest">
                    Distance: Closest to Me
                  </option>
                </select>

                <select className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="30">View: 30</option>
                  <option value="60">View: 60</option>
                  <option value="100">View: 100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Product Grid */}
          <div className="hidden md:block p-4 lg:p-4 bg-white min-h-screen">
            {viewMode === "favorites" && favoritesCount === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No favorites yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start browsing vehicles and save your favorites by clicking
                  the heart icon.
                </p>
                <button
                  onClick={() => setViewMode("all")}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Browse Vehicles
                </button>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-red-50 rounded-lg">
                <p className="text-red-600">Error: {error}</p>
                <p className="text-sm text-gray-500 mt-2">Vehicles loaded: {vehicles.length}</p>
              </div>
            ) : (
              <div>
                {/* Debug info */}
                <div className="text-xs text-gray-500 mb-2 p-2 bg-yellow-50 rounded">
                  🔍 Debug: vehicles={vehicles.length}, displayed={displayedVehicles.length}, loading={loading.toString()}, error={error || 'none'}
                </div>
                <div className="vehicle-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {displayedVehicles.length > 0 ? displayedVehicles.map((vehicle) => (
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
                  )) : (
                    <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      🚗 No vehicles found matching current filters.<br/>
                      <small>Total vehicles loaded: {vehicles.length}</small>
                    </div>
                  )}
                </div>

                {viewMode === "all" && apiResponse?.meta && (
                  <Pagination
                    currentPage={apiResponse?.meta?.currentPage || currentPage}
                    totalPages={apiResponse?.meta?.totalPages || 1}
                    totalResults={apiResponse?.meta?.totalRecords || 0}
                    resultsPerPage={apiResponse.meta.pageSize}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error boundary wrapper to catch rendering errors
export default function MySQLVehiclesOriginalStyle() {
  try {
    return <MySQLVehiclesOriginalStyleInner />;
  } catch (error) {
    console.error("❌ Component rendering error:", error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the vehicle filters. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
