import * as React from "react"

import {
  isAllowedNumericDraft,
  normalizeNumericValue,
  parseNumericDraft,
} from "@/lib/numeric-input"
import { Input } from "@/components/ui/input"

interface NumericInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange" | "onBlur" | "inputMode"
> {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  integer?: boolean
}

function NumericInput({
  value,
  onValueChange,
  min,
  max,
  integer = false,
  onFocus,
  ...props
}: NumericInputProps) {
  const [draft, setDraft] = React.useState(() => String(value))
  const isEditing = React.useRef(false)

  React.useEffect(() => {
    if (!isEditing.current) setDraft(String(value))
  }, [value])

  const normalize = (nextValue: number) =>
    normalizeNumericValue(nextValue, { min, max, integer })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDraft = event.target.value
    if (!isAllowedNumericDraft(nextDraft)) return

    setDraft(nextDraft)

    const parsed = parseNumericDraft(nextDraft)
    if (parsed !== null) onValueChange(normalize(parsed))
  }

  const handleBlur = () => {
    isEditing.current = false
    const parsed = parseNumericDraft(draft)

    if (parsed === null) {
      setDraft(String(value))
      return
    }

    const normalized = normalize(parsed)
    setDraft(String(normalized))
    onValueChange(normalized)
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      value={draft}
      onChange={handleChange}
      onFocus={(event) => {
        isEditing.current = true
        onFocus?.(event)
      }}
      onBlur={handleBlur}
    />
  )
}

export { NumericInput }
