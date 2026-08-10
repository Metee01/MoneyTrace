/**
 * Currency Conversion and Exchange Rate Projection Module
 */

/**
 * Predicts the exchange rate for month t.
 * Formula: Rate_t = Rate_0 * (1 + monthlyGrowthRate)^monthIndex
 *
 * @param initialUsdRate Starting exchange rate to reference currency
 * @param monthlyUsdGrowthRate Monthly exchange rate growth rate (decimal)
 * @param monthIndex Month sequence index (1-based)
 * @returns Estimated exchange rate at month t
 */
export function predictUsdRate(
  initialUsdRate: number,
  monthlyUsdGrowthRate: number,
  monthIndex: number,
): number {
  if (monthIndex <= 0 || initialUsdRate <= 0) return initialUsdRate
  return initialUsdRate * Math.pow(1 + monthlyUsdGrowthRate, monthIndex)
}

/**
 * Converts nominal local currency amount into reference currency (USD) equivalent.
 *
 * @param nominalTryAmount Local currency amount
 * @param usdRate Exchange rate for that month
 * @returns Amount in reference currency ($)
 */
export function convertToUsd(
  nominalTryAmount: number,
  usdRate: number,
): number {
  if (usdRate <= 0) return 0
  return nominalTryAmount / usdRate
}
