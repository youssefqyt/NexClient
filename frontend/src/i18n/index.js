import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

const savedLanguage = localStorage.getItem('language') ?? 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/** Keep <html dir/lang> in sync for RTL languages. */
const applyDirection = (lng) => {
  const rtl = ['ar', 'he', 'fa'].includes(lng);
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

applyDirection(savedLanguage);
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  applyDirection(lng);
});

export default i18n;
