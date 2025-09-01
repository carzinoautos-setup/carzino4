import React, { useState, useEffect } from 'react';
import { wordpressCustomApi, WordPressVehicle, WordPressVehiclesResponse } from '../lib/wordpressCustomApi';

export default function WordPressApiTest() {
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [vehiclesData, setVehiclesData] = useState<WordPressVehiclesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState({ entries: 0, size: '0 KB' });

  // Test API connection and fetch sample data
  useEffect(() => {
    const testApi = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Starting WordPress Custom API tests...');

        // Test 1: Comprehensive connection test (includes all sub-tests)
        console.log('📡 Running comprehensive API tests...');
        const connectionResult = await wordpressCustomApi.testConnection();
        setConnectionTest(connectionResult);

        // Test 2: Try to fetch vehicles (only if custom endpoint is working)
        if (connectionResult.success) {
          console.log('📦 Fetching sample vehicles...');
          try {
            const vehiclesResult = await wordpressCustomApi.getVehicles(1, 5); // Get first 5 vehicles
            setVehiclesData(vehiclesResult);
          } catch (vehicleError) {
            console.warn('⚠️ Could not fetch vehicles, but connection test passed:', vehicleError);
            // Don't throw here, we still want to show the connection test results
          }
        } else {
          console.log('❌ Skipping vehicle fetch due to connection test failure');
        }

        // Get cache stats
        setCacheStats(wordpressCustomApi.getCacheStats());

        console.log('✅ All WordPress Custom API tests completed successfully');

      } catch (err) {
        console.error('❌ WordPress Custom API test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  const handleClearCache = () => {
    wordpressCustomApi.clearCache();
    setCacheStats(wordpressCustomApi.getCacheStats());
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setConnectionTest(null);
    setVehiclesData(null);
    
    // Retry after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WordPress Custom API Test
          </h1>
          <p className="text-gray-600">
            Testing connection to: <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              /wp-json/custom/v1/vehicles
            </code>
          </p>
          
          {/* Environment Info */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <h4 className="font-medium text-gray-700 mb-1">Environment Configuration:</h4>
            <div className="space-y-1 text-gray-600">
              <div>VITE_WP_URL: <code className="bg-white px-1 rounded">{import.meta.env.VITE_WP_URL || 'Not set (using default)'}</code></div>
              <div>Current URL: <code className="bg-white px-1 rounded">{window.location.origin}</code></div>
              <div>Target WordPress: <code className="bg-white px-1 rounded">https://env-uploadbackup62225-czdev.kinsta.cloud</code></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={handleRetry}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Retry Test'}
            </button>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Cache
            </button>
            <button
              onClick={() => {
                const url = 'https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1/vehicles';
                window.open(url, '_blank');
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test in Browser
            </button>
            <button
              onClick={() => {
                const url = 'https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json';
                window.open(url, '_blank');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Check WP REST API
            </button>
          </div>

          {/* Cache Stats */}
          <div className="mt-4 text-sm text-gray-600">
            Cache: {cacheStats.entries} entries, {cacheStats.size}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Testing WordPress API...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">❌ API Test Failed</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <details className="text-sm">
              <summary className="cursor-pointer text-red-600 hover:text-red-800">
                Show Error Details
              </summary>
              <pre className="mt-2 bg-red-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify({ error, connectionTest }, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Connection Test Results */}
        {connectionTest && (
          <div className={`rounded-lg shadow-md p-6 mb-6 ${
            connectionTest.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-2 ${
              connectionTest.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {connectionTest.success ? '✅ WordPress API Tests Passed' : '❌ WordPress API Tests Failed'}
            </h2>
            <div className={`mb-4 ${connectionTest.success ? 'text-green-700' : 'text-red-700'}`}>
              <p className="whitespace-pre-line">{connectionTest.message}</p>
            </div>

            {/* Detailed Test Results */}
            {connectionTest.data && (
              <div className="space-y-4">
                {/* Individual Test Results */}
                {Object.entries(connectionTest.data).map(([testName, result]: [string, any]) => {
                  if (typeof result === 'object' && result.success !== undefined) {
                    return (
                      <div key={testName} className={`p-3 rounded border ${
                        result.success
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-red-100 border-red-300 text-red-800'
                      }`}>
                        <div className="flex items-center gap-2 font-medium">
                          <span>{result.success ? '✅' : '❌'}</span>
                          <span>{testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        </div>
                        <p className="text-sm mt-1">{result.message}</p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm opacity-75">Show Details</summary>
                            <pre className="mt-1 bg-white/50 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Full Debug Info */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">Show Complete Debug Information</summary>
                  <pre className="mt-2 bg-white/50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(connectionTest.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Vehicles Data */}
        {vehiclesData && (
          <div className="space-y-6">
            {/* API Response Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 API Response Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">Success</div>
                  <div className="text-lg font-semibold text-blue-900">
                    {vehiclesData.success ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Total Vehicles</div>
                  <div className="text-lg font-semibold text-green-900">
                    {vehiclesData.pagination?.total || 0}
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm text-yellow-600">Current Page</div>
                  <div className="text-lg font-semibold text-yellow-900">
                    {vehiclesData.pagination?.page || 1}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-purple-600">Per Page</div>
                  <div className="text-lg font-semibold text-purple-900">
                    {vehiclesData.pagination?.per_page || 0}
                  </div>
                </div>
              </div>

              <details>
                <summary className="cursor-pointer font-medium text-gray-700">
                  Show Full API Response Structure
                </summary>
                <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(vehiclesData, null, 2)}
                </pre>
              </details>
            </div>

            {/* Sample Vehicles */}
            {vehiclesData.data && vehiclesData.data.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🚗 Sample Vehicles ({vehiclesData.data.length})
                </h2>
                
                <div className="space-y-4">
                  {vehiclesData.data.map((vehicle: WordPressVehicle, index: number) => (
                    <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {vehicle.acf?.year} {vehicle.acf?.make} {vehicle.acf?.model}
                          </h3>
                          <p className="text-gray-600">ID: {vehicle.id} | Stock: {vehicle.stock_status}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${vehicle.price?.toLocaleString() || 'N/A'}
                          </div>
                          {vehicle.acf?.payment && (
                            <div className="text-sm text-gray-600">
                              ${vehicle.acf.payment}/mo
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Mileage:</span>
                          <span className="ml-1 font-medium">{vehicle.acf?.mileage?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Condition:</span>
                          <span className="ml-1 font-medium">{vehicle.acf?.condition || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Transmission:</span>
                          <span className="ml-1 font-medium">{vehicle.acf?.transmission || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Drivetrain:</span>
                          <span className="ml-1 font-medium">{vehicle.acf?.drivetrain || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Seller Info */}
                      {vehicle.acf && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <div className="text-sm">
                            <span className="font-medium">Seller:</span> {vehicle.acf.account_type_seller || 'N/A'}
                            {vehicle.acf.city_seller && vehicle.acf.state_seller && (
                              <span className="ml-4">
                                <span className="font-medium">Location:</span> {vehicle.acf.city_seller}, {vehicle.acf.state_seller}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ACF Structure Preview */}
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Show ACF Data Structure
                        </summary>
                        <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(vehicle.acf, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Transformation Test */}
            {vehiclesData.data && vehiclesData.data.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🔄 Data Transformation Test
                </h2>
                <p className="text-gray-600 mb-4">
                  Testing conversion from WordPress format to VehicleRecord format:
                </p>
                
                {vehiclesData.data.slice(0, 1).map((vehicle: WordPressVehicle) => {
                  const transformed = wordpressCustomApi.constructor.transformToVehicleRecord(vehicle);
                  
                  return (
                    <div key={vehicle.id} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">WordPress Format:</h3>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify({
                              id: vehicle.id,
                              name: vehicle.name,
                              price: vehicle.price,
                              acf: {
                                year: vehicle.acf?.year,
                                make: vehicle.acf?.make,
                                model: vehicle.acf?.model,
                                mileage: vehicle.acf?.mileage,
                                condition: vehicle.acf?.condition,
                                '...': '(more fields)'
                              }
                            }, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">VehicleRecord Format:</h3>
                          <pre className="bg-green-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify({
                              id: transformed.id,
                              year: transformed.year,
                              make: transformed.make,
                              model: transformed.model,
                              mileage: transformed.mileage,
                              condition: transformed.condition,
                              price: transformed.price,
                              '...': '(more fields)'
                            }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* No Data Message */}
        {!loading && !error && (!vehiclesData || !vehiclesData.data || vehiclesData.data.length === 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ No Vehicles Found</h2>
            <p className="text-yellow-700">
              The API connected successfully but returned no vehicle data. This might mean:
            </p>
            <ul className="list-disc list-inside mt-2 text-yellow-700 text-sm">
              <li>No vehicles are published in WordPress</li>
              <li>The API endpoint is not returning data correctly</li>
              <li>The ACF fields are not properly configured</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
