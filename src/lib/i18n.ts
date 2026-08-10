import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import trTranslations from '../locales/tr/translation.json';
import enTranslations from '../locales/en/translation.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  tr: {
    translation: trTranslations,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default language set to English
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
});

export default i18n;
