import React, { useMemo } from 'react';
import {
  Wallet,
  ShieldCheck,
  DollarSign,
  Coins,
  TrendingUp,
  TrendingDown,
  Flame,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { usePortfolioStore } from '../../store';
import { calculateProjection } from '../../engine';
import { formatTL, formatUSD, formatPercent, formatNumber } from '../../lib/formatters';

export const ProjectionSummaryCards: React.FC = () => {
  const { currentParams } = usePortfolioStore();

  const projectionResult = useMemo(() => {
    return calculateProjection(currentParams);
  }, [currentParams]);

  const { summary } = projectionResult;

  const isRealProfitPositive = summary.totalRealProfit >= 0;
  const isNominalProfitPositive = summary.totalNominalProfit >= 0;

  const cardsData = [
    {
      id: 'nominal',
      title: 'Nominal Portföy Değeri',
      value: formatTL(summary.finalNominalValue),
      subtext: `Nominal Getiri: ${formatPercent(summary.nominalRoi, true)}`,
      badgeColor: isNominalProfitPositive
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      icon: Wallet,
      iconColor: 'text-blue-500',
    },
    {
      id: 'real',
      title: 'Reel Satın Alma Gücü',
      value: formatTL(summary.finalRealValue),
      subtext: `Reel Getiri: ${formatPercent(summary.realRoi, true)}`,
      badgeColor: isRealProfitPositive
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      icon: ShieldCheck,
      iconColor: isRealProfitPositive ? 'text-emerald-500' : 'text-rose-500',
    },
    {
      id: 'usd',
      title: 'Dolar Bakiye ($)',
      value: formatUSD(summary.finalUsdValue),
      subtext: `Tahmini Kur: ₺${formatNumber(summary.finalUsdRate, 2)}`,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      icon: DollarSign,
      iconColor: 'text-amber-500',
    },
    {
      id: 'invested',
      title: 'Yatırılan Anapara',
      value: formatTL(summary.totalInvested),
      subtext: `Reel Karşılığı: ${formatTL(summary.realTotalInvested)}`,
      badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
      icon: Coins,
      iconColor: 'text-slate-500',
    },
    {
      id: 'realProfit',
      title: 'Net Reel Kar / Zarar',
      value: formatTL(summary.totalRealProfit),
      subtext: `Nominal Kar: ${formatTL(summary.totalNominalProfit)}`,
      badgeColor: isRealProfitPositive
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      icon: isRealProfitPositive ? TrendingUp : TrendingDown,
      iconColor: isRealProfitPositive ? 'text-emerald-500' : 'text-rose-500',
      valueColor: isRealProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'inflationLoss',
      title: 'Enflasyon Değer Kaybı',
      value: `%${formatNumber(summary.purchasingPowerLossRate, 1)}`,
      subtext: 'Satın Alma Gücü Erimesi',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      icon: Flame,
      iconColor: 'text-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cardsData.map((card) => {
        const IconComponent = card.icon;

        return (
          <Card
            key={card.id}
            className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg bg-muted ${card.iconColor}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div
                  className={`text-xl font-bold tracking-tight ${
                    card.valueColor || 'text-foreground'
                  }`}
                >
                  {card.value}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${card.badgeColor}`}
                  >
                    {card.subtext}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
