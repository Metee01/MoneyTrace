import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RotateCcw,
  Save,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  PieChart,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { usePortfolioStore } from '../../store';
import type { ProjectionParams } from '../../types';

export const PortfolioForm: React.FC = () => {
  const { t } = useTranslation();
  const { currentParams, setParams, resetParams, savePortfolio } = usePortfolioStore();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDesc, setPortfolioDesc] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Field change handler with validation
  const handleChange = (field: keyof ProjectionParams, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setParams({ [field]: 0 });
      return;
    }

    // Boundary constraints
    if (field === 'targetYears') {
      const clamped = Math.max(1, Math.min(50, Math.floor(num)));
      setParams({ [field]: clamped });
    } else if (field === 'usdRate') {
      setParams({ [field]: Math.max(0.1, num) });
    } else if (field === 'initialCapital' || field === 'monthlyDca') {
      setParams({ [field]: Math.max(0, num) });
    } else {
      setParams({ [field]: num });
    }
  };

  // Presets
  const applyPreset = (type: 'balanced' | 'conservative' | 'growth') => {
    if (type === 'conservative') {
      setParams({
        expectedReturnRate: 35,
        expectedInflationRate: 35,
        expectedUsdGrowthRate: 25,
      });
    } else if (type === 'balanced') {
      setParams({
        expectedReturnRate: 50,
        expectedInflationRate: 35,
        expectedUsdGrowthRate: 25,
      });
    } else if (type === 'growth') {
      setParams({
        expectedReturnRate: 70,
        expectedInflationRate: 35,
        expectedUsdGrowthRate: 30,
      });
    }
  };

  const handleSavePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioName.trim()) return;

    savePortfolio(portfolioName.trim(), portfolioDesc.trim());
    setPortfolioName('');
    setPortfolioDesc('');
    setSaveDialogOpen(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <Card className="w-full shadow-sm border border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {t('portfolio.title')}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {t('portfolio.subtitle')}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetParams}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('common.reset')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="text-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="mt-4 pt-3 border-t border-border/60">
          <Label className="text-xs font-medium text-muted-foreground block mb-2">
            {t('portfolio.presetsTitle')}
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-7 px-2.5 gap-1"
              onClick={() => applyPreset('conservative')}
            >
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              {t('portfolio.presetConservative')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-7 px-2.5 gap-1"
              onClick={() => applyPreset('balanced')}
            >
              <PieChart className="w-3 h-3 text-blue-500" />
              {t('portfolio.presetBalanced')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-7 px-2.5 gap-1"
              onClick={() => applyPreset('growth')}
            >
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              {t('portfolio.presetGrowth')}
            </Button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-3 p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-md border border-emerald-500/20">
            {t('common.success')} - Portföy kaydedildi!
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Başlangıç Sermayesi */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="initialCapital" className="text-sm font-medium">
                  {t('portfolio.initialCapital')}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('portfolio.initialCapitalHelp')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="initialCapital"
                type="number"
                min="0"
                step="1000"
                value={currentParams.initialCapital || ''}
                onChange={(e) => handleChange('initialCapital', e.target.value)}
                placeholder="100000"
              />
            </div>

            {/* 2. Projeksiyon Vadesi */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="targetYears" className="text-sm font-medium">
                  {t('portfolio.targetYears')}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('portfolio.targetYearsHelp')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="targetYears"
                type="number"
                min="1"
                max="50"
                value={currentParams.targetYears || ''}
                onChange={(e) => handleChange('targetYears', e.target.value)}
                placeholder="5"
              />
            </div>

            {/* 3. Aylık DCA Yatırımı */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="monthlyDca" className="text-sm font-medium">
                  {t('portfolio.monthlyDca')}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('portfolio.monthlyDcaHelp')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="monthlyDca"
                type="number"
                min="0"
                step="500"
                value={currentParams.monthlyDca || ''}
                onChange={(e) => handleChange('monthlyDca', e.target.value)}
                placeholder="10000"
              />
            </div>

            {/* 4. Yıllık DCA Artış Oranı */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="dcaIncreaseRate" className="text-sm font-medium">
                  {t('portfolio.dcaIncreaseRate')}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('portfolio.dcaIncreaseRateHelp')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="dcaIncreaseRate"
                type="number"
                min="0"
                step="1"
                value={currentParams.dcaIncreaseRate ?? ''}
                onChange={(e) => handleChange('dcaIncreaseRate', e.target.value)}
                placeholder="30"
              />
            </div>

            {/* 5. Yıllık Getiri Beklentisi */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="expectedReturnRate" className="text-sm font-medium">
                  {t('portfolio.expectedReturnRate')}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('portfolio.expectedReturnRateHelp')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="expectedReturnRate"
                type="number"
                step="1"
                value={currentParams.expectedReturnRate ?? ''}
                onChange={(e) => handleChange('expectedReturnRate', e.target.value)}
                placeholder="50"
              />
            </div>

            {/* 6. Yıllık Enflasyon Oranı */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="expectedInflationRate" className="text-sm font-medium">
                  {t('portfolio.expectedInflationRate')}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('portfolio.expectedInflationRateHelp')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="expectedInflationRate"
                type="number"
                step="1"
                value={currentParams.expectedInflationRate ?? ''}
                onChange={(e) => handleChange('expectedInflationRate', e.target.value)}
                placeholder="35"
              />
            </div>

            {/* 7. Başlangıç Dolar Kuru */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="usdRate" className="text-sm font-medium">
                  {t('portfolio.usdRate')}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('portfolio.usdRateHelp')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="usdRate"
                type="number"
                min="0.1"
                step="0.1"
                value={currentParams.usdRate ?? ''}
                onChange={(e) => handleChange('usdRate', e.target.value)}
                placeholder="36.5"
              />
            </div>

            {/* 8. Yıllık USD Kur Artışı */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="expectedUsdGrowthRate" className="text-sm font-medium">
                  {t('portfolio.expectedUsdGrowthRate')}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('portfolio.expectedUsdGrowthRateHelp')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="expectedUsdGrowthRate"
                type="number"
                step="1"
                value={currentParams.expectedUsdGrowthRate ?? ''}
                onChange={(e) => handleChange('expectedUsdGrowthRate', e.target.value)}
                placeholder="25"
              />
            </div>
          </div>
        </TooltipProvider>
      </CardContent>

      {/* Portföy Kaydetme Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSavePortfolio}>
            <DialogHeader>
              <DialogTitle>{t('portfolio.saveAsPortfolio')}</DialogTitle>
              <DialogDescription>
                Mevcut hesaplama parametrelerinizi isim vererek portföylerinize kaydedin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="portName">{t('portfolio.portfolioName')}</Label>
                <Input
                  id="portName"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder={t('portfolio.portfolioNamePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portDesc">{t('portfolio.portfolioDesc')}</Label>
                <Input
                  id="portDesc"
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  placeholder="Portföy stratejiniz veya notlarınız..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
