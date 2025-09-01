/**
 * WordPress Custom API Client for /wp-json/custom/v1/vehicles
 * Handles the new custom endpoint with ACF nested structure
 */

// WordPress vehicle with nested ACF structure
export interface WordPressVehicle {
  // WooCommerce core fields
  id: number;
  name: string;
  permalink: string;
  price: number;
  regular_price: number;
  sale_price: number;
  stock_status: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ id: number; src: string; alt: string }>;
  
  // ACF fields nested under acf
  acf: {
    // Seller information
    acount_name_seller: string;
    account_name_seller: string;
    business_name_seller: string;
    city_seller: string;
    state_seller: string;
    zip_seller: string;
    phone_number_seller: string;
    email_seller: string;
    address_seller: string;
    account_type_seller: string;
    car_location_latitude: number;
    car_location_longitude: number;
    
    // Vehicle specifications
    year: number;
    make: string;
    model: string;
    trim: string;
    mileage: number;
    drivetrain: string;
    fuel_type: string;
    transmission: string;
    vin: string;
    stock_number: string;
    
    // Vehicle details
    condition: string;
    doors: number;
    exterior_color: string;
    interior_color: string;
    body_style: string;
    engine_cylinders: number;
    highway_mpg: number;
    
    // Status flags
    is_featured: boolean;
    certified: boolean;
    title_status: string;
    
    // Financial information
    interest_rate: number;
    down_payment: number;
    loan_term: number;
    payment: number;
  };
}

export interface WordPressVehiclesResponse {
  success: boolean;
  data: WordPressVehicle[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  message?: string;
}

export interface WordPressVehicleFilters {
  page?: number;
  per_page?: number;
  make?: string;
  model?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  year?: number;
}

/**
 * WordPress Custom API Client
 */
export class WordPressCustomApiClient {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 2 * 60 * 1000; // 2 minutes cache

  constructor() {
    this.baseUrl = import.meta.env.VITE_WP_URL || "https://env-uploadbackup62225-czdev.kinsta.cloud";
  }

  /**
   * Generic fetch with error handling and caching
   */
  private async request<T>(endpoint: string, cacheKey?: string): Promise<T> {
    const key = cacheKey || endpoint;
    const cached = this.cache.get(key);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📋 Using cached data for: ${key}`);
      return cached.data;
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🔍 WordPress Custom API Request: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit', // Don't send credentials for public API
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');

        // Provide specific error messages for common issues
        let errorMessage = `WordPress API Error: ${response.status} ${response.statusText}`;

        if (response.status === 404) {
          errorMessage = `API endpoint not found (404). The custom endpoint '/wp-json/custom/v1/vehicles' may not be implemented yet.`;
        } else if (response.status === 403) {
          errorMessage = `Access forbidden (403). The API endpoint may require authentication or permissions.`;
        } else if (response.status === 500) {
          errorMessage = `WordPress server error (500). Check WordPress error logs for details.`;
        } else if (response.status === 0) {
          errorMessage = `Network error (CORS). WordPress site may not allow cross-origin requests.`;
        }

        throw new Error(`${errorMessage} - ${errorText}`);
      }

      const data = await response.json();

      // Cache successful responses
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });

      console.log(`✅ WordPress Custom API Success: ${url}`);
      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after 15 seconds for: ${endpoint}`);
      }

      // Enhanced error handling for different types of failures
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // This is likely a CORS or network connectivity issue
        throw new Error(`Network/CORS Error: Cannot connect to WordPress site. This could be due to:
1. CORS policy blocking cross-origin requests
2. WordPress site is down or unreachable
3. SSL/HTTPS certificate issues
4. Network connectivity problems

Original error: ${error.message}`);
      }

      console.error(`❌ WordPress Custom API Error: ${url}`, error);
      throw error;
    }
  }

  /**
   * Fetch vehicles with pagination and optional filters
   */
  async getVehicles(
    page: number = 1,
    pageSize: number = 20,
    filters: WordPressVehicleFilters = {}
  ): Promise<WordPressVehiclesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: Math.min(pageSize, 100).toString(), // WordPress typically limits to 100
    });

    // Add filters to params if provided
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const endpoint = `/wp-json/custom/v1/vehicles?${params.toString()}`;
    const cacheKey = `vehicles_${params.toString()}`;

    return this.request<WordPressVehiclesResponse>(endpoint, cacheKey);
  }

  /**
   * Fetch a single vehicle by ID
   */
  async getVehicleById(id: number): Promise<{ success: boolean; data?: WordPressVehicle; message?: string }> {
    const endpoint = `/wp-json/custom/v1/vehicles/${id}`;
    const cacheKey = `vehicle_${id}`;
    
    return this.request<{ success: boolean; data?: WordPressVehicle; message?: string }>(endpoint, cacheKey);
  }

  /**
   * Transform WordPress vehicle to VehicleRecord format for compatibility
   */
  static transformToVehicleRecord(wpVehicle: WordPressVehicle): any {
    const acf = wpVehicle.acf;
    
    return {
      id: wpVehicle.id,
      year: acf.year,
      make: acf.make,
      model: acf.model,
      trim: acf.trim,
      body_style: acf.body_style,
      engine_cylinders: acf.engine_cylinders,
      fuel_type: acf.fuel_type,
      transmission: acf.transmission,
      transmission_speed: "", // Not in ACF structure
      drivetrain: acf.drivetrain,
      exterior_color_generic: acf.exterior_color,
      interior_color_generic: acf.interior_color,
      doors: acf.doors,
      price: wpVehicle.price || wpVehicle.sale_price || 0,
      mileage: acf.mileage,
      title_status: acf.title_status,
      highway_mpg: acf.highway_mpg,
      condition: acf.condition,
      certified: acf.certified,
      seller_account_number: "", // Not directly available
      seller_type: acf.account_type_seller,
      city_seller: acf.city_seller,
      state_seller: acf.state_seller,
      zip_seller: acf.zip_seller,
      acount_name_seller: acf.acount_name_seller,
      phone_number_seller: acf.phone_number_seller,
      email_seller: acf.email_seller,
      address_seller: acf.address_seller,
      business_name_seller: acf.business_name_seller,
      interest_rate: acf.interest_rate,
      down_payment: acf.down_payment,
      loan_term: acf.loan_term,
      payments: acf.payment,
      
      // Additional fields for vehicle cards
      title: wpVehicle.name,
      images: wpVehicle.images?.map(img => img.src) || [],
      categories: wpVehicle.categories?.map(cat => cat.name) || [],
      stock_status: wpVehicle.stock_status,
      vin: acf.vin,
      stock_number: acf.stock_number,
      is_featured: acf.is_featured,
      car_location_latitude: acf.car_location_latitude,
      car_location_longitude: acf.car_location_longitude,
    };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log("🔍 Testing WordPress Custom API connection...");
      
      const response = await this.getVehicles(1, 1); // Get just 1 vehicle to test
      
      if (response.success && response.data?.length > 0) {
        return {
          success: true,
          message: "WordPress Custom API connection successful",
          data: {
            endpoint: `${this.baseUrl}/wp-json/custom/v1/vehicles`,
            totalVehicles: response.pagination?.total || 0,
            sampleVehicle: response.data[0]
          }
        };
      } else {
        return {
          success: false,
          message: "API connected but no vehicles returned"
        };
      }
    } catch (error) {
      console.error("❌ WordPress Custom API connection test failed:", error);
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        data: {
          endpoint: `${this.baseUrl}/wp-json/custom/v1/vehicles`,
          error: error.message
        }
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ WordPress Custom API cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; size: string } {
    const entries = this.cache.size;
    const size = new Blob([JSON.stringify(Array.from(this.cache.entries()))]).size;

    return {
      entries,
      size: `${(size / 1024).toFixed(2)} KB`
    };
  }
}

// Export singleton instance
export const wordpressCustomApi = new WordPressCustomApiClient();

// Export default for convenience
export default wordpressCustomApi;
