import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";

console.log("🚨 MINIMAL COMPONENT: File is loading");

function MySQLVehiclesOriginalStyle() {
  console.log("🚨 MINIMAL COMPONENT: Function is executing");
  
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState<string | null>(null);

  console.log("🚨 MINIMAL COMPONENT: State initialized");

  useEffect(() => {
    console.log("🚨 MINIMAL COMPONENT: useEffect running");
    
    const fetchData = async () => {
      try {
        console.log("🚨 MINIMAL COMPONENT: Starting API call");
        const response = await fetch('/api/simple-vehicles/combined?page=1&pageSize=20');
        const data = await response.json();
        
        console.log("🚨 MINIMAL COMPONENT: API response:", data);
        
        if (data.success) {
          setVehicles(data.data.vehicles || []);
          setLoading(false);
        } else {
          setError(data.message || 'Failed to load vehicles');
          setLoading(false);
        }
      } catch (err) {
        console.error("🚨 MINIMAL COMPONENT: API error:", err);
        setError('Failed to fetch vehicles');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  console.log("🚨 MINIMAL COMPONENT: About to render");

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
          <div className="text-lg">Loading MySQL vehicles...</div>
          <div className="text-sm text-gray-500 mt-2">
            Simplified version - vehicles: {vehicles.length}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Error: {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">MySQL Vehicles ({vehicles.length} found)</h1>
      
      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">No vehicles found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.slice(0, 10).map((vehicle: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">
                {vehicle.title || vehicle.name || `Vehicle ${index + 1}`}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Price: {vehicle.salePrice || vehicle.price || 'N/A'}</div>
                <div>Mileage: {vehicle.mileage || 'N/A'}</div>
                <div>Transmission: {vehicle.transmission || 'N/A'}</div>
                <div>Dealer: {vehicle.dealer || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {vehicles.length > 10 && (
        <div className="text-center mt-8">
          <div className="text-gray-500">Showing 10 of {vehicles.length} vehicles</div>
        </div>
      )}
    </div>
  );
}

export default MySQLVehiclesOriginalStyle;
