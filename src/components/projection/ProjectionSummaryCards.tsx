import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Wallet,
  ShieldCheck,
  DollarSign,
  Coins,
  TrendingUp,
  TrendingDown,
  Flame,
} from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { usePortfolioStore, useSettingsStore } from "../../store"
import { calculateProjection } from "../../engine"
import {
  formatLocalCurrency,
  formatUSD,
  formatPercent,
  formatNumber,
} from "../../lib/formatters"

export const ProjectionSummaryCards: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { currentParams } = usePortfolioStore()
  const { currencyCode } = useSettingsStore()

  const projectionResult = useMemo(() => {
    return calculateProjection(currentParams)
  }, [currentParams])

  const { summary } = projectionResult

  const isRealProfitPositive = summary.totalRealProfit >= 0
  const isNominalProfitPositive = summary.totalNominalProfit >= 0
  const locale = i18n.language === "tr" ? "tr-TR" : "en-US"

  const cardsData = [
    {
      id: "nominal",
      title: t("projection.nominalBalance"),
      value: formatLocalCurrency(
        summary.finalNominalValue,
        currencyCode,
        locale,
      ),
      subtext: `${t("projection.nominalReturn")}: ${formatPercent(summary.nominalRoi, true, locale)}`,
      badgeColor: isNominalProfitPositive
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      icon: Wallet,
      iconColor: "text-blue-500",
    },
    {
      id: "real",
      title: t("projection.realValue"),
      value: formatLocalCurrency(summary.finalRealValue, currencyCode, locale),
      subtext: `${t("projection.realReturn")}: ${formatPercent(summary.realRoi, true, locale)}`,
      badgeColor: isRealProfitPositive
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      icon: ShieldCheck,
      iconColor: isRealProfitPositive ? "text-emerald-500" : "text-rose-500",
    },
    {
      id: "usd",
      title: t("projection.usdBalance"),
      value: formatUSD(summary.finalUsdValue),
      subtext: `${t("projection.exchangeRate")}: ${formatNumber(summary.finalUsdRate, 2, locale)}`,
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: DollarSign,
      iconColor: "text-amber-500",
    },
    {
      id: "invested",
      title: t("projection.totalContribution"),
      value: formatLocalCurrency(summary.totalInvested, currencyCode, locale),
      subtext: `${t("projection.real")}: ${formatLocalCurrency(summary.realTotalInvested, currencyCode, locale)}`,
      badgeColor: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
      icon: Coins,
      iconColor: "text-slate-500",
    },
    {
      id: "realProfit",
      title: `${t("projection.real")} ${t("projection.realProfitLoss")}`,
      value: formatLocalCurrency(summary.totalRealProfit, currencyCode, locale),
      subtext: `${t("projection.safeWithdrawal")}: ${formatLocalCurrency(summary.totalSafeWithdrawal, currencyCode, locale)}`,
      badgeColor: isRealProfitPositive
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      icon: isRealProfitPositive ? TrendingUp : TrendingDown,
      iconColor: isRealProfitPositive ? "text-emerald-500" : "text-rose-500",
      valueColor: isRealProfitPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400",
    },
    {
      id: "inflationLoss",
      title: t("projection.inflationLoss"),
      value: `${formatNumber(summary.purchasingPowerLossRate, 1, locale)}%`,
      subtext: t("projection.inflationImpactTitle"),
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      icon: Flame,
      iconColor: "text-rose-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cardsData.map((card) => {
        const IconComponent = card.icon

        return (
          <Card
            key={card.id}
            className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg bg-muted ${card.iconColor}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div
                  className={`text-xl font-bold tracking-tight ${
                    card.valueColor || "text-foreground"
                  }`}
                >
                  {card.value}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${card.badgeColor}`}
                  >
                    {card.subtext}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
