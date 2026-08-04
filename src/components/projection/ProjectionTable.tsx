import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { usePortfolioStore } from '../../store';
import { calculateProjection } from '../../engine';
import { formatTL, formatUSD, formatPercent, formatNumber } from '../../lib/formatters';
import type { ProjectionRow } from '../../types';

export const ProjectionTable: React.FC = () => {
  const { t } = useTranslation();
  const { currentParams } = usePortfolioStore();

  // Mode: 'all' (Tüm Aylar) veya 'yearly' (Yıl Sonları)
  const [viewMode, setViewMode] = useState<'all' | 'yearly'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Projeksiyon verilerini anlık hesapla
  const projectionResult = useMemo(() => {
    return calculateProjection(currentParams);
  }, [currentParams]);

  // Filtrelenmiş satırlar
  const filteredRows = useMemo(() => {
    if (viewMode === 'yearly') {
      return projectionResult.rows.filter((row) => row.monthInYear === 12);
    }
    return projectionResult.rows;
  }, [projectionResult.rows, viewMode]);

  // Sayfalama hesabı
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, safePage, rowsPerPage]);

  const handleModeChange = (mode: 'all' | 'yearly') => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  return (
    <Card className="w-full shadow-sm border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {t('projection.tableTitle')}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {t('table.totalRows', { count: filteredRows.length })}
            </CardDescription>
          </div>

          {/* Filtre ve Görünüm Butonları */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40">
              <Button
                variant={viewMode === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-2.5 font-medium"
                onClick={() => handleModeChange('all')}
              >
                {t('table.allMonths')}
              </Button>
              <Button
                variant={viewMode === 'yearly' ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-2.5 font-medium gap-1"
                onClick={() => handleModeChange('yearly')}
              >
                <Calendar className="w-3 h-3" />
                {t('table.yearlySummary')}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {/* Responsive Scroll Table */}
        <div className="overflow-x-auto border-y sm:border sm:rounded-lg border-border">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border sticky top-0 backdrop-blur-md">
              <tr>
                <th className="py-3 px-3 min-w-[90px]">{t('table.monthCol')}</th>
                <th className="py-3 px-3 text-right">{t('table.monthlyDcaCol')}</th>
                <th className="py-3 px-3 text-right">{t('table.totalInvestedCol')}</th>
                <th className="py-3 px-3 text-right">{t('table.nominalValueCol')}</th>
                <th className="py-3 px-3 text-right">{t('table.realValueCol')}</th>
                <th className="py-3 px-3 text-right">{t('table.usdValueCol')}</th>
                <th className="py-3 px-3 text-right">{t('table.nominalProfitCol')}</th>
                <th className="py-3 px-3 text-right">{t('table.realProfitCol')}</th>
                <th className="py-3 px-3 text-right">{t('table.usdRateCol')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {paginatedRows.map((row: ProjectionRow) => {
                const isYearEnd = row.monthInYear === 12;
                const nominalRoi =
                  row.totalInvested > 0
                    ? (row.nominalProfit / row.totalInvested) * 100
                    : 0;
                const realRoi =
                  row.totalInvested > 0
                    ? (row.realProfit / row.totalInvested) * 100
                    : 0;

                return (
                  <tr
                    key={row.month}
                    className={`hover:bg-muted/40 transition-colors ${
                      isYearEnd ? 'bg-primary/5 font-medium' : ''
                    }`}
                  >
                    {/* Dönem / Ay */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">
                          {row.month}. Ay
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Yıl {row.yearIndex}
                        </span>
                      </div>
                    </td>

                    {/* Aylık DCA */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-muted-foreground">
                      {formatTL(row.monthlyDca)}
                    </td>

                    {/* Toplam Anapara */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-foreground">
                      {formatTL(row.totalInvested)}
                    </td>

                    {/* Nominal Değer */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-foreground">
                      {formatTL(row.nominalValue)}
                    </td>

                    {/* Reel Değer */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-blue-600 dark:text-blue-400">
                      {formatTL(row.realValue)}
                    </td>

                    {/* USD Değeri */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-emerald-600 dark:text-emerald-400">
                      {formatUSD(row.usdValue)}
                    </td>

                    {/* Nominal Kar/Zarar */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-semibold ${
                            row.nominalProfit >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatTL(row.nominalProfit)}
                        </span>
                        <span className="text-[10px] opacity-80 text-muted-foreground">
                          {formatPercent(nominalRoi, true)}
                        </span>
                      </div>
                    </td>

                    {/* Reel Kar/Zarar */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span
                          className={`inline-flex items-center gap-0.5 font-semibold ${
                            row.realProfit >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {row.realProfit >= 0 ? (
                            <TrendingUp className="w-3 h-3 shrink-0" />
                          ) : (
                            <TrendingDown className="w-3 h-3 shrink-0" />
                          )}
                          {formatTL(row.realProfit)}
                        </span>
                        <span className="text-[10px] opacity-80 text-muted-foreground">
                          {formatPercent(realRoi, true)}
                        </span>
                      </div>
                    </td>

                    {/* USD Kuru */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-muted-foreground">
                      ₺{formatNumber(row.usdRate, 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between mt-4 px-2 sm:px-0">
          <div className="text-xs text-muted-foreground">
            {t('table.page')} <span className="font-semibold">{safePage}</span> {t('table.of')}{' '}
            <span className="font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
