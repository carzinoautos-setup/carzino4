import React from "react";

interface VehicleTypeCardProps {
  type: string;
  count: number;
  vehicleImages: { [key: string]: string };
  isSelected: boolean;
  onToggle: (type: string) => void;
}

export const VehicleTypeCard: React.FC<VehicleTypeCardProps> = ({
  type,
  count,
  vehicleImages,
  isSelected,
  onToggle,
}) => {
  // Get the image for this vehicle type or provide a fallback
  const getVehicleImage = (vehicleType: string) => {
    if (vehicleImages[vehicleType]) {
      return vehicleImages[vehicleType];
    }

    // Fallback logic based on common vehicle type keywords
    const lowerType = vehicleType.toLowerCase();
    if (lowerType.includes('suv') || lowerType.includes('crossover')) {
      return '🚙';
    } else if (lowerType.includes('truck') || lowerType.includes('pickup')) {
      return '🚚';
    } else if (lowerType.includes('van') || lowerType.includes('minivan')) {
      return '🚐';
    } else if (lowerType.includes('coupe') || lowerType.includes('convertible') || lowerType.includes('sport')) {
      return '🏎️';
    } else if (lowerType.includes('motorcycle') || lowerType.includes('bike')) {
      return '🏍️';
    } else {
      return '🚗'; // Default car emoji
    }
  };

  const vehicleEmoji = getVehicleImage(type);

  return (
    <div
      onClick={() => {
        console.log('🖼️ Vehicle type clicked:', type, 'isSelected:', isSelected);
        onToggle(type);
      }}
      className={`text-center cursor-pointer p-2 rounded group transition-all ${
        isSelected
          ? "border-2 border-red-600 bg-red-50"
          : "hover:bg-gray-50 border-2 border-transparent"
      }`}
    >
      <div className="rounded-lg p-3 mb-2 h-14 flex items-center justify-center transition-colors bg-gray-100 group-hover:bg-gray-200">
        <div className="text-2xl" role="img" aria-label={`${type} vehicle type`}>
          {vehicleEmoji}
        </div>
      </div>
      <div
        className={`carzino-vehicle-type-name ${isSelected ? "text-red-600 font-semibold" : ""}`}
      >
        {type}
      </div>
      <div className="carzino-vehicle-type-count">({count})</div>
    </div>
  );
};
