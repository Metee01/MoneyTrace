import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Sparkles,
  KeyRound,
  Loader2,
  ExternalLink,
  RefreshCw,
  Bot,
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
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { usePortfolioStore, useSettingsStore } from "../../store"
import {
  forecastEconomics,
  AiForecastError,
  GEMINI_MODEL,
  OPENAI_MODEL,
  type AiForecastErrorCode,
} from "../../lib/ai-service"
import { formatPercent, formatNumber } from "../../lib/formatters"
import { annualPercentToMonthlyPercent } from "../../engine"
import type { AiForecastResult, AiModelProvider } from "../../types"

interface AiForecastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
}) => {
  const { t, i18n } = useTranslation()
  const {
    aiApiKey: storedKey,
    aiModelProvider: storedProvider,
    aiModel: storedModel,
    aiBaseUrl: storedBaseUrl,
    aiCorsProxy: storedCorsProxy,
    aiCorsProxyEnabled: storedCorsProxyEnabled,
    setAiSettings,
    currencyCode,
  } = useSettingsStore()
  const { currentParams, setParams } = usePortfolioStore()

  // Remounted via key by the parent on every open, so state initializers
  // always pick up the latest stored settings.
  const [provider, setProvider] = useState<AiModelProvider>(
    storedProvider ?? "gemini",
  )
  const [apiKey, setApiKey] = useState(storedKey ?? "")
  const [model, setModel] = useState(storedModel ?? "")
  const [baseUrl, setBaseUrl] = useState(storedBaseUrl ?? "")
  const [corsProxy, setCorsProxy] = useState(storedCorsProxy ?? "")
  const [corsProxyEnabled, setCorsProxyEnabled] = useState(
    storedCorsProxyEnabled ?? false,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AiForecastResult | null>(null)
  const [errorCode, setErrorCode] = useState<AiForecastErrorCode | null>(null)

  const isCustom = provider === "custom"

  const handlePredict = async () => {
    if (isLoading) return

    if (isCustom) {
      if (!baseUrl.trim() || !model.trim()) {
        setErrorCode("config")
        return
      }
    } else if (!apiKey.trim()) {
      setErrorCode("auth")
      return
    }

    setAiSettings({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim(),
      corsProxy: corsProxyEnabled ? corsProxy.trim() : "",
      corsProxyEnabled,
    })
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

  const providerLink = !isCustom
    ? provider === "gemini"
      ? "https://aistudio.google.com/apikey"
      : "https://platform.openai.com/api-keys"
    : null

  const modelPlaceholder = isCustom
    ? t("ai.modelPlaceholderCustom")
    : provider === "gemini"
      ? GEMINI_MODEL
      : OPENAI_MODEL

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
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="aiProvider"
              className="text-xs font-semibold text-muted-foreground"
            >
              {t("ai.provider")}
            </Label>
            <select
              id="aiProvider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiModelProvider)}
              className="w-full bg-muted border border-border rounded-lg p-2 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="custom">{t("ai.custom")}</option>
            </select>
          </div>

          {/* Custom Provider Base URL */}
          {isCustom && (
            <div className="space-y-2">
              <Label
                htmlFor="aiBaseUrl"
                className="text-xs font-semibold text-muted-foreground"
              >
                {t("ai.baseUrl")}
              </Label>
              <Input
                id="aiBaseUrl"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={t("ai.baseUrlPlaceholder")}
                autoComplete="off"
              />
              <p className="text-[10px] text-muted-foreground/70">
                {t("ai.baseUrlHint")}
              </p>
            </div>
          )}

          {/* Custom Provider CORS Proxy */}
          {isCustom && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="aiCorsProxyToggle"
                  className="text-xs font-semibold text-muted-foreground cursor-pointer"
                >
                  {t("ai.corsProxyToggle")}
                </Label>
                <Switch
                  id="aiCorsProxyToggle"
                  checked={corsProxyEnabled}
                  onCheckedChange={(checked) => setCorsProxyEnabled(checked)}
                />
              </div>
              {corsProxyEnabled && (
                <div className="space-y-2">
                  <Input
                    id="aiCorsProxy"
                    type="url"
                    value={corsProxy}
                    onChange={(e) => setCorsProxy(e.target.value)}
                    placeholder={t("ai.corsProxyPlaceholder")}
                    autoComplete="off"
                  />
                  <p className="text-[10px] text-muted-foreground/70">
                    {t("ai.corsProxyHint")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="aiModel"
              className="text-xs font-semibold text-muted-foreground"
            >
              {t("ai.model")}
            </Label>
            <Input
              id="aiModel"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={modelPlaceholder}
              autoComplete="off"
            />
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label
              htmlFor="aiApiKey"
              className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {isCustom ? t("ai.apiKeyOptional") : t("ai.apiKey")}
            </Label>
            <Input
              id="aiApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("ai.apiKeyPlaceholder")}
              autoComplete="off"
            />
            {providerLink && (
              <a
                href={providerLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                {provider === "gemini"
                  ? t("ai.getGeminiKey")
                  : t("ai.getOpenaiKey")}
              </a>
            )}
          </div>

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
            disabled={isLoading}
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
