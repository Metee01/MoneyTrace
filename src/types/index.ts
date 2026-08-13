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
  /** Planned Monthly Cash Withdrawal Amount */
  monthlyWithdrawal?: number
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
  /** Withholding tax rate on monthly returns (%) — e.g. 15 for 15% */
  /** Withholding tax rate on cash withdrawal profits (%) — e.g. 15 for 15% */
  withholdingTaxRate?: number
  /** Per-month custom cash withdrawal overrides (e.g. { 13: 50000 }) */
  customWithdrawals?: Record<number, number>
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
  /** Gross Cash Withdrawal Amount in this Month */
  withdrawal: number
  /** Monthly withholding tax amount deducted from withdrawal profit */
  withholdingTax: number
  /** Net cash withdrawal amount landed in hand after withholding tax */
  netWithdrawal: number
  /** Month-over-month nominal profit change (current - previous) */
  nominalProfitChange: number
  /** Month-over-month real profit change (current - previous) */
  realProfitChange: number
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
  /** Cumulative Total Actual Cash Withdrawals (Nominal Gross) */
  totalWithdrawals: number
  /** Cumulative Total Actual Cash Withdrawals (Real) */
  totalRealWithdrawals: number
  /** Cumulative Total Net Cash Withdrawals Landed in Hand (Nominal) */
  totalNetWithdrawals: number
  /** Total withholding tax paid over projection period */
  totalWithholdingTax: number
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
 * AI Tool Call (In-Band JSON Protocol)
 */
export interface AiToolCall {
  /** Tool name (see TOOL_SCHEMAS in src/lib/ai-tools.ts) */
  tool: string
  /** Tool arguments (JSON object) */
  args: Record<string, unknown>
}

/**
 * Tool Call Execution Result
 */
export interface AiToolCallResult {
  /** Tool name that was executed */
  tool: string
  /** Whether execution succeeded */
  ok: boolean
  /** JSON-string output (or error message when failed) */
  output: string
}

/**
 * AI Chat Message
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string
  /** Message sender role */
  role: "user" | "assistant" | "system"
  /** Message text content */
  content: string
  /** Unix timestamp (ms) */
  timestamp: number
  /** Hides this message from the chat UI (internal tool protocol use only) */
  internal?: boolean
}

/**
 * AI Chat Session / Conversation Thread
 */
export interface ChatSession {
  /** Unique session identifier */
  id: string
  /** Display title for the chat thread */
  title: string
  /** Creation timestamp (ms) */
  createdAt: number
  /** Last activity timestamp (ms) */
  updatedAt: number
  /** Chronological messages in this thread */
  messages: ChatMessage[]
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
  useDemoApi?: boolean
  demoForecastCount?: number
  demoChatCount?: number
  demoLastChatCallTime?: number
  demoUserId?: string
}
