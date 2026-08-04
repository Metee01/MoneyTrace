import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Copy,
  Trash2,
  SlidersHorizontal,
  ArrowUpRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { usePortfolioStore } from '../../store';
import { ScenarioComparisonDialog } from './ScenarioComparisonDialog';

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

export const ScenarioManager: React.FC = () => {
  const { t } = useTranslation();
  const {
    scenarios,
    addScenario,
    duplicateScenario,
    deleteScenario,
    applyScenarioToCurrent,
  } = usePortfolioStore();

  const [newScenarioName, setNewScenarioName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Silme Onay Dialog State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const targetScenario = scenarios.find((s) => s.id === deleteTargetId);

  const handleAddScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioName.trim()) return;

    addScenario(newScenarioName.trim(), selectedColor);
    setNewScenarioName('');
    setIsAddOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      deleteScenario(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <Card className="w-full shadow-sm border border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              <span>{t('scenarios.title')}</span>
            </CardTitle>

            <div className="flex items-center gap-2">
              {scenarios.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium"
                  onClick={() => setIsCompareOpen(true)}
                >
                  {t('scenarios.compareScenarios')}
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('scenarios.newScenario')}</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {scenarios.length === 0 ? (
            <div className="h-[120px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20 text-center p-4">
              <p className="text-xs text-muted-foreground max-w-xs">
                {t('scenarios.noScenarios')}
              </p>
              <Button
                variant="link"
                size="sm"
                className="text-xs mt-1 h-auto p-0"
                onClick={() => setIsAddOpen(true)}
              >
                + İlk Senaryoyu Kaydet
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {scenario.name}
                        </span>
                        {scenario.isBaseline && (
                          <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.2 rounded">
                            Baz
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Getiri: %{scenario.params.expectedReturnRate} | Enflasyon: %
                        {scenario.params.expectedInflationRate} | Vade: {scenario.params.targetYears}y
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Form'a Yükle Butonu */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Forma Yükle"
                      onClick={() => applyScenarioToCurrent(scenario.id)}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>

                    {/* Kopyala Butonu */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title={t('common.copy')}
                      onClick={() => duplicateScenario(scenario.id)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>

                    {/* Sil Butonu */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      title={t('common.delete')}
                      onClick={() => setDeleteTargetId(scenario.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yeni Senaryo Ekleme Dialogu */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('scenarios.newScenario')}</DialogTitle>
            <DialogDescription>
              Mevcut form parametrelerini karşılaştırmak üzere yeni bir senaryo olarak kaydet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddScenario} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="scenarioName">{t('scenarios.scenarioName')}</Label>
              <Input
                id="scenarioName"
                placeholder={t('scenarios.scenarioNamePlaceholder')}
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Senaryo Rengi</Label>
              <div className="flex items-center gap-2 pt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      selectedColor === color ? 'ring-2 ring-ring scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!newScenarioName.trim()}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialogu */}
      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <span>Senaryoyu Sil</span>
            </DialogTitle>
            <DialogDescription>
              {targetScenario &&
                t('scenarios.deleteConfirm', { name: targetScenario.name })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Senaryo Karşılaştırma Modali */}
      <ScenarioComparisonDialog
        open={isCompareOpen}
        onOpenChange={setIsCompareOpen}
      />
    </>
  );
};
