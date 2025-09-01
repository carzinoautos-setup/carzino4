import {
  SimplePaginationParams,
  SimpleVehicleFilters,
} from "../types/simpleVehicle.js";

const WP_BASE_URL = "https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1";
const VEHICLES_ENDPOINT = `${WP_BASE_URL}/vehicles`;
const FILTERS_ENDPOINT = `${WP_BASE_URL}/filters`;

export class CustomWordPressApiService {

  async getVehicles(pagination: SimplePaginationParams, filters: SimpleVehicleFilters = {}, sortBy: string = "relevance") {
    try {
      // Build URL with pagination
      const url = new URL(VEHICLES_ENDPOINT);
      url.searchParams.set('per_page', pagination.pageSize.toString());
      url.searchParams.set('page', pagination.page.toString());

      // Add all filter parameters using CLEAN field names per WordPress API spec
      if (filters.make && filters.make.length > 0) {
        url.searchParams.set('make', filters.make.join(','));
      }
      if (filters.model && filters.model.length > 0) {
        url.searchParams.set('model', filters.model.join(','));
      }
      if (filters.trim && filters.trim.length > 0) {
        url.searchParams.set('trim', filters.trim.join(','));
      }
      if (filters.condition && filters.condition.length > 0) {
        url.searchParams.set('condition', filters.condition.join(','));
      }
      if (filters.vehicleType && filters.vehicleType.length > 0) {
        url.searchParams.set('body_style', filters.vehicleType.join(','));
      }
      if (filters.driveType && filters.driveType.length > 0) {
        url.searchParams.set('drivetrain', filters.driveType.join(','));
      }
      if (filters.transmission && filters.transmission.length > 0) {
        url.searchParams.set('transmission', filters.transmission.join(','));
      }
      if (filters.exteriorColor && filters.exteriorColor.length > 0) {
        url.searchParams.set('exterior_color', filters.exteriorColor.join(','));
      }
      if (filters.interiorColor && filters.interiorColor.length > 0) {
        url.searchParams.set('interior_color', filters.interiorColor.join(','));
      }
      if (filters.sellerType && filters.sellerType.length > 0) {
        url.searchParams.set('seller_type', filters.sellerType.join(','));
      }
      if (filters.dealer && filters.dealer.length > 0) {
        url.searchParams.set('dealer_name', filters.dealer.join(','));
      }
      if (filters.city && filters.city.length > 0) {
        url.searchParams.set('city_seller', filters.city.join(','));
      }
      if (filters.state && filters.state.length > 0) {
        url.searchParams.set('state_seller', filters.state.join(','));
      }
      if (filters.mileage) {
        url.searchParams.set('mileage_range', filters.mileage);
      }
      if (filters.min_mileage) {
        url.searchParams.set('min_mileage', filters.min_mileage);
      }
      if (filters.max_mileage) {
        url.searchParams.set('max_mileage', filters.max_mileage);
      }
      if (filters.search) {
        url.searchParams.set('search', filters.search);
      }
      if (sortBy && sortBy !== 'relevance') {
        // Map frontend sort values to WordPress API sort parameters
        const sortMapping: { [key: string]: string } = {
          'price-low': 'price_asc',
          'price-high': 'price_desc',
          'miles-low': 'mileage_asc',
          'mileage-low': 'mileage_asc',
          'mileage-high': 'mileage_desc',
          'year-newest': 'year_desc',
          'year-new': 'year_desc',
          'year-oldest': 'year_asc'
        };

        const wpSortValue = sortMapping[sortBy] || sortBy;
        url.searchParams.set('sort', wpSortValue);
      }

      console.log("🔗 Fetching from vehicles API with clean field names:", url.toString());
      console.log("🔍 DEBUG: Filters being sent to WordPress:", filters);


      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("📦 Vehicles API Response structure:", {
        hasSuccess: 'success' in apiResponse,
        hasData: 'data' in apiResponse,
        hasPagination: 'pagination' in apiResponse,
        dataLength: Array.isArray(apiResponse.data) ? apiResponse.data.length : 'N/A',
        totalRecords: apiResponse.pagination?.total,
        fullStructure: Object.keys(apiResponse),
        sampleVehicle: apiResponse.data?.[0] ? Object.keys(apiResponse.data[0]) : 'none'
      });

      if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
        throw new Error("API did not return expected format");
      }

      // Get all vehicles from current page
      let vehicles = apiResponse.data;

      // Apply client-side price filtering since WordPress API doesn't support it
      const originalVehicleCount = vehicles.length;
      if (filters.priceMin || filters.priceMax) {
        console.log("💰 APPLYING CLIENT-SIDE PRICE FILTER:", {
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          originalCount: originalVehicleCount
        });

        vehicles = vehicles.filter(vehicle => {
          // Get price from multiple possible fields
          const priceFields = [
            vehicle.acf?.price,
            vehicle.acf?.sale_price,
            vehicle.acf?.listing_price,
            vehicle.price,
            vehicle.regular_price,
            vehicle.acf?.vehicle_price,
            vehicle.acf?.asking_price
          ];

          // Find first valid price
          const priceStr = priceFields.find(p => p && p !== "" && p !== "0" && parseInt(p) > 0);
          if (!priceStr) {
            // No valid price found - exclude from price filtering
            return false;
          }

          const price = parseInt(priceStr);

          // Apply min price filter
          if (filters.priceMin) {
            const minPrice = parseInt(filters.priceMin.replace(/[,$]/g, ''));
            if (price < minPrice) return false;
          }

          // Apply max price filter
          if (filters.priceMax) {
            const maxPrice = parseInt(filters.priceMax.replace(/[,$]/g, ''));
            if (price > maxPrice) return false;
          }

          return true;
        });

        console.log("💰 PRICE FILTER RESULTS:", {
          originalCount: originalVehicleCount,
          filteredCount: vehicles.length,
          filteredOut: originalVehicleCount - vehicles.length
        });
      }

      // Transform vehicles to expected format using new ACF structure
      const transformedVehicles = vehicles.map(vehicle => {
        // Get price from multiple possible fields with better logic
        const priceFields = [
          vehicle.acf?.price,
          vehicle.acf?.sale_price,
          vehicle.acf?.listing_price,
          vehicle.price,
          vehicle.regular_price,
          vehicle.acf?.vehicle_price,
          vehicle.acf?.asking_price
        ];

        // Find first valid price that's not null, undefined, empty string, or "0"
        const price = priceFields.find(p => p && p !== "" && p !== "0" && parseInt(p) > 0);
        const formattedPrice = price ? `$${parseInt(price).toLocaleString()}` : null;

        // Get payment - try ACF payment field first, then calculate from price
        const existingPayment = vehicle.acf?.payment;
        let payment = null;

        if (existingPayment && existingPayment !== "0" && parseInt(existingPayment) > 0) {
          // Use existing payment from ACF
          payment = `$${parseInt(existingPayment)}/mo*`;
        } else if (price) {
          // Calculate payment from price
          payment = `$${Math.round(parseInt(price) / 60)}/mo*`;
        }

        // Clean debugging removed - price and payment logic is working correctly

        // Get mileage - ensure it's not zero/empty
        const mileage = vehicle.acf?.mileage || vehicle.acf?.odometer;
        const formattedMileage = mileage && parseInt(mileage) > 0 ?
          `${parseInt(mileage).toLocaleString()}` : "0";

        // Get drivetrain for badges - include actual drivetrain text
        const drivetrain = vehicle.acf?.drivetrain || vehicle.acf?.drive_type;

        return {
          id: vehicle.id,
          featured: vehicle.acf?.is_featured || false,
          viewed: false,
          images: vehicle.images?.slice(0, 3).map(img => img.src) || [vehicle.featured_image],
          badges: [
            vehicle.acf?.condition || "Used",
            drivetrain || "", // Show actual drivetrain (FWD, AWD, 4WD, etc.)
            vehicle.acf?.is_featured ? "Featured!" : ""
          ].filter(Boolean),
          title: vehicle.name || `${vehicle.acf?.year} ${vehicle.acf?.make} ${vehicle.acf?.model}`.trim(),
          mileage: formattedMileage,
          transmission: vehicle.acf?.transmission || "Auto",
          doors: vehicle.acf?.doors ? `${vehicle.acf.doors} doors` : "4 doors",
          salePrice: formattedPrice,
          payment: payment,
          dealer: vehicle.acf?.dealer_name || vehicle.acf?.account_name_seller || "Carzino Dealer",
          location: `${vehicle.acf?.city_seller || "Local"}, ${vehicle.acf?.state_seller || "State"}`,
          phone: vehicle.acf?.phone_number_seller || "Contact Dealer",
          seller_type: vehicle.acf?.seller_type || vehicle.acf?.account_type_seller || "Dealer",
          seller_account_number: vehicle.acf?.seller_account_number || vehicle.acf?.account_number_seller || "",
          // Add individual location fields for VehicleCard
          city_seller: vehicle.acf?.city_seller,
          state_seller: vehicle.acf?.state_seller,
          zip_seller: vehicle.acf?.zip_seller || vehicle.acf?.zip_code_seller
        };
      });

      // Use pagination info from API response, but adjust for client-side filtering
      const paginationInfo = apiResponse.pagination;
      const isFiltered = (filters.priceMin || filters.priceMax);

      if (isFiltered) {
        // For client-side filtering, we need to adjust pagination
        // Note: This is a simplified approach - in production you'd want to fetch more pages
        // and apply filtering across all results for accurate pagination
        console.log(`✅ Returned ${transformedVehicles.length} vehicles (filtered from ${originalVehicleCount}) on page ${paginationInfo.page}`);

        return {
          success: true,
          data: transformedVehicles,
          meta: {
            totalRecords: transformedVehicles.length, // This is not entirely accurate but functional
            totalPages: Math.ceil(transformedVehicles.length / paginationInfo.per_page) || 1,
            currentPage: paginationInfo.page,
            pageSize: paginationInfo.per_page,
            hasNextPage: false, // Simplified for client-side filtering
            hasPreviousPage: paginationInfo.page > 1
          }
        };
      } else {
        console.log(`✅ Returned ${transformedVehicles.length} vehicles from ${paginationInfo.total} total (page ${paginationInfo.page}/${paginationInfo.total_pages})`);

        return {
          success: true,
          data: transformedVehicles,
          meta: {
            totalRecords: paginationInfo.total,
            totalPages: paginationInfo.total_pages,
            currentPage: paginationInfo.page,
            pageSize: paginationInfo.per_page,
            hasNextPage: paginationInfo.page < paginationInfo.total_pages,
            hasPreviousPage: paginationInfo.page > 1
          }
        };
      }
      
    } catch (error) {
      console.error("❌ Error fetching vehicles from custom API:", error);
      throw error;
    }
  }

  async getFilterOptions(filters: SimpleVehicleFilters = {}) {
    try {
      // Build URL with applied filters for conditional filtering using CLEAN field names
      const url = new URL(FILTERS_ENDPOINT);

      // Add all applied filter parameters to get conditional filter options
      if (filters.make && filters.make.length > 0) {
        url.searchParams.set('make', filters.make.join(','));
      }
      if (filters.model && filters.model.length > 0) {
        url.searchParams.set('model', filters.model.join(','));
      }
      if (filters.trim && filters.trim.length > 0) {
        url.searchParams.set('trim', filters.trim.join(','));
      }
      if (filters.condition && filters.condition.length > 0) {
        url.searchParams.set('condition', filters.condition.join(','));
      }
      if (filters.vehicleType && filters.vehicleType.length > 0) {
        url.searchParams.set('body_style', filters.vehicleType.join(','));
      }
      if (filters.driveType && filters.driveType.length > 0) {
        url.searchParams.set('drivetrain', filters.driveType.join(','));
      }
      if (filters.transmission && filters.transmission.length > 0) {
        url.searchParams.set('transmission', filters.transmission.join(','));
      }
      if (filters.exteriorColor && filters.exteriorColor.length > 0) {
        url.searchParams.set('exterior_color', filters.exteriorColor.join(','));
      }
      if (filters.interiorColor && filters.interiorColor.length > 0) {
        url.searchParams.set('interior_color', filters.interiorColor.join(','));
      }
      if (filters.sellerType && filters.sellerType.length > 0) {
        url.searchParams.set('seller_type', filters.sellerType.join(','));
      }
      if (filters.dealer && filters.dealer.length > 0) {
        url.searchParams.set('dealer_name', filters.dealer.join(','));
      }
      if (filters.city && filters.city.length > 0) {
        url.searchParams.set('city_seller', filters.city.join(','));
      }
      if (filters.state && filters.state.length > 0) {
        url.searchParams.set('state_seller', filters.state.join(','));
      }
      if (filters.mileage) {
        url.searchParams.set('mileage_range', filters.mileage);
      }
      if (filters.min_mileage) {
        url.searchParams.set('min_mileage', filters.min_mileage);
      }
      if (filters.max_mileage) {
        url.searchParams.set('max_mileage', filters.max_mileage);
      }
      if (filters.search) {
        url.searchParams.set('search', filters.search);
      }

      console.log("🎛 Fetching conditional filters with clean field names:", url.toString());
      console.log("�� DEBUG: Applied filters for conditional filtering:", filters);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Filters API responded with status: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("📦 Conditional Filters API Response:", {
        hasSuccess: 'success' in apiResponse,
        hasFilters: 'filters' in apiResponse,
        cached: apiResponse.cached || false,
        appliedFilters: Object.keys(filters).length,
        isConditional: Object.keys(filters).length > 0,
        hasRanges: !!(apiResponse.filters?.price_range || apiResponse.filters?.year_range || apiResponse.filters?.mileage_range)
      });

      if (!apiResponse.success || !apiResponse.filters) {
        throw new Error("Filters API did not return expected format");
      }

      // Use pre-computed filters from API (cached for performance)
      const filtersData = apiResponse.filters;

      // Extract range data from the new API response format
      const priceRange = filtersData.price_range || { min: 0, max: 100000 };
      const yearRange = filtersData.year_range || { min: 2000, max: 2025 };
      const mileageRange = filtersData.mileage_range || { min: 0, max: 200000 };

      console.log("📊 Range filters from WordPress API:", {
        priceRange,
        yearRange,
        mileageRange
      });

      // Helper function to sort filter options alphabetically
      const sortFilterOptions = (options: any[]) => {
        if (!Array.isArray(options)) return [];
        return options.sort((a, b) => {
          const nameA = (a.name || a).toString().toLowerCase();
          const nameB = (b.name || b).toString().toLowerCase();
          return nameA.localeCompare(nameB);
        });
      };

      return {
        success: true,
        data: {
          // Standard filter options - ALL SORTED ALPHABETICALLY
          makes: sortFilterOptions(filtersData.make || []),
          models: sortFilterOptions(filtersData.model || []),
          trims: sortFilterOptions(filtersData.trim || []),
          conditions: sortFilterOptions(filtersData.condition || []),
          driveTypes: sortFilterOptions(filtersData.drivetrain || []),
          sellerTypes: sortFilterOptions(filtersData.seller_type || []),
          vehicleTypes: sortFilterOptions(filtersData.body_style || []), // Using correct field mapping
          fuelTypes: sortFilterOptions(filtersData.fuel_type || []),
          transmissions: sortFilterOptions(filtersData.transmission || []),
          exteriorColors: sortFilterOptions(filtersData.exterior_color || []),
          interiorColors: sortFilterOptions(filtersData.interior_color || []),
          years: sortFilterOptions(filtersData.year || []),

          // Location and dealer filters with correct field mapping
          dealers: sortFilterOptions(filtersData.dealer_name || filtersData.account_name_seller || []),
          cities: sortFilterOptions(filtersData.city_seller || []),
          states: sortFilterOptions(filtersData.state_seller || []),

          // Range filters - now properly extracted from WordPress API
          priceRange,
          mileageRange,
          yearRange,

          // Additional metadata
          totalVehicles: filtersData.total_vehicles || 0
        }
      };
      
    } catch (error) {
      console.error("❌ Error fetching filter options:", error);
      return {
        success: false,
        data: {
          makes: [],
          models: [],
          trims: [],
          conditions: [],
          driveTypes: [],
          sellerTypes: [],
          vehicleTypes: [], // Updated field name
          fuelTypes: [],
          transmissions: [],
          exteriorColors: [],
          interiorColors: [],
          years: [],
          dealers: [], // Added missing fields
          cities: [],
          states: [],
          priceRange: { min: 0, max: 100000 },
          mileageRange: { min: 0, max: 200000 },
          yearRange: { min: 2000, max: 2025 },
          totalVehicles: 0
        }
      };
    }
  }

  async getVehicleById(id: number) {
    try {
      // For individual vehicle, we'll search through a small page of vehicles
      // In production, you might want a dedicated /vehicles/{id} endpoint
      const url = `${VEHICLES_ENDPOINT}?per_page=100&page=1`;
      const response = await fetch(url);
      const apiResponse = await response.json();

      if (apiResponse.success && Array.isArray(apiResponse.data)) {
        return apiResponse.data.find(v => v.id === id);
      }
      return null;
    } catch (error) {
      console.error("❌ Error fetching vehicle by ID:", error);
      return null;
    }
  }

  async getDealers() {
    try {
      // Use filters endpoint to get dealer information with clean field name
      const response = await fetch(FILTERS_ENDPOINT);
      const apiResponse = await response.json();

      if (apiResponse.success && apiResponse.filters) {
        const dealers = apiResponse.filters.dealer_name || apiResponse.filters.account_name_seller || [];
        return {
          success: true,
          data: dealers
        };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error("❌ Error fetching dealers:", error);
      return { success: true, data: [] };
    }
  }

  async getVehicleTypeCounts() {
    try {
      // Use filters endpoint to get body style information with clean field name
      const response = await fetch(FILTERS_ENDPOINT);
      const apiResponse = await response.json();

      if (apiResponse.success && apiResponse.filters) {
        const vehicleTypes = apiResponse.filters.body_style || [];
        return {
          success: true,
          data: vehicleTypes
        };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error("❌ Error fetching vehicle types:", error);
      return { success: true, data: [] };
    }
  }
}
