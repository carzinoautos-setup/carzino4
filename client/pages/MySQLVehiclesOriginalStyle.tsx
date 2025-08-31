import React, { useState, useEffect, useCallback } from "react";
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

// Simple vehicle interface matching original demo exactly
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

export default function MySQLVehiclesOriginalStyle() {
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
  const totalPages = apiResponse?.meta.totalPages || 1;
  const totalResults = apiResponse?.meta.totalRecords || 0;
  const resultsPerPage = 20;

  // Debug logging for rendering
  console.log("📊 Render State:", {
    vehiclesCount: vehicles.length,
    totalResults,
    totalPages,
    loading,
    error,
    hasApiResponse: !!apiResponse
  });

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
    sellerType: [] as string[],
    dealer: [] as string[],
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

  // Get the API base URL - handle different environments
  const getApiBaseUrl = () => {
    // In development, use relative URLs
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "";
    }
    // In production, try to use the same origin first
    return "";
  };

  // Get models for a specific make
  const getModelsForMake = (make: string): string[] => {
    const modelsByMake: { [key: string]: string[] } = {
      Audi: ["A3", "A4", "A6", "Q5", "Q7", "Q8"],
      BMW: ["3 Series", "5 Series", "X3", "X5", "X7"],
      Chevrolet: [
        "Silverado",
        "Equinox",
        "Malibu",
        "Traverse",
        "Camaro",
        "Tahoe",
      ],
      Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Expedition"],
      Honda: ["Civic", "Accord", "CR-V", "Pilot", "HR-V"],
      Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade"],
      "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "S-Class"],
      Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Murano"],
    };

    return modelsByMake[make] || [];
  };

  // Fetch vehicles from API
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: resultsPerPage.toString(),
      });

      // Add search term
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      // Add sorting parameter
      if (sortBy !== "relevance") {
        params.append("sortBy", sortBy);
      }

      // Add location/distance parameters
      if (appliedLocation && appliedRadius !== "nationwide") {
        params.append("lat", appliedLocation.lat.toString());
        params.append("lng", appliedLocation.lng.toString());
        params.append("radius", appliedRadius);
      }

      // Add filters
      if (appliedFilters.condition.length > 0) {
        params.append("condition", appliedFilters.condition.join(","));
      }
      if (appliedFilters.make.length > 0) {
        params.append("make", appliedFilters.make.join(","));
      }
      if (appliedFilters.model.length > 0) {
        params.append("model", appliedFilters.model.join(","));
      }
      if (appliedFilters.trim.length > 0) {
        params.append("trim", appliedFilters.trim.join(","));
      }
      if (appliedFilters.vehicleType.length > 0) {
        params.append("body_type", appliedFilters.vehicleType.join(","));
      }
      if (appliedFilters.driveType.length > 0) {
        params.append("driveType", appliedFilters.driveType.join(","));
      }
      if (appliedFilters.transmission.length > 0) {
        params.append("transmission", appliedFilters.transmission.join(","));
      }
      if (appliedFilters.mileage) {
        params.append("mileage", appliedFilters.mileage);
      }
      if (appliedFilters.exteriorColor.length > 0) {
        params.append("exteriorColor", appliedFilters.exteriorColor.join(","));
      }
      if (appliedFilters.sellerType.length > 0) {
        params.append("sellerType", appliedFilters.sellerType.join(","));
      }
      if (appliedFilters.dealer.length > 0) {
        params.append("dealer", appliedFilters.dealer.join(","));
      }
      if (appliedFilters.priceMin) {
        params.append("priceMin", appliedFilters.priceMin);
      }
      if (appliedFilters.priceMax) {
        params.append("priceMax", appliedFilters.priceMax);
      }
      if (appliedFilters.paymentMin) {
        params.append("paymentMin", appliedFilters.paymentMin);
      }
      if (appliedFilters.paymentMax) {
        params.append("paymentMax", appliedFilters.paymentMax);
      }

      const apiUrl = `${getApiBaseUrl()}/api/simple-vehicles?${params}`;
      console.log("🔍 Fetching vehicles from:", apiUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: VehiclesApiResponse = await response.json();

      console.log("🔍 Raw API Response:", {
        success: data.success,
        dataLength: data.data?.length,
        meta: data.meta,
        hasData: !!data.data,
        isArray: Array.isArray(data.data)
      });

      if (data.success) {
        console.log("🚗 Setting vehicles:", data.data?.length, "vehicles");
        console.log("📊 Meta data:", data.meta);
        setVehicles(data.data || []);
        setApiResponse(data);
        console.log("✅ Successfully loaded", data.data?.length || 0, "vehicles");
      } else {
        console.error("❌ API returned error:", data.message);
        throw new Error(data.message || "API returned error");
      }
    } catch (err) {
      console.error("❌ Vehicle fetch error:", err);

      // Provide specific error messages based on error type
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError(
          "Unable to connect to vehicle database. Please refresh the page or try again later.",
        );
      } else if (err.name === "AbortError") {
        setError(
          "Request timed out. Please check your internet connection and try again.",
        );
      } else if (
        err instanceof Error &&
        err.message.includes("API error: 404")
      ) {
        setError(
          "Vehicle database service is temporarily unavailable. Please try again later.",
        );
      } else if (
        err instanceof Error &&
        err.message.includes("API error: 500")
      ) {
        setError("Server error occurred. Please try again in a few moments.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading vehicles.",
        );
      }

      // Set empty vehicles array
      setVehicles([]);
      setApiResponse({
        success: false,
        data: [],
        message: "No vehicles available",
        pagination: {
          page: 1,
          pageSize: resultsPerPage,
          total: 0,
          totalPages: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    appliedFilters,
    searchTerm,
    appliedLocation,
    appliedRadius,
    sortBy,
  ]);

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

  // Fetch vehicles when dependencies change
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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

  // Load vehicle type images
  useEffect(() => {
    const loadImages = async () => {
      const imageMapping = {
        Convertible:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F064c51214995430a9384ae9f1722bee9",
        Coupe:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F1d042ebb458842a8a468794ae563fcc6",
        Hatchback:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fb06dd82e2c564b7eb30b1d5fa14e0562",
        Sedan:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F0eccbe1eccb94b3b8eee4d8cfb611864",
        "Crossover/SUV":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fffc8b9d69ce743d080a0b5ba9a64e89a",
        Trucks:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Regular Cab":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Extended Cab":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Crew Cab":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Van / Minivan":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Ff0d0c6c20e02423dad8eefa6f0ef508a",
        Wagon:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F24bf3ece0537462bbd1edd12a2485c0a?format=webp",
      };

      const loadedImages: { [key: string]: string } = {};
      for (const [vehicleType, imageUrl] of Object.entries(imageMapping)) {
        loadedImages[vehicleType] = imageUrl;
      }
      setVehicleImages(loadedImages);
    };

    loadImages();
  }, []);

  // Load available dealers
  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const apiUrl = `${getApiBaseUrl()}/api/dealers`;
        console.log("🔍 Fetching dealers from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setAvailableDealers(data.data);
            console.log("✅ Successfully loaded", data.data.length, "dealers");
          }
        } else {
          console.warn("⚠️ Failed to fetch dealers:", response.status);
          // Set fallback dealers for now
          setAvailableDealers([
            { name: "Bayside Auto Sales", count: 234 },
            { name: "ABC Car Sales", count: 156 },
          ]);
        }
      } catch (error) {
        console.error("❌ Error fetching dealers:", error);
        // Set fallback dealers for now
        setAvailableDealers([
          { name: "Bayside Auto Sales", count: 234 },
          { name: "ABC Car Sales", count: 156 },
        ]);
      }
    };

    fetchDealers();
  }, []);

  // Load available vehicle types
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const apiUrl = `${getApiBaseUrl()}/api/vehicle-types`;
        console.log("🔍 Fetching vehicle types from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Handle both array and object responses
            const vehicleTypesArray = Array.isArray(data.data)
              ? data.data
              : data.data.vehicleTypes || data.data || [];
            setVehicleTypes(vehicleTypesArray);
            console.log(
              "✅ Successfully loaded",
              vehicleTypesArray.length,
              "vehicle types",
            );
          }
        } else {
          console.warn("⚠️ Failed to fetch vehicle types:", response.status);
          // Set fallback vehicle types for now
          setVehicleTypes([
            { name: "Sedan", count: 1698 },
            { name: "Crossover/SUV", count: 3405 },
            { name: "Coupe", count: 419 },
            { name: "Convertible", count: 125 },
            { name: "Hatchback", count: 342 },
            { name: "Van / Minivan", count: 298 },
            { name: "Wagon", count: 156 },
            { name: "Trucks", count: 2217 },
            { name: "Regular Cab", count: 421 },
            { name: "Extended Cab", count: 543 },
            { name: "Crew Cab", count: 687 },
          ]);
        }
      } catch (error) {
        console.error("❌ Error fetching vehicle types:", error);
        // Set fallback vehicle types for now
        setVehicleTypes([
          { name: "Sedan", count: 1698 },
          { name: "Crossover/SUV", count: 3405 },
          { name: "Coupe", count: 419 },
          { name: "Convertible", count: 125 },
          { name: "Hatchback", count: 342 },
          { name: "Van / Minivan", count: 298 },
          { name: "Wagon", count: 156 },
          { name: "Trucks", count: 2217 },
          { name: "Regular Cab", count: 421 },
          { name: "Extended Cab", count: 543 },
          { name: "Crew Cab", count: 687 },
        ]);
      }
    };

    fetchVehicleTypes();
  }, []);

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

  const clearAllFilters = () => {
    setSearchTerm("");
    setUnifiedSearch("");
    setZipCode(""); // Reset ZIP code
    setRadius("200"); // Reset to default radius
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
      sellerType: [],
      dealer: [],
      priceMin: "",
      priceMax: "",
      paymentMin: "",
      paymentMax: "",
    });
    setPriceMin("10000");
    setPriceMax("100000");
    setPaymentMin("100");
    setPaymentMax("2000");
    setCurrentPage(1);

    // Reset URL to base cars-for-sale path
    if (location.pathname.startsWith("/cars-for-sale")) {
      navigate("/cars-for-sale/", { replace: true });
    }
  };

  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Apply payment filters handler
  const applyPaymentFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      paymentMin: paymentMin,
      paymentMax: paymentMax,
    }));
    setCurrentPage(1); // Reset to first page when applying filters
  };

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

    try {
      setIsGeocodingLoading(true);

      // Call our geocoding API with proper error handling
      const apiUrl = `${getApiBaseUrl()}/api/geocode/${zip}`;
      console.log("🔍 Geocoding ZIP:", zip, "using:", apiUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
          console.warn(`❌ ZIP ${zip} not found`);
        }
      } else {
        console.error(
          `❌ Geocoding API error: ${response.status} ${response.statusText}`,
        );
      }

      return null;
    } catch (error) {
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
      setIsGeocodingLoading(false);
    }
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
                appliedFilters.sellerType.length > 0 ||
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
                {[
                  "Audi",
                  "BMW",
                  "Chevrolet",
                  "Ford",
                  "Honda",
                  "Hyundai",
                  "Mercedes-Benz",
                  "Nissan",
                ].map((make) => (
                  <label
                    key={make}
                    className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.make.includes(make)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          const newFilters = {
                            ...appliedFilters,
                            make: [...appliedFilters.make, make],
                          };
                          setAppliedFilters(newFilters);
                          updateURLFromFilters(newFilters);
                        } else {
                          removeAppliedFilter("make", make);
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{make}</span>
                    <span className="carzino-filter-count ml-1">
                      ({Math.floor(Math.random() * 1000) + 100})
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Model (Conditional) */}
            <FilterSection
              title={`Model${appliedFilters.make.length > 0 ? ` (${appliedFilters.make[0]})` : ""}`}
              isCollapsed={collapsedFilters.model}
              onToggle={() => toggleFilter("model")}
            >
              <div className="space-y-1">
                {appliedFilters.make.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Select a make first to see available models
                  </div>
                ) : (
                  getModelsForMake(appliedFilters.make[0]).map((model) => (
                    <label
                      key={model}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.model.includes(model)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            const newFilters = {
                              ...appliedFilters,
                              model: [...appliedFilters.model, model],
                            };
                            setAppliedFilters(newFilters);
                            updateURLFromFilters(newFilters);
                          } else {
                            removeAppliedFilter("model", model);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{model}</span>
                      <span className="carzino-filter-count ml-1">
                        ({Math.floor(Math.random() * 100) + 10})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Trim (Conditional) */}
            <FilterSection
              title="Trim"
              isCollapsed={collapsedFilters.trim}
              onToggle={() => toggleFilter("trim")}
            >
              <div className="space-y-1">
                {appliedFilters.make.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Select a make first to see available trims
                  </div>
                ) : (
                  ["Premium", "Premium Plus", "Prestige", "S Line"].map(
                    (trim) => (
                      <label
                        key={trim}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.trim.includes(trim)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              const newFilters = {
                                ...appliedFilters,
                                trim: [...appliedFilters.trim, trim],
                              };
                              setAppliedFilters(newFilters);
                              updateURLFromFilters(newFilters);
                            } else {
                              removeAppliedFilter("trim", trim);
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{trim}</span>
                        <span className="carzino-filter-count ml-1">
                          ({Math.floor(Math.random() * 50) + 5})
                        </span>
                      </label>
                    ),
                  )
                )}
              </div>
            </FilterSection>

            {/* Year Filter */}
            <FilterSection
              title="Year"
              isCollapsed={collapsedFilters.year || false}
              onToggle={() => toggleFilter("year")}
            >
              <div className="space-y-1">
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((year) => (
                  <label
                    key={year}
                    className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.year.includes(year.toString())}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          const newFilters = {
                            ...appliedFilters,
                            year: [...appliedFilters.year, year.toString()],
                          };
                          setAppliedFilters(newFilters);
                          updateURLFromFilters(newFilters);
                        } else {
                          removeAppliedFilter("year", year.toString());
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{year}</span>
                    <span className="carzino-filter-count ml-1">
                      ({Math.floor(Math.random() * 500) + 50})
                    </span>
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
                        setPaymentMin(e.target.value);
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
                        setPaymentMax(e.target.value);
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
                    value={`Down Payment: ${downPayment}`}
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
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.condition.includes("New")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        const newFilters = {
                          ...appliedFilters,
                          condition: [...appliedFilters.condition, "New"],
                        };
                        setAppliedFilters(newFilters);
                        updateURLFromFilters(newFilters);
                      } else {
                        removeAppliedFilter("condition", "New");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">New</span>
                  <span className="carzino-filter-count ml-1">(125,989)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.condition.includes("Used")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        const newFilters = {
                          ...appliedFilters,
                          condition: [...appliedFilters.condition, "Used"],
                        };
                        setAppliedFilters(newFilters);
                        updateURLFromFilters(newFilters);
                      } else {
                        removeAppliedFilter("condition", "Used");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Used</span>
                  <span className="carzino-filter-count ml-1">(78,800)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.condition.includes("Certified")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        const newFilters = {
                          ...appliedFilters,
                          condition: [...appliedFilters.condition, "Certified"],
                        };
                        setAppliedFilters(newFilters);
                        updateURLFromFilters(newFilters);
                      } else {
                        removeAppliedFilter("condition", "Certified");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Certified</span>
                  <span className="carzino-filter-count ml-1">(9,889)</span>
                </label>
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
                {Array.isArray(vehicleTypes) && vehicleTypes.map((type, index) => (
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
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.driveType.includes("AWD/4WD")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          driveType: [...prev.driveType, "AWD/4WD"],
                        }));
                      } else {
                        removeAppliedFilter("driveType", "AWD/4WD");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">AWD/4WD</span>
                  <span className="carzino-filter-count ml-1">(25,309)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.driveType.includes("FWD")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          driveType: [...prev.driveType, "FWD"],
                        }));
                      } else {
                        removeAppliedFilter("driveType", "FWD");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">FWD</span>
                  <span className="carzino-filter-count ml-1">(12,057)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.driveType.includes("RWD")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          driveType: [...prev.driveType, "RWD"],
                        }));
                      } else {
                        removeAppliedFilter("driveType", "RWD");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">RWD</span>
                  <span className="carzino-filter-count ml-1">(5,883)</span>
                </label>
              </div>
            </FilterSection>

            {/* Transmission */}
            <FilterSection
              title="Transmission"
              isCollapsed={collapsedFilters.transmission}
              onToggle={() => toggleFilter("transmission")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.transmission.includes("Auto")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          transmission: [...prev.transmission, "Auto"],
                        }));
                      } else {
                        removeAppliedFilter("transmission", "Auto");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Automatic</span>
                  <span className="carzino-filter-count ml-1">(35,247)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.transmission.includes("Manual")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          transmission: [...prev.transmission, "Manual"],
                        }));
                      } else {
                        removeAppliedFilter("transmission", "Manual");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Manual</span>
                  <span className="carzino-filter-count ml-1">(4,823)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.transmission.includes("CVT")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          transmission: [...prev.transmission, "CVT"],
                        }));
                      } else {
                        removeAppliedFilter("transmission", "CVT");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">CVT</span>
                  <span className="carzino-filter-count ml-1">(9,930)</span>
                </label>
              </div>
            </FilterSection>

            {/* Transmission Speed */}
            <FilterSection
              title="Transmission Speed"
              isCollapsed={collapsedFilters.transmissionSpeed}
              onToggle={() => toggleFilter("transmissionSpeed")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">
                    4-Speed Automatic
                  </span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">
                    6-Speed Automatic
                  </span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">
                    8-Speed Automatic
                  </span>
                </label>
              </div>
            </FilterSection>

            {/* Exterior Color */}
            <FilterSection
              title="Exterior Color"
              isCollapsed={collapsedFilters.exteriorColor}
              onToggle={() => toggleFilter("exteriorColor")}
            >
              <div className="space-y-1">
                {exteriorColors.map((color, index) => (
                  <ColorSwatch
                    key={index}
                    color={color.color}
                    name={color.name}
                    count={color.count}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Interior Color */}
            <FilterSection
              title="Interior Color"
              isCollapsed={collapsedFilters.interiorColor}
              onToggle={() => toggleFilter("interiorColor")}
            >
              <div className="space-y-1">
                {interiorColors.map((color, index) => (
                  <ColorSwatch
                    key={index}
                    color={color.color}
                    name={color.name}
                    count={color.count}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Seller Type */}
            <FilterSection
              title="Seller Type"
              isCollapsed={collapsedFilters.sellerType}
              onToggle={() => toggleFilter("sellerType")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.sellerType.includes("Dealer")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          sellerType: [...prev.sellerType, "Dealer"],
                        }));
                      } else {
                        removeAppliedFilter("sellerType", "Dealer");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Dealer</span>
                  <span className="carzino-filter-count ml-1">(6,543)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.sellerType.includes(
                      "Private Seller",
                    )}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          sellerType: [...prev.sellerType, "Private Seller"],
                        }));
                      } else {
                        removeAppliedFilter("sellerType", "Private Seller");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Private Seller</span>
                  <span className="carzino-filter-count ml-1">(1,984)</span>
                </label>
              </div>
            </FilterSection>

            {/* Dealer */}
            <FilterSection
              title="Dealer"
              isCollapsed={collapsedFilters.dealer}
              onToggle={() => toggleFilter("dealer")}
            >
              <div className="space-y-1">
                {availableDealers.map((dealer, index) => (
                  <label
                    key={index}
                    className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.dealer.includes(dealer.name)}
                      onChange={(e) => {
                        e.stopPropagation();
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
                      }}
                    />
                    <span className="carzino-filter-option">{dealer.name}</span>
                    <span className="carzino-filter-count ml-1">
                      ({dealer.count})
                    </span>
                  </label>
                ))}
                {availableDealers.length === 0 && (
                  <div className="text-gray-500 text-sm p-2">
                    Loading dealers...
                  </div>
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
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">Washington</span>
                  <span className="carzino-filter-count ml-1">(12,456)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">Oregon</span>
                  <span className="carzino-filter-count ml-1">(8,234)</span>
                </label>
              </div>
            </FilterSection>

            {/* City */}
            <FilterSection
              title="City"
              isCollapsed={collapsedFilters.city}
              onToggle={() => toggleFilter("city")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">Seattle</span>
                  <span className="carzino-filter-count ml-1">(4,567)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">Portland</span>
                  <span className="carzino-filter-count ml-1">(3,234)</span>
                </label>
              </div>
            </FilterSection>

            {/* Mobile Filter Action Buttons */}
            <div className="lg:hidden sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setMobileFiltersOpen(false);
                    // Filters are already applied in real-time, so just close the panel
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
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
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                  <Search className="w-5 h-5" />
                </button>
              </div>
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
                        ×
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
                  : `${appliedFilters.condition.join(", ")}${appliedFilters.condition.length > 0 && appliedFilters.make.length > 0 ? ", " : ""}${appliedFilters.make.join(", ")}${appliedFilters.condition.length > 0 || appliedFilters.make.length > 0 ? " for sale" : "All Vehicles"} - ${totalResults.toLocaleString()} Results`}
              </span>
            </div>

            {/* Mobile Product Grid */}
            <div className="p-4 bg-white min-h-screen">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg">Loading vehicles...</div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600">Error: {error}</div>
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
                    currentPage={apiResponse.meta.currentPage}
                    totalPages={apiResponse.meta.totalPages}
                    totalResults={apiResponse.meta.totalRecords}
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
