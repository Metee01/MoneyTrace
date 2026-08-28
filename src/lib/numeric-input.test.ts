/**
 * Numeric input parsing verification tests.
 * Run with: npx tsx src/lib/numeric-input.test.ts
 */

import {
  isAllowedNumericDraft,
  normalizeNumericValue,
  parseNumericDraft,
} from "./numeric-input"

console.log("Running numeric input tests...\n")

console.assert(isAllowedNumericDraft(""), "Empty draft should be allowed")
console.assert(isAllowedNumericDraft("-"), "Minus draft should be allowed")
console.assert(isAllowedNumericDraft("0."), "Trailing dot should be allowed")
console.assert(isAllowedNumericDraft("8,5"), "Decimal comma should be allowed")
console.assert(
  !isAllowedNumericDraft("8.5.1"),
  "Two separators must be rejected",
)
console.assert(!isAllowedNumericDraft("abc"), "Letters must be rejected")

console.assert(parseNumericDraft("") === null, "Empty draft is not a number")
console.assert(parseNumericDraft("-") === null, "Minus draft is not a number")
console.assert(
  parseNumericDraft(".") === null,
  "Separator draft is not a number",
)
console.assert(
  parseNumericDraft("0.") === 0,
  "Trailing dot should remain parseable",
)
console.assert(parseNumericDraft(".5") === 0.5, "Leading dot should parse")
console.assert(parseNumericDraft("0,5") === 0.5, "Decimal comma should parse")
console.assert(parseNumericDraft("08.50") === 8.5, "Leading zero should parse")
console.assert(
  parseNumericDraft("-0.5") === -0.5,
  "Negative decimal should parse",
)

console.assert(
  normalizeNumericValue(-2, { min: 0 }) === 0,
  "Minimum should be enforced",
)
console.assert(
  normalizeNumericValue(120, { max: 100 }) === 100,
  "Maximum should be enforced",
)
console.assert(
  normalizeNumericValue(10.9, { min: 1, max: 50, integer: true }) === 10,
  "Integer values should be floored",
)

console.log("All numeric input tests passed.")
