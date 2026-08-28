function extractContentText(content: unknown): string {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""

  return content
    .map((part) => {
      if (typeof part === "string") return part
      if (!part || typeof part !== "object") return ""

      const record = part as Record<string, unknown>
      if (typeof record.text === "string") return record.text
      return typeof record.content === "string" ? record.content : ""
    })
    .join("")
}

/** Extracts normalized text from OpenAI-compatible chat completion payloads. */
export function extractOpenAiResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return ""

  const choices = (payload as { choices?: unknown }).choices
  if (!Array.isArray(choices) || choices.length === 0) return ""

  const choice = choices[0]
  if (!choice || typeof choice !== "object") return ""

  const record = choice as Record<string, unknown>
  const message = record.message
  if (message && typeof message === "object") {
    const text = extractContentText(
      (message as Record<string, unknown>).content,
    )
    if (text) return text
  }

  return typeof record.text === "string" ? record.text : ""
}
