import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { usePortfolioStore, useSettingsStore } from "../../store"
import { calculateProjection } from "../../engine"
import {
  formatLocalCurrency,
  formatUSD,
  formatNumber,
} from "../../lib/formatters"
import { exportToCsv } from "../../lib/export"

export const ProjectionTable: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { currentParams } = usePortfolioStore()
  const { currencyCode } = useSettingsStore()

  const [filterMode, setFilterMode] = useState<"all" | "yearly">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  const locale = i18n.language === "tr" ? "tr-TR" : "en-US"

  const projectionResult = useMemo(() => {
    return calculateProjection(currentParams)
  }, [currentParams])

  // Filter & Search Logic
  const filteredRows = useMemo(() => {
    let rows = projectionResult.rows

    if (filterMode === "yearly") {
      rows = rows.filter((r) => r.monthInYear === 12)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.month.toString().includes(term) ||
          r.yearIndex.toString().includes(term),
      )
    }

    return rows
  }, [projectionResult.rows, filterMode, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage, pageSize])

  const handleExportCsv = () => {
    exportToCsv(
      projectionResult.rows,
      projectionResult.summary,
      "MoneyTrace_Projection.csv",
    )
  }

  return (
    <Card className="w-full shadow-sm border border-border bg-card">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {t("projection.tableTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("table.totalRows", { count: filteredRows.length })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Toggle (All / Yearly) */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
              <Button
                variant={filterMode === "all" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => {
                  setFilterMode("all")
                  setCurrentPage(1)
                }}
              >
                {t("table.allMonths")}
              </Button>
              <Button
                variant={filterMode === "yearly" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => {
                  setFilterMode("yearly")
                  setCurrentPage(1)
                }}
              >
                {t("table.yearlySummary")}
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative w-32 sm:w-40">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("table.searchMonth")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-7 text-xs pl-8 py-0"
              />
            </div>

            {/* CSV Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-7 text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {t("projection.exportCsv")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3">{t("table.monthCol")}</th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.monthlyDcaCol")}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.totalInvestedCol")}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.nominalValueCol")}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.nominalProfitCol")}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.realValueCol")}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.realProfitCol")}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.safeWithdrawalCol")}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.usdValueCol")}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {t("table.usdRateCol")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => {
                  const isNominalProfitPos = row.nominalProfit >= 0
                  const isRealProfitPos = row.realProfit >= 0
                  return (
                    <tr
                      key={row.month}
                      className="hover:bg-muted/30 transition-colors font-mono"
                    >
                      <td className="py-2 px-3 font-sans font-medium text-foreground">
                        {row.yearIndex}Y {row.monthInYear}M{" "}
                        <span className="text-muted-foreground text-[10px]">
                          (#{row.month})
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {formatLocalCurrency(
                          row.monthlyDca,
                          currencyCode,
                          locale,
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {formatLocalCurrency(
                          row.totalInvested,
                          currencyCode,
                          locale,
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-blue-600 dark:text-blue-400">
                        {formatLocalCurrency(
                          row.nominalValue,
                          currencyCode,
                          locale,
                        )}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-medium ${
                          isNominalProfitPos
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isNominalProfitPos ? (
                            <TrendingUp className="w-3 h-3 text-blue-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-rose-500" />
                          )}
                          {formatLocalCurrency(
                            row.nominalProfit,
                            currencyCode,
                            locale,
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatLocalCurrency(
                          row.realValue,
                          currencyCode,
                          locale,
                        )}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-medium ${
                          isRealProfitPos
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isRealProfitPos ? (
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-rose-500" />
                          )}
                          {formatLocalCurrency(
                            row.realProfit,
                            currencyCode,
                            locale,
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-cyan-600 dark:text-cyan-400">
                        {formatLocalCurrency(
                          row.safeWithdrawal,
                          currencyCode,
                          locale,
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">
                        {formatUSD(row.usdValue)}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {formatNumber(row.usdRate, 2, locale)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="py-6 text-center text-muted-foreground font-sans"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{t("table.rowsPerPage")}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="bg-muted border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={60}>60</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span>
              {t("table.page")} {currentPage} {t("table.of")} {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
