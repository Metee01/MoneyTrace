import React, { useState, useRef } from "react"
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
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { usePortfolioStore } from "../../store"
import { exportToJson, importFromJson } from "../../lib/export"
import { ScenarioComparisonDialog } from "./ScenarioComparisonDialog"
import type { Scenario } from "../../types"

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

export const ScenarioManager: React.FC = () => {
  const { t } = useTranslation()
  const {
    scenarios,
    baselineScenarioId,
    addScenario,
    duplicateScenario,
    applyScenarioToCurrent,
    deleteScenario,
    setBaselineScenario,
  } = usePortfolioStore()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState("")
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScenarioName.trim()) return

    addScenario(newScenarioName.trim(), selectedColor)
    setNewScenarioName("")
    setSelectedColor(
      PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
    )
    setAddDialogOpen(false)
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl font-bold text-foreground">
              {t("scenarios.title")}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={() => setAddDialogOpen(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("scenarios.newScenario")}
            </Button>
          </div>
        </div>

        {/* JSON Import/Export Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-3">
          <span className="text-xs text-muted-foreground">
            {scenarios.length} Scenarios
          </span>
          <div className="flex items-center gap-2">
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
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
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

                  <div className="flex items-center gap-1">
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

      {/* Add Scenario Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateScenario}>
            <DialogHeader>
              <DialogTitle>{t("scenarios.newScenario")}</DialogTitle>
              <DialogDescription>
                Save current parameters as a new scenario
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scName">{t("scenarios.scenarioName")}</Label>
                <Input
                  id="scName"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder={t("scenarios.scenarioNamePlaceholder")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Scenario Color</Label>
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
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
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
      <ScenarioComparisonDialog
        open={compareDialogOpen}
        onOpenChange={setCompareDialogOpen}
      />
    </Card>
  )
}
