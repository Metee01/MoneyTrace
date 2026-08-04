import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import trTranslations from "../locales/tr/translation.json"

const resources = {
  tr: {
    translation: trTranslations,
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "tr", // default language
    fallbackLng: "tr",
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })

export default i18n
