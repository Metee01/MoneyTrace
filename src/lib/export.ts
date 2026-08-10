import type { ProjectionRow, ProjectionSummary } from "../types"

/**
 * Downloads a string as a CSV file.
 * UTF-8 BOM is added for Excel compatibility.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exports projection rows and summary data to a CSV file.
 */
export function exportToCsv(
  rows: ProjectionRow[],
  summary: ProjectionSummary,
  filename = "MoneyTrace_Projection.csv",
): void {
  const delimiter = ";"
  const lines: string[] = []

  // Metadata / Summary Header
  lines.push(`MoneyTrace - Portfolio Projection Export`)
  lines.push(`Exported At${delimiter}${new Date().toISOString()}`)
  lines.push("")

  // Table Headers
  const headers = [
    "Month",
    "Year Index",
    "Month in Year",
    "Monthly DCA",
    "Total Invested Capital",
    "Real Invested Capital",
    "Nominal Value",
    "Real Value (Today Money)",
    "Ref. Currency Value ($)",
    "Exchange Rate",
    "Nominal Profit/Loss",
    "Real Profit/Loss",
  ]
  lines.push(headers.join(delimiter))

  // Table Rows
  rows.forEach((r) => {
    const rowValues = [
      r.month,
      r.yearIndex,
      r.monthInYear,
      r.monthlyDca.toFixed(2),
      r.totalInvested.toFixed(2),
      r.realTotalInvested.toFixed(2),
      r.nominalValue.toFixed(2),
      r.realValue.toFixed(2),
      r.usdValue.toFixed(2),
      r.usdRate.toFixed(2),
      r.nominalProfit.toFixed(2),
      r.realProfit.toFixed(2),
    ]
    lines.push(rowValues.join(delimiter))
  })

  lines.push("")
  lines.push("--- SUMMARY ---")
  lines.push(`Total Duration (Months)${delimiter}${summary.totalMonths}`)
  lines.push(
    `Total Invested Capital${delimiter}${summary.totalInvested.toFixed(2)}`,
  )
  lines.push(
    `Real Invested Capital${delimiter}${summary.realTotalInvested.toFixed(2)}`,
  )
  lines.push(
    `Final Nominal Value${delimiter}${summary.finalNominalValue.toFixed(2)}`,
  )
  lines.push(`Final Real Value${delimiter}${summary.finalRealValue.toFixed(2)}`)
  lines.push(
    `Final Ref. Currency Value ($)${delimiter}${summary.finalUsdValue.toFixed(2)}`,
  )
  lines.push(
    `Total Nominal Profit/Loss${delimiter}${summary.totalNominalProfit.toFixed(2)}`,
  )
  lines.push(
    `Total Real Profit/Loss${delimiter}${summary.totalRealProfit.toFixed(2)}`,
  )
  lines.push(`Nominal ROI (%)${delimiter}${summary.nominalRoi.toFixed(2)}`)
  lines.push(`Real ROI (%)${delimiter}${summary.realRoi.toFixed(2)}`)
  lines.push(
    `Purchasing Power Loss Rate (%)${delimiter}${summary.purchasingPowerLossRate.toFixed(2)}`,
  )

  // UTF-8 BOM (\uFEFF) ensures Excel reads UTF-8 correctly
  const csvContent = "\uFEFF" + lines.join("\n")
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  })

  downloadBlob(blob, filename)
}

/**
 * Downloads object as a JSON file.
 */
export function exportToJson<T = unknown>(
  data: T,
  filename = "MoneyTrace_Data.json",
): void {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  })

  downloadBlob(blob, filename)
}

/**
 * Reads a JSON file selected by the user.
 */
export function importFromJson<T = unknown>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        resolve(parsed)
      } catch {
        reject(new Error("Invalid JSON file format."))
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading file."))
    }

    reader.readAsText(file)
  })
}
