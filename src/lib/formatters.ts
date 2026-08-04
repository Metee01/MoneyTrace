/**
 * MoneyTrace - Formatlama Yardımcı Fonksiyonları
 */

/**
 * Sayıyı Türkçe Para Birimi (TL) formatında biçimlendirir.
 * Örn: 1163702.65 -> "₺1.163.702,65" veya "1.163.703 ₺"
 */
export function formatTL(amount: number, compact = false): string {
  if (isNaN(amount)) return '₺0,00';

  if (compact && Math.abs(amount) >= 1_000_000) {
    return `₺${(amount / 1_000_000).toLocaleString('tr-TR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })}M`;
  }
  if (compact && Math.abs(amount) >= 10_000) {
    return `₺${(amount / 1_000).toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}B`;
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Sayıyı Amerikan Doları ($) formatında biçimlendirir.
 * Örn: 17023.31 -> "$17,023.31"
 */
export function formatUSD(amount: number, compact = false): string {
  if (isNaN(amount)) return '$0.00';

  if (compact && Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })}M`;
  }
  if (compact && Math.abs(amount) >= 10_000) {
    return `$${(amount / 1_000).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Yüzdesel oranı biçimlendirir.
 * Örn: 116.79 -> "%116,79" veya showPlus=true için "+%116,79"
 */
export function formatPercent(rate: number, showPlus = false): string {
  if (isNaN(rate)) return '%0,00';

  const formatted = Math.abs(rate).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (rate > 0) {
    return showPlus ? `+%${formatted}` : `%${formatted}`;
  } else if (rate < 0) {
    return `-%${formatted}`;
  }
  return `%${formatted}`;
}

/**
 * Standart sayı biçimlendirmesi (binlik ayırıcı noktalı)
 */
export function formatNumber(num: number, decimals = 2): string {
  if (isNaN(num)) return '0';
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
