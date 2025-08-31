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
}) => (
  <div
    onClick={() => onToggle(type)}
    className={`text-center cursor-pointer p-2 rounded group transition-all ${
      isSelected
        ? "border-2 border-red-600"
        : "hover:bg-gray-50 border-2 border-transparent"
    }`}
  >
    <div className="rounded-lg p-3 mb-2 h-14 flex items-center justify-center transition-colors bg-gray-100 group-hover:bg-gray-200">
      {vehicleImages[type] ? (
        <div className="text-2xl" role="img" aria-label={`${type} vehicle type`}>
          {vehicleImages[type]}
        </div>
      ) : (
        <div className="text-gray-400 text-xs font-medium">{type}</div>
      )}
    </div>
    <div
      className={`carzino-vehicle-type-name ${isSelected ? "text-red-600 font-semibold" : ""}`}
    >
      {type}
    </div>
    <div className="carzino-vehicle-type-count">({count})</div>
  </div>
);
