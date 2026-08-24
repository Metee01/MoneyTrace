/**
 * MoneyTrace AI chat prompt verification tests.
 * Run with: npx tsx src/lib/ai-chat-service.test.ts
 */

import type { ChatMessage } from "../types"
import { calculateProjection } from "../engine"
import { DEFAULT_PROJECTION_PARAMS } from "../store/portfolio-store"
import { APP_CONFIG } from "../config"
import { extractOpenAiResponseText } from "./ai-response"
import {
  buildSystemPrompt,
  sendChatMessage,
  type PortfolioContext,
} from "./ai-chat-service"

const context: PortfolioContext = {
  params: { ...DEFAULT_PROJECTION_PARAMS },
  summary: null,
  projection: null,
  currencyCode: "USD",
  language: "tr",
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function assertIncludes(value: string, expected: string): void {
  assert(value.includes(expected), `Expected text to include: ${expected}`)
}

function assertExcludes(value: string, expected: string): void {
  assert(!value.includes(expected), `Expected text to exclude: ${expected}`)
}

async function run(): Promise<void> {
  console.log("Running AI chat service tests...\n")

  const prompt = buildSystemPrompt(context)
  assertIncludes(prompt, "clear, direct, and professional")
  assertIncludes(prompt, "Never begin with a greeting")
  assertIncludes(prompt, '"Great question"')
  assertIncludes(prompt, '"Harika soru"')
  assertIncludes(prompt, "Never end with an offer to help")
  assertIncludes(prompt, "Ask one brief clarifying question only when")
  assertIncludes(prompt, "only when giving an individualized recommendation")
  assertExcludes(prompt, "knowledgeable and friendly")
  assertExcludes(prompt, "Always include appropriate disclaimers")

  const projection = calculateProjection(DEFAULT_PROJECTION_PARAMS)
  const compactPrompt = buildSystemPrompt({
    ...context,
    summary: projection.summary,
    projection,
  })
  assertIncludes(compactPrompt, "They are intentionally omitted")
  assertExcludes(compactPrompt, "• Month 1 (Y1M1)")
  assert(
    compactPrompt.length < 15_000,
    "System prompt should not embed the full monthly projection table",
  )
  assert(
    APP_CONFIG.ai.demo.reasoning.effort === "medium" &&
      APP_CONFIG.ai.demo.reasoning.exclude,
    "Demo model should reserve output budget for the final answer",
  )
  assert(
    extractOpenAiResponseText({
      choices: [
        {
          message: {
            content: [
              { type: "text", text: "Part one. " },
              { type: "text", text: "Part two." },
            ],
          },
        },
      ],
    }) === "Part one. Part two.",
    "OpenAI-compatible content part arrays should be joined",
  )

  const messages: ChatMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to MoneyTrace AI.",
      timestamp: 1,
    },
    {
      id: "user",
      role: "user",
      content: "What is my current horizon?",
      timestamp: 2,
    },
  ]

  const originalFetch = globalThis.fetch
  let requestBody: {
    messages?: Array<{ role?: string; content?: string }>
  } = {}

  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as typeof requestBody
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "10 years." } }] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }

  try {
    await sendChatMessage({
      provider: "openai",
      apiKey: "test-key",
      model: "test-model",
      messages,
      context,
    })
  } finally {
    globalThis.fetch = originalFetch
  }

  assert(
    requestBody.messages?.[0]?.role === "system",
    "System prompt should be the first provider message",
  )
  assertIncludes(
    requestBody.messages?.[0]?.content ?? "",
    "Mandatory Response Style",
  )
  assert(
    requestBody.messages?.[1]?.role === "user",
    "User message should follow the system prompt",
  )
  assert(
    requestBody.messages?.[1]?.content === messages[1].content,
    "Provider should receive the user message unchanged",
  )
  assert(
    requestBody.messages?.length === 2,
    "UI welcome message should not be sent to the provider",
  )

  console.log("All AI chat service tests passed.")
}

void run()
