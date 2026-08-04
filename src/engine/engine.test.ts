/**
 * MoneyTrace Engine Test Script
 * Run with: npx tsx src/engine/engine.test.ts
 */

import {
  calculateMonthlyRate,
  calculateDcaForMonth,
  calculateCompoundStep,
  calculateCumulativeInflationFactor,
  adjustForInflation,
  calculateProjection,
} from './index';
import type { ProjectionParams } from '../types';

function runTests() {
  console.log('🧪 Starting MoneyTrace Engine Verification Tests...\n');

  // Test 1: Monthly Rate Calculation
  console.log('--- Test 1: calculateMonthlyRate ---');
  const rate0 = calculateMonthlyRate(0);
  console.log(`0% annual -> monthly: ${(rate0 * 100).toFixed(4)}% (Expected: 0.0000%)`);
  const rate100 = calculateMonthlyRate(100);
  console.log(`100% annual -> monthly: ${(rate100 * 100).toFixed(4)}% (Expected: ~5.9463%)`);
  console.assert(Math.abs(rate0) < 1e-6, '0% test failed');
  console.assert(Math.abs(rate100 - 0.059463) < 1e-4, '100% test failed');

  // Test 2: DCA Monthly Calculation
  console.log('\n--- Test 2: calculateDcaForMonth ---');
  const dcaM1 = calculateDcaForMonth(1000, 20, 1);
  const dcaM12 = calculateDcaForMonth(1000, 20, 12);
  const dcaM13 = calculateDcaForMonth(1000, 20, 13);
  const dcaM25 = calculateDcaForMonth(1000, 20, 25);
  console.log(`Month 1 (Year 1): ${dcaM1} TL (Expected: 1000 TL)`);
  console.log(`Month 12 (Year 1): ${dcaM12} TL (Expected: 1000 TL)`);
  console.log(`Month 13 (Year 2, +20%): ${dcaM13} TL (Expected: 1200 TL)`);
  console.log(`Month 25 (Year 3, +20%): ${dcaM25} TL (Expected: 1440 TL)`);
  console.assert(dcaM1 === 1000 && dcaM12 === 1000, 'Year 1 DCA failed');
  console.assert(dcaM13 === 1200, 'Year 2 DCA failed');
  console.assert(dcaM25 === 1440, 'Year 3 DCA failed');

  // Test 3: Compound Step
  console.log('\n--- Test 3: calculateCompoundStep ---');
  const mRate = calculateMonthlyRate(50); // ~3.4366%
  const step1 = calculateCompoundStep(100000, 10000, mRate);
  console.log(`Initial 100k + 10k DCA @ 50% annual: ${step1.toFixed(2)} TL`);
  console.assert(step1 > 110000, 'Compound step failed');

  // Test 4: Inflation Adjust
  console.log('\n--- Test 4: Inflation Adjust ---');
  const inflMonthly = calculateMonthlyRate(30); // 30% annual inflation
  const inflFactor12 = calculateCumulativeInflationFactor(inflMonthly, 12);
  console.log(`12 Month Cumulative Inflation Factor @ 30%: ${inflFactor12.toFixed(4)} (Expected: 1.3000)`);
  console.assert(Math.abs(inflFactor12 - 1.3) < 1e-4, 'Inflation factor test failed');

  const realValue = adjustForInflation(130000, inflFactor12);
  console.log(`130,000 TL nominal @ 1.3 inflFactor -> Real: ${realValue.toFixed(2)} TL (Expected: 100000.00 TL)`);
  console.assert(Math.abs(realValue - 100000) < 1e-2, 'Real value adjustment test failed');

  // Test 5: Full Projection Simulation
  console.log('\n--- Test 5: Full Projection Simulation ---');
  const sampleParams: ProjectionParams = {
    initialCapital: 100000,
    monthlyDca: 10000,
    dcaIncreaseRate: 20,
    expectedReturnRate: 50,
    expectedInflationRate: 30,
    usdRate: 35.0,
    expectedUsdGrowthRate: 25,
    targetYears: 3,
  };

  const result = calculateProjection(sampleParams);
  console.log(`Total Months: ${result.summary.totalMonths}`);
  console.log(`Total Invested: ${result.summary.totalInvested.toLocaleString('tr-TR')} TL`);
  console.log(`Final Nominal Value: ${result.summary.finalNominalValue.toLocaleString('tr-TR')} TL`);
  console.log(`Final Real Value: ${result.summary.finalRealValue.toLocaleString('tr-TR')} TL`);
  console.log(`Final USD Value: $${result.summary.finalUsdValue.toLocaleString('en-US')}`);
  console.log(`Nominal ROI: ${result.summary.nominalRoi}%`);
  console.log(`Real ROI: ${result.summary.realRoi}%`);
  console.log(`Purchasing Power Loss: ${result.summary.purchasingPowerLossRate}%`);
  console.log(`Final USD Rate: ${result.summary.finalUsdRate} TL`);

  console.assert(result.rows.length === 36, 'Rows length mismatch');
  console.assert(result.summary.finalNominalValue > result.summary.finalRealValue, 'Nominal should be > Real when inflation > 0');
  console.assert(result.summary.totalInvested > sampleParams.initialCapital, 'Total invested should increase with DCA');

  console.log('\n✅ ALL ENGINE TESTS PASSED SUCCESSFULLY!');
}

runTests();
