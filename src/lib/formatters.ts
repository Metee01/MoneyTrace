/**
 * MoneyTrace - Formatting Helpers
 */

/** Popular currencies list for quick selection */
export const POPULAR_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan (CNY)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real (BRL)' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira (TRY)' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso (MXN)' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won (KRW)' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona (SEK)' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone (NOK)' },
];

/**
 * Formats a number into a user's selected local currency format.
 * E.g., 1163702.65 with USD -> "$1,163,702.65" or compact "$1.16M"
 */
export function formatLocalCurrency(
  amount: number,
  currencyCode = 'USD',
  locale = 'en-US',
  compact = false
): string {
  if (isNaN(amount)) return '$0.00';

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (compact && absAmount >= 1_000_000) {
    const formatted = (absAmount / 1_000_000).toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return `${sign}${getCurrencySymbol(currencyCode)}${formatted}M`;
  }
  if (compact && absAmount >= 10_000) {
    const formatted = (absAmount / 1_000).toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}${getCurrencySymbol(currencyCode)}${formatted}K`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency code or locale is invalid
    return `${getCurrencySymbol(currencyCode)}${amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/**
 * Helper to get symbol for currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const found = POPULAR_CURRENCIES.find((c) => c.code.toUpperCase() === currencyCode.toUpperCase());
  if (found) return found.symbol;

  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(1);
    const symbolPart = parts.find((p) => p.type === 'currency');
    return symbolPart ? symbolPart.value : currencyCode;
  } catch {
    return currencyCode;
  }
}

/**
 * Backward compatibility alias for formatLocalCurrency
 */
export function formatTL(amount: number, compact = false): string {
  return formatLocalCurrency(amount, 'USD', 'en-US', compact);
}

/**
 * Formats amount in Reference Currency (USD)
 */
export function formatUSD(amount: number, compact = false): string {
  return formatLocalCurrency(amount, 'USD', 'en-US', compact);
}

/**
 * Formats percentage rate.
 * E.g., 12.5 -> "12.50%" or "+12.50%"
 */
export function formatPercent(rate: number, showPlus = false, locale = 'en-US'): string {
  if (isNaN(rate)) return '0.00%';

  const formatted = Math.abs(rate).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (rate > 0) {
    return showPlus ? `+${formatted}%` : `${formatted}%`;
  } else if (rate < 0) {
    return `-${formatted}%`;
  }
  return `${formatted}%`;
}

/**
 * Standard number formatting
 */
export function formatNumber(num: number, decimals = 2, locale = 'en-US'): string {
  if (isNaN(num)) return '0';
  return num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
