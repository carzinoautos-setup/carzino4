import fetch from "node-fetch";

const API_BASE = "http://localhost:5173/api";

interface TestResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}

async function testEndpoint(
  endpoint: string,
  description: string,
): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log(`🧪 Testing ${description}...`);

    const response = await fetch(`${API_BASE}${endpoint}`);
    const responseTime = Date.now() - start;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ ${description} - ${responseTime}ms`);

    return {
      endpoint,
      success: true,
      responseTime,
      data,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    console.log(`❌ ${description} - Failed after ${responseTime}ms`);
    console.log(`   Error: ${error.message}`);

    return {
      endpoint,
      success: false,
      responseTime,
      error: error.message,
    };
  }
}

async function runApiTests() {
  console.log("🚀 Starting API Tests...\n");

  const tests: Array<{ endpoint: string; description: string }> = [
    { endpoint: "/ping", description: "Basic ping endpoint" },
    { endpoint: "/health", description: "Database health check" },
    {
      endpoint: "/vehicles?page=1&pageSize=10",
      description: "Vehicles pagination (page 1)",
    },
    {
      endpoint: "/vehicles?page=2&pageSize=20",
      description: "Vehicles pagination (page 2)",
    },
    {
      endpoint: "/vehicles?make=Toyota",
      description: "Vehicles filtered by make",
    },
    {
      endpoint: "/vehicles?condition=New&maxPrice=50000",
      description: "Vehicles with multiple filters",
    },
    { endpoint: "/vehicles/filters", description: "Available filter options" },
    { endpoint: "/vehicles/1", description: "Single vehicle by ID" },
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.description);
    results.push(result);

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary
  console.log("\n📊 Test Summary:");
  console.log("=".repeat(50));

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   ${r.endpoint}: ${r.error}`);
      });
  }

  // Test pagination performance with larger datasets
  if (successful > 0) {
    console.log("\n🔍 Performance Tests:");

    const performanceTests = [
      { pageSize: 10, description: "10 items per page" },
      { pageSize: 20, description: "20 items per page" },
      { pageSize: 50, description: "50 items per page" },
      { pageSize: 100, description: "100 items per page" },
    ];

    for (const perfTest of performanceTests) {
      const result = await testEndpoint(
        `/vehicles?page=1&pageSize=${perfTest.pageSize}`,
        `Performance test: ${perfTest.description}`,
      );

      if (result.success && result.data) {
        console.log(
          `   📈 ${perfTest.description}: ${result.responseTime}ms (${result.data.meta?.totalRecords || 0} total records)`,
        );
      }
    }
  }

  console.log("\n🎉 API Testing Complete!");

  return {
    totalTests: results.length,
    successful,
    failed,
    avgResponseTime: Math.round(avgResponseTime),
  };
}

// Run tests if script is executed directly
if (require.main === module) {
  runApiTests()
    .then((summary) => {
      if (summary.failed === 0) {
        console.log("🎉 All tests passed!");
        process.exit(0);
      } else {
        console.log("⚠️  Some tests failed. Check the logs above.");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Test runner failed:", error);
      process.exit(1);
    });
}

export { runApiTests };
