import { RequestHandler } from "express";

const WP_BASE_URL = "https://env-uploadbackup62225-czdev.kinsta.cloud";

export const testWordPressApiCall: RequestHandler = async (req, res) => {
  try {
    console.log("🧪 Testing direct call to your custom WordPress API...");
    
    const url = `${WP_BASE_URL}/wp-json/custom/v1/vehicles`;
    console.log("📡 Calling:", url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("✅ API Response Status:", response.status);
    console.log("📊 Total vehicles returned:", Array.isArray(data) ? data.length : "Not an array");
    
    // Show the first vehicle's structure
    const firstVehicle = Array.isArray(data) ? data[0] : data.sampleVehicle || data;

    res.status(200).json({
      success: true,
      message: "Raw API response from your custom WordPress endpoint",
      apiUrl: url,
      responseStatus: response.status,
      totalVehicles: Array.isArray(data) ? data.length : "Unknown",
      sampleVehicle: firstVehicle,
      responseType: Array.isArray(data) ? "array" : "object"
    });
    
  } catch (error) {
    console.error("❌ Error calling WordPress API:", error);
    res.status(500).json({
      success: false,
      message: "Failed to call WordPress API",
      error: error.message,
      apiUrl: `${WP_BASE_URL}/wp-json/custom/v1/vehicles`
    });
  }
};
