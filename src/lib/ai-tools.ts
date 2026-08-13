/**
 * MoneyTrace - AI Tool Calling Layer (In-Band JSON Protocol)
 *
 * The AI model does not receive direct store access. Instead, it emits a
 * dedicated <TOOL_CALLS> block inside its text answer. This layer parses the
 * block, validates + sanitizes arguments against APP_CONFIG.engine.limits,
 * and executes the calls against the Zustand stores.
 *
 * Read-only tools can run freely; mutating tools always require explicit
 * user approval (allowMutation must be true).
 */

import { calculateProjection } from "../engine"
import { APP_CONFIG } from "../config"
import { forecastEconomics } from "./ai-service"
import { usePortfolioStore } from "../store/portfolio-store"
import { useSettingsStore } from "../store/settings-store"
import type {
  AiForecastResult,
  AiToolCall,
  AiToolCallResult,
  ProjectionParams,
  ProjectionResult,
  ProjectionRow,
} from "../types"

// ─── Protocol Markers ───────────────────────────────────────────────────────

export const TOOL_CALL_OPEN = "<TOOL_CALLS>"
export const TOOL_CALL_CLOSE = "</TOOL_CALLS>"

export type ToolKind = "read" | "mutate"

export interface AiToolSchema {
  name: string
  kind: ToolKind
  description: string
  argsDoc: string
}

/** Single source of truth for available tools (prompt + executor). */
export const TOOL_SCHEMAS: AiToolSchema[] = [
  {
    name: "calculate_projection",
    kind: "read",
    description:
      "Runs the exact portfolio projection engine. Merge 'updates' over the current parameters (hypothetical scenario), and returns the precise summary plus the requested month rows.",
    argsDoc:
      '{"updates": {optional partial portfolio params}, "highlightMonths": [optional array of month numbers to include, e.g. [13, 14]]}',
  },
  {
    name: "forecast_economics",
    kind: "read",
    description:
      "Requests an up-to-date macroeconomic forecast (inflation, return, USD growth, exchange rate) from the AI forecasting service. Does not change any portfolio data.",
    argsDoc: "{}",
  },
  {
    name: "apply_params",
    kind: "mutate",
    description:
      "Saves the given portfolio parameter values into the application form and recalculates the projection table.",
    argsDoc:
      '{"monthlyDca": 700, "expectedReturnRate": 9, "targetYears": 20, "withholdingTaxRate": 15}',
  },
  {
    name: "set_custom_withdrawal",
    kind: "mutate",
    description:
      "Sets (or clears) a one-time custom cash withdrawal amount for a specific month, e.g. the user plans to pull money out in a given month.",
    argsDoc:
      '{"month": 13, "amount": 50000} — omit "amount" or use null to clear the month. amount must be >= 0.',
  },
  {
    name: "clear_custom_withdrawals",
    kind: "mutate",
    description:
      "Removes all per-month custom withdrawal overrides, falling back to the regular monthly withdrawal.",
    argsDoc: "{}",
  },
  {
    name: "create_scenario",
    kind: "mutate",
    description:
      "Creates a comparison scenario (best/worst case, new strategy, etc.) using the current parameters merged with the provided overrides.",
    argsDoc:
      '{"name": "Aggressive", "color": "#22c55e", "updates": {"monthlyDca": 1500}}',
  },
  {
    name: "reset_params",
    kind: "mutate",
    description: "Restores every portfolio parameter to the app defaults.",
    argsDoc: "{}",
  },
]

// ─── Argument Sanitization ──────────────────────────────────────────────────

type ParamLimits = typeof APP_CONFIG.engine.limits

/**
 * Validates + clamps AI-provided parameter updates against the engine limits.
 * Invalid/unknown fields are dropped silently (they are reported by the caller).
 */
export function sanitizeParams(updates: unknown): Partial<ProjectionParams> {
  const result: Partial<ProjectionParams> = {}
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return result
  }

  const record = updates as Record<string, unknown>
  for (const [key, value] of Object.entries(record)) {
    if (key === "rateInputPeriod") {
      if (value === "annual" || value === "monthly") {
        result.rateInputPeriod = value
      }
      continue
    }

    const limit = APP_CONFIG.engine.limits[key as keyof ParamLimits]
    if (!limit) continue

    const num = typeof value === "string" ? Number(value) : (value as number)
    if (!Number.isFinite(num)) continue

    ;(result as Record<string, unknown>)[key] = Math.min(
      limit.max,
      Math.max(limit.min, num),
    )
  }

  return result
}

function sanitizeMonth(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value) : (value as number)
  if (!Number.isFinite(num) || num < 1 || !Number.isInteger(num)) return null
  return num
}

// ─── Tool Call Parsing ──────────────────────────────────────────────────────

function parseBlockPayload(payload: string): unknown {
  const trimmed = payload
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

/**
 * Extracts all <TOOL_CALLS> blocks from a model answer. Each block may hold
 * a single tool object or an array of them. Malformed blocks are ignored.
 */
export function parseToolCalls(text: string): AiToolCall[] {
  const calls: AiToolCall[] = []
  const pattern = new RegExp(
    `${TOOL_CALL_OPEN}([\\s\\S]*?)${TOOL_CALL_CLOSE}`,
    "gi",
  )
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const parsed = parseBlockPayload(match[1])
    if (parsed === null) continue
    const items = Array.isArray(parsed) ? parsed : [parsed]
    for (const item of items) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        continue
      }
      const rec = item as Record<string, unknown>
      const tool = typeof rec.tool === "string" ? rec.tool.trim() : ""
      if (!tool) continue
      const args =
        rec.args && typeof rec.args === "object" && !Array.isArray(rec.args)
          ? (rec.args as Record<string, unknown>)
          : {}
      calls.push({ tool, args })
    }
  }
  return calls
}

/** Strips all tool-call blocks from display text. */
export function stripToolCalls(text: string): string {
  const pattern = new RegExp(
    `${TOOL_CALL_OPEN}[\\s\\S]*?${TOOL_CALL_CLOSE}\\s*`,
    "gi",
  )
  return text
    .replace(pattern, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// ─── Human-Readable Proposal Descriptions ───────────────────────────────────

const LIMIT_LABELS: Partial<Record<keyof ProjectionParams, string>> = {
  initialCapital: "Initial Capital",
  monthlyDca: "Monthly DCA",
  dcaIncreaseRate: "Annual DCA Increase",
  monthlyWithdrawal: "Monthly Withdrawal",
  expectedReturnRate: "Expected Return",
  expectedInflationRate: "Expected Inflation",
  usdRate: "USD Rate",
  expectedUsdGrowthRate: "USD Growth",
  targetYears: "Horizon (Years)",
  withholdingTaxRate: "Withholding Tax",
}

function numericFieldLabel(key: string): string {
  return LIMIT_LABELS[key as keyof ProjectionParams] ?? key
}

/**
 * Produces a concise, human-readable summary of a mutating tool call for the
 * approval UI (e.g. "Monthly DCA: 500 -> 700").
 */
export function describeMutationCall(
  call: AiToolCall,
  getParams: () => ProjectionParams,
): string {
  const current = getParams()
  switch (call.tool) {
    case "apply_params": {
      const updates = sanitizeParams(call.args.updates ?? call.args)
      const lines = Object.entries(updates).map(([key, value]) => {
        const oldValue =
          key === "rateInputPeriod"
            ? (current.rateInputPeriod ?? "annual")
            : (current[key as keyof ProjectionParams] as number)
        return `${numericFieldLabel(key)}: ${oldValue} → ${value}`
      })
      return lines.length > 0 ? lines.join(", ") : "No valid updates provided"
    }
    case "set_custom_withdrawal": {
      const month = sanitizeMonth(call.args.month)
      if (month === null) return `Custom withdrawal: invalid month`
      const amountRaw = call.args.amount
      if (amountRaw === null || amountRaw === undefined) {
        return `Custom withdrawal for month ${month}: cleared`
      }
      const amount = Number(amountRaw)
      return Number.isFinite(amount) && amount >= 0
        ? `Custom withdrawal for month ${month}: ${amount.toLocaleString("en-US")}`
        : `Custom withdrawal for month ${month}: invalid amount`
    }
    case "clear_custom_withdrawals":
      return "Clear all custom monthly withdrawals"
    case "create_scenario": {
      const name =
        typeof call.args.name === "string" && call.args.name.trim()
          ? call.args.name.trim()
          : "Unnamed scenario"
      return `Create scenario "${name}"${
        call.args.updates && typeof call.args.updates === "object"
          ? " with new parameters"
          : ""
      }`
    }
    case "reset_params":
      return "Reset all portfolio parameters to defaults"
    default:
      return call.tool
  }
}

// ─── Projection Output Formatting ───────────────────────────────────────────

const ROW_KEYS: Array<[keyof ProjectionRow, string]> = [
  ["month", "month"],
  ["monthlyDca", "monthlyDca"],
  ["totalInvested", "totalInvested"],
  ["nominalValue", "nominalValue"],
  ["realValue", "realValue"],
  ["usdValue", "usdValue"],
  ["nominalProfit", "nominalProfit"],
  ["realProfit", "realProfit"],
  ["withdrawal", "withdrawal"],
  ["withholdingTax", "withholdingTax"],
  ["netWithdrawal", "netWithdrawal"],
  ["safeWithdrawal", "safeWithdrawal"],
  ["realSafeWithdrawal", "realSafeWithdrawal"],
  ["usdRate", "usdRate"],
  ["cumulativeInflationFactor", "cumulativeInflationFactor"],
]

function formatRows(
  projection: ProjectionResult,
  highlightMonths: unknown[],
): Record<string, unknown>[] {
  const maxMonths = APP_CONFIG.ai.toolCall.maxHighlightMonths
  const months =
    highlightMonths.length > 0
      ? highlightMonths
          .map(sanitizeMonth)
          .filter((m): m is number => m !== null)
          .slice(0, maxMonths)
      : [projection.rows[projection.rows.length - 1]?.month]

  return months
    .map((month) => {
      const row = projection.rows[month - 1]
      if (!row) return null
      const out: Record<string, unknown> = {}
      for (const [key, label] of ROW_KEYS) {
        out[label] = row[key]
      }
      return out
    })
    .filter((row): row is Record<string, unknown> => row !== null)
}

function runCalculateProjection(
  args: Record<string, unknown>,
  getParams: () => ProjectionParams,
): string {
  const updates = sanitizeParams(args.updates)
  const merged: ProjectionParams = { ...getParams(), ...updates }
  const projection = calculateProjection(merged)
  const summary = projection.summary
  const highlightRaw = Array.isArray(args.highlightMonths)
    ? (args.highlightMonths as unknown[])
    : []
  const output = {
    summary: {
      totalMonths: summary.totalMonths,
      totalInvested: summary.totalInvested,
      realTotalInvested: summary.realTotalInvested,
      finalNominalValue: summary.finalNominalValue,
      finalRealValue: summary.finalRealValue,
      finalUsdValue: summary.finalUsdValue,
      totalNominalProfit: summary.totalNominalProfit,
      totalRealProfit: summary.totalRealProfit,
      nominalRoi: summary.nominalRoi,
      realRoi: summary.realRoi,
      purchasingPowerLossRate: summary.purchasingPowerLossRate,
      totalWithdrawals: summary.totalWithdrawals,
      totalNetWithdrawals: summary.totalNetWithdrawals,
      totalRealWithdrawals: summary.totalRealWithdrawals,
      totalWithholdingTax: summary.totalWithholdingTax,
      finalUsdRate: summary.finalUsdRate,
    },
    rows: formatRows(projection, highlightRaw),
  }
  return JSON.stringify(output)
}

// ─── Executor ───────────────────────────────────────────────────────────────

export interface ToolDeps {
  getParams: () => ProjectionParams
  setParams: (updates: Partial<ProjectionParams>) => void
  setCustomWithdrawal: (month: number, amount?: number) => void
  clearCustomWithdrawals: () => void
  addScenario: (
    name: string,
    color: string,
    params?: ProjectionParams,
  ) => unknown
  resetParams: () => void
  forecastEconomics: () => Promise<AiForecastResult>
}

/**
 * Executes a single tool call.
 *
 * @param call Parsed tool call
 * @param deps Injected store/engine dependencies (testable without DOM)
 * @param allowMutation When false, every "mutate" tool is denied without effect
 */
export async function executeToolCall(
  call: AiToolCall,
  deps: ToolDeps,
  allowMutation: boolean,
): Promise<AiToolCallResult> {
  const schema = TOOL_SCHEMAS.find((s) => s.name === call.tool)
  if (!schema) {
    return { tool: call.tool, ok: false, output: `Unknown tool: ${call.tool}` }
  }
  if (schema.kind === "mutate" && !allowMutation) {
    return {
      tool: call.tool,
      ok: false,
      output: `Mutation denied: user did not approve ${call.tool}.`,
    }
  }

  switch (call.tool) {
    case "calculate_projection":
      return {
        tool: call.tool,
        ok: true,
        output: runCalculateProjection(call.args, deps.getParams),
      }

    case "forecast_economics": {
      try {
        const forecast = await deps.forecastEconomics()
        return { tool: call.tool, ok: true, output: JSON.stringify(forecast) }
      } catch (err) {
        return {
          tool: call.tool,
          ok: false,
          output:
            err instanceof Error
              ? `Forecast failed: ${err.message}`
              : "Forecast failed.",
        }
      }
    }

    case "apply_params": {
      const updates = sanitizeParams(call.args.updates ?? call.args)
      const keys = Object.keys(updates)
      if (keys.length === 0) {
        return {
          tool: call.tool,
          ok: false,
          output: "apply_params: no valid parameter updates provided.",
        }
      }
      deps.setParams(updates)
      return {
        tool: call.tool,
        ok: true,
        output: JSON.stringify({ applied: updates }),
      }
    }

    case "set_custom_withdrawal": {
      const month = sanitizeMonth(call.args.month)
      if (month === null) {
        return {
          tool: call.tool,
          ok: false,
          output: "set_custom_withdrawal: month must be a positive integer.",
        }
      }
      const amountRaw = call.args.amount
      if (amountRaw === null || amountRaw === undefined) {
        deps.setCustomWithdrawal(month)
        return {
          tool: call.tool,
          ok: true,
          output: JSON.stringify({ month, status: "cleared" }),
        }
      }
      const amount = Number(amountRaw)
      if (!Number.isFinite(amount) || amount < 0) {
        return {
          tool: call.tool,
          ok: false,
          output:
            "set_custom_withdrawal: amount must be a non-negative number.",
        }
      }
      deps.setCustomWithdrawal(month, amount)
      return {
        tool: call.tool,
        ok: true,
        output: JSON.stringify({ month, amount, status: "set" }),
      }
    }

    case "clear_custom_withdrawals":
      deps.clearCustomWithdrawals()
      return {
        tool: call.tool,
        ok: true,
        output: JSON.stringify({ cleared: true }),
      }

    case "create_scenario": {
      const name =
        typeof call.args.name === "string" && call.args.name.trim()
          ? call.args.name.trim()
          : "AI Scenario"
      const color =
        typeof call.args.color === "string" && call.args.color.trim()
          ? call.args.color.trim()
          : "#3b82f6"
      let params: ProjectionParams | undefined
      if (call.args.updates && typeof call.args.updates === "object") {
        const updates = sanitizeParams(call.args.updates)
        if (Object.keys(updates).length > 0) {
          params = { ...deps.getParams(), ...updates }
        }
      }
      try {
        const scenario = deps.addScenario(name, color, params)
        const id =
          scenario && typeof scenario === "object" && "id" in scenario
            ? String((scenario as { id: unknown }).id)
            : ""
        return {
          tool: call.tool,
          ok: true,
          output: JSON.stringify({ name, id }),
        }
      } catch (err) {
        return {
          tool: call.tool,
          ok: false,
          output:
            err instanceof Error
              ? `create_scenario failed: ${err.message}`
              : "create_scenario failed.",
        }
      }
    }

    case "reset_params":
      deps.resetParams()
      return {
        tool: call.tool,
        ok: true,
        output: JSON.stringify({ reset: true }),
      }

    default:
      return {
        tool: call.tool,
        ok: false,
        output: `Not implemented: ${call.tool}`,
      }
  }
}

// ─── Default Dependencies (browser wiring) ─────────────────────────────────

function readDemoApiKey(): string {
  try {
    return (import.meta.env.VITE_DEMO_API_KEY as string) ?? ""
  } catch {
    return ""
  }
}

/** Wires the executor to the real Zustand stores + AI forecast service. */
export function createDefaultToolDeps(): ToolDeps {
  return {
    getParams: () => usePortfolioStore.getState().currentParams,
    setParams: (updates) => usePortfolioStore.getState().setParams(updates),
    setCustomWithdrawal: (month, amount) =>
      usePortfolioStore.getState().setCustomWithdrawal(month, amount),
    clearCustomWithdrawals: () =>
      usePortfolioStore.getState().clearCustomWithdrawals(),
    addScenario: (name, color, params) =>
      usePortfolioStore.getState().addScenario(name, color, params),
    resetParams: () => usePortfolioStore.getState().resetParams(),
    forecastEconomics: async () => {
      const s = useSettingsStore.getState()
      const demoKey = readDemoApiKey()
      const isDemo = (s.useDemoApi ?? false) && demoKey.length > 0
      const key = isDemo ? demoKey : (s.aiApiKey ?? "")
      const provider = isDemo
        ? APP_CONFIG.ai.demo.provider
        : (s.aiModelProvider ?? "gemini")
      return forecastEconomics({
        provider,
        apiKey: key,
        model:
          (isDemo ? APP_CONFIG.ai.models.demo : (s.aiModel ?? "")).trim() ||
          undefined,
        baseUrl:
          (isDemo
            ? (APP_CONFIG.ai.demo.baseUrl ?? "")
            : (s.aiBaseUrl ?? "")
          ).trim() || undefined,
        corsProxy: s.aiCorsProxyEnabled ? (s.aiCorsProxy ?? "") : "",
        currencyCode: s.currencyCode,
        targetYears: APP_CONFIG.engine.defaultParams.targetYears,
        language: s.language,
        isDemo,
      })
    },
  }
}
