import { getDatabase } from "../db/connection";
import {
  VehicleWithLocation,
  LocationFilters,
  SellerRecord,
} from "../types/seller";
import { VehicleFiltersWithLocation } from "../types/seller";

export class LocationService {
  private db = getDatabase();

  /**
   * Haversine distance calculation in SQL for maximum performance
   * Much faster than PHP WordPress calculations
   */
  private getDistanceSQL(lat: number, lng: number): string {
    return `
      (3959 * acos(
        cos(radians(${lat})) * 
        cos(radians(seller_latitude)) * 
        cos(radians(seller_longitude) - radians(${lng})) + 
        sin(radians(${lat})) * 
        sin(radians(seller_latitude))
      ))
    `;
  }

  /**
   * Get vehicles within radius - MUCH faster than WordPress approach
   * Uses spatial bounding box + Haversine for optimal performance
   */
  async getVehiclesWithinRadius(
    location: LocationFilters,
    filters: VehicleFiltersWithLocation = {},
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ vehicles: VehicleWithLocation[]; total: number }> {
    // Pre-filter with bounding box for performance (avoids calculating distance for every row)
    const latDelta = location.radius / 69; // Approximate miles per degree of latitude
    const lngDelta =
      location.radius / (69 * Math.cos((location.lat * Math.PI) / 180));

    const minLat = location.lat - latDelta;
    const maxLat = location.lat + latDelta;
    const minLng = location.lng - lngDelta;
    const maxLng = location.lng + lngDelta;

    let whereConditions = [
      `seller_latitude BETWEEN ? AND ?`,
      `seller_longitude BETWEEN ? AND ?`,
    ];
    let params = [minLat, maxLat, minLng, maxLng];

    // Add other filters
    if (filters.make) {
      whereConditions.push(
        `make IN (${filters.make
          .split(",")
          .map(() => "?")
          .join(",")})`,
      );
      params.push(...filters.make.split(","));
    }

    if (filters.condition) {
      whereConditions.push(
        `condition IN (${filters.condition
          .split(",")
          .map(() => "?")
          .join(",")})`,
      );
      params.push(...filters.condition.split(","));
    }

    if (filters.minPrice) {
      whereConditions.push(`price >= ?`);
      params.push(filters.minPrice);
    }

    if (filters.maxPrice) {
      whereConditions.push(`price <= ?`);
      params.push(filters.maxPrice);
    }

    // Main query with distance calculation
    const distanceSQL = this.getDistanceSQL(location.lat, location.lng);

    const sql = `
      SELECT *,
        ${distanceSQL} AS distance_miles
      FROM vehicles 
      WHERE ${whereConditions.join(" AND ")}
        AND ${distanceSQL} <= ?
      ORDER BY distance_miles ASC
      LIMIT ? OFFSET ?
    `;

    const countSQL = `
      SELECT COUNT(*) as total
      FROM vehicles 
      WHERE ${whereConditions.join(" AND ")}
        AND ${distanceSQL} <= ?
    `;

    // Add radius and pagination params
    const queryParams = [...params, location.radius];
    const finalParams = [...queryParams, pageSize, (page - 1) * pageSize];
    const countParams = [...queryParams];

    try {
      const [vehicleRows] = await this.db.execute(sql, finalParams);
      const [countRows] = await this.db.execute(countSQL, countParams);

      const vehicles = vehicleRows as VehicleWithLocation[];
      const total = (countRows as any)[0].total;

      return { vehicles, total };
    } catch (error) {
      console.error("Error fetching vehicles with location:", error);
      throw new Error("Failed to fetch vehicles by location");
    }
  }

  /**
   * Geocode ZIP to coordinates - with caching for performance
   */
  async geocodeZip(
    zip: string,
  ): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
    // First check cache table
    try {
      const [cached] = await this.db.execute(
        "SELECT latitude, longitude, city, state FROM zip_coordinates WHERE zip = ? AND expires_at > NOW()",
        [zip],
      );

      if ((cached as any[]).length > 0) {
        const result = (cached as any)[0];
        return {
          lat: result.latitude,
          lng: result.longitude,
          city: result.city,
          state: result.state,
        };
      }
    } catch (error) {
      console.log("Cache miss for ZIP:", zip);
    }

    // If not cached, geocode and cache result
    // You can integrate with Google Maps API, OpenCage, or use a ZIP centroid database
    // For now, returning null to indicate external geocoding needed
    return null;
  }

  /**
   * Sync seller coordinates to vehicle records (denormalization for performance)
   * Run this when seller locations change
   */
  async syncSellerCoordsToVehicles(
    sellerAccountNumber?: string,
  ): Promise<void> {
    const whereClause = sellerAccountNumber ? "WHERE s.account_number = ?" : "";
    const params = sellerAccountNumber ? [sellerAccountNumber] : [];

    const sql = `
      UPDATE vehicles v
      JOIN sellers s ON v.seller_account_number = s.account_number
      SET 
        v.seller_latitude = s.latitude,
        v.seller_longitude = s.longitude,
        v.seller_name = s.name,
        v.seller_city = s.city,
        v.seller_state = s.state,
        v.seller_phone = s.phone
      ${whereClause}
    `;

    try {
      await this.db.execute(sql, params);
      console.log(
        `✅ Synced seller coordinates to vehicles${sellerAccountNumber ? ` for seller ${sellerAccountNumber}` : ""}`,
      );
    } catch (error) {
      console.error("Error syncing seller coordinates:", error);
      throw error;
    }
  }

  /**
   * Create required database indexes for optimal performance
   */
  async createOptimalIndexes(): Promise<void> {
    const indexes = [
      // Spatial index for coordinates (if MySQL 5.7+)
      `CREATE INDEX idx_seller_coords ON vehicles (seller_latitude, seller_longitude)`,

      // Composite indexes for common filter combinations
      `CREATE INDEX idx_make_condition ON vehicles (make, condition)`,
      `CREATE INDEX idx_price_range ON vehicles (price)`,
      `CREATE INDEX idx_seller_account ON vehicles (seller_account_number)`,

      // Sellers table indexes
      `CREATE INDEX idx_seller_account_number ON sellers (account_number)`,
      `CREATE INDEX idx_seller_location ON sellers (latitude, longitude)`,

      // ZIP code cache table
      `CREATE TABLE IF NOT EXISTS zip_coordinates (
        zip VARCHAR(10) PRIMARY KEY,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(2),
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL 7 DAY)
      )`,
    ];

    for (const indexSQL of indexes) {
      try {
        await this.db.execute(indexSQL);
        console.log(
          "✅ Created index/table:",
          indexSQL.substring(0, 50) + "...",
        );
      } catch (error) {
        // Index might already exist, that's okay
        console.log("ℹ️ Index/table might already exist:", error);
      }
    }
  }
}

export const locationService = new LocationService();
