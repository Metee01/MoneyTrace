/**
 * MoneyTrace - AI Chat Service
 *
 * Conversational AI service that uses the user's portfolio data as context.
 * Supports the same providers as the forecast service (Gemini, OpenAI, Custom).
 * All requests are made directly from the browser — no backend involved.
 */

import type {
  ChatMessage,
  AiModelProvider,
  AiToolCall,
  ProjectionParams,
  ProjectionSummary,
  ProjectionResult,
} from "../types"
import { GEMINI_MODEL, OPENAI_MODEL, AiForecastError } from "./ai-service"
import { TOOL_SCHEMAS, parseToolCalls } from "./ai-tools"

// ─── Helpers shared with ai-service ──────────────────────────────────────────

function mapHttpError(status: number, providerLabel: string): AiForecastError {
  if (status === 401 || status === 403) {
    return new AiForecastError(
      "auth",
      `${providerLabel} rejected the API key (HTTP ${status}).`,
    )
  }
  if (status === 429) {
    return new AiForecastError(
      "quota",
      `Rate limit or quota exceeded (HTTP ${status}).`,
    )
  }
  if (status === 400 || status === 404) {
    return new AiForecastError(
      "unknown",
      `${providerLabel} request failed (HTTP ${status}).`,
    )
  }
  return new AiForecastError(
    "network",
    `${providerLabel} returned HTTP ${status}.`,
  )
}

function normalizeChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "")
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new AiForecastError(
      "unknown",
      "Custom base URL must start with http:// or https://.",
    )
  }
  return /\/chat\/completions$/i.test(trimmed)
    ? trimmed
    : `${trimmed}/chat/completions`
}

function applyCorsProxy(endpoint: string, corsProxy: string): string {
  const trimmed = corsProxy.trim()
  if (!trimmed) return endpoint
  if (!trimmed.includes("{url}")) {
    throw new AiForecastError(
      "config",
      'CORS proxy URL must contain a "{url}" placeholder.',
    )
  }
  return trimmed.replace("{url}", encodeURIComponent(endpoint))
}

const CORS_BLOCKED_HOSTS = ["opencode.ai"]

function isCorsBlockedHost(endpoint: string): boolean {
  try {
    const host = new URL(endpoint).hostname.toLowerCase()
    return CORS_BLOCKED_HOSTS.some(
      (blocked) => host === blocked || host.endsWith(`.${blocked}`),
    )
  } catch {
    return false
  }
}

function toNetworkError(endpoint: string, label: string): AiForecastError {
  const hint =
    "Some providers block direct browser access; configure a CORS proxy in Settings."
  if (isCorsBlockedHost(endpoint)) {
    return new AiForecastError(
      "cors",
      `${label} blocks direct browser access. Enable a CORS proxy in Settings.`,
    )
  }
  return new AiForecastError("network", `${label} network error. ${hint}`)
}

// ─── Portfolio Context Builder ───────────────────────────────────────────────

export interface PortfolioContext {
  params: ProjectionParams
  summary: ProjectionSummary | null
  projection?: ProjectionResult | null
  currencyCode: string
  language: string
}

function formatCurrency(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function buildSystemPrompt(ctx: PortfolioContext): string {
  const langLabel = ctx.language === "tr" ? "Turkish" : "English"
  const today = new Date().toISOString().slice(0, 10)
  const p = ctx.params
  const isMonthly = p.rateInputPeriod === "monthly"
  const periodLabel = isMonthly ? "monthly" : "annual"

  const lines: string[] = [
    `You are MoneyTrace AI, a knowledgeable and friendly financial analysis assistant.`,
    `Today is ${today}. The user's local currency is ${p.usdRate === 1 ? "USD" : ctx.currencyCode}.`,
    `Always respond in ${langLabel}.`,
    ``,
    `── Current Portfolio Parameters ──`,
    `• Initial Capital: ${formatCurrency(p.initialCapital)} ${ctx.currencyCode}`,
    `• Monthly DCA: ${formatCurrency(p.monthlyDca)} ${ctx.currencyCode}`,
    `• Annual DCA Increase Rate: ${p.dcaIncreaseRate}%`,
    `• Monthly Cash Withdrawal: ${formatCurrency(p.monthlyWithdrawal ?? 0)} ${ctx.currencyCode}`,
    `• Expected ${periodLabel} Return Rate: ${p.expectedReturnRate}%`,
    `• Expected ${periodLabel} Inflation Rate: ${p.expectedInflationRate}%`,
    `• Initial Exchange Rate (USD): ${p.usdRate}`,
    `• Expected ${periodLabel} USD Growth: ${p.expectedUsdGrowthRate}%`,
    `• Projection Horizon: ${p.targetYears} years`,
    `• Withholding Tax Rate: ${p.withholdingTaxRate ?? 0}%`,
  ]

  if (ctx.summary) {
    const s = ctx.summary
    lines.push(
      ``,
      `── Projection Summary (${s.totalMonths} months) ──`,
      `• Total Invested: ${formatCurrency(s.totalInvested)} ${ctx.currencyCode}`,
      `• Real Total Invested: ${formatCurrency(s.realTotalInvested)} ${ctx.currencyCode}`,
      `• Final Nominal Value: ${formatCurrency(s.finalNominalValue)} ${ctx.currencyCode}`,
      `• Final Real Value (today's money): ${formatCurrency(s.finalRealValue)} ${ctx.currencyCode}`,
      `• Final USD Value: $${formatCurrency(s.finalUsdValue)}`,
      `• Nominal ROI: ${s.nominalRoi.toFixed(2)}%`,
      `• Real ROI: ${s.realRoi.toFixed(2)}%`,
      `• Purchasing Power Loss: ${s.purchasingPowerLossRate.toFixed(2)}%`,
      `• Total Nominal Profit: ${formatCurrency(s.totalNominalProfit)} ${ctx.currencyCode}`,
      `• Total Real Profit: ${formatCurrency(s.totalRealProfit)} ${ctx.currencyCode}`,
      `• Total Safe Withdrawal (Nominal): ${formatCurrency(s.totalSafeWithdrawal)} ${ctx.currencyCode}`,
      `• Total Safe Withdrawal (Real): ${formatCurrency(s.totalRealSafeWithdrawal)} ${ctx.currencyCode}`,
      `• Total Actual Withdrawals (Gross Nominal): ${formatCurrency(s.totalWithdrawals)} ${ctx.currencyCode}`,
      `• Total Net Withdrawals Landed in Hand (Nominal): ${formatCurrency(s.totalNetWithdrawals)} ${ctx.currencyCode}`,
      `• Total Actual Withdrawals (Real): ${formatCurrency(s.totalRealWithdrawals)} ${ctx.currencyCode}`,
      `• Total Withholding Tax (Stopaj): ${formatCurrency(s.totalWithholdingTax)} ${ctx.currencyCode}`,
      `• Final Exchange Rate: ${s.finalUsdRate.toFixed(4)}`,
    )
  }

  if (ctx.projection && ctx.projection.rows.length > 0) {
    lines.push(
      ``,
      `── Full Month-by-Month Calculated Projection Data (${ctx.projection.rows.length} months) ──`,
      `Below is the complete, exact monthly calculation table rendered in the user's UI data tables and charts:`,
    )
    ctx.projection.rows.forEach((r) => {
      lines.push(
        `• Month ${r.month} (Y${r.yearIndex}M${r.monthInYear}): MonthlyDCA: ${formatCurrency(r.monthlyDca)} ${ctx.currencyCode} | TotalInvested: ${formatCurrency(r.totalInvested)} ${ctx.currencyCode} | RealTotalInvested: ${formatCurrency(r.realTotalInvested)} ${ctx.currencyCode} | NominalValue: ${formatCurrency(r.nominalValue)} ${ctx.currencyCode} | RealValue: ${formatCurrency(r.realValue)} ${ctx.currencyCode} | NominalProfit: ${formatCurrency(r.nominalProfit)} ${ctx.currencyCode} | NominalProfitChange(Delta): ${formatCurrency(r.nominalProfitChange)} ${ctx.currencyCode} | RealProfit: ${formatCurrency(r.realProfit)} ${ctx.currencyCode} | RealProfitChange(Delta): ${formatCurrency(r.realProfitChange)} ${ctx.currencyCode} | GrossWithdrawal: ${formatCurrency(r.withdrawal)} ${ctx.currencyCode} | WithholdingTax(Stopaj): ${formatCurrency(r.withholdingTax)} ${ctx.currencyCode} | NetWithdrawal(ElineGecen): ${formatCurrency(r.netWithdrawal)} ${ctx.currencyCode} | SafeWithdrawal(Nominal): ${formatCurrency(r.safeWithdrawal)} ${ctx.currencyCode} | SafeWithdrawal(Real): ${formatCurrency(r.realSafeWithdrawal)} ${ctx.currencyCode} | CumInflationFactor: ${r.cumulativeInflationFactor.toFixed(4)} | USDValue: $${formatCurrency(r.usdValue)} | USDRate: ${r.usdRate.toFixed(2)}`,
      )
    })
  }

  lines.push(
    ``,
    `── Strict Calculation & Data Integrity Protocol ──`,
    `1. DO NOT PERFORM CUSTOM CALCULATIONS BY DEFAULT:`,
    `   • You must rely STRICTLY on the exact figures provided in the "Current Portfolio Parameters", "Projection Summary", and "Full Month-by-Month Calculated Projection Data" sections above.`,
    `   • The dataset includes all monthly calculated values from the user's projection table: Monthly DCA, Total Invested (Nominal & Real), Portfolio Values (Nominal, Real, USD), Profits & Deltas, Gross Withdrawals, Withholding Tax (Stopaj), Net Withdrawals Landed in Hand (Eline Geçecek Net Tutar), Safe Withdrawals (Nominal & Real), Inflation Factors, and USD Exchange Rates.`,
    `   • All monthly figures including withholding tax (stopaj), gross withdrawals, and net withdrawals landed in hand ARE pre-calculated and explicitly listed in the monthly data above. Do NOT state that monthly stopaj or net withdrawal data is missing.`,
    ``,
    `2. PROTOCOL WHEN REQUIRED DATA IS OUTSIDE THE PROJECTION HORIZON:`,
    `   • If the user asks for a month/year beyond the current projection horizon (${p.targetYears} years) or for hypothetical parameters not in the current portfolio, call "calculate_projection" with the requested updates/highlightMonths to get the exact engine output.`,
    `   • If the user wants those hypothetical values SAVED into the portfolio, propose the change with a mutating tool call and wait for approval.`,
    ``,
    `3. NO HAND-MADE ESTIMATIONS:`,
    `   • NEVER produce your own multiplication/compounding numbers. Always resolve questions through "calculate_projection" and cite the returned figures.`,
    ``,
    `── General Guidelines ──`,
    `• Answer financial questions about the user's portfolio, projections, and investment strategies concisely and professionally.`,
    `• If the user asks something completely unrelated to finance or their portfolio, politely redirect.`,
    `• Never fabricate portfolio data — only reference what is provided above or the results of tool calls.`,
    `• Always include appropriate disclaimers that AI analysis is NOT formal investment advice.`,
    ``,
    `── Tool Calling Protocol ──`,
    `You can modify the app's portfolio data (form fields, custom withdrawals, scenarios) and run exact engine calculations on the fly. The app executes your requests and returns precise results.`,
    `• To use a tool, append a single block at the END of your answer:`,
    `<TOOL_CALLS>[{"tool": "tool_name", "args": {...}}]</TOOL_CALLS>`,
    `• The block must contain RAW JSON only — never wrap it in markdown fences and never split it across multiple blocks.`,
    `• You may call several tools in one block. Tools run in order; later "calculate_projection" calls see earlier mutations that the user approved.`,
    `• Mutating tools (apply_params, set_custom_withdrawal, clear_custom_withdrawals, create_scenario, reset_params) ALWAYS trigger an approval prompt in the UI — never claim the data was changed before the user approves.`,
    `• Read-only tools (calculate_projection, forecast_economics) run instantly without approval.`,
    `• AVAILABLE TOOLS:`,
  )
  TOOL_SCHEMAS.forEach((schema) => {
    lines.push(
      `  - ${schema.name} (${schema.kind === "read" ? "instant" : "requires approval"}): ${schema.description}`,
      `    args: ${schema.argsDoc}`,
    )
  })
  lines.push(
    `• After the app executes your calls, a "[Tool result]" message follows this message's context. Base your final answer STRICTLY on those returned figures — never estimate or recalculate by hand.`,
    `• If the user rejects the proposed changes, do not apply them and continue the conversation politely.`,
    `• NEVER emit a tool call block unless you actually need to change data or you need exact engine figures that are not already in the context above.`,
  )

  return lines.join("\n")
}

// ─── Chat Request Types ──────────────────────────────────────────────────────

import {
  useSettingsStore,
  MAX_DEMO_CHAT_MESSAGES,
} from "../store/settings-store"

export interface ChatRequest {
  provider: AiModelProvider
  apiKey: string
  model?: string
  baseUrl?: string
  corsProxy?: string
  messages: ChatMessage[]
  context: PortfolioContext
  isDemo?: boolean
}

import { APP_CONFIG } from "../config"

// ─── Anti-abuse Security Constants ──────────────────────────────────────────

const MAX_DEMO_MESSAGE_LENGTH = APP_CONFIG.ai.demo.maxMessageLength
const DEMO_COOLDOWN_MS = APP_CONFIG.ai.demo.cooldownMs

function cleanReasoningTokens(text: string): string {
  if (!text) return ""
  // Strip completed <think>...</think> blocks generated by reasoning models (e.g. DeepSeek R1/V4)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  // If the output was truncated mid-thought, remove leading unclosed <think> block
  if (cleaned.startsWith("<think>")) {
    cleaned = cleaned.replace(/^<think>[\s\S]*/gi, "").trim()
  }
  // If stripping empty-handed, fallback to original trimmed text
  return cleaned || text.trim()
}

// ─── Gemini Chat ─────────────────────────────────────────────────────────────

const GEMINI_API_BASE = APP_CONFIG.ai.endpoints.geminiBase

async function chatWithGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  const endpoint = `${GEMINI_API_BASE}/${model}:generateContent`

  // Build Gemini multi-turn contents array
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

  let response: Response
  try {
    response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: APP_CONFIG.ai.maxTokens,
        },
      }),
    })
  } catch {
    throw new AiForecastError(
      "network",
      "Network error while calling Gemini API.",
    )
  }

  if (!response.ok) {
    throw mapHttpError(response.status, "Gemini")
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new AiForecastError("parse", "Invalid JSON response from Gemini API.")
  }

  const candidates = (
    data as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
  ).candidates
  const text = candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  const cleaned = cleanReasoningTokens(text)
  if (!cleaned) {
    throw new AiForecastError("parse", "Gemini response has no text content.")
  }

  return cleaned
}

// ─── OpenAI-compatible Chat ──────────────────────────────────────────────────

async function chatWithOpenAi(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  label: string,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer":
      typeof window !== "undefined"
        ? window.location.origin
        : "https://moneytrace.metee.com.tr",
    "X-Title": "MoneyTrace",
  }
  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`
  }

  const openaiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
  ]

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: APP_CONFIG.ai.maxTokens,
      }),
    })
  } catch {
    throw toNetworkError(endpoint, label)
  }

  if (!response.ok) {
    throw mapHttpError(response.status, label)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new AiForecastError("parse", `Invalid JSON response from ${label}.`)
  }

  const choices = (
    data as {
      choices?: Array<{ message?: { content?: string } }>
    }
  ).choices
  const rawContent = choices?.[0]?.message?.content ?? ""
  const cleanedContent = cleanReasoningTokens(rawContent)
  if (!cleanedContent) {
    throw new AiForecastError("parse", `${label} response has no text content.`)
  }

  return cleanedContent
}

// ─── Public API ──────────────────────────────────────────────────────────────

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

/** Chat service response: text plus any tool calls parsed from it. */
export interface ChatServiceResponse {
  text: string
  toolCalls: AiToolCall[]
}

/**
 * Sends a chat message to the selected AI provider with full portfolio context.
 *
 * @param request Provider settings, conversation history, and portfolio context
 * @returns The AI assistant's text response plus any tool calls it requested
 * @throws {AiForecastError} with a machine-readable `code`
 */
export async function sendChatMessage(
  request: ChatRequest,
): Promise<ChatServiceResponse> {
  if (request.isDemo) {
    // Cooldown rate limit (persisted so a page reload cannot reset it)
    const now = Date.now()
    if (
      now - (useSettingsStore.getState().demoLastChatCallTime ?? 0) <
      DEMO_COOLDOWN_MS
    ) {
      throw new AiForecastError(
        "quota",
        "Please wait a few seconds between messages when using Demo API.",
      )
    }

    // Reserve the quota slot BEFORE the API call so concurrent requests
    // cannot race past the limit. Rolled back if the call fails.
    if (!useSettingsStore.getState().incrementDemoChatCount()) {
      throw new AiForecastError(
        "quota",
        `Demo API chat message limit reached (${MAX_DEMO_CHAT_MESSAGES}/${MAX_DEMO_CHAT_MESSAGES}).`,
      )
    }
    useSettingsStore.getState().setDemoLastChatCallTime(now)
  }

  // Security: Truncate user messages if using demo key to prevent excessive
  // token abuse. Internal tool-protocol messages are exempt.
  const sanitizeMessages = request.messages.map((m) => {
    if (
      request.isDemo &&
      !m.internal &&
      m.role === "user" &&
      m.content.length > MAX_DEMO_MESSAGE_LENGTH
    ) {
      return {
        ...m,
        content: m.content.slice(0, MAX_DEMO_MESSAGE_LENGTH) + "...",
      }
    }
    return m
  })

  const systemPrompt = buildSystemPrompt(request.context)
  let responseText: string

  try {
    if (request.provider === "custom") {
      const baseUrl = (request.baseUrl ?? "").trim()
      const model =
        (request.model ?? "").trim() ||
        (request.isDemo ? APP_CONFIG.ai.models.demo : "")
      if (!baseUrl) {
        throw new AiForecastError(
          "config",
          "Custom provider requires a base URL.",
        )
      }
      if (!model) {
        throw new AiForecastError("config", "Custom provider requires a model.")
      }
      const endpoint = applyCorsProxy(
        normalizeChatCompletionsUrl(baseUrl),
        request.corsProxy ?? "",
      )
      responseText = await chatWithOpenAi(
        endpoint,
        request.apiKey,
        model,
        systemPrompt,
        sanitizeMessages,
        "custom provider",
      )
    } else if (!request.apiKey.trim()) {
      throw new AiForecastError("auth", "No API key provided.")
    } else if (request.provider === "gemini") {
      const model =
        (request.model ?? "").trim() ||
        (request.isDemo ? APP_CONFIG.ai.models.demo : GEMINI_MODEL)
      responseText = await chatWithGemini(
        request.apiKey.trim(),
        model,
        systemPrompt,
        sanitizeMessages,
      )
    } else {
      const model =
        (request.model ?? "").trim() ||
        (request.isDemo ? APP_CONFIG.ai.models.demo : OPENAI_MODEL)
      responseText = await chatWithOpenAi(
        OPENAI_ENDPOINT,
        request.apiKey,
        model,
        systemPrompt,
        sanitizeMessages,
        "OpenAI API",
      )
    }
  } catch (err) {
    if (request.isDemo) {
      useSettingsStore.getState().decrementDemoChatCount()
    }
    throw err
  }

  return { text: responseText, toolCalls: parseToolCalls(responseText) }
}

/**
 * Returns the demo API key from the Vite environment, or an empty string
 * if no demo key is configured.
 */
export function getDemoApiKey(): string {
  try {
    return (import.meta.env.VITE_DEMO_API_KEY as string) ?? ""
  } catch {
    return ""
  }
}
