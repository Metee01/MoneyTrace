/**
 * Compound Interest and DCA Calculation Engine
 */

/**
 * Converts an annual interest/return rate (%) to an effective monthly rate.
 * Formula: (1 + annualRate/100)^(1/12) - 1
 *
 * @param annualRate Expected annual return rate (%)
 * @returns Monthly rate as decimal (e.g., 0.035 for 3.5%)
 */
export function calculateMonthlyRate(annualRate: number): number {
  if (annualRate <= 0) return 0
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1
}

/**
 * Converts an annual percentage rate to its equivalent monthly percentage rate.
 * Formula: ((1 + annualRate/100)^(1/12) - 1) * 100
 *
 * @param annualRatePercent Annual rate (%)
 * @returns Equivalent monthly rate (%)
 */
export function annualPercentToMonthlyPercent(
  annualRatePercent: number,
): number {
  return calculateMonthlyRate(annualRatePercent) * 100
}

/**
 * Converts a monthly percentage rate to its equivalent annual percentage rate.
 * Formula: ((1 + monthlyRate/100)^12 - 1) * 100
 *
 * @param monthlyRatePercent Monthly rate (%)
 * @returns Equivalent annual rate (%)
 */
export function monthlyPercentToAnnualPercent(
  monthlyRatePercent: number,
): number {
  if (monthlyRatePercent <= 0) return 0
  return (Math.pow(1 + monthlyRatePercent / 100, 12) - 1) * 100
}

/**
 * Calculates Dollar-Cost Averaging (DCA) contribution amount for month t.
 * Compounds annual increase rate every 12 months.
 *
 * @param initialDca Initial monthly DCA amount
 * @param annualDcaIncreaseRate Annual DCA increase rate (%)
 * @param monthIndex Month sequence index (1-based)
 * @returns DCA amount to contribute for that month
 */
export function calculateDcaForMonth(
  initialDca: number,
  annualDcaIncreaseRate: number,
  monthIndex: number,
): number {
  if (initialDca <= 0 || monthIndex <= 0) return initialDca

  const yearIndex = Math.floor((monthIndex - 1) / 12)
  if (yearIndex === 0 || annualDcaIncreaseRate === 0) return initialDca

  return initialDca * Math.pow(1 + annualDcaIncreaseRate / 100, yearIndex)
}

/**
 * Step-wise monthly compound growth calculation.
 * Formula: (currentBalance + monthlyDca) * (1 + monthlyReturnRate)
 *
 * @param currentBalance Portfolio balance at start of month
 * @param monthlyDca Additional contribution added at start/during month
 * @param monthlyReturnRate Monthly return rate (decimal)
 * @returns Compounded portfolio balance at end of month
 */
export function calculateCompoundStep(
  currentBalance: number,
  monthlyDca: number,
  monthlyReturnRate: number,
): number {
  const base = Math.max(0, currentBalance) + Math.max(0, monthlyDca)
  return base * (1 + monthlyReturnRate)
}
