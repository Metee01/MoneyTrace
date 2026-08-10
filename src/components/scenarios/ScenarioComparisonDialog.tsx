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
  const { scenarios } = usePortfolioStore()
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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold">
                {t("scenarios.compareScenarios")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Comparing {scenarios.length} scenarios side-by-side
              </DialogDescription>
            </div>

            {/* Value Type Toggle (Real / Nominal) */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
              <Button
                variant={valueType === "real" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setValueType("real")}
              >
                {t("projection.realValue")}
              </Button>
              <Button
                variant={valueType === "nominal" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
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
          <div className="space-y-6 pt-2">
            {/* Comparison Overlay Chart */}
            <div className="h-[320px] w-full border border-border rounded-xl p-4 bg-card">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
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
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-xs text-left">
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
                        <td className="py-2.5 px-3 font-sans font-semibold flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: scenario.color }}
                          />
                          <span className="text-foreground">
                            {scenario.name}
                          </span>
                          {scenario.isBaseline && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary/10 text-primary font-normal">
                              Baseline
                            </span>
                          )}
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
