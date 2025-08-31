import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import {
  getVehicles,
  getVehicleById,
  getFilterOptions,
  healthCheck,
} from "./routes/vehicles.js";
import {
  getSimpleVehicles,
  getSimpleVehicleById,
  getSimpleFilterOptions,
  getCombinedVehicleData,
  getDealers,
  getVehicleTypes,
  simpleHealthCheck,
  testWooCommerceApi,
} from "./routes/simpleVehicles.js";
import {
  geocodeZip,
  geocodeBatch,
  geocodingHealthCheck,
  getCacheStats,
  clearGeocodingCache,
} from "./routes/geocoding.js";
import {
  createDatabaseConnection,
  testDatabaseConnection,
} from "./db/connection.js";
import { testWordPressConnection } from "./routes/testConnection.js";
import {
  calculatePayment,
  calculateBulkPayments,
  calculateAffordablePrice,
  getCacheStats,
  clearCache,
} from "./routes/payments.js";
// Defer WordPress sync import to runtime to avoid DB init when not configured

// Track WordPress sync status
const syncStatus = {
  lastAttempt: null as string | null,
  lastSuccess: null as string | null,
  lastError: null as string | null,
};

const dbConfigured = !!(
  process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER
);

export function createServer() {
  const app = express();

  // Initialize database connection if configured
  if (dbConfigured) {
    try {
      createDatabaseConnection();
      console.log("🔌 Database connection pool initialized");
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
    }
  } else {
    console.log(
      "ℹ️ Skipping database initialization (DB_HOST/DB_NAME/DB_USER not set)"
    );
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/health", healthCheck);

  // Vehicle API routes (complex schema)
  app.get("/api/vehicles", getVehicles);
  app.get("/api/vehicles/filters", getFilterOptions);
  app.get("/api/vehicles/:id", getVehicleById);

  // Simple Vehicle API routes (original demo format)
  app.get("/api/simple-vehicles", getSimpleVehicles);
  app.get("/api/simple-vehicles/filters", getSimpleFilterOptions);
  app.get("/api/simple-vehicles/combined", getCombinedVehicleData); // PERFORMANCE: 3-in-1 endpoint
  app.get("/api/simple-vehicles/:id", getSimpleVehicleById);
  app.get("/api/dealers", getDealers);
  app.get("/api/vehicle-types", getVehicleTypes);
  app.get("/api/simple-health", simpleHealthCheck);
  app.get("/api/test-woocommerce", testWooCommerceApi);
  app.get("/api/test-connection", testWordPressConnection);

  // Payment calculation routes
  app.post("/api/payments/calculate", calculatePayment);
  app.post("/api/payments/bulk", calculateBulkPayments);
  app.post("/api/payments/affordable-price", calculateAffordablePrice);
  app.get("/api/payments/cache-stats", getCacheStats);
  app.delete("/api/payments/cache", clearCache);

  // Geocoding API routes
  app.get("/api/geocode/health", geocodingHealthCheck);
  app.get("/api/geocode/cache/stats", getCacheStats);
  app.delete("/api/geocode/cache", clearGeocodingCache);
  app.get("/api/geocode/:zip", geocodeZip);
  app.post("/api/geocode/batch", geocodeBatch);

  // WordPress sync status endpoint
  app.get("/api/wordpress/sync-status", (_req, res) => {
    res.json({
      status: "active",
      message: "WordPress sync is running automatically every hour",
      nextSync: "Every hour on the hour",
      lastSyncAttempt: syncStatus.lastAttempt,
      lastSyncSuccess: syncStatus.lastSuccess,
      lastSyncError: syncStatus.lastError,
    });
  });

  // Example API routes (keep for backward compatibility)
  app.get("/api/demo", handleDemo);

  // Test database connection on startup (when configured)
  if (dbConfigured) {
    testDatabaseConnection().catch((error) => {
      console.error(
        "⚠️  Database connection test failed during startup:",
        error,
      );
    });
  }

  // Initialize WordPress sync system (when DB configured)
  setupWordPressSync();

  return app;
}

/**
 * Set up automated WordPress synchronization
 * Runs initial sync check and sets up periodic sync
 */
async function setupWordPressSync() {
  try {
    if (!dbConfigured) {
      console.log(
        "ℹ️ Skipping WordPress sync initialization (database not configured)",
      );
      return;
    }

    console.log("🔄 Initializing WordPress sync system...");

    const { default: WordPressSync } = await import(
      "./scripts/syncWordPressUpdates.js"
    );
    const sync = new WordPressSync();

    // Run initial sync check (only if needed)
    setTimeout(async () => {
      try {
        syncStatus.lastAttempt = new Date().toISOString();
        console.log("🔍 Running initial WordPress sync check...");
        await sync.runSync();
        syncStatus.lastSuccess = new Date().toISOString();
        console.log("✅ Initial WordPress sync completed");
      } catch (error) {
        syncStatus.lastError = error.message;
        console.error(
          "⚠️  Initial WordPress sync failed (this is normal if WordPress isn't connected):",
          error.message,
        );
      }
    }, 5000); // Wait 5 seconds after server start

    // Set up automatic sync every hour
    setInterval(
      async () => {
        try {
          syncStatus.lastAttempt = new Date().toISOString();
          console.log("🔄 Running scheduled WordPress sync...");
          const startTime = Date.now();
          await sync.runSync();
          const duration = Date.now() - startTime;
          syncStatus.lastSuccess = new Date().toISOString();
          console.log(`✅ Scheduled WordPress sync completed in ${duration}ms`);
        } catch (error) {
          syncStatus.lastError = error.message;
          console.error("❌ Scheduled WordPress sync failed:", error.message);
        }
      },
      60 * 60 * 1000,
    ); // Every 60 minutes

    console.log("✅ WordPress sync system initialized - will sync every hour");
  } catch (error) {
    console.error("❌ Failed to initialize WordPress sync system:", error);
  }
}
