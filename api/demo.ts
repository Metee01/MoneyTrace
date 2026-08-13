/**
 * MoneyTrace - Demo API Proxy (Vercel Serverless Function)
 *
 * Owns the shared demo API key (DEMO_API_KEY env var) so it never ships in
 * the client bundle. Enforces per-user lifetime quotas, per-IP daily caps,
 * and a chat cooldown server-side; forwards approved requests to the demo
 * provider with the secret key attached.
 *
 * Requires on Vercel: DEMO_API_KEY env var (optional Upstash Redis
 * integration for persistent counters; falls back to in-memory counters
 * otherwise).
 */

import { APP_CONFIG } from "../src/config"

export const config = { runtime: "edge" }

const DEMO_KEY = process.env.DEMO_API_KEY ?? ""

const PROVIDER_BASE = APP_CONFIG.ai.demo.baseUrl.replace(/\/+$/, "")
const PROVIDER_ENDPOINT = `${PROVIDER_BASE}/chat/completions`
const MODEL = APP_CONFIG.ai.models.demo

const MAX_FORECASTS = APP_CONFIG.ai.demo.maxForecasts
const MAX_CHAT_MESSAGES = APP_CONFIG.ai.demo.maxChatMessages
const COOLDOWN_MS = APP_CONFIG.ai.demo.cooldownMs

/** Per-IP daily caps: multiples of the per-user lifetime quotas. */
const IP_FORECAST_CAP = MAX_FORECASTS * 3
const IP_CHAT_CAP = MAX_CHAT_MESSAGES * 3
const IP_WINDOW_MS = 24 * 60 * 60 * 1000

/** Anti-abuse payload guards. */
const MAX_PAYLOAD_BYTES = 100_000
const MAX_MESSAGES = 50
const UPSTREAM_TIMEOUT_MS = 60_000

interface CounterStore {
  incr(key: string): Promise<number>
  decr(key: string): Promise<void>
  /** True when the key was absent (and now locked with a TTL). */
  acquire(key: string, ttlMs: number): Promise<boolean>
}

function createMemoryStore(): CounterStore {
  const map = new Map<string, { count: number; expire: number }>()
  const now = () => Date.now()
  return {
    async incr(key) {
      const entry = map.get(key)
      if (!entry || entry.expire <= now()) {
        map.set(key, { count: 1, expire: 0 })
        return 1
      }
      entry.count += 1
      return entry.count
    },
    async decr(key) {
      const entry = map.get(key)
      if (entry && entry.count > 0) entry.count -= 1
    },
    async acquire(key, ttlMs) {
      const entry = map.get(key)
      if (entry && entry.expire > now()) return false
      map.set(key, { count: 1, expire: now() + ttlMs })
      return true
    },
  }
}

const memoryStore = createMemoryStore()
let redis: typeof import("@upstash/redis").Redis | null | undefined

async function resolveStore(): Promise<CounterStore> {
  if (redis === undefined) {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const { Redis } = await import("@upstash/redis")
        redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
        })
      } catch {
        redis = null
      }
    } else {
      redis = null
    }
  }
  if (!redis) return memoryStore
  return {
    async incr(key) {
      return redis!.incr(key)
    },
    async decr(key) {
      return redis!.decr(key)
    },
    async acquire(key, ttlMs) {
      const result = await redis!.set(key, "1", { nx: true, px: ttlMs })
      return result === "OK"
    },
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? ""
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  }
  if (origin) headers["Access-Control-Allow-Origin"] = origin
  return headers
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  ).slice(0, 64)
}

function safeId(value: unknown): string {
  return String(value ?? "")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 64)
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders(req)

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers })
  }
  if (req.method !== "POST") {
    return json(405, { error: { message: "Method not allowed." } })
  }
  if (!DEMO_KEY) {
    return json(503, {
      error: { message: "Demo API is not configured on the server." },
    })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(400, { error: { message: "Invalid JSON body." } })
  }

  const mode = body.mode === "chat" ? "chat" : "forecast"
  const userId = safeId(body.userId)
  if (!userId) {
    return json(400, { error: { message: "Missing userId." } })
  }
  const payload = body.payload
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json(400, { error: { message: "Missing payload." } })
  }
  if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
    return json(400, { error: { message: "Payload too large." } })
  }
  const messages = (payload as { messages?: unknown }).messages ?? []
  if (Array.isArray(messages) && messages.length > MAX_MESSAGES) {
    return json(400, { error: { message: "Too many messages." } })
  }

  const store = await resolveStore()
  const ip = clientIp(req)
  const day = Math.floor(Date.now() / IP_WINDOW_MS)
  const userKey = `demo:u:${userId}:${mode}`
  const ipKey = `demo:ip:${ip}:${mode}:${day}`
  const userMax = mode === "chat" ? MAX_CHAT_MESSAGES : MAX_FORECASTS
  const ipMax = mode === "chat" ? IP_CHAT_CAP : IP_FORECAST_CAP

  if (mode === "chat") {
    const cooldownOk = await store.acquire(
      `demo:cooldown:${userId}`,
      COOLDOWN_MS,
    )
    if (!cooldownOk) {
      return json(429, {
        error: {
          message:
            "Please wait a few seconds between messages when using Demo API.",
        },
      })
    }
  }

  const rollbackQuota = async () => {
    await store.decr(userKey)
    await store.decr(ipKey)
  }

  const userCount = await store.incr(userKey)
  if (userCount > userMax) {
    await store.decr(userKey)
    return json(429, {
      error: {
        message: `Demo API ${mode} limit reached (${userMax}/${userMax}).`,
      },
    })
  }
  const ipCount = await store.incr(ipKey)
  if (ipCount > ipMax) {
    await rollbackQuota()
    return json(429, {
      error: {
        message: `Demo API ${mode} daily usage limit reached for this network.`,
      },
    })
  }

  const upstreamBody = { ...(payload as Record<string, unknown>), model: MODEL }
  let upstream: Response
  try {
    upstream = await fetch(PROVIDER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEMO_KEY}`,
        "HTTP-Referer": "https://moneytrace.metee.com.tr",
        "X-Title": APP_CONFIG.app.name,
      },
      body: JSON.stringify(upstreamBody),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch {
    await rollbackQuota()
    return json(502, { error: { message: "Upstream provider unreachable." } })
  }

  const upstreamText = await upstream.text()
  if (!upstream.ok) {
    await rollbackQuota()
    return new Response(upstreamText, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(upstreamText, {
    status: 200,
    headers: { ...headers, "Content-Type": "application/json" },
  })
}
