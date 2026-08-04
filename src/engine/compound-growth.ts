/**
 * Bileşik Büyüme ve Düzenli Yatırım (DCA) Hesaplama Modülü
 */

/**
 * Yıllık yüzde oranı efektif aylık bileşik orana çevirir.
 * Formül: r_aylik = (1 + r_yillik / 100)^(1/12) - 1
 * 
 * @param annualRatePercentage Yıllık oran (%) - Örn: 50 (%50 için)
 * @returns Aylık ondalık oran - Örn: 0.0343
 */
export function calculateMonthlyRate(annualRatePercentage: number): number {
  if (annualRatePercentage <= -100) return -1;
  return Math.pow(1 + annualRatePercentage / 100, 1 / 12) - 1;
}

/**
 * Belirli bir aydaki DCA (Düzenli Yatırım) miktarını hesaplar.
 * DCA tutarı her 12 ayda bir (her yeni yıl başında) verilen yıllık artış oranında güncellenir.
 * 
 * @param initialDca Başlangıçtaki aylık DCA miktarı (TL)
 * @param dcaIncreaseRatePercentage Yıllık DCA artış oranı (%) - Örn: 30
 * @param monthIndex Ay sırası (1'den başlayan t değeri)
 * @returns O ay yatırılacak DCA miktarı (TL)
 */
export function calculateDcaForMonth(
  initialDca: number,
  dcaIncreaseRatePercentage: number,
  monthIndex: number
): number {
  if (monthIndex < 1) return initialDca;
  const yearOffset = Math.floor((monthIndex - 1) / 12);
  const factor = Math.pow(1 + dcaIncreaseRatePercentage / 100, yearOffset);
  return Math.round(initialDca * factor * 100) / 100;
}

/**
 * Tek bir ay için bileşik büyüme adımını hesaplar.
 * Ay başı DCA katkısı eklenip ay sonundaki getiri ile değer hesaplanır.
 * 
 * @param currentNominalValue Ay başındaki portföy değeri
 * @param monthlyDca O ay eklenen DCA miktarı
 * @param monthlyReturnRate Aylık getiri oranı (ondalık)
 * @returns Ay sonundaki yeni nominal portföy değeri
 */
export function calculateCompoundStep(
  currentNominalValue: number,
  monthlyDca: number,
  monthlyReturnRate: number
): number {
  const startOfMonthValue = currentNominalValue + monthlyDca;
  const endOfMonthValue = startOfMonthValue * (1 + monthlyReturnRate);
  return Math.max(0, endOfMonthValue);
}
