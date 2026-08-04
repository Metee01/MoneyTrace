import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { usePortfolioStore } from '../../store';
import { calculateProjection } from '../../engine';
import { useTheme } from '../../hooks/useTheme';
import { formatTL, formatPercent } from '../../lib/formatters';

interface ScenarioComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScenarioComparisonDialog: React.FC<ScenarioComparisonDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const { scenarios } = usePortfolioStore();
  const { theme } = useTheme();

  const [valueType, setValueType] = useState<'real' | 'nominal'>('real');

  // Her senaryo için projeksiyon hesabı yap
  const scenarioResults = useMemo(() => {
    return scenarios.map((scenario) => {
      const projection = calculateProjection(scenario.params);
      return {
        scenario,
        projection,
      };
    });
  }, [scenarios]);

  // Overlay Grafik Verisini Hazırla
  const chartData = useMemo(() => {
    if (!scenarioResults.length) return [];

    // Maksimum ay sayısını bul
    const maxMonths = Math.max(
      ...scenarioResults.map((sr) => sr.projection.summary.totalMonths),
      0
    );

    const data: any[] = [];

    for (let month = 1; month <= maxMonths; month++) {
      const sampleRow = scenarioResults[0]?.projection.rows.find((r) => r.month === month);
      const yearIndex = sampleRow ? sampleRow.yearIndex : Math.ceil(month / 12);
      const monthInYear = sampleRow ? sampleRow.monthInYear : ((month - 1) % 12) + 1;

      const dataPoint: any = {
        month,
        label: `${yearIndex}. Yıl${monthInYear !== 12 ? ` ${monthInYear}. Ay` : ''}`,
      };

      scenarioResults.forEach(({ scenario, projection }) => {
        const row = projection.rows.find((r) => r.month === month);
        if (row) {
          dataPoint[scenario.id] =
            valueType === 'real' ? row.realValue : row.nominalValue;
        }
      });

      data.push(dataPoint);
    }

    // Grafik performans ve temizliği için yılda 12 noktayı süz veya yıllık moda ayarla
    return data.filter((d) => d.month % 3 === 0 || d.month === 1);
  }, [scenarioResults, valueType]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t('scenarios.compareScenarios')}
          </DialogTitle>
          <DialogDescription>
            Kaydedilmiş senaryolarınızın zaman içindeki büyüme ve satın alma gücü karşılaştırması.
          </DialogDescription>
        </DialogHeader>

        {scenarios.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {t('scenarios.noScenarios')}
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Görünüm Geçişi (Reel vs Nominal) */}
            <div className="flex items-center justify-between bg-card p-3 border border-border rounded-lg">
              <span className="text-sm font-medium text-foreground">
                Karşılaştırma Modu:
              </span>
              <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
                <Button
                  variant={valueType === 'real' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setValueType('real')}
                >
                  Reel Değer (Bugünkü TL)
                </Button>
                <Button
                  variant={valueType === 'nominal' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setValueType('nominal')}
                >
                  Nominal Değer (TL)
                </Button>
              </div>
            </div>

            {/* Karşılaştırma Çizgi Grafiği */}
            <div className="h-[300px] w-full border border-border rounded-lg p-4 bg-card">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => formatTL(v, true)}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [formatTL(Number(val)), name]}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: gridColor,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  {scenarios.map((s) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={s.id}
                      name={s.name}
                      stroke={s.color || '#3b82f6'}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Karşılaştırma Tablosu */}
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Senaryo</th>
                    <th className="py-2.5 px-3">Beklenen Getiri</th>
                    <th className="py-2.5 px-3">Enflasyon</th>
                    <th className="py-2.5 px-3">Vade Sonu Nominal</th>
                    <th className="py-2.5 px-3">Vade Sonu Reel Değer</th>
                    <th className="py-2.5 px-3">Net Reel Kar</th>
                    <th className="py-2.5 px-3">Reel ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scenarioResults.map(({ scenario, projection }) => {
                    const isProfitPos = projection.summary.totalRealProfit >= 0;
                    return (
                      <tr key={scenario.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: scenario.color }}
                          />
                          <span>{scenario.name}</span>
                          {scenario.isBaseline && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-normal">
                              Baz
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          %{scenario.params.expectedReturnRate}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          %{scenario.params.expectedInflationRate}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          {formatTL(projection.summary.finalNominalValue)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                          {formatTL(projection.summary.finalRealValue)}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-mono font-semibold ${
                            isProfitPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatTL(projection.summary.totalRealProfit)}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-mono font-semibold ${
                            isProfitPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatPercent(projection.summary.realRoi, true)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
