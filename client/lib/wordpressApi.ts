/**
 * WordPress/WooCommerce API Client for React
 * Replaces your PHP shortcodes and connects to WooCommerce data
 */

// Configure your WordPress site URL
// Vite uses import.meta.env instead of process.env
const WP_BASE_URL = import.meta.env.VITE_WP_URL || "https://your-site.com";
const API_BASE = `${WP_BASE_URL}/wp-json/carzino/v1`;

// Vehicle data structure matching your WooCommerce fields
export interface WPVehicle {
  id: number;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number;
  mileage: string;
  transmission: string;
  doors: string;
  images: string[];
  dealer: string;
  location: string;
  condition: string;
  // Extended fields for detailed view
  engine?: string;
  fuel_type?: string;
  drivetrain?: string;
  exterior_color?: string;
  interior_color?: string;
  vin?: string;
  features?: string[];
}

// Global settings from ACF options
export interface WPGlobalSettings {
  default_apr: number;
  default_sales_tax: number;
  default_term: number;
  default_down_pct: number;
}

// API response structures
export interface WPVehiclesResponse {
  success: boolean;
  data: WPVehicle[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface WPSettingsResponse {
  success: boolean;
  data: WPGlobalSettings;
}

// Filters for vehicle search
export interface VehicleFilters {
  make?: string;
  model?: string;
  year?: number;
  min_price?: number;
  max_price?: number;
  condition?: string;
  max_mileage?: number;
  page?: number;
  per_page?: number;
}

// Payment affordability params
export interface AffordabilityParams {
  max_payment: number;
  down_payment: number;
  trade_in: number;
  apr: number;
  term: number;
  tax_rate: number;
}

/**
 * WordPress API Client Class
 */
export class WordPressVehicleAPI {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch with caching
   */
  private async fetchWithCache<T>(
    endpoint: string,
    cacheKey?: string,
  ): Promise<T> {
    const key = cacheKey || endpoint;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful responses
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error(`WordPress API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Get global settings from ACF options
   * Replaces your ACF get_field() calls
   */
  async getGlobalSettings(): Promise<WPGlobalSettings> {
    const response = await this.fetchWithCache<WPSettingsResponse>(
      "/settings",
      "global_settings",
    );

    if (!response.success) {
      throw new Error("Failed to fetch global settings");
    }

    return response.data;
  }

  /**
   * Get vehicles with filters and pagination
   * Replaces your WP_Query and meta_query logic
   */
  async getVehicles(filters: VehicleFilters = {}): Promise<WPVehiclesResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const endpoint = `/vehicles${queryString ? `?${queryString}` : ""}`;

    return this.fetchWithCache<WPVehiclesResponse>(
      endpoint,
      `vehicles_${queryString}`,
    );
  }

  /**
   * Get single vehicle by ID
   */
  async getVehicle(id: number): Promise<WPVehicle> {
    const response = await this.fetchWithCache<{
      success: boolean;
      data: WPVehicle;
    }>(`/vehicles/${id}`, `vehicle_${id}`);

    if (!response.success) {
      throw new Error("Vehicle not found");
    }

    return response.data;
  }

  /**
   * Get vehicles within payment affordability range
   * Replaces your "search by payment" PHP logic
   */
  async getAffordableVehicles(
    params: AffordabilityParams,
  ): Promise<WPVehiclesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/vehicles/affordable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Affordable vehicles API error:", error);
      throw error;
    }
  }

  /**
   * Convert WP vehicle to your React vehicle format
   */
  static convertToReactVehicle(wpVehicle: WPVehicle): any {
    return {
      id: wpVehicle.id,
      featured: false, // Add logic if you have featured field
      viewed: false, // Add logic if you track viewed status
      images: wpVehicle.images || ["/placeholder.svg"],
      badges: [], // Add logic for badges based on condition, etc.
      title: `${wpVehicle.year} ${wpVehicle.make} ${wpVehicle.model}`,
      mileage: wpVehicle.mileage,
      transmission: wpVehicle.transmission,
      doors: wpVehicle.doors,
      salePrice: wpVehicle.price
        ? `$${wpVehicle.price.toLocaleString()}`
        : null,
      payment: null, // Will be calculated by React
      dealer: wpVehicle.dealer,
      location: wpVehicle.location,
      phone: "", // Add if you have phone field
      seller_type: "Dealer", // Add logic based on your data
      rawPrice: wpVehicle.price,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { entries: number; size: string } {
    const entries = this.cache.size;
    const size = new Blob([JSON.stringify(Array.from(this.cache.entries()))])
      .size;

    return {
      entries,
      size: `${(size / 1024).toFixed(2)} KB`,
    };
  }
}

// Singleton instance
export const wpAPI = new WordPressVehicleAPI();

/**
 * React hook for WordPress vehicle data
 * Replaces your shortcode calls
 */
export function useWordPressVehicles(filters: VehicleFilters = {}) {
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<any>(null);

  const fetchVehicles = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await wpAPI.getVehicles(filters);
      const convertedVehicles = response.data.map(
        WordPressVehicleAPI.convertToReactVehicle,
      );

      setVehicles(convertedVehicles);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    meta,
    refetch: fetchVehicles,
  };
}

/**
 * React hook for WordPress global settings
 * Replaces your ACF option calls
 */
export function useWordPressSettings() {
  const [settings, setSettings] = React.useState<WPGlobalSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await wpAPI.getGlobalSettings();
        setSettings(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch settings",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}

// Import React for hooks
import React from "react";
