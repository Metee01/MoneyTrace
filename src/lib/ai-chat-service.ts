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
import {
  GEMINI_MODEL,
  OPENAI_MODEL,
  AiForecastError,
  createAbortError,
  isAbortError,
  throwIfAborted,
} from "./ai-service"
import { TOOL_SCHEMAS, parseToolCalls } from "./ai-tools"
import { callDemoProxy } from "./demo-proxy"
import { extractOpenAiResponseText } from "./ai-response"
import { getLanguageDisplayName } from "./locales"

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

export function buildSystemPrompt(
  ctx: PortfolioContext,
  autoApproveMutations = false,
): string {
  const langLabel = getLanguageDisplayName(ctx.language)
  const today = new Date().toISOString().slice(0, 10)
  const p = ctx.params
  const isMonthly = p.rateInputPeriod === "monthly"
  const periodLabel = isMonthly ? "monthly" : "annual"
  const savedChangeRule = autoApproveMutations
    ? `   • If the user explicitly asks to save those values, call the appropriate mutating tool. Automatic approval is enabled, so do not ask for confirmation. Never mutate app data based only on an analysis, suggestion, or hypothetical question.`
    : `   • If the user wants those hypothetical values SAVED into the portfolio, propose the change with a mutating tool call and wait for approval.`
  const mutationApprovalRule = autoApproveMutations
    ? `• Mutating tools (apply_params, set_custom_withdrawal, clear_custom_withdrawals, create_scenario, reset_params) are automatically authorized only for changes the user explicitly requested. Never claim data changed before receiving the tool result.`
    : `• Mutating tools (apply_params, set_custom_withdrawal, clear_custom_withdrawals, create_scenario, reset_params) ALWAYS trigger an approval prompt in the UI — never claim the data was changed before the user approves.`

  const lines: string[] = [
    `You are MoneyTrace AI, a clear, direct, and professional financial analysis assistant.`,
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
      `• Total Withholding Tax: ${formatCurrency(s.totalWithholdingTax)} ${ctx.currencyCode}`,
      `• Final Exchange Rate: ${s.finalUsdRate.toFixed(4)}`,
    )
  }

  if (ctx.projection && ctx.projection.rows.length > 0) {
    lines.push(
      ``,
      `── Monthly Projection Data ──`,
      `The projection contains ${ctx.projection.rows.length} calculated monthly rows. They are intentionally omitted from this prompt to keep the context focused.`,
      `For any exact month or year value, call "calculate_projection" with the required month numbers in "highlightMonths" and use only the returned figures.`,
    )
  }

  lines.push(
    ``,
    `── Strict Calculation & Data Integrity Protocol ──`,
    `1. DO NOT PERFORM CUSTOM CALCULATIONS BY DEFAULT:`,
    `   • You must rely STRICTLY on the exact figures provided in "Current Portfolio Parameters", "Projection Summary", and tool results.`,
    `   • Monthly rows are available through "calculate_projection", including DCA, invested totals, portfolio values, profits, withdrawals, withholding tax, net withdrawals, inflation factors, and exchange rates.`,
    `   • When a requested monthly figure is not already in a tool result, retrieve it with "calculate_projection". Do not claim it is unavailable and do not estimate it yourself.`,
    ``,
    `2. PROTOCOL WHEN REQUIRED DATA IS OUTSIDE THE PROJECTION HORIZON:`,
    `   • If the user asks for a month/year beyond the current projection horizon (${p.targetYears} years) or for hypothetical parameters not in the current portfolio, call "calculate_projection" with the requested updates/highlightMonths to get the exact engine output.`,
    savedChangeRule,
    ``,
    `3. NO HAND-MADE ESTIMATIONS:`,
    `   • NEVER produce your own multiplication/compounding numbers. Always resolve questions through "calculate_projection" and cite the returned figures.`,
    ``,
    `── Mandatory Response Style ──`,
    `• Start immediately with the answer. Never begin with a greeting, thanks, praise, agreement, validation, conversational filler, or a meta-preface, regardless of the response language.`,
    `• Give the shortest response that still answers the question clearly and correctly. Do not restate the user's question or add background they did not request.`,
    `• Never end with an offer to help, an invitation to continue, or an unnecessary follow-up question, regardless of the response language.`,
    `• Ask one brief clarifying question only when missing information makes a correct or safe answer impossible. Ask it directly without filler.`,
    `• Include a brief statement that AI analysis is not formal investment advice only when giving an individualized recommendation or material forward-looking financial guidance. Do not append it to factual portfolio or calculation answers.`,
    `• These response-style rules also apply after tool results and after the user rejects a proposed tool call.`,
    ``,
    `── General Guidelines ──`,
    `• Answer financial questions about the user's portfolio, projections, and investment strategies directly and professionally.`,
    `• If the user asks something completely unrelated to finance or their portfolio, state the scope briefly without adding an invitation or follow-up question.`,
    `• Never fabricate portfolio data — only reference what is provided above or the results of tool calls.`,
    ``,
    `── Tool Calling Protocol ──`,
    `You can modify the app's portfolio data (form fields, custom withdrawals, scenarios) and run exact engine calculations on the fly. The app executes your requests and returns precise results.`,
    `• To use a tool, append a single block at the END of your answer:`,
    `<TOOL_CALLS>[{"tool": "tool_name", "args": {...}}]</TOOL_CALLS>`,
    `• The block must contain RAW JSON only — never wrap it in markdown fences and never split it across multiple blocks.`,
    `• You may call several tools in one block. Tools run in order; later "calculate_projection" calls see earlier mutations that the user approved.`,
    mutationApprovalRule,
    `• Read-only tools (calculate_projection, forecast_economics) run instantly without approval.`,
    `• AVAILABLE TOOLS:`,
  )
  TOOL_SCHEMAS.forEach((schema) => {
    lines.push(
      `  - ${schema.name} (${schema.kind === "read" ? "instant" : autoApproveMutations ? "auto-approved for explicit requests" : "requires approval"}): ${schema.description}`,
      `    args: ${schema.argsDoc}`,
    )
  })
  lines.push(
    `• After the app executes your calls, a "[Tool result]" message follows this message's context. Base your final answer STRICTLY on those returned figures — never estimate or recalculate by hand.`,
    `• If the user rejects the proposed changes, do not apply them. State this briefly and continue only when a direct answer is needed, without an offer or follow-up question.`,
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
  autoApproveMutations?: boolean
  signal?: AbortSignal
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
  signal?: AbortSignal,
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
      signal,
    })
  } catch (err) {
    if (isAbortError(err, signal)) throw createAbortError()
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
  } catch (err) {
    if (isAbortError(err, signal)) throw createAbortError()
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
  signal?: AbortSignal,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer":
      typeof window !== "undefined"
        ? window.location.origin
        : APP_CONFIG.app.siteUrl,
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
      signal,
    })
  } catch (err) {
    if (isAbortError(err, signal)) throw createAbortError()
    throw toNetworkError(endpoint, label)
  }

  if (!response.ok) {
    throw mapHttpError(response.status, label)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch (err) {
    if (isAbortError(err, signal)) throw createAbortError()
    throw new AiForecastError("parse", `Invalid JSON response from ${label}.`)
  }

  const rawContent = extractOpenAiResponseText(data)
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
  throwIfAborted(request.signal)
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
  const firstUserMessageIndex = request.messages.findIndex(
    (message) => message.role === "user",
  )
  const conversationMessages =
    firstUserMessageIndex > 0
      ? request.messages.slice(firstUserMessageIndex)
      : request.messages

  const sanitizeMessages = conversationMessages.map((m) => {
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

  const systemPrompt = buildSystemPrompt(
    request.context,
    request.autoApproveMutations,
  )
  let responseText: string

  try {
    if (request.isDemo) {
      const data = await callDemoProxy(
        "chat",
        {
          model: APP_CONFIG.ai.models.demo,
          stream: false,
          reasoning: APP_CONFIG.ai.demo.reasoning,
          messages: [
            { role: "system", content: systemPrompt },
            ...sanitizeMessages
              .filter((m) => m.role !== "system")
              .map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
          ],
          temperature: 0.8,
          max_tokens: APP_CONFIG.ai.maxTokens,
        },
        request.signal,
      )
      const rawContent = extractOpenAiResponseText(data)
      const cleanedContent = cleanReasoningTokens(rawContent)
      if (!cleanedContent) {
        throw new AiForecastError(
          "parse",
          "Demo API response has no text content.",
        )
      }
      responseText = cleanedContent
    } else if (request.provider === "custom") {
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
        request.signal,
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
        request.signal,
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
        request.signal,
      )
    }
  } catch (err) {
    if (request.isDemo && !isAbortError(err, request.signal)) {
      useSettingsStore.getState().decrementDemoChatCount()
    }
    throw err
  }

  return { text: responseText, toolCalls: parseToolCalls(responseText) }
}
