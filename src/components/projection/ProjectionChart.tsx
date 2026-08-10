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
import { usePortfolioStore, useSettingsStore } from '../../store';
import { calculateProjection } from '../../engine';
import { useTheme } from '../../hooks/useTheme';
import { formatLocalCurrency, formatUSD } from '../../lib/formatters';

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
  currencyMode: 'LOCAL' | 'USD';
  currencyCode: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  currencyMode,
  currencyCode,
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-[200px]">
      <p className="font-semibold text-sm border-b border-border pb-1 mb-1">
        {label}
      </p>
      {payload.map((entry: TooltipPayloadItem, index: number) => {
        const valueFormatter = (val: number) =>
          currencyMode === 'USD'
            ? formatUSD(val)
            : formatLocalCurrency(val, currencyCode);

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
  const { currencyCode, currencySymbol } = useSettingsStore();
  const { theme } = useTheme();

  const [currencyMode, setCurrencyMode] = useState<'LOCAL' | 'USD'>('LOCAL');
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
      return {
        month: r.month,
        label: filterMode === 'yearly' ? `${r.yearIndex}` : yearLabel,
        nominalValue: r.nominalValue,
        realValue: r.realValue,
        totalInvested: r.totalInvested,
        realTotalInvested: r.realTotalInvested,
        usdValue: r.usdValue,
        usdInvested: Math.round((r.totalInvested / r.usdRate) * 100) / 100,
      };
    });
  }, [projectionResult.rows, filterMode, t]);

  const isDark = theme === 'dark';

  const colors = {
    nominal: isDark ? '#3b82f6' : '#2563eb',
    real: isDark ? '#10b981' : '#059669',
    invested: isDark ? '#94a3b8' : '#64748b',
    usd: isDark ? '#f59e0b' : '#d97706',
    grid: isDark ? '#334155' : '#e2e8f0',
    axisText: isDark ? '#94a3b8' : '#64748b',
  };

  const formatYAxis = (val: number) => {
    if (currencyMode === 'USD') {
      return formatUSD(val, true);
    }
    return formatLocalCurrency(val, currencyCode, 'en-US', true);
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
              {currencyMode === 'LOCAL'
                ? t('projection.chartGrowthSub')
                : t('projection.chartUsdSub')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
              <Button
                variant={currencyMode === 'LOCAL' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setCurrencyMode('LOCAL')}
              >
                {currencySymbol} {currencyCode}
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
                content={<CustomTooltip currencyMode={currencyMode} currencyCode={currencyCode} />}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />

              {currencyMode === 'LOCAL' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="nominalValue"
                    name={`${t('projection.nominalBalance')} (${currencySymbol})`}
                    stroke={colors.nominal}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="realValue"
                    name={`${t('projection.realValue')} (${currencySymbol})`}
                    stroke={colors.real}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalInvested"
                    name={`${t('projection.totalContribution')} (${currencySymbol})`}
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
                    name={`${t('projection.usdBalance')} ($)`}
                    stroke={colors.usd}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="usdInvested"
                    name={`${t('projection.usd')} ($)`}
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
