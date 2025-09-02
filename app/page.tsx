'use client'

import React, { useState, useEffect, useRef } from "react";
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
  mileage: string;
  transmission: string;
  doors: string;
  doorIcon?: string;
  mileageIcon?: string;
  transmissionIcon?: string;
  salePrice: string | null;
  payment: string | null;
  dealer: string;
  location: string;
  phone: string;
  seller_type: string;
  seller_account_number: string;
  city_seller?: string;
  state_seller?: string;
  zip_seller?: string;
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
    dealer: false,
    state: true,
    city: true,
  });

  // Sample vehicle data with your exact structure
  const sampleVehicles: Vehicle[] = [
    {
      id: 1,
      featured: true,
      viewed: false,
      images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop"],
      badges: ["Low Mileage", "Clean Title"],
      title: "2020 Honda Civic LX",
      mileage: "25,000",
      transmission: "Automatic",
      doors: "4 Doors",
      salePrice: "$18,500",
      payment: "$299",
      dealer: "AutoMax Dealership",
      location: "Downtown Location",
      phone: "(555) 123-4567",
      seller_type: "Dealer",
      seller_account_number: "D12345",
      city_seller: "Seattle",
      state_seller: "WA",
      zip_seller: "98101",
    },
    {
      id: 2,
      featured: false,
      viewed: true,
      images: ["https://images.unsplash.com/photo-1617788138017-80ad40651399?w=450&h=300&fit=crop"],
      badges: ["New", "4WD"],
      title: "2025 Ford F-150 Lariat SuperCrew",
      mileage: "8",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$67,899",
      payment: "$789",
      dealer: "Bayside Ford",
      location: "Lakewood, WA",
      phone: "(253) 555-0123",
      seller_type: "Dealer", 
      seller_account_number: "F67890",
      city_seller: "Lakewood",
      state_seller: "WA", 
      zip_seller: "98499",
    },
    {
      id: 3,
      featured: false,
      viewed: false,
      images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop"],
      badges: ["Used", "AWD"],
      title: "2024 Tesla Model 3 Long Range",
      mileage: "2,847",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: null,
      payment: null,
      dealer: "Premium Auto Group",
      location: "Tacoma, WA",
      phone: "(253) 555-0187",
      seller_type: "Dealer",
      seller_account_number: "T11111",
      city_seller: "Tacoma",
      state_seller: "WA",
      zip_seller: "98402",
    },
    {
      id: 4,
      featured: false,
      viewed: true,
      images: ["https://images.unsplash.com/photo-1563720223185-11003d516935?w=450&h=300&fit=crop"],
      badges: ["New", "AWD"],
      title: "2024 Honda CR-V Hybrid EX-L",
      mileage: "15",
      transmission: "CVT",
      doors: "4 doors",
      salePrice: "$39,899",
      payment: "$489",
      dealer: "Downtown Honda",
      location: "Federal Way, WA",
      phone: "(253) 555-0156",
      seller_type: "Dealer",
      seller_account_number: "H22222",
      city_seller: "Federal Way",
      state_seller: "WA",
      zip_seller: "98003",
    },
    {
      id: 5,
      featured: true,
      viewed: true,
      images: ["https://images.unsplash.com/photo-1494976793431-05c5c2b1b1b1?w=450&h=300&fit=crop"],
      badges: ["Used", "FWD"],
      title: "2023 Toyota Camry LE",
      mileage: "12,450",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$28,500",
      payment: "$395",
      dealer: "City Toyota",
      location: "Seattle, WA",
      phone: "(206) 555-0198",
      seller_type: "Dealer",
      seller_account_number: "T33333", 
      city_seller: "Seattle",
      state_seller: "WA",
      zip_seller: "98109",
    },
    {
      id: 6,
      featured: false,
      viewed: false,
      images: ["https://images.unsplash.com/photo-1550355191-aa8a80b41353?w=450&h=300&fit=crop"],
      badges: ["Certified", "AWD"],
      title: "2022 BMW X3 xDrive30i",
      mileage: "18,920",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: null,
      payment: null,
      dealer: "Luxury Motors",
      location: "Bellevue, WA",
      phone: "(425) 555-0234",
      seller_type: "Dealer",
      seller_account_number: "B44444",
      city_seller: "Bellevue",
      state_seller: "WA",
      zip_seller: "98004",
    },
  ];

  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem("carzino_favorites") || "{}");
    setFavorites(savedFavorites);
  }, []);

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
      vehiclesToDisplay = sampleVehicles;
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

  // Make-to-Model mapping for conditional filtering
  const vehicleDatabase = {
    Audi: {
      count: 143,
      models: [
        { name: "A3", count: 15 },
        { name: "A4", count: 38 },
        { name: "A6", count: 22 },
        { name: "Q5", count: 31 },
        { name: "Q7", count: 18 },
        { name: "Q8", count: 19 },
      ],
      trims: [
        { name: "Premium", count: 45 },
        { name: "Premium Plus", count: 38 },
        { name: "Prestige", count: 32 },
        { name: "S Line", count: 28 },
      ],
    },
    BMW: {
      count: 189,
      models: [
        { name: "3 Series", count: 67 },
        { name: "5 Series", count: 43 },
        { name: "X3", count: 34 },
        { name: "X5", count: 28 },
        { name: "X7", count: 17 },
      ],
      trims: [
        { name: "Base", count: 52 },
        { name: "Sport", count: 48 },
        { name: "Luxury", count: 41 },
        { name: "M Package", count: 48 },
      ],
    },
    Chevrolet: {
      count: 287,
      models: [
        { name: "Silverado", count: 98 },
        { name: "Equinox", count: 56 },
        { name: "Malibu", count: 43 },
        { name: "Traverse", count: 38 },
        { name: "Camaro", count: 32 },
        { name: "Tahoe", count: 20 },
      ],
      trims: [
        { name: "Base", count: 87 },
        { name: "LT", count: 95 },
        { name: "LTZ", count: 62 },
        { name: "Premier", count: 43 },
      ],
    },
    Ford: {
      count: 523,
      models: [
        { name: "F-150", count: 156 },
        { name: "Escape", count: 87 },
        { name: "Explorer", count: 76 },
        { name: "Mustang", count: 64 },
        { name: "Edge", count: 53 },
        { name: "Expedition", count: 42 },
        { name: "Ranger", count: 45 },
      ],
      trims: [
        { name: "Base", count: 134 },
        { name: "XLT", count: 156 },
        { name: "Lariat", count: 123 },
        { name: "Limited", count: 78 },
        { name: "Platinum", count: 32 },
      ],
    },
    Honda: {
      count: 234,
      models: [
        { name: "Civic", count: 89 },
        { name: "Accord", count: 67 },
        { name: "CR-V", count: 45 },
        { name: "Pilot", count: 23 },
        { name: "HR-V", count: 10 },
      ],
      trims: [
        { name: "LX", count: 78 },
        { name: "EX", count: 89 },
        { name: "EX-L", count: 45 },
        { name: "Touring", count: 22 },
      ],
    },
    Toyota: {
      count: 412,
      models: [
        { name: "Camry", count: 134 },
        { name: "Corolla", count: 89 },
        { name: "RAV4", count: 76 },
        { name: "Highlander", count: 54 },
        { name: "Prius", count: 32 },
        { name: "Tacoma", count: 27 },
      ],
      trims: [
        { name: "L", count: 89 },
        { name: "LE", count: 123 },
        { name: "XLE", count: 98 },
        { name: "Limited", count: 67 },
        { name: "Platinum", count: 35 },
      ],
    },
  };

  const allMakes = Object.entries(vehicleDatabase).map(([name, data]) => ({
    name,
    count: data.count,
  }));

  const displayedMakes = showMoreMakes ? allMakes : allMakes.slice(0, 8);
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
                        // Handle make change logic
                      }}
                    />
                    <span className="carzino-filter-option">{make.name}</span>
                    <span className="carzino-filter-count ml-1">({make.count})</span>
                  </label>
                ))}
                {allMakes.length > 8 && (
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

            {/* Condition Filter */}
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
                  ["A3", "A4", "A6", "Q5", "Q7", "Civic", "Accord", "CR-V", "F-150", "Mustang", "Camry", "Corolla", "RAV4"].map((model) => (
                    <label key={model} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.model.includes(model)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              model: [...prev.model, model]
                            }));
                          } else {
                            removeAppliedFilter("model", model);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{model}</span>
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
                  ["Base", "LX", "EX", "EX-L", "Touring", "Sport", "Limited", "Premium", "Platinum"].map((trim) => (
                    <label key={trim} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.trim.includes(trim)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppliedFilters(prev => ({
                              ...prev,
                              trim: [...prev.trim, trim]
                            }));
                          } else {
                            removeAppliedFilter("trim", trim);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{trim}</span>
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

            {/* Drive Type Filter */}
            <FilterSection
              title="Drive Type"
              isCollapsed={collapsedFilters.driveType}
              onToggle={() => toggleFilter("driveType")}
            >
              <div className="space-y-1">
                {["AWD", "4WD", "FWD", "RWD"].map((driveType) => (
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
                ))}
              </div>
            </FilterSection>

            {/* Transmission Filter */}
            <FilterSection
              title="Transmission"
              isCollapsed={collapsedFilters.transmissionSpeed}
              onToggle={() => toggleFilter("transmissionSpeed")}
            >
              <div className="space-y-1">
                {["Automatic", "Manual", "CVT"].map((transmission) => (
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
                          removeAppliedFilter("transmission", transmission);
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{transmission}</span>
                  </label>
                ))}
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
                ))}
              </div>
            </FilterSection>

            {/* Interior Color Filter */}
            <FilterSection
              title="Interior Color"
              isCollapsed={collapsedFilters.interiorColor}
              onToggle={() => toggleFilter("interiorColor")}
            >
              <div className="space-y-1">
                {[
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
                {["Dealer", "Private Seller", "Fleet"].map((sellerType) => (
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
                ))}
              </div>
            </FilterSection>

            {/* Dealer Filter */}
            <FilterSection
              title="Dealer"
              isCollapsed={collapsedFilters.dealer}
              onToggle={() => toggleFilter("dealer")}
            >
              <div className="space-y-1">
                {["AutoMax Dealership", "Bayside Ford", "Premium Auto Group", "Downtown Honda", "City Toyota", "Luxury Motors"].map((dealer) => (
                  <label key={dealer} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.dealer.includes(dealer)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAppliedFilters(prev => ({
                            ...prev,
                            dealer: [...prev.dealer, dealer]
                          }));
                        } else {
                          removeAppliedFilter("dealer", dealer);
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{dealer}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* State Filter */}
            <FilterSection
              title="State"
              isCollapsed={collapsedFilters.state}
              onToggle={() => toggleFilter("state")}
            >
              <div className="space-y-1">
                {["WA", "CA", "OR", "TX", "FL", "NY"].map((state) => (
                  <label key={state} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.state.includes(state)}
                      onChange={(e) => {
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
                ))}
              </div>
            </FilterSection>

            {/* City Filter */}
            <FilterSection
              title="City"
              isCollapsed={collapsedFilters.city}
              onToggle={() => toggleFilter("city")}
            >
              <div className="space-y-1">
                {["Seattle", "Lakewood", "Tacoma", "Federal Way", "Bellevue", "Everett"].map((city) => (
                  <label key={city} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.city.includes(city)}
                      onChange={(e) => {
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
                ))}
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

                  <div className="hidden lg:flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-gray-900">
                      {totalResults.toLocaleString()} Vehicles Found
                    </h1>
                    <span className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="view-switcher">
                    <button
                      onClick={() => setViewMode("all")}
                      className={viewMode === "all" ? "active" : ""}
                    >
                      All Vehicles
                    </button>
                    <button
                      onClick={() => setViewMode("favorites")}
                      className={viewMode === "favorites" ? "active" : ""}
                    >
                      <Heart className="w-4 h-4" />
                      Favorites ({favoritesCount})
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <span className="text-sm">Sort: {sortBy}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {sortDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                        {["Relevance", "Price: Low to High", "Price: High to Low", "Year: Newest First", "Year: Oldest First", "Mileage: Low to High", "Mileage: High to Low"].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSortBy(option);
                              setSortDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:hidden mt-3">
                <div className="text-sm text-gray-600">
                  {totalResults.toLocaleString()} vehicles • Page {currentPage} of {totalPages}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Grid */}
          <div className="p-4">
            {displayedVehicles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {viewMode === "favorites" ? "No favorites saved yet" : "No vehicles found"}
                </p>
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
