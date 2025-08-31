import React, { useState, useEffect } from "react";
import { VehicleCard } from "../components/VehicleCard";
import { FilterSection } from "../components/FilterSection";
import { Pagination } from "../components/Pagination";
import { usePaymentFilters } from "../hooks/usePaymentFilters";
import {
  useWordPressVehicles,
  useWordPressSettings,
  VehicleFilters,
} from "../lib/wordpressApi";
import {
  Search,
  Sliders,
  Heart,
  Calculator,
  Loader,
  RefreshCw,
} from "lucide-react";

/**
 * Complete WooCommerce Vehicle Listing Page
 *
 * This REPLACES your entire PHP/WordPress shortcode system:
 * - No more [carzino_product_monthly_payment_dynamic] shortcode needed
 * - No more WPCode JavaScript needed
 * - No more PHP amortization calculations needed
 * - No more cookie management in PHP needed
 *
 * Everything is handled by React with WooCommerce data
 */
export const WooCommerceVehicles: React.FC = () => {
  // WordPress/WooCommerce connection state
  const [wpFilters, setWpFilters] = useState<VehicleFilters>({
    page: 1,
    per_page: 20,
  });

  // Search and UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<{ [key: number]: any }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // WordPress data hooks
  const {
    vehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
    meta,
    refetch,
  } = useWordPressVehicles(wpFilters);
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
  } = useWordPressSettings();

  // Payment calculator integration (replaces your entire PHP calculator)
  const {
    paymentState,
    isCalculating,
    calculationError,
    affordablePriceRange,
    updatePaymentState,
    resetPaymentFilters,
    calculateBulkPayments,
    vehicleMatchesPaymentFilter,
    formattedAffordableRange,
  } = usePaymentFilters({
    initialState: {
      paymentMin: "200",
      paymentMax: "800",
      // Use WordPress settings as defaults (replaces your ACF field calls)
      interestRate: settings?.default_apr?.toString() || "10",
      loanTermMonths: settings?.default_term?.toString() || "72",
      downPayment: "3000",
    },
  });

  // Calculate payments for all vehicles (replaces your shortcode calculations)
  const [vehiclesWithPayments, setVehiclesWithPayments] = useState<any[]>([]);

  useEffect(() => {
    const updatePayments = async () => {
      if (vehicles.length === 0) return;

      const updated = await calculateBulkPayments(
        vehicles.map((v) => ({ id: v.id, salePrice: v.rawPrice })),
      );

      const withPayments = vehicles.map((vehicle) => {
        const calculated = updated.find((u) => u.id === vehicle.id);
        return {
          ...vehicle,
          payment: calculated?.calculatedPayment
            ? `$${calculated.calculatedPayment}`
            : null,
        };
      });

      setVehiclesWithPayments(withPayments);
    };

    updatePayments();
  }, [vehicles, paymentState, calculateBulkPayments]);

  // Filter vehicles by payment affordability (replaces your search-by-payment PHP)
  const filteredVehicles = vehiclesWithPayments.filter((vehicle) => {
    // Text search
    if (
      searchTerm &&
      !vehicle.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Payment affordability filter
    return vehicleMatchesPaymentFilter(vehicle.rawPrice);
  });

  // Handle WordPress filter changes
  const handleWPFilterChange = (newFilters: Partial<VehicleFilters>) => {
    setWpFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setWpFilters((prev) => ({ ...prev, page }));
  };

  // Toggle favorites
  const toggleFavorite = (vehicle: any) => {
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

  // Loading state
  if (vehiclesLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading vehicles from WooCommerce...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (vehiclesError || settingsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-red-800 font-semibold mb-2">
              Connection Error
            </h3>
            <p className="text-red-700 text-sm mb-4">
              {vehiclesError || settingsError}
            </p>
            <button
              onClick={() => {
                refetch();
                window.location.reload();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Vehicle Inventory
              </h1>
              <p className="text-gray-600 mt-1">
                Powered by WooCommerce + React | {meta?.total || 0} vehicles
                available
              </p>
            </div>

            {/* WordPress Settings Display */}
            {settings && (
              <div className="text-sm text-gray-500">
                <div>Default APR: {settings.default_apr}%</div>
                <div>Default Term: {settings.default_term} months</div>
                <div>Sales Tax: {settings.default_sales_tax}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Vehicles
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by make, model..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Calculator (replaces your entire WPCode system) */}
              <div className="border-t pt-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Payment Calculator</h3>
                </div>

                {/* Payment Range */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Payment Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={paymentState.paymentMin}
                        onChange={(e) =>
                          updatePaymentState({ paymentMin: e.target.value })
                        }
                        placeholder="Min"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        value={paymentState.paymentMax}
                        onChange={(e) =>
                          updatePaymentState({ paymentMax: e.target.value })
                        }
                        placeholder="Max"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      APR (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={paymentState.interestRate}
                      onChange={(e) =>
                        updatePaymentState({ interestRate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
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
                      Down Payment ($)
                    </label>
                    <input
                      type="number"
                      value={paymentState.downPayment}
                      onChange={(e) =>
                        updatePaymentState({ downPayment: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Calculation Results */}
                {isCalculating && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Calculating...</span>
                  </div>
                )}

                {calculationError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-700 text-sm">{calculationError}</p>
                  </div>
                )}

                {affordablePriceRange && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="text-green-800 text-sm font-medium mb-1">
                      Affordable Price Range
                    </div>
                    <div className="text-green-700 text-lg font-semibold">
                      {formattedAffordableRange}
                    </div>
                  </div>
                )}

                <button
                  onClick={resetPaymentFilters}
                  className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Reset Calculator
                </button>
              </div>

              {/* WooCommerce Filters */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Vehicle Filters</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Price
                    </label>
                    <input
                      type="number"
                      placeholder="50000"
                      onChange={(e) =>
                        handleWPFilterChange({
                          max_price: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make
                    </label>
                    <select
                      onChange={(e) =>
                        handleWPFilterChange({
                          make: e.target.value || undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Makes</option>
                      <option value="Honda">Honda</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Ford">Ford</option>
                      <option value="Chevrolet">Chevrolet</option>
                      <option value="BMW">BMW</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <select
                      onChange={(e) =>
                        handleWPFilterChange({
                          condition: e.target.value || undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Conditions</option>
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Certified">Certified Pre-Owned</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Available Vehicles
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {filteredVehicles.length} of{" "}
                  {vehiclesWithPayments.length} vehicles
                  {affordablePriceRange && ` within your budget`}
                </div>
              </div>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No vehicles match your criteria
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your payment range or other filters
                </p>
                <button
                  onClick={resetPaymentFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      favorites={favorites}
                      onToggleFavorite={toggleFavorite}
                      keeperMessage={keeperMessage}
                    />
                  ))}
                </div>

                {/* WordPress Pagination */}
                {meta && meta.total_pages > 1 && (
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.total_pages}
                    totalResults={meta.total}
                    resultsPerPage={meta.per_page}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
