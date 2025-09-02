'use client'

import React, { useState, useEffect } from "react";
import {
  Search,
  Gauge,
  Settings,
  ChevronDown,
  X,
  Heart,
  Sliders,
  Check,
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
}

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 47;
  const totalResults = 8527;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState("all");
  const [favorites, setFavorites] = useState<{ [key: number]: Vehicle }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);

  // Sample vehicle data
  const sampleVehicles: Vehicle[] = [
    {
      id: 1,
      featured: true,
      viewed: true,
      images: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop",
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=450&h=300&fit=crop",
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop",
        "https://images.unsplash.com/photo-1580414155477-c81e8ce44a14?w=450&h=300&fit=crop",
      ],
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
    },
    {
      id: 2,
      featured: false,
      viewed: false,
      images: [
        "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=450&h=300&fit=crop",
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=450&h=300&fit=crop",
      ],
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
    },
    {
      id: 3,
      featured: false,
      viewed: true,
      images: [
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop",
      ],
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
    },
    {
      id: 4,
      featured: false,
      viewed: false,
      images: [
        "https://images.unsplash.com/photo-1563720223185-11003d516935?w=450&h=300&fit=crop",
      ],
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
    },
    {
      id: 5,
      featured: true,
      viewed: true,
      images: [
        "https://images.unsplash.com/photo-1494976793431-05c5c2b1b1b1?w=450&h=300&fit=crop",
      ],
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
    },
    {
      id: 6,
      featured: false,
      viewed: false,
      images: [
        "https://images.unsplash.com/photo-1550355191-aa8a80b41353?w=450&h=300&fit=crop",
      ],
      badges: ["New", "RWD"],
      title: "2025 Chevrolet Silverado 1500 LT",
      mileage: "5",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$45,995",
      payment: "$599",
      dealer: "Northwest Chevrolet",
      location: "Everett, WA",
      phone: "(425) 555-0267",
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
    if (newFavorites[vehicle.id]) {
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
    return sampleVehicles;
  };

  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Albert Sans, sans-serif" }}>
      {/* Navigation Header */}
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
              Your Original Work is Back!
            </div>
          </div>
        </div>
      </header>

      <style>{`
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
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
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
      `}</style>

      <div className="flex flex-col lg:flex-row min-h-screen max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="bg-white border-r border-gray-200 w-80">
          <div className="p-4">
            {/* Search Section */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Vehicles"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Quick Filters</h3>
                <div className="space-y-2">
                  {["New", "Used", "Certified"].map((condition) => (
                    <label key={condition} className="flex items-center hover:bg-gray-50 p-2 rounded cursor-pointer">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">{condition}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Popular Makes</h3>
                <div className="space-y-2">
                  {["Ford", "Tesla", "Honda", "Toyota", "BMW", "Chevrolet"].map((make) => (
                    <label key={make} className="flex items-center hover:bg-gray-50 p-2 rounded cursor-pointer">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">{make}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Price Range</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Min Price"
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="text"
                    placeholder="Max Price"
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white">
          {/* Top Bar */}
          <div className="border-b border-gray-200 bg-white sticky top-16 z-10">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {totalResults.toLocaleString()} Vehicles Found
                  </h1>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
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
                  </div>
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
              <div className="vehicle-grid">
                {displayedVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    keeperMessage={keeperMessage}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Vehicle Card Component
function VehicleCard({ vehicle, favorites, onToggleFavorite, keeperMessage }: {
  vehicle: Vehicle;
  favorites: { [key: number]: Vehicle };
  onToggleFavorite: (vehicle: Vehicle) => void;
  keeperMessage: number | null;
}) {
  const isFavorited = !!favorites[vehicle.id];
  const showKeeper = keeperMessage === vehicle.id;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Vehicle Image */}
      <div className="relative">
        <img
          src={vehicle.images[0]}
          alt={vehicle.title}
          className="w-full h-48 object-cover"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {vehicle.badges.map((badge, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-black text-white text-xs font-medium rounded"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(vehicle)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          <Heart
            className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}`}
          />
        </button>

        {/* Image Counter */}
        {vehicle.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            1/{vehicle.images.length}
          </div>
        )}
      </div>

      {/* Vehicle Details */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{vehicle.title}</h3>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <Gauge className="w-4 h-4" />
            {vehicle.mileage} mi
          </span>
          <span className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            {vehicle.transmission}
          </span>
          <span>{vehicle.doors}</span>
        </div>

        {/* Pricing */}
        <div className="mb-3">
          {vehicle.salePrice ? (
            <div>
              <div className="text-2xl font-bold text-gray-900">{vehicle.salePrice}</div>
              {vehicle.payment && (
                <div className="text-sm text-gray-600">Est. ${vehicle.payment}/mo</div>
              )}
            </div>
          ) : (
            <div className="text-lg font-semibold text-gray-900">Call for Price</div>
          )}
        </div>

        {/* Dealer Info */}
        <div className="text-sm text-gray-600">
          <div className="font-medium">{vehicle.dealer}</div>
          <div>{vehicle.location}</div>
          <div>{vehicle.phone}</div>
        </div>

        {/* Keeper Message */}
        {showKeeper && (
          <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800">
            Added to favorites!
          </div>
        )}
      </div>
    </div>
  );
}
