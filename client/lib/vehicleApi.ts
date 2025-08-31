// Frontend types for API responses
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
  city_seller?: string;
  state_seller?: string;
  zip_seller?: string;
  acount_name_seller?: string;
  phone_number_seller?: string;
  email_seller?: string;
  address_seller?: string;
  business_name_seller?: string;
  interest_rate: number;
  down_payment: number;
  loan_term: number;
  payments: number;
}

export interface PaginationMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface VehiclesApiResponse {
  data: VehicleRecord[];
  meta: PaginationMeta;
  success: boolean;
  message?: string;
}

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

export interface FilterOptions {
  makes: string[];
  models: string[];
  conditions: string[];
  fuelTypes: string[];
  transmissions: string[];
  drivetrains: string[];
  bodyStyles: string[];
  sellerTypes: string[];
}

// API client class
class VehicleApiClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to current host
    this.baseUrl = import.meta.env.VITE_API_URL || "";
  }

  private async request<T>(url: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  /**
   * Fetch paginated vehicles with optional filters
   */
  async getVehicles(
    page: number = 1,
    pageSize: number = 20,
    filters: VehicleFilters = {},
    sortBy: string = "id",
    sortOrder: "ASC" | "DESC" = "DESC",
  ): Promise<VehiclesApiResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
    });

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    return this.request<VehiclesApiResponse>(`/api/vehicles?${params}`);
  }

  /**
   * Fetch a single vehicle by ID
   */
  async getVehicleById(
    id: number,
  ): Promise<{ success: boolean; data?: VehicleRecord; message?: string }> {
    return this.request(`/api/vehicles/${id}`);
  }

  /**
   * Fetch available filter options
   */
  async getFilterOptions(): Promise<{ success: boolean; data: FilterOptions }> {
    return this.request("/api/vehicles/filters");
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<{
    success: boolean;
    message: string;
    dbConnected: boolean;
  }> {
    return this.request("/api/health");
  }
}

// Export singleton instance
export const vehicleApi = new VehicleApiClient();

// Utility functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("en-US").format(mileage);
}

export function getVehicleTitle(vehicle: VehicleRecord): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.trim();
}

export function getVehicleImageUrl(vehicle: VehicleRecord): string {
  // Use a placeholder service or implement your image logic
  return `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop&auto=format&q=80`;
}
