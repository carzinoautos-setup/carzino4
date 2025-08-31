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
  // Use placeholder for all vehicle types as requested by user
  const getVehicleImage = () => {
    return '/placeholder.svg'; // Use placeholder instead of specific images
  };

  const vehicleImage = getVehicleImage();

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
        <img
          src={vehicleImage}
          alt={`${type} vehicle type`}
          className="w-8 h-8 object-cover rounded"
          onError={(e) => {
            // Fallback to a generic car emoji if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="text-2xl hidden" role="img" aria-label={`${type} vehicle type`}>
          🚗
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
