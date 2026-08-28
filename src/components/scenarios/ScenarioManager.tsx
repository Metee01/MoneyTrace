import React, { lazy, Suspense, useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  Plus,
  Layers,
  Copy,
  Trash2,
  CheckCircle2,
  Sparkles,
  Download,
  Upload,
  BarChart2,
  Pencil,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { NumericInput } from "../ui/numeric-input"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { usePortfolioStore, useSettingsStore } from "../../store"
import { exportToJson, importFromJson } from "../../lib/export"
import {
  annualPercentToMonthlyPercent,
  monthlyPercentToAnnualPercent,
} from "../../engine"
import { APP_CONFIG } from "../../config"
import type { ProjectionParams, Scenario } from "../../types"

const ScenarioComparisonDialog = lazy(() =>
  import("./ScenarioComparisonDialog").then((module) => ({
    default: module.ScenarioComparisonDialog,
  })),
)

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
]

type EditableScenarioParamKey = keyof typeof APP_CONFIG.engine.limits

const SCENARIO_PARAM_FIELDS: Array<{
  key: EditableScenarioParamKey
  step: number
  integer?: boolean
}> = [
  { key: "initialCapital", step: 100 },
  { key: "targetYears", step: 1, integer: true },
  { key: "monthlyDca", step: 50 },
  { key: "monthlyWithdrawal", step: 50 },
  { key: "dcaIncreaseRate", step: 0.1 },
  { key: "expectedReturnRate", step: 0.1 },
  { key: "expectedInflationRate", step: 0.1 },
  { key: "usdRate", step: 0.01 },
  { key: "expectedUsdGrowthRate", step: 0.1 },
  { key: "withholdingTaxRate", step: 0.1 },
]

const RATE_PARAM_KEYS = new Set<EditableScenarioParamKey>([
  "expectedReturnRate",
  "expectedInflationRate",
  "expectedUsdGrowthRate",
])

export const ScenarioManager: React.FC = () => {
  const { t } = useTranslation()
  const {
    scenarios,
    baselineScenarioId,
    addScenario,
    updateScenario,
    duplicateScenario,
    applyScenarioToCurrent,
    deleteScenario,
    setBaselineScenario,
  } = usePortfolioStore()
  const { currencySymbol } = useSettingsStore()

  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null)
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(
    null,
  )
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [scenarioName, setScenarioName] = useState("")
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [editParams, setEditParams] = useState<ProjectionParams | null>(null)
  const [nameError, setNameError] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const closeScenarioEditor = () => {
    setEditorMode(null)
    setEditingScenarioId(null)
    setEditParams(null)
    setNameError(false)
  }

  const openCreateScenario = () => {
    setScenarioName("")
    setSelectedColor(PRESET_COLORS[scenarios.length % PRESET_COLORS.length])
    setEditingScenarioId(null)
    setEditParams(null)
    setNameError(false)
    setEditorMode("create")
  }

  const openEditScenario = (scenario: Scenario) => {
    setScenarioName(scenario.name)
    setSelectedColor(scenario.color)
    setEditingScenarioId(scenario.id)
    setEditParams({
      ...scenario.params,
      customWithdrawals: scenario.params.customWithdrawals
        ? { ...scenario.params.customWithdrawals }
        : undefined,
    })
    setNameError(false)
    setEditorMode("edit")
  }

  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = scenarioName.trim()
    if (!trimmedName || !editorMode) return

    const duplicateName = scenarios.some(
      (scenario) =>
        scenario.id !== editingScenarioId &&
        scenario.name.trim().toLocaleLowerCase() ===
          trimmedName.toLocaleLowerCase(),
    )
    if (duplicateName) {
      setNameError(true)
      return
    }

    if (editorMode === "edit") {
      if (!editingScenarioId || !editParams) return
      updateScenario(editingScenarioId, {
        name: trimmedName,
        color: selectedColor,
        params: editParams,
      })
    } else {
      addScenario(trimmedName, selectedColor)
    }

    closeScenarioEditor()
  }

  const handleEditParamChange = (
    key: EditableScenarioParamKey,
    value: number,
  ) => {
    setEditParams((params) => (params ? { ...params, [key]: value } : params))
  }

  const handleEditModeChange = (mode: "annual" | "monthly") => {
    setEditParams((params) => {
      if (!params || (params.rateInputPeriod ?? "annual") === mode)
        return params
      const convert =
        mode === "monthly"
          ? annualPercentToMonthlyPercent
          : monthlyPercentToAnnualPercent
      const convertRate = (
        key:
          | "expectedReturnRate"
          | "expectedInflationRate"
          | "expectedUsdGrowthRate",
        value: number,
      ) => {
        const limits = APP_CONFIG.engine.limits[key]
        const converted = Math.round(convert(value) * 100) / 100
        return Math.min(limits.max, Math.max(limits.min, converted))
      }
      return {
        ...params,
        rateInputPeriod: mode,
        expectedReturnRate: convertRate(
          "expectedReturnRate",
          params.expectedReturnRate,
        ),
        expectedInflationRate: convertRate(
          "expectedInflationRate",
          params.expectedInflationRate,
        ),
        expectedUsdGrowthRate: convertRate(
          "expectedUsdGrowthRate",
          params.expectedUsdGrowthRate,
        ),
      }
    })
  }

  const handleExportJSON = () => {
    exportToJson(
      {
        exportedAt: new Date().toISOString(),
        scenarios,
      },
      "MoneyTrace_Scenarios.json",
    )
  }

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const imported = await importFromJson<unknown>(file)
      const scenarioList: Scenario[] = Array.isArray(imported)
        ? imported
        : (imported as { scenarios?: Scenario[] })?.scenarios || []

      if (scenarioList.length > 0) {
        scenarioList.forEach((s) => {
          if (s.name && s.params) {
            addScenario(s.name, s.color || "#3b82f6", s.params)
          }
        })
      }
    } catch {
      alert(t("common.error") + ": Invalid JSON file.")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card className="w-full shadow-sm border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start 2xl:flex-row 2xl:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl font-bold text-foreground">
              {t("scenarios.title")}
            </CardTitle>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end lg:w-full lg:justify-start 2xl:w-auto 2xl:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareDialogOpen(true)}
              disabled={scenarios.length === 0}
              className="text-xs gap-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
              {t("scenarios.compareScenarios")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={openCreateScenario}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("scenarios.newScenario")}
            </Button>
          </div>
        </div>

        {/* JSON Import/Export Bar */}
        <div className="mt-3 flex flex-col items-start gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start 2xl:flex-row 2xl:items-center">
          <span className="text-xs text-muted-foreground">
            {scenarios.length} Scenarios
          </span>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end lg:w-full lg:justify-start 2xl:w-auto 2xl:justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3 h-3" />
              {t("scenarios.importJson")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
              onClick={handleExportJSON}
              disabled={scenarios.length === 0}
            >
              <Download className="w-3 h-3" />
              {t("scenarios.exportJson")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {scenarios.length === 0 ? (
          <div className="p-6 text-center border border-dashed rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {t("scenarios.noScenarios")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const isBaseline = scenario.id === baselineScenarioId

              return (
                <div
                  key={scenario.id}
                  className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start 2xl:flex-row 2xl:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                          {scenario.name}
                        </span>
                        {isBaseline && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Baseline
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Return: %{scenario.params.expectedReturnRate} | Infl: %
                        {scenario.params.expectedInflationRate}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:justify-end lg:w-full lg:justify-start 2xl:w-auto 2xl:justify-end">
                    {!isBaseline && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setBaselineScenario(scenario.id)}
                      >
                        Make Baseline
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] px-2 text-primary hover:bg-primary/10"
                      onClick={() => applyScenarioToCurrent(scenario.id)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditScenario(scenario)}
                      title={t("common.edit")}
                      aria-label={t("common.edit")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => duplicateScenario(scenario.id)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                      onClick={() => setDeleteTargetId(scenario.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Create / Edit Scenario Dialog */}
      <Dialog
        open={editorMode !== null}
        onOpenChange={(open) => !open && closeScenarioEditor()}
      >
        <DialogContent
          className={`max-h-[calc(100dvh-2rem)] overflow-y-auto ${
            editorMode === "edit" ? "sm:max-w-[680px]" : "sm:max-w-[425px]"
          }`}
        >
          <form onSubmit={handleSaveScenario}>
            <DialogHeader>
              <DialogTitle>
                {editorMode === "edit"
                  ? t("scenarios.editScenario")
                  : t("scenarios.newScenario")}
              </DialogTitle>
              <DialogDescription>
                {editorMode === "edit"
                  ? t("scenarios.editScenarioDescription")
                  : t("scenarios.newScenarioDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioName">
                  {t("scenarios.scenarioName")}
                </Label>
                <Input
                  id="scenarioName"
                  value={scenarioName}
                  onChange={(e) => {
                    setScenarioName(e.target.value)
                    setNameError(false)
                  }}
                  placeholder={t("scenarios.scenarioNamePlaceholder")}
                  aria-invalid={nameError}
                  required
                />
                {nameError && (
                  <p className="text-xs text-destructive" role="alert">
                    {t("scenarios.duplicateName")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("scenarios.scenarioColor")}</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        selectedColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>

              {editorMode === "edit" && editParams && (
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label>{t("scenarios.scenarioParameters")}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {t("portfolio.modeAnnual")}
                      </span>
                      <Switch
                        checked={editParams.rateInputPeriod === "monthly"}
                        onCheckedChange={(checked) =>
                          handleEditModeChange(checked ? "monthly" : "annual")
                        }
                        aria-label={t("portfolio.inputPeriod")}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t("portfolio.modeMonthly")}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {SCENARIO_PARAM_FIELDS.map((field) => {
                      const isMonthlyRate =
                        editParams.rateInputPeriod === "monthly" &&
                        RATE_PARAM_KEYS.has(field.key)
                      const translationKey = isMonthlyRate
                        ? `${field.key}Monthly`
                        : field.key
                      const limits = APP_CONFIG.engine.limits[field.key]

                      return (
                        <div key={field.key} className="space-y-1.5">
                          <Label
                            htmlFor={`scenario-${field.key}`}
                            className="text-xs"
                          >
                            {t(`portfolio.${translationKey}`, {
                              currency: currencySymbol,
                            })}
                          </Label>
                          <NumericInput
                            id={`scenario-${field.key}`}
                            value={editParams[field.key] ?? 0}
                            onValueChange={(value) =>
                              handleEditParamChange(field.key, value)
                            }
                            min={limits.min}
                            max={limits.max}
                            step={field.step}
                            integer={field.integer}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="sticky bottom-0 z-10">
              <Button
                type="button"
                variant="outline"
                onClick={closeScenarioEditor}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("common.delete")} Scenario</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scenario? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTargetId) {
                  deleteScenario(deleteTargetId)
                  setDeleteTargetId(null)
                }
              }}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comparison Overlay Dialog */}
      {compareDialogOpen ? (
        <Suspense fallback={null}>
          <ScenarioComparisonDialog
            open={compareDialogOpen}
            onOpenChange={setCompareDialogOpen}
          />
        </Suspense>
      ) : null}
    </Card>
  )
}
