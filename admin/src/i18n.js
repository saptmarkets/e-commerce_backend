import i18n from "i18next";
import Cookies from "js-cookie";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "@/utils/translation/en.json";
import ar from "@/utils/translation/ar.json";

// Get default language from global settings or fallback to 'en'
const defaultLanguage = Cookies.get("i18next") || "en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    debug: true,
    fallbackLng: defaultLanguage,
    // lag: "en",
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      //order: ['path', 'cookie', 'htmlTag'],
      caches: ["cookie"],
    },
  });
