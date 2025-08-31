import { useState, useEffect, useCallback } from "react";
import {
  calculateMonthlyPayment,
  calculateAffordablePrice,
  PaymentParams,
  PaymentResult,
} from "../lib/paymentCalculator";

interface PaymentFilterState {
  paymentMin: string;
  paymentMax: string;
  interestRate: string;
  loanTermMonths: string;
  downPayment: string;
}

interface UsePaymentFiltersProps {
  initialState?: Partial<PaymentFilterState>;
  onPaymentRangeChange?: (min: string, max: string) => void;
  debounceMs?: number;
}

interface VehicleWithPayment {
  id: number;
  salePrice: number;
  calculatedPayment?: number;
  paymentError?: string;
}

export function usePaymentFilters({
  initialState = {},
  onPaymentRangeChange,
  debounceMs = 300,
}: UsePaymentFiltersProps = {}) {
  // Payment filter state
  const [paymentState, setPaymentState] = useState<PaymentFilterState>({
    paymentMin: initialState.paymentMin || "100",
    paymentMax: initialState.paymentMax || "2000",
    interestRate: initialState.interestRate || "5",
    loanTermMonths: initialState.loanTermMonths || "60",
    downPayment: initialState.downPayment || "2000",
  });

  // Calculation states
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [affordablePriceRange, setAffordablePriceRange] = useState<{
    min: number;
    max: number;
  } | null>(null);

  // Debounced calculation effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateAffordablePriceRange();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [
    paymentState.paymentMin,
    paymentState.paymentMax,
    paymentState.interestRate,
    paymentState.loanTermMonths,
    paymentState.downPayment,
  ]);

  // Calculate affordable price range based on payment range
  const calculateAffordablePriceRange = useCallback(async () => {
    try {
      setIsCalculating(true);
      setCalculationError(null);

      const downPaymentNum = parseFloat(paymentState.downPayment) || 0;
      const interestRateNum = parseFloat(paymentState.interestRate) || 0;
      const loanTermNum = parseInt(paymentState.loanTermMonths) || 60;
      const paymentMinNum = parseFloat(paymentState.paymentMin) || 0;
      const paymentMaxNum = parseFloat(paymentState.paymentMax) || 10000;

      if (paymentMinNum <= 0 || paymentMaxNum <= 0) {
        setAffordablePriceRange(null);
        return;
      }

      const minAffordablePrice = calculateAffordablePrice(
        paymentMinNum,
        downPaymentNum,
        interestRateNum,
        loanTermNum,
      );

      const maxAffordablePrice = calculateAffordablePrice(
        paymentMaxNum,
        downPaymentNum,
        interestRateNum,
        loanTermNum,
      );

      setAffordablePriceRange({
        min: Math.round(minAffordablePrice),
        max: Math.round(maxAffordablePrice),
      });

      // Notify parent component about payment range change
      if (onPaymentRangeChange) {
        onPaymentRangeChange(paymentState.paymentMin, paymentState.paymentMax);
      }
    } catch (error) {
      console.error("Payment calculation error:", error);
      setCalculationError(
        error instanceof Error ? error.message : "Calculation failed",
      );
      setAffordablePriceRange(null);
    } finally {
      setIsCalculating(false);
    }
  }, [paymentState, onPaymentRangeChange]);

  // Calculate payment for a specific vehicle
  const calculateVehiclePayment = useCallback(
    (salePrice: number): PaymentResult | null => {
      try {
        const params: PaymentParams = {
          salePrice,
          downPayment: parseFloat(paymentState.downPayment) || 0,
          interestRate: parseFloat(paymentState.interestRate) || 0,
          loanTermMonths: parseInt(paymentState.loanTermMonths) || 60,
        };

        return calculateMonthlyPayment(params);
      } catch (error) {
        console.error("Vehicle payment calculation error:", error);
        return null;
      }
    },
    [paymentState],
  );

  // Calculate payments for multiple vehicles
  const calculateBulkPayments = useCallback(
    async (vehicles: VehicleWithPayment[]): Promise<VehicleWithPayment[]> => {
      try {
        setIsCalculating(true);

        // Use server-side bulk calculation for better performance
        const response = await fetch("/api/payments/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicles: vehicles.map((v) => ({
              id: v.id,
              salePrice: v.salePrice,
            })),
            downPayment: parseFloat(paymentState.downPayment) || 0,
            interestRate: parseFloat(paymentState.interestRate) || 0,
            loanTermMonths: parseInt(paymentState.loanTermMonths) || 60,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to calculate bulk payments");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Bulk calculation failed");
        }

        // Map results back to vehicles
        return vehicles.map((vehicle) => {
          const calculation = result.data.find(
            (calc: any) => calc.vehicleId === vehicle.id,
          );
          return {
            ...vehicle,
            calculatedPayment: calculation
              ? Math.round(calculation.monthlyPayment)
              : undefined,
            paymentError: calculation ? undefined : "Calculation failed",
          };
        });
      } catch (error) {
        console.error("Bulk payment calculation error:", error);
        // Fallback to client-side calculation
        return vehicles.map((vehicle) => {
          const payment = calculateVehiclePayment(vehicle.salePrice);
          return {
            ...vehicle,
            calculatedPayment: payment
              ? Math.round(payment.monthlyPayment)
              : undefined,
            paymentError: payment ? undefined : "Calculation failed",
          };
        });
      } finally {
        setIsCalculating(false);
      }
    },
    [paymentState, calculateVehiclePayment],
  );

  // Update payment state
  const updatePaymentState = useCallback(
    (updates: Partial<PaymentFilterState>) => {
      setPaymentState((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  // Reset to default values
  const resetPaymentFilters = useCallback(() => {
    setPaymentState({
      paymentMin: "100",
      paymentMax: "2000",
      interestRate: "5",
      loanTermMonths: "60",
      downPayment: "2000",
    });
  }, []);

  // Check if vehicle matches payment filter
  const vehicleMatchesPaymentFilter = useCallback(
    (salePrice: number): boolean => {
      if (!affordablePriceRange) return true;

      return (
        salePrice >= affordablePriceRange.min &&
        salePrice <= affordablePriceRange.max
      );
    },
    [affordablePriceRange],
  );

  return {
    // State
    paymentState,
    isCalculating,
    calculationError,
    affordablePriceRange,

    // Actions
    updatePaymentState,
    resetPaymentFilters,
    calculateVehiclePayment,
    calculateBulkPayments,
    vehicleMatchesPaymentFilter,

    // Computed values
    formattedAffordableRange: affordablePriceRange
      ? `$${affordablePriceRange.min.toLocaleString()} - $${affordablePriceRange.max.toLocaleString()}`
      : null,
  };
}
