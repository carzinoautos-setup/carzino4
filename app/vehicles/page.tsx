'use client'

import React, { useState, useEffect, useCallback } from "react";
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

export default function VehiclesPage() {
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

  // API State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Price and payment state
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [paymentMin, setPaymentMin] = useState("");
  const [paymentMax, setPaymentMax] = useState("");
  const [termLength, setTermLength] = useState("72");
  const [interestRate, setInterestRate] = useState("8");

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState<any>({
    condition: [],
    make: [],
    model: [],
    trim: [],
    vehicleType: [],
    driveType: [],
    exteriorColor: [],
    interiorColor: [],
    sellerType: [],
    transmission: [],
    dealer: [],
    city: [],
    state: [],
    mileage: "",
    priceMin: "",
    priceMax: "",
    paymentMin: "",
    paymentMax: "",
  });

  const clearAllFilters = () => {
    setAppliedFilters({
      condition: [],
      make: [],
      model: [],
      trim: [],
      vehicleType: [],
      driveType: [],
      exteriorColor: [],
      interiorColor: [],
      sellerType: [],
      transmission: [],
      dealer: [],
      city: [],
      state: [],
      mileage: "",
      priceMin: "",
      priceMax: "",
      paymentMin: "",
      paymentMax: "",
    });
  };

  const removeAppliedFilter = (filterType: string, value: string) => {
    setAppliedFilters((prev: any) => ({
      ...prev,
      [filterType]: prev[filterType].filter((item: string) => item !== value),
    }));
  };

  return (
    <>
      <style jsx>{`
        .carzino-filter-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #374151;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .carzino-search-input {
          padding-right: 36px;
        }

        .dropdown-content {
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown-content::-webkit-scrollbar {
          width: 4px;
        }

        .dropdown-content::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .dropdown-content::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 2px;
        }

        .dropdown-content::-webkit-scrollbar-thumb:hover {
          background: #999;
        }

        /* Checkbox Styling */
        input[type="checkbox"] {
          position: relative;
          appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s ease;
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
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                    <Check className="w-3 h-3 text-red-600" />
                    Del Toro Auto Sales
                    <button className="ml-1 text-white hover:text-gray-300">
                      ×
                    </button>
                  </span>
                </div>
              </div>
            )}

            {/* Distance Filter */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="carzino-filter-title">Distance</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                />
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
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

            {/* Make Filter */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <button 
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowMoreMakes(!showMoreMakes)}
              >
                <h3 className="carzino-filter-title">Make</h3>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreMakes ? 'rotate-180' : ''}`} />
              </button>
              {showMoreMakes && (
                <div className="dropdown-content mt-2">
                  {["Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "FIAT"].map((make) => (
                    <label key={make} className="flex items-center space-x-3 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{make}</span>
                      <span className="text-xs text-gray-500 ml-auto">({Math.floor(Math.random() * 50)})</span>
                    </label>
                  ))}
                  <button className="text-red-600 text-sm mt-2">Show More</button>
                </div>
              )}
            </div>

            {/* Model Filter */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <button 
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowMoreModels(!showMoreModels)}
              >
                <h3 className="carzino-filter-title">Model</h3>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreModels ? 'rotate-180' : ''}`} />
              </button>
              {showMoreModels && (
                <div className="dropdown-content mt-2">
                  {/* Model options would go here */}
                </div>
              )}
            </div>

            {/* Trim Filter */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <button 
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowMoreTrims(!showMoreTrims)}
              >
                <h3 className="carzino-filter-title">Trim</h3>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreTrims ? 'rotate-180' : ''}`} />
              </button>
              {showMoreTrims && (
                <div className="dropdown-content mt-2">
                  {/* Trim options would go here */}
                </div>
              )}
            </div>

            {/* Price Filter */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="carzino-filter-title">Filter by Price</h3>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="$10,000"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="text"
                    placeholder="$100,000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                  />
                </div>
                <button className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700">
                  Apply Price Filter
                </button>
              </div>
            </div>

            {/* Vehicle Type Filter */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="carzino-filter-title">Search by Vehicle Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: "convertible", count: 14 },
                  { type: "coupe", count: 12 },
                  { type: "crew-cab", count: 23 },
                  { type: "crossover-suv", count: 78 },
                  { type: "extended-cab", count: 3 },
                  { type: "hatchback", count: 8 },
                  { type: "regular-cab-truck", count: 8 },
                  { type: "sedan", count: 71 },
                  { type: "uncategorized", count: 1 },
                  { type: "van-minivan", count: 18 },
                  { type: "wagon", count: 13 }
                ].map((vehicleType) => (
                  <div key={vehicleType.type} className="border border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:border-red-600">
                    <div className="mb-2">
                      <div className="text-2xl">🚗</div>
                    </div>
                    <div className="text-xs font-medium">{vehicleType.type}</div>
                    <div className="text-xs text-gray-500">({vehicleType.count})</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Filter */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="carzino-filter-title">Search by Payment</h3>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <div className="flex-1 flex items-center border border-gray-300 rounded-md px-3 py-2">
                    <span className="text-gray-600">$</span>
                    <input
                      type="text"
                      placeholder="100"
                      value={paymentMin}
                      onChange={(e) => setPaymentMin(e.target.value)}
                      className="flex-1 ml-1 outline-none"
                    />
                    <span className="text-gray-600">/mo</span>
                  </div>
                  <div className="flex-1 flex items-center border border-gray-300 rounded-md px-3 py-2">
                    <span className="text-gray-600">$</span>
                    <input
                      type="text"
                      placeholder="2,000"
                      value={paymentMax}
                      onChange={(e) => setPaymentMax(e.target.value)}
                      className="flex-1 ml-1 outline-none"
                    />
                    <span className="text-gray-600">/mo</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={termLength}
                    onChange={(e) => setTermLength(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                  >
                    <option value="3">3% APR</option>
                    <option value="4">4% APR</option>
                    <option value="5">5% APR</option>
                    <option value="6">6% APR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="mb-4 lg:hidden">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md"
            >
              <Sliders className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Inventory</h1>
            <p className="text-gray-600">Browse our complete vehicle inventory with advanced filtering</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-red-600" />
              <span className="ml-2">Loading vehicles...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <span className="ml-2 text-red-600">Error loading vehicles</span>
            </div>
          ) : (
            <div className="vehicle-grid grid">
              {vehicles.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No vehicles found with current filters</p>
                </div>
              ) : (
                vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="vehicle-card bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-48 bg-gray-200">
                      {/* Vehicle image would go here */}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{vehicle.title}</h3>
                      <p className="text-gray-600 mb-2">{vehicle.mileage} • {vehicle.transmission}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-red-600">{vehicle.salePrice}</span>
                        <button className="p-2 text-gray-400 hover:text-red-600">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{vehicle.dealer}</p>
                      <p className="text-sm text-gray-500">{vehicle.location}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
