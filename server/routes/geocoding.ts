import { RequestHandler } from "express";

// Fallback ZIP code coordinates (used when Google Maps API fails)
const FALLBACK_ZIP_COORDINATES: {
  [key: string]: { lat: number; lng: number; city: string; state: string };
} = {
  "98498": { lat: 47.0379, lng: -122.9015, city: "Lakewood", state: "WA" },
  "90210": { lat: 34.0901, lng: -118.4065, city: "Beverly Hills", state: "CA" },
  "10001": { lat: 40.7505, lng: -73.9934, city: "New York", state: "NY" },
  "60601": { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL" },
  "75001": { lat: 32.9483, lng: -96.7299, city: "Addison", state: "TX" },
  "33101": { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL" },
  "77001": { lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
  "85001": { lat: 33.4484, lng: -112.074, city: "Phoenix", state: "AZ" },
  "80201": { lat: 39.7392, lng: -104.9903, city: "Denver", state: "CO" },
  "97201": { lat: 45.5152, lng: -122.6784, city: "Portland", state: "OR" },
  "30301": { lat: 33.749, lng: -84.388, city: "Atlanta", state: "GA" },
  "02101": { lat: 42.3601, lng: -71.0589, city: "Boston", state: "MA" },
  "19101": { lat: 39.9526, lng: -75.1652, city: "Philadelphia", state: "PA" },
  "63101": { lat: 38.627, lng: -90.1994, city: "St. Louis", state: "MO" },
  "55401": { lat: 44.9778, lng: -93.265, city: "Minneapolis", state: "MN" },
};

// In-memory cache for geocoded results (with TTL)
interface CachedResult {
  data: { lat: number; lng: number; city: string; state: string };
  timestamp: number;
  source: "google" | "fallback";
}

const geocodeCache = new Map<string, CachedResult>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Geocode ZIP using Google Maps API
 */
async function geocodeWithGoogle(
  zip: string,
): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn(
      "🚨 GOOGLE_MAPS_API_KEY not found, using fallback coordinates",
    );
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `❌ Google Maps API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn(
        `❌ Google Maps API: ${data.status} - ${data.error_message || "No results found"}`,
      );
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract city and state from address components
    let city = "";
    let state = "";

    for (const component of result.address_components) {
      if (component.types.includes("locality")) {
        city = component.long_name;
      } else if (component.types.includes("administrative_area_level_1")) {
        state = component.short_name;
      }
    }

    const geocodedResult = {
      lat: location.lat,
      lng: location.lng,
      city: city || "Unknown",
      state: state || "Unknown",
    };

    console.log(`✅ Google Maps geocoded ${zip} to ${city}, ${state}`);
    return geocodedResult;
  } catch (error) {
    console.error("❌ Google Maps API network error:", error);
    return null;
  }
}

/**
 * Get cached or fresh geocoded result
 */
async function getCachedOrFreshGeocode(
  zip: string,
): Promise<{
  lat: number;
  lng: number;
  city: string;
  state: string;
  source: string;
} | null> {
  // Check cache first
  const cached = geocodeCache.get(zip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📋 Using cached result for ${zip} (${cached.source})`);
    return { ...cached.data, source: cached.source };
  }

  // Try Google Maps API first
  const googleResult = await geocodeWithGoogle(zip);
  if (googleResult) {
    // Cache the Google result
    geocodeCache.set(zip, {
      data: googleResult,
      timestamp: Date.now(),
      source: "google",
    });
    return { ...googleResult, source: "google" };
  }

  // Fall back to hardcoded coordinates
  const fallbackResult = FALLBACK_ZIP_COORDINATES[zip];
  if (fallbackResult) {
    console.warn(`🆘 Using fallback coordinates for ${zip}`);
    // Cache the fallback result (shorter TTL)
    geocodeCache.set(zip, {
      data: fallbackResult,
      timestamp: Date.now() - CACHE_TTL * 0.8, // Shorter cache time for fallbacks
      source: "fallback",
    });
    return { ...fallbackResult, source: "fallback" };
  }

  return null;
}

/**
 * GET /api/geocode/:zip
 * Convert ZIP code to coordinates using Google Maps API
 */
export const geocodeZip: RequestHandler = async (req, res) => {
  try {
    const zip = req.params.zip;

    // Validate ZIP code format
    if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid ZIP code format. Use 5 digits (e.g., 98498) or 9 digits (e.g., 98498-1234)",
      });
    }

    // Use only 5-digit ZIP
    const zipCode = zip.substring(0, 5);
    const result = await getCachedOrFreshGeocode(zipCode);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `ZIP code ${zipCode} not found. Please verify the ZIP code is valid.`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        lat: result.lat,
        lng: result.lng,
        city: result.city,
        state: result.state,
      },
      meta: {
        source: result.source,
        cached: geocodeCache.has(zipCode),
      },
    });
  } catch (error) {
    console.error("Error in geocodeZip route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while geocoding ZIP code",
    });
  }
};

/**
 * POST /api/geocode/batch
 * Geocode multiple ZIP codes at once using Google Maps API
 */
export const geocodeBatch: RequestHandler = async (req, res) => {
  try {
    const { zips } = req.body;

    if (!Array.isArray(zips) || zips.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Request body must contain 'zips' array with at least one ZIP code",
      });
    }

    if (zips.length > 50) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum 50 ZIP codes allowed per batch request (Google Maps API limit)",
      });
    }

    const results = [];

    // Process sequentially to avoid hitting Google Maps API rate limits
    for (const zip of zips) {
      if (!/^\d{5}(-\d{4})?$/.test(zip)) {
        results.push({
          zip,
          success: false,
          error: "Invalid ZIP code format",
        });
        continue;
      }

      const zipCode = zip.substring(0, 5);
      const result = await getCachedOrFreshGeocode(zipCode);

      results.push({
        zip,
        success: !!result,
        data: result
          ? {
              lat: result.lat,
              lng: result.lng,
              city: result.city,
              state: result.state,
            }
          : undefined,
        source: result?.source,
        error: result ? undefined : "ZIP code not found",
      });

      // Small delay to avoid hitting rate limits
      if (result?.source === "google") {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      meta: {
        totalProcessed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    console.error("Error in geocodeBatch route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while batch geocoding",
    });
  }
};

/**
 * GET /api/geocode/health
 * Geocoding service health check
 */
export const geocodingHealthCheck: RequestHandler = async (req, res) => {
  try {
    const hasApiKey = !!process.env.GOOGLE_MAPS_API_KEY;

    // Test with a known ZIP code
    const testResult = await getCachedOrFreshGeocode("98498");

    res.status(200).json({
      success: true,
      message: "Geocoding service healthy",
      timestamp: new Date().toISOString(),
      googleMapsApiEnabled: hasApiKey,
      testZip: "98498",
      testResult: testResult
        ? {
            lat: testResult.lat,
            lng: testResult.lng,
            city: testResult.city,
            state: testResult.state,
            source: testResult.source,
          }
        : null,
      fallbackZips: Object.keys(FALLBACK_ZIP_COORDINATES).length,
      cacheSize: geocodeCache.size,
      capabilities: hasApiKey
        ? "Google Maps API + Fallback coordinates + Caching"
        : "Fallback coordinates only + Caching",
    });
  } catch (error) {
    console.error("Geocoding service health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Geocoding service health check failed",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * GET /api/geocode/cache/stats
 * Get geocoding cache statistics
 */
export const getCacheStats: RequestHandler = async (req, res) => {
  try {
    const stats = {
      totalCached: geocodeCache.size,
      entries: Array.from(geocodeCache.entries()).map(([zip, data]) => ({
        zip,
        city: data.data.city,
        state: data.data.state,
        source: data.source,
        cachedAt: new Date(data.timestamp).toISOString(),
        age: Date.now() - data.timestamp,
        expired: Date.now() - data.timestamp > CACHE_TTL,
      })),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while getting cache stats",
    });
  }
};

/**
 * DELETE /api/geocode/cache
 * Clear geocoding cache
 */
export const clearGeocodingCache: RequestHandler = async (req, res) => {
  try {
    const previousSize = geocodeCache.size;
    geocodeCache.clear();

    res.status(200).json({
      success: true,
      message: `Geocoding cache cleared. Removed ${previousSize} entries.`,
      previousSize,
      currentSize: geocodeCache.size,
    });
  } catch (error) {
    console.error("Error clearing geocoding cache:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while clearing cache",
    });
  }
};
