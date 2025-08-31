/**
 * Payment Calculator Utilities
 * Handles dynamic payment calculations with real-time updates
 */

export interface PaymentParams {
  salePrice: number;
  downPayment: number;
  interestRate: number; // Annual percentage rate
  loanTermMonths: number;
}

export interface PaymentResult {
  monthlyPayment: number;
  totalLoanAmount: number;
  totalInterest: number;
  totalPayments: number;
  principal: number;
}

/**
 * Calculate monthly payment using standard loan formula
 * PMT = [P × R × (1 + R)^N] / [(1 + R)^N - 1]
 */
export function calculateMonthlyPayment(params: PaymentParams): PaymentResult {
  const { salePrice, downPayment, interestRate, loanTermMonths } = params;

  // Calculate principal (amount financed)
  const principal = salePrice - downPayment;

  // Handle zero interest rate case
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

  // Convert annual rate to monthly decimal
  const monthlyRate = interestRate / 100 / 12;

  // Calculate monthly payment
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
 * Calculate what sale price you can afford based on desired payment
 */
export function calculateAffordablePrice(
  desiredPayment: number,
  downPayment: number,
  interestRate: number,
  loanTermMonths: number,
): number {
  if (interestRate === 0) {
    return desiredPayment * loanTermMonths + downPayment;
  }

  const monthlyRate = interestRate / 100 / 12;
  const principal =
    desiredPayment *
    ((Math.pow(1 + monthlyRate, loanTermMonths) - 1) /
      (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)));

  return Math.round(principal + downPayment);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validate payment parameters
 */
export function validatePaymentParams(params: PaymentParams): string[] {
  const errors: string[] = [];

  if (params.salePrice <= 0) {
    errors.push("Sale price must be greater than 0");
  }

  if (params.downPayment < 0) {
    errors.push("Down payment cannot be negative");
  }

  if (params.downPayment >= params.salePrice) {
    errors.push("Down payment cannot exceed sale price");
  }

  if (params.interestRate < 0 || params.interestRate > 50) {
    errors.push("Interest rate must be between 0% and 50%");
  }

  if (params.loanTermMonths <= 0 || params.loanTermMonths > 120) {
    errors.push("Loan term must be between 1 and 120 months");
  }

  return errors;
}

/**
 * Create payment calculation hook for React components
 */
export function usePaymentCalculator() {
  const calculatePayment = (params: PaymentParams) => {
    const errors = validatePaymentParams(params);
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
    return calculateMonthlyPayment(params);
  };

  return { calculatePayment, formatCurrency, calculateAffordablePrice };
}

/**
 * Debounced payment calculator for real-time updates
 */
export function createDebouncedCalculator(delay: number = 300) {
  let timeoutId: NodeJS.Timeout;

  return function debouncedCalculate(
    params: PaymentParams,
    callback: (result: PaymentResult) => void,
  ) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        const result = calculateMonthlyPayment(params);
        callback(result);
      } catch (error) {
        console.error("Payment calculation error:", error);
      }
    }, delay);
  };
}
