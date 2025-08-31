// Vehicle database record interface
export interface VehicleRecord {
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
}

// Pagination request parameters
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// Pagination response metadata
export interface PaginationMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API response for vehicles endpoint
export interface VehiclesApiResponse {
  data: VehicleRecord[];
  meta: PaginationMeta;
  success: boolean;
  message?: string;
}

// Query filters for advanced searching
export interface VehicleFilters {
  make?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  maxMileage?: number;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  bodyStyle?: string;
  certified?: boolean;
  sellerType?: string;
}

// SQL query builder result
export interface SqlQuery {
  sql: string;
  params: any[];
  countSql: string;
  countParams: any[];
}
