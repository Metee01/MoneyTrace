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
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { usePortfolioStore } from '../../store';
import { calculateProjection } from '../../engine';
import { useTheme } from '../../hooks/useTheme';
import { formatTL, formatUSD } from '../../lib/formatters';

interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: number;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  currencyMode: 'TRY' | 'USD';
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  currencyMode,
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-[200px]">
      <p className="font-semibold text-sm border-b border-border pb-1 mb-1">
        {label}
      </p>
      {payload.map((entry: TooltipPayloadItem, index: number) => {
        const valueFormatter = currencyMode === 'USD' ? formatUSD : formatTL;
        return (
          <div key={`item-${index}`} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
            </div>
            <span className="font-semibold font-mono">
              {valueFormatter(entry.value ?? 0)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const ProjectionChart: React.FC = () => {
  const { t } = useTranslation();
  const { currentParams } = usePortfolioStore();
  const { theme } = useTheme();

  const [currencyMode, setCurrencyMode] = useState<'TRY' | 'USD'>('TRY');
  const [filterMode, setFilterMode] = useState<'all' | 'yearly'>('all');

  const projectionResult = useMemo(() => {
    return calculateProjection(currentParams);
  }, [currentParams]);

  const chartData = useMemo(() => {
    const rows =
      filterMode === 'yearly'
        ? projectionResult.rows.filter((r) => r.monthInYear === 12)
        : projectionResult.rows;

    return rows.map((r) => {
      const yearLabel = `${r.yearIndex}. Yıl${r.monthInYear !== 12 ? ` ${r.monthInYear}. Ay` : ''}`;
      return {
        month: r.month,
        label: filterMode === 'yearly' ? `${r.yearIndex}. Yıl` : yearLabel,
        nominalValue: r.nominalValue,
        realValue: r.realValue,
        totalInvested: r.totalInvested,
        realTotalInvested: r.realTotalInvested,
        usdValue: r.usdValue,
        usdInvested: Math.round((r.totalInvested / r.usdRate) * 100) / 100,
      };
    });
  }, [projectionResult.rows, filterMode]);

  const isDark = theme === 'dark';

  const colors = {
    nominal: isDark ? '#3b82f6' : '#2563eb', // blue
    real: isDark ? '#10b981' : '#059669', // emerald
    invested: isDark ? '#94a3b8' : '#64748b', // slate
    usd: isDark ? '#f59e0b' : '#d97706', // amber
    grid: isDark ? '#334155' : '#e2e8f0',
    axisText: isDark ? '#94a3b8' : '#64748b',
  };

  const formatYAxis = (val: number) => {
    if (currencyMode === 'USD') {
      return formatUSD(val, true);
    }
    return formatTL(val, true);
  };

  return (
    <Card className="w-full shadow-sm border border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {t('projection.chartTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currencyMode === 'TRY'
                ? 'Nominal Değer, Enflasyondan Arındırılmış Reel Değer ve Anapara Gelişimi'
                : 'Dolar ($) Bazında Portföy Büyümesi'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre Modu (Tüm Aylar / Yıllık) */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
              <Button
                variant={filterMode === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setFilterMode('all')}
              >
                Aylık
              </Button>
              <Button
                variant={filterMode === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setFilterMode('yearly')}
              >
                Yıllık
              </Button>
            </div>

            {/* Para Birimi Modu (TRY / USD) */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
              <Button
                variant={currencyMode === 'TRY' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setCurrencyMode('TRY')}
              >
                ₺ TL
              </Button>
              <Button
                variant={currencyMode === 'USD' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setCurrencyMode('USD')}
              >
                $ USD
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="label"
                stroke={colors.axisText}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                dy={8}
              />
              <YAxis
                stroke={colors.axisText}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                dx={-8}
              />
              <Tooltip
                content={<CustomTooltip currencyMode={currencyMode} />}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />

              {currencyMode === 'TRY' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="nominalValue"
                    name="Nominal Değer (TL)"
                    stroke={colors.nominal}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="realValue"
                    name="Reel Satın Alma Gücü (TL)"
                    stroke={colors.real}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalInvested"
                    name="Yatırılan Anapara (TL)"
                    stroke={colors.invested}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="usdValue"
                    name="USD Değeri ($)"
                    stroke={colors.usd}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="usdInvested"
                    name="Yatırılan Dolar ($)"
                    stroke={colors.invested}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
