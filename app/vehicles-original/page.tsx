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
} from "lucide-react";

// Import components from client directory
import { VehicleCard } from "../../client/components/VehicleCard";
import { FilterSection } from "../../client/components/FilterSection";
import { VehicleTypeCard } from "../../client/components/VehicleTypeCard";
import { Pagination } from "../../client/components/Pagination";
import { NavigationHeader } from "../../client/components/NavigationHeader";

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

export default function OriginalVehiclesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 47;
  const totalResults = 8527;
  const resultsPerPage = 25;
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
    condition: ["New"],
    make: ["Audi"],
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
    const savedFavorites = JSON.parse(
      localStorage.getItem("carzino_favorites") || "{}",
    );
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
    if (viewMode === "favorites") {
      return Object.values(favorites);
    }
    return sampleVehicles;
  };

  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  // Vehicle type images - removed Builder.io demo images
  useEffect(() => {
    setVehicleImages({});
  }, []);

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

  const handleMakeChange = (makeName: string, isChecked: boolean) => {
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
    setAppliedFilters((prev) => ({
      ...prev,
      trim: isChecked
        ? [...prev.trim, trimName]
        : prev.trim.filter((item) => item !== trimName),
    }));
  };

  const handleVehicleTypeToggle = (vehicleType: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      vehicleType: prev.vehicleType.includes(vehicleType)
        ? prev.vehicleType.filter((item) => item !== vehicleType)
        : [...prev.vehicleType, vehicleType],
    }));
  };

  // Vehicle data
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
      bodyTypes: [
        { name: "Sedan", count: 75 },
        { name: "SUV / Crossover", count: 68 },
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
      bodyTypes: [
        { name: "Sedan", count: 110 },
        { name: "SUV / Crossover", count: 79 },
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
      bodyTypes: [
        { name: "Truck", count: 98 },
        { name: "SUV / Crossover", count: 114 },
        { name: "Sedan", count: 43 },
        { name: "Coupe", count: 32 },
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
      bodyTypes: [
        { name: "Truck", count: 201 },
        { name: "SUV / Crossover", count: 258 },
        { name: "Coupe", count: 64 },
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
      bodyTypes: [
        { name: "Sedan", count: 156 },
        { name: "SUV / Crossover", count: 68 },
        { name: "Hatchback", count: 10 },
      ],
      trims: [
        { name: "LX", count: 78 },
        { name: "EX", count: 89 },
        { name: "EX-L", count: 45 },
        { name: "Touring", count: 22 },
      ],
    },
    Hyundai: {
      count: 176,
      models: [
        { name: "Elantra", count: 54 },
        { name: "Sonata", count: 43 },
        { name: "Tucson", count: 38 },
        { name: "Santa Fe", count: 25 },
        { name: "Palisade", count: 16 },
      ],
      bodyTypes: [
        { name: "Sedan", count: 97 },
        { name: "SUV / Crossover", count: 79 },
      ],
      trims: [
        { name: "SE", count: 56 },
        { name: "SEL", count: 67 },
        { name: "Limited", count: 53 },
      ],
    },
    "Mercedes-Benz": {
      count: 156,
      models: [
        { name: "C-Class", count: 45 },
        { name: "E-Class", count: 34 },
        { name: "GLC", count: 28 },
        { name: "GLE", count: 23 },
        { name: "S-Class", count: 15 },
        { name: "A-Class", count: 11 },
      ],
      bodyTypes: [
        { name: "Sedan", count: 105 },
        { name: "SUV / Crossover", count: 51 },
      ],
      trims: [
        { name: "Base", count: 43 },
        { name: "Premium", count: 54 },
        { name: "AMG", count: 34 },
        { name: "Luxury", count: 25 },
      ],
    },
    Nissan: {
      count: 198,
      models: [
        { name: "Altima", count: 76 },
        { name: "Sentra", count: 45 },
        { name: "Rogue", count: 38 },
        { name: "Pathfinder", count: 23 },
        { name: "Murano", count: 16 },
      ],
      bodyTypes: [
        { name: "Sedan", count: 121 },
        { name: "SUV / Crossover", count: 77 },
      ],
      trims: [
        { name: "S", count: 67 },
        { name: "SV", count: 78 },
        { name: "SL", count: 34 },
        { name: "Platinum", count: 19 },
      ],
    },
    Subaru: {
      count: 122,
      models: [
        { name: "Outback", count: 52 },
        { name: "Forester", count: 34 },
        { name: "Impreza", count: 21 },
        { name: "Ascent", count: 15 },
      ],
      trims: [
        { name: "Base", count: 34 },
        { name: "Premium", count: 43 },
        { name: "Limited", count: 28 },
        { name: "Touring", count: 17 },
      ],
    },
    Tesla: {
      count: 45,
      models: [
        { name: "Model 3", count: 23 },
        { name: "Model Y", count: 12 },
        { name: "Model S", count: 6 },
        { name: "Model X", count: 4 },
      ],
      trims: [
        { name: "Standard Range", count: 15 },
        { name: "Long Range", count: 18 },
        { name: "Performance", count: 12 },
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
    Volkswagen: {
      count: 134,
      models: [
        { name: "Jetta", count: 43 },
        { name: "Passat", count: 32 },
        { name: "Tiguan", count: 28 },
        { name: "Atlas", count: 19 },
        { name: "Golf", count: 12 },
      ],
      bodyTypes: [
        { name: "Sedan", count: 75 },
        { name: "SUV / Crossover", count: 47 },
        { name: "Hatchback", count: 12 },
      ],
      trims: [
        { name: "S", count: 45 },
        { name: "SE", count: 54 },
        { name: "SEL", count: 35 },
      ],
    },
  };

  const allMakes = Object.entries(vehicleDatabase).map(([name, data]) => ({
    name,
    count: data.count,
  }));

  const getAvailableModels = () => {
    if (appliedFilters.make.length === 0) {
      return Object.values(vehicleDatabase).flatMap((makeData) =>
        makeData.models.map((model) => ({
          ...model,
          make: Object.keys(vehicleDatabase).find(
            (key) => vehicleDatabase[key] === makeData,
          ),
        })),
      );
    }

    return appliedFilters.make.flatMap(
      (selectedMake) =>
        vehicleDatabase[selectedMake]?.models.map((model) => ({
          ...model,
          make: selectedMake,
        })) || [],
    );
  };

  const getAvailableTrims = () => {
    if (appliedFilters.make.length === 0) {
      return Object.values(vehicleDatabase).flatMap(
        (makeData) => makeData.trims,
      );
    }

    const availableTrims: { name: string; count: number }[] = [];
    appliedFilters.make.forEach((selectedMake) => {
      if (vehicleDatabase[selectedMake]) {
        availableTrims.push(...vehicleDatabase[selectedMake].trims);
      }
    });

    const trimMap = new Map();
    availableTrims.forEach((trim) => {
      if (trimMap.has(trim.name)) {
        trimMap.set(trim.name, {
          name: trim.name,
          count: trimMap.get(trim.name).count + trim.count,
        });
      } else {
        trimMap.set(trim.name, trim);
      }
    });

    return Array.from(trimMap.values());
  };

  const getAvailableBodyTypes = () => {
    if (appliedFilters.make.length === 0) {
      return bodyTypes;
    }

    const availableBodyTypes: { name: string; count: number }[] = [];
    appliedFilters.make.forEach((selectedMake) => {
      if (
        vehicleDatabase[selectedMake] &&
        vehicleDatabase[selectedMake].bodyTypes
      ) {
        availableBodyTypes.push(...vehicleDatabase[selectedMake].bodyTypes);
      }
    });

    const bodyTypeMap = new Map();
    availableBodyTypes.forEach((bodyType) => {
      if (bodyTypeMap.has(bodyType.name)) {
        bodyTypeMap.set(bodyType.name, {
          name: bodyType.name,
          count: bodyTypeMap.get(bodyType.name).count + bodyType.count,
        });
      } else {
        bodyTypeMap.set(bodyType.name, bodyType);
      }
    });

    return Array.from(bodyTypeMap.values());
  };

  const availableModels = getAvailableModels();
  const availableTrims = getAvailableTrims();
  const availableBodyTypes = getAvailableBodyTypes();

  const exteriorColors = [
    { name: "White", count: 9427, color: "#FFFFFF" },
    { name: "Black", count: 8363, color: "#000000" },
    { name: "Gray", count: 7502, color: "#808080" },
    { name: "Silver", count: 5093, color: "#C0C0C0" },
    { name: "Blue", count: 4266, color: "#0066CC" },
    { name: "Red", count: 3436, color: "#CC0000" },
  ];

  const displayedMakes = showMoreMakes ? allMakes : allMakes.slice(0, 8);
  const displayedModels = showMoreModels
    ? availableModels
    : availableModels.slice(0, 8);
  const displayedTrims = showMoreTrims
    ? availableTrims
    : availableTrims.slice(0, 8);

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
              appliedFilters.driveType.length > 0 ||
              appliedFilters.vehicleType.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.exteriorColor.length > 0 ||
              appliedFilters.sellerType.length > 0 ||
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
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
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
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
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
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
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

            {/* Make */}
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

            {/* Model Filter */}
            <FilterSection
              title={`Model ${appliedFilters.make.length > 0 ? `(${appliedFilters.make.join(", ")})` : ""}`}
              isCollapsed={collapsedFilters.model}
              onToggle={() => toggleFilter("model")}
            >
              <div className="space-y-1">
                {appliedFilters.make.length === 0 ? null : displayedModels.length === 0 ? (
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
                      <span className="carzino-filter-count ml-1">
                        ({model.count})
                      </span>
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
                {appliedFilters.model.length === 0 ? null : displayedTrims.length === 0 ? (
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
                      <span className="carzino-filter-count ml-1">
                        ({trim.count})
                      </span>
                    </label>
                  ))
                )}
                {availableTrims.length > 8 && (
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
              title="Search by Vehicle Type"
              isCollapsed={collapsedFilters.vehicleType}
              onToggle={() => toggleFilter("vehicleType")}
            >
              <div className="grid grid-cols-2 gap-2">
                {availableBodyTypes.map((type, index) => (
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
                    setAppliedFilters((prev) => ({
                      ...prev,
                      priceMin: priceMin,
                      priceMax: priceMax,
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
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="100"
                      value={paymentMin}
                      onChange={(e) => setPaymentMin(e.target.value)}
                      className="w-full pl-6 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                      /mo
                    </span>
                  </div>
                  <div className="relative w-1/2">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="2,000"
                      value={paymentMax}
                      onChange={(e) => setPaymentMax(e.target.value)}
                      className="w-full pl-6 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                      /mo
                    </span>
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
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="text"
                    placeholder={downPayment ? "" : "2,000 Down Payment"}
                    value={downPayment}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d,]/g, "");
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
                      setAppliedFilters((prev) => ({
                        ...prev,
                        paymentMin: "",
                        paymentMax: "",
                      }));
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 text-sm"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setAppliedFilters((prev) => ({
                        ...prev,
                        paymentMin: paymentMin,
                        paymentMax: paymentMax,
                      }));
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                  >
                    Apply
                  </button>
                </div>
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
                  <label
                    key={condition}
                    className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.condition.includes(condition)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAppliedFilters((prev) => ({
                            ...prev,
                            condition: [...prev.condition, condition],
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
                  setAppliedFilters((prev) => ({
                    ...prev,
                    mileage: e.target.value,
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

            {/* Exterior Color Filter */}
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
