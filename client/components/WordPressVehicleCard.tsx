import React from "react";
import { Heart, MapPin } from "lucide-react";

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
  drivetrain: string;
  condition: string;
  year: string;
  make: string;
  model: string;
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

interface WordPressVehicleCardProps {
  vehicle: Vehicle;
  onFavoriteToggle?: (vehicle: Vehicle) => void;
  isFavorite?: boolean;
  className?: string;
  keeperMessage?: number | null;
  termLength?: string;
  interestRate?: string;
  downPayment?: string;
}

export function WordPressVehicleCard({
  vehicle,
  onFavoriteToggle,
  isFavorite = false,
  className = "",
  keeperMessage,
  termLength = "60",
  interestRate = "5",
  downPayment = "2000",
}: WordPressVehicleCardProps) {
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(vehicle);
  };

  const getConditionBadgeColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return "bg-green-100 text-green-800 border-green-200";
      case "certified":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "used":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDrivetrainIcon = (drivetrain: string) => {
    switch (drivetrain?.toLowerCase()) {
      case "awd":
        return "AWD";
      case "4wd":
        return "4WD";
      case "fwd":
        return "FWD";
      case "rwd":
        return "RWD";
      default:
        return drivetrain || "FWD";
    }
  };

  const formatPrice = (price: string | number | null): string => {
    if (!price) return "Call for Price";
    const numPrice = typeof price === "string" ? parseInt(price.replace(/[^\d]/g, "")) : price;
    return `$${numPrice.toLocaleString()}`;
  };

  const formatMileage = (mileage: string | number): string => {
    if (!mileage) return "0";
    const numMileage = typeof mileage === "string" ? parseInt(mileage.replace(/[^\d]/g, "")) : mileage;
    return numMileage.toLocaleString();
  };

  // Calculate monthly payment based on sale price and loan terms
  const calculateMonthlyPayment = (
    salePrice: string,
    termMonths: string,
    apr: string,
    down: string,
  ): string => {
    const price = parseFloat(salePrice.replace(/[$,]/g, ""));
    const downAmt = parseFloat(down) || 0;
    const principal = price - downAmt;
    const months = parseInt(termMonths) || 60;
    const rate = parseFloat(apr) / 100 / 12;

    if (isNaN(price) || price <= 0 || principal <= 0) {
      return vehicle.payment || "Call for Price";
    }

    if (rate === 0) {
      const payment = principal / months;
      return `$${Math.round(payment).toLocaleString()}`;
    }

    const payment =
      (principal * rate * Math.pow(1 + rate, months)) /
      (Math.pow(1 + rate, months) - 1);
    return `$${Math.round(payment).toLocaleString()}/mo*`;
  };

  const getDisplayPayment = (): string => {
    if (vehicle.salePrice && 
        (termLength !== "60" || interestRate !== "5" || downPayment !== "2000")) {
      return calculateMonthlyPayment(vehicle.salePrice, termLength, interestRate, downPayment);
    }
    return vehicle.payment || "Call for Price";
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : "/placeholder.svg"}
          alt={vehicle.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isFavorite
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-600"
          }`}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        {/* Condition Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getConditionBadgeColor(vehicle.condition)}`}
          >
            {vehicle.condition}
          </span>
        </div>

        {/* Featured Badge */}
        {vehicle.featured && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
              Featured
            </span>
          </div>
        )}
        
        {/* Keeper Message */}
        {keeperMessage === vehicle.id && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white animate-pulse">
              That's a Keeper!
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {vehicle.title}
        </h3>

        {/* Key Details - Mileage • Drivetrain • Transmission */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span>{formatMileage(vehicle.mileage)} miles</span>
          <span>•</span>
          <span>{getDrivetrainIcon(vehicle.drivetrain)}</span>
          <span>•</span>
          <span>{vehicle.transmission}</span>
        </div>

        {/* Additional Details */}
        <div className="text-sm text-gray-600 mb-3 space-y-1">
          <div className="flex justify-between">
            <span>Year:</span>
            <span>{vehicle.year}</span>
          </div>
          <div className="flex justify-between">
            <span>Doors:</span>
            <span>{vehicle.doors} doors</span>
          </div>
          <div className="flex justify-between">
            <span>Condition:</span>
            <span>{vehicle.condition}</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <div className="flex flex-col">
            <span>{vehicle.seller_type}</span>
            {(vehicle.city_seller || vehicle.state_seller || vehicle.zip_seller) && (
              <span className="text-xs text-gray-500">
                {(() => {
                  const city = vehicle.city_seller;
                  const state = vehicle.state_seller;
                  const zip = vehicle.zip_seller;

                  if (city && state && zip) {
                    return `${city}, ${state} ${zip}`;
                  } else if (city && state) {
                    return `${city}, ${state}`;
                  } else if (city && zip) {
                    return `${city} ${zip}`;
                  } else {
                    return [city, state, zip].filter(Boolean).join(" ");
                  }
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Price and Payment Info */}
        <div className="border-t pt-3 mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(vehicle.salePrice)}
            </div>
          </div>

          {/* Payment Details */}
          {(vehicle.payment || vehicle.salePrice) && (
            <div className="text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>Est. Payment:</span>
                <span className="font-medium text-red-600">
                  {getDisplayPayment()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span>
                  {interestRate}% APR • {termLength} months
                </span>
                <span>Down: ${formatMileage(downPayment)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-200 text-sm font-medium">
            View Details
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm font-medium">
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}
