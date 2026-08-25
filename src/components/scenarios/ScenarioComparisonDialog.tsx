import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { usePortfolioStore, useSettingsStore } from "../../store"
import { calculateProjection } from "../../engine"
import { useTheme } from "../../hooks/useTheme"
import { formatLocalCurrency, formatPercent } from "../../lib/formatters"
import type { ProjectionResult, Scenario } from "../../types"

interface ScenarioComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ScenarioResultItem {
  scenario: Scenario
  projection: ProjectionResult
}

interface ComparisonDataPoint {
  month: number
  label: string
  [key: string]: unknown
}

export const ScenarioComparisonDialog: React.FC<
  ScenarioComparisonDialogProps
> = ({ open, onOpenChange }) => {
  const { t, i18n } = useTranslation()
  const { scenarios, baselineScenarioId } = usePortfolioStore()
  const { currencyCode } = useSettingsStore()
  const { theme } = useTheme()

  const [valueType, setValueType] = useState<"real" | "nominal">("real")

  const locale = i18n.language === "tr" ? "tr-TR" : "en-US"

  // Calculate projections for each scenario
  const scenarioResults: ScenarioResultItem[] = useMemo(() => {
    return scenarios.map((s) => ({
      scenario: s,
      projection: calculateProjection(s.params),
    }))
  }, [scenarios])

  // Overlay Chart Data
  const chartData = useMemo(() => {
    if (!scenarioResults.length) return []

    const maxMonths = Math.max(
      ...scenarioResults.map((sr) => sr.projection.summary.totalMonths),
      0,
    )

    const data: ComparisonDataPoint[] = []

    for (let month = 1; month <= maxMonths; month++) {
      const sampleRow = scenarioResults[0]?.projection.rows.find(
        (r) => r.month === month,
      )
      const yearIndex = sampleRow ? sampleRow.yearIndex : Math.ceil(month / 12)
      const monthInYear = sampleRow
        ? sampleRow.monthInYear
        : ((month - 1) % 12) + 1

      const dataPoint: ComparisonDataPoint = {
        month,
        label: `${yearIndex}Y${monthInYear !== 12 ? ` ${monthInYear}M` : ""}`,
      }

      scenarioResults.forEach(({ scenario, projection }) => {
        const row = projection.rows.find((r) => r.month === month)
        if (row) {
          dataPoint[scenario.id] =
            valueType === "real" ? row.realValue : row.nominalValue
        }
      })

      data.push(dataPoint)
    }

    return data.filter((d) => d.month % 3 === 0 || d.month === 1)
  }, [scenarioResults, valueType])

  const isDark = theme === "dark"
  const gridColor = isDark ? "#334155" : "#e2e8f0"
  const axisColor = isDark ? "#94a3b8" : "#64748b"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] overflow-y-auto p-4 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-5xl sm:p-6">
        <DialogHeader className="pr-8">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold">
                {t("scenarios.compareScenarios")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Comparing {scenarios.length} scenarios side-by-side
              </DialogDescription>
            </div>

            {/* Value Type Toggle (Real / Nominal) */}
            <div className="grid w-full grid-cols-1 items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5 text-xs sm:w-auto sm:grid-cols-2">
              <Button
                variant={valueType === "real" ? "default" : "ghost"}
                size="sm"
                className="h-7 w-full px-2.5 text-xs"
                onClick={() => setValueType("real")}
              >
                {t("projection.realValue")}
              </Button>
              <Button
                variant={valueType === "nominal" ? "default" : "ghost"}
                size="sm"
                className="h-7 w-full px-2.5 text-xs"
                onClick={() => setValueType("nominal")}
              >
                {t("projection.nominalBalance")}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {scenarios.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {t("scenarios.noScenarios")}
          </div>
        ) : (
          <div className="min-w-0 space-y-4 pt-1 sm:space-y-6 sm:pt-2">
            {/* Comparison Overlay Chart */}
            <div className="h-[260px] min-w-0 w-full rounded-xl border border-border bg-card p-2 sm:h-[320px] sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 4, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: gridColor }}
                    dy={8}
                  />
                  <YAxis
                    width={56}
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      formatLocalCurrency(v, currencyCode, locale, true)
                    }
                  />
                  <Tooltip
                    formatter={(val: unknown, name: unknown) => [
                      formatLocalCurrency(Number(val), currencyCode, locale),
                      String(name),
                    ]}
                    contentStyle={{
                      backgroundColor: isDark ? "#0f172a" : "#ffffff",
                      borderColor: gridColor,
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />

                  {scenarios.map((s) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={s.id}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Scenario Summary Comparison Table */}
            <div
              className="min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border border-border"
              role="region"
              aria-label={t("scenarios.compareScenarios")}
              tabIndex={0}
            >
              <table className="w-full min-w-[760px] whitespace-nowrap text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3 text-right">Return Rate</th>
                    <th className="py-2.5 px-3 text-right">Inflation Rate</th>
                    <th className="py-2.5 px-3 text-right">Nominal Value</th>
                    <th className="py-2.5 px-3 text-right">Real Value</th>
                    <th className="py-2.5 px-3 text-right">Real ROI</th>
                    <th className="py-2.5 px-3 text-right">Net Real Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {scenarioResults.map(({ scenario, projection }) => {
                    const isRealProfitPos =
                      projection.summary.totalRealProfit >= 0
                    return (
                      <tr
                        key={scenario.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-2.5 font-sans font-semibold">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: scenario.color }}
                            />
                            <span className="text-foreground">
                              {scenario.name}
                            </span>
                            {scenario.id === baselineScenarioId && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-normal text-primary">
                                Baseline
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">
                          %{scenario.params.expectedReturnRate}
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">
                          %{scenario.params.expectedInflationRate}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-blue-600 dark:text-blue-400">
                          {formatLocalCurrency(
                            projection.summary.finalNominalValue,
                            currencyCode,
                            locale,
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatLocalCurrency(
                            projection.summary.finalRealValue,
                            currencyCode,
                            locale,
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {formatPercent(
                            projection.summary.realRoi,
                            true,
                            locale,
                          )}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-semibold ${
                            isRealProfitPos
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {formatLocalCurrency(
                            projection.summary.totalRealProfit,
                            currencyCode,
                            locale,
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
