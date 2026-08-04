/**
 * MoneyTrace - Ana Projeksiyon Hesaplama Motoru
 */

import type {
  ProjectionParams,
  ProjectionResult,
  ProjectionRow,
  ProjectionSummary,
} from '../types';
import {
  calculateMonthlyRate,
  calculateDcaForMonth,
  calculateCompoundStep,
} from './compound-growth';
import {
  calculateCumulativeInflationFactor,
  adjustForInflation,
  calculatePurchasingPowerLossRate,
} from './inflation-adjust';
import { predictUsdRate, convertToUsd } from './currency-convert';

export * from './compound-growth';
export * from './inflation-adjust';
export * from './currency-convert';

/**
 * Verilen portföy girdi parametrelerine göre ay-ay projeksiyon tablosu ve özet metrikleri hesaplar.
 * 
 * @param params Projeksiyon girdi parametreleri
 * @returns Projeksiyon sonuç nesnesi (rows + summary)
 */
export function calculateProjection(params: ProjectionParams): ProjectionResult {
  const targetYears = Math.max(1, Math.min(50, params.targetYears || 1));
  const totalMonths = targetYears * 12;

  const monthlyReturnRate = calculateMonthlyRate(params.expectedReturnRate || 0);
  const monthlyInflationRate = calculateMonthlyRate(params.expectedInflationRate || 0);
  const monthlyUsdGrowthRate = calculateMonthlyRate(params.expectedUsdGrowthRate || 0);

  let currentNominalValue = Math.max(0, params.initialCapital || 0);
  let totalInvested = Math.max(0, params.initialCapital || 0);
  let realTotalInvested = Math.max(0, params.initialCapital || 0);

  const rows: ProjectionRow[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    const yearIndex = Math.ceil(month / 12);
    const monthInYear = ((month - 1) % 12) + 1;

    // O ayki DCA miktarını hesapla (yıllık artış kurallarına göre)
    const monthlyDca = calculateDcaForMonth(
      params.monthlyDca || 0,
      params.dcaIncreaseRate || 0,
      month
    );

    // Kümülatif enflasyon katsayısı (t. aydaki kümülatif enflasyon)
    const cumInflation = calculateCumulativeInflationFactor(monthlyInflationRate, month);

    // Anaparaya DCA ekle (Nominal)
    totalInvested += monthlyDca;

    // Anaparaya DCA ekle (Reel: O aydaki katkının t0 satın alma gücü cinsinden karşılığı)
    realTotalInvested += cumInflation > 0 ? monthlyDca / cumInflation : monthlyDca;

    // Portföyün bileşik büyümesi
    currentNominalValue = calculateCompoundStep(
      currentNominalValue,
      monthlyDca,
      monthlyReturnRate
    );

    // Reel değer hesabı (Nominal değer / kümülatif enflasyon)
    const realValue = adjustForInflation(currentNominalValue, cumInflation);

    // USD kuru ve USD değer hesabı
    const currentUsdRate = predictUsdRate(
      params.usdRate || 1,
      monthlyUsdGrowthRate,
      month
    );
    const usdValue = convertToUsd(currentNominalValue, currentUsdRate);

    // Kar / Zarar hesaplamaları
    const nominalProfit = currentNominalValue - totalInvested;
    // Reel Kar: Reel Portföy Değeri - Yatırılan Anaparanın Reel Karşılığı
    const realProfit = realValue - realTotalInvested;

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
    });
  }

  const finalRow = rows[rows.length - 1];
  const finalNominalValue = finalRow ? finalRow.nominalValue : params.initialCapital;
  const finalRealValue = finalRow ? finalRow.realValue : params.initialCapital;
  const finalUsdValue = finalRow
    ? finalRow.usdValue
    : convertToUsd(params.initialCapital, params.usdRate);

  const totalNominalProfit = finalNominalValue - totalInvested;
  const totalRealProfit = finalRealValue - realTotalInvested;

  const nominalRoi =
    totalInvested > 0 ? (totalNominalProfit / totalInvested) * 100 : 0;
  const realRoi =
    realTotalInvested > 0 ? (totalRealProfit / realTotalInvested) * 100 : 0;

  const purchasingPowerLossRate = calculatePurchasingPowerLossRate(
    finalNominalValue,
    finalRealValue
  );
  const finalUsdRate = finalRow ? finalRow.usdRate : params.usdRate;

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
  };

  return {
    rows,
    summary,
  };
}
