const PARTIAL_NUMBER_PATTERN = /^-?(?:\d*(?:[.,]\d*)?)?$/
const COMPLETE_NUMBER_PATTERN = /^-?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/

export interface NormalizeNumericValueOptions {
  min?: number
  max?: number
  integer?: boolean
}

export function isAllowedNumericDraft(value: string): boolean {
  return PARTIAL_NUMBER_PATTERN.test(value)
}

export function parseNumericDraft(value: string): number | null {
  if (!COMPLETE_NUMBER_PATTERN.test(value)) return null

  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeNumericValue(
  value: number,
  { min, max, integer = false }: NormalizeNumericValueOptions = {},
): number {
  let normalized = integer ? Math.floor(value) : value

  if (min !== undefined) normalized = Math.max(min, normalized)
  if (max !== undefined) normalized = Math.min(max, normalized)

  return normalized
}
