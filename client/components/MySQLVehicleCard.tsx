import React from "react";
import { Heart, MapPin } from "lucide-react";
import {
  VehicleRecord,
  formatPrice,
  formatMileage,
  getVehicleTitle,
  getVehicleImageUrl,
} from "../lib/vehicleApi";

interface MySQLVehicleCardProps {
  vehicle: VehicleRecord;
  onFavoriteToggle?: (vehicleId: number) => void;
  isFavorite?: boolean;
  className?: string;
}

export function MySQLVehicleCard({
  vehicle,
  onFavoriteToggle,
  isFavorite = false,
  className = "",
}: MySQLVehicleCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(vehicle.id);
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
      case "4wd":
        return "4WD";
      case "fwd":
        return "FWD";
      case "rwd":
        return "RWD";
      default:
        return drivetrain;
    }
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={getVehicleImageUrl(vehicle)}
          alt={getVehicleTitle(vehicle)}
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

        {/* Certified Badge */}
        {vehicle.certified && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
              Certified
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {getVehicleTitle(vehicle)}
        </h3>

        {/* Key Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span>{formatMileage(vehicle.mileage)} miles</span>
          <span>•</span>
          <span>{getDrivetrainIcon(vehicle.drivetrain)}</span>
          <span>•</span>
          <span>{vehicle.fuel_type}</span>
        </div>

        {/* Additional Details */}
        <div className="text-sm text-gray-600 mb-3 space-y-1">
          <div className="flex justify-between">
            <span>Engine:</span>
            <span>
              {vehicle.engine_cylinders}L {vehicle.transmission}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Exterior:</span>
            <span>{vehicle.exterior_color_generic}</span>
          </div>
          <div className="flex justify-between">
            <span>MPG:</span>
            <span>{vehicle.highway_mpg} highway</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <div className="flex flex-col">
            <span>{vehicle.seller_type}</span>
            {/* Add city, state, zip if available */}
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
              {formatPrice(vehicle.price)}
            </div>
            {vehicle.title_status !== "Clean" && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                {vehicle.title_status} Title
              </span>
            )}
          </div>

          {/* Payment Details */}
          {vehicle.payments > 0 && (
            <div className="text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>Est. Payment:</span>
                <span className="font-medium">
                {formatPrice(vehicle.payments)}/month*
              </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>
                  {vehicle.interest_rate}% APR • {vehicle.loan_term} months
                </span>
                <span>Down: {formatPrice(vehicle.down_payment)}</span>
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

// Loading skeleton component
export function VehicleCardSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse ${className}`}
    >
      <div className="aspect-[4/3] bg-gray-200"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
        <div className="border-t pt-3">
          <div className="h-8 bg-gray-200 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
