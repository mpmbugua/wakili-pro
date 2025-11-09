// i18n/index.ts - Internationalization setup for Wakili Pro

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en/common.json';
import swTranslations from './locales/sw/common.json';
import kikuyuTranslations from './locales/ki/common.json';
import luhyaTranslations from './locales/luy/common.json';
import luoTranslations from './locales/luo/common.json';

// Define available languages with native names
export const languages = {
  en: { name: 'English', nativeName: 'English' },
  sw: { name: 'Swahili', nativeName: 'Kiswahili' },
  ki: { name: 'Kikuyu', nativeName: 'Gĩkũyũ' },
  luy: { name: 'Luhya', nativeName: 'Luluhya' },
  luo: { name: 'Luo', nativeName: 'Dholuo' }
};

const resources = {
  en: { common: enTranslations },
  sw: { common: swTranslations },
  ki: { common: kikuyuTranslations },
  luy: { common: luhyaTranslations },
  luo: { common: luoTranslations }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    
    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'preferred-language',
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // RTL languages support
    supportedLngs: Object.keys(languages),
    
    // Load namespace on init
    ns: ['common'],
    
    // Key separator for nested translations
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',
  });

export default i18n;