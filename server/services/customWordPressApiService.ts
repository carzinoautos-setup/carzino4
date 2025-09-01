import {
  SimplePaginationParams,
  SimpleVehicleFilters,
} from "../types/simpleVehicle.js";

const WP_API_URL = "https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1/vehicles";

export class CustomWordPressApiService {
  
  async getVehicles(pagination: SimplePaginationParams, filters: SimpleVehicleFilters = {}, sortBy: string = "relevance") {
    try {
      console.log("🔗 Fetching from custom WordPress API:", WP_API_URL);
      
      const response = await fetch(WP_API_URL);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      console.log("📦 API Response structure:", {
        hasSuccess: 'success' in apiResponse,
        hasData: 'data' in apiResponse,
        dataType: Array.isArray(apiResponse.data) ? 'array' : typeof apiResponse.data,
        dataLength: Array.isArray(apiResponse.data) ? apiResponse.data.length : 'N/A'
      });
      
      // Extract vehicles array from API response
      const allVehicles = apiResponse.success ? apiResponse.data : apiResponse;
      
      if (!Array.isArray(allVehicles)) {
        throw new Error("API did not return an array of vehicles");
      }
      
      // Apply basic pagination
      const startIndex = (pagination.page - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedVehicles = allVehicles.slice(startIndex, endIndex);
      
      // Transform vehicles to expected format
      const transformedVehicles = paginatedVehicles.map(vehicle => ({
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
      
      const totalRecords = allVehicles.length;
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);
      
      console.log(`✅ Returned ${transformedVehicles.length} vehicles from ${totalRecords} total`);
      
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
      console.error("❌ Error fetching vehicles from custom API:", error);
      throw error;
    }
  }

  async getFilterOptions(filters: SimpleVehicleFilters = {}) {
    try {
      const response = await fetch(WP_API_URL);
      const apiResponse = await response.json();
      const allVehicles = apiResponse.success ? apiResponse.data : apiResponse;
      
      if (!Array.isArray(allVehicles)) {
        throw new Error("API did not return an array for filter options");
      }
      
      // Extract unique filter values
      const makes = [...new Set(allVehicles.map(v => v.acf?.make).filter(Boolean))]
        .map(make => ({ name: make, count: allVehicles.filter(v => v.acf?.make === make).length }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      const models = [...new Set(allVehicles.map(v => v.acf?.model).filter(Boolean))]
        .map(model => ({ name: model, count: allVehicles.filter(v => v.acf?.model === model).length }))
        .sort((a, b) => a.name.localeCompare(b.name));
        
      const conditions = [...new Set(allVehicles.map(v => v.acf?.condition).filter(Boolean))]
        .map(condition => ({ name: condition, count: allVehicles.filter(v => v.acf?.condition === condition).length }));
        
      const driveTypes = [...new Set(allVehicles.map(v => v.acf?.drivetrain).filter(Boolean))]
        .map(drive => ({ name: drive, count: allVehicles.filter(v => v.acf?.drivetrain === drive).length }));
      
      return {
        success: true,
        data: {
          makes,
          models,
          trims: [],
          conditions,
          driveTypes,
          sellerTypes: [{ name: "Dealer", count: allVehicles.length }]
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
      const response = await fetch(WP_API_URL);
      const apiResponse = await response.json();
      const allVehicles = apiResponse.success ? apiResponse.data : apiResponse;
      
      return allVehicles.find(v => v.id === id);
    } catch (error) {
      console.error("❌ Error fetching vehicle by ID:", error);
      return null;
    }
  }

  async getDealers() {
    try {
      const response = await fetch(WP_API_URL);
      const apiResponse = await response.json();
      const allVehicles = apiResponse.success ? apiResponse.data : apiResponse;
      
      const dealers = [...new Set(allVehicles.map(v => v.acf?.account_name_seller).filter(Boolean))]
        .map(dealer => ({ name: dealer, count: allVehicles.filter(v => v.acf?.account_name_seller === dealer).length }));
      
      return {
        success: true,
        data: dealers
      };
    } catch (error) {
      console.error("❌ Error fetching dealers:", error);
      return { success: true, data: [] };
    }
  }

  async getVehicleTypeCounts() {
    try {
      const response = await fetch(WP_API_URL);
      const apiResponse = await response.json();
      const allVehicles = apiResponse.success ? apiResponse.data : apiResponse;
      
      const vehicleTypes = [...new Set(allVehicles.map(v => v.acf?.body_type).filter(Boolean))]
        .map(type => ({ name: type, count: allVehicles.filter(v => v.acf?.body_type === type).length }));
      
      return {
        success: true,
        data: vehicleTypes
      };
    } catch (error) {
      console.error("❌ Error fetching vehicle types:", error);
      return { success: true, data: [] };
    }
  }
}
