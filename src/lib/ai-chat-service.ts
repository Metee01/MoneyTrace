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
  ProjectionParams,
  ProjectionSummary,
} from "../types"
import { GEMINI_MODEL, OPENAI_MODEL, AiForecastError } from "./ai-service"

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
      `• Final Nominal Value: ${formatCurrency(s.finalNominalValue)} ${ctx.currencyCode}`,
      `• Final Real Value (today's money): ${formatCurrency(s.finalRealValue)} ${ctx.currencyCode}`,
      `• Final USD Value: $${formatCurrency(s.finalUsdValue)}`,
      `• Nominal ROI: ${s.nominalRoi.toFixed(2)}%`,
      `• Real ROI: ${s.realRoi.toFixed(2)}%`,
      `• Purchasing Power Loss: ${s.purchasingPowerLossRate.toFixed(2)}%`,
      `• Total Nominal Profit: ${formatCurrency(s.totalNominalProfit)} ${ctx.currencyCode}`,
      `• Total Real Profit: ${formatCurrency(s.totalRealProfit)} ${ctx.currencyCode}`,
      `• Total Safe Withdrawal: ${formatCurrency(s.totalSafeWithdrawal)} ${ctx.currencyCode}`,
      `• Total Actual Withdrawals: ${formatCurrency(s.totalWithdrawals)} ${ctx.currencyCode}`,
      `• Total Withholding Tax: ${formatCurrency(s.totalWithholdingTax)} ${ctx.currencyCode}`,
      `• Final Exchange Rate: ${s.finalUsdRate.toFixed(4)}`,
    )
  }

  lines.push(
    ``,
    `── Instructions ──`,
    `• Answer financial questions about the user's portfolio, projections, and investment strategies.`,
    `• Use the data above to provide accurate, data-driven insights.`,
    `• Be concise but thorough. Use bullet points and numbers when helpful.`,
    `• If the user asks something unrelated to finance or their portfolio, politely redirect.`,
    `• Never fabricate portfolio data — only reference what is provided above.`,
    `• This is NOT investment advice — always include appropriate disclaimers when making suggestions.`,
  )

  return lines.join("\n")
}

// ─── Chat Request Types ──────────────────────────────────────────────────────

import { useSettingsStore, MAX_DEMO_CHAT_MESSAGES } from "../store/settings-store"

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
let lastDemoCallTime = 0

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
          maxOutputTokens: 2048,
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
  const text = candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== "string") {
    throw new AiForecastError("parse", "Gemini response has no text content.")
  }

  return text
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
        max_tokens: 2048,
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
  const content = choices?.[0]?.message?.content
  if (typeof content !== "string") {
    throw new AiForecastError("parse", `${label} response has no text content.`)
  }

  return content
}

// ─── Public API ──────────────────────────────────────────────────────────────

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

/**
 * Sends a chat message to the selected AI provider with full portfolio context.
 *
 * @param request Provider settings, conversation history, and portfolio context
 * @returns The AI assistant's text response
 * @throws {AiForecastError} with a machine-readable `code`
 */
export async function sendChatMessage(request: ChatRequest): Promise<string> {
  if (request.isDemo) {
    const currentCount = useSettingsStore.getState().demoChatCount ?? 0
    if (currentCount >= MAX_DEMO_CHAT_MESSAGES) {
      throw new AiForecastError(
        "quota",
        `Demo API chat message limit reached (${MAX_DEMO_CHAT_MESSAGES}/${MAX_DEMO_CHAT_MESSAGES}).`,
      )
    }

    // Cooldown rate limit
    const now = Date.now()
    if (now - lastDemoCallTime < DEMO_COOLDOWN_MS) {
      throw new AiForecastError(
        "quota",
        "Please wait a few seconds between messages when using Demo API.",
      )
    }
    lastDemoCallTime = now
  }

  // Security: Truncate messages if using demo key to prevent excessive token abuse
  const sanitizeMessages = request.messages.map((m) => {
    if (request.isDemo && m.role === "user" && m.content.length > MAX_DEMO_MESSAGE_LENGTH) {
      return {
        ...m,
        content: m.content.slice(0, MAX_DEMO_MESSAGE_LENGTH) + "...",
      }
    }
    return m
  })

  const systemPrompt = buildSystemPrompt(request.context)
  let responseText: string

  if (request.provider === "custom") {
    const baseUrl = (request.baseUrl ?? "").trim()
    const model = (request.model ?? "").trim()
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
    const model = (request.model ?? "").trim() || GEMINI_MODEL
    responseText = await chatWithGemini(
      request.apiKey.trim(),
      model,
      systemPrompt,
      sanitizeMessages,
    )
  } else {
    const model = (request.model ?? "").trim() || OPENAI_MODEL
    responseText = await chatWithOpenAi(
      OPENAI_ENDPOINT,
      request.apiKey,
      model,
      systemPrompt,
      sanitizeMessages,
      "OpenAI API",
    )
  }

  if (request.isDemo) {
    useSettingsStore.getState().incrementDemoChatCount()
  }

  return responseText
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
