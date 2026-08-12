/**
 * MoneyTrace - TypeScript Type Definitions
 */

/**
 * Calculation Engine Input Parameters
 */
export interface ProjectionParams {
  /** Initial Capital Amount */
  initialCapital: number
  /** Monthly Regular Investment (DCA) */
  monthlyDca: number
  /** Annual DCA Increase Rate (%) - e.g., 5 for 5% annual increase */
  dcaIncreaseRate: number
  /** Expected Annual Portfolio Return Rate (%) */
  expectedReturnRate: number
  /** Expected Annual Inflation Rate (%) */
  expectedInflationRate: number
  /** Initial Exchange Rate to Reference Currency (e.g. USD) */
  usdRate: number
  /** Expected Annual Exchange Rate Growth Rate (%) */
  expectedUsdGrowthRate: number
  /** Projection Horizon (in Years) */
  targetYears: number
  /** Input Period for Rates & DCA ('annual' | 'monthly') */
  rateInputPeriod?: "annual" | "monthly"
}

/**
 * Monthly Projection Data Row
 */
export interface ProjectionRow {
  /** Total Month Index (1, 2, 3... N) */
  month: number
  /** Year Index (1, 2... Y) */
  yearIndex: number
  /** Month in Current Year (1 - 12) */
  monthInYear: number
  /** DCA Investment Amount for this Month */
  monthlyDca: number
  /** Total Nominal Capital Invested Up to this Month */
  totalInvested: number
  /** Real Value of Total Invested Capital in t0 Terms */
  realTotalInvested: number
  /** Portfolio Nominal Value at End of Month */
  nominalValue: number
  /** Portfolio Inflation-Adjusted Real Value at End of Month */
  realValue: number
  /** Portfolio Value in Reference Currency (USD) */
  usdValue: number
  /** Cumulative Inflation Factor Up to this Month */
  cumulativeInflationFactor: number
  /** Estimated Exchange Rate for this Month */
  usdRate: number
  /** Nominal Profit/Loss Amount for this Month */
  nominalProfit: number
  /** Real Profit/Loss Amount for this Month */
  realProfit: number
  /** Inflation-protected safe withdrawal amount for this Month (Nominal) */
  safeWithdrawal: number
  /** Inflation-protected safe withdrawal amount for this Month (Real) */
  realSafeWithdrawal: number
}

/**
 * Projection Summary Metrics
 */
export interface ProjectionSummary {
  /** Total Duration (in Months) */
  totalMonths: number
  /** Total Nominal Capital Invested */
  totalInvested: number
  /** Real Value of Total Invested Capital in t0 Terms */
  realTotalInvested: number
  /** Portfolio Final Nominal Value */
  finalNominalValue: number
  /** Portfolio Final Real Value */
  finalRealValue: number
  /** Portfolio Final Reference Currency (USD) Value */
  finalUsdValue: number
  /** Total Nominal Profit/Loss */
  totalNominalProfit: number
  /** Total Real Profit/Loss */
  totalRealProfit: number
  /** Percentage Nominal Return Rate (%) (Nominal ROI) */
  nominalRoi: number
  /** Percentage Real Return Rate (%) (Real ROI) */
  realRoi: number
  /** Purchasing Power Loss Rate (%) due to Inflation */
  purchasingPowerLossRate: number
  /** Estimated Final Exchange Rate */
  finalUsdRate: number
  /** Cumulative Total Inflation-Protected Safe Withdrawal Amount (Nominal) */
  totalSafeWithdrawal: number
  /** Cumulative Total Inflation-Protected Safe Withdrawal Amount (Real) */
  totalRealSafeWithdrawal: number
}

/**
 * Complete Projection Calculation Result
 */
export interface ProjectionResult {
  /** Monthly detailed rows */
  rows: ProjectionRow[]
  /** Summary metrics */
  summary: ProjectionSummary
}

/**
 * User Portfolio Model
 */
export interface Portfolio {
  id: string
  name: string
  description?: string
  params: ProjectionParams
  createdAt: string
  updatedAt: string
}

/**
 * Comparative Scenario Model
 */
export interface Scenario {
  id: string
  name: string
  color: string
  params: ProjectionParams
  isBaseline?: boolean
}

/**
 * Currency Info
 */
export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

/**
 * AI Model Provider
 */
export type AiModelProvider = "gemini" | "openai" | "custom"

/**
 * AI Economic Forecast Result (annual basis)
 */
export interface AiForecastResult {
  /** Expected Annual Inflation Rate (%) */
  expectedInflationRate: number
  /** Expected Annual Exchange Rate Growth Rate (%) */
  expectedUsdGrowthRate: number
  /** Expected Annual Portfolio Return Rate (%) */
  expectedReturnRate: number
  /** Current Exchange Rate to Reference Currency */
  usdRate: number
  /** Short economic rationale summary */
  rationale: string
}

/**
 * Application Global Settings
 */
export interface Settings {
  theme: "light" | "dark" | "system"
  language: string
  currencyCode: string
  currencySymbol: string
  aiApiKey?: string
  aiModelProvider?: AiModelProvider
  aiModel?: string
  aiBaseUrl?: string
  aiCorsProxy?: string
  aiCorsProxyEnabled?: boolean
}
