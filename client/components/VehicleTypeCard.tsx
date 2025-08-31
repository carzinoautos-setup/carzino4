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
  // Get the image URL for this vehicle type or provide a fallback
  const getVehicleImage = (vehicleType: string) => {
    if (vehicleImages[vehicleType]) {
      return vehicleImages[vehicleType];
    }

    // Fallback logic based on common vehicle type keywords with image URLs
    const lowerType = vehicleType.toLowerCase();
    if (lowerType.includes('suv') || lowerType.includes('crossover')) {
      return 'https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center';
    } else if (lowerType.includes('truck') || lowerType.includes('pickup')) {
      return 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center';
    } else if (lowerType.includes('van') || lowerType.includes('minivan')) {
      return 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center';
    } else if (lowerType.includes('coupe') || lowerType.includes('convertible') || lowerType.includes('sport')) {
      return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=64&h=64&fit=crop&crop=center';
    } else if (lowerType.includes('motorcycle') || lowerType.includes('bike')) {
      return 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=64&h=64&fit=crop&crop=center';
    } else if (lowerType.includes('sedan')) {
      return 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center';
    } else if (lowerType.includes('hatchback')) {
      return 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=64&h=64&fit=crop&crop=center';
    } else if (lowerType.includes('wagon')) {
      return 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=64&h=64&fit=crop&crop=center';
    } else {
      return 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center'; // Default sedan image
    }
  };

  const vehicleImage = getVehicleImage(type);

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
