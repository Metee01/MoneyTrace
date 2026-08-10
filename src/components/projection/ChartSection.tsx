import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardHeader, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { usePortfolioStore, useSettingsStore } from "../../store"
import { calculateProjection } from "../../engine"
import { useTheme } from "../../hooks/useTheme"
import { formatLocalCurrency, formatUSD } from "../../lib/formatters"
import { TrendingUp, Flame } from "lucide-react"
import { cn } from "../../lib/utils"

// --- Types ---
interface TooltipPayloadItem {
  color?: string
  name?: string
  value?: number
  payload?: Record<string, unknown>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  currencyMode?: "LOCAL" | "USD"
  currencyCode: string
  locale: string
  isInflationView?: boolean
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  currencyMode = "LOCAL",
  currencyCode,
  locale,
  isInflationView = false,
}) => {
  if (!active || !payload || !payload.length) return null

  if (isInflationView) {
    const data = payload[0]?.payload as
      | {
          nominalValue?: number
          inflationLoss?: number
          [key: string]: unknown
        }
      | undefined

    if (!data) return null

    return (
      <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-[220px]">
        <p className="font-semibold text-sm border-b border-border pb-1 mb-1">
          {label}
        </p>
        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground">Nominal Portfolio:</span>
          <span className="font-semibold font-mono text-blue-500">
            {formatLocalCurrency(
              Number(data.nominalValue || 0),
              currencyCode,
              locale,
            )}
          </span>
        </div>
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            className="flex justify-between items-center gap-4"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
            </div>
            <span className="font-semibold font-mono">
              {formatLocalCurrency(
                Number(entry.value || 0),
                currencyCode,
                locale,
              )}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-[200px]">
      <p className="font-semibold text-sm border-b border-border pb-1 mb-1">
        {label}
      </p>
      {payload.map((entry: TooltipPayloadItem, index: number) => {
        const valueFormatter = (val: number) =>
          currencyMode === "USD"
            ? formatUSD(val)
            : formatLocalCurrency(val, currencyCode, locale)
        return (
          <div
            key={`item-${index}`}
            className="flex justify-between items-center gap-4"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
            </div>
            <span className="font-semibold font-mono">
              {valueFormatter(entry.value ?? 0)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export const ChartSection: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { currentParams } = usePortfolioStore()
  const { currencyCode, currencySymbol } = useSettingsStore()
  const { theme } = useTheme()

  const [activeTab, setActiveTab] = useState<"growth" | "inflation">("growth")
  const [currencyMode, setCurrencyMode] = useState<"LOCAL" | "USD">("LOCAL")
  const [filterMode, setFilterMode] = useState<"all" | "yearly">("all")

  const locale = i18n.language === "tr" ? "tr-TR" : "en-US"

  const projectionResult = useMemo(() => {
    return calculateProjection(currentParams)
  }, [currentParams])

  const isDark = theme === "dark"

  const colors = {
    nominal: isDark ? "#3b82f6" : "#2563eb", // blue
    real: isDark ? "#10b981" : "#059669", // emerald
    invested: isDark ? "#94a3b8" : "#64748b", // slate
    usd: isDark ? "#f59e0b" : "#d97706", // amber
    lossArea: isDark ? "#f43f5e" : "#e11d48", // Rose / Red
    grid: isDark ? "#334155" : "#e2e8f0",
    axisText: isDark ? "#94a3b8" : "#64748b",
  }

  // --- Growth Chart Data ---
  const growthChartData = useMemo(() => {
    const rows =
      filterMode === "yearly"
        ? projectionResult.rows.filter((r) => r.monthInYear === 12)
        : projectionResult.rows

    return rows.map((r) => {
      const yearLabel = `${r.yearIndex}Y${r.monthInYear !== 12 ? ` ${r.monthInYear}M` : ""}`
      return {
        month: r.month,
        label: filterMode === "yearly" ? `${r.yearIndex}Y` : yearLabel,
        nominalValue: r.nominalValue,
        realValue: r.realValue,
        totalInvested: r.totalInvested,
        realTotalInvested: r.realTotalInvested,
        usdValue: r.usdValue,
        usdInvested: Math.round((r.totalInvested / r.usdRate) * 100) / 100,
      }
    })
  }, [projectionResult.rows, filterMode])

  // --- Inflation Impact Data ---
  const inflationChartData = useMemo(() => {
    const rows =
      filterMode === "yearly"
        ? projectionResult.rows.filter((r) => r.monthInYear === 12)
        : projectionResult.rows

    return rows.map((r) => {
      const yearLabel = `${r.yearIndex}Y${r.monthInYear !== 12 ? ` ${r.monthInYear}M` : ""}`
      const inflationLoss = Math.max(0, r.nominalValue - r.realValue)

      return {
        month: r.month,
        label: filterMode === "yearly" ? `${r.yearIndex}Y` : yearLabel,
        nominalValue: r.nominalValue,
        realValue: r.realValue,
        inflationLoss: Math.round(inflationLoss * 100) / 100,
        totalInvested: r.totalInvested,
      }
    })
  }, [projectionResult.rows, filterMode])

  const formatYAxis = (val: number) => {
    if (activeTab === "growth" && currencyMode === "USD") {
      return formatUSD(val, true)
    }
    return formatLocalCurrency(val, currencyCode, locale, true)
  }

  return (
    <Card className="w-full shadow-sm border border-border bg-card">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Integrated Tabs & Subtitle */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center rounded-xl border border-border bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("growth")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                  activeTab === "growth"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                )}
              >
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>{t("projection.chartTitle")}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("inflation")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                  activeTab === "inflation"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                )}
              >
                <Flame className="w-4 h-4 text-rose-500" />
                <span>{t("projection.inflationImpactTitle")}</span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground px-0.5">
              {activeTab === "growth"
                ? currencyMode === "LOCAL"
                  ? t("projection.chartGrowthSub")
                  : t("projection.chartUsdSub")
                : t("projection.chartInflationSub")}
            </p>
          </div>

          {/* Right: Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Filter Mode */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
              <Button
                variant={filterMode === "all" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setFilterMode("all")}
              >
                {t("table.allMonths")}
              </Button>
              <Button
                variant={filterMode === "yearly" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setFilterMode("yearly")}
              >
                {t("table.yearlySummary")}
              </Button>
            </div>

            {/* Currency Mode Switcher - Only visible on Growth tab */}
            {activeTab === "growth" && (
              <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
                <Button
                  variant={currencyMode === "LOCAL" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setCurrencyMode("LOCAL")}
                >
                  {currencySymbol} {currencyCode}
                </Button>
                <Button
                  variant={currencyMode === "USD" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setCurrencyMode("USD")}
                >
                  $ USD
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "growth" ? (
              <LineChart
                data={growthChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke={colors.axisText}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                  dy={8}
                />
                <YAxis
                  stroke={colors.axisText}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                  dx={-8}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      currencyMode={currencyMode}
                      currencyCode={currencyCode}
                      locale={locale}
                    />
                  }
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
                />

                {currencyMode === "LOCAL" ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="nominalValue"
                      name={`${t("projection.nominalBalance")} (${currencySymbol})`}
                      stroke={colors.nominal}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="realValue"
                      name={`${t("projection.realValue")} (${currencySymbol})`}
                      stroke={colors.real}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalInvested"
                      name={`${t("projection.totalContribution")} (${currencySymbol})`}
                      stroke={colors.invested}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </>
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="usdValue"
                      name={`${t("projection.usdBalance")} ($)`}
                      stroke={colors.usd}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="usdInvested"
                      name={`Invested ($)`}
                      stroke={colors.invested}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </>
                )}
              </LineChart>
            ) : (
              <AreaChart
                data={inflationChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={colors.real}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors.real}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={colors.lossArea}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors.lossArea}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke={colors.axisText}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                  dy={8}
                />
                <YAxis
                  stroke={colors.axisText}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                  dx={-8}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      isInflationView
                      currencyCode={currencyCode}
                      locale={locale}
                    />
                  }
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
                />

                <Area
                  type="monotone"
                  dataKey="realValue"
                  name={`${t("projection.realValue")} (${currencySymbol})`}
                  stackId="1"
                  stroke={colors.real}
                  fill="url(#realGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="inflationLoss"
                  name={`${t("projection.inflationLoss")} (${currencySymbol})`}
                  stackId="1"
                  stroke={colors.lossArea}
                  fill="url(#lossGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
