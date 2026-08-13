/**
 * MoneyTrace - Client-Side AI Economic Forecast Service
 *
 * Supports Google Gemini, OpenAI, and any OpenAI-compatible custom endpoint
 * (OpenRouter, Groq, LM Studio, Ollama, local servers, etc.) using the user's
 * own API key. Keys are stored in localStorage and never leave the browser
 * except for the direct HTTPS call to the selected provider.
 */

import type { AiForecastResult, AiModelProvider } from "../types"

/** Default model names (update here when providers release newer models) */
export const GEMINI_MODEL = "gemini-3.6-flash"
export const OPENAI_MODEL = "gpt-4o-mini"

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models"
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

import { useSettingsStore, MAX_DEMO_FORECASTS } from "../store/settings-store"

export interface ForecastRequest {
  provider: AiModelProvider
  apiKey: string
  /** Overrides the provider default model */
  model?: string
  /** Custom OpenAI-compatible base URL (required for 'custom') */
  baseUrl?: string
  /** CORS proxy prefix with a {url} placeholder (e.g. https://corsproxy.io/?url={url}) */
  corsProxy?: string
  currencyCode: string
  targetYears: number
  language?: string
  /** Whether the request is using the Demo API key */
  isDemo?: boolean
}

export type AiForecastErrorCode =
  "auth" | "network" | "quota" | "parse" | "config" | "cors" | "unknown"

export class AiForecastError extends Error {
  readonly code: AiForecastErrorCode

  constructor(code: AiForecastErrorCode, message: string) {
    super(message)
    this.name = "AiForecastError"
    this.code = code
  }
}

function buildSystemPrompt(
  currencyCode: string,
  targetYears: number,
  language: string,
): string {
  const today = new Date().toISOString().slice(0, 10)
  return [
    "You are a macroeconomic and financial forecasting assistant.",
    `Today is ${today}. The user's local currency is ${currencyCode}.`,
    `Provide a projection horizon of ${targetYears} years.`,
    "Return STRICT JSON only (no markdown, no commentary) with exactly these keys:",
    "{",
    '  "expectedInflationRate": number, // expected AVERAGE annual inflation rate in %',
    '  "expectedUsdGrowthRate": number, // expected average annual appreciation of the reference currency (USD) against local currency in %',
    '  "expectedReturnRate": number, // expected average annual nominal portfolio return (stocks/bonds mix) in %',
    '  "usdRate": number, // current exchange rate: how many local currency units per 1 USD',
    '  "rationale": "short 2-3 sentence explanation of the forecast"',
    "}",
    `Write the "rationale" text in ${language}.`,
    "Use realistic, data-informed estimates based on the country of the given currency.",
  ].join("\n")
}

function extractJsonObject(text: string): unknown {
  const withoutFences = text.replace(/```(?:json)?/gi, "").trim()
  const start = withoutFences.indexOf("{")
  const end = withoutFences.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) {
    throw new AiForecastError("parse", "No JSON object found in AI response.")
  }
  return JSON.parse(withoutFences.slice(start, end + 1))
}

function toFiniteNumber(value: unknown, key: string): number {
  const num = typeof value === "string" ? Number(value) : Number(value)
  if (!Number.isFinite(num)) {
    throw new AiForecastError(
      "parse",
      `AI response field "${key}" is not a number.`,
    )
  }
  return num
}

function parseForecast(payload: unknown): AiForecastResult {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new AiForecastError("parse", "AI response is not a JSON object.")
  }
  const record = payload as Record<string, unknown>

  const result: AiForecastResult = {
    expectedInflationRate: toFiniteNumber(
      record.expectedInflationRate,
      "expectedInflationRate",
    ),
    expectedUsdGrowthRate: toFiniteNumber(
      record.expectedUsdGrowthRate,
      "expectedUsdGrowthRate",
    ),
    expectedReturnRate: toFiniteNumber(
      record.expectedReturnRate,
      "expectedReturnRate",
    ),
    usdRate: toFiniteNumber(record.usdRate, "usdRate"),
    rationale:
      typeof record.rationale === "string" ? record.rationale.trim() : "",
  }

  if (result.usdRate <= 0) {
    throw new AiForecastError("parse", "AI response usdRate must be positive.")
  }

  return result
}

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

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
): Promise<AiForecastResult> {
  const endpoint = `${GEMINI_API_BASE}/${model}:generateContent`
  let response: Response
  try {
    response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: "Generate the forecast." }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
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
    throw mapHttpError(response.status, "gemini")
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

  return parseForecast(extractJsonObject(text))
}

/**
 * Normalizes a user-supplied base URL into a chat/completions endpoint.
 * Accepts both a bare base (https://host/v1) and a full endpoint.
 */
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

/**
 * Routes a request through a user-provided CORS proxy for providers that
 * block direct browser access (e.g. OpenCode Zen). The proxy URL must
 * contain a {url} placeholder which is replaced with the encoded endpoint.
 */
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

/** Hosts known to block direct browser (CORS) requests. */
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
    "Some providers (e.g. OpenCode Zen) block direct browser access; configure a CORS proxy in the AI settings to use them."
  if (isCorsBlockedHost(endpoint)) {
    return new AiForecastError(
      "cors",
      `${label} blocks direct browser access. Enable a CORS proxy in the AI settings.`,
    )
  }
  return new AiForecastError("network", `${label} network error. ${hint}`)
}

async function callOpenAiCompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  label: string,
): Promise<AiForecastResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`
  }

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the forecast." },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
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

  return parseForecast(extractJsonObject(content))
}

/**
 * Requests an economic forecast from the selected AI provider.
 *
 * @param request Provider, API key, model, endpoint, currency and horizon settings
 * @returns Parsed forecast values on an annual basis
 * @throws {AiForecastError} with a machine-readable `code`
 */
export async function forecastEconomics(
  request: ForecastRequest,
): Promise<AiForecastResult> {
  if (request.isDemo) {
    const currentCount = useSettingsStore.getState().demoForecastCount ?? 0
    if (currentCount >= MAX_DEMO_FORECASTS) {
      throw new AiForecastError(
        "quota",
        `Demo API forecast limit reached (${MAX_DEMO_FORECASTS}/${MAX_DEMO_FORECASTS}).`,
      )
    }
  }

  const systemPrompt = buildSystemPrompt(
    request.currencyCode,
    request.targetYears,
    request.language === "tr" ? "Turkish" : "English",
  )

  let result: AiForecastResult

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
    result = await callOpenAiCompatible(
      endpoint,
      request.apiKey,
      model,
      systemPrompt,
      "custom provider",
    )
  } else if (!request.apiKey.trim()) {
    throw new AiForecastError("auth", "No API key provided.")
  } else if (request.provider === "gemini") {
    const model = (request.model ?? "").trim() || GEMINI_MODEL
    result = await callGemini(request.apiKey.trim(), model, systemPrompt)
  } else {
    const model = (request.model ?? "").trim() || OPENAI_MODEL
    result = await callOpenAiCompatible(
      OPENAI_ENDPOINT,
      request.apiKey,
      model,
      systemPrompt,
      "OpenAI API",
    )
  }

  if (request.isDemo) {
    useSettingsStore.getState().incrementDemoForecastCount()
  }

  return result
}
