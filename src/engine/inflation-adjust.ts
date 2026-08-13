/**
 * Inflation Adjustment and Real Value Calculation Engine
 */

/**
 * Calculates cumulative inflation multiplier for month t.
 * Formula: (1 + monthlyInflationRate)^monthIndex
 *
 * @param monthlyInflationRate Monthly inflation rate (decimal)
 * @param monthIndex Month sequence index (1-based)
 * @returns Cumulative inflation factor
 */
export function calculateCumulativeInflationFactor(
  monthlyInflationRate: number,
  monthIndex: number,
): number {
  if (monthIndex <= 0 || monthlyInflationRate <= 0) return 1
  return Math.pow(1 + monthlyInflationRate, monthIndex)
}

/**
 * Calculates inflation-adjusted purchasing power (Real Value).
 * Formula: RealValue = NominalValue / CumulativeInflationFactor
 *
 * @param nominalAmount Nominal value
 * @param cumulativeInflationFactor Cumulative inflation multiplier at month t
 * @returns Real value (purchasing power in t0 terms)
 */
export function adjustForInflation(
  nominalAmount: number,
  cumulativeInflationFactor: number,
): number {
  if (cumulativeInflationFactor <= 0) return nominalAmount
  return nominalAmount / cumulativeInflationFactor
}

/**
 * Calculates purchasing power erosion percentage due to inflation.
 * Formula: ((Nominal - Real) / Nominal) * 100
 *
 * @param nominalValue Final nominal value
 * @param realValue Final real value
 * @returns Purchasing power loss percentage
 */
export function calculatePurchasingPowerLossRate(
  nominalValue: number,
  realValue: number,
): number {
  if (nominalValue <= 0 || realValue >= nominalValue) return 0
  return ((nominalValue - realValue) / nominalValue) * 100
}

/**
 * Calculates the maximum safe withdrawal amount from monthly nominal return
 * that preserves the principal's real purchasing power against inflation.
 * Formula: baseCapital * max(0, monthlyReturnRate - monthlyInflationRate)
 *
 * @param baseCapital Capital balance before applying return (current balance + DCA)
 * @param monthlyReturnRate Monthly return rate (decimal)
 * @param monthlyInflationRate Monthly inflation rate (decimal)
 * @returns Safe withdrawal amount (Nominal)
 */
export function calculateSafeWithdrawal(
  baseCapital: number,
  monthlyReturnRate: number,
  monthlyInflationRate: number,
): number {
  if (baseCapital <= 0 || monthlyReturnRate <= monthlyInflationRate) return 0
  return baseCapital * (monthlyReturnRate - monthlyInflationRate)
}
