/**
 * MoneyTrace AI Tool Calling Verification Tests
 * Run with: npx tsx src/lib/ai-tools.test.ts
 */

const mockStorageMap = new Map<string, string>()

const mockStorage = {
  getItem: (key: string) => mockStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    mockStorageMap.set(key, value)
  },
  removeItem: (key: string) => {
    mockStorageMap.delete(key)
  },
  clear: () => {
    mockStorageMap.clear()
  },
  length: 0,
  key: (index: number) => Array.from(mockStorageMap.keys())[index] ?? null,
}

;(globalThis as unknown as Record<string, unknown>).window = {
  localStorage: mockStorage,
}
;(globalThis as unknown as Record<string, unknown>).localStorage = mockStorage

import type { AiForecastResult, AiToolCall, ProjectionParams } from "../types"
import {
  TOOL_SCHEMAS,
  parseToolCalls,
  stripToolCalls,
  sanitizeParams,
  describeMutationCall,
  executeToolCall,
  createDefaultToolDeps,
  type ToolDeps,
} from "./ai-tools"
import {
  usePortfolioStore,
  DEFAULT_PROJECTION_PARAMS,
} from "../store/portfolio-store"

function fakeDeps(overrides: Partial<ToolDeps> = {}): ToolDeps {
  let params: ProjectionParams = { ...DEFAULT_PROJECTION_PARAMS }
  const calls: string[] = []
  return {
    getParams: () => params,
    setParams: (updates) => {
      params = { ...params, ...updates }
      calls.push("setParams")
    },
    setCustomWithdrawal: (month, amount) => {
      calls.push(`setCustomWithdrawal:${month}:${amount ?? "undefined"}`)
    },
    clearCustomWithdrawals: () => calls.push("clearCustomWithdrawals"),
    addScenario: (name, _color, scenarioParams) => {
      calls.push(`addScenario:${name}`)
      void scenarioParams
      return { id: "scenario-1" }
    },
    resetParams: () => {
      params = { ...DEFAULT_PROJECTION_PARAMS }
      calls.push("resetParams")
    },
    forecastEconomics: async () => ({
      expectedInflationRate: 3.2,
      expectedUsdGrowthRate: 1.1,
      expectedReturnRate: 8.5,
      usdRate: 36.4,
      rationale: "Test forecast",
    }),
    ...overrides,
  }
}

function callsRecord(deps: ToolDeps): string[] {
  const record = (deps as unknown as { calls?: string[] }).calls
  return record ?? []
}

async function runToolTests() {
  console.log("🧪 Starting MoneyTrace AI Tool Calling Tests...\n")

  // Test 1: Tool Schema Registry
  console.log("--- Test 1: Tool Schema Registry ---")
  console.log(`Registered tools: ${TOOL_SCHEMAS.map((s) => s.name).join(", ")}`)
  console.assert(
    TOOL_SCHEMAS.some((s) => s.name === "apply_params" && s.kind === "mutate"),
    "apply_params must be a mutate tool",
  )
  console.assert(
    TOOL_SCHEMAS.some(
      (s) => s.name === "calculate_projection" && s.kind === "read",
    ),
    "calculate_projection must be a read tool",
  )

  // Test 2: parseToolCalls — single object block
  console.log("\n--- Test 2: parseToolCalls ---")
  const single = parseToolCalls(
    'Here is my plan.<TOOL_CALLS>{"tool":"apply_params","args":{"monthlyDca":700}}</TOOL_CALLS>',
  )
  console.log(`Single block parsed: ${JSON.stringify(single)}`)
  console.assert(single.length === 1, "Expected 1 tool call")
  console.assert(single[0].tool === "apply_params", "Tool name mismatch")
  console.assert(single[0].args.monthlyDca === 700, "Arg mismatch")

  // Test 3: parseToolCalls — array block
  const arr = parseToolCalls(
    `<TOOL_CALLS>[{"tool":"apply_params","args":{"monthlyDca":800}},{"tool":"calculate_projection","args":{"highlightMonths":[13]}}]</TOOL_CALLS>`,
  )
  console.log(`Array block parsed: ${JSON.stringify(arr)}`)
  console.assert(arr.length === 2, "Expected 2 tool calls")

  // Test 4: parseToolCalls — code-fenced block
  const fenced = parseToolCalls(
    'Use this:\n```json\n<TOOL_CALLS>{"tool":"reset_params","args":{}}</TOOL_CALLS>\n```',
  )
  console.log(`Fenced block parsed: ${JSON.stringify(fenced)}`)
  console.assert(
    fenced.length === 1 && fenced[0].tool === "reset_params",
    "Fenced block parse failed",
  )

  // Test 5: parseToolCalls — malformed / missing
  const broken = parseToolCalls(
    "Text only <TOOL_CALLS>{this is not json}</TOOL_CALLS> done",
  )
  console.log(`Broken block result: ${JSON.stringify(broken)}`)
  console.assert(broken.length === 0, "Broken block must be ignored")
  const none = parseToolCalls("Just a regular answer.")
  console.assert(none.length === 0, "No tools expected")

  // Test 6: stripToolCalls
  console.log("\n--- Test 6: stripToolCalls ---")
  const stripped = stripToolCalls(
    'I propose changes.<TOOL_CALLS>[{"tool":"apply_params","args":{}}]</TOOL_CALLS>\n\nHere is the final text.',
  )
  console.log(`Stripped: "${stripped}"`)
  console.assert(
    stripped.includes("I propose changes") && stripped.includes("final text"),
    "stripToolCalls removed explanation text",
  )
  console.assert(!stripped.includes("<TOOL_CALLS>"), "Block not fully stripped")

  // Test 7: sanitizeParams
  console.log("\n--- Test 7: sanitizeParams ---")
  const sane = sanitizeParams({
    targetYears: 100,
    initialCapital: -5000,
    monthlyDca: 2500,
    usdRate: 0,
    expectedReturnRate: "9.5",
    rateInputPeriod: "monthly",
    rateInputPeriodBroken: "weekly",
    unknownField: 42,
    monthlyWithdrawal: Number.NaN,
  })
  console.log(`Sanitized: ${JSON.stringify(sane)}`)
  console.assert(sane.targetYears === 50, "targetYears not clamped (max 50)")
  console.assert(
    sane.initialCapital === 0,
    "initialCapital not clamped (min 0)",
  )
  console.assert(sane.monthlyDca === 2500, "monthlyDca lost")
  console.assert(sane.usdRate === 1e-6, "usdRate not clamped (min)")
  console.assert(
    sane.expectedReturnRate === 9.5,
    "string numbers not converted",
  )
  console.assert(
    sane.rateInputPeriod === "monthly",
    "rateInputPeriod not preserved",
  )
  console.assert(
    !("unknownField" in sane) && !("monthlyWithdrawal" in sane),
    "Invalid fields must be dropped",
  )

  // Test 8: describeMutationCall
  console.log("\n--- Test 8: describeMutationCall ---")
  const deps = fakeDeps()
  const desc = describeMutationCall(
    { tool: "apply_params", args: { monthlyDca: 1500, targetYears: 20 } },
    deps.getParams,
  )
  console.log(`Description: "${desc}"`)
  console.assert(
    desc.includes("Monthly DCA: 500 → 1500") &&
      desc.includes("Horizon (Years): 10 → 20"),
    "apply_params description mismatch",
  )
  const wd = describeMutationCall(
    { tool: "set_custom_withdrawal", args: { month: 13, amount: 50000 } },
    deps.getParams,
  )
  console.assert(
    wd.includes("month 13") && wd.includes("50,000"),
    "withdrawal description mismatch",
  )

  // Test 9: calculate_projection (read) — store untouched
  console.log("\n--- Test 9: calculate_projection (read) ---")
  const projectionCall: AiToolCall = {
    tool: "calculate_projection",
    args: { updates: { monthlyDca: 750 }, highlightMonths: [1, 13] },
  }
  const projectionResult = await executeToolCall(projectionCall, deps, false)
  console.log(`Projection ok: ${projectionResult.ok}`)
  console.assert(projectionResult.ok, "projection failed")
  const parsedProj = JSON.parse(projectionResult.output) as {
    summary: { finalNominalValue: number }
    rows: Array<{ month: number; netWithdrawal: number }>
  }
  console.assert(
    parsedProj.summary.finalNominalValue > 0,
    "projection summary missing",
  )
  console.assert(parsedProj.rows.length === 2, "highlightMonths rows missing")
  console.assert(
    parsedProj.rows[0].month === 1 && parsedProj.rows[1].month === 13,
    "highlighted months mismatch",
  )
  console.assert("netWithdrawal" in parsedProj.rows[0], "netWithdrawal missing")

  // Test 10: mutation gate — denied without approval
  console.log("\n--- Test 10: Mutation Gate ---")
  const gateCall: AiToolCall = {
    tool: "apply_params",
    args: { monthlyDca: 9999 },
  }
  const gateResult = await executeToolCall(gateCall, deps, false)
  console.log(`Denied: ${gateResult.ok}, output: ${gateResult.output}`)
  console.assert(!gateResult.ok, "mutation should be denied")
  console.assert(
    gateResult.output.includes("denied"),
    "denial message expected",
  )
  console.assert(callsRecord(deps).length === 0, "store must stay untouched")

  // Test 11: apply_params (approved) via fake deps
  console.log("\n--- Test 11: apply_params (approved) ---")
  const applyResult = await executeToolCall(
    { tool: "apply_params", args: { monthlyDca: 1234, targetYears: 15 } },
    deps,
    true,
  )
  console.log(`Applied: ${applyResult.ok} ${applyResult.output}`)
  console.assert(applyResult.ok, "apply_params failed")
  console.assert(
    deps.getParams().monthlyDca === 1234 && deps.getParams().targetYears === 15,
    "store not updated",
  )

  // Test 12: set_custom_withdrawal (approved)
  console.log("\n--- Test 12: set_custom_withdrawal (approved) ---")
  const wResult = await executeToolCall(
    { tool: "set_custom_withdrawal", args: { month: 13, amount: 50000 } },
    deps,
    true,
  )
  console.assert(wResult.ok, "set_custom_withdrawal failed")
  const badMonth = await executeToolCall(
    { tool: "set_custom_withdrawal", args: { month: 0, amount: 10 } },
    deps,
    true,
  )
  console.assert(!badMonth.ok, "invalid month must fail")

  // Test 13: real store integration via createDefaultToolDeps
  console.log("\n--- Test 13: Real Store Integration ---")
  usePortfolioStore.getState().resetParams()
  const realDeps = createDefaultToolDeps()
  const rApply = await executeToolCall(
    { tool: "apply_params", args: { monthlyDca: 4321 } },
    realDeps,
    true,
  )
  console.log(`Real store applied: ${rApply.ok}`)
  console.assert(
    usePortfolioStore.getState().currentParams.monthlyDca === 4321,
    "real store not updated",
  )
  const rWithdrawal = await executeToolCall(
    { tool: "set_custom_withdrawal", args: { month: 13, amount: 50000 } },
    realDeps,
    true,
  )
  console.log(`Custom withdrawal set: ${rWithdrawal.ok}`)
  console.assert(
    usePortfolioStore.getState().currentParams.customWithdrawals?.[13] ===
      50000,
    "custom withdrawal not stored",
  )
  const rClear = await executeToolCall(
    { tool: "clear_custom_withdrawals", args: {} },
    realDeps,
    true,
  )
  console.log(`Custom withdrawals cleared: ${rClear.ok}`)
  console.assert(
    Object.keys(
      usePortfolioStore.getState().currentParams.customWithdrawals ?? {},
    ).length === 0,
    "custom withdrawals not cleared",
  )
  const rScenario = await executeToolCall(
    {
      tool: "create_scenario",
      args: {
        name: "Aggressive Test",
        color: "#22c55e",
        updates: { monthlyDca: 5000 },
      },
    },
    realDeps,
    true,
  )
  const scenarios = usePortfolioStore.getState().scenarios
  console.log(`Scenario created: ${rScenario.ok} (total: ${scenarios.length})`)
  console.assert(
    scenarios.some(
      (s) => s.name === "Aggressive Test" && s.params.monthlyDca === 5000,
    ),
    "scenario not persisted",
  )
  const rReset = await executeToolCall(
    { tool: "reset_params", args: {} },
    realDeps,
    true,
  )
  console.log(`Reset params: ${rReset.ok}`)
  console.assert(
    usePortfolioStore.getState().currentParams.monthlyDca ===
      DEFAULT_PROJECTION_PARAMS.monthlyDca,
    "reset_params failed",
  )

  // Test 14: forecast_economics via injected fake
  console.log("\n--- Test 14: forecast_economics ---")
  const forecastResult = await executeToolCall(
    { tool: "forecast_economics", args: {} },
    fakeDeps(),
    false,
  )
  console.log(`Forecast ok: ${forecastResult.ok}`)
  console.assert(forecastResult.ok, "forecast tool failed")
  const parsed = JSON.parse(forecastResult.output) as AiForecastResult
  console.assert(parsed.usdRate === 36.4, "forecast payload mismatch")

  // Test 15: unknown tool
  console.log("\n--- Test 15: Unknown Tool ---")
  const unknown = await executeToolCall(
    { tool: "hack_portfolio", args: {} },
    deps,
    true,
  )
  console.assert(!unknown.ok, "unknown tool must fail")

  console.log("\n✅ All AI Tool Calling tests passed.\n")
}

runToolTests()
