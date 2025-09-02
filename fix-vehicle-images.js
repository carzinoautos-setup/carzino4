// Fix Vehicle Images Script
// Run this to replace emoji vehicle type images with actual image URLs

const vehicleImageMappings = {
  "Car": "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center",
  "Cars": "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center",
  "Sedan": "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center",
  "Sedans": "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=64&h=64&fit=crop&crop=center",
  "SUV": "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center",
  "SUVs": "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center",
  "Crossover": "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center",
  "Crossovers": "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center",
  "Crossover/SUV": "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center",
  "SUV / Crossover": "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center",
  "SUV/Crossover": "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center",
  "Sport Utility Vehicle": "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=64&h=64&fit=crop&crop=center",
  "Truck": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Trucks": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Pickup": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Pickup Truck": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Crew Cab Truck": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Regular Cab Truck": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Extended Cab Truck": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Full Size Truck": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Compact Truck": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=64&h=64&fit=crop&crop=center",
  "Coupe": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=64&h=64&fit=crop&crop=center",
  "Coupes": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=64&h=64&fit=crop&crop=center",
  "Sports Car": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=64&h=64&fit=crop&crop=center",
  "Sports Cars": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=64&h=64&fit=crop&crop=center",
  "Convertible": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=64&h=64&fit=crop&crop=center",
  "Convertibles": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=64&h=64&fit=crop&crop=center",
  "Roadster": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=64&h=64&fit=crop&crop=center",
  "Hatchback": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=64&h=64&fit=crop&crop=center",
  "Hatchbacks": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=64&h=64&fit=crop&crop=center",
  "Compact": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=64&h=64&fit=crop&crop=center",
  "Compact Car": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=64&h=64&fit=crop&crop=center",
  "Van": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Vans": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Minivan": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Minivans": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Van / Minivan": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Cargo Van": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Passenger Van": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Wagon": "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=64&h=64&fit=crop&crop=center",
  "Wagons": "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=64&h=64&fit=crop&crop=center",
  "Station Wagon": "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=64&h=64&fit=crop&crop=center",
  "Motorcycle": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=64&h=64&fit=crop&crop=center",
  "Motorcycles": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=64&h=64&fit=crop&crop=center",
  "Bike": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=64&h=64&fit=crop&crop=center",
  "RV": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "RVs": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Motorhome": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center",
  "Recreational Vehicle": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=64&h=64&fit=crop&crop=center"
};

console.log('Vehicle Image Mappings for Manual Replacement:');
console.log('Copy and paste these into the vehicleImageMap object in MySQLVehiclesOriginalStyle.tsx');
console.log('');

Object.entries(vehicleImageMappings).forEach(([key, value]) => {
  console.log(`"${key}": "${value}",`);
});

console.log('');
console.log('Note: The emoji values in the original file need to be replaced with these image URLs.');
console.log('This script provides the correct mappings for manual replacement.');
