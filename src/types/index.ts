/**
 * MoneyTrace - TypeScript Tip Tanımlamaları
 */

/**
 * Hesaplama Motoru Girdi Parametreleri
 */
export interface ProjectionParams {
  /** Başlangıç Sermayesi (TL) */
  initialCapital: number;
  /** Aylık Düzenli Yatırım Miktarı (TL) */
  monthlyDca: number;
  /** Yıllık DCA Artış Oranı (%) - Örn: %30 enflasyon korumalı artış için 30 */
  dcaIncreaseRate: number;
  /** Tahmini Yıllık Portföy Getirisi (%) */
  expectedReturnRate: number;
  /** Tahmini Yıllık Enflasyon Oranı (%) */
  expectedInflationRate: number;
  /** Başlangıç USD/TRY Kuru */
  usdRate: number;
  /** Tahmini Yıllık USD Kur Artış Oranı (%) */
  expectedUsdGrowthRate: number;
  /** Projeksiyon Vadesi (Yıl Cinsinden) */
  targetYears: number;
}

/**
 * Aylık Projeksiyon Satır Verisi
 */
export interface ProjectionRow {
  /** Toplam Ay Sırası (1, 2, 3... N) */
  month: number;
  /** Kaçıncı Yıl (1, 2... Y) */
  yearIndex: number;
  /** Yıl İçindeki Ay (1 - 12) */
  monthInYear: number;
  /** O Ay Yapılan DCA Yatırım Miktarı (TL) */
  monthlyDca: number;
  /** O Aya Kadar Yatırılan Toplam Nominal Anapara (TL) */
  totalInvested: number;
  /** O Aya Kadar Yatırılan Anaparanın t0 Bazındaki Reel Karşılığı (TL) */
  realTotalInvested: number;
  /** O Ay Sonundaki Portföy Nominal Değeri (TL) */
  nominalValue: number;
  /** O Ay Sonundaki Portföy Enflasyondan Arındırılmış Reel Değeri (TL) */
  realValue: number;
  /** O Ay Sonundaki Portföy USD Değeri ($) */
  usdValue: number;
  /** O Aya Kadarki Kümülatif Enflasyon Katsayısı */
  cumulativeInflationFactor: number;
  /** O Aydaki Tahmini USD/TRY Kuru */
  usdRate: number;
  /** O Aydaki Nominal Kar/Zarar Miktarı (TL) */
  nominalProfit: number;
  /** O Aydaki Reel Kar/Zarar Miktarı (TL) */
  realProfit: number;
}

/**
 * Projeksiyon Sonuç Özet Metrikleri
 */
export interface ProjectionSummary {
  /** Toplam Süre (Ay Cinsinden) */
  totalMonths: number;
  /** Toplam Yatırılan Nominal Anapara (TL) */
  totalInvested: number;
  /** Toplam Yatırılan Anaparanın t0 Bazındaki Reel Karşılığı (TL) */
  realTotalInvested: number;
  /** Vade Sonundaki Portföy Nominal Değeri (TL) */
  finalNominalValue: number;
  /** Vade Sonundaki Portföy Reel Değeri (TL) */
  finalRealValue: number;
  /** Vade Sonundaki Portföy USD Değeri ($) */
  finalUsdValue: number;
  /** Toplam Nominal Kar/Zarar (TL) */
  totalNominalProfit: number;
  /** Toplam Reel Kar/Zarar (TL) */
  totalRealProfit: number;
  /** Yüzdesel Nominal Getiri Oranı (%) (Nominal ROI) */
  nominalRoi: number;
  /** Yüzdesel Reel Getiri Oranı (%) (Reel ROI) */
  realRoi: number;
  /** Enflasyon Sebebiyle Erüyen Satın Alma Gücü Oranı (%) */
  purchasingPowerLossRate: number;
  /** Vade Sonundaki Tahmini USD Kuru */
  finalUsdRate: number;
}

/**
 * Tam Projeksiyon Hesaplama Çıktısı
 */
export interface ProjectionResult {
  /** Ay-ay detay satırları */
  rows: ProjectionRow[];
  /** Genel özet bilgileri */
  summary: ProjectionSummary;
}

/**
 * Kullanıcı Portföy Modeli
 */
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  params: ProjectionParams;
  createdAt: string;
  updatedAt: string;
}

/**
 * Karşılaştırmalı Senaryo Modeli
 */
export interface Scenario {
  id: string;
  name: string;
  color: string;
  params: ProjectionParams;
  isBaseline?: boolean;
}

/**
 * Uygulama Genel Ayarları
 */
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'tr' | 'en';
  evdsApiKey?: string;
  defaultCurrency: 'TRY' | 'USD';
}
