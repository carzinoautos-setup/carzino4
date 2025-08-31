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
  // Vehicle type specific images from Builder.io CDN
  const vehicleTypeImages: { [key: string]: string } = {
    'Cars': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fb06dd82e2c564b7eb30b1d5fa14e0562',
    'Crossover/SUV': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fffc8b9d69ce743d080a0b5ba9a64e89a',
    'Sedan': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F0eccbe1eccb94b3b8eee4d8cfb611864',
    'Truck': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1',
    'Coupe': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F1d042ebb458842a8a468794ae563fcc6',
    'Convertible': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F064c51214995430a9384ae9f1722bee9',
    'Wagon': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F24bf3ece0537462bbd1edd12a2485c0a',
    'Regular Cab Truck': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1',
    'Hatchback': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fb06dd82e2c564b7eb30b1d5fa14e0562',
    'Extended Cab Trucks': 'https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1'
  };

  const vehicleImage = vehicleTypeImages[type] || '/placeholder.svg';

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
          className="w-full h-8 object-cover rounded block overflow-hidden"
          style={{ objectFit: 'cover', backgroundSize: 'contain' }}
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
