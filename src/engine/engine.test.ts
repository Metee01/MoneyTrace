/**
 * MoneyTrace Engine Test Script
 * Run with: npx tsx src/engine/engine.test.ts
 */

import {
  calculateMonthlyRate,
  annualPercentToMonthlyPercent,
  monthlyPercentToAnnualPercent,
  calculateDcaForMonth,
  calculateCompoundStep,
  calculateCumulativeInflationFactor,
  adjustForInflation,
  calculateSafeWithdrawal,
  calculateProjection,
  calculateWithdrawalTax,
} from "./index"
import type { ProjectionParams } from "../types"

function runTests() {
  console.log("🧪 Starting MoneyTrace Engine Verification Tests...\n")

  // Test 1: Monthly Rate Calculation
  console.log("--- Test 1: calculateMonthlyRate ---")
  const rate0 = calculateMonthlyRate(0)
  console.log(
    `0% annual -> monthly: ${(rate0 * 100).toFixed(4)}% (Expected: 0.0000%)`,
  )
  const rate100 = calculateMonthlyRate(100)
  console.log(
    `100% annual -> monthly: ${(rate100 * 100).toFixed(4)}% (Expected: ~5.9463%)`,
  )
  console.assert(Math.abs(rate0) < 1e-6, "0% test failed")
  console.assert(Math.abs(rate100 - 0.059463) < 1e-4, "100% test failed")

  // Test 2: DCA Monthly Calculation
  console.log("\n--- Test 2: calculateDcaForMonth ---")
  const dcaM1 = calculateDcaForMonth(1000, 20, 1)
  const dcaM12 = calculateDcaForMonth(1000, 20, 12)
  const dcaM13 = calculateDcaForMonth(1000, 20, 13)
  const dcaM25 = calculateDcaForMonth(1000, 20, 25)
  console.log(`Month 1 (Year 1): ${dcaM1} TL (Expected: 1000 TL)`)
  console.log(`Month 12 (Year 1): ${dcaM12} TL (Expected: 1000 TL)`)
  console.log(`Month 13 (Year 2, +20%): ${dcaM13} TL (Expected: 1200 TL)`)
  console.log(`Month 25 (Year 3, +20%): ${dcaM25} TL (Expected: 1440 TL)`)
  console.assert(dcaM1 === 1000 && dcaM12 === 1000, "Year 1 DCA failed")
  console.assert(dcaM13 === 1200, "Year 2 DCA failed")
  console.assert(dcaM25 === 1440, "Year 3 DCA failed")

  // Test 3: Compound Step
  console.log("\n--- Test 3: calculateCompoundStep ---")
  const mRate = calculateMonthlyRate(50) // ~3.4366%
  const step1 = calculateCompoundStep(100000, 10000, mRate)
  console.log(`Initial 100k + 10k DCA @ 50% annual: ${step1.toFixed(2)} TL`)
  console.assert(step1 > 110000, "Compound step failed")

  // Test 4: Inflation Adjust & Safe Withdrawal
  console.log("\n--- Test 4: Inflation Adjust & Safe Withdrawal ---")
  const inflMonthly = calculateMonthlyRate(30) // 30% annual inflation (~2.2104% monthly)
  const inflFactor12 = calculateCumulativeInflationFactor(inflMonthly, 12)
  console.log(
    `12 Month Cumulative Inflation Factor @ 30%: ${inflFactor12.toFixed(4)} (Expected: 1.3000)`,
  )
  console.assert(
    Math.abs(inflFactor12 - 1.3) < 1e-4,
    "Inflation factor test failed",
  )

  const realValue = adjustForInflation(130000, inflFactor12)
  console.log(
    `130,000 TL nominal @ 1.3 inflFactor -> Real: ${realValue.toFixed(2)} TL (Expected: 100000.00 TL)`,
  )
  console.assert(
    Math.abs(realValue - 100000) < 1e-2,
    "Real value adjustment test failed",
  )

  // Safe Withdrawal Test: 3.4366% return vs 2.2104% inflation on 100k capital
  const safeW = calculateSafeWithdrawal(100000, mRate, inflMonthly)
  console.log(
    `Safe withdrawal on 100k @ 50% return vs 30% infl: ${safeW.toFixed(2)} TL`,
  )
  console.assert(
    safeW > 0,
    "Safe withdrawal should be positive when return > inflation",
  )
  const zeroSafeW = calculateSafeWithdrawal(100000, 0.01, 0.02)
  console.assert(
    zeroSafeW === 0,
    "Safe withdrawal should be 0 when return <= inflation",
  )

  // Test 5: Full Projection Simulation
  console.log("\n--- Test 5: Full Projection Simulation ---")
  const sampleParams: ProjectionParams = {
    initialCapital: 100000,
    monthlyDca: 10000,
    dcaIncreaseRate: 20,
    expectedReturnRate: 50,
    expectedInflationRate: 30,
    usdRate: 35.0,
    expectedUsdGrowthRate: 25,
    targetYears: 3,
  }

  const result = calculateProjection(sampleParams)
  console.log(`Total Months: ${result.summary.totalMonths}`)
  console.log(
    `Total Invested: ${result.summary.totalInvested.toLocaleString("tr-TR")} TL`,
  )
  console.log(
    `Final Nominal Value: ${result.summary.finalNominalValue.toLocaleString("tr-TR")} TL`,
  )
  console.log(
    `Final Real Value: ${result.summary.finalRealValue.toLocaleString("tr-TR")} TL`,
  )
  console.log(
    `Total Safe Withdrawal (Nominal): ${result.summary.totalSafeWithdrawal.toLocaleString("tr-TR")} TL`,
  )
  console.log(
    `Total Safe Withdrawal (Real): ${result.summary.totalRealSafeWithdrawal.toLocaleString("tr-TR")} TL`,
  )
  console.log(
    `Final USD Value: $${result.summary.finalUsdValue.toLocaleString("en-US")}`,
  )
  console.log(`Nominal ROI: ${result.summary.nominalRoi}%`)
  console.log(`Real ROI: ${result.summary.realRoi}%`)
  console.log(
    `Purchasing Power Loss: ${result.summary.purchasingPowerLossRate}%`,
  )
  console.log(`Final USD Rate: ${result.summary.finalUsdRate} TL`)

  console.assert(result.rows.length === 36, "Rows length mismatch")
  console.assert(
    result.summary.totalSafeWithdrawal > 0,
    "Total safe withdrawal should be > 0",
  )
  console.assert(
    result.summary.finalNominalValue > result.summary.finalRealValue,
    "Nominal should be > Real when inflation > 0",
  )
  console.assert(
    result.summary.totalInvested > sampleParams.initialCapital,
    "Total invested should increase with DCA",
  )

  // Test 6: Annual <-> Monthly Rate Conversion Helpers
  console.log("\n--- Test 6: Rate Conversion Helpers ---")
  const monthlyFromAnnual = annualPercentToMonthlyPercent(12)
  console.log(
    `12% annual -> monthly: ${monthlyFromAnnual.toFixed(4)}% (Expected: ~0.9489%)`,
  )
  console.assert(
    Math.abs(monthlyFromAnnual - 0.948879) < 1e-3,
    "Annual to monthly conversion failed",
  )
  const annualFromMonthly = monthlyPercentToAnnualPercent(monthlyFromAnnual)
  console.log(
    `Round trip back to annual: ${annualFromMonthly.toFixed(4)}% (Expected: ~12.0000%)`,
  )
  console.assert(
    Math.abs(annualFromMonthly - 12) < 1e-6,
    "Monthly to annual round trip failed",
  )

  // Test 7: Monthly Input Mode Projection (rates used directly, no conversion)
  console.log("\n--- Test 7: Monthly Input Mode Projection ---")
  const monthlyParams: ProjectionParams = {
    initialCapital: 1000,
    monthlyDca: 0,
    dcaIncreaseRate: 0,
    expectedReturnRate: 1, // 1% monthly
    expectedInflationRate: 0.5, // 0.5% monthly
    usdRate: 35,
    expectedUsdGrowthRate: 1, // 1% monthly
    targetYears: 1,
    rateInputPeriod: "monthly",
  }
  const monthlyResult = calculateProjection(monthlyParams)
  const expectedFinal = 1000 * Math.pow(1.01, 12)
  const expectedReal = expectedFinal / Math.pow(1.005, 12)
  const expectedUsdRate = 35 * Math.pow(1.01, 12)
  console.log(
    `Final Nominal: ${monthlyResult.summary.finalNominalValue} (Expected: ~${expectedFinal.toFixed(2)})`,
  )
  console.log(
    `Final Real: ${monthlyResult.summary.finalRealValue} (Expected: ~${expectedReal.toFixed(2)})`,
  )
  console.log(
    `Final USD Rate: ${monthlyResult.summary.finalUsdRate} (Expected: ~${expectedUsdRate.toFixed(2)})`,
  )
  console.assert(
    Math.abs(monthlyResult.summary.finalNominalValue - expectedFinal) < 1,
    "Monthly nominal value mismatch",
  )
  console.assert(
    Math.abs(monthlyResult.summary.finalRealValue - expectedReal) < 1,
    "Monthly real value mismatch",
  )
  console.assert(
    Math.abs(monthlyResult.summary.finalUsdRate - expectedUsdRate) < 0.5,
    "Monthly usd rate mismatch",
  )

  // Test 8: Annual vs Monthly Mode Equivalence
  console.log("\n--- Test 8: Annual/Monthly Mode Equivalence ---")
  const annualParams: ProjectionParams = {
    ...monthlyParams,
    rateInputPeriod: "annual",
    expectedReturnRate: monthlyPercentToAnnualPercent(1),
    expectedInflationRate: monthlyPercentToAnnualPercent(0.5),
    expectedUsdGrowthRate: monthlyPercentToAnnualPercent(1),
  }
  const annualResult = calculateProjection(annualParams)
  console.log(
    `Annual mode final: ${annualResult.summary.finalNominalValue}, Monthly mode final: ${monthlyResult.summary.finalNominalValue}`,
  )
  console.assert(
    Math.abs(
      annualResult.summary.finalNominalValue -
        monthlyResult.summary.finalNominalValue,
    ) < 1,
    "Annual/Monthly mode equivalence failed",
  )

  // Test 9: Monthly Cash Withdrawal Simulation
  console.log("\n--- Test 9: Monthly Cash Withdrawal Simulation ---")
  const withdrawalParams: ProjectionParams = {
    initialCapital: 10000,
    monthlyDca: 0,
    dcaIncreaseRate: 0,
    monthlyWithdrawal: 200,
    expectedReturnRate: 0,
    expectedInflationRate: 0,
    usdRate: 1,
    expectedUsdGrowthRate: 0,
    targetYears: 1,
    rateInputPeriod: "monthly",
  }
  const withdrawalResult = calculateProjection(withdrawalParams)
  console.log(
    `Withdrawal result final nominal: ${withdrawalResult.summary.finalNominalValue} (Expected: 7600)`,
  )
  console.log(
    `Total withdrawals: ${withdrawalResult.summary.totalWithdrawals} (Expected: 2400)`,
  )
  console.assert(
    withdrawalResult.summary.finalNominalValue === 7600,
    "Final nominal after withdrawal mismatch",
  )
  console.assert(
    withdrawalResult.summary.totalWithdrawals === 2400,
    "Total withdrawals mismatch",
  )

  // Test 10: Tax Deduction & Profit Tracking on Withdrawal
  console.log(
    "\n--- Test 10: Tax Deduction & Profit Tracking on Withdrawal ---",
  )
  const taxParams: ProjectionParams = {
    initialCapital: 10000,
    monthlyDca: 0,
    dcaIncreaseRate: 0,
    monthlyWithdrawal: 1000, // 1000 TL withdrawal
    expectedReturnRate: 10, // 10% annual return
    expectedInflationRate: 0,
    usdRate: 1,
    expectedUsdGrowthRate: 0,
    targetYears: 1,
    withholdingTaxRate: 10, // 10% withholding tax on withdrawal profit
  }
  const taxResult = calculateProjection(taxParams)
  console.log(
    `Total Withholding Tax Paid: ${taxResult.summary.totalWithholdingTax} TL`,
  )
  console.log(
    `Total Net Withdrawals: ${taxResult.summary.totalNetWithdrawals} TL`,
  )
  console.assert(
    taxResult.summary.totalWithholdingTax > 0,
    "Withholding tax should be > 0 on withdrawal when in profit",
  )
  console.assert(
    taxResult.summary.totalNetWithdrawals > 0,
    "Total net withdrawals should be > 0",
  )

  const row1 = taxResult.rows[0]
  console.log(
    `Month 1 Gross Withdrawal: ${row1.withdrawal} TL, Stopaj: ${row1.withholdingTax} TL, Net: ${row1.netWithdrawal} TL`,
  )
  console.assert(
    row1.netWithdrawal === row1.withdrawal - row1.withholdingTax,
    "Month 1 net withdrawal should equal gross withdrawal minus withholding tax",
  )

  // Test 11: Withdrawal Tax (Stopaj) Calculator
  console.log("\n--- Test 11: Withdrawal Tax (Stopaj) Calculator ---")

  // Case 1: Profitable portfolio — 100k nominal, 60k invested, 15% tax
  const taxCalc1 = calculateWithdrawalTax(50000, 100000, 60000, 15)
  console.log(`Profit Ratio: ${taxCalc1.profitRatio} (Expected: 0.4)`)
  console.log(`Profit Portion: ${taxCalc1.profitPortion} (Expected: 20000)`)
  console.log(`Tax Amount: ${taxCalc1.taxAmount} (Expected: 3000)`)
  console.log(`Net Amount: ${taxCalc1.netAmount} (Expected: 47000)`)
  console.assert(taxCalc1.profitRatio === 0.4, "Profit ratio should be 0.4")
  console.assert(
    taxCalc1.profitPortion === 20000,
    "Profit portion should be 20000",
  )
  console.assert(taxCalc1.taxAmount === 3000, "Tax amount should be 3000")
  console.assert(taxCalc1.netAmount === 47000, "Net amount should be 47000")

  // Case 2: Loss position — no tax applied
  const taxCalc2 = calculateWithdrawalTax(5000, 8000, 10000, 15)
  console.log(`Loss position tax: ${taxCalc2.taxAmount} (Expected: 0)`)
  console.assert(
    taxCalc2.profitRatio === 0,
    "Loss position profit ratio should be 0",
  )
  console.assert(taxCalc2.taxAmount === 0, "Loss position tax should be 0")
  console.assert(
    taxCalc2.netAmount === 5000,
    "Loss position net should equal withdrawal",
  )

  // Case 3: Withdrawal exceeds portfolio value — clamped
  const taxCalc3 = calculateWithdrawalTax(200000, 100000, 60000, 15)
  console.log(
    `Clamped withdrawal: ${taxCalc3.withdrawalAmount} (Expected: 100000)`,
  )
  console.assert(
    taxCalc3.withdrawalAmount === 100000,
    "Withdrawal should be clamped to nominal",
  )

  // Case 4: Zero tax rate
  const taxCalc4 = calculateWithdrawalTax(50000, 100000, 60000, 0)
  console.assert(taxCalc4.taxAmount === 0, "Zero rate should yield zero tax")
  console.assert(
    taxCalc4.netAmount === 50000,
    "Zero rate net should equal withdrawal",
  )

  console.log("\n✅ ALL ENGINE TESTS PASSED SUCCESSFULLY!")
}

runTests()
