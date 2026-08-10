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
import { APP_VERSION } from "@/lib/version"
import { Loader2, Globe, DollarSign } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
  const { currencyCode, setCurrency, setLanguage } = useSettingsStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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

  return (
    <Layout onOpenSettings={() => setIsSettingsOpen(true)}>
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

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("settings.title")}</DialogTitle>
            <DialogDescription>
              Configure application language, currency, and view system info.
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

            {/* App Info */}
            <div className="pt-2 border-t border-border/50 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground font-medium">
                  {t("settings.appVersion")}
                </span>
                <span className="font-semibold text-foreground">
                  v{APP_VERSION}
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
            <Button onClick={() => setIsSettingsOpen(false)}>
              {t("common.cancel") === "İptal" ? "Kapat" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default App
