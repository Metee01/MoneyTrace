/**
 * MoneyTrace - TypeScript Type Definitions
 */

/**
 * Calculation Engine Input Parameters
 */
export interface ProjectionParams {
  /** Initial Capital Amount */
  initialCapital: number;
  /** Monthly Regular Investment (DCA) */
  monthlyDca: number;
  /** Annual DCA Increase Rate (%) - e.g., 5 for 5% annual increase */
  dcaIncreaseRate: number;
  /** Expected Annual Portfolio Return Rate (%) */
  expectedReturnRate: number;
  /** Expected Annual Inflation Rate (%) */
  expectedInflationRate: number;
  /** Initial Exchange Rate to Reference Currency (e.g. USD) */
  usdRate: number;
  /** Expected Annual Exchange Rate Growth Rate (%) */
  expectedUsdGrowthRate: number;
  /** Projection Horizon (in Years) */
  targetYears: number;
}

/**
 * Monthly Projection Data Row
 */
export interface ProjectionRow {
  /** Total Month Index (1, 2, 3... N) */
  month: number;
  /** Year Index (1, 2... Y) */
  yearIndex: number;
  /** Month in Current Year (1 - 12) */
  monthInYear: number;
  /** DCA Investment Amount for this Month */
  monthlyDca: number;
  /** Total Nominal Capital Invested Up to this Month */
  totalInvested: number;
  /** Real Value of Total Invested Capital in t0 Terms */
  realTotalInvested: number;
  /** Portfolio Nominal Value at End of Month */
  nominalValue: number;
  /** Portfolio Inflation-Adjusted Real Value at End of Month */
  realValue: number;
  /** Portfolio Value in Reference Currency (USD) */
  usdValue: number;
  /** Cumulative Inflation Factor Up to this Month */
  cumulativeInflationFactor: number;
  /** Estimated Exchange Rate for this Month */
  usdRate: number;
  /** Nominal Profit/Loss Amount for this Month */
  nominalProfit: number;
  /** Real Profit/Loss Amount for this Month */
  realProfit: number;
}

/**
 * Projection Summary Metrics
 */
export interface ProjectionSummary {
  /** Total Duration (in Months) */
  totalMonths: number;
  /** Total Nominal Capital Invested */
  totalInvested: number;
  /** Real Value of Total Invested Capital in t0 Terms */
  realTotalInvested: number;
  /** Portfolio Final Nominal Value */
  finalNominalValue: number;
  /** Portfolio Final Real Value */
  finalRealValue: number;
  /** Portfolio Final Reference Currency (USD) Value */
  finalUsdValue: number;
  /** Total Nominal Profit/Loss */
  totalNominalProfit: number;
  /** Total Real Profit/Loss */
  totalRealProfit: number;
  /** Percentage Nominal Return Rate (%) (Nominal ROI) */
  nominalRoi: number;
  /** Percentage Real Return Rate (%) (Real ROI) */
  realRoi: number;
  /** Purchasing Power Loss Rate (%) due to Inflation */
  purchasingPowerLossRate: number;
  /** Estimated Final Exchange Rate */
  finalUsdRate: number;
}

/**
 * Complete Projection Calculation Result
 */
export interface ProjectionResult {
  /** Monthly detailed rows */
  rows: ProjectionRow[];
  /** Summary metrics */
  summary: ProjectionSummary;
}

/**
 * User Portfolio Model
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
 * Comparative Scenario Model
 */
export interface Scenario {
  id: string;
  name: string;
  color: string;
  params: ProjectionParams;
  isBaseline?: boolean;
}

/**
 * Currency Info
 */
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

/**
 * Application Global Settings
 */
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'tr';
  currencyCode: string;
  currencySymbol: string;
}
