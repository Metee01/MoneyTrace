/**
 * MoneyTrace - Demo API Proxy Client
 *
 * Routes Demo API requests through the serverless proxy at `api/demo.ts`
 * so the shared demo API key never ships in the client bundle. The proxy
 * enforces usage quotas server-side and owns the secret key.
 */

import { useSettingsStore } from "../store/settings-store"
import { AiForecastError } from "./ai-service"

function readProxyUrl(): string {
  try {
    return (import.meta.env?.VITE_DEMO_PROXY_URL as string | undefined) ?? ""
  } catch {
    return ""
  }
}

/** Returns the configured demo proxy endpoint, or "" when unavailable. */
export function getDemoProxyUrl(): string {
  return readProxyUrl().trim()
}

/** Whether the Demo API feature is available (proxy configured). */
export function isDemoAvailable(): boolean {
  return getDemoProxyUrl().length > 0
}

function generateUserId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? fallbackUserId()
  } catch {
    return fallbackUserId()
  }
}

function fallbackUserId(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

/**
 * Returns a stable per-browser anonymous ID used by the proxy to enforce
 * usage quotas. Generated once and persisted in the settings store.
 */
export function getDemoUserId(): string {
  const existing = useSettingsStore.getState().demoUserId
  if (existing) return existing
  const id = generateUserId()
  useSettingsStore.getState().setDemoUserId(id)
  return id
}

function mapProxyError(status: number, body: unknown): AiForecastError {
  const message =
    (body as { error?: { message?: unknown } })?.error?.message?.toString() ??
    ""
  if (status === 429) {
    return new AiForecastError(
      "quota",
      message || "Demo API rate limit or quota exceeded.",
    )
  }
  if (status === 401 || status === 403) {
    return new AiForecastError(
      "auth",
      message || `Demo API rejected the request (HTTP ${status}).`,
    )
  }
  if (status === 503) {
    return new AiForecastError(
      "config",
      message || "Demo API is not configured on the server.",
    )
  }
  return new AiForecastError(
    "network",
    message || `Demo API proxy returned HTTP ${status}.`,
  )
}

/**
 * Sends a chat/completions-style payload to the demo proxy.
 *
 * @param mode Quota bucket: "forecast" or "chat"
 * @param payload OpenAI-compatible request body (model, messages, ...)
 * @returns The upstream provider JSON response
 * @throws {AiForecastError} with a machine-readable `code`
 */
export async function callDemoProxy(
  mode: "forecast" | "chat",
  payload: unknown,
): Promise<unknown> {
  const endpoint = getDemoProxyUrl()
  if (!endpoint) {
    throw new AiForecastError(
      "config",
      "Demo API is not configured. Enable it in the deployment environment.",
    )
  }

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        userId: getDemoUserId(),
        payload,
      }),
    })
  } catch {
    throw new AiForecastError(
      "network",
      "Network error while calling the Demo API proxy.",
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new AiForecastError(
      "parse",
      "Invalid JSON response from the Demo API proxy.",
    )
  }

  if (!response.ok) {
    throw mapProxyError(response.status, data)
  }

  return data
}
