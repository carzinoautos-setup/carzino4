// Simplified vehicle record matching original demo schema
export interface SimpleVehicleRecord {
  id: number;
  featured: boolean;
  viewed: boolean;
  images: string[];
  badges: string[];
  title: string; // Product name
  mileage: string; // e.g. "8", "2,847"
  transmission: string; // e.g. "Auto", "CVT"
  doors: string; // e.g. "4 doors"
  drivetrain: string; // e.g. "4WD", "AWD", "FWD", "RWD"
  condition: string; // "New", "Used", "Certified"
  body_type: string; // e.g. "Sedan", "SUV", "Coupe" - custom field for vehicle type
  salePrice: string | null; // e.g. "$67,899" or null
  payment: string | null; // e.g. "$789" or null
  dealer: string;
  location: string; // Distance from zip code will be calculated
  phone: string;
  seller_type: string; // "Dealer" or "Private Seller"
  account_number_seller: string; // Links to SellersAccount - hidden from public display
}

// Simplified pagination and filter types
export interface SimplePaginationParams {
  page: number;
  pageSize: number;
}

export interface SimplePaginationMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SimpleVehicleFilters {
  condition?: string[];
  make?: string[];
  model?: string[];
  trim?: string[];
  vehicleType?: string[];
  driveType?: string[];
  transmission?: string[];
  mileage?: string;
  min_mileage?: string;
  max_mileage?: string;
  exteriorColor?: string[];
  interiorColor?: string[];
  city?: string[];
  state?: string[];
  sellerType?: string[];
  dealer?: string[];
  priceMin?: string;
  priceMax?: string;
  paymentMin?: string;
  paymentMax?: string;
}

export interface SimpleVehiclesApiResponse {
  data: SimpleVehicleRecord[];
  meta: SimplePaginationMeta;
  success: boolean;
  message?: string;
}
