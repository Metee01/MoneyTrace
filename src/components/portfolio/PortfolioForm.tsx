import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  RotateCcw,
  Save,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  PieChart,
  Sparkles,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card"
import { Input } from "../ui/input"
import { NumericInput } from "../ui/numeric-input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { AiForecastModal } from "./AiForecastModal"
import { usePortfolioStore, useSettingsStore } from "../../store"
import {
  annualPercentToMonthlyPercent,
  monthlyPercentToAnnualPercent,
} from "../../engine"
import type { ProjectionParams } from "../../types"
import { cn } from "../../lib/utils"

type RateInputPeriod = NonNullable<ProjectionParams["rateInputPeriod"]>
type NumericParamKey = Exclude<
  keyof ProjectionParams,
  "rateInputPeriod" | "customWithdrawals"
>

export const PortfolioForm: React.FC = () => {
  const { t } = useTranslation()
  const { currentParams, setParams, resetParams, savePortfolio } =
    usePortfolioStore()
  const { currencySymbol } = useSettingsStore()

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [portfolioName, setPortfolioName] = useState("")
  const [portfolioDesc, setPortfolioDesc] = useState("")
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiModalSession, setAiModalSession] = useState(0)

  const openAiModal = () => {
    setAiModalSession((session) => session + 1)
    setAiModalOpen(true)
  }

  const isMonthly = currentParams.rateInputPeriod === "monthly"
  const rateKey = (base: string) => (isMonthly ? `${base}Monthly` : base)
  const rateStep = isMonthly ? 0.05 : 0.5

  const handleChange = (field: NumericParamKey, value: number) => {
    setParams({ [field]: value })
  }

  // Switch between annual and monthly rate input modes, converting existing
  // values so their economic meaning is preserved (rounded to 2 decimals).
  const handleModeChange = (mode: RateInputPeriod) => {
    if (mode === currentParams.rateInputPeriod) return
    const convert =
      currentParams.rateInputPeriod === "monthly"
        ? monthlyPercentToAnnualPercent
        : annualPercentToMonthlyPercent
    const round2 = (value: number) => Math.round(value * 100) / 100

    setParams({
      rateInputPeriod: mode,
      expectedReturnRate: round2(
        convert(currentParams.expectedReturnRate || 0),
      ),
      expectedInflationRate: round2(
        convert(currentParams.expectedInflationRate || 0),
      ),
      expectedUsdGrowthRate: round2(
        convert(currentParams.expectedUsdGrowthRate || 0),
      ),
    })
  }

  // Global Presets (always defined in annual percentages)
  const applyPreset = (type: "balanced" | "conservative" | "growth") => {
    const preset =
      type === "conservative"
        ? {
            expectedReturnRate: 5,
            expectedInflationRate: 2.5,
            expectedUsdGrowthRate: 0,
          }
        : type === "balanced"
          ? {
              expectedReturnRate: 8,
              expectedInflationRate: 3,
              expectedUsdGrowthRate: 0,
            }
          : {
              expectedReturnRate: 12,
              expectedInflationRate: 3,
              expectedUsdGrowthRate: 0,
            }

    const round2 = (value: number) => Math.round(value * 100) / 100
    const convert = (value: number) =>
      isMonthly ? round2(annualPercentToMonthlyPercent(value)) : value

    setParams({
      expectedReturnRate: convert(preset.expectedReturnRate),
      expectedInflationRate: convert(preset.expectedInflationRate),
      expectedUsdGrowthRate: convert(preset.expectedUsdGrowthRate),
    })
  }

  const handleSavePortfolio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!portfolioName.trim()) return

    savePortfolio(portfolioName.trim(), portfolioDesc.trim())
    setPortfolioName("")
    setPortfolioDesc("")
    setSaveDialogOpen(false)
    setSaveSuccessMsg(true)
    setTimeout(() => setSaveSuccessMsg(false), 3000)
  }

  return (
    <Card className="w-full shadow-sm border border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {t("portfolio.title")}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {t("portfolio.subtitle")}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openAiModal}
              className="text-xs gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              {t("portfolio.aiForecast")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetParams}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("common.reset")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="text-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {t("common.save")}
            </Button>
          </div>
        </div>

        {/* Input Mode Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground block">
            {t("portfolio.inputPeriod")}
          </Label>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                !isMonthly ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t("portfolio.modeAnnual")}
            </span>
            <Switch
              checked={isMonthly}
              onCheckedChange={(checked) =>
                handleModeChange(checked ? "monthly" : "annual")
              }
              aria-label={t("portfolio.inputPeriod")}
            />
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isMonthly ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t("portfolio.modeMonthly")}
            </span>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="mt-4 pt-3 border-t border-border/60">
          <Label className="text-xs font-medium text-muted-foreground block mb-2">
            {t("portfolio.presetsTitle")}
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-7 px-2.5 gap-1"
              onClick={() => applyPreset("conservative")}
            >
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              {t("portfolio.presetConservative")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-7 px-2.5 gap-1"
              onClick={() => applyPreset("balanced")}
            >
              <PieChart className="w-3 h-3 text-blue-500" />
              {t("portfolio.presetBalanced")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-7 px-2.5 gap-1"
              onClick={() => applyPreset("growth")}
            >
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              {t("portfolio.presetGrowth")}
            </Button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-3 p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-md border border-emerald-500/20">
            {t("common.success")} - {t("portfolio.savedSuccess")}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Initial Capital */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="initialCapital" className="text-sm font-medium">
                  {t("portfolio.initialCapital", { currency: currencySymbol })}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t("portfolio.initialCapitalHelp")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="initialCapital"
                min={0}
                step="100"
                value={currentParams.initialCapital}
                onValueChange={(value) => handleChange("initialCapital", value)}
                placeholder="10000"
              />
            </div>

            {/* 2. Target Horizon */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="targetYears" className="text-sm font-medium">
                  {t("portfolio.targetYears")}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t("portfolio.targetYearsHelp")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="targetYears"
                min={1}
                max={50}
                integer
                value={currentParams.targetYears}
                onValueChange={(value) => handleChange("targetYears", value)}
                placeholder="10"
              />
            </div>

            {/* 3. Monthly DCA */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="monthlyDca" className="text-sm font-medium">
                  {t("portfolio.monthlyDca", { currency: currencySymbol })}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t("portfolio.monthlyDcaHelp")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="monthlyDca"
                min={0}
                step="50"
                value={currentParams.monthlyDca}
                onValueChange={(value) => handleChange("monthlyDca", value)}
                placeholder="500"
              />
            </div>

            {/* 4. Monthly Cash Withdrawal */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="monthlyWithdrawal"
                  className="text-sm font-medium"
                >
                  {t("portfolio.monthlyWithdrawal", {
                    currency: currencySymbol,
                  })}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t("portfolio.monthlyWithdrawalHelp")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="monthlyWithdrawal"
                min={0}
                step="50"
                value={currentParams.monthlyWithdrawal ?? 0}
                onValueChange={(value) =>
                  handleChange("monthlyWithdrawal", value)
                }
                placeholder="0"
              />
            </div>

            {/* 4. DCA Increase Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="dcaIncreaseRate"
                  className="text-sm font-medium"
                >
                  {t("portfolio.dcaIncreaseRate")}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t("portfolio.dcaIncreaseRateHelp")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="dcaIncreaseRate"
                step="0.5"
                value={currentParams.dcaIncreaseRate}
                onValueChange={(value) =>
                  handleChange("dcaIncreaseRate", value)
                }
                placeholder="5"
              />
            </div>

            {/* 5. Expected Return Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="expectedReturnRate"
                  className="text-sm font-medium"
                >
                  {t(`portfolio.${rateKey("expectedReturnRate")}`)}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t(`portfolio.${rateKey("expectedReturnRate")}Help`)}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="expectedReturnRate"
                step={rateStep}
                value={currentParams.expectedReturnRate}
                onValueChange={(value) =>
                  handleChange("expectedReturnRate", value)
                }
                placeholder={isMonthly ? "0.64" : "8"}
              />
            </div>

            {/* 6. Expected Inflation Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="expectedInflationRate"
                  className="text-sm font-medium"
                >
                  {t(`portfolio.${rateKey("expectedInflationRate")}`)}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t(`portfolio.${rateKey("expectedInflationRate")}Help`)}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="expectedInflationRate"
                step={rateStep}
                value={currentParams.expectedInflationRate}
                onValueChange={(value) =>
                  handleChange("expectedInflationRate", value)
                }
                placeholder={isMonthly ? "0.25" : "3"}
              />
            </div>

            {/* 7. Exchange Rate to Ref Currency */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="usdRate" className="text-sm font-medium">
                  {t("portfolio.usdRate")}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t("portfolio.usdRateHelp")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="usdRate"
                step="0.01"
                min={0.01}
                value={currentParams.usdRate}
                onValueChange={(value) => handleChange("usdRate", value)}
                placeholder="1.0"
              />
            </div>

            {/* 8. Ref Currency Growth */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="expectedUsdGrowthRate"
                  className="text-sm font-medium"
                >
                  {t(`portfolio.${rateKey("expectedUsdGrowthRate")}`)}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t(`portfolio.${rateKey("expectedUsdGrowthRate")}Help`)}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="expectedUsdGrowthRate"
                step={rateStep}
                value={currentParams.expectedUsdGrowthRate}
                onValueChange={(value) =>
                  handleChange("expectedUsdGrowthRate", value)
                }
                placeholder="0"
              />
            </div>

            {/* 9. Withholding Tax Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="withholdingTaxRate"
                  className="text-sm font-medium"
                >
                  {t("portfolio.withholdingTaxRate")}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t("portfolio.withholdingTaxRateHelp")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <NumericInput
                id="withholdingTaxRate"
                step="0.5"
                min={0}
                max={100}
                value={currentParams.withholdingTaxRate ?? 0}
                onValueChange={(value) =>
                  handleChange("withholdingTaxRate", value)
                }
                placeholder="0"
              />
            </div>
          </div>
        </TooltipProvider>
      </CardContent>

      {/* Save Portfolio Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSavePortfolio}>
            <DialogHeader>
              <DialogTitle>{t("portfolio.saveAsPortfolio")}</DialogTitle>
              <DialogDescription>{t("portfolio.subtitle")}</DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pName">{t("portfolio.portfolioName")}</Label>
                <Input
                  id="pName"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder={t("portfolio.portfolioNamePlaceholder")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pDesc">{t("portfolio.portfolioDesc")}</Label>
                <Input
                  id="pDesc"
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  placeholder="Optional details..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Economic Forecast Modal */}
      <AiForecastModal
        key={aiModalSession}
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
      />
    </Card>
  )
}
