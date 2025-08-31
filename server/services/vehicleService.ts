import { RowDataPacket } from "mysql2";
import { getDatabase } from "../db/connection.js";
import {
  VehicleRecord,
  PaginationParams,
  VehiclesApiResponse,
  PaginationMeta,
  VehicleFilters,
  SqlQuery,
} from "../types/vehicle.js";

export class VehicleService {
  private db = getDatabase();

  /**
   * Build SQL query with filters and pagination
   */
  private buildQuery(
    filters: VehicleFilters,
    pagination: PaginationParams,
  ): SqlQuery {
    let whereConditions: string[] = [];
    let params: any[] = [];

    // Build WHERE conditions based on filters
    if (filters.make) {
      whereConditions.push("make = ?");
      params.push(filters.make);
    }

    if (filters.model) {
      whereConditions.push("model = ?");
      params.push(filters.model);
    }

    if (filters.year) {
      whereConditions.push("year = ?");
      params.push(filters.year);
    }

    if (filters.minPrice) {
      whereConditions.push("price >= ?");
      params.push(filters.minPrice);
    }

    if (filters.maxPrice) {
      whereConditions.push("price <= ?");
      params.push(filters.maxPrice);
    }

    if (filters.condition) {
      whereConditions.push("condition = ?");
      params.push(filters.condition);
    }

    if (filters.maxMileage) {
      whereConditions.push("mileage <= ?");
      params.push(filters.maxMileage);
    }

    if (filters.fuelType) {
      whereConditions.push("fuel_type = ?");
      params.push(filters.fuelType);
    }

    if (filters.transmission) {
      whereConditions.push("transmission = ?");
      params.push(filters.transmission);
    }

    if (filters.drivetrain) {
      whereConditions.push("drivetrain = ?");
      params.push(filters.drivetrain);
    }

    if (filters.bodyStyle) {
      whereConditions.push("body_style = ?");
      params.push(filters.bodyStyle);
    }

    if (filters.certified !== undefined) {
      whereConditions.push("certified = ?");
      params.push(filters.certified);
    }

    if (filters.sellerType) {
      whereConditions.push("seller_type = ?");
      params.push(filters.sellerType);
    }

    // Base query parts
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";
    const sortBy = pagination.sortBy || "id";
    const sortOrder = pagination.sortOrder || "DESC";
    const offset = (pagination.page - 1) * pagination.pageSize;

    // Main query
    const sql = `
      SELECT * 
      FROM vehicles 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;

    // Count query for pagination
    const countSql = `
      SELECT COUNT(*) as total 
      FROM vehicles 
      ${whereClause}
    `;

    return {
      sql: sql.trim(),
      params: [...params, pagination.pageSize, offset],
      countSql: countSql.trim(),
      countParams: params,
    };
  }

  /**
   * Get vehicles with pagination and filters
   */
  async getVehicles(
    filters: VehicleFilters = {},
    pagination: PaginationParams,
  ): Promise<VehiclesApiResponse> {
    try {
      const query = this.buildQuery(filters, pagination);

      // Execute count query for pagination metadata
      const [countResult] = await this.db.execute<RowDataPacket[]>(
        query.countSql,
        query.countParams,
      );

      const totalRecords = countResult[0]?.total || 0;
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);

      // Execute main query for data
      const [rows] = await this.db.execute<RowDataPacket[]>(
        query.sql,
        query.params,
      );

      const vehicles = rows as VehicleRecord[];

      // Build pagination metadata
      const meta: PaginationMeta = {
        totalRecords,
        totalPages,
        currentPage: pagination.page,
        pageSize: pagination.pageSize,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      };

      return {
        data: vehicles,
        meta,
        success: true,
      };
    } catch (error) {
      console.error("Error fetching vehicles:", error);

      return {
        data: [],
        meta: {
          totalRecords: 0,
          totalPages: 0,
          currentPage: pagination.page,
          pageSize: pagination.pageSize,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        success: false,
        message: "Failed to fetch vehicles",
      };
    }
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: number): Promise<VehicleRecord | null> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        "SELECT * FROM vehicles WHERE id = ?",
        [id],
      );

      return rows.length > 0 ? (rows[0] as VehicleRecord) : null;
    } catch (error) {
      console.error("Error fetching vehicle by ID:", error);
      return null;
    }
  }

  /**
   * Get unique values for filter options
   */
  async getFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    conditions: string[];
    fuelTypes: string[];
    transmissions: string[];
    drivetrains: string[];
    bodyStyles: string[];
    sellerTypes: string[];
  }> {
    try {
      const [makesResult] = await this.db.execute<RowDataPacket[]>(
        "SELECT DISTINCT make FROM vehicles ORDER BY make",
      );
      const [modelsResult] = await this.db.execute<RowDataPacket[]>(
        "SELECT DISTINCT model FROM vehicles ORDER BY model",
      );
      const [conditionsResult] = await this.db.execute<RowDataPacket[]>(
        "SELECT DISTINCT condition FROM vehicles ORDER BY condition",
      );
      const [fuelTypesResult] = await this.db.execute<RowDataPacket[]>(
        "SELECT DISTINCT fuel_type FROM vehicles ORDER BY fuel_type",
      );
      const [transmissionsResult] = await this.db.execute<RowDataPacket[]>(
        "SELECT DISTINCT transmission FROM vehicles ORDER BY transmission",
      );
      const [drivetrainsResult] = await this.db.execute<RowDataPacket[]>(
        "SELECT DISTINCT drivetrain FROM vehicles ORDER BY drivetrain",
      );
      const [bodyStylesResult] = await this.db.execute<RowDataPacket[]>(
        "SELECT DISTINCT body_style FROM vehicles ORDER BY body_style",
      );
      const [sellerTypesResult] = await this.db.execute<RowDataPacket[]>(
        "SELECT DISTINCT seller_type FROM vehicles ORDER BY seller_type",
      );

      return {
        makes: makesResult.map((row) => row.make).filter(Boolean),
        models: modelsResult.map((row) => row.model).filter(Boolean),
        conditions: conditionsResult
          .map((row) => row.condition)
          .filter(Boolean),
        fuelTypes: fuelTypesResult.map((row) => row.fuel_type).filter(Boolean),
        transmissions: transmissionsResult
          .map((row) => row.transmission)
          .filter(Boolean),
        drivetrains: drivetrainsResult
          .map((row) => row.drivetrain)
          .filter(Boolean),
        bodyStyles: bodyStylesResult
          .map((row) => row.body_style)
          .filter(Boolean),
        sellerTypes: sellerTypesResult
          .map((row) => row.seller_type)
          .filter(Boolean),
      };
    } catch (error) {
      console.error("Error fetching filter options:", error);
      return {
        makes: [],
        models: [],
        conditions: [],
        fuelTypes: [],
        transmissions: [],
        drivetrains: [],
        bodyStyles: [],
        sellerTypes: [],
      };
    }
  }
}
