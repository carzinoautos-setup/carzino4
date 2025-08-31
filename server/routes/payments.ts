import { RequestHandler } from "express";
import { z } from "zod";

// Validation schema for payment calculations
const PaymentCalculationSchema = z.object({
  salePrice: z.number().min(1, "Sale price must be greater than 0"),
  downPayment: z.number().min(0, "Down payment cannot be negative"),
  interestRate: z
    .number()
    .min(0)
    .max(50, "Interest rate must be between 0% and 50%"),
  loanTermMonths: z
    .number()
    .min(1)
    .max(120, "Loan term must be between 1 and 120 months"),
});

const BulkCalculationSchema = z.object({
  vehicles: z.array(
    z.object({
      id: z.number(),
      salePrice: z.number(),
    }),
  ),
  downPayment: z.number(),
  interestRate: z.number(),
  loanTermMonths: z.number(),
});

// In-memory cache for payment calculations
const paymentCache = new Map<string, any>();
const CACHE_TTL = 60000 * 5; // 5 minutes

interface PaymentResult {
  monthlyPayment: number;
  totalLoanAmount: number;
  totalInterest: number;
  totalPayments: number;
  principal: number;
}

/**
 * Calculate monthly payment using standard loan formula
 */
function calculateMonthlyPayment(
  salePrice: number,
  downPayment: number,
  interestRate: number,
  loanTermMonths: number,
): PaymentResult {
  const principal = salePrice - downPayment;

  if (interestRate === 0) {
    const monthlyPayment = principal / loanTermMonths;
    return {
      monthlyPayment,
      totalLoanAmount: principal,
      totalInterest: 0,
      totalPayments: principal,
      principal,
    };
  }

  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
    (Math.pow(1 + monthlyRate, loanTermMonths) - 1);

  const totalPayments = monthlyPayment * loanTermMonths;
  const totalInterest = totalPayments - principal;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalLoanAmount: principal,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayments: Math.round(totalPayments * 100) / 100,
    principal,
  };
}

/**
 * Generate cache key for payment calculation
 */
function getCacheKey(
  salePrice: number,
  downPayment: number,
  interestRate: number,
  loanTermMonths: number,
): string {
  return `payment_${salePrice}_${downPayment}_${interestRate}_${loanTermMonths}`;
}

/**
 * Calculate single payment
 */
export const calculatePayment: RequestHandler = (req, res) => {
  try {
    const validatedData = PaymentCalculationSchema.parse(req.body);
    const { salePrice, downPayment, interestRate, loanTermMonths } =
      validatedData;

    // Check cache first
    const cacheKey = getCacheKey(
      salePrice,
      downPayment,
      interestRate,
      loanTermMonths,
    );
    const cached = paymentCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({
        success: true,
        data: cached.result,
        cached: true,
      });
    }

    // Calculate payment
    const result = calculateMonthlyPayment(
      salePrice,
      downPayment,
      interestRate,
      loanTermMonths,
    );

    // Cache result
    paymentCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
    console.error("Payment calculation error:", error);
    res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Invalid payment parameters",
    });
  }
};

/**
 * Calculate payments for multiple vehicles (bulk operation)
 */
export const calculateBulkPayments: RequestHandler = (req, res) => {
  try {
    const validatedData = BulkCalculationSchema.parse(req.body);
    const { vehicles, downPayment, interestRate, loanTermMonths } =
      validatedData;

    const results = vehicles.map((vehicle) => {
      const cacheKey = getCacheKey(
        vehicle.salePrice,
        downPayment,
        interestRate,
        loanTermMonths,
      );
      const cached = paymentCache.get(cacheKey);

      let paymentResult;
      let fromCache = false;

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        paymentResult = cached.result;
        fromCache = true;
      } else {
        paymentResult = calculateMonthlyPayment(
          vehicle.salePrice,
          downPayment,
          interestRate,
          loanTermMonths,
        );

        // Cache result
        paymentCache.set(cacheKey, {
          result: paymentResult,
          timestamp: Date.now(),
        });
      }

      return {
        vehicleId: vehicle.id,
        salePrice: vehicle.salePrice,
        ...paymentResult,
        cached: fromCache,
      };
    });

    res.json({
      success: true,
      data: results,
      totalCalculations: vehicles.length,
      cacheHits: results.filter((r) => r.cached).length,
    });
  } catch (error) {
    console.error("Bulk payment calculation error:", error);
    res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Invalid bulk payment parameters",
    });
  }
};

/**
 * Calculate affordable price based on desired payment
 */
export const calculateAffordablePrice: RequestHandler = (req, res) => {
  try {
    const { desiredPayment, downPayment, interestRate, loanTermMonths } =
      req.body;

    if (!desiredPayment || desiredPayment <= 0) {
      return res.status(400).json({
        success: false,
        error: "Desired payment must be greater than 0",
      });
    }

    let affordablePrice;

    if (interestRate === 0) {
      affordablePrice = desiredPayment * loanTermMonths + downPayment;
    } else {
      const monthlyRate = interestRate / 100 / 12;
      const principal =
        desiredPayment *
        ((Math.pow(1 + monthlyRate, loanTermMonths) - 1) /
          (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)));
      affordablePrice = Math.round(principal + downPayment);
    }

    res.json({
      success: true,
      data: {
        affordablePrice,
        desiredPayment,
        downPayment,
        interestRate,
        loanTermMonths,
      },
    });
  } catch (error) {
    console.error("Affordable price calculation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate affordable price",
    });
  }
};

/**
 * Get payment calculation cache statistics
 */
export const getCacheStats: RequestHandler = (req, res) => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const [key, value] of paymentCache.entries()) {
    if (now - value.timestamp < CACHE_TTL) {
      validEntries++;
    } else {
      expiredEntries++;
      paymentCache.delete(key); // Clean up expired entries
    }
  }

  res.json({
    success: true,
    data: {
      totalEntries: paymentCache.size,
      validEntries,
      expiredEntries,
      cacheTTL: CACHE_TTL,
      memoryUsage: process.memoryUsage(),
    },
  });
};

/**
 * Clear payment cache
 */
export const clearCache: RequestHandler = (req, res) => {
  const previousSize = paymentCache.size;
  paymentCache.clear();

  res.json({
    success: true,
    message: `Cleared ${previousSize} cache entries`,
  });
};
