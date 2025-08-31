import { RequestHandler } from "express";
import { VehicleService } from "../services/vehicleService.js";
import { MockVehicleService } from "../services/mockVehicleService.js";
import { PaginationParams, VehicleFilters } from "../types/vehicle.js";

// Temporarily using MockVehicleService due to MySQL connection issues
console.log(
  "🚀 Using MockVehicleService with 50,000 sample vehicles",
);
console.log(
  "   MySQL connection lost - switching to mock data for demo",
);

const vehicleService = new MockVehicleService();

/**
 * GET /api/vehicles
 * Fetch paginated vehicles with optional filters
 */
export const getVehicles: RequestHandler = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(
      parseInt(req.query.pageSize as string) || 20,
      100,
    ); // Max 100 per page
    const sortBy = (req.query.sortBy as string) || "id";
    const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page number must be greater than 0",
      });
    }

    if (pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        success: false,
        message: "Page size must be between 1 and 100",
      });
    }

    const pagination: PaginationParams = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    // Parse filter parameters
    const filters: VehicleFilters = {};

    if (req.query.make) filters.make = req.query.make as string;
    if (req.query.model) filters.model = req.query.model as string;
    if (req.query.year) filters.year = parseInt(req.query.year as string);
    if (req.query.minPrice)
      filters.minPrice = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice)
      filters.maxPrice = parseFloat(req.query.maxPrice as string);
    if (req.query.condition) filters.condition = req.query.condition as string;
    if (req.query.maxMileage)
      filters.maxMileage = parseInt(req.query.maxMileage as string);
    if (req.query.fuelType) filters.fuelType = req.query.fuelType as string;
    if (req.query.transmission)
      filters.transmission = req.query.transmission as string;
    if (req.query.drivetrain)
      filters.drivetrain = req.query.drivetrain as string;
    if (req.query.bodyStyle) filters.bodyStyle = req.query.bodyStyle as string;
    if (req.query.certified !== undefined) {
      filters.certified = req.query.certified === "true";
    }
    if (req.query.sellerType)
      filters.sellerType = req.query.sellerType as string;

    // Fetch vehicles from service
    const result = await vehicleService.getVehicles(filters, pagination);

    // Return response
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getVehicles route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: [],
      meta: {
        totalRecords: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  }
};

/**
 * GET /api/vehicles/:id
 * Fetch a single vehicle by ID
 */
export const getVehicleById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const vehicle = await vehicleService.getVehicleById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Error in getVehicleById route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * GET /api/vehicles/filters
 * Get available filter options
 */
export const getFilterOptions: RequestHandler = async (req, res) => {
  try {
    const options = await vehicleService.getFilterOptions();

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("Error in getFilterOptions route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: {
        makes: [],
        models: [],
        conditions: [],
        fuelTypes: [],
        transmissions: [],
        drivetrains: [],
        bodyStyles: [],
        sellerTypes: [],
      },
    });
  }
};

/**
 * GET /api/vehicles/health
 * Service health check endpoint
 */
export const healthCheck: RequestHandler = async (req, res) => {
  try {
    // Test service connectivity
    const testResult = await vehicleService.getVehicles(
      {},
      { page: 1, pageSize: 1 },
    );

    res.status(200).json({
      success: true,
      message:
        "Mock service healthy - 50,000 sample vehicles ready for testing",
      timestamp: new Date().toISOString(),
      serviceConnected: testResult.success,
      usingMockData: true,
      totalRecords: testResult.meta?.totalRecords || 0,
      note: "Switch to VehicleService in routes/vehicles.ts when ready for real MySQL",
    });
  } catch (error) {
    console.error("Service health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Mock service connection failed",
      timestamp: new Date().toISOString(),
      serviceConnected: false,
      usingMockData: true,
    });
  }
};
