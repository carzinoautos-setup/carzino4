'use client'

import React, { useState } from "react";
import { VehicleCard } from "../../client/components/VehicleCard";
import { IconUploader } from "../../client/components/IconUploader";

export default function IconDemo() {
  const [customDoorIcon, setCustomDoorIcon] = useState<string>("");
  const [customMileageIcon, setCustomMileageIcon] = useState<string>("");
  const [customTransmissionIcon, setCustomTransmissionIcon] =
    useState<string>("");

  // Sample vehicle data for demonstration
  const sampleVehicle = {
    id: 1,
    featured: true,
    viewed: false,
    images: ["/placeholder.svg"],
    badges: ["Low Mileage", "Clean Title"],
    title: "2020 Honda Civic LX",
    mileage: "25,000",
    transmission: "Automatic",
    doors: "4 Doors",
    doorIcon: customDoorIcon || undefined,
    mileageIcon: customMileageIcon || undefined,
    transmissionIcon: customTransmissionIcon || undefined,
    salePrice: "$18,500",
    payment: "$299",
    dealer: "AutoMax Dealership",
    location: "Downtown Location",
    phone: "(555) 123-4567",
    seller_type: "Dealer",
  };

  const [favorites, setFavorites] = useState<{ [key: number]: any }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);

  const handleToggleFavorite = (vehicle: any) => {
    setFavorites((prev) => {
      const newFavorites = { ...prev };
      if (newFavorites[vehicle.id]) {
        delete newFavorites[vehicle.id];
      } else {
        newFavorites[vehicle.id] = vehicle;
        setKeeperMessage(vehicle.id);
        setTimeout(() => setKeeperMessage(null), 2000);
      }
      return newFavorites;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Custom Icon Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a custom door icon and see how it appears in the vehicle card
            below. The icon will replace the default door icon in the vehicle
            details section.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {/* Mileage Icon Upload Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Custom Mileage Icon
            </h2>
            <IconUploader
              onIconUpload={setCustomMileageIcon}
              currentIcon={customMileageIcon}
              label="Mileage/Speedometer Icon"
            />
            {customMileageIcon && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  ✓ Custom mileage icon applied! Check the vehicle card.
                </p>
              </div>
            )}
          </div>

          {/* Transmission Icon Upload Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Custom Transmission Icon
            </h2>
            <IconUploader
              onIconUpload={setCustomTransmissionIcon}
              currentIcon={customTransmissionIcon}
              label="Transmission/Gear Icon"
            />
            {customTransmissionIcon && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  ✓ Custom transmission icon applied! Check the vehicle card.
                </p>
              </div>
            )}
          </div>

          {/* Door Icon Upload Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Custom Door Icon
            </h2>
            <IconUploader
              onIconUpload={setCustomDoorIcon}
              currentIcon={customDoorIcon}
              label="Door Icon"
            />
            {customDoorIcon && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  ✓ Custom door icon applied! Check the vehicle card.
                </p>
              </div>
            )}
          </div>

          {/* Vehicle Card Preview */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vehicle Card Preview
            </h2>
            <div className="max-w-sm mx-auto">
              <VehicleCard
                vehicle={sampleVehicle}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                keeperMessage={keeperMessage}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Look for your custom icons in the vehicle details section:
              <br />
              • Mileage icon next to "25,000 miles"
              <br />
              • Transmission icon next to "Automatic"
              <br />• Door icon next to "4 Doors"
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How to Use Custom Icons
          </h2>
          <div className="prose prose-gray max-w-none">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Upload your custom icons using the uploaders above (PNG, JPG, or
                SVG recommended)
              </li>
              <li>
                The icons will immediately appear in the vehicle card preview
              </li>
              <li>
                In your application, you can set the{" "}
                <code className="bg-gray-100 px-1 rounded">mileageIcon</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">
                  transmissionIcon
                </code>
                , and <code className="bg-gray-100 px-1 rounded">doorIcon</code>{" "}
                properties on vehicle objects
              </li>
              <li>
                If no custom icons are provided, the default Lucide React icons
                will be used
              </li>
            </ol>

            <h3 className="text-lg font-semibold mt-6 mb-2">Best Practices:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Use square icons (1:1 aspect ratio) for best results</li>
              <li>
                Icons should be at least 16x16 pixels and ideally 24x24 or
                larger
              </li>
              <li>SVG format is recommended for crisp display at any size</li>
              <li>Keep file sizes small (under 2MB) for better performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
