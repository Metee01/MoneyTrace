/**
 * MoneyTrace AI forecast response verification tests.
 * Run with: npx tsx src/lib/ai-service.test.ts
 */

import { AiForecastError, forecastEconomics } from "./ai-service"

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function run(): Promise<void> {
  console.log("Running AI forecast service tests...\n")

  const originalFetch = globalThis.fetch
  const responses = [
    {
      choices: [
        {
          message: {
            content:
              '```json\n{"expectedInflationRate":3.2,"expectedUsdGrowthRate":1.1,"expectedReturnRate":8.5,"usdRate":36.4,"rationale":"Test"}\n```',
          },
        },
      ],
    },
    {
      choices: [
        {
          message: {
            content: [
              {
                type: "text",
                text: [
                  "expectedInflationRate: 4,2",
                  "expectedUsdGrowthRate: 2.1",
                  "expectedReturnRate: 9.5",
                  "usdRate: 40.25",
                ].join("\n"),
              },
            ],
          },
        },
      ],
    },
  ]

  globalThis.fetch = async () => {
    const body = responses.shift()
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const strict = await forecastEconomics({
      provider: "openai",
      apiKey: "test-key",
      model: "test-model",
      currencyCode: "TRY",
      targetYears: 10,
      language: "tr",
    })
    assert(strict.expectedInflationRate === 3.2, "Strict JSON should parse")

    const loose = await forecastEconomics({
      provider: "openai",
      apiKey: "test-key",
      model: "test-model",
      currencyCode: "TRY",
      targetYears: 10,
      language: "tr",
    })
    assert(loose.expectedInflationRate === 4.2, "Decimal comma should parse")
    assert(loose.usdRate === 40.25, "Loose labeled values should parse")
  } finally {
    globalThis.fetch = originalFetch
  }

  const abortController = new AbortController()
  globalThis.fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => {
          const error = new Error("aborted")
          error.name = "AbortError"
          reject(error)
        },
        { once: true },
      )
    })
  const pendingForecast = forecastEconomics({
    provider: "openai",
    apiKey: "test-key",
    model: "test-model",
    currencyCode: "TRY",
    targetYears: 10,
    signal: abortController.signal,
  })
  abortController.abort()

  let abortError: unknown
  try {
    await pendingForecast
  } catch (error) {
    abortError = error
  } finally {
    globalThis.fetch = originalFetch
  }
  assert(
    abortError instanceof AiForecastError && abortError.code === "aborted",
    "An aborted forecast should preserve the aborted error code",
  )

  console.log("All AI forecast service tests passed.")
}

void run()
