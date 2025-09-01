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
  featured_image?: string;
  
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
    drive_type: string; // Alternative field name
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
    body_type: string; // Alternative field name
    engine_cylinders: number;
    highway_mpg: number;

    // Status flags
    is_featured: boolean;
    certified: boolean;
    title_status: string;

    // Financial information
    price: number;
    sale_price: number;
    interest_rate: number;
    down_payment: number;
    loan_term: number;
    payment: number;

    // Images
    featured_image: string;
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
  min_payment?: number;
  max_payment?: number;
  year?: number;
  orderby?: string;
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
    console.log(`🔗 WordPress API Base URL: ${this.baseUrl}`);
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

      console.log(`📡 Attempting fetch to: ${url}`);
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
      console.log(`📡 Response received: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = `WordPress API Error: ${response.status} ${response.statusText}`;

        if (response.status === 404) {
          errorMessage = `API endpoint not found (404). The custom endpoint may not be implemented.`;
        } else if (response.status === 403) {
          errorMessage = `Access forbidden (403). Check authentication and permissions.`;
        } else if (response.status === 500) {
          errorMessage = `WordPress server error (500). Check server logs.`;
        } else if (response.status === 0) {
          errorMessage = `Network error (CORS). Site may not allow cross-origin requests.`;
        }

        console.error(`❌ WordPress API HTTP Error: ${errorMessage}`);
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
        console.warn(`⏰ WordPress API timeout for: ${endpoint}`);
        throw new Error(`Request timeout after 10 seconds for: ${endpoint}`);
      }

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
   * Test WordPress site basic connectivity
   */
  async testWordPressSite(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log("🔍 Testing WordPress site basic connectivity...");

      // Try to fetch the main WordPress site
      const response = await fetch(this.baseUrl, {
        method: 'HEAD', // Just check if site is reachable
        mode: 'no-cors', // Bypass CORS for basic connectivity test
      });

      return {
        success: true,
        message: "WordPress site is reachable",
        data: {
          url: this.baseUrl,
          status: "Site accessible"
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `WordPress site unreachable: ${error.message}`,
        data: {
          url: this.baseUrl,
          error: error.message
        }
      };
    }
  }

  /**
   * Test WordPress REST API availability
   */
  async testWordPressRestApi(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log("🔍 Testing WordPress REST API availability...");

      const response = await fetch(`${this.baseUrl}/wp-json`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: "WordPress REST API is available",
        data: {
          endpoint: `${this.baseUrl}/wp-json`,
          namespaces: data.namespaces || [],
          routes: Object.keys(data.routes || {}).slice(0, 5) // Show first 5 routes
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `WordPress REST API unavailable: ${error.message}`,
        data: {
          endpoint: `${this.baseUrl}/wp-json`,
          error: error.message
        }
      };
    }
  }

  /**
   * Test custom API endpoint specifically
   */
  async testCustomEndpoint(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log("🔍 Testing custom API endpoint...");

      const response = await this.getVehicles(1, 1); // Get just 1 vehicle to test

      if (response.success && response.data?.length > 0) {
        return {
          success: true,
          message: "Custom API endpoint working",
          data: {
            endpoint: `${this.baseUrl}/wp-json/custom/v1/vehicles`,
            totalVehicles: response.pagination?.total || 0,
            sampleVehicle: response.data[0]
          }
        };
      } else {
        return {
          success: false,
          message: "Custom endpoint connected but no vehicles returned",
          data: {
            endpoint: `${this.baseUrl}/wp-json/custom/v1/vehicles`,
            response: response
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Custom endpoint failed: ${error.message}`,
        data: {
          endpoint: `${this.baseUrl}/wp-json/custom/v1/vehicles`,
          error: error.message
        }
      };
    }
  }

  /**
   * Comprehensive connection test
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log("🔍 Running comprehensive WordPress API tests...");

      const results = {
        siteReachable: await this.testWordPressSite(),
        restApiAvailable: await this.testWordPressRestApi(),
        customEndpoint: await this.testCustomEndpoint()
      };

      // Determine overall success
      const customEndpointWorking = results.customEndpoint.success;

      if (customEndpointWorking) {
        return {
          success: true,
          message: "All tests passed - WordPress Custom API is working",
          data: results
        };
      } else {
        // Provide specific guidance based on what failed
        let guidance = "WordPress Custom API issues detected:\n";

        if (!results.siteReachable.success) {
          guidance += "• WordPress site is not reachable - check URL and network connectivity\n";
        }

        if (!results.restApiAvailable.success) {
          guidance += "• WordPress REST API is not available - check if REST API is enabled\n";
        } else {
          guidance += "• WordPress REST API is available but custom endpoint '/wp-json/custom/v1/vehicles' is not working\n";
          guidance += "• Make sure your custom API endpoint is properly implemented in WordPress\n";
        }

        return {
          success: false,
          message: guidance.trim(),
          data: results
        };
      }
    } catch (error) {
      console.error("❌ WordPress API comprehensive test failed:", error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
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
