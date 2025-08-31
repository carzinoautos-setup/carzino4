import { RequestHandler } from "express";
import { getDatabase } from "../db/connection.js";

/**
 * Simple test to check WordPress connection and basic data
 */
export const testWordPressConnection: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    console.log("🔍 Testing basic database connection...");
    
    // Test 1: Simple connection test
    const [connectionTest] = await db.execute("SELECT 1 as test");
    console.log("✅ Basic connection successful");
    
    // Test 2: Check if wp_posts table exists
    try {
      const [tableCheck] = await db.execute(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = 'wp_posts'
      `, [process.env.DB_NAME]);
      
      const hasWpPosts = (tableCheck as any)[0]?.count > 0;
      console.log(`📋 wp_posts table exists: ${hasWpPosts}`);
      
      if (!hasWpPosts) {
        return res.status(200).json({
          success: true,
          message: "Database connected but no WordPress tables found",
          data: {
            connectionTest: "✅ Connected",
            wpTablesFound: false,
            suggestion: "This appears to be an empty database or not a WordPress database"
          }
        });
      }
    } catch (error) {
      console.log("⚠️ Could not check table structure:", error.message);
    }
    
    // Test 3: Simple posts count
    try {
      const [postsCount] = await db.execute("SELECT COUNT(*) as total FROM wp_posts LIMIT 1");
      console.log(`📊 Total posts: ${(postsCount as any)[0]?.total || 0}`);
      
      // Test 4: Products count 
      const [productsCount] = await db.execute(`
        SELECT COUNT(*) as total FROM wp_posts 
        WHERE post_type = 'product' LIMIT 1
      `);
      console.log(`🛍️ Total products: ${(productsCount as any)[0]?.total || 0}`);
      
      return res.status(200).json({
        success: true,
        message: "WordPress database connection successful",
        data: {
          connectionTest: "✅ Connected",
          wpTablesFound: true,
          totalPosts: (postsCount as any)[0]?.total || 0,
          totalProducts: (productsCount as any)[0]?.total || 0,
          databaseName: process.env.DB_NAME,
          host: process.env.DB_HOST
        }
      });
      
    } catch (error) {
      console.log("⚠️ Could not query posts:", error.message);
      return res.status(200).json({
        success: true,
        message: "Connected but could not query WordPress data",
        data: {
          connectionTest: "✅ Connected",
          wpTablesFound: true,
          error: error.message
        }
      });
    }
    
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
    });
  }
};
