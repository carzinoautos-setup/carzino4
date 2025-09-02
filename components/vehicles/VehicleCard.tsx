'use client'

import React, { useState } from "react";
import { ChevronDown, Heart, Check } from "lucide-react";
import Image from "next/image";

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
  city_seller?: string;
  state_seller?: string;
  zip_seller?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onViewDetails?: (vehicle: Vehicle) => void;
  onToggleFavorite?: (vehicle: Vehicle) => void;
  favorites?: { [key: number]: Vehicle };
  keeperMessage?: number | null;
  termLength?: string;
  interestRate?: string;
  downPayment?: string;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onViewDetails,
  onToggleFavorite,
  favorites = {},
  keeperMessage = null,
  termLength = "60",
  interestRate = "5",
  downPayment = "2000",
}) => {
  const isFavorited = (vehicleId: number) => !!favorites[vehicleId];

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
    return `$${Math.round(payment).toLocaleString()}`;
  };

  const getDisplayPayment = (): string => {
    if (
      vehicle.salePrice &&
      (termLength !== "60" || interestRate !== "5" || downPayment !== "2000")
    ) {
      return calculateMonthlyPayment(
        vehicle.salePrice,
        termLength,
        interestRate,
        downPayment,
      );
    }
    return vehicle.payment || "Call for Price";
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(vehicle);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(vehicle);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg lg:rounded-xl overflow-hidden hover:shadow-lg transition-shadow vehicle-card flex flex-col h-full">
      <div className="relative">
        <Image
          src={vehicle.images?.[0] || '/placeholder.svg'}
          alt={vehicle.title}
          width={450}
          height={300}
          className="w-full object-cover"
          style={{ aspectRatio: "450/300" }}
        />
        {vehicle.featured && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full carzino-featured-badge font-medium">
            Featured!
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex gap-2 mb-2 items-center justify-between">
          <div className="flex gap-2 items-center">
            {vehicle.badges.map((badge, index) => (
              <span
                key={index}
                className="carzino-badge-label px-2 py-1 rounded font-medium"
                style={{
                  borderRadius: "7px",
                  backgroundColor: "#f9fafb",
                  color: "rgb(21, 41, 109)",
                }}
              >
                {badge}
              </span>
            ))}
            {vehicle.viewed && (
              <span
                className="carzino-badge-label px-2 py-1 rounded font-medium inline-flex items-center"
                style={{
                  borderRadius: "7px",
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  color: "rgb(21, 41, 109)",
                }}
              >
                Viewed{" "}
                <Check
                  className="w-3 h-3 ml-0.5"
                  style={{ color: "rgb(21, 41, 109)" }}
                />
              </span>
            )}
            {onToggleFavorite && (
              <Heart
                className={`w-4 h-4 cursor-pointer transition-colors ml-1 ${
                  isFavorited(vehicle.id)
                    ? "text-red-600 fill-red-600"
                    : "text-red-600 stroke-red-600 fill-white"
                }`}
                onClick={handleToggleFavorite}
              />
            )}
            {keeperMessage === vehicle.id && (
              <span className="text-xs text-gray-600 ml-1 animate-pulse">
                That's a Keeper!
              </span>
            )}
          </div>
        </div>

        <h3 
          className="carzino-vehicle-title text-gray-900 mb-2 leading-tight overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer hover:text-red-600"
          onClick={handleViewDetails}
        >
          {vehicle.title}
        </h3>

        <div className="flex items-center justify-start mb-3 pb-2 border-b border-gray-200 carzino-vehicle-details">
          <div className="flex items-center gap-1 mr-4">
            {vehicle.mileageIcon ? (
              <Image
                src={vehicle.mileageIcon}
                alt="Mileage icon"
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
            ) : (
              <Image
                src="https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F0d6e752f5db34ab7b68d449bcd4c943c"
                alt="Mileage icon"
                width={16}
                height={16}
                className="w-4 h-4"
              />
            )}
            <span className="text-black font-medium">
              {vehicle.mileage} Mi.
            </span>
          </div>
          <div className="flex items-center gap-1 mr-4">
            {vehicle.transmissionIcon ? (
              <Image
                src={vehicle.transmissionIcon}
                alt="Transmission icon"
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
            ) : (
              <Image
                src="https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fc18355c2650647dcb03280d5b23e16b2"
                alt="Transmission icon"
                width={16}
                height={16}
                className="w-4 h-4"
              />
            )}
            <span className="text-black font-medium">
              {vehicle.transmission}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 text-gray-600 flex items-center justify-center">
              {vehicle.doorIcon ? (
                <Image
                  src={vehicle.doorIcon}
                  alt="Door icon"
                  width={16}
                  height={16}
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <Image
                  src="https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa05174a249a043e3a6e3e280a57e2445"
                  alt="Door icon"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
              )}
            </div>
            <span className="text-black font-medium">
              {vehicle.doors.replace(/doors/g, "Doors")}
            </span>
          </div>
        </div>

        <div className="flex justify-center items-start gap-6 mb-1 flex-1">
          {vehicle.salePrice ? (
            <>
              <div className="text-center">
                <div className="carzino-price-label text-gray-500 mb-0">
                  Sale Price
                </div>
                <div className="carzino-price-value text-gray-900">
                  {vehicle.salePrice}
                </div>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div className="text-center">
                <div className="carzino-price-label text-gray-500 mb-0">
                  Payments
                </div>
                <div className="carzino-price-value text-red-600">
                  {getDisplayPayment()}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center w-full">
              <div className="carzino-price-label text-gray-500 mb-0">
                No Sale Price Listed
              </div>
              <div className="carzino-price-value text-gray-900">
                Call for Price
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="border-t border-gray-100 px-3 py-2 mt-auto"
        style={{ backgroundColor: "#f9fafb" }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div
              className="text-black font-medium truncate"
              style={{ fontSize: "12px" }}
            >
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
                  return [city, state, zip].filter(Boolean).join(" ") || vehicle.location;
                }
              })()}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div
              className="text-black hover:text-gray-600 cursor-pointer"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              Dealer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
