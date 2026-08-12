/**
 * MoneyTrace - Main Projection Calculation Engine
 */

import type {
  ProjectionParams,
  ProjectionResult,
  ProjectionRow,
  ProjectionSummary,
} from "../types"
import {
  calculateMonthlyRate,
  calculateDcaForMonth,
  calculateCompoundStep,
} from "./compound-growth"
import {
  calculateCumulativeInflationFactor,
  adjustForInflation,
  calculatePurchasingPowerLossRate,
  calculateSafeWithdrawal,
} from "./inflation-adjust"
import { predictUsdRate, convertToUsd } from "./currency-convert"

export * from "./compound-growth"
export * from "./inflation-adjust"
export * from "./currency-convert"

/**
 * Calculates monthly projection table and summary metrics based on portfolio parameters.
 *
 * @param params Projection input parameters
 * @returns Projection result object (rows + summary)
 */
export function calculateProjection(
  params: ProjectionParams,
): ProjectionResult {
  const targetYears = Math.max(1, Math.min(50, params.targetYears || 1))
  const totalMonths = targetYears * 12

  // Rates are entered either as annual percentages (converted to effective
  // monthly rates) or as monthly percentages (used directly - lossless).
  const isMonthlyInput = params.rateInputPeriod === "monthly"
  const toMonthlyRate = (annualRate: number) =>
    isMonthlyInput ? annualRate / 100 : calculateMonthlyRate(annualRate)

  const monthlyReturnRate = toMonthlyRate(params.expectedReturnRate || 0)
  const monthlyInflationRate = toMonthlyRate(params.expectedInflationRate || 0)
  const monthlyUsdGrowthRate = toMonthlyRate(params.expectedUsdGrowthRate || 0)

  let currentNominalValue = Math.max(0, params.initialCapital || 0)
  let totalInvested = Math.max(0, params.initialCapital || 0)
  let realTotalInvested = Math.max(0, params.initialCapital || 0)
  let totalSafeWithdrawal = 0
  let totalRealSafeWithdrawal = 0
  let totalWithdrawals = 0
  let totalRealWithdrawals = 0

  const plannedWithdrawal = Math.max(0, params.monthlyWithdrawal || 0)

  const rows: ProjectionRow[] = []

  for (let month = 1; month <= totalMonths; month++) {
    const yearIndex = Math.ceil(month / 12)
    const monthInYear = ((month - 1) % 12) + 1

    // Monthly DCA contribution for this period
    const monthlyDca = calculateDcaForMonth(
      params.monthlyDca || 0,
      params.dcaIncreaseRate || 0,
      month,
    )

    // Cumulative inflation factor at month t
    const cumInflation = calculateCumulativeInflationFactor(
      monthlyInflationRate,
      month,
    )

    // Capital base before return step
    const capitalBase = currentNominalValue + monthlyDca

    // Inflation-protected safe withdrawal amount for this month
    const safeWithdrawal = calculateSafeWithdrawal(
      capitalBase,
      monthlyReturnRate,
      monthlyInflationRate,
    )
    const realSafeWithdrawal = adjustForInflation(safeWithdrawal, cumInflation)

    totalSafeWithdrawal += safeWithdrawal
    totalRealSafeWithdrawal += realSafeWithdrawal

    // Cumulative nominal invested capital
    totalInvested += monthlyDca

    // Cumulative real invested capital (DCA contribution converted to t0 purchasing power)
    realTotalInvested +=
      cumInflation > 0 ? monthlyDca / cumInflation : monthlyDca

    // Portfolio compound growth step
    currentNominalValue = calculateCompoundStep(
      currentNominalValue,
      monthlyDca,
      monthlyReturnRate,
    )

    // Monthly cash withdrawal step
    const actualWithdrawal = Math.min(currentNominalValue, plannedWithdrawal)
    currentNominalValue -= actualWithdrawal

    totalWithdrawals += actualWithdrawal
    totalRealWithdrawals +=
      cumInflation > 0 ? actualWithdrawal / cumInflation : actualWithdrawal

    // Real purchasing power calculation
    const realValue = adjustForInflation(currentNominalValue, cumInflation)

    // Reference currency exchange rate and value calculation
    const currentUsdRate = predictUsdRate(
      params.usdRate || 1,
      monthlyUsdGrowthRate,
      month,
    )
    const usdValue = convertToUsd(currentNominalValue, currentUsdRate)

    // Profit / Loss calculations
    const nominalProfit = currentNominalValue - totalInvested
    const realProfit = realValue - realTotalInvested

    rows.push({
      month,
      yearIndex,
      monthInYear,
      monthlyDca: Math.round(monthlyDca * 100) / 100,
      totalInvested: Math.round(totalInvested * 100) / 100,
      realTotalInvested: Math.round(realTotalInvested * 100) / 100,
      nominalValue: Math.round(currentNominalValue * 100) / 100,
      realValue: Math.round(realValue * 100) / 100,
      usdValue: Math.round(usdValue * 100) / 100,
      cumulativeInflationFactor: Math.round(cumInflation * 10000) / 10000,
      usdRate: Math.round(currentUsdRate * 100) / 100,
      nominalProfit: Math.round(nominalProfit * 100) / 100,
      realProfit: Math.round(realProfit * 100) / 100,
      safeWithdrawal: Math.round(safeWithdrawal * 100) / 100,
      realSafeWithdrawal: Math.round(realSafeWithdrawal * 100) / 100,
      withdrawal: Math.round(actualWithdrawal * 100) / 100,
    })
  }

  const finalRow = rows[rows.length - 1]
  const finalNominalValue = finalRow
    ? finalRow.nominalValue
    : params.initialCapital
  const finalRealValue = finalRow ? finalRow.realValue : params.initialCapital
  const finalUsdValue = finalRow
    ? finalRow.usdValue
    : convertToUsd(params.initialCapital, params.usdRate)

  const totalNominalProfit = finalNominalValue - totalInvested
  const totalRealProfit = finalRealValue - realTotalInvested

  const nominalRoi =
    totalInvested > 0 ? (totalNominalProfit / totalInvested) * 100 : 0
  const realRoi =
    realTotalInvested > 0 ? (totalRealProfit / realTotalInvested) * 100 : 0

  const purchasingPowerLossRate = calculatePurchasingPowerLossRate(
    finalNominalValue,
    finalRealValue,
  )
  const finalUsdRate = finalRow ? finalRow.usdRate : params.usdRate

  const summary: ProjectionSummary = {
    totalMonths,
    totalInvested: Math.round(totalInvested * 100) / 100,
    realTotalInvested: Math.round(realTotalInvested * 100) / 100,
    finalNominalValue: Math.round(finalNominalValue * 100) / 100,
    finalRealValue: Math.round(finalRealValue * 100) / 100,
    finalUsdValue: Math.round(finalUsdValue * 100) / 100,
    totalNominalProfit: Math.round(totalNominalProfit * 100) / 100,
    totalRealProfit: Math.round(totalRealProfit * 100) / 100,
    nominalRoi: Math.round(nominalRoi * 100) / 100,
    realRoi: Math.round(realRoi * 100) / 100,
    purchasingPowerLossRate: Math.round(purchasingPowerLossRate * 100) / 100,
    finalUsdRate: Math.round(finalUsdRate * 100) / 100,
    totalSafeWithdrawal: Math.round(totalSafeWithdrawal * 100) / 100,
    totalRealSafeWithdrawal: Math.round(totalRealSafeWithdrawal * 100) / 100,
    totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
    totalRealWithdrawals: Math.round(totalRealWithdrawals * 100) / 100,
  }

  return {
    rows,
    summary,
  }
}
