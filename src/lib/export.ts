/**
 * MoneyTrace - CSV ve JSON Dışa / İçe Aktarım Yardımcı Modülü
 */

import type { ProjectionRow, ProjectionSummary } from '../types';

/**
 * Projeksiyon tablosunu Türkiye Excel standartlarına uygun (semicolon ayırıcı ve UTF-8 BOM) CSV olarak indirir.
 * 
 * @param rows Ay-ay projeksiyon satırları
 * @param summary Genel projeksiyon özeti
 * @param filename İndirilecek dosya adı (varsayılan: MoneyTrace_Projeksiyon.csv)
 */
export function exportToCSV(
  rows: ProjectionRow[],
  summary: ProjectionSummary,
  filename = 'MoneyTrace_Projeksiyon.csv'
): void {
  if (!rows || rows.length === 0) return;

  const delimiter = ';';
  const lines: string[] = [];

  // Başlıklar
  const headers = [
    'Donem / Ay',
    'Yil',
    'Ay (Yil Ici)',
    'Aylik DCA (TL)',
    'Yatirlan Anapara (TL)',
    'Reel Yatirlan Anapara (TL)',
    'Nominal Portfoy Degeri (TL)',
    'Reel Satin Alma Gucu (TL)',
    'USD Degeri ($)',
    'USD Kuru (TRY)',
    'Nominal Kar/Zarar (TL)',
    'Reel Kar/Zarar (TL)',
    'Kumulatif Enflasyon Katsayisi',
  ];

  lines.push(headers.join(delimiter));

  // Satırlar
  rows.forEach((r) => {
    const line = [
      r.month,
      r.yearIndex,
      r.monthInYear,
      r.monthlyDca.toFixed(2),
      r.totalInvested.toFixed(2),
      r.realTotalInvested.toFixed(2),
      r.nominalValue.toFixed(2),
      r.realValue.toFixed(2),
      r.usdValue.toFixed(2),
      r.usdRate.toFixed(2),
      r.nominalProfit.toFixed(2),
      r.realProfit.toFixed(2),
      r.cumulativeInflationFactor.toFixed(4),
    ];
    lines.push(line.join(delimiter));
  });

  // Ozet Satırı
  lines.push('');
  lines.push('--- GENEL OZET METRIKLERI ---');
  lines.push(`Toplam Sure (Ay)${delimiter}${summary.totalMonths}`);
  lines.push(`Toplam Yatirilan Anapara (TL)${delimiter}${summary.totalInvested.toFixed(2)}`);
  lines.push(`Reel Yatirilan Anapara (TL)${delimiter}${summary.realTotalInvested.toFixed(2)}`);
  lines.push(`Vade Sonu Nominal Değer (TL)${delimiter}${summary.finalNominalValue.toFixed(2)}`);
  lines.push(`Vade Sonu Reel Değer (TL)${delimiter}${summary.finalRealValue.toFixed(2)}`);
  lines.push(`Vade Sonu USD Değeri ($)${delimiter}${summary.finalUsdValue.toFixed(2)}`);
  lines.push(`Net Reel Kar/Zarar (TL)${delimiter}${summary.totalRealProfit.toFixed(2)}`);
  lines.push(`Reel ROI (%)${delimiter}%${summary.realRoi.toFixed(2)}`);
  lines.push(`Enflasyon Kayip Orani (%)${delimiter}%${summary.purchasingPowerLossRate.toFixed(2)}`);

  const csvContent = lines.join('\r\n');
  // UTF-8 BOM eklentisi (\uFEFF) Excel'in karakter kodlamasını otomatik algılamasını sağlar
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  downloadBlob(blob, filename);
}

/**
 * Herhangi bir nesneyi (Senaryolar, Portföy ayarları) okunaklı JSON dosyası olarak indirir.
 * 
 * @param data Dışa aktarılacak veri nesnesi
 * @param filename İndirilecek dosya adı (varsayılan: MoneyTrace_Data.json)
 */
export function exportToJson(data: any, filename = 'MoneyTrace_Data.json'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], {
    type: 'application/json;charset=utf-8;',
  });

  downloadBlob(blob, filename);
}

/**
 * Kullanıcı tarafından seçilen JSON dosyasını okur ve JS nesnesi olarak döndürür.
 * 
 * @param file Kullanıcının seçtiği .json dosyası
 */
export function importFromJson<T = any>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Geçersiz JSON dosyası formatı.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası oluştu.'));
    };

    reader.readAsText(file);
  });
}

/**
 * Yardımcı dosya indirme mekanizması (DOM ikincil linki oluşturup tetikler)
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
