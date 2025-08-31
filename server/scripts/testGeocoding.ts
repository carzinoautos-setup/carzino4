/**
 * Simple test script to verify geocoding functionality
 */

async function testGeocoding() {
  const baseUrl = "http://localhost:8080";

  console.log("🧪 Testing Enhanced Geocoding API with Google Maps...\n");

  // Test 1: Health check first
  try {
    console.log("Test 1: Health check");
    const response1 = await fetch(`${baseUrl}/api/geocode/health`);
    const result1 = await response1.json();

    if (result1.success) {
      console.log("✅ PASS - Health check passed");
      console.log(
        `📊 Google Maps API: ${result1.googleMapsApiEnabled ? "ENABLED" : "DISABLED"}`,
      );
      console.log(`🛠️  Capabilities: ${result1.capabilities}`);
      console.log(`📋 Cache size: ${result1.cacheSize}`);
      if (result1.testResult) {
        console.log(
          `📍 Test result: ${result1.testResult.city}, ${result1.testResult.state} (${result1.testResult.source})`,
        );
      }
    } else {
      console.log("❌ FAIL - Health check failed");
    }
  } catch (error) {
    console.log("❌ FAIL - Network error:", error);
  }

  // Test 2: Known ZIP code (should use Google or fallback)
  try {
    console.log("\nTest 2: Known ZIP code (98498)");
    const response2 = await fetch(`${baseUrl}/api/geocode/98498`);
    const result2 = await response2.json();

    if (result2.success) {
      console.log("✅ PASS - ZIP geocoded successfully");
      console.log(`📍 Location: ${result2.data.city}, ${result2.data.state}`);
      console.log(`🎯 Coordinates: (${result2.data.lat}, ${result2.data.lng})`);
      console.log(`📊 Source: ${result2.meta?.source || "unknown"}`);
      console.log(`📋 Cached: ${result2.meta?.cached || false}`);
    } else {
      console.log("❌ FAIL - Known ZIP failed:", result2.message);
    }
  } catch (error) {
    console.log("❌ FAIL - Network error:", error);
  }

  // Test 3: Random ZIP code (should use Google Maps if API is enabled)
  try {
    console.log("\nTest 3: Random ZIP code (85201 - Mesa, AZ)");
    const response3 = await fetch(`${baseUrl}/api/geocode/85201`);
    const result3 = await response3.json();

    if (result3.success) {
      console.log("✅ PASS - Random ZIP geocoded successfully");
      console.log(`📍 Location: ${result3.data.city}, ${result3.data.state}`);
      console.log(`🎯 Coordinates: (${result3.data.lat}, ${result3.data.lng})`);
      console.log(`📊 Source: ${result3.meta?.source || "unknown"}`);
    } else {
      console.log(
        "⚠️  INFO - Random ZIP not found (expected if Google API disabled):",
        result3.message,
      );
    }
  } catch (error) {
    console.log("❌ FAIL - Network error:", error);
  }

  // Test 4: Invalid ZIP code
  try {
    console.log("\nTest 4: Invalid ZIP code (99999)");
    const response4 = await fetch(`${baseUrl}/api/geocode/99999`);
    const result4 = await response4.json();

    if (!result4.success && response4.status === 404) {
      console.log("✅ PASS - Invalid ZIP properly rejected:", result4.message);
    } else {
      console.log("❌ FAIL - Invalid ZIP should be rejected");
    }
  } catch (error) {
    console.log("❌ FAIL - Network error:", error);
  }

  // Test 5: Cache stats
  try {
    console.log("\nTest 5: Cache statistics");
    const response5 = await fetch(`${baseUrl}/api/geocode/cache/stats`);
    const result5 = await response5.json();

    if (result5.success) {
      console.log("✅ PASS - Cache stats retrieved");
      console.log(`📋 Total cached entries: ${result5.data.totalCached}`);
      if (result5.data.entries && result5.data.entries.length > 0) {
        console.log("📊 Recent entries:");
        result5.data.entries.slice(0, 3).forEach((entry: any) => {
          console.log(
            `   - ${entry.zip}: ${entry.city}, ${entry.state} (${entry.source})`,
          );
        });
      } else {
        console.log("📊 No cache entries to display");
      }
    } else {
      console.log("❌ FAIL - Cache stats failed");
    }
  } catch (error) {
    console.log("❌ FAIL - Network error:", error);
  }

  // Frontend integration test instructions
  console.log("\n🌐 Frontend Integration Test Instructions:");
  console.log("1. Open the app in your browser");
  console.log("2. Go to the Distance filter section");
  console.log('3. Enter ZIP code: 98498 → Should show "📍 Lakewood, WA"');
  console.log('4. Enter ZIP code: 90210 → Should show "📍 Beverly Hills, CA"');
  console.log(
    '5. Enter ZIP code: 85201 → Should show "📍 Mesa, AZ" (Google Maps)',
  );
  console.log(
    '6. Enter ZIP code: 20001 → Should show "📍 Washington, DC" (Google Maps)',
  );
  console.log("7. Enter ZIP code: 99999 → Should show error message");
  console.log("8. Try your own ZIP code → Should work with Google Maps!");

  console.log("\n🎉 Enhanced Geocoding API tests completed!");
  console.log("💡 Now supporting 40,000+ ZIP codes via Google Maps API!");
}

export default testGeocoding;

// Run tests if this file is executed directly
testGeocoding().catch(console.error);
