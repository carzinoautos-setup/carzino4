import { RequestHandler } from "express";
import { getDatabase } from "../db/connection.js";
import {
  SimplePaginationParams,
  SimpleVehicleFilters,
} from "../types/simpleVehicle.js";

// WordPress/WooCommerce Vehicle Service for live inventory
export class WordPressVehicleService {
  private db = getDatabase();

  /**
   * Fetch vehicles from WordPress/WooCommerce with filters and pagination
   */
  async getVehicles(
    pagination: SimplePaginationParams,
    filters: SimpleVehicleFilters = {},
    sortBy: string = "relevance"
  ) {
    try {
      console.log("🔍 Fetching vehicles from WordPress/WooCommerce database...");

      // Build the base query for WooCommerce products as vehicles
      let whereConditions: string[] = [
        "p.post_type = 'product'",
        "p.post_status = 'publish'"
      ];
      let params: any[] = [];

      // Add filter conditions
      if (filters.condition && filters.condition.length > 0) {
        const placeholders = filters.condition.map(() => "?").join(",");
        whereConditions.push(`EXISTS (
          SELECT 1 FROM wp_postmeta pm_condition 
          WHERE pm_condition.post_id = p.ID 
          AND pm_condition.meta_key = 'condition' 
          AND pm_condition.meta_value IN (${placeholders})
        )`);
        params.push(...filters.condition);
      }

      if (filters.make && filters.make.length > 0) {
        const placeholders = filters.make.map(() => "?").join(",");
        whereConditions.push(`EXISTS (
          SELECT 1 FROM wp_postmeta pm_make 
          WHERE pm_make.post_id = p.ID 
          AND pm_make.meta_key = 'make' 
          AND pm_make.meta_value IN (${placeholders})
        )`);
        params.push(...filters.make);
      }

      if (filters.model && filters.model.length > 0) {
        const placeholders = filters.model.map(() => "?").join(",");
        whereConditions.push(`EXISTS (
          SELECT 1 FROM wp_postmeta pm_model 
          WHERE pm_model.post_id = p.ID 
          AND pm_model.meta_key = 'model' 
          AND pm_model.meta_value IN (${placeholders})
        )`);
        params.push(...filters.model);
      }

      if (filters.priceMin) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM wp_postmeta pm_price
          WHERE pm_price.post_id = p.ID
          AND pm_price.meta_key = 'price'
          AND CAST(pm_price.meta_value AS DECIMAL(10,2)) >= ?
        )`);
        params.push(parseFloat(filters.priceMin));
      }

      if (filters.priceMax) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM wp_postmeta pm_price
          WHERE pm_price.post_id = p.ID
          AND pm_price.meta_key = 'price'
          AND CAST(pm_price.meta_value AS DECIMAL(10,2)) <= ?
        )`);
        params.push(parseFloat(filters.priceMax));
      }

      // Build ORDER BY clause
      let orderBy = "p.post_date DESC"; // Default ordering
      switch (sortBy) {
        case "price-low":
          orderBy = "CAST((SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'price' LIMIT 1) AS DECIMAL(10,2)) ASC";
          break;
        case "price-high":
          orderBy = "CAST((SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'price' LIMIT 1) AS DECIMAL(10,2)) DESC";
          break;
        case "miles-low":
          orderBy = "CAST((SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'mileage' LIMIT 1) AS UNSIGNED) ASC";
          break;
        case "miles-high":
          orderBy = "CAST((SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'mileage' LIMIT 1) AS UNSIGNED) DESC";
          break;
        case "year-newest":
          orderBy = "CAST((SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'year' LIMIT 1) AS UNSIGNED) DESC";
          break;
        case "year-oldest":
          orderBy = "CAST((SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'year' LIMIT 1) AS UNSIGNED) ASC";
          break;
      }

      // Build the complete query
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
      
      // Get total count first
      const countQuery = `
        SELECT COUNT(DISTINCT p.ID) as total
        FROM wp_posts p
        ${whereClause}
      `;

      console.log("📊 Executing count query:", countQuery.substring(0, 200) + "...");
      const [countResult] = await this.db.execute(countQuery, params);
      const totalRecords = (countResult as any)[0]?.total || 0;

      // Calculate pagination
      const offset = (pagination.page - 1) * pagination.pageSize;
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);

      // OPTIMIZED: Single JOIN with pivot instead of 16+ subqueries per row
      const dataQuery = `
        SELECT
          p.ID as id,
          p.post_title as title,
          p.post_date,
          MAX(CASE WHEN pm.meta_key = 'is_featured' THEN pm.meta_value END) as is_featured,
          MAX(CASE WHEN pm.meta_key = 'year' THEN pm.meta_value END) as year,
          MAX(CASE WHEN pm.meta_key = 'make' THEN pm.meta_value END) as make,
          MAX(CASE WHEN pm.meta_key = 'model' THEN pm.meta_value END) as model,
          MAX(CASE WHEN pm.meta_key = 'trim' THEN pm.meta_value END) as trim,
          MAX(CASE WHEN pm.meta_key = 'mileage' THEN pm.meta_value END) as mileage,
          MAX(CASE WHEN pm.meta_key = 'condition' THEN pm.meta_value END) as condition,
          MAX(CASE WHEN pm.meta_key = 'drivetrain' THEN pm.meta_value END) as drivetrain,
          MAX(CASE WHEN pm.meta_key = 'transmission' THEN pm.meta_value END) as transmission,
          MAX(CASE WHEN pm.meta_key = 'price' THEN pm.meta_value END) as price,
          MAX(CASE WHEN pm.meta_key = 'doors' THEN pm.meta_value END) as doors,
          MAX(CASE WHEN pm.meta_key = 'exterior_color' THEN pm.meta_value END) as exterior_color,
          MAX(CASE WHEN pm.meta_key = '_vehicle_seller_account' THEN pm.meta_value END) as seller_account,
          s.name as dealer_name,
          CONCAT(s.city, ', ', s.state) as location,
          s.phone as phone
        FROM wp_posts p
        LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
          AND pm.meta_key IN ('is_featured', 'year', 'make', 'model', 'trim', 'mileage',
                             'condition', 'drivetrain', 'transmission', 'price', 'doors',
                             'exterior_color', '_vehicle_seller_account')
        LEFT JOIN sellers s ON s.account_number = (
          SELECT pm2.meta_value
          FROM wp_postmeta pm2
          WHERE pm2.post_id = p.ID AND pm2.meta_key = '_vehicle_seller_account'
          LIMIT 1
        )
        ${whereClause}
        GROUP BY p.ID, p.post_title, p.post_date, s.name, s.city, s.state, s.phone
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      console.log("🚗 Executing vehicle query:", dataQuery.substring(0, 300) + "...");
      const [vehicles] = await this.db.execute(dataQuery, [...params, pagination.pageSize, offset]);

      // Transform to expected format
      const transformedVehicles = (vehicles as any[]).map((vehicle) => ({
        id: vehicle.id,
        featured: vehicle.is_featured === "yes",
        viewed: false, // This would need to be tracked separately
        images: [
          // Default vehicle images - could be enhanced to fetch actual product images
          `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop&auto=format`,
          `https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=450&h=300&fit=crop&auto=format`
        ],
        badges: [
          vehicle.condition || "Used",
          vehicle.drivetrain && vehicle.drivetrain.includes("4") ? "4WD" : "",
          vehicle.is_featured === "yes" ? "Featured!" : ""
        ].filter(Boolean),
        title: vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim(),
        mileage: vehicle.mileage ? `${parseInt(vehicle.mileage).toLocaleString()}` : "0",
        transmission: vehicle.transmission || "Auto",
        doors: vehicle.doors ? `${vehicle.doors} doors` : "4 doors",
        salePrice: vehicle.price ? `$${parseInt(vehicle.price).toLocaleString()}` : null,
        payment: vehicle.price ? `$${Math.round(parseInt(vehicle.price) / 60)}/mo*` : null,
        dealer: vehicle.dealer_name || "Carzino Dealer",
        location: vehicle.location || "Local, State",
        phone: vehicle.phone || "Contact Dealer",
        seller_type: "Dealer" // Could be enhanced based on seller data
      }));

      console.log(`✅ Found ${totalRecords} vehicles, returning ${transformedVehicles.length} for page ${pagination.page}`);

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
      console.error("❌ Error fetching vehicles from WordPress:", error);
      throw error;
    }
  }

  /**
   * Get available makes from WordPress vehicles
   */
  async getFilterOptions() {
    try {
      const [makes] = await this.db.execute(`
        SELECT DISTINCT pm.meta_value as name, COUNT(*) as count
        FROM wp_postmeta pm
        JOIN wp_posts p ON pm.post_id = p.ID
        WHERE p.post_type = 'product' 
          AND p.post_status = 'publish'
          AND pm.meta_key = 'make'
          AND pm.meta_value IS NOT NULL 
          AND pm.meta_value != ''
        GROUP BY pm.meta_value
        ORDER BY pm.meta_value
      `);

      const [models] = await this.db.execute(`
        SELECT DISTINCT pm.meta_value as name, COUNT(*) as count
        FROM wp_postmeta pm
        JOIN wp_posts p ON pm.post_id = p.ID
        WHERE p.post_type = 'product' 
          AND p.post_status = 'publish'
          AND pm.meta_key = 'model'
          AND pm.meta_value IS NOT NULL 
          AND pm.meta_value != ''
        GROUP BY pm.meta_value
        ORDER BY pm.meta_value
      `);

      return {
        success: true,
        data: {
          makes: makes as any[],
          models: models as any[]
        }
      };
    } catch (error) {
      console.error("❌ Error fetching filter options:", error);
      throw error;
    }
  }

  /**
   * Get dealers from WordPress
   */
  async getDealers() {
    try {
      const [dealers] = await this.db.execute(`
        SELECT name, COUNT(v.id) as count
        FROM sellers s
        LEFT JOIN vehicles v ON s.account_number = v.seller_account_number
        GROUP BY s.account_number, s.name
        HAVING count > 0
        ORDER BY s.name
      `);

      return {
        success: true,
        data: dealers as any[]
      };
    } catch (error) {
      console.error("❌ Error fetching dealers:", error);
      // Return empty array if sellers table doesn't exist yet
      return {
        success: true,
        data: []
      };
    }
  }

  /**
   * Get vehicle types from WordPress
   */
  async getVehicleTypeCounts() {
    try {
      const [vehicleTypes] = await this.db.execute(`
        SELECT DISTINCT pm.meta_value as name, COUNT(*) as count
        FROM wp_postmeta pm
        JOIN wp_posts p ON pm.post_id = p.ID
        WHERE p.post_type = 'product'
          AND p.post_status = 'publish'
          AND pm.meta_key = 'body_type'
          AND pm.meta_value IS NOT NULL
          AND pm.meta_value != ''
        GROUP BY pm.meta_value
        ORDER BY pm.meta_value
      `);

      return {
        success: true,
        data: vehicleTypes as any[]
      };
    } catch (error) {
      console.error("❌ Error fetching vehicle types:", error);
      // Return fallback vehicle types
      return {
        success: true,
        data: [
          { name: "Sedan", count: 0 },
          { name: "SUV", count: 0 },
          { name: "Truck", count: 0 },
          { name: "Coupe", count: 0 }
        ]
      };
    }
  }

  /**
   * Check what's actually in the WordPress database
   */
  async checkDatabaseContents() {
    try {
      // Check if we have any posts at all
      const [posts] = await this.db.execute(`
        SELECT post_type, post_status, COUNT(*) as count
        FROM wp_posts
        GROUP BY post_type, post_status
        ORDER BY count DESC
        LIMIT 10
      `);

      // Check if we have any products
      const [products] = await this.db.execute(`
        SELECT COUNT(*) as total
        FROM wp_posts
        WHERE post_type = 'product' AND post_status = 'publish'
      `);

      // Check meta keys available
      const [metaKeys] = await this.db.execute(`
        SELECT DISTINCT pm.meta_key, COUNT(*) as count
        FROM wp_postmeta pm
        JOIN wp_posts p ON pm.post_id = p.ID
        WHERE p.post_type = 'product' AND p.post_status = 'publish'
        GROUP BY pm.meta_key
        ORDER BY count DESC
        LIMIT 20
      `);

      console.log("📊 WordPress Database Contents:");
      console.log("Posts by type:", posts);
      console.log("Published products:", (products as any)[0]?.total || 0);
      console.log("Available meta keys:", metaKeys);

      return {
        posts: posts as any[],
        totalProducts: (products as any)[0]?.total || 0,
        metaKeys: metaKeys as any[]
      };
    } catch (error) {
      console.error("❌ Error checking database contents:", error);
      return null;
    }
  }
}
