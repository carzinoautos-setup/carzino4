import { RequestHandler } from "express";
import {
  SimplePaginationParams,
  SimpleVehicleFilters,
} from "../types/simpleVehicle.js";
import { getDatabase } from "../db/connection.js";

/**
 * WooCommerce REST API Service for live inventory integration
 * Uses WooCommerce REST API v3 (latest) for real-time product sync
 */
export class WooCommerceApiService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  // Temporarily disable database connection due to connection issues
  // private db = getDatabase();

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
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after 30 seconds for endpoint: ${endpoint}`);
        console.error(`⏰ WooCommerce API Timeout for ${endpoint}:`, timeoutError.message);
        throw timeoutError;
      }
      console.error(`❌ WooCommerce API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Apply vehicle-specific filters to transformed products
   */
  private applyVehicleFilters(vehicles: any[], filters: SimpleVehicleFilters): any[] {
    let filteredVehicles = [...vehicles];

    console.log(`🔍 Applying filters to ${filteredVehicles.length} vehicles:`, {
      make: filters.make,
      model: filters.model,
      condition: filters.condition,
      vehicleType: filters.vehicleType,
      driveType: filters.driveType,
      transmission: filters.transmission,
      exteriorColor: filters.exteriorColor,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      allFilters: JSON.stringify(filters)
    });

    // Check if "model" is actually a trim level
    const commonTrimLevels = ['premium', 'premium plus', 'prestige', 's line', 'sport', 'luxury', 'base', 'se', 'ex', 'lx'];
    if (filters.model && filters.model.length > 0) {
      const possibleTrim = filters.model.find(model =>
        commonTrimLevels.includes(model.toLowerCase())
      );
      if (possibleTrim) {
        console.log(`💵 Detected "${possibleTrim}" as potential trim level, applying flexible matching`);
      }
    }

    // Filter by make
    if (filters.make && filters.make.length > 0) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        const vehicleMake = this.extractMakeFromTitle(vehicle.title);
        return filters.make.some(make =>
          vehicleMake.toLowerCase().includes(make.toLowerCase())
        );
      });
      console.log(`📊 After make filter: ${filteredVehicles.length} vehicles`);
    }

    // Filter by model (also check if it might be a trim level)
    if (filters.model && filters.model.length > 0) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        const vehicleModel = this.extractModelFromTitle(vehicle.title);
        const fullTitle = vehicle.title.toLowerCase();

        return filters.model.some(model => {
          const modelLower = model.toLowerCase();
          // Check if it matches as model or appears anywhere in title (for trim levels)
          return vehicleModel.toLowerCase().includes(modelLower) ||
                 fullTitle.includes(modelLower) ||
                 vehicle.badges?.some((badge: string) => badge.toLowerCase().includes(modelLower));
        });
      });
      console.log(`���� After model filter: ${filteredVehicles.length} vehicles`);
    }

    // Filter by condition
    if (filters.condition && filters.condition.length > 0) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        return filters.condition.some(condition =>
          vehicle.badges.some((badge: string) =>
            badge.toLowerCase().includes(condition.toLowerCase())
          )
        );
      });
      console.log(`📊 After condition filter: ${filteredVehicles.length} vehicles`);
    }

    // Filter by price range
    if (filters.priceMin || filters.priceMax) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        if (!vehicle.salePrice) return false;

        const price = parseFloat(vehicle.salePrice.replace(/[^\d.]/g, ''));

        if (filters.priceMin && price < parseFloat(filters.priceMin)) {
          return false;
        }

        if (filters.priceMax && price > parseFloat(filters.priceMax)) {
          return false;
        }

        return true;
      });
      console.log(`📊 After price filter: ${filteredVehicles.length} vehicles`);
    }

    // Filter by vehicle type (categories)
    if (filters.vehicleType && filters.vehicleType.length > 0) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        return filters.vehicleType.some(type =>
          vehicle.categories?.some((cat: string) =>
            cat.toLowerCase().includes(type.toLowerCase())
          ) || vehicle.title.toLowerCase().includes(type.toLowerCase())
        );
      });
      console.log(`📊 After vehicle type filter: ${filteredVehicles.length} vehicles`);
    }

    // Filter by exterior color
    if (filters.exteriorColor && filters.exteriorColor.length > 0) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        // Access exterior color from meta fields that were extracted during transformation
        const vehicleExteriorColor = vehicle.exterior_color || '';
        return filters.exteriorColor.some(color =>
          vehicleExteriorColor.toLowerCase().includes(color.toLowerCase())
        );
      });
      console.log(`📊 After exterior color filter: ${filteredVehicles.length} vehicles`);
    }

    // Filter by interior color
    if (filters.interiorColor && filters.interiorColor.length > 0) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        // Access interior color from meta fields that were extracted during transformation
        const vehicleInteriorColor = vehicle.interior_color || '';
        return filters.interiorColor.some(color =>
          vehicleInteriorColor.toLowerCase().includes(color.toLowerCase())
        );
      });
      console.log(`📊 After interior color filter: ${filteredVehicles.length} vehicles`);
    }

    // Filter by city
    if (filters.city && filters.city.length > 0) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        return filters.city.some(city =>
          vehicle.city_seller?.toLowerCase().includes(city.toLowerCase())
        );
      });
      console.log(`��� After city filter: ${filteredVehicles.length} vehicles`);
    }

    // Filter by state
    if (filters.state && filters.state.length > 0) {
      filteredVehicles = filteredVehicles.filter(vehicle => {
        return filters.state.some(state =>
          vehicle.state_seller?.toLowerCase().includes(state.toLowerCase())
        );
      });
      console.log(`📊 After state filter: ${filteredVehicles.length} vehicles`);
    }

    console.log(`✅ Final filtered results: ${filteredVehicles.length} vehicles`);
    return filteredVehicles;
  }

  /**
   * Extract make from vehicle title
   */
  private extractMakeFromTitle(title: string): string {
    const titleParts = title.split(' ');
    // Usually the make is the second part (after year)
    return titleParts.length > 1 ? titleParts[1] : '';
  }

  /**
   * Extract model from vehicle title
   */
  private extractModelFromTitle(title: string): string {
    const titleParts = title.split(' ');
    // Usually the model is the third part (after year make)
    return titleParts.length > 2 ? titleParts[2] : '';
  }

  /**
   * Fetch seller data by account number from sellers table
   * Currently disabled due to database connection issues
   */
  private async fetchSellerData(sellerAccountNumber: string): Promise<{city_seller?: string, state_seller?: string, zip_seller?: string}> {
    // Temporarily disabled due to database connection issues
    return {};
  }

  /**
   * Transform WooCommerce product to vehicle format
   */
  private async transformProductToVehicle(product: any, index: number): Promise<any> {
    // Extract vehicle-specific meta data
    const metaData = product.meta_data || [];
    const getMeta = (key: string) => metaData.find((m: any) => m.key === key)?.value || "";

    // Debug: Log first few products' transformation
    if (index < 2) {
      console.log(`🚗 Transforming Product ${index + 1}:`, {
        id: product.id,
        name: product.name,
        price: product.price,
        categories: product.categories?.map(c => c.name),
        availableMetaKeys: metaData.map(m => m.key),
        metaExtraction: {
          year: getMeta('year') || getMeta('vehicle_year'),
          make: getMeta('make') || getMeta('vehicle_make'),
          model: getMeta('model') || getMeta('vehicle_model'),
          condition: getMeta('condition') || getMeta('vehicle_condition'),
          transmission: getMeta('transmission'),
          drivetrain: getMeta('drivetrain') || getMeta('drive_type'),
          mileage: getMeta('mileage'),
          exterior_color: getMeta('exterior_color') || getMeta('color'),
          dealer_name: getMeta('dealer_name')
        }
      });
    }

    // Get medium-sized product images (450x300) for better performance
    const images = product.images && product.images.length > 0
      ? product.images.map((img: any) => {
          // Use medium size if available in the API response
          if (img.sizes && img.sizes.medium) {
            return img.sizes.medium;
          } else if (img.src) {
            // Generate WordPress medium size URL (standard WordPress approach)
            // WordPress typically generates images like: image-450x300.jpg
            const url = img.src;
            const urlParts = url.split('.');
            if (urlParts.length >= 2) {
              const extension = urlParts.pop();
              const baseName = urlParts.join('.');
              // Try medium size URL first, fallback to original if it doesn't exist
              return `${baseName}-450x300.${extension}`;
            }
          }
          return img.src;
        }).filter(Boolean)
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

    // Build badges - only condition and drivetrain as requested
    const drivetrain = getMeta('drivetrain') || getMeta('drive_type') || "";
    const badges = [
      condition,
      drivetrain
    ].filter(Boolean);

    // Calculate estimated payment (simple calculation)
    const price = parseFloat(product.price || product.regular_price || 0);
    const estimatedPayment = price > 0 ? Math.round(price / 60) : 0; // Rough 60-month estimate

    // Extract seller data directly from WooCommerce API meta data (no database needed)
    const sellerAccountNumber = getMeta('seller_account_number') ||
                                getMeta('_vehicle_seller_account') ||
                                getMeta('account_number_seller') ||
                                getMeta('_account_number_seller');

    // Extract seller location data directly from product meta data
    const sellerData = {
      city_seller: getMeta('city_seller'),
      state_seller: getMeta('state_seller'),
      zip_seller: getMeta('zip_seller'),
      phone_number_seller: getMeta('phone_number_seller'),
      email_seller: getMeta('email_seller'),
      address_seller: getMeta('address_seller'),
      account_type_seller: getMeta('account_type_seller'),
      business_name_seller: getMeta('business_name_seller') || getMeta('account_name_seller') || getMeta('acount_name_seller')
    };

    // Debug seller data extraction for first few products
    if (index < 2) {
      console.log(`🏢 Seller data extracted for product ${product.id}:`, sellerData);
    }

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
      seller_type: sellerData.account_type_seller || "Dealer",
      seller_account_number: sellerAccountNumber,
      // Seller location data
      city_seller: sellerData.city_seller,
      state_seller: sellerData.state_seller,
      zip_seller: sellerData.zip_seller,
      // Additional seller contact data
      phone_number_seller: sellerData.phone_number_seller,
      email_seller: sellerData.email_seller,
      address_seller: sellerData.address_seller,
      business_name_seller: sellerData.business_name_seller,
      // Vehicle color data
      exterior_color: getMeta('exterior_color'),
      interior_color: getMeta('interior_color'),
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

      // Build optimized WooCommerce API parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: Math.min(pagination.pageSize, 50).toString(), // Reduced from 100 to 50 for performance
        status: 'publish',           // Only published products
        stock_status: 'instock',     // Only in-stock products
        catalog_visibility: 'visible', // Only catalog-visible products
        _fields: 'id,name,price,regular_price,featured,stock_status,categories,meta_data,images' // PERFORMANCE: Only fetch needed fields
      });

      // Build search terms from filters and explicit search
      let searchTerms: string[] = [];

      if (filters.search) {
        searchTerms.push(filters.search);
      }

      // Add make/model to search to improve product discovery
      if (filters.make && filters.make.length > 0) {
        searchTerms.push(...filters.make);
      }

      if (filters.model && filters.model.length > 0) {
        searchTerms.push(...filters.model);
      }

      // Add category filter (using categories as vehicle types)
      if (filters.vehicleType && filters.vehicleType.length > 0) {
        searchTerms.push(...filters.vehicleType);
      }

      // Combine all search terms
      if (searchTerms.length > 0) {
        params.append('search', searchTerms.join(' '));
        console.log(`🔍 Using search terms: "${searchTerms.join(' ')}"`);
      }

      // REMOVED: Duplicate stock_status parameter (already set above)

      // PERFORMANCE: Reduced data fetching for better response times
      // Only fetch what we need for current page + small buffer for filtering
      const hasSpecificFilters = filters.make || filters.model || filters.condition || filters.priceMin || filters.priceMax;
      const fetchSize = hasSpecificFilters ? Math.min(pagination.pageSize * 3, 50) : pagination.pageSize; // Reduced from 200+ to max 50
      params.set('per_page', fetchSize.toString());

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

      // PERFORMANCE: Reduced pagination fetching from 3 pages to 1-2 max
      const maxPagesToFetch = hasSpecificFilters ? 2 : 1; // Maximum 2 pages instead of 3

      let allProducts: any[] = [];

      for (let page = 1; page <= maxPagesToFetch; page++) {
        params.set('page', page.toString());

        try {
          const products = await this.makeRequest('products', params);

          if (Array.isArray(products) && products.length > 0) {
            allProducts.push(...products);
            console.log(`📦 Fetched ${products.length} products from page ${page}, total: ${allProducts.length}`);

            // If we got less than the max per page, we've reached the end
            if (products.length < 100) {
              console.log(`✅ Reached end of products at page ${page}`);
              break;
            }

            // PERFORMANCE: Break early with much smaller dataset
            if (!hasSpecificFilters && allProducts.length >= 50) {
              console.log(`⚡ Breaking early for performance (${allProducts.length} products)`);
              break;
            }
          } else {
            console.log(`📦 No more products found on page ${page}`);
            break;
          }
        } catch (error) {
          console.error(`❌ Error fetching page ${page}:`, error);
          if (page === 1) {
            // If first page fails, throw error
            throw error;
          }
          // If subsequent pages fail, just break and use what we have
          break;
        }
      }

      // Get total count for pagination
      const totalRecords = allProducts.length;
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);

      // Transform products to vehicle format in smaller batches to prevent overwhelming DB
      let transformedVehicles = [];
      const batchSize = 10; // Process 10 products at a time

      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((product, batchIndex) =>
            this.transformProductToVehicle(product, i + batchIndex)
          )
        );
        transformedVehicles.push(...batchResults);
      }

      // Apply client-side filtering for vehicle-specific attributes
      transformedVehicles = this.applyVehicleFilters(transformedVehicles, filters);

      // Calculate pagination based on filtered results
      const filteredTotalRecords = transformedVehicles.length;
      const filteredTotalPages = Math.ceil(filteredTotalRecords / pagination.pageSize);

      // Apply pagination to filtered results
      const startIndex = (pagination.page - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedVehicles = transformedVehicles.slice(startIndex, endIndex);

      console.log(`✅ Processed ${allProducts.length} total products, filtered to ${transformedVehicles.length} vehicles, showing ${paginatedVehicles.length} on page ${pagination.page}`);

      return {
        success: true,
        data: paginatedVehicles,
        meta: {
          totalRecords: filteredTotalRecords,
          totalPages: filteredTotalPages,
          currentPage: pagination.page,
          pageSize: pagination.pageSize,
          hasNextPage: pagination.page < filteredTotalPages,
          hasPreviousPage: pagination.page > 1
        }
      };

    } catch (error) {
      console.error("❌ Error fetching products from WooCommerce:", error);

      // Return empty result on error with better error handling
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
        error: error?.message || error?.toString() || 'Unknown API error'
      };
    }
  }

  /**
   * Get filter options with real counts from WooCommerce product data
   * Uses same meta field extraction logic as transformWooCommerceProduct
   * @param appliedFilters - Current filter selections to conditionally filter options
   */
  async getFilterOptions(appliedFilters: SimpleVehicleFilters = {}) {
    try {
      console.log("🔍 STARTING getFilterOptions - Fetching filter options from WooCommerce...");

      // PERFORMANCE: Add caching for filter options (5 minute cache)
      const filterCacheKey = `filter_options_${JSON.stringify(appliedFilters)}`;
      const cachedFilters = this.getCachedData(filterCacheKey);
      if (cachedFilters) {
        console.log("⚡ Using cached filter options");
        return cachedFilters;
      }

      console.log("🔍 WooCommerce credentials check:", {
        hasConsumerKey: !!this.consumerKey,
        hasConsumerSecret: !!this.consumerSecret,
        baseUrl: this.baseUrl
      });

      // PERFORMANCE: Dramatically reduced data fetching for filter analysis
      // Only fetch minimal data needed for filter extraction
      let allProducts: any[] = [];
      const maxPages = 1; // Reduced from 2 to 1 page for performance
      const productsNeeded = 50; // Reduced from 200 to 50 products

      for (let page = 1; page <= maxPages; page++) {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: productsNeeded.toString(), // Reduced from 100 to 50
          status: 'publish',
          stock_status: 'instock',
          catalog_visibility: 'visible',
          _fields: 'id,name,categories,meta_data,featured' // PERFORMANCE: Only fetch essential fields for filters
        });

        try {
          const products = await this.makeRequest('products', params);

          if (Array.isArray(products) && products.length > 0) {
            allProducts.push(...products);
            console.log(`📦 Analyzed ${products.length} products from page ${page}, total: ${allProducts.length} (optimized payload)`);

            if (products.length < productsNeeded) {
              console.log(`✅ Reached end of products at page ${page}`);
              break;
            }
          } else {
            break;
          }
        } catch (error) {
          console.error(`❌ Error fetching page ${page} for filter analysis:`, error);
          console.error(`❌ Error details:`, {
            name: error.name,
            message: error.message,
            stack: error.stack?.substring(0, 200)
          });
          if (page === 1) {
            // If first page fails, return empty but successful result
            console.log("⚠�� Using fallback filter data");
            return {
              success: true,
              data: {
                makes: [
                  { name: "Ford", count: 0 },
                  { name: "Chevrolet", count: 0 },
                  { name: "Toyota", count: 0 },
                  { name: "Honda", count: 0 }
                ],
                models: [],
                trims: [],
                conditions: [
                  { name: "Used", count: 0 },
                  { name: "New", count: 0 }
                ],
                vehicleTypes: [],
                driveTypes: [
                  { name: "AWD/4WD", count: 0 },
                  { name: "FWD", count: 0 },
                  { name: "RWD", count: 0 }
                ],
                transmissions: [
                  { name: "Auto", count: 0 },
                  { name: "Manual", count: 0 },
                  { name: "CVT", count: 0 }
                ],
                exteriorColors: [],
                interiorColors: [],
                cities: [],
                states: [],
                sellerTypes: [
                  { name: "Dealer", count: 0 }
                ],
                dealers: [
                  { name: "Carzino Autos", count: 0 }
                ],
                totalVehicles: 0
              }
            };
          }
          break;
        }
      }

      // Apply conditional filtering if filters are provided
      let filteredProducts = allProducts;
      if (Object.keys(appliedFilters).length > 0) {
        console.log(`�� Applying conditional filtering to ${allProducts.length} products with filters:`, appliedFilters);

        // Transform products to vehicles for filtering in batches
        let transformedVehicles = [];
        const batchSize = 10; // Process 10 products at a time

        for (let i = 0; i < allProducts.length; i += batchSize) {
          const batch = allProducts.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map((product, batchIndex) =>
              this.transformProductToVehicle(product, i + batchIndex)
            )
          );
          transformedVehicles.push(...batchResults);
        }

        // Apply the same filtering logic as in getVehicles
        const filteredVehicles = this.applyVehicleFilters(transformedVehicles, appliedFilters);

        // Get the filtered product IDs
        const filteredProductIds = new Set(filteredVehicles.map(v => v.id));

        // Filter original products to match
        filteredProducts = allProducts.filter(product => filteredProductIds.has(product.id));

        console.log(`🔍 Conditional filtering reduced products from ${allProducts.length} to ${filteredProducts.length}`);
      }

      // Analyze filtered products using same logic as transformWooCommerceProduct
      const makesCounts: { [key: string]: number } = {};
      const modelCounts: { [key: string]: number } = {};
      const trimCounts: { [key: string]: number } = {};
      const conditionCounts: { [key: string]: number } = {};
      const categoryMap: { [key: string]: number } = {};
      const driveTypeCounts: { [key: string]: number } = {};
      const transmissionCounts: { [key: string]: number } = {};
      const exteriorColorCounts: { [key: string]: number } = {};
      const interiorColorCounts: { [key: string]: number } = {};
      const cityCounts: { [key: string]: number } = {};
      const stateCounts: { [key: string]: number } = {};
      const sellerTypeCounts: { [key: string]: number } = {};
      const dealerCounts: { [key: string]: number } = {};

      filteredProducts.forEach((product, index) => {
        // Helper function to get meta values (same as in transformWooCommerceProduct)
        const getMeta = (key: string): string => {
          if (!product.meta_data || !Array.isArray(product.meta_data)) return '';
          const meta = product.meta_data.find((item: any) => item.key === key);
          return meta?.value ? String(meta.value).trim() : '';
        };

        // Debug: Log first few products' meta data to see what fields are actually available
        if (index < 3) {
          console.log(`🔍 Product ${index + 1} Debug:`, {
            id: product.id,
            name: product.name,
            categories: product.categories?.map(c => c.name),
            metaKeys: product.meta_data?.map(m => m.key).slice(0, 10) || [],
            sampleMeta: {
              make: getMeta('make'),
              vehicle_make: getMeta('vehicle_make'),
              model: getMeta('model'),
              vehicle_model: getMeta('vehicle_model'),
              condition: getMeta('condition'),
              vehicle_condition: getMeta('vehicle_condition'),
              year: getMeta('year'),
              vehicle_year: getMeta('vehicle_year')
            }
          });
        }

        // Extract make using same logic as transformWooCommerceProduct
        const make = getMeta('make') || getMeta('vehicle_make') || product.categories?.[0]?.name || "";
        if (make && make.length > 1) {
          makesCounts[make] = (makesCounts[make] || 0) + 1;
        }

        // Extract model using same logic as transformWooCommerceProduct
        const model = getMeta('model') || getMeta('vehicle_model') || product.name.split(' ')[0] || "";
        if (model && model.length > 1) {
          modelCounts[model] = (modelCounts[model] || 0) + 1;
        }

        // Extract trim (often found in product name, description, or meta)
        const trim = getMeta('trim') || getMeta('vehicle_trim') || "";
        if (trim && trim.length > 1) {
          trimCounts[trim] = (trimCounts[trim] || 0) + 1;
        }

        // Extract condition using same logic as transformWooCommerceProduct
        const condition = getMeta('condition') || getMeta('vehicle_condition') ||
                         (product.featured ? "Certified" : "Used");
        if (condition) {
          conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
        }

        // Extract drive type
        const drivetrain = getMeta('drivetrain') || getMeta('drive_type') || "";
        if (drivetrain) {
          let driveType = "";
          if (drivetrain.toLowerCase().includes('4wd') || drivetrain.toLowerCase().includes('awd')) {
            driveType = "AWD/4WD";
          } else if (drivetrain.toLowerCase().includes('fwd')) {
            driveType = "FWD";
          } else if (drivetrain.toLowerCase().includes('rwd')) {
            driveType = "RWD";
          }
          if (driveType) {
            driveTypeCounts[driveType] = (driveTypeCounts[driveType] || 0) + 1;
          }
        }

        // Extract transmission
        const transmission = getMeta('transmission') || "Auto";
        if (transmission) {
          let transType = "";
          if (transmission.toLowerCase().includes('manual')) {
            transType = "Manual";
          } else if (transmission.toLowerCase().includes('cvt')) {
            transType = "CVT";
          } else {
            transType = "Auto";
          }
          transmissionCounts[transType] = (transmissionCounts[transType] || 0) + 1;
        }

        // Extract exterior color
        const exteriorColor = getMeta('exterior_color') || "";
        if (exteriorColor && exteriorColor.length > 0) {
          exteriorColorCounts[exteriorColor] = (exteriorColorCounts[exteriorColor] || 0) + 1;
        }

        // Extract interior color
        const interiorColor = getMeta('interior_color') || "";
        if (interiorColor && interiorColor.length > 0) {
          interiorColorCounts[interiorColor] = (interiorColorCounts[interiorColor] || 0) + 1;
        }

        // Extract seller location data
        const cityData = getMeta('city_seller') || "";
        if (cityData && cityData.length > 0) {
          cityCounts[cityData] = (cityCounts[cityData] || 0) + 1;
        }

        const stateData = getMeta('state_seller') || "";
        if (stateData && stateData.length > 0) {
          stateCounts[stateData] = (stateCounts[stateData] || 0) + 1;
        }

        // Extract seller type and dealer
        const sellerType = "Dealer"; // Default for WooCommerce products
        sellerTypeCounts[sellerType] = (sellerTypeCounts[sellerType] || 0) + 1;

        // Use correct dealer field: acount_name_seller
        const dealer = getMeta('acount_name_seller') || getMeta('account_name_seller') || getMeta('business_name_seller') || "Carzino Autos";
        if (dealer) {
          dealerCounts[dealer] = (dealerCounts[dealer] || 0) + 1;
        }

        // Track categories for vehicle types
        if (product.categories && Array.isArray(product.categories)) {
          product.categories.forEach((cat: any) => {
            const catName = cat.name;
            if (catName && catName.length > 0) {
              categoryMap[catName] = (categoryMap[catName] || 0) + 1;
            }
          });
        }
      });

      // Convert to array format, sorted by count
      const makes = Object.entries(makesCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Limit to top 20 makes

      const models = Object.entries(modelCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 30); // Limit to top 30 models

      const trims = Object.entries(trimCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 25); // Limit to top 25 trims

      const conditions = Object.entries(conditionCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const driveTypes = Object.entries(driveTypeCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const transmissions = Object.entries(transmissionCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const exteriorColors = Object.entries(exteriorColorCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Limit to top 10 colors

      const interiorColors = Object.entries(interiorColorCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Limit to top 10 colors

      const cities = Object.entries(cityCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // Limit to top 15 cities

      const states = Object.entries(stateCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const sellerTypes = Object.entries(sellerTypeCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const dealers = Object.entries(dealerCounts)
        .filter(([name, count]) => name.length > 0 && count > 0)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Limit to top 10 dealers

      // Get categories as vehicle types (excluding obvious non-vehicle categories)
      const excludeCategories = ['uncategorized', 'featured', 'sale', 'new arrivals'];
      const vehicleTypes = Object.entries(categoryMap)
        .filter(([name, count]) =>
          name.length > 0 &&
          count > 0 &&
          !excludeCategories.includes(name.toLowerCase())
        )
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // Limit to 15 vehicle types

      console.log(`✅ Found ${makes.length} makes, ${models.length} models, ${trims.length} trims, ${conditions.length} conditions, ${driveTypes.length} drive types, ${transmissions.length} transmissions, ${exteriorColors.length} exterior colors, ${interiorColors.length} interior colors, ${cities.length} cities, ${states.length} states, ${vehicleTypes.length} vehicle types from meta data analysis`);

      const result = {
        success: true,
        data: {
          makes: makes,
          models: models,
          trims: trims,
          conditions: conditions,
          vehicleTypes: vehicleTypes,
          driveTypes: driveTypes,
          transmissions: transmissions,
          exteriorColors: exteriorColors,
          interiorColors: interiorColors,
          cities: cities,
          states: states,
          sellerTypes: sellerTypes,
          dealers: dealers,
          totalVehicles: filteredProducts.length
        }
      };

      console.log("🔍 RETURNING getFilterOptions result:", {
        success: result.success,
        makesCount: result.data.makes.length,
        sampleMakes: result.data.makes.slice(0, 3),
        dataKeys: Object.keys(result.data)
      });

      return result;
    } catch (error) {
      console.error("❌ Error fetching filter options:", error);
      return {
        success: true,
        data: {
          makes: [
            { name: "Ford", count: 0 },
            { name: "Chevrolet", count: 0 },
            { name: "Toyota", count: 0 }
          ],
          models: [],
          trims: [],
          conditions: [
            { name: "Used", count: 0 },
            { name: "New", count: 0 }
          ],
          vehicleTypes: [],
          driveTypes: [
            { name: "AWD/4WD", count: 0 },
            { name: "FWD", count: 0 },
            { name: "RWD", count: 0 }
          ],
          transmissions: [
            { name: "Auto", count: 0 },
            { name: "Manual", count: 0 },
            { name: "CVT", count: 0 }
          ],
          exteriorColors: [],
          interiorColors: [],
          cities: [],
          states: [],
          sellerTypes: [
            { name: "Dealer", count: 0 }
          ],
          dealers: [
            { name: "Carzino Autos", count: 0 }
          ],
          totalVehicles: 0
        }
      };
    }
  }

  /**
   * Get dealers from actual WooCommerce product data
   */
  async getDealers() {
    try {
      console.log("🏢 Extracting real dealers from WooCommerce products...");

      // PERFORMANCE: Fetch minimal data needed for dealer extraction
      const params = new URLSearchParams({
        page: '1',
        per_page: '30', // Reduced from 100 - dealers repeat across products
        status: 'publish',
        stock_status: 'instock',
        _fields: 'id,name,meta_data' // PERFORMANCE: Only fetch meta_data for dealer extraction
      });

      const products = await this.makeRequest('products', params);

      const dealerCounts = new Map<string, number>();

      // Analyze products to extract dealers
      products.forEach((product, index) => {
        const getMeta = (key: string): string => {
          if (!product.meta_data || !Array.isArray(product.meta_data)) return '';
          const meta = product.meta_data.find((item: any) => item.key === key);
          return meta?.value ? String(meta.value).trim() : '';
        };

        // Extract dealer name from meta data
        const dealerName = getMeta('dealer_name') ||
                          getMeta('business_name_seller') ||
                          getMeta('account_name_seller') ||
                          getMeta('acount_name_seller') ||
                          "Carzino Autos";

        if (dealerName && dealerName.length > 0) {
          dealerCounts.set(dealerName, (dealerCounts.get(dealerName) || 0) + 1);
        }

        // Debug first few products
        if (index < 3) {
          console.log(`🔍 Product ${index + 1} dealer analysis:`, {
            productName: product.name,
            dealerMeta: {
              dealer_name: getMeta('dealer_name'),
              business_name_seller: getMeta('business_name_seller'),
              account_name_seller: getMeta('account_name_seller'),
              acount_name_seller: getMeta('acount_name_seller'),
            },
            finalDealer: dealerName
          });
        }
      });

      // Convert to array format
      const dealers = Array.from(dealerCounts.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count); // Sort by count descending

      console.log(`✅ Extracted ${dealers.length} unique dealers:`, dealers);

      return {
        success: true,
        data: dealers
      };
    } catch (error) {
      console.error("❌ Error fetching dealers:", error);
      // Fallback to default dealer
      return {
        success: true,
        data: [
          { name: "Carzino Autos", count: 0 }
        ]
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
   * Get a single vehicle by ID
   */
  async getVehicleById(id: number) {
    try {
      console.log(`🔍 Fetching vehicle with ID: ${id}`);

      const product = await this.makeRequest(`products/${id}`);

      if (!product) {
        return null;
      }

      // Transform the single product to vehicle format
      const vehicle = await this.transformProductToVehicle(product, 0);

      return vehicle;
    } catch (error) {
      console.error(`❌ Error fetching vehicle with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Test WooCommerce API connection
   */
  async testConnection() {
    try {
      console.log("��� Testing WooCommerce API connection...");
      
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
