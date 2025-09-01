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

        // Test 1: Basic connection test
        console.log('📡 Testing API connection...');
        const connectionResult = await wordpressCustomApi.testConnection();
        setConnectionTest(connectionResult);

        if (!connectionResult.success) {
          throw new Error(connectionResult.message);
        }

        // Test 2: Fetch vehicles with pagination
        console.log('📦 Fetching sample vehicles...');
        const vehiclesResult = await wordpressCustomApi.getVehicles(1, 5); // Get first 5 vehicles
        setVehiclesData(vehiclesResult);

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
          
          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
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
              {connectionTest.success ? '✅ Connection Test Passed' : '❌ Connection Test Failed'}
            </h2>
            <p className={connectionTest.success ? 'text-green-700' : 'text-red-700'}>
              {connectionTest.message}
            </p>
            
            {connectionTest.data && (
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Show Connection Details</summary>
                <pre className="mt-2 bg-white/50 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(connectionTest.data, null, 2)}
                </pre>
              </details>
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
