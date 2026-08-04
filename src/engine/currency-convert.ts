/**
 * Döviz Dönüşümü ve Dolar Kuru Projeksiyon Modülü
 */

/**
 * t. aydaki tahmini USD/TRY kurunu hesaplar.
 * Formül: UsdRate_t = UsdRate_0 * (1 + r_usd_aylik)^monthIndex
 * 
 * @param initialUsdRate Başlangıçtaki USD/TRY kuru (TL)
 * @param monthlyUsdGrowthRate Aylık USD kur artış oranı (ondalık)
 * @param monthIndex Ay sırası (1'den başlayan t değeri)
 * @returns t. aydaki tahmini USD kuru
 */
export function predictUsdRate(
  initialUsdRate: number,
  monthlyUsdGrowthRate: number,
  monthIndex: number
): number {
  if (monthIndex <= 0 || initialUsdRate <= 0) return initialUsdRate;
  return initialUsdRate * Math.pow(1 + monthlyUsdGrowthRate, monthIndex);
}

/**
 * Nominal TL tutarını verilen USD kuruna bölerek Amerikan Doları cinsinden karşılığını hesaplar.
 * 
 * @param nominalTryAmount TL cinsinden tutar
 * @param usdRate O aydaki USD/TRY kuru
 * @returns USD cinsinden tutar ($)
 */
export function convertToUsd(nominalTryAmount: number, usdRate: number): number {
  if (usdRate <= 0) return 0;
  return nominalTryAmount / usdRate;
}
