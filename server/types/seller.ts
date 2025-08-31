// Seller account interface matching your WordPress structure
export interface SellerRecord {
  id: number;
  account_number: string; // Links to vehicle.seller_account_number
  name: string;
  type: "Dealer" | "Private Seller";
  phone: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  zip: string;
  latitude: number; // car_location_latitude from your docs
  longitude: number; // car_location_longitude from your docs
  created_at?: Date;
  updated_at?: Date;
}

// Enhanced vehicle record with seller location (denormalized for performance)
export interface VehicleWithLocation {
  id: number;
  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: string;
  engine_cylinders: number;
  fuel_type: string;
  transmission: string;
  transmission_speed: string;
  drivetrain: string;
  exterior_color_generic: string;
  interior_color_generic: string;
  doors: number;
  price: number;
  mileage: number;
  title_status: string;
  highway_mpg: number;
  condition: string;
  certified: boolean;
  seller_account_number: string;
  seller_type: string;
  interest_rate: number;
  down_payment: number;
  loan_term: number;
  payments: number;
  // Denormalized seller location data for fast queries
  seller_latitude: number;
  seller_longitude: number;
  seller_name: string;
  seller_city: string;
  seller_state: string;
  seller_phone: string;
  // Calculated field for distance filtering
  distance_miles?: number;
}

// Location filtering parameters
export interface LocationFilters {
  lat: number;
  lng: number;
  radius: number; // in miles
}

// Enhanced vehicle filters with location
export interface VehicleFiltersWithLocation extends VehicleFilters {
  location?: LocationFilters;
}
