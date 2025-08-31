import { RequestHandler } from "express";
import {
  SimplePaginationParams,
  SimpleVehicleFilters,
} from "../types/simpleVehicle.js";

/**
 * WooCommerce REST API Service for live inventory integration
 * Uses WooCommerce REST API v3 (latest) for real-time product sync
 */
export class WooCommerceApiService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor() {
    this.baseUrl = process.env.VITE_WP_URL || "https://env-uploadbackup62225-czdev.kinsta.cloud";
    this.consumerKey = process.env.WC_CONSUMER_KEY || "";
    this.consumerSecret = process.env.WC_CONSUMER_SECRET || "";
    
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error("WooCommerce API credentials not configured");
    }
    
    console.log(`🛍️ WooCommerce API Service initialized for: ${this.baseUrl}`);
  }

  /**
   * Create authentication headers for WooCommerce API
   */
  private getAuthHeaders(): HeadersInit {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Builder.io-Vehicle-Integration/1.0'
    };
  }

  /**
   * Make authenticated request to WooCommerce API
   */
  private async makeRequest(endpoint: string, params: URLSearchParams = new URLSearchParams()) {
    const url = `${this.baseUrl}/wp-json/wc/v3/${endpoint}?${params.toString()}`;
    
    console.log(`🔍 WooCommerce API Request: ${endpoint}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ WooCommerce API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Transform WooCommerce product to vehicle format
   */
  private transformProductToVehicle(product: any, index: number): any {
    // Extract vehicle-specific meta data
    const metaData = product.meta_data || [];
    const getMeta = (key: string) => metaData.find((m: any) => m.key === key)?.value || "";

    // Get main product image
    const images = product.images && product.images.length > 0 
      ? product.images.map((img: any) => img.src)
      : [
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=450&h=300&fit=crop&auto=format"
        ];

    // Build vehicle title from WooCommerce data
    const year = getMeta('year') || getMeta('vehicle_year') || new Date().getFullYear();
    const make = getMeta('make') || getMeta('vehicle_make') || product.categories?.[0]?.name || "Vehicle";
    const model = getMeta('model') || getMeta('vehicle_model') || product.name.split(' ')[0];
    
    const vehicleTitle = `${year} ${make} ${model}`.trim();

    // Determine condition
    const condition = getMeta('condition') || getMeta('vehicle_condition') || 
                     (product.featured ? "Certified" : "Used");

    // Build badges
    const badges = [
      condition,
      getMeta('drivetrain') && getMeta('drivetrain').includes('4') ? "4WD" : "",
      product.featured ? "Featured!" : "",
      product.on_sale ? "Sale" : ""
    ].filter(Boolean);

    // Calculate estimated payment (simple calculation)
    const price = parseFloat(product.price || product.regular_price || 0);
    const estimatedPayment = price > 0 ? Math.round(price / 60) : 0; // Rough 60-month estimate

    return {
      id: product.id,
      featured: product.featured || false,
      viewed: false, // This would need separate tracking
      images: images,
      badges: badges,
      title: vehicleTitle || product.name,
      mileage: getMeta('mileage') ? `${parseInt(getMeta('mileage')).toLocaleString()}` : "0",
      transmission: getMeta('transmission') || "Auto",
      doors: getMeta('doors') ? `${getMeta('doors')} doors` : "4 doors",
      salePrice: price > 0 ? `$${price.toLocaleString()}` : null,
      payment: estimatedPayment > 0 ? `$${estimatedPayment}/mo*` : null,
      dealer: getMeta('dealer_name') || "Carzino Autos",
      location: getMeta('location') || "Local Area",
      phone: getMeta('dealer_phone') || "Contact Dealer",
      seller_type: "Dealer",
      // Additional WooCommerce data
      sku: product.sku,
      stock_status: product.stock_status,
      description: product.description || product.short_description,
      categories: product.categories?.map((cat: any) => cat.name) || [],
      in_stock: product.stock_status === 'instock',
      stock_quantity: product.stock_quantity
    };
  }

  /**
   * Fetch vehicles from WooCommerce products with filters and pagination
   */
  async getVehicles(
    pagination: SimplePaginationParams,
    filters: SimpleVehicleFilters = {},
    sortBy: string = "relevance"
  ) {
    try {
      console.log("🔍 Fetching products from WooCommerce REST API...");

      // Build WooCommerce API parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: Math.min(pagination.pageSize, 100).toString(), // WooCommerce max is 100
        status: 'publish'
      });

      // Add search if provided
      if (filters.search) {
        params.append('search', filters.search);
      }

      // Add category filter (using categories as vehicle types)
      if (filters.vehicleType && filters.vehicleType.length > 0) {
        // Would need category IDs, for now use search
        params.append('search', filters.vehicleType.join(' '));
      }

      // Add stock status filter
      params.append('stock_status', 'instock'); // Only show in-stock items

      // For vehicle-specific filters, we'll need to fetch more products and filter client-side
      // since WooCommerce doesn't have built-in vehicle filters
      params.set('per_page', '100'); // Fetch more to allow for filtering

      // Add sorting
      switch (sortBy) {
        case "price-low":
          params.append('orderby', 'price');
          params.append('order', 'asc');
          break;
        case "price-high":
          params.append('orderby', 'price');
          params.append('order', 'desc');
          break;
        case "year-newest":
        case "relevance":
        default:
          params.append('orderby', 'date');
          params.append('order', 'desc');
          break;
      }

      // Make the API request
      const products = await this.makeRequest('products', params);

      // Get total count for pagination (WooCommerce provides this in headers, but we'll estimate)
      const totalRecords = Array.isArray(products) ? products.length * 10 : 0; // Rough estimate
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);

      // Transform products to vehicle format first
      let transformedVehicles = Array.isArray(products)
        ? products.map((product, index) => this.transformProductToVehicle(product, index))
        : [];

      // Apply client-side filtering for vehicle-specific attributes
      transformedVehicles = this.applyVehicleFilters(transformedVehicles, filters);

      console.log(`✅ Fetched ${transformedVehicles.length} products from WooCommerce`);

      return {
        success: true,
        data: transformedVehicles,
        meta: {
          totalRecords,
          totalPages,
          currentPage: pagination.page,
          pageSize: pagination.pageSize,
          hasNextPage: pagination.page < totalPages,
          hasPreviousPage: pagination.page > 1
        }
      };

    } catch (error) {
      console.error("❌ Error fetching products from WooCommerce:", error);
      
      // Return empty result on error
      return {
        success: false,
        data: [],
        meta: {
          totalRecords: 0,
          totalPages: 0,
          currentPage: pagination.page,
          pageSize: pagination.pageSize,
          hasNextPage: false,
          hasPreviousPage: false
        },
        error: error.message
      };
    }
  }

  /**
   * Get filter options from WooCommerce product data
   */
  async getFilterOptions() {
    try {
      console.log("🔍 Fetching filter options from WooCommerce...");

      // Get product categories (used as vehicle types)
      const categories = await this.makeRequest('products/categories', new URLSearchParams({
        per_page: '50',
        hide_empty: 'true'
      }));

      // Get product attributes for makes/models (if configured)
      const attributes = await this.makeRequest('products/attributes');

      // Transform categories to filter format
      const vehicleTypes = Array.isArray(categories) 
        ? categories.map((cat: any) => ({
            name: cat.name,
            count: cat.count || 0
          }))
        : [];

      console.log(`✅ Found ${vehicleTypes.length} categories as vehicle types`);

      return {
        success: true,
        data: {
          makes: [], // Would need custom implementation based on product attributes
          models: [], // Would need custom implementation
          vehicleTypes: vehicleTypes
        }
      };
    } catch (error) {
      console.error("❌ Error fetching filter options:", error);
      return {
        success: true,
        data: {
          makes: [],
          models: [],
          vehicleTypes: []
        }
      };
    }
  }

  /**
   * Get dealers (could be based on product vendors or custom implementation)
   */
  async getDealers() {
    try {
      // For now, return a default dealer - could be enhanced with vendors/stores
      return {
        success: true,
        data: [
          { name: "Carzino Autos", count: 10 }
        ]
      };
    } catch (error) {
      console.error("❌ Error fetching dealers:", error);
      return {
        success: true,
        data: []
      };
    }
  }

  /**
   * Get vehicle types from product categories
   */
  async getVehicleTypeCounts() {
    try {
      const result = await this.getFilterOptions();
      return {
        success: true,
        data: result.data.vehicleTypes
      };
    } catch (error) {
      console.error("❌ Error fetching vehicle types:", error);
      return {
        success: true,
        data: []
      };
    }
  }

  /**
   * Test WooCommerce API connection
   */
  async testConnection() {
    try {
      console.log("🔍 Testing WooCommerce API connection...");
      
      // Test basic API access
      const systemStatus = await this.makeRequest('system_status');
      
      // Test products endpoint
      const products = await this.makeRequest('products', new URLSearchParams({
        per_page: '1'
      }));

      return {
        success: true,
        message: "WooCommerce API connection successful",
        data: {
          storeUrl: this.baseUrl,
          apiVersion: "v3",
          hasProducts: Array.isArray(products) && products.length > 0,
          productCount: Array.isArray(products) ? products.length : 0,
          systemStatus: systemStatus ? "✅ Connected" : "⚠️ Limited access"
        }
      };
    } catch (error) {
      console.error("❌ WooCommerce API connection test failed:", error);
      return {
        success: false,
        message: "WooCommerce API connection failed",
        error: error.message,
        storeUrl: this.baseUrl
      };
    }
  }
}
