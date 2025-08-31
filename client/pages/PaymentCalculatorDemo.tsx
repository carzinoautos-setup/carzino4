import React, { useState, useEffect } from "react";
import { VehicleCard } from "../components/VehicleCard";
import { usePaymentFilters } from "../hooks/usePaymentFilters";
import { Calculator, DollarSign, TrendingUp, Info } from "lucide-react";

// Sample vehicle data with different price points
const sampleVehicles = [
  {
    id: 1,
    featured: true,
    viewed: false,
    images: ["/placeholder.svg"],
    badges: ["Low APR Available"],
    title: "2023 Honda Civic EX",
    mileage: "15,000",
    transmission: "CVT",
    doors: "4 Doors",
    salePrice: "$28,500",
    payment: null,
    dealer: "Honda Center",
    location: "Downtown",
    phone: "(555) 123-4567",
    seller_type: "Dealer",
    rawPrice: 28500,
  },
  {
    id: 2,
    featured: false,
    viewed: true,
    images: ["/placeholder.svg"],
    badges: ["Certified Pre-Owned"],
    title: "2022 Toyota Camry LE",
    mileage: "25,000",
    transmission: "Automatic",
    doors: "4 Doors",
    salePrice: "$24,995",
    payment: null,
    dealer: "Toyota Center",
    location: "Northside",
    phone: "(555) 987-6543",
    seller_type: "Dealer",
    rawPrice: 24995,
  },
  {
    id: 3,
    featured: false,
    viewed: false,
    images: ["/placeholder.svg"],
    badges: ["Special Financing"],
    title: "2021 Nissan Altima SR",
    mileage: "35,000",
    transmission: "CVT",
    doors: "4 Doors",
    salePrice: "$22,800",
    payment: null,
    dealer: "Nissan Plus",
    location: "Eastside",
    phone: "(555) 456-7890",
    seller_type: "Dealer",
    rawPrice: 22800,
  },
];

export const PaymentCalculatorDemo: React.FC = () => {
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [favorites, setFavorites] = useState<{ [key: number]: any }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);

  const {
    paymentState,
    isCalculating,
    calculationError,
    affordablePriceRange,
    updatePaymentState,
    resetPaymentFilters,
    calculateBulkPayments,
    formattedAffordableRange,
  } = usePaymentFilters({
    initialState: {
      paymentMin: "300",
      paymentMax: "600",
      interestRate: "4.9",
      loanTermMonths: "60",
      downPayment: "3000",
    },
  });

  // Calculate payments when payment parameters change
  useEffect(() => {
    const updateVehiclePayments = async () => {
      const vehiclesWithPayments = await calculateBulkPayments(
        vehicles.map((v) => ({ id: v.id, salePrice: v.rawPrice })),
      );

      setVehicles((prev) =>
        prev.map((vehicle) => {
          const calculated = vehiclesWithPayments.find(
            (v) => v.id === vehicle.id,
          );
          return {
            ...vehicle,
            payment: calculated?.calculatedPayment
              ? `$${calculated.calculatedPayment}`
              : null,
          };
        }),
      );
    };

    updateVehiclePayments();
  }, [paymentState, calculateBulkPayments]);

  const handleToggleFavorite = (vehicle: any) => {
    setFavorites((prev) => {
      const newFavorites = { ...prev };
      if (newFavorites[vehicle.id]) {
        delete newFavorites[vehicle.id];
      } else {
        newFavorites[vehicle.id] = vehicle;
        setKeeperMessage(vehicle.id);
        setTimeout(() => setKeeperMessage(null), 2000);
      }
      return newFavorites;
    });
  };

  // Filter vehicles based on affordable price range
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!affordablePriceRange) return true;
    return (
      vehicle.rawPrice >= affordablePriceRange.min &&
      vehicle.rawPrice <= affordablePriceRange.max
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Payment Calculator Demo
            </h1>
          </div>
          <p className="text-gray-600">
            Real-time payment calculations with dynamic vehicle filtering
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Payment Calculator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold">Payment Calculator</h2>
              </div>

              {/* Payment Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Payment Range
                </label>
                <div className="flex gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Min
                    </label>
                    <input
                      type="number"
                      value={paymentState.paymentMin}
                      onChange={(e) =>
                        updatePaymentState({ paymentMin: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Max
                    </label>
                    <input
                      type="number"
                      value={paymentState.paymentMax}
                      onChange={(e) =>
                        updatePaymentState({ paymentMax: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="600"
                    />
                  </div>
                </div>
              </div>

              {/* Loan Parameters */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (APR)
                  </label>
                  <select
                    value={paymentState.interestRate}
                    onChange={(e) =>
                      updatePaymentState({ interestRate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="0">0% APR</option>
                    <option value="2.9">2.9% APR</option>
                    <option value="3.9">3.9% APR</option>
                    <option value="4.9">4.9% APR</option>
                    <option value="5.9">5.9% APR</option>
                    <option value="6.9">6.9% APR</option>
                    <option value="7.9">7.9% APR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Term
                  </label>
                  <select
                    value={paymentState.loanTermMonths}
                    onChange={(e) =>
                      updatePaymentState({ loanTermMonths: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="36">36 months</option>
                    <option value="48">48 months</option>
                    <option value="60">60 months</option>
                    <option value="72">72 months</option>
                    <option value="84">84 months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment
                  </label>
                  <input
                    type="number"
                    value={paymentState.downPayment}
                    onChange={(e) =>
                      updatePaymentState({ downPayment: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="3000"
                  />
                </div>
              </div>

              {/* Calculation Results */}
              {isCalculating && (
                <div className="flex items-center gap-2 text-blue-600 mb-4">
                  <TrendingUp className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Calculating...</span>
                </div>
              )}

              {calculationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-red-700 text-sm">{calculationError}</p>
                </div>
              )}

              {affordablePriceRange && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      Affordable Price Range
                    </span>
                  </div>
                  <p className="text-green-700 text-lg font-semibold">
                    {formattedAffordableRange}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    Based on ${paymentState.paymentMin} - $
                    {paymentState.paymentMax}/mo
                  </p>
                </div>
              )}

              <button
                onClick={resetPaymentFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Vehicle Results */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Available Vehicles
              </h2>
              <p className="text-gray-600">
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
                {affordablePriceRange && ` within your budget`}
              </p>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No vehicles match your payment criteria
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your payment range or loan parameters
                </p>
                <button
                  onClick={resetPaymentFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    keeperMessage={keeperMessage}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
