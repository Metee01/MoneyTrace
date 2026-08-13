import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Bot,
  Settings,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { usePortfolioStore, useSettingsStore, MAX_DEMO_FORECASTS } from "../../store"
import { getDemoApiKey } from "../../lib/ai-chat-service"
import {
  forecastEconomics,
  AiForecastError,
  type AiForecastErrorCode,
} from "../../lib/ai-service"
import { formatPercent, formatNumber } from "../../lib/formatters"
import { annualPercentToMonthlyPercent } from "../../engine"
import type { AiForecastResult } from "../../types"

interface AiForecastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSettings?: () => void
}

const ERROR_CODE_KEYS: Record<AiForecastErrorCode, string> = {
  auth: "ai.errorAuth",
  network: "ai.errorNetwork",
  quota: "ai.errorQuota",
  parse: "ai.errorParse",
  config: "ai.errorConfig",
  cors: "ai.errorCors",
  unknown: "ai.errorUnknown",
}

const round2 = (value: number) => Math.round(value * 100) / 100

export const AiForecastModal: React.FC<AiForecastModalProps> = ({
  open,
  onOpenChange,
  onOpenSettings,
}) => {
  const { t, i18n } = useTranslation()
  const {
    aiApiKey,
    aiModelProvider,
    aiModel,
    aiBaseUrl,
    aiCorsProxy,
    aiCorsProxyEnabled,
    useDemoApi,
    demoForecastCount = 0,
    currencyCode,
  } = useSettingsStore()
  const { currentParams, setParams } = usePortfolioStore()

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AiForecastResult | null>(null)
  const [errorCode, setErrorCode] = useState<AiForecastErrorCode | null>(null)

  const demoApiKey = getDemoApiKey()
  const hasDemoKey = demoApiKey.length > 0
  const isUsingDemo = (useDemoApi ?? false) && hasDemoKey
  const isQuotaExceeded = isUsingDemo && demoForecastCount >= MAX_DEMO_FORECASTS

  const provider = isUsingDemo ? "gemini" : (aiModelProvider ?? "gemini")
  const apiKey = isUsingDemo ? demoApiKey : (aiApiKey ?? "")
  const model = isUsingDemo ? "" : (aiModel ?? "")
  const baseUrl = aiBaseUrl ?? ""
  const corsProxy = aiCorsProxy ?? ""
  const corsProxyEnabled = aiCorsProxyEnabled ?? false
  const isCustom = provider === "custom"
  const hasApiKey = (apiKey.trim().length > 0 || isCustom) && !isQuotaExceeded

  const handlePredict = async () => {
    if (isLoading || isQuotaExceeded) return

    if (isCustom) {
      if (!baseUrl.trim() || !model.trim()) {
        setErrorCode("config")
        return
      }
    } else if (!apiKey.trim()) {
      setErrorCode("auth")
      return
    }

    setErrorCode(null)
    setResult(null)
    setIsLoading(true)
    try {
      const forecast = await forecastEconomics({
        provider,
        apiKey: apiKey.trim(),
        model: model.trim(),
        baseUrl: baseUrl.trim(),
        corsProxy: corsProxyEnabled ? corsProxy.trim() : "",
        currencyCode,
        targetYears: Math.max(1, currentParams.targetYears || 1),
        language: i18n.language,
        isDemo: isUsingDemo,
      })
      setResult(forecast)
    } catch (err) {
      if (err instanceof AiForecastError) {
        setErrorCode(err.code)
      } else {
        setErrorCode("unknown")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    const isMonthly = currentParams.rateInputPeriod === "monthly"
    const toMode = (value: number) =>
      isMonthly ? round2(annualPercentToMonthlyPercent(value)) : value

    setParams({
      expectedInflationRate: toMode(result.expectedInflationRate),
      expectedUsdGrowthRate: toMode(result.expectedUsdGrowthRate),
      expectedReturnRate: toMode(result.expectedReturnRate),
      usdRate: result.usdRate,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-500" />
            {t("ai.modalTitle")}
          </DialogTitle>
          <DialogDescription>{t("ai.modalDesc")}</DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4 text-sm">
          {/* No API Key Warning */}
          {!hasApiKey && (
            <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs rounded-lg border border-amber-500/20 space-y-2">
              <p>{t("chat.noApiKey")}</p>
              {onOpenSettings && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    onOpenSettings()
                  }}
                  className="text-xs gap-1.5"
                >
                  <Settings className="w-3 h-3" />
                  {t("chat.configureInSettings")}
                </Button>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorCode && (
            <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20">
              {t(ERROR_CODE_KEYS[errorCode])}
            </div>
          )}

          {/* Predict Button */}
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-1.5"
            onClick={handlePredict}
            disabled={isLoading || !hasApiKey}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : result ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4 text-violet-500" />
            )}
            {isLoading
              ? t("ai.predicting")
              : result
                ? t("ai.predictAgain")
                : t("ai.predict")}
          </Button>

          {/* Forecast Preview */}
          {result && (
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("ai.previewTitle")} ({currencyCode})
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-md bg-background border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {t("ai.inflation")}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPercent(result.expectedInflationRate)}
                  </p>
                </div>
                <div className="p-2 rounded-md bg-background border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {t("ai.return")}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPercent(result.expectedReturnRate)}
                  </p>
                </div>
                <div className="p-2 rounded-md bg-background border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {t("ai.usdGrowth")}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPercent(result.expectedUsdGrowthRate)}
                  </p>
                </div>
                <div className="p-2 rounded-md bg-background border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {t("ai.usdRate")}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatNumber(result.usdRate, 2)}
                  </p>
                </div>
              </div>
              {result.rationale && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    {t("ai.rationale")}:{" "}
                  </span>
                  {result.rationale}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/70">
                {t("ai.disclaimer")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleApply} disabled={!result}>
            {t("ai.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
