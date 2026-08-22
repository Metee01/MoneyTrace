import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { useSettingsStore } from "../store/settings-store"
import trTranslations from "../locales/tr/translation.json"
import enTranslations from "../locales/en/translation.json"
import trLegalTranslations from "../locales/tr/legal.json"
import enLegalTranslations from "../locales/en/legal.json"

const resources = {
  en: {
    translation: { ...enTranslations, ...enLegalTranslations },
  },
  tr: {
    translation: { ...trTranslations, ...trLegalTranslations },
  },
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English (EN)",
  tr: "Türkçe (TR)",
}

export const SUPPORTED_LANGUAGES = Object.keys(resources).map((code) => ({
  code,
  label: LANGUAGE_LABELS[code] ?? code,
}))

// Settings store hydrates synchronously from localStorage, so the saved
// language is available before i18n initializes.
const savedLanguage = useSettingsStore.getState().language
const initialLanguage = SUPPORTED_LANGUAGES.some(
  (l) => l.code === savedLanguage,
)
  ? savedLanguage
  : "en"

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage, // restored from saved settings, default is English
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
})

export default i18n
