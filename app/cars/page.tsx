'use client'

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import { VehicleCard } from "../../client/components/VehicleCard";
import { FilterSection } from "../../client/components/FilterSection";
import { VehicleTypeCard } from "../../client/components/VehicleTypeCard";
import { Pagination } from "../../client/components/Pagination";

// Import URL utilities
import { parseCarURL, generateCarURL, updateURL } from "../../lib/utils";

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

export default function CarsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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

  // Applied filters state - initialized from URL
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
    dealer: [] as string[],      // stores account IDs for filtering
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

  // Initialize filters from URL on component mount
  useEffect(() => {
    const urlFilters = parseCarURL(pathname, searchParams);
    
    setAppliedFilters(prev => ({
      ...prev,
      ...urlFilters,
    }));

    // Update individual state variables that are managed separately
    if (urlFilters.priceMin) setPriceMin(urlFilters.priceMin);
    if (urlFilters.priceMax) setPriceMax(urlFilters.priceMax);
    if (urlFilters.yearMin) setYearMin(urlFilters.yearMin);
    if (urlFilters.yearMax) setYearMax(urlFilters.yearMax);
    if (urlFilters.paymentMin) setPaymentMin(urlFilters.paymentMin);
    if (urlFilters.paymentMax) setPaymentMax(urlFilters.paymentMax);
  }, [pathname, searchParams]);

  // Update URL when filters change
  const updateFiltersAndURL = useCallback((newFilters: typeof appliedFilters, replace = false) => {
    setAppliedFilters(newFilters);
    updateURL(newFilters, replace);
  }, []);

  // Rest of the component logic is identical to the original HomePage
  // ... (I'll include the complete implementation in the next steps)

  return (
    <div
      className="min-h-screen bg-white main-container"
      style={{ fontFamily: "Albert Sans, sans-serif" }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Carzino Autos</h1>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/cars" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700">
                <Search className="w-4 h-4" />
                Vehicle Search
              </a>
            </nav>
            <div className="text-sm text-gray-500">
              SEO-Friendly URLs!
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Cars Listing Page</h1>
        <p className="text-gray-600 mb-4">
          This page supports SEO-friendly URLs like:
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <div>/cars - All vehicles</div>
          <div>/cars/toyota - All Toyota vehicles</div>
          <div>/cars/toyota/camry - Toyota Camry vehicles</div>
          <div>/cars/toyota/camry?year=2022&condition=used - With filters</div>
        </div>
        
        <div className="mt-8">
          <p className="text-gray-500">Current URL filters:</p>
          <pre className="bg-gray-100 p-4 rounded mt-2 text-left overflow-x-auto">
            {JSON.stringify(appliedFilters, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
