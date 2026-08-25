import { APP_CONFIG } from "../config"

const LOCALE_BY_LANGUAGE: Record<string, string> = {
  tr: "tr-TR",
  en: "en-US",
}

export function getFormattingLocale(language: string): string {
  const normalizedLanguage = language.toLowerCase().split("-")[0]
  return (
    LOCALE_BY_LANGUAGE[normalizedLanguage] ??
    LOCALE_BY_LANGUAGE[APP_CONFIG.app.defaultLanguage]
  )
}

export function getLanguageDisplayName(language: string): string {
  const normalizedLanguage = language.toLowerCase().split("-")[0]

  try {
    return (
      new Intl.DisplayNames(["en"], { type: "language" }).of(
        normalizedLanguage,
      ) ?? normalizedLanguage
    )
  } catch {
    return normalizedLanguage
  }
}
