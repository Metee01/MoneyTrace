import { useState, lazy, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { Layout } from "@/components/layout/Layout"
import { useTheme } from "@/hooks/useTheme"
import { PortfolioForm } from "@/components/portfolio/PortfolioForm"
import { ProjectionTable } from "@/components/projection/ProjectionTable"
import { ProjectionSummaryCards } from "@/components/projection/ProjectionSummaryCards"
import { ScenarioManager } from "@/components/scenarios/ScenarioManager"
import { useSettingsStore } from "@/store"
import { SUPPORTED_LANGUAGES } from "@/lib/i18n"
import { POPULAR_CURRENCIES } from "@/lib/formatters"
import { APP_CONFIG } from "@/config"
import { GEMINI_MODEL, OPENAI_MODEL } from "@/lib/ai-service"
import { getDemoApiKey } from "@/lib/ai-chat-service"
import { MAX_DEMO_FORECASTS, MAX_DEMO_CHAT_MESSAGES } from "@/store/settings-store"
import {
  Loader2,
  Globe,
  DollarSign,
  Bot,
  KeyRound,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AiChat } from "@/components/chat/AiChat"
import type { AiModelProvider } from "@/types"

// Lazy loaded integrated chart section
const ChartSection = lazy(() =>
  import("@/components/projection/ChartSection").then((module) => ({
    default: module.ChartSection,
  })),
)

function ChartFallback() {
  return (
    <div className="h-[400px] flex flex-col items-center justify-center border rounded-xl bg-card text-muted-foreground gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-sm font-medium">Loading Charts...</span>
    </div>
  )
}

function App() {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const {
    currencyCode,
    setCurrency,
    setLanguage,
    aiApiKey,
    aiModelProvider,
    aiModel,
    aiBaseUrl,
    aiCorsProxy,
    aiCorsProxyEnabled,
    useDemoApi,
    demoForecastCount = 0,
    demoChatCount = 0,
    setAiSettings,
  } = useSettingsStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const demoApiKey = getDemoApiKey()
  const hasDemoKey = demoApiKey.length > 0

  // Local state for AI settings (synced on dialog open)
  const [localUseDemoApi, setLocalUseDemoApi] = useState(
    useDemoApi ?? false,
  )
  const [localProvider, setLocalProvider] = useState<AiModelProvider>(
    aiModelProvider ?? "gemini",
  )
  const [localApiKey, setLocalApiKey] = useState(aiApiKey ?? "")
  const [localModel, setLocalModel] = useState(aiModel ?? "")
  const [localBaseUrl, setLocalBaseUrl] = useState(aiBaseUrl ?? "")
  const [localCorsProxy, setLocalCorsProxy] = useState(aiCorsProxy ?? "")
  const [localCorsProxyEnabled, setLocalCorsProxyEnabled] = useState(
    aiCorsProxyEnabled ?? false,
  )

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
  }

  const handleCurrencyChange = (code: string) => {
    const found = POPULAR_CURRENCIES.find((c) => c.code === code)
    if (found) {
      setCurrency(found.code, found.symbol)
    }
  }

  const handleOpenSettings = () => {
    // Sync local state from store on open
    setLocalUseDemoApi(useDemoApi ?? false)
    setLocalProvider(aiModelProvider ?? "gemini")
    setLocalApiKey(aiApiKey ?? "")
    setLocalModel(aiModel ?? "")
    setLocalBaseUrl(aiBaseUrl ?? "")
    setLocalCorsProxy(aiCorsProxy ?? "")
    setLocalCorsProxyEnabled(aiCorsProxyEnabled ?? false)
    setIsSettingsOpen(true)
  }

  const handleSaveAiSettings = () => {
    setAiSettings({
      provider: localProvider,
      apiKey: localApiKey.trim(),
      model: localModel.trim(),
      baseUrl: localBaseUrl.trim(),
      corsProxy: localCorsProxyEnabled ? localCorsProxy.trim() : "",
      corsProxyEnabled: localCorsProxyEnabled,
      useDemoApi: localUseDemoApi,
    })
  }

  const handleCloseSettings = () => {
    handleSaveAiSettings()
    setIsSettingsOpen(false)
  }

  const isCustomProvider = localProvider === "custom"

  const providerLink = !isCustomProvider
    ? localProvider === "gemini"
      ? "https://aistudio.google.com/apikey"
      : "https://platform.openai.com/api-keys"
    : null

  const modelPlaceholder = isCustomProvider
    ? t("ai.modelPlaceholderCustom")
    : localProvider === "gemini"
      ? GEMINI_MODEL
      : OPENAI_MODEL

  return (
    <Layout onOpenSettings={handleOpenSettings}>
      <div className="space-y-6">
        {/* 1. Projection Summary Cards */}
        <ProjectionSummaryCards />

        {/* 2. Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Inputs & Scenarios */}
          <div className="space-y-6 lg:col-span-1">
            {/* Portfolio Inputs Form */}
            <PortfolioForm />

            {/* Scenario Manager */}
            <ScenarioManager />
          </div>

          {/* Right Column: Chart & Table */}
          <div className="space-y-6 lg:col-span-2">
            {/* Integrated Growth & Inflation Chart */}
            <Suspense fallback={<ChartFallback />}>
              <ChartSection />
            </Suspense>

            {/* Monthly Projection Detail Table */}
            <ProjectionTable />
          </div>
        </div>
      </div>

      {/* AI Chat FAB + Panel */}
      <AiChat onOpenSettings={handleOpenSettings} />

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("settings.title")}</DialogTitle>
            <DialogDescription>
              Configure application language, currency, AI provider, and view
              system info.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-sm">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {t("settings.languageSelect")}
              </label>
              <select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg p-2 text-xs font-medium text-foreground focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                {t("settings.defaultCurrency")}
              </label>
              <select
                value={currencyCode}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg p-2 text-xs font-medium text-foreground focus:outline-none"
              >
                {POPULAR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* AI Settings Section */}
            <div className="pt-2 border-t border-border/50 space-y-3">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {t("settings.aiSettings")}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1">
                {t("settings.aiSettingsDesc")}
              </p>

              {/* Demo API Toggle Switch (Only if demo API key exists in .env) */}
              {hasDemoKey && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="settingsUseDemoApiToggle"
                        className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {t("settings.useDemoApi")}
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        {t("settings.useDemoApiDesc")}
                      </p>
                    </div>
                    <Switch
                      id="settingsUseDemoApiToggle"
                      checked={localUseDemoApi}
                      onCheckedChange={(checked) => setLocalUseDemoApi(checked)}
                    />
                  </div>

                  {/* Quota Indicators */}
                  {localUseDemoApi && (
                    <div className="pt-2 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-1.5 rounded bg-background/80 border border-amber-500/20 flex flex-col">
                        <span className="text-muted-foreground text-[9px] uppercase font-semibold">
                          {t("settings.demoUsageQuota")}
                        </span>
                        <span className="font-medium text-foreground">
                          {t("settings.demoForecastQuota", {
                            used: demoForecastCount,
                            max: MAX_DEMO_FORECASTS,
                          })}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-background/80 border border-amber-500/20 flex flex-col">
                        <span className="text-muted-foreground text-[9px] uppercase font-semibold">
                          {t("settings.demoUsageQuota")}
                        </span>
                        <span className="font-medium text-foreground">
                          {t("settings.demoChatQuota", {
                            used: demoChatCount,
                            max: MAX_DEMO_CHAT_MESSAGES,
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom API Configuration (Hidden/Disabled when Demo API is ON) */}
              {!localUseDemoApi && (
                <>
                  {/* Provider Selection */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="settingsAiProvider"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      {t("ai.provider")}
                    </Label>
                    <select
                      id="settingsAiProvider"
                      value={localProvider}
                      onChange={(e) =>
                        setLocalProvider(e.target.value as AiModelProvider)
                      }
                      className="w-full bg-muted border border-border rounded-lg p-2 text-xs font-medium text-foreground focus:outline-none"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="custom">{t("ai.custom")}</option>
                    </select>
                  </div>

                  {/* Custom Provider Base URL */}
                  {isCustomProvider && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="settingsAiBaseUrl"
                        className="text-xs font-semibold text-muted-foreground"
                      >
                        {t("ai.baseUrl")}
                      </Label>
                      <Input
                        id="settingsAiBaseUrl"
                        type="url"
                        value={localBaseUrl}
                        onChange={(e) => setLocalBaseUrl(e.target.value)}
                        placeholder={t("ai.baseUrlPlaceholder")}
                        autoComplete="off"
                      />
                      <p className="text-[10px] text-muted-foreground/70">
                        {t("ai.baseUrlHint")}
                      </p>
                    </div>
                  )}

                  {/* Custom Provider CORS Proxy */}
                  {isCustomProvider && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="settingsAiCorsToggle"
                          className="text-xs font-semibold text-muted-foreground cursor-pointer"
                        >
                          {t("ai.corsProxyToggle")}
                        </Label>
                        <Switch
                          id="settingsAiCorsToggle"
                          checked={localCorsProxyEnabled}
                          onCheckedChange={(checked) =>
                            setLocalCorsProxyEnabled(checked)
                          }
                        />
                      </div>
                      {localCorsProxyEnabled && (
                        <div className="space-y-1.5">
                          <Input
                            id="settingsAiCorsProxy"
                            type="url"
                            value={localCorsProxy}
                            onChange={(e) => setLocalCorsProxy(e.target.value)}
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
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="settingsAiModel"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      {t("ai.model")}
                    </Label>
                    <Input
                      id="settingsAiModel"
                      type="text"
                      value={localModel}
                      onChange={(e) => setLocalModel(e.target.value)}
                      placeholder={modelPlaceholder}
                      autoComplete="off"
                    />
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="settingsAiApiKey"
                      className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {isCustomProvider
                        ? t("ai.apiKeyOptional")
                        : t("ai.apiKey")}
                    </Label>
                    <Input
                      id="settingsAiApiKey"
                      type="password"
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
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
                        {localProvider === "gemini"
                          ? t("ai.getGeminiKey")
                          : t("ai.getOpenaiKey")}
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* App Info */}
            <div className="pt-2 border-t border-border/50 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground font-medium">
                  {t("settings.appVersion")}
                </span>
                <span className="font-semibold text-foreground">
                  v{APP_CONFIG.app.version}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground font-medium">
                  {t("common.theme")}
                </span>
                <span className="font-semibold uppercase text-primary">
                  {theme}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCloseSettings}>
              {t("common.cancel") === "İptal" ? "Kapat" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default App
