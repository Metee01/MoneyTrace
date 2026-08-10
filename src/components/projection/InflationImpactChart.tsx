import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { usePortfolioStore, useSettingsStore } from '../../store';
import { calculateProjection } from '../../engine';
import { useTheme } from '../../hooks/useTheme';
import { formatLocalCurrency, formatPercent } from '../../lib/formatters';

interface TooltipPayloadItem {
  payload: {
    nominalValue: number;
    inflationLoss: number;
    realValue: number;
    [key: string]: unknown;
  };
  value?: number;
  name?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  currencyCode?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, currencyCode = 'USD' }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const lossPercent = data.nominalValue > 0
    ? ((data.inflationLoss / data.nominalValue) * 100)
    : 0;

  return (
    <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-[220px]">
      <p className="font-semibold text-sm border-b border-border pb-1 mb-1">
        {label}
      </p>
      <div className="flex justify-between items-center gap-4">
        <span className="text-muted-foreground">Nominal:</span>
        <span className="font-semibold font-mono text-blue-500">
          {formatLocalCurrency(data.nominalValue, currencyCode)}
        </span>
      </div>
      <div className="flex justify-between items-center gap-4">
        <span className="text-muted-foreground">Real Power:</span>
        <span className="font-semibold font-mono text-emerald-500">
          {formatLocalCurrency(data.realValue, currencyCode)}
        </span>
      </div>
      <div className="flex justify-between items-center gap-4 border-t border-border pt-1 mt-1">
        <span className="text-rose-500 font-medium">Inflation Loss:</span>
        <span className="font-semibold font-mono text-rose-500">
          {formatLocalCurrency(data.inflationLoss, currencyCode)} ({formatPercent(lossPercent)})
        </span>
      </div>
    </div>
  );
};

export const InflationImpactChart: React.FC = () => {
  const { t } = useTranslation();
  const { currentParams } = usePortfolioStore();
  const { currencyCode, currencySymbol } = useSettingsStore();
  const { theme } = useTheme();

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
      const yearLabel = `${t('projection.month')} ${r.month}`;
      const inflationLoss = Math.max(0, r.nominalValue - r.realValue);

      return {
        month: r.month,
        label: filterMode === 'yearly' ? `${r.yearIndex}` : yearLabel,
        nominalValue: r.nominalValue,
        realValue: r.realValue,
        inflationLoss: Math.round(inflationLoss * 100) / 100,
        totalInvested: r.totalInvested,
      };
    });
  }, [projectionResult.rows, filterMode, t]);

  const isDark = theme === 'dark';

  const colors = {
    realArea: isDark ? '#10b981' : '#059669',
    lossArea: isDark ? '#f43f5e' : '#e11d48',
    grid: isDark ? '#334155' : '#e2e8f0',
    axisText: isDark ? '#94a3b8' : '#64748b',
  };

  return (
    <Card className="w-full shadow-sm border border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {t('projection.inflationImpactTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('projection.chartInflationSub')}
            </p>
          </div>

          <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
            <Button
              variant={filterMode === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setFilterMode('all')}
            >
              {t('table.allMonths')}
            </Button>
            <Button
              variant={filterMode === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setFilterMode('yearly')}
            >
              {t('table.yearlySummary')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.realArea} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors.realArea} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.lossArea} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors.lossArea} stopOpacity={0.1} />
                </linearGradient>
              </defs>

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
                tickFormatter={(val) => formatLocalCurrency(val, currencyCode, 'en-US', true)}
                dx={-8}
              />
              <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />

              <Area
                type="monotone"
                dataKey="realValue"
                name={`${t('projection.realValue')} (${currencySymbol})`}
                stackId="1"
                stroke={colors.realArea}
                fill="url(#realGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="inflationLoss"
                name={`${t('projection.inflationLoss')} (${currencySymbol})`}
                stackId="1"
                stroke={colors.lossArea}
                fill="url(#lossGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
