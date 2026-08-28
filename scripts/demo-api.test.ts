/**
 * MoneyTrace Demo API proxy verification tests.
 * Run with: npx tsx scripts/demo-api.test.ts
 */

import { APP_CONFIG } from "../src/config/index.js"

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function run(): Promise<void> {
  console.log("Running Demo API proxy tests...\n")

  const originalDemoKey = process.env.DEMO_API_KEY
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL
  const originalFetch = globalThis.fetch

  process.env.DEMO_API_KEY = "test-key"
  delete process.env.UPSTASH_REDIS_REST_URL
  globalThis.fetch = async () => new Response("{}", { status: 200 })

  try {
    const { default: handler } = await import("../api/demo.js")

    const invalidBody = await handler(
      new Request("http://localhost/api/demo", {
        method: "POST",
        body: "null",
      }),
    )
    assert(invalidBody.status === 400, "Non-object JSON should be rejected")

    const statuses: number[] = []
    for (let index = 0; index <= APP_CONFIG.ai.demo.maxForecasts; index += 1) {
      const request = new Request("http://localhost/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "203.0.113.10",
        },
        body: JSON.stringify({
          mode: "forecast",
          userId: "memory-quota-test",
          payload: { messages: [] },
        }),
      })
      statuses.push((await handler(request)).status)
    }

    const allowedStatuses = statuses.slice(0, -1)
    assert(
      allowedStatuses.every((status) => status === 200),
      "Requests within the memory-store quota should succeed",
    )
    assert(
      statuses.at(-1) === 429,
      "The memory store should enforce the forecast quota",
    )
  } finally {
    globalThis.fetch = originalFetch
    if (originalDemoKey === undefined) delete process.env.DEMO_API_KEY
    else process.env.DEMO_API_KEY = originalDemoKey
    if (originalRedisUrl === undefined)
      delete process.env.UPSTASH_REDIS_REST_URL
    else process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl
  }

  console.log("All Demo API proxy tests passed.")
}

void run()
