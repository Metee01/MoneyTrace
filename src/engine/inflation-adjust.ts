/**
 * Enflasyon Düzeltmesi ve Reel Değer Hesaplama Modülü
 */

/**
 * t. aya kadarki kümülatif enflasyon katsayısını hesaplar.
 * Formül: (1 + r_enflasyon_aylik)^monthIndex
 * 
 * @param monthlyInflationRate Aylık enflasyon oranı (ondalık)
 * @param monthIndex Ay sırası (1'den başlayan t değeri)
 * @returns Kümülatif enflasyon çarpanı (Örn: 1.025)
 */
export function calculateCumulativeInflationFactor(
  monthlyInflationRate: number,
  monthIndex: number
): number {
  if (monthIndex <= 0) return 1.0;
  return Math.pow(1 + monthlyInflationRate, monthIndex);
}

/**
 * Nominal TL değerini kümülatif enflasyona bölerek bugünkü satın alma gücü (Reel Değer) karşılığını hesaplar.
 * Formül: RealValue = NominalValue / KümülatifEnflasyonKatsayısı
 * 
 * @param nominalAmount Nominal TL tutarı
 * @param cumulativeInflationFactor Kümülatif enflasyon çarpanı
 * @returns Reel TL tutarı (t0 bazında satın alma gücü)
 */
export function adjustForInflation(
  nominalAmount: number,
  cumulativeInflationFactor: number
): number {
  if (cumulativeInflationFactor <= 0) return nominalAmount;
  return nominalAmount / cumulativeInflationFactor;
}

/**
 * Enflasyon nedeniyle eriyen satın alma gücü kaybı oranını hesaplar (%).
 * Formül: ((Nominal - Reel) / Nominal) * 100
 * 
 * @param nominalAmount Nominal Değer
 * @param realAmount Reel Değer
 * @returns Satın alma gücü kaybı yüzdesi (%)
 */
export function calculatePurchasingPowerLossRate(
  nominalAmount: number,
  realAmount: number
): number {
  if (nominalAmount <= 0) return 0;
  const loss = nominalAmount - realAmount;
  return Math.max(0, (loss / nominalAmount) * 100);
}
