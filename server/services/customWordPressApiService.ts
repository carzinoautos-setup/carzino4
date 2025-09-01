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

      // Add all filter parameters
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
        url.searchParams.set('body_type', filters.vehicleType.join(','));
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
      if (filters.sellerType && filters.sellerType.length > 0) {
        url.searchParams.set('account_type_seller', filters.sellerType.join(','));
      }
      if (filters.dealer && filters.dealer.length > 0) {
        url.searchParams.set('account_name_seller', filters.dealer.join(','));
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
      if (filters.priceMin) {
        url.searchParams.set('price_min', filters.priceMin);
      }
      if (filters.priceMax) {
        url.searchParams.set('price_max', filters.priceMax);
      }
      if (filters.search) {
        url.searchParams.set('search', filters.search);
      }
      if (sortBy && sortBy !== 'relevance') {
        url.searchParams.set('orderby', sortBy);
      }

      console.log("🔗 Fetching from new vehicles API:", url.toString());
      console.log("🔍 DEBUG: Filters being sent to WordPress:", filters);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("📦 New API Response structure:", {
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

      // Use vehicles directly from API (already paginated)
      const vehicles = apiResponse.data;

      // Transform vehicles to expected format using new ACF structure
      const transformedVehicles = vehicles.map(vehicle => ({
        id: vehicle.id,
        featured: vehicle.acf?.is_featured || false,
        viewed: false,
        images: vehicle.images?.slice(0, 3).map(img => img.src) || [vehicle.featured_image],
        badges: [
          vehicle.acf?.condition || "Used",
          vehicle.acf?.drivetrain?.includes("4") ? "4WD" : "",
          vehicle.acf?.is_featured ? "Featured!" : ""
        ].filter(Boolean),
        title: vehicle.name || `${vehicle.acf?.year} ${vehicle.acf?.make} ${vehicle.acf?.model}`.trim(),
        mileage: vehicle.acf?.mileage ? `${parseInt(vehicle.acf.mileage).toLocaleString()}` : "0",
        transmission: vehicle.acf?.transmission || "Auto",
        doors: vehicle.acf?.doors ? `${vehicle.acf.doors} doors` : "4 doors",
        salePrice: vehicle.price ? `$${parseInt(vehicle.price).toLocaleString()}` : null,
        payment: vehicle.price ? `$${Math.round(parseInt(vehicle.price) / 60)}/mo*` : null,
        dealer: vehicle.acf?.account_name_seller || "Carzino Dealer",
        location: `${vehicle.acf?.city_seller || "Local"}, ${vehicle.acf?.state_seller || "State"}`,
        phone: vehicle.acf?.phone_number_seller || "Contact Dealer",
        seller_type: vehicle.acf?.account_type_seller || "Dealer"
      }));

      // Use pagination info from API response
      const paginationInfo = apiResponse.pagination;

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
      
    } catch (error) {
      console.error("❌ Error fetching vehicles from custom API:", error);
      throw error;
    }
  }

  async getFilterOptions(filters: SimpleVehicleFilters = {}) {
    try {
      console.log("🎛 Fetching from new filters API:", FILTERS_ENDPOINT);

      const response = await fetch(FILTERS_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Filters API responded with status: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("📦 Filters API Response:", {
        hasSuccess: 'success' in apiResponse,
        hasFilters: 'filters' in apiResponse,
        cached: apiResponse.cached || false
      });

      if (!apiResponse.success || !apiResponse.filters) {
        throw new Error("Filters API did not return expected format");
      }

      // Use pre-computed filters from API (cached for performance)
      const filtersData = apiResponse.filters;

      return {
        success: true,
        data: {
          makes: filtersData.make || [],
          models: filtersData.model || [],
          trims: filtersData.trim || [],
          conditions: filtersData.condition || [],
          driveTypes: filtersData.drivetrain || [],
          sellerTypes: filtersData.account_type_seller || [],
          bodyStyles: filtersData.body_style || [],
          fuelTypes: filtersData.fuel_type || [],
          transmissions: filtersData.transmission || [],
          years: filtersData.year || [],
          priceRange: filtersData.price_range || { min: 0, max: 100000 },
          mileageRange: filtersData.mileage_range || { min: 0, max: 200000 },
          yearRange: filtersData.year_range || { min: 2000, max: 2025 }
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
          sellerTypes: []
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
      // Use filters endpoint to get dealer information
      const response = await fetch(FILTERS_ENDPOINT);
      const apiResponse = await response.json();

      if (apiResponse.success && apiResponse.filters) {
        const dealers = apiResponse.filters.account_name_seller || [];
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
      // Use filters endpoint to get body style information
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
